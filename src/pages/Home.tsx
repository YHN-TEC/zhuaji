import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  HeartPulse,
  MapPin,
  Plus,
  Scale,
  Syringe,
  Bug,
  Stethoscope,
  Camera,
  Bell,
  TrendingUp,
  ArrowUpRight,
  CalendarDays,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useApp } from '../store'
import { api } from '../lib/api'
import { PetSwitcher } from '../components/AppShell'
import { Avatar, CardSkeleton, EmptyState, ErrorState, EventIcon, ListSkeleton, Stat, eventMeta } from '../components/ui'
import { WeightChart } from '../components/WeightChart'
import { ageText, daysBetween, fmtDate, fmtWeight, relDay, signed, todayISO } from '../lib/format'
import { dueToday, latestWeight, nextReminder, petEvents, weightChange, weightSeries } from '../lib/health'
import type { ReminderKind } from '../types'

const quickActions: { type: 'weight' | 'vaccine' | 'deworm' | 'visit' | 'photo'; label: string; icon: typeof Scale; coral?: boolean }[] = [
  { type: 'weight', label: '体重', icon: Scale },
  { type: 'vaccine', label: '疫苗', icon: Syringe },
  { type: 'deworm', label: '驱虫', icon: Bug },
  { type: 'visit', label: '就诊', icon: Stethoscope, coral: true },
  { type: 'photo', label: '照片', icon: Camera },
]

const kindToType: Record<ReminderKind, 'weight' | 'vaccine' | 'deworm' | 'visit'> = {
  weight: 'weight',
  vaccine: 'vaccine',
  deworm: 'deworm',
  visit: 'visit',
}

