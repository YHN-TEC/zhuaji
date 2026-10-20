import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Share2,
  Trash2,
  Plus,
  Camera,
  Cake,
  CalendarRange,
  Sparkles,
  Copy,
  Send,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react'
import { useApp } from '../store'
import { api } from '../lib/api'
import { Avatar, ConfirmSheet, EmptyState, EventIcon, ListSkeleton, Sheet, eventMeta } from '../components/ui'
import { fmtDate, fmtDateFull, fmtTimeAgo, monthLabel, signed, todayISO } from '../lib/format'
import { petEvents, weightChange, weightSeries } from '../lib/health'
import type { CareEvent, CareEventType } from '../types'

const filters: { key: 'all' | CareEventType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'weight', label: '体重' },
  { key: 'vaccine', label: '疫苗' },
  { key: 'deworm', label: '驱虫' },
  { key: 'visit', label: '就诊' },
  { key: 'photo', label: '照片' },
  { key: 'daily', label: '日常' },
]

export function Timeline() {
  const { db, pet, openShare, openRecord, toast, loading } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | CareEventType>('all')
  const [review, setReview] = useState<null | 'month' | 'year' | 'birthday'>(null)
  const [toDelete, setToDelete] = useState<CareEvent | null>(null)

  const events = useMemo(() => petEvents(db, pet?.id), [db, pet?.id])
  const filtered = filter === 'all' ? events : events.filter((e) => e.type === filter)

  const grouped = useMemo(() => {
    const map = new Map<string, CareEvent[]>()
    filtered.forEach((e) => {
      const k = e.date.slice(0, 7)
      map.set(k, [...(map.get(k) ?? []), e])
    })
    return [...map.entries()]
  }, [filtered])

  if (loading || !db || !pet) {
    return (
      <div className="content">
        <div className="skeleton" style={{ height: 40, borderRadius: 8, marginBottom: 14 }} />
        <ListSkeleton rows={3} />
      </div>
    )
  }

  const counts = (k: 'all' | CareEventType) => (k === 'all' ? events.length : events.filter((e) => e.type === k).length)

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">时间线</h1>
          <div className="page-sub">
            {pet.name} 的成长记录 · 共 {events.length} 条
          </div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn-sm" onClick={() => setReview('month')}>
            <Sparkles size={14} /> 成长卡
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => openRecord('weight')}>
            <Plus size={14} /> 记录
          </button>
        </div>
      </div>

      <div className="cols">
        <div className="stack">
          <div className="card" style={{ padding: '10px 12px' }}>
            <div className="chip-row">
              {filters.map((f) => (
                <button key={f.key} className={`chip${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
                  {f.label}
                  <span className="tiny num" style={{ opacity: 0.65 }}>{counts(f.key)}</span>
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={filter === 'all' ? <Sparkles size={20} /> : <SlidersHorizontal size={20} />}
                title={filter === 'all' ? `${pet.name} 的档案刚刚开始` : `还没有「${eventMeta[filter as CareEventType].label}」记录`}
                text={
                  filter === 'all'
                    ? '记录今天的样子或当前体重，时间线就会从这里长出来。'
                    : '换一个筛选看看，或者现在补一条记录。'
                }
                action={
                  <div className="row" style={{ justifyContent: 'center' }}>
                    <button className="btn btn-sm btn-primary" onClick={() => openRecord(filter === 'all' ? 'weight' : (filter as CareEventType))}>
                      现在记录
                    </button>
                    {filter !== 'all' && (
                      <button className="btn btn-sm" onClick={() => setFilter('all')}>
                        查看全部
                      </button>
                    )}
                  </div>
                }
              />
            </div>
          ) : (
            <div>
              {grouped.map(([month, list]) => (
                <div key={month}>
                  <div className="month-label">
                    <CalendarRange size={13} />
                    {monthLabel(month)}
                    <span className="tiny">· {list.length} 条</span>
                  </div>
                  <div className="timeline">
                    {list.map((e) => (
                      <div className="tl-item" key={e.id}>
                        <div className="tl-rail">
                          <div className={`tl-node ${e.type}`}>
                            <EventIcon type={e.type} size={14} />
                          </div>
                        </div>
                        <article className="tl-card">
                          <div className="row-between" style={{ gap: 8 }}>
                            <div className="tl-title truncate">{e.title}</div>
                            <span className="tl-date num">{fmtDate(e.date)}</span>
                          </div>

                          {e.weight !== undefined && (
                            <div className="row" style={{ gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                              <span className="num" style={{ fontSize: 17, fontWeight: 600 }}>
                                {e.weight.toFixed(1)}
                                <span style={{ fontSize: 11, fontWeight: 500, color: '#6d7d77' }}> kg</span>
                              </span>
                              {(() => {
                                const prev = events
                                  .filter((x) => x.type === 'weight' && x.weight !== undefined && x.date < e.date)
                                  .sort((a, b) => (a.date < b.date ? -1 : 1))
                                  .pop()
                                if (!prev?.weight) return null
                                const d = Number((e.weight! - prev.weight).toFixed(1))
                                return (
                                  <span className={`badge ${Math.abs(d) >= 0.5 ? 'badge-coral' : 'badge-brand'}`}>
                                    较上次 {signed(d)}
                                  </span>
                                )
                              })()}
                            </div>
                          )}

                          {e.type !== 'weight' && (
                            <div className="tl-note clamp3">
                              {[e.vaccineName, e.reason, e.diagnosis, e.medicine, e.hospital, e.note].filter(Boolean).join(' · ') || '已记录'}
                            </div>
                          )}
                          {e.type === 'weight' && e.note && <div className="tl-note clamp2">{e.note}</div>}

                          {e.photo && <img className="tl-photo" src={e.photo} alt={e.title} loading="lazy" />}

                          <div className="tl-foot">
                            <span className="tag">{eventMeta[e.type].label}</span>
                            {e.hospital && <span className="tag truncate" style={{ maxWidth: 180 }}>{e.hospital}</span>}
                            {e.cost ? <span className="tag num">¥{e.cost}</span> : null}
                            {e.sharedPostId && (
                              <span className="badge badge-brand">
                                <CheckCircle2 size={10} /> 已分享
                              </span>
                            )}
                            <div className="tl-actions">
                              <button className="btn-icon" aria-label="分享这条记录" title="生成分享卡" onClick={() => openShare(e)}>
                                <Share2 size={15} />
                              </button>
                              <button className="btn-icon" aria-label="删除这条记录" title="删除" onClick={() => setToDelete(e)}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </article>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* 档案起点 */}
              <div className="timeline">
                <div className="tl-item">
                  <div className="tl-rail">
                    <div className="tl-node daily">
                      <Avatar src={pet.avatar} size={22} alt={pet.name} />
                    </div>
                  </div>
                  <div className="tl-card" style={{ background: '#fbfdfc' }}>
                    <div className="row-between">
                      <div className="tl-title">{pet.name} 的档案创建</div>
                      <span className="tl-date num">{fmtDate(pet.createdAt)}</span>
                    </div>
                    <div className="tl-note">时间线从这里开始，之后每一次记录都会接在后面。</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="side-col stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <Sparkles size={16} /> 生成成长卡
              </div>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <button className="btn btn-block" style={{ justifyContent: 'flex-start' }} onClick={() => setReview('month')}>
                <CalendarRange size={15} /> 本月成长卡
              </button>
              <button className="btn btn-block" style={{ justifyContent: 'flex-start' }} onClick={() => setReview('year')}>
                <Sparkles size={15} /> 年度成长报告
              </button>
              <button className="btn btn-block" style={{ justifyContent: 'flex-start' }} onClick={() => setReview('birthday')}>
                <Cake size={15} /> 生日卡
              </button>
            </div>
            <div className="tiny muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
              成长卡只会用到你已经记录的数据，分享前仍会确认可见范围。
            </div>
          </section>

          <section className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>
              <Camera size={16} /> 照片回顾
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {events.filter((e) => e.photo).slice(0, 4).map((e) => (
                <img
                  key={e.id}
                  src={e.photo}
                  alt={e.title}
                  style={{ width: '100%', height: 74, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8e5' }}
                  loading="lazy"
                />
              ))}
              {events.filter((e) => e.photo).length === 0 && (
                <div className="small muted" style={{ gridColumn: '1 / -1' }}>还没有带照片的记录</div>
              )}
            </div>
            <button className="btn btn-sm btn-block" style={{ marginTop: 8 }} onClick={() => openRecord('photo')}>
              <Plus size={13} /> 添加照片
            </button>
          </section>
        </aside>
      </div>

      <ReviewSheet kind={review} onClose={() => setReview(null)} />

      <ConfirmSheet
        open={Boolean(toDelete)}
        title="删除这条记录？"
        text={
          toDelete
            ? `「${toDelete.title}」（${fmtDateFull(toDelete.date)}）删除后会从时间线、趋势图和看诊摘要里一起移除，无法恢复。`
            : ''
        }
        confirmLabel="删除记录"
        danger
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          await api.deleteEvent(toDelete.id)
          toast('记录已删除，趋势图与摘要已同步更新', 'success')
          setToDelete(null)
        }}
      />
    </div>
  )
}

function ReviewSheet({ kind, onClose }: { kind: null | 'month' | 'year' | 'birthday'; onClose: () => void }) {
  const { db, pet, toast } = useApp()
  const [publishing, setPublishing] = useState(false)
  const events = petEvents(db, pet?.id)

  const scopeKey = kind === 'year' ? 'year' : kind === 'birthday' ? 'all' : todayISO().slice(0, 7)
  const list =
    kind === 'month'
      ? events.filter((e) => e.date.slice(0, 7) === todayISO().slice(0, 7))
      : kind === 'year'
        ? events.filter((e) => e.date.slice(0, 4) === todayISO().slice(0, 4))
        : events

  const weights = weightSeries(list)
  const change = weightChange(list, 30)
  const photos = list.filter((e) => e.photo)

  const title =
    kind === 'birthday'
      ? `${pet?.name ?? ''} 生日快乐`
      : kind === 'year'
        ? `${pet?.name ?? ''} 的 ${todayISO().slice(0, 4)} 年成长报告`
        : `${pet?.name ?? ''} 的 ${Number(todayISO().slice(5, 7))} 月成长卡`

  const text = [
    `${title}`,
    `这${kind === 'month' ? '个月' : kind === 'year' ? '一年' : '段时间'}共记录 ${list.length} 条，拍了 ${photos.length} 张照片。`,
    weights.length > 1
      ? `体重从 ${weights[0].weight.toFixed(1)} kg 到 ${weights[weights.length - 1].weight.toFixed(1)} kg。`
      : weights.length === 1
        ? `最近一次体重 ${weights[0].weight.toFixed(1)} kg。`
        : '还没有体重记录。',
    `来自「爪迹」成长与健康档案 · ${db?.user.city}`,
  ].join('\n')

  const publish = async () => {
    setPublishing(true)
    try {
      await api.createPost({
        content: text,
        images: photos.slice(0, 1).map((p) => p.photo as string),
        visibility: 'local',
        kind: 'moment',
        tags: ['成长卡'],
      })
      toast('成长卡已发布到同城', 'success')
      onClose()
    } catch {
      toast('发布失败，请稍后再试', 'error')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Sheet
      open={Boolean(kind)}
      onClose={onClose}
      title={kind === 'birthday' ? '生日卡' : kind === 'year' ? '年度成长报告' : '本月成长卡'}
      subtitle="由你的记录自动生成，可以只留给自己"
      footer={
        <>
          <button
            className="btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text)
                toast('文案已复制', 'success')
              } catch {
                toast('浏览器不允许复制，可以手动选中文本', 'error')
              }
            }}
          >
            <Copy size={14} /> 复制文案
          </button>
          <button className="btn btn-primary" onClick={publish} disabled={publishing || list.length === 0}>
            <Send size={14} /> {publishing ? '发布中…' : '发布到同城'}
          </button>
        </>
      }
    >
      <div className="share-card">
        <div className="share-card-top">
          <Avatar src={pet?.avatar ?? 'img/paw.svg'} size={36} alt={pet?.name} />
          <div className="grow" style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{pet?.name}</div>
            <div className="tiny muted">{pet?.breed ?? ''} · {pet?.date ? fmtDateFull(pet.date) : ''}</div>
          </div>
          {kind === 'birthday' && <Cake size={18} color="#d96340" />}
        </div>
        <div className="share-card-body">
          <div className="share-card-title">{title}</div>
          <div className="stat-row" style={{ marginTop: 10 }}>
            <div className="stat">
              <div className="stat-label">记录</div>
              <div className="stat-value num">{list.length}<small>条</small></div>
            </div>
            <div className="stat">
              <div className="stat-label">照片</div>
              <div className="stat-value num">{photos.length}<small>张</small></div>
            </div>
            <div className="stat">
              <div className="stat-label">体重</div>
              <div className="stat-value num">
                {weights.length ? weights[weights.length - 1].weight.toFixed(1) : '—'}
                <small>kg</small>
              </div>
            </div>
          </div>
          {change !== undefined && (
            <div className="small" style={{ marginTop: 8, color: '#41524c' }}>
              近 30 天体重变化 {signed(change)}
            </div>
          )}
        </div>
        {photos[0]?.photo && <img className="share-card-img" src={photos[0].photo} alt="成长卡照片" />}
        <div className="share-foot-brand">
          <span>来自「爪迹」成长与健康档案</span>
          <span>{db?.user.city} · {db?.user.district}</span>
        </div>
      </div>

      <div className="notice" style={{ marginTop: 12 }}>
        <CheckCircle2 size={14} style={{ flex: 'none', marginTop: 2 }} />
        <span>发布到同城后，位置只显示 {db?.user.city} · {db?.user.district}，不会出现小区或街道。</span>
      </div>
      <div className="tiny muted" style={{ marginTop: 8 }}>
        当前卡片包含 {scopeKey === 'all' ? '全部' : scopeKey} 的记录，共 {list.length} 条。
      </div>
    </Sheet>
  )
}
