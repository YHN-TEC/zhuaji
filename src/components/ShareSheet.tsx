import { useEffect, useMemo, useState } from 'react'
import { Eye, MapPin, Users, Lock, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { api } from '../lib/api'
import type { Visibility } from '../types'
import { Sheet, Avatar } from './ui'
import { fmtDate, signed } from '../lib/format'

const scopeOptions: { key: Visibility; label: string; desc: string; icon: typeof Lock }[] = [
  { key: 'private', label: '仅自己可见', desc: '默认选项，不发布到任何地方', icon: Lock },
  { key: 'local', label: '同城可见', desc: '仅显示城市与行政区，不展示精确位置', icon: MapPin },
  { key: 'followers', label: '关注者可见', desc: '只有关注你的人能在同城看到', icon: Users },
]

export function ShareSheet() {
  const { share, closeShare, pet, db, toast } = useApp()
  const navigate = useNavigate()
  const [scope, setScope] = useState<Visibility>('private')
  const [content, setContent] = useState('')
  const [withImage, setWithImage] = useState(true)
  const [hideLocation, setHideLocation] = useState(true)
  const [publishing, setPublishing] = useState(false)

  const event = share.event
  const petName = pet?.name ?? '毛孩子'

  const defaultText = useMemo(() => {
    if (!event) return ''
    switch (event.type) {
      case 'weight':
        return `${petName} 今天称了体重：${event.weight?.toFixed(1)} kg。坚持记录第 ${db?.events.filter((e) => e.petId === event.petId && e.type === 'weight').length ?? 1} 次，趋势看得见了。`
      case 'vaccine':
        return `${petName} 今天完成了${event.vaccineName ?? '疫苗'}，在${event.hospital ?? '常去的医院'}，接种后观察了 30 分钟，一切正常。`
      case 'deworm':
        return `${petName} 今天做了${event.dewormKind === 'inner' ? '体内' : event.dewormKind === 'outer' ? '体外' : '体内外'}驱虫，下次提醒已经设好了。`
      case 'visit':
        return `${petName} 今天去了医院：${event.reason ?? '例行检查'}。把情况记下来，复诊时可以直接给医生看。`
      default:
        return `${petName}：${event.title}${event.note ? `，${event.note}` : ''}`
    }
  }, [event, petName, db])

  useEffect(() => {
    if (share.open) {
      setScope('private')
      setContent(defaultText)
      setWithImage(Boolean(event?.photo))
      setHideLocation(true)
      setPublishing(false)
    }
  }, [share.open, defaultText, event])

  if (!event) return null

  const publish = async () => {
    if (!content.trim()) {
      toast('分享文案不能为空', 'error')
      return
    }
    if (scope === 'private') {
      closeShare()
      toast('已保存为仅自己可见的分享卡，没有发布到同城', 'info')
      return
    }
    setPublishing(true)
    try {
      await api.createPost({
        content: content.trim(),
        images: withImage && event.photo ? [event.photo] : [],
        visibility: scope,
        fromEventId: event.id,
        tags: [event.type === 'visit' ? '就诊记录' : '成长记录', pet?.breed ?? ''],
        medical: event.type === 'visit',
      })
      closeShare()
      toast('已分享到同城，位置只显示到行政区', 'success', {
        label: '去看看',
        onClick: () => navigate('/local'),
      })
    } catch {
      toast('分享失败，请稍后再试', 'error')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Sheet
      open={share.open}
      onClose={closeShare}
      title="分享这次记录"
      subtitle="先选可见范围，再确认发布"
      footer={
        <>
          <button className="btn" onClick={closeShare} disabled={publishing}>
            取消
          </button>
          <button className="btn btn-primary" onClick={publish} disabled={publishing}>
            {publishing ? '处理中…' : scope === 'private' ? '保存为私密' : '确认分享'}
          </button>
        </>
      }
    >
      <div className="share-card" style={{ marginBottom: 14 }}>
        <div className="share-card-top">
          <Avatar src={pet?.avatar ?? 'img/paw.svg'} size={36} alt={petName} />
          <div className="grow" style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{petName}</div>
            <div className="tiny muted">
              {pet?.breed ?? '宠物'} · {fmtDate(event.date)}
            </div>
          </div>
          <span className="badge badge-brand">成长记录</span>
        </div>
        <div className="share-card-body">
          <div className="share-card-title">{event.title}</div>
          {event.type === 'weight' && (
            <div className="row" style={{ marginTop: 4, gap: 6 }}>
              <span className="num" style={{ fontSize: 20, fontWeight: 600 }}>
                {event.weight?.toFixed(1)}
                <span style={{ fontSize: 12, fontWeight: 500, color: '#6d7d77' }}> kg</span>
              </span>
              {event.note && <span className="small muted clamp2">{event.note}</span>}
            </div>
          )}
          {event.type !== 'weight' && (
            <div className="share-card-note">
              {[event.vaccineName, event.medicine, event.hospital, event.note].filter(Boolean).join(' · ') || '已记录到成长档案'}
            </div>
          )}
        </div>
        {withImage && event.photo && <img className="share-card-img" src={event.photo} alt="记录照片" />}
        <div className="share-foot-brand">
          <span>来自「爪迹」成长与健康档案</span>
          <span>{db?.user.city} · {hideLocation ? '位置已隐藏' : db?.user.district}</span>
        </div>
      </div>

      <div className="field" style={{ marginBottom: 12 }}>
        <label htmlFor="share-text">分享文案</label>
        <textarea
          id="share-text"
          className="textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ minHeight: 76 }}
          maxLength={280}
        />
        <div className="tiny muted" style={{ textAlign: 'right' }}>{content.length}/280</div>
      </div>

      <div className="field" style={{ marginBottom: 12 }}>
        <span className="field-label">可见范围<span style={{ color: '#d96340' }}>*</span></span>
        <div className="radio-row">
          {scopeOptions.map((o) => (
            <label key={o.key} className={`check${scope === o.key ? ' on' : ''}`}>
              <input type="radio" name="scope" checked={scope === o.key} onChange={() => setScope(o.key)} />
              <div style={{ minWidth: 0 }}>
                <div className="row" style={{ gap: 5, fontSize: 13, fontWeight: 500 }}>
                  <o.icon size={13} /> {o.label}
                  {o.key === 'private' && <span className="tag">默认</span>}
                </div>
                <div className="tiny muted" style={{ marginTop: 1 }}>{o.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <label className="check" style={{ marginBottom: 8 }}>
        <input type="checkbox" checked={hideLocation} onChange={(e) => setHideLocation(e.target.checked)} />
        <div>
          <div style={{ fontSize: 13 }}>隐藏具体位置</div>
          <div className="tiny muted">爪迹不采集精确坐标，只使用你填写的城市与行政区。</div>
        </div>
      </label>

      {event.photo && (
        <label className="check">
          <input type="checkbox" checked={withImage} onChange={(e) => setWithImage(e.target.checked)} />
          <div>
            <div style={{ fontSize: 13 }}>附带记录照片</div>
            <div className="tiny muted">照片会一起出现在同城动态中。</div>
          </div>
        </label>
      )}

      {event.type === 'visit' && (
        <div className="disclaimer" style={{ marginTop: 12 }}>
          <AlertTriangle size={13} style={{ flex: 'none', marginTop: 1 }} />
          <span>就诊内容属于个人记录，发布后会自动附带「个人经验，不替代兽医建议」的提示。</span>
        </div>
      )}

      <div className="row small muted" style={{ marginTop: 12, gap: 5 }}>
        <ShieldCheck size={13} /> 健康记录默认私密，只有你主动选择范围后才会公开
      </div>
      {scope !== 'private' && (
        <div className="notice" style={{ marginTop: 10 }}>
          <Eye size={14} style={{ flex: 'none', marginTop: 2 }} />
          <span>发布后显示为「{db?.user.city} · {db?.user.district}」，不会出现小区或街道名称。</span>
        </div>
      )}
    </Sheet>
  )
}