export function Home() {
  const { db, pet, loading, bootError, openRecord, toast, pets } = useApp()
  const navigate = useNavigate()

  if (bootError) {
    return (
      <div className="content">
        <ErrorState title="数据加载失败" text={bootError} onRetry={() => api.bootstrap()} />
      </div>
    )
  }

  if (loading || !db) {
    return (
      <div className="content">
        <div className="skeleton" style={{ height: 92, borderRadius: 8, marginBottom: 14 }} />
        <CardSkeleton />
        <div style={{ height: 12 }} />
        <ListSkeleton rows={2} />
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="content">
        <EmptyState
          title="还没有宠物档案"
          text="先创建一份档案，之后的疫苗、驱虫和体重都会自动归到这份档案里。"
          action={
            <button className="btn btn-primary" onClick={() => navigate('/onboarding')}>
              <Plus size={15} /> 创建宠物档案
            </button>
          }
        />
      </div>
    )
  }

  const events = petEvents(db, pet.id)
  const weights = weightSeries(events)
  const latest = latestWeight(events)
  const change30 = weightChange(events, 30)
  const tasks = dueToday(db, pet.id)
  const vaccineNext = nextReminder(db, pet.id, 'vaccine')
  const dewormNext = nextReminder(db, pet.id, 'deworm')
  const latestEvent = events[0]
  const localPosts = db.posts.filter((p) => p.visibility !== 'private' && p.city === db.user.city).slice(0, 2)
  const monthEvents = events.filter((e) => e.date.slice(0, 7) === todayISO().slice(0, 7))
  const photos = events.filter((e) => e.type === 'photo').length
  const overdue = tasks.filter((t) => daysBetween(todayISO(), t.dueDate) < 0).length

  const today = new Date()
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][today.getDay()]

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">今天</h1>
          <div className="page-sub num">
            {today.getMonth() + 1} 月 {today.getDate()} 日 · {weekday} · 杭州
          </div>
        </div>
        <button className="btn btn-sm" onClick={() => navigate('/timeline')}>
          <Clock size={14} /> 时间线
        </button>
      </div>

      <div className="cols">
        <div className="stack">
          {/* 宠物档案头 */}
          <section className="pet-hero">
            <Avatar src={pet.avatar} size={56} alt={pet.name} />
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="pet-hero-name">
                <span className="truncate">{pet.name}</span>
                <span className="badge badge-brand">{pet.breed ?? (pet.species === 'cat' ? '猫' : '狗')}</span>
              </div>
              <div className="pet-hero-meta">
                <span>{ageText(pet.date)}</span>
                <span>·</span>
                <span className="num">{fmtWeight(latest?.weight)}</span>
                <span>·</span>
                <span>{pet.neutered === 'yes' ? '已绝育' : pet.neutered === 'no' ? '未绝育' : '绝育待补充'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              <PetSwitcher />
              <button className="link" style={{ fontSize: 12 }} onClick={() => navigate('/profile')}>
                查看档案 <ChevronRight size={12} />
              </button>
            </div>
          </section>

          {/* 今天需要关注 */}
          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <Bell size={16} /> 今天需要关注
              </div>
              <span className="card-hint">
                {tasks.length ? `${tasks.length} 项待处理` : '未来 7 天'}
                {overdue > 0 && <span className="badge badge-coral" style={{ marginLeft: 6 }}>{overdue} 项逾期</span>}
              </span>
            </div>
            {tasks.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={20} />}
                title="未来 7 天没有需要处理的事项"
                text="下一次提醒会提前出现在这里。不需要每天打卡，按节奏记录就好。"
                action={
                  <button className="btn btn-sm" onClick={() => openRecord('weight')}>
                    记一次体重
                  </button>
                }
              />
            ) : (
              tasks.map((t) => {
                const late = daysBetween(todayISO(), t.dueDate) < 0
                const source = t.sourceEventId ? db.events.find((e) => e.id === t.sourceEventId) : undefined
                return (
                  <div className="task-row" key={t.id}>
                    <div className={`task-icon${late ? ' warn' : ''}`}>
                      <EventIcon type={kindToType[t.kind]} size={16} />
                    </div>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="task-title truncate">{t.title}</div>
                      <div className="task-meta num">
                        {relDay(t.dueDate)}
                        {source ? ` · 上次 ${fmtDate(source.date)}` : ' · 还没有记录过'}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-soft" onClick={() => openRecord(kindToType[t.kind])}>
                      去记录
                    </button>
                    <button
                      className="btn-icon bordered"
                      aria-label={`将「${t.title}」标记为完成`}
                      title="标记完成"
                      onClick={async () => {
                        await api.completeReminder(t.id)
                        toast('已标记完成，本次提醒不再出现', 'success')
                      }}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  </div>
                )
              })
            )}
          </section>

          {/* 快捷记录 */}
          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <Plus size={16} /> 快捷记录
              </div>
              <span className="card-hint">平均 30 秒完成</span>
            </div>
            <div className="quick-grid">
              {quickActions.map((a) => (
                <button key={a.type} className={`quick-btn${a.coral ? ' coral' : ''}`} onClick={() => openRecord(a.type)}>
                  <a.icon size={20} />
                  {a.label}
                </button>
              ))}
            </div>
          </section>

          {/* 健康摘要 */}
          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <HeartPulse size={16} /> 最近健康摘要
              </div>
              <button className="link" onClick={() => navigate('/health')}>
                健康档案 <ChevronRight size={12} />
              </button>
            </div>

            {weights.length === 0 ? (
              <EmptyState
                icon={<Scale size={20} />}
                title="还没有体重记录"
                text="第一次称重后，这里会出现体重趋势和最近变化。"
                action={
                  <button className="btn btn-sm btn-primary" onClick={() => openRecord('weight')}>
                    记录体重
                  </button>
                }
              />
            ) : (
              <>
                <div className="row-between" style={{ marginBottom: 8 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="num" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.5px' }}>
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
                <WeightChart data={weights.slice(-6)} height={132} />
                <div className="stat-row" style={{ marginTop: 10 }}>
                  <Stat label="疫苗" value={vaccineNext ? relDay(vaccineNext.dueDate) : '待设置'} icon={<Syringe size={11} />} />
                  <Stat
                    label="驱虫"
                    value={dewormNext ? relDay(dewormNext.dueDate) : '待设置'}
                    icon={<Bug size={11} />}
                  />
                  <Stat label="本月记录" value={`${monthEvents.length}`} unit="条" icon={<CalendarDays size={11} />} />
                </div>
                <div className="tiny muted" style={{ marginTop: 8, display: 'flex', gap: 4, alignItems: 'center' }}>
                  <ShieldCheck size={12} /> 只呈现趋势和提醒，不做任何疾病判断
                </div>
              </>
            )}
          </section>

          {/* 最近一条时间线 */}
          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <Clock size={16} /> 最近一条记录
              </div>
              <button className="link" onClick={() => navigate('/timeline')}>
                全部时间线 <ChevronRight size={12} />
              </button>
            </div>
            {!latestEvent ? (
              <EmptyState
                icon={<Sparkles size={20} />}
                title={`${pet.name} 的档案刚刚开始`}
                text="记录今天的样子或当前体重，时间线就会从这里长出来。"
                action={
                  <div className="row" style={{ justifyContent: 'center' }}>
                    <button className="btn btn-sm btn-primary" onClick={() => openRecord('weight')}>
                      记录体重
                    </button>
                    <button className="btn btn-sm" onClick={() => openRecord('photo')}>
                      记录照片
                    </button>
                  </div>
                }
              />
            ) : (
              <div className="tl-item" style={{ paddingBottom: 0 }}>
                <div className="tl-rail">
                  <div className={`tl-node ${latestEvent.type}`}>
                    <EventIcon type={latestEvent.type} size={14} />
                  </div>
                </div>
                <div className="tl-card" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
                  <div className="row-between">
                    <div className="tl-title truncate">{latestEvent.title}</div>
                    <span className="tl-date num">{fmtDate(latestEvent.date)}</span>
                  </div>
                  {latestEvent.note && <div className="tl-note clamp2">{latestEvent.note}</div>}
                  {latestEvent.photo && <img className="tl-photo" src={latestEvent.photo} alt={latestEvent.title} style={{ height: 120 }} />}
                  <div className="tl-foot">
                    <span className="tag">{eventMeta[latestEvent.type].label}</span>
                    {latestEvent.weight && <span className="badge badge-brand num">{latestEvent.weight.toFixed(1)} kg</span>}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* 侧栏：社区只占少量位置 */}
        <aside className="side-col stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <CalendarDays size={16} /> 本月回顾
              </div>
              <span className="card-hint">{todayISO().slice(0, 7).replace('-', ' 年 ')} 月</span>
            </div>
            <div className="stat-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Stat label="记录" value={`${monthEvents.length}`} unit="条" />
              <Stat label="照片" value={`${photos}`} unit="张" />
            </div>
            <button className="btn btn-block btn-sm" style={{ marginTop: 10 }} onClick={() => navigate('/timeline')}>
              <Sparkles size={13} /> 生成成长卡
            </button>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <MapPin size={16} /> 同城精选
              </div>
              <button className="link" onClick={() => navigate('/local')}>
                去同城 <ChevronRight size={12} />
              </button>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {localPosts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate('/local')}
                  style={{ textAlign: 'left', display: 'flex', gap: 8, alignItems: 'flex-start' }}
                >
                  <Avatar src={p.authorAvatar} size={28} alt={p.authorName} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="tiny muted truncate">
                      {p.authorName} · {p.district}
                    </div>
                    <div className="small clamp2" style={{ marginTop: 1 }}>{p.content}</div>
                  </div>
                </button>
              ))}
              {localPosts.length === 0 && <div className="small muted">同城还没有新内容</div>}
            </div>
          </section>

          <section className="card" style={{ background: '#fbf7f1', borderColor: '#efe6da' }}>
            <div className="row" style={{ gap: 6, fontSize: 13, fontWeight: 600, color: '#6b5330' }}>
              <ShieldCheck size={15} /> 隐私默认设置
            </div>
            <div className="small" style={{ color: '#6b5330', marginTop: 4, lineHeight: 1.65 }}>
              健康记录默认私密，同城只显示城市与行政区。想公开时，需要你自己勾选可见范围。
            </div>
            <button className="link" style={{ marginTop: 6, color: '#8a6320' }} onClick={() => navigate('/settings')}>
              查看隐私设置 <ArrowUpRight size={12} />
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}
