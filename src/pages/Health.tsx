import { useMemo, useState } from 'react'
import {
  Scale,
  Syringe,
  Bug,
  Stethoscope,
  Download,
  Plus,
  FileText,
  Copy,
  ShieldCheck,
  TrendingUp,
  CalendarDays,
  Paperclip,
  BellRing,
  CheckCircle2,
  Clock3,
} from 'lucide-react'
import { useApp } from '../store'
import { api } from '../lib/api'
import { Avatar, EmptyState, ErrorState, EventIcon, Sheet, Stat } from '../components/ui'
import { WeightChart } from '../components/WeightChart'
import { addDays, daysBetween, fmtDate, fmtDateFull, fmtWeight, relDay, signed, todayISO } from '../lib/format'
import { latestWeight, nextReminder, petEvents, vaccineProgress, weightChange, weightSeries } from '../lib/health'
import type { CareEvent } from '../types'

export function Health() {
  const { db, pet, toast, loading, openRecord } = useApp()
  const [exportOpen, setExportOpen] = useState(false)
  const [summary, setSummary] = useState('')
  const [exportError, setExportError] = useState('')

  const events = useMemo(() => petEvents(db, pet?.id), [db, pet?.id])

  if (loading || !db || !pet) {
    return (
      <div className="content">
        <div className="skeleton" style={{ height: 40, width: 160, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 220, borderRadius: 8 }} />
      </div>
    )
  }

  const weights = weightSeries(events)
  const latest = latestWeight(events)
  const change30 = weightChange(events, 30)
  const change90 = weightChange(events, 90)
  const vaccine = vaccineProgress(events, pet)
  const vaccines = events.filter((e) => e.type === 'vaccine')
  const deworms = events.filter((e) => e.type === 'deworm')
  const visits = events.filter((e) => e.type === 'visit')
  const attachments = events.filter((e) => e.photo)
  const reminders = db.reminders.filter((r) => r.petId === pet.id)
  const dewormNext = nextReminder(db, pet.id, 'deworm')
  const vaccineNext = nextReminder(db, pet.id, 'vaccine')

  const trendNote =
    change90 !== undefined && Math.abs(change90) >= 0.5
      ? `近 3 个月体重${change90 > 0 ? '上升' : '下降'} ${Math.abs(change90).toFixed(1)} kg，趋势值得关注，建议下次就诊时和兽医确认。`
      : '目前体重变化平缓，保持现在的记录节奏即可。'

  const openExport = () => {
    try {
      const text = api.exportSummary(pet.id, 180)
      setSummary(text)
      setExportError('')
    } catch (err) {
      setSummary('')
      setExportError(err instanceof Error ? err.message : '导出失败')
    }
    setExportOpen(true)
  }

  const download = () => {
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pet.name}-健康摘要-${todayISO()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast('摘要已下载，可直接发给医院', 'success')
  }

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">健康</h1>
          <div className="page-sub">{pet.name} 的体重、疫苗、驱虫与就诊记录</div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn-sm" onClick={openExport}>
            <Download size={14} /> 导出摘要
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => openRecord('weight')}>
            <Plus size={14} /> 记录
          </button>
        </div>
      </div>

      <div className="cols">
        <div className="stack">
          {/* 体重趋势 */}
          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <Scale size={16} /> 体重趋势
              </div>
              <span className="card-hint num">共 {weights.length} 次记录</span>
            </div>
            {weights.length === 0 ? (
              <EmptyState
                icon={<Scale size={20} />}
                title="还没有体重数据"
                text="记录两次以上就能看到趋势线。"
                action={
                  <button className="btn btn-sm btn-primary" onClick={() => openRecord('weight')}>
                    记录体重
                  </button>
                }
              />
            ) : (
              <>
                <div className="row-between" style={{ marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px' }}>
                      {latest?.weight.toFixed(1)}
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#6d7d77' }}> kg</span>
                    </span>
                    {change30 !== undefined && (
                      <span className={`badge ${Math.abs(change30) >= 0.5 ? 'badge-coral' : 'badge-brand'}`}>
                        <TrendingUp size={11} /> 近 30 天 {signed(change30)}
                      </span>
                    )}
                  </div>
                  <span className="tiny muted num">最近记录 {fmtDate(latest?.date)}</span>
                </div>
                <WeightChart data={weights} height={196} />
                <div className="notice warm" style={{ marginTop: 10 }}>
                  <TrendingUp size={14} style={{ flex: 'none', marginTop: 2 }} />
                  <span>{trendNote} 爪迹只呈现记录趋势，不做诊断。</span>
                </div>
                <div className="stat-row" style={{ marginTop: 10 }}>
                  <Stat label="最新" value={latest ? latest.weight.toFixed(1) : '—'} unit="kg" />
                  <Stat label="近 30 天" value={change30 !== undefined ? signed(change30) : '—'} />
                  <Stat label="近 90 天" value={change90 !== undefined ? signed(change90) : '—'} />
                </div>
              </>
            )}
          </section>

          {/* 疫苗 */}
          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <Syringe size={16} /> 疫苗
              </div>
              <button className="btn btn-sm btn-soft" onClick={() => openRecord('vaccine')}>
                <Plus size={13} /> 记录接种
              </button>
            </div>
            <div className="row-between" style={{ marginBottom: 6 }}>
              <span className="small muted">基础免疫完成进度</span>
              <span className="small num" style={{ fontWeight: 600 }}>
                {vaccine.done}/{vaccine.total}
              </span>
            </div>
            <div className="progress">
              <span style={{ width: `${(vaccine.done / vaccine.total) * 100}%` }} />
            </div>
            <div className="divider" />
            {vaccines.length === 0 ? (
              <div className="small muted">还没有疫苗记录。接种后记一笔，下次加强就不用靠记忆了。</div>
            ) : (
              <div className="stack" style={{ gap: 0 }}>
                {vaccines.map((v) => (
                  <div key={v.id} className="task-row">
                    <div className="task-icon">
                      <Syringe size={15} />
                    </div>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="task-title truncate">{v.vaccineName ?? v.title}</div>
                      <div className="task-meta num">
                        {fmtDateFull(v.date)}
                        {v.hospital ? ` · ${v.hospital}` : ''}
                      </div>
                    </div>
                    <span className="badge badge-brand">已完成</span>
                  </div>
                ))}
              </div>
            )}
            <div className="row-between" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--line)' }}>
              <div className="small">
                <span className="muted">下次提醒：</span>
                {vaccineNext ? <span className="num">{fmtDateFull(vaccineNext.dueDate)}（{relDay(vaccineNext.dueDate)}）</span> : <span className="muted">未设置</span>}
              </div>
              <button
                className="btn btn-sm"
                onClick={async () => {
                  if (vaccineNext) {
                    await api.snoozeReminder(vaccineNext.id, 30)
                    toast('已把疫苗提醒推迟 30 天', 'success')
                  } else {
                    const last = vaccines[0]
                    await api.addReminder({
                      petId: pet.id,
                      kind: 'vaccine',
                      title: '疫苗年度加强',
                      dueDate: addDays(last?.date ?? todayISO(), 365),
                    })
                    toast('已按上次接种日设置一年后的提醒', 'success')
                  }
                }}
              >
                <BellRing size={13} /> {vaccineNext ? '推迟 30 天' : '设置提醒'}
              </button>
            </div>
          </section>

          {/* 驱虫 */}
          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <Bug size={16} /> 驱虫日历
              </div>
              <button className="btn btn-sm btn-soft" onClick={() => openRecord('deworm')}>
                <Plus size={13} /> 记录驱虫
              </button>
            </div>
            <DewormCalendar events={deworms} dueDate={dewormNext?.dueDate} />
            <div className="divider" />
            <div className="stack" style={{ gap: 0 }}>
              {dewormNext && (
                <div className="task-row">
                  <div className={`task-icon${daysBetween(todayISO(), dewormNext.dueDate) < 0 ? ' warn' : ''}`}>
                    <BellRing size={15} />
                  </div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="task-title truncate">下次驱虫 · {dewormNext.title}</div>
                    <div className="task-meta num">{fmtDateFull(dewormNext.dueDate)} · {relDay(dewormNext.dueDate)}</div>
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={async () => {
                      await api.completeReminder(dewormNext.id)
                      toast('已标记完成，记得补一条驱虫记录', 'success')
                    }}
                  >
                    已完成
                  </button>
                </div>
              )}
              {deworms.slice(0, 3).map((d) => (
                <div key={d.id} className="task-row">
                  <div className="task-icon">
                    <Bug size={15} />
                  </div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="task-title truncate">
                      {d.dewormKind === 'inner' ? '体内驱虫' : d.dewormKind === 'outer' ? '体外驱虫' : '体内外同驱'}
                      {d.medicine ? ` · ${d.medicine}` : ''}
                    </div>
                    <div className="task-meta num">{fmtDateFull(d.date)}</div>
                  </div>
                  <span className="badge badge-gray">已记录</span>
                </div>
              ))}
              {deworms.length === 0 && <div className="small muted">还没有驱虫记录。</div>}
            </div>
          </section>

          {/* 就诊与用药 */}
          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <Stethoscope size={16} /> 就诊与用药
              </div>
              <button className="btn btn-sm btn-soft" onClick={() => openRecord('visit')}>
                <Plus size={13} /> 记录就诊
              </button>
            </div>
            {visits.length === 0 ? (
              <EmptyState icon={<Stethoscope size={20} />} title="没有就诊记录" text="希望一直用不上，需要时再记。" />
            ) : (
              <div className="stack" style={{ gap: 10 }}>
                {visits.map((v) => (
                  <div key={v.id} className="card" style={{ boxShadow: 'none', background: '#fbfdfc' }}>
                    <div className="row-between">
                      <div className="row" style={{ gap: 6, minWidth: 0 }}>
                        <span className="badge badge-coral">就诊</span>
                        <span className="truncate" style={{ fontSize: 13.5, fontWeight: 600 }}>{v.reason ?? v.title}</span>
                      </div>
                      <span className="tl-date num">{fmtDate(v.date)}</span>
                    </div>
                    <dl className="kv" style={{ marginTop: 8 }}>
                      <dt>医院</dt>
                      <dd>{v.hospital ?? '未填写'}</dd>
                      <dt>医生记录</dt>
                      <dd>{v.diagnosis ?? '未填写'}</dd>
                      <dt>用药</dt>
                      <dd>{v.medicine ?? '未填写'}</dd>
                      <dt>费用</dt>
                      <dd className="num">{v.cost ? `¥${v.cost}` : '未填写'}</dd>
                    </dl>
                    {v.photo && (
                      <img src={v.photo} alt="病历附件" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6, marginTop: 8 }} />
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="tiny muted" style={{ marginTop: 10 }}>
              以上为就诊记录摘录，不构成诊断结论。
            </div>
          </section>

          {/* 附件 */}
          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <Paperclip size={16} /> 健康附件
              </div>
              <span className="card-hint num">{attachments.length} 个</span>
            </div>
            {attachments.length === 0 ? (
              <div className="small muted">疫苗凭证、检查单可以拍照存到这里，看诊时直接翻出来。</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 6 }}>
                {attachments.map((a) => (
                  <div key={a.id}>
                    <img
                      src={a.photo}
                      alt={a.title}
                      style={{ width: '100%', height: 82, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8e5' }}
                      loading="lazy"
                    />
                    <div className="tiny muted truncate" style={{ marginTop: 3 }}>{a.title}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="side-col stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <BellRing size={16} /> 提醒清单
              </div>
              <span className="card-hint">{reminders.filter((r) => !r.done).length} 项未完成</span>
            </div>
            {reminders.length === 0 ? (
              <div className="small muted">还没有提醒。记录疫苗或驱虫后会自动询问是否设置。</div>
            ) : (
              <div className="stack" style={{ gap: 0 }}>
                {reminders.map((r) => (
                  <div key={r.id} className="task-row">
                    <div className={`task-icon${r.done ? '' : daysBetween(todayISO(), r.dueDate) < 0 ? ' warn' : ''}`}>
                      <EventIcon type={r.kind === 'weight' ? 'weight' : r.kind === 'vaccine' ? 'vaccine' : r.kind === 'deworm' ? 'deworm' : 'visit'} size={14} />
                    </div>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="task-title truncate" style={{ textDecoration: r.done ? 'line-through' : 'none', color: r.done ? '#6d7d77' : undefined }}>
                        {r.title}
                      </div>
                      <div className="task-meta num">{fmtDate(r.dueDate)} · {r.done ? '已完成' : relDay(r.dueDate)}</div>
                    </div>
                    {!r.done && (
                      <button
                        className="btn-icon bordered"
                        aria-label="标记完成"
                        onClick={async () => {
                          await api.completeReminder(r.id)
                          toast('提醒已完成', 'success')
                        }}
                      >
                        <CheckCircle2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>
              <FileText size={16} /> 看诊摘要
            </div>
            <div className="small muted" style={{ lineHeight: 1.7 }}>
              一键整理近半年体重、疫苗、驱虫和就诊记录，复制或下载后可以直接给医生看。
            </div>
            <button className="btn btn-primary btn-block btn-sm" style={{ marginTop: 10 }} onClick={openExport}>
              <Download size={13} /> 导出近半年档案
            </button>
          </section>

          <section className="card" style={{ background: '#fbf7f1', borderColor: '#efe6da' }}>
            <div className="row" style={{ gap: 6, fontSize: 13, fontWeight: 600, color: '#6b5330' }}>
              <ShieldCheck size={15} /> 我们不做的事
            </div>
            <ul className="small" style={{ color: '#6b5330', marginTop: 6, lineHeight: 1.8, paddingLeft: 2 }}>
              <li>· 不判断疾病，也不给治疗方案</li>
              <li>· 不根据健康数据做广告画像</li>
              <li>· 不自动公开你的档案</li>
            </ul>
          </section>
        </aside>
      </div>

      <Sheet
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="看诊摘要"
        subtitle={`${pet.name} · 近 180 天`}
        footer={
          <>
            <button className="btn" onClick={() => setExportOpen(false)}>
              关闭
            </button>
            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(summary)
                  toast('摘要已复制到剪贴板', 'success')
                } catch {
                  toast('浏览器不允许复制，可以下载文件', 'error')
                }
              }}
              disabled={!summary}
            >
              <Copy size={14} /> 复制
            </button>
            <button className="btn btn-soft" onClick={download} disabled={!summary}>
              <Download size={14} /> 下载
            </button>
          </>
        }
      >
        {exportError ? (
          <ErrorState
            title="暂时无法生成摘要"
            text={exportError}
            onRetry={() => {
              setExportOpen(false)
              setTimeout(openExport, 60)
            }}
          />
        ) : (
          <>
            <div className="notice" style={{ marginBottom: 10 }}>
              <CheckCircle2 size={14} style={{ flex: 'none', marginTop: 2 }} />
              <span>摘要只包含你自己的记录，不会上传到任何公开位置。</span>
            </div>
            <pre
              className="small"
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: '#f7faf9',
                border: '1px solid #e2e8e5',
                borderRadius: 6,
                padding: 12,
                margin: 0,
                lineHeight: 1.7,
                fontFamily: 'inherit',
              }}
            >
              {summary}
            </pre>
          </>
        )}
      </Sheet>
    </div>
  )
}

function DewormCalendar({ events, dueDate }: { events: CareEvent[]; dueDate?: string }) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const marked = new Set(events.filter((e) => e.date.slice(0, 7) === todayISO().slice(0, 7)).map((e) => Number(e.date.slice(8, 10))))
  const dueDay = dueDate && dueDate.slice(0, 7) === todayISO().slice(0, 7) ? Number(dueDate.slice(8, 10)) : null
  const todayDay = now.getDate()

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 6 }}>
        <span className="small" style={{ fontWeight: 600 }}>
          <CalendarDays size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
          {year} 年 {month + 1} 月
        </span>
        <span className="tiny muted">
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 3, background: '#0e6b5c', marginRight: 3 }} />
          已记录
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 3, background: '#d96340', margin: '0 3px 0 8px' }} />
          下次
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, fontSize: 11 }}>
        {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
          <div key={d} style={{ textAlign: 'center', color: '#6d7d77', paddingBottom: 2 }}>{d}</div>
        ))}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`b${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isToday = day === todayDay
          const isMarked = marked.has(day)
          const isDue = dueDay === day
          return (
            <div
              key={day}
              style={{
                height: 28,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 5,
                border: isToday ? '1px solid #0e6b5c' : '1px solid transparent',
                background: isDue ? '#fceee8' : isMarked ? '#eaf4f1' : 'transparent',
                color: isDue ? '#bd4f2f' : '#16211d',
                fontWeight: isDue || isMarked ? 600 : 400,
                position: 'relative',
                fontVariantNumeric: 'tabular-nums',
              }}
              title={isDue ? '下次驱虫' : isMarked ? '已驱虫' : undefined}
            >
              {day}
            </div>
          )
        })}
      </div>
      <div className="tiny muted" style={{ marginTop: 6 }}>
        日历只显示你记录过的驱虫日期与下一次提醒。
      </div>
    </div>
  )
}
