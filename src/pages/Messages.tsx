import { useNavigate } from 'react-router-dom'
import { Bell, Heart, MessageCircle, CheckCircle2, Clock3, ShieldCheck } from 'lucide-react'
import { useApp } from '../store'
import { api } from '../lib/api'
import { Avatar, EmptyState } from '../components/ui'
import { daysBetween, fmtDate, fmtTimeAgo, relDay, todayISO } from '../lib/format'

export function Messages() {
  const { db, toast, loading } = useApp()
  const navigate = useNavigate()

  if (loading || !db) {
    return (
      <div className="content">
        <div className="skeleton" style={{ height: 100, borderRadius: 8 }} />
      </div>
    )
  }

  const reminders = db.reminders.filter((r) => !r.done).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
  const myPosts = db.posts.filter((p) => p.mine)
  const interactions = myPosts.flatMap((p) =>
    p.comments
      .filter((c) => !c.isOwner)
      .map((c) => ({ post: p, comment: c })),
  )
  const totalLikes = myPosts.reduce((s, p) => s + p.likes, 0)

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">消息与提醒</h1>
          <div className="page-sub">提醒、互动与系统通知都放在这里，不占底部导航</div>
        </div>
        <button className="btn btn-sm" onClick={() => navigate('/')}>
          返回首页
        </button>
      </div>

      <div className="cols">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <Bell size={16} /> 健康提醒
              </div>
              <span className="card-hint">{reminders.length} 项待处理</span>
            </div>
            {reminders.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={20} />}
                title="没有待处理的提醒"
                text="记录疫苗或驱虫后，可以选择是否设置下一次提醒。"
                action={
                  <button className="btn btn-sm" onClick={() => navigate('/health')}>
                    去健康页看看
                  </button>
                }
              />
            ) : (
              reminders.map((r) => {
                const pet = db.pets.find((p) => p.id === r.petId)
                const late = daysBetween(todayISO(), r.dueDate) < 0
                return (
                  <div className="task-row" key={r.id}>
                    <Avatar src={pet?.avatar ?? 'img/paw.svg'} size={32} alt={pet?.name} />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="task-title truncate">
                        {r.title}
                        <span className="tiny muted"> · {pet?.name}</span>
                      </div>
                      <div className="task-meta num">
                        {fmtDate(r.dueDate)} · {relDay(r.dueDate)}
                      </div>
                    </div>
                    {late && <span className="badge badge-coral">逾期</span>}
                    <button
                      className="btn btn-sm"
                      onClick={async () => {
                        await api.snoozeReminder(r.id, 3)
                        toast('已推迟 3 天提醒', 'success')
                      }}
                    >
                      推迟
                    </button>
                    <button
                      className="btn-icon bordered"
                      aria-label="标记完成"
                      onClick={async () => {
                        await api.completeReminder(r.id)
                        toast('提醒已完成', 'success')
                      }}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  </div>
                )
              })
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <MessageCircle size={16} /> 同城互动
              </div>
              <span className="card-hint">
                <Heart size={11} style={{ verticalAlign: -1 }} /> {totalLikes}
              </span>
            </div>
            {interactions.length === 0 ? (
              <EmptyState
                icon={<MessageCircle size={20} />}
                title="还没有新的回应"
                text="把一条有内容的记录分享到同城，通常会收到更具体的经验回复。"
                action={
                  <button className="btn btn-sm" onClick={() => navigate('/timeline')}>
                    去时间线分享
                  </button>
                }
              />
            ) : (
              interactions.map(({ post, comment }) => (
                <div className="task-row" key={comment.id} style={{ alignItems: 'flex-start' }}>
                  <Avatar src={comment.authorAvatar} size={32} alt={comment.authorName} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="small">
                      <span style={{ fontWeight: 600 }}>{comment.authorName}</span>
                      <span className="muted"> 评论了你的分享</span>
                    </div>
                    <div className="small wrap-any" style={{ color: 'var(--ink-2)', marginTop: 1 }}>{comment.content}</div>
                    <div className="tiny muted" style={{ marginTop: 2 }}>
                      {fmtTimeAgo(comment.createdAt)} · 原文：{post.content.slice(0, 18)}…
                    </div>
                  </div>
                  <button className="btn btn-sm" onClick={() => navigate('/local')}>
                    查看
                  </button>
                </div>
              ))
            )}
          </section>
        </div>

        <aside className="side-col stack">
          <section className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>
              <Clock3 size={16} /> 提醒设置
            </div>
            <div className="small muted" style={{ lineHeight: 1.75 }}>
              爪迹不做连续签到，也不会因为断签提醒你。只在疫苗、驱虫和体重这类真正需要关注的时间点出现。
            </div>
            <button className="btn btn-sm btn-block" style={{ marginTop: 8 }} onClick={() => navigate('/health')}>
              管理提醒
            </button>
          </section>
          <section className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>
              <ShieldCheck size={16} /> 系统通知
            </div>
            <div className="small muted" style={{ lineHeight: 1.75 }}>
              位置说明、隐私政策更新等系统消息会出现在这里。健康数据不会被用于推送广告。
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
