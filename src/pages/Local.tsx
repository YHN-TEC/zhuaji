import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  MapPin,
  ShieldAlert,
  ShieldOff,
  Send,
  Plus,
  Users,
  CalendarDays,
  Info,
  Flag,
  CheckCircle2,
  HelpCircle,
  Camera,
  UserPlus,
  RefreshCw,
} from 'lucide-react'
import { useApp } from '../store'
import { api } from '../lib/api'
import { Avatar, EmptyState, ErrorState, Sheet } from '../components/ui'
import { fmtTimeAgo } from '../lib/format'
import type { Post } from '../types'

const tabs = [
  { key: 'feed', label: '动态' },
  { key: 'qa', label: '经验问答' },
  { key: 'groups', label: '品种小组' },
  { key: 'events', label: '线下活动' },
] as const

const reportReasons = ['与养宠无关的广告', '医疗误导或夸大', '攻击性 / 不友善内容', '疑似泄露他人隐私', '其他问题']

export function Local() {
  const { db, toast, loading, pet } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState<(typeof tabs)[number]['key']>('feed')
  const [district, setDistrict] = useState('全部')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [reportFor, setReportFor] = useState<Post | null>(null)
  const [blockFor, setBlockFor] = useState<Post | null>(null)
  const [reason, setReason] = useState(reportReasons[0])
  const [feedError, setFeedError] = useState(false)

  const districts = useMemo(() => {
    if (!db) return ['全部']
    const set = new Set(db.posts.map((p) => p.district))
    return ['全部', ...Array.from(set)]
  }, [db])

  if (loading || !db) {
    return (
      <div className="content">
        <div className="skeleton" style={{ height: 40, borderRadius: 8, marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 160, borderRadius: 8, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 160, borderRadius: 8 }} />
      </div>
    )
  }

  const posts = db.posts.filter((p) => p.visibility !== 'private')
  const feed = posts.filter((p) => (tab === 'qa' ? p.kind === 'question' : p.kind !== 'question'))
  const visible = district === '全部' ? feed : feed.filter((p) => p.district === district)

  const submitComment = async (postId: string) => {
    const text = (drafts[postId] ?? '').trim()
    if (!text) {
      toast('写点什么再发送吧', 'error')
      return
    }
    await api.addComment(postId, text)
    setDrafts((d) => ({ ...d, [postId]: '' }))
    toast('评论已发布', 'success')
  }

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">同城</h1>
          <div className="page-sub">
            {db.user.city} · 只显示城市与行政区，不展示精确位置
          </div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button
            className="btn-icon bordered"
            aria-label="刷新同城内容"
            title="刷新同城内容"
            onClick={() => {
              if (!navigator.onLine) {
                setFeedError(true)
                toast('当前处于离线状态，无法加载同城内容', 'error')
              } else {
                setFeedError(false)
                toast('已刷新同城内容', 'success')
              }
            }}
          >
            <RefreshCw size={15} />
          </button>
          <button className="btn btn-sm" onClick={() => navigate('/timeline')}>
            <Camera size={14} /> 从时间线分享
          </button>
        </div>
      </div>

      <div className="cols">
        <div className="stack">
          {!db.seenLocationNotice && (
            <div className="notice">
              <MapPin size={15} style={{ flex: 'none', marginTop: 2 }} />
              <div className="grow">
                <div style={{ fontWeight: 600, marginBottom: 2 }}>关于位置</div>
                爪迹不采集你的精确位置。同城内容只会显示到「{db.user.city} · {db.user.district}」这一级，不会出现小区、街道或实时距离。
              </div>
              <button className="btn btn-sm btn-soft" onClick={() => api.markLocationNoticeSeen()}>
                知道了
              </button>
            </div>
          )}

          <div className="card" style={{ padding: '10px 12px' }}>
            <div className="chip-row">
              {tabs.map((t) => (
                <button key={t.key} className={`chip${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
            {(tab === 'feed' || tab === 'qa') && (
              <div className="chip-row" style={{ marginTop: 8 }}>
                {districts.map((d) => (
                  <button key={d} className={`chip${district === d ? ' active' : ''}`} onClick={() => setDistrict(d)}>
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {(tab === 'feed' || tab === 'qa') && (
            <>
              <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Avatar src={pet?.avatar ?? db.user.avatar} size={34} alt={pet?.name} />
                <button
                  className="grow"
                  style={{
                    textAlign: 'left',
                    border: '1px solid #e2e8e5',
                    borderRadius: 8,
                    padding: '9px 11px',
                    color: '#6d7d77',
                    fontSize: 13,
                    background: '#fbfdfc',
                  }}
                  onClick={() => navigate('/timeline')}
                >
                  从时间线选一条记录，带上照片分享到同城…
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/timeline')}>
                  <Plus size={14} /> 分享
                </button>
              </div>

              {feedError ? (
                <div className="card">
                  <ErrorState
                    title="同城内容加载失败"
                    text="网络好像不太稳定，可以稍后重试。"
                    onRetry={() => setFeedError(false)}
                  />
                </div>
              ) : visible.length === 0 ? (
                <div className="card">
                  <EmptyState
                    icon={<MapPin size={20} />}
                    title={`${district === '全部' ? '同城' : district}还没有相关内容`}
                    text="换个区域看看，或者把你的第一条记录分享出来。"
                    action={
                      <button className="btn btn-sm btn-primary" onClick={() => navigate('/timeline')}>
                        去时间线分享
                      </button>
                    }
                  />
                </div>
              ) : (
                <div className="stack">
                  {visible.map((p) => (
                    <article className="post" key={p.id}>
                      <div className="post-head">
                        <Avatar src={p.authorAvatar} size={38} alt={p.authorName} />
                        <div className="grow" style={{ minWidth: 0 }}>
                          <div className="post-author">
                            <span className="truncate">{p.authorName}</span>
                            {p.petName && <span className="tag">{p.petName}</span>}
                            {p.mine && <span className="badge badge-brand">我的</span>}
                          </div>
                          <div className="post-meta">
                            <MapPin size={11} />
                            {p.city} · {p.district}
                            <span>·</span>
                            <span>{fmtTimeAgo(p.createdAt)}</span>
                          </div>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <button className="btn-icon" aria-label="更多操作" onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}>
                            <MoreHorizontal size={18} />
                          </button>
                          {menuFor === p.id && (
                            <>
                              <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => setMenuFor(null)} aria-hidden="true" />
                              <div className="pet-menu" style={{ top: 38, width: 168, zIndex: 20 }}>
                                <button
                                  className="pet-menu-item"
                                  onClick={() => {
                                    setReportFor(p)
                                    setMenuFor(null)
                                  }}
                                >
                                  <Flag size={15} /> 举报这条内容
                                </button>
                                {!p.mine && (
                                  <button
                                    className="pet-menu-item"
                                    onClick={() => {
                                      setBlockFor(p)
                                      setMenuFor(null)
                                    }}
                                  >
                                    <ShieldOff size={15} /> 拉黑 {p.authorName}
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="post-content">{p.content}</div>

                      {p.images.length > 0 && (
                        <div className={`post-images n${Math.min(p.images.length, 2)}`}>
                          {p.images.slice(0, 2).map((img, i) => (
                            <img key={i} src={img} alt="动态图片" loading="lazy" />
                          ))}
                        </div>
                      )}

                      <div className="row" style={{ gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
                        {p.tags.filter(Boolean).map((t) => (
                          <span key={t} className="tag">#{t}</span>
                        ))}
                      </div>

                      {p.medical && (
                        <div className="disclaimer">
                          <Info size={13} style={{ flex: 'none', marginTop: 1 }} />
                          <span>个人经验，不替代兽医建议。涉及用药与剂量请咨询执业兽医。</span>
                        </div>
                      )}

                      <div className="post-foot">
                        <button className={`post-action${p.liked ? ' on' : ''}`} onClick={() => api.likePost(p.id)}>
                          <Heart size={15} fill={p.liked ? '#d96340' : 'none'} /> {p.likes}
                        </button>
                        <span className="post-action">
                          <MessageCircle size={15} /> {p.comments.length}
                        </span>
                        <button className="post-action" style={{ marginLeft: 'auto' }} onClick={() => setReportFor(p)}>
                          <ShieldAlert size={14} /> 举报
                        </button>
                      </div>

                      <div style={{ marginTop: 4 }}>
                        {p.comments.map((c) => (
                          <div className="comment" key={c.id}>
                            <Avatar src={c.authorAvatar} size={26} alt={c.authorName} />
                            <div className="comment-body">
                              <div className="row" style={{ gap: 4 }}>
                                <span className="comment-name">{c.authorName}</span>
                                <span className="tiny muted">{c.city}</span>
                              </div>
                              <div className="wrap-any">{c.content}</div>
                            </div>
                          </div>
                        ))}
                        <div className="comment-input">
                          <input
                            className="input"
                            placeholder={p.medical ? '分享你的经验（不替代兽医建议）' : '友善地聊两句…'}
                            value={drafts[p.id] ?? ''}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') submitComment(p.id)
                            }}
                          />
                          <button className="btn btn-sm btn-primary" onClick={() => submitComment(p.id)} aria-label="发送评论">
                            <Send size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'groups' && (
            <div className="stack">
              <div className="notice">
                <Users size={15} style={{ flex: 'none', marginTop: 2 }} />
                <span>小组按品种与城市划分，只讨论养宠相关话题。加入后可以看到小组内的经验帖。</span>
              </div>
              {db.groups.map((g) => (
                <div className="group-card" key={g.id}>
                  <div className="group-icon">
                    {g.species === 'cat' ? <Users size={18} /> : <Users size={18} />}
                  </div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="row" style={{ gap: 6 }}>
                      <span className="truncate" style={{ fontWeight: 600, fontSize: 14 }}>{g.name}</span>
                      <span className="tag">{g.species === 'cat' ? '猫' : '狗'}</span>
                    </div>
                    <div className="tiny muted truncate">{g.intro}</div>
                    <div className="tiny muted num" style={{ marginTop: 2 }}>{g.members.toLocaleString('zh-CN')} 位成员</div>
                  </div>
                  <button
                    className={`btn btn-sm ${g.joined ? '' : 'btn-primary'}`}
                    onClick={async () => {
                      await api.joinGroup(g.id)
                      toast(g.joined ? '已退出小组' : '已加入小组', 'success')
                    }}
                  >
                    {g.joined ? '已加入' : '加入'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'events' && (
            <div className="stack">
              <div className="notice">
                <CalendarDays size={15} style={{ flex: 'none', marginTop: 2 }} />
                <span>线下活动由同城用户或合作机构发起，地点只精确到场馆名称，不会显示发起人住址。</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {db.activities.map((a) => (
                  <div className="activity-card" key={a.id}>
                    <img className="activity-cover" src={a.cover} alt={a.title} loading="lazy" />
                    <div className="activity-body">
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                      <div className="tiny muted num" style={{ marginTop: 2 }}>
                        {a.date} · {a.place}
                      </div>
                      <div className="small muted clamp2" style={{ marginTop: 4 }}>{a.desc}</div>
                      <div className="row-between" style={{ marginTop: 8 }}>
                        <span className="tiny muted num">
                          {a.city} · {a.district} · {a.participants} 人已报名
                        </span>
                        <button
                          className={`btn btn-sm ${a.joined ? '' : 'btn-primary'}`}
                          onClick={async () => {
                            await api.joinActivity(a.id)
                            toast(a.joined ? '已取消报名' : '报名成功，活动前一天会提醒你', 'success')
                          }}
                        >
                          {a.joined ? '已报名' : '报名'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="side-col stack">
          <section className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>
              <MapPin size={16} /> 我的同城
            </div>
            <div className="small muted" style={{ lineHeight: 1.7 }}>
              {db.user.city} · {db.user.district}
              <br />
              位置仅用于匹配同城内容，不精确到街道。
            </div>
            <button className="btn btn-sm btn-block" style={{ marginTop: 8 }} onClick={() => navigate('/settings')}>
              修改城市与行政区
            </button>
          </section>

          <section className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>
              <UserPlus size={16} /> 关注与私信
            </div>
            <div className="small muted" style={{ lineHeight: 1.7 }}>
              私信默认关闭。只有你关注的人，才可以在你同意后发起对话。
            </div>
            <div className="row-between" style={{ marginTop: 8 }}>
              <span className="small">允许关注者私信</span>
              <span className={`badge ${db.user.dmEnabled ? 'badge-brand' : 'badge-gray'}`}>
                {db.user.dmEnabled ? '已开启' : '已关闭'}
              </span>
            </div>
            <button className="btn btn-sm btn-block" style={{ marginTop: 8 }} onClick={() => navigate('/settings')}>
              去设置
            </button>
          </section>

          <section className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>
              <HelpCircle size={16} /> 社区规则
            </div>
            <ul className="small muted" style={{ lineHeight: 1.8, paddingLeft: 2 }}>
              <li>· 医疗经验必须标注个人经验</li>
              <li>· 不发布他人宠物与隐私信息</li>
              <li>· 广告与导流内容会被移除</li>
              <li>· 举报后 24 小时内处理</li>
            </ul>
          </section>

          {db.blocked.length > 0 && (
            <section className="card">
              <div className="card-title" style={{ marginBottom: 8 }}>
                <ShieldOff size={16} /> 已拉黑
              </div>
              {db.blocked.map((b) => (
                <div key={b.id} className="row-between" style={{ marginBottom: 6 }}>
                  <span className="small">{b.name}</span>
                  <button
                    className="btn btn-sm"
                    onClick={async () => {
                      await api.unblockUser(b.id)
                      toast('已解除拉黑', 'success')
                    }}
                  >
                    解除
                  </button>
                </div>
              ))}
            </section>
          )}
        </aside>
      </div>

      <Sheet
        open={Boolean(reportFor)}
        onClose={() => setReportFor(null)}
        title="举报内容"
        subtitle="举报后该内容会从你的同城页隐藏"
        footer={
          <>
            <button className="btn" onClick={() => setReportFor(null)}>
              取消
            </button>
            <button
              className="btn btn-coral"
              onClick={async () => {
                if (!reportFor) return
                await api.reportPost(reportFor.id, reason)
                setReportFor(null)
                toast('举报已提交，我们会在 24 小时内处理', 'success')
              }}
            >
              提交举报
            </button>
          </>
        }
      >
        <div className="radio-row">
          {reportReasons.map((r) => (
            <label key={r} className={`check${reason === r ? ' on' : ''}`}>
              <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
              <span style={{ fontSize: 13 }}>{r}</span>
            </label>
          ))}
        </div>
      </Sheet>

      <Sheet
        open={Boolean(blockFor)}
        onClose={() => setBlockFor(null)}
        title={`拉黑 ${blockFor?.authorName ?? ''}？`}
        footer={
          <>
            <button className="btn" onClick={() => setBlockFor(null)}>
              取消
            </button>
            <button
              className="btn btn-coral"
              onClick={async () => {
                if (!blockFor) return
                await api.blockUser(blockFor.authorName)
                setBlockFor(null)
                toast('已拉黑，该用户的内容不会再出现', 'success')
              }}
            >
              确认拉黑
            </button>
          </>
        }
      >
        <div className="small" style={{ lineHeight: 1.7, color: 'var(--ink-2)' }}>
          拉黑后，你将看不到对方在同城的内容，对方也无法关注你或给你评论。可以随时在设置里解除。
        </div>
      </Sheet>
    </div>
  )
}
