export const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)

export function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayISO() {
  return toISO(new Date())
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function addMonths(iso: string, months: number) {
  const d = new Date(`${iso}T00:00:00`)
  d.setMonth(d.getMonth() + months)
  return toISO(d)
}

export function parseISO(iso: string) {
  return new Date(`${iso}T00:00:00`)
}

export function daysBetween(from: string, to: string) {
  const a = parseISO(from).getTime()
  const b = parseISO(to).getTime()
  return Math.round((b - a) / 86400000)
}

/** 10月18日 */
export function fmtDate(iso?: string) {
  if (!iso) return '未填写'
  const d = parseISO(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/** 2026年10月18日 */
export function fmtDateFull(iso?: string) {
  if (!iso) return '未填写'
  const d = parseISO(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

/** 相对今天：今天 / 明天 / 3 天后 / 逾期 2 天 / 5 个月后 */
export function relDay(iso: string) {
  const diff = daysBetween(todayISO(), iso)
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === 2) return '后天'
  if (diff > 0) {
    if (diff >= 60) return `约 ${Math.round(diff / 30)} 个月后`
    return `${diff} 天后`
  }
  if (diff === -1) return '逾期 1 天'
  return `逾期 ${Math.abs(diff)} 天`
}

export function isOverdue(iso: string) {
  return daysBetween(todayISO(), iso) < 0
}

/** 2 岁 3 个月 / 8 个月 / 12 天 */
export function ageText(iso?: string) {
  if (!iso) return '年龄未填写'
  const days = daysBetween(iso, todayISO())
  if (days < 0) return '日期在未来'
  const months = Math.floor(days / 30.44)
  if (months < 1) return `${days} 天`
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m} 个月`
  return m === 0 ? `${y} 岁` : `${y} 岁 ${m} 个月`
}

export function fmtWeight(n?: number) {
  if (n === undefined || n === null) return '—'
  return `${n.toFixed(1)} kg`
}

export function signed(n: number, unit = 'kg') {
  const v = Number(n.toFixed(1))
  if (v === 0) return `持平 0.0 ${unit}`
  return `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)} ${unit}`
}

export function fmtTimeAgo(iso: string) {
  const t = new Date(iso).getTime()
  const diffMin = Math.round((Date.now() - t) / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const h = Math.round(diffMin / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.round(h / 24)
  if (d < 30) return `${d} 天前`
  return fmtDate(iso.slice(0, 10))
}

export function monthKey(iso: string) {
  return iso.slice(0, 7)
}

export function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return `${y} 年 ${Number(m)} 月`
}
