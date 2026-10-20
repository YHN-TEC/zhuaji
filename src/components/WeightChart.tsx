import { useEffect, useRef, useState } from 'react'
import { fmtDate } from '../lib/format'

export interface WeightPoint {
  date: string
  weight: number
}

export function WeightChart({ data, height = 176 }: { data: WeightPoint[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(Math.floor(e.contentRect.width))
    })
    ro.observe(el)
    setW(Math.floor(el.getBoundingClientRect().width))
    return () => ro.disconnect()
  }, [])

  if (!data.length) return null

  if (data.length === 1) {
    return (
      <div className="chart-empty" ref={ref}>
        <div className="num" style={{ fontSize: 24, fontWeight: 600, color: '#16211d' }}>
          {data[0].weight.toFixed(1)}
          <span style={{ fontSize: 12, fontWeight: 500, color: '#6d7d77' }}> kg</span>
        </div>
        <div className="tiny">这是第一条体重记录，再记一次就能看到趋势线</div>
        <div className="tiny muted">上次记录 {fmtDate(data[0].date)}</div>
      </div>
    )
  }

  const padL = 36
  const padR = 14
  const padT = 16
  const padB = 26
  const innerW = Math.max(w - padL - padR, 10)
  const innerH = height - padT - padB

  const values = data.map((d) => d.weight)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const span = Math.max(rawMax - rawMin, 0.6)
  const min = Math.max(0, rawMin - span * 0.35)
  const max = rawMax + span * 0.35

  const x = (i: number) => padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
  const y = (v: number) => padT + innerH - ((v - min) / (max - min)) * innerH

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.weight).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1).toFixed(1)},${(padT + innerH).toFixed(1)} L${x(0).toFixed(1)},${(
    padT + innerH
  ).toFixed(1)} Z`

  const ticks = [0, 0.5, 1].map((t) => min + (max - min) * t)
  const last = data[data.length - 1]

  return (
    <div className="chart-wrap" ref={ref}>
      {w > 0 && (
        <svg
          className="chart-svg"
          width={w}
          height={height}
          viewBox={`0 0 ${w} ${height}`}
          role="img"
          aria-label={`体重趋势，从 ${data[0].weight} 公斤到 ${last.weight} 公斤`}
        >
          <defs>
            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16806d" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#16806d" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {ticks.map((t, i) => (
            <g key={i}>
              <line
                x1={padL}
                x2={w - padR}
                y1={y(t)}
                y2={y(t)}
                stroke="#e6edea"
                strokeWidth="1"
                strokeDasharray={i === 0 ? '0' : '3 4'}
              />
              <text x={padL - 7} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#8b9993">
                {t.toFixed(1)}
              </text>
            </g>
          ))}
          <path d={area} fill="url(#wg)" />
          <path d={line} fill="none" stroke="#0e6b5c" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) => (
            <circle
              key={d.date + i}
              cx={x(i)}
              cy={y(d.weight)}
              r={i === data.length - 1 ? 4.5 : 3}
              fill={i === data.length - 1 ? '#0e6b5c' : '#ffffff'}
              stroke="#0e6b5c"
              strokeWidth="1.8"
            />
          ))}
          <text x={x(0)} y={height - 6} textAnchor="start" fontSize="10" fill="#8b9993">
            {fmtDate(data[0].date)}
          </text>
          {data.length > 2 && (
            <text x={x(Math.floor((data.length - 1) / 2))} y={height - 6} textAnchor="middle" fontSize="10" fill="#8b9993">
              {fmtDate(data[Math.floor((data.length - 1) / 2)].date)}
            </text>
          )}
          <text x={w - padR} y={height - 6} textAnchor="end" fontSize="10" fill="#8b9993">
            {fmtDate(last.date)}
          </text>
          <text
            x={Math.min(x(data.length - 1), w - padR - 8)}
            y={Math.max(y(last.weight) - 10, 11)}
            textAnchor="end"
            fontSize="11"
            fontWeight="600"
            fill="#0e6b5c"
          >
            {last.weight.toFixed(1)} kg
          </text>
        </svg>
      )}
    </div>
  )
}
