import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  ShieldCheck,
  Download,
  Trash2,
  LogOut,
  MapPin,
  BellOff,
  Lock,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  FileJson,
  MessageSquare,
} from 'lucide-react'
import { useApp } from '../store'
import { api } from '../lib/api'
import { Avatar, ConfirmSheet, Sheet } from '../components/ui'
import { fmtDateFull, todayISO } from '../lib/format'

export function Settings() {
  const { db, toast, loading } = useApp()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [city, setCity] = useState(db?.user.city ?? '杭州')
  const [district, setDistrict] = useState(db?.user.district ?? '西湖区')
  const [nickname, setNickname] = useState(db?.user.nickname ?? '')
  const [confirm, setConfirm] = useState<null | 'wipe' | 'reset'>(null)
  const [busy, setBusy] = useState(false)

  if (loading || !db) {
    return (
      <div className="content">
        <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
      </div>
    )
  }

  const exportAll = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: db.user,
      pets: db.pets,
      events: db.events,
      reminders: db.reminders,
      posts: db.posts.filter((p) => p.mine),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `爪迹-数据导出-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('数据已导出为 JSON 文件', 'success')
  }

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">设置与隐私</h1>
          <div className="page-sub">账号、位置、数据与安全设置</div>
        </div>
        <button className="btn btn-sm" onClick={() => navigate(-1)}>
          返回
        </button>
      </div>

      <div className="cols">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <User size={16} /> 账号
              </div>
              <button className="btn btn-sm" onClick={() => setEditing(true)}>
                编辑
              </button>
            </div>
            <div className="row" style={{ gap: 12 }}>
              <Avatar src={db.user.avatar} size={48} alt={db.user.nickname} />
              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{db.user.nickname}</div>
                <div className="small muted num">{db.user.phone} · 注册于 {fmtDateFull(db.user.createdAt)}</div>
              </div>
            </div>
            <div className="divider" />
            <dl className="kv">
              <dt>所在城市</dt>
              <dd>
                {db.user.city} · {db.user.district}
                <span className="tiny muted">（仅精确到行政区）</span>
              </dd>
              <dt>宠物数量</dt>
              <dd>{db.pets.length} 只</dd>
              <dt>我的分享</dt>
              <dd>{db.posts.filter((p) => p.mine).length} 条</dd>
            </dl>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <ShieldCheck size={16} /> 隐私
              </div>
            </div>
            <div className="stack" style={{ gap: 0 }}>
              <div className="task-row">
                <div className="task-icon">
                  <MessageSquare size={15} />
                </div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="task-title">允许关注者私信</div>
                  <div className="task-meta">默认关闭。开启后只有关注你的人可以发起对话，陌生人不行。</div>
                </div>
                <button
                  className={`chip${db.user.dmEnabled ? ' active' : ''}`}
                  onClick={async () => {
                    await api.updateSettings({ dmEnabled: !db.user.dmEnabled })
                    toast(db.user.dmEnabled ? '已关闭私信' : '已开启关注者私信', 'success')
                  }}
                >
                  {db.user.dmEnabled ? '已开启' : '已关闭'}
                </button>
              </div>
              <div className="task-row">
                <div className="task-icon">
                  <Lock size={15} />
                </div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="task-title">健康记录默认私密</div>
                  <div className="task-meta">固定开启，任何分享都需要你手动选择可见范围。</div>
                </div>
                <span className="badge badge-brand">始终开启</span>
              </div>
              <div className="task-row">
                <div className="task-icon">
                  <MapPin size={15} />
                </div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="task-title">精确位置</div>
                  <div className="task-meta">不采集、不展示。同城内容只使用城市与行政区。</div>
                </div>
                <span className="badge badge-gray">不采集</span>
              </div>
              <div className="task-row">
                <div className="task-icon">
                  <BellOff size={15} />
                </div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="task-title">健康数据不用于广告</div>
                  <div className="task-meta">不会根据体重、就诊等记录生成广告画像。</div>
                </div>
                <span className="badge badge-gray">不开启</span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <FileJson size={16} /> 数据
              </div>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <button className="btn btn-block" style={{ justifyContent: 'flex-start' }} onClick={exportAll}>
                <Download size={15} /> 导出我的全部数据（JSON）
              </button>
              <button className="btn btn-block" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/health')}>
                <Download size={15} /> 导出近半年看诊摘要
              </button>
              <button className="btn btn-block" style={{ justifyContent: 'flex-start' }} onClick={() => setConfirm('reset')}>
                <RefreshCw size={15} /> 重置为演示数据
              </button>
              <button
                className="btn btn-block"
                style={{ justifyContent: 'flex-start', color: '#bd4f2f', borderColor: '#f3d6cb' }}
                onClick={() => setConfirm('wipe')}
              >
                <Trash2 size={15} /> 注销账号并删除全部数据
              </button>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <AlertTriangle size={16} /> 已拉黑用户
              </div>
              <span className="card-hint">{db.blocked.length} 人</span>
            </div>
            {db.blocked.length === 0 ? (
              <div className="small muted">还没有拉黑任何人。在同城内容右上角的菜单里可以拉黑。</div>
            ) : (
              db.blocked.map((b) => (
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
              ))
            )}
          </section>
        </div>

        <aside className="side-col stack">
          <section className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>
              <ShieldCheck size={16} /> 我们如何对待你的数据
            </div>
            <ul className="small muted" style={{ lineHeight: 1.85, paddingLeft: 2 }}>
              <li>· 健康记录默认只有你自己可见</li>
              <li>· 不采集精确坐标，不做实时距离</li>
              <li>· 不用健康数据做广告画像</li>
              <li>· 可随时导出或删除全部数据</li>
              <li>· 医疗内容一律标注不替代兽医建议</li>
            </ul>
          </section>

          <section className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>
              <LogOut size={16} /> 当前登录
            </div>
            <div className="small muted" style={{ lineHeight: 1.7 }}>
              演示账号：{db.user.nickname}
              <br />
              数据保存在本机浏览器，刷新后仍在。
            </div>
            <button
              className="btn btn-block btn-sm"
              style={{ marginTop: 10 }}
              onClick={async () => {
                await api.logout()
                navigate('/login')
              }}
            >
              退出登录
            </button>
          </section>

          <section className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>
              <ChevronRight size={16} /> 版本
            </div>
            <div className="small muted">爪迹 v1.0 · 原型版本</div>
            <div className="tiny muted" style={{ marginTop: 4 }}>
              当前为可交互原型，数据保存在本地；接口已集中封装，可替换为真实后端。
            </div>
          </section>
        </aside>
      </div>

      <Sheet
        open={editing}
        onClose={() => setEditing(false)}
        title="编辑账号信息"
        footer={
          <>
            <button className="btn" onClick={() => setEditing(false)}>
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={async () => {
                if (!nickname.trim()) {
                  toast('昵称不能为空', 'error')
                  return
                }
                await api.updateSettings({ nickname: nickname.trim(), city, district })
                setEditing(false)
                toast('账号信息已更新', 'success')
              }}
            >
              保存
            </button>
          </>
        }
      >
        <div className="stack">
          <div className="field">
            <label htmlFor="nick">昵称</label>
            <input id="nick" className="input" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="city">城市</label>
            <select id="city" className="select" value={city} onChange={(e) => setCity(e.target.value)}>
              {['杭州', '上海', '北京', '成都', '广州', '深圳'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="district">行政区</label>
            <select id="district" className="select" value={district} onChange={(e) => setDistrict(e.target.value)}>
              {(city === '杭州' ? ['西湖区', '拱墅区', '滨江区', '上城区', '余杭区'] : ['中心城区', '东部城区', '西部城区']).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <div className="tiny muted">同城内容只显示到这一级，不需要填写具体地址。</div>
          </div>
        </div>
      </Sheet>

      <ConfirmSheet
        open={confirm === 'reset'}
        title="重置为演示数据？"
        text="当前的宠物、记录和分享会被替换为示例数据，此操作无法撤销。"
        confirmLabel="重置"
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          setBusy(true)
          await api.resetDemo()
          setBusy(false)
          setConfirm(null)
          toast('已恢复演示数据', 'success')
          navigate('/')
        }}
      />

      <ConfirmSheet
        open={confirm === 'wipe'}
        title="注销账号并删除全部数据？"
        text="你的宠物档案、健康记录、提醒和分享都会被永久删除，无法恢复。建议先导出数据。"
        confirmLabel={busy ? '删除中…' : '确认注销'}
        danger
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          setBusy(true)
          await api.wipeAll()
          setBusy(false)
          setConfirm(null)
          toast('账号已注销，本地数据已清空', 'success')
          navigate('/login')
        }}
      />
    </div>
  )
}
