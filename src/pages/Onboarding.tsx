import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cat, Dog, ArrowRight, ArrowLeft, CheckCircle2, Scale, Camera, Sparkles, AlertTriangle, Plus } from 'lucide-react'
import { useApp } from '../store'
import { api } from '../lib/api'
import { Avatar } from '../components/ui'
import { ageText, todayISO } from '../lib/format'

const avatarMap = {
  cat: ['img/avatar-cat.svg', 'img/avatar-cat-2.svg'],
  dog: ['img/avatar-dog.svg', 'img/avatar-dog-2.svg'],
}

export function Onboarding() {
  const { pets, toast, openRecord, db } = useApp()
  const navigate = useNavigate()
  const isFirst = pets.length === 0

  const [species, setSpecies] = useState<'cat' | 'dog'>('cat')
  const [name, setName] = useState('')
  const [dateType, setDateType] = useState<'birthday' | 'gotcha'>('birthday')
  const [date, setDate] = useState('')
  const [avatar, setAvatar] = useState(avatarMap.cat[0])
  const [breed, setBreed] = useState('')
  const [neutered, setNeutered] = useState<'yes' | 'no' | 'unknown'>('unknown')
  const [allergies, setAllergies] = useState('')
  const [hospital, setHospital] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null)

  const submit = async () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = '给毛孩子起个名字吧'
    else if (name.trim().length > 12) e.name = '名字最多 12 个字'
    if (!date) e.date = dateType === 'birthday' ? '请选择生日（记不清可以填大概日期）' : '请选择到家日'
    else if (date > todayISO()) e.date = '日期不能晚于今天'
    setErrors(e)
    if (Object.keys(e).length) {
      toast('还有必填信息没有填完', 'error')
      return
    }
    setSaving(true)
    try {
      const pet = await api.createPet({
        name,
        species,
        breed,
        dateType,
        date,
        avatar,
        neutered,
        allergies,
        hospital,
        emergencyContact,
      })
      setCreated({ id: pet.id, name: pet.name })
      toast(`${pet.name} 的档案已创建`, 'success')
    } catch {
      toast('创建失败，请稍后再试', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (created) {
    return (
      <div className="content" style={{ maxWidth: 620 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="row" style={{ gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#eaf4f1',
                color: '#0e6b5c',
                display: 'grid',
                placeItems: 'center',
                flex: 'none',
              }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{created.name} 的档案已建好</div>
              <div className="small muted">接下来记录第一条，档案就开始生长了。</div>
            </div>
          </div>

          <div className="notice" style={{ marginTop: 14 }}>
            <Sparkles size={14} style={{ flex: 'none', marginTop: 2 }} />
            <span>建议先记下今天的样子或当前体重，之后每次记录都会自动连成时间线。</span>
          </div>

          <div className="stack" style={{ marginTop: 14 }}>
            <button className="card" style={{ textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center' }} onClick={() => { navigate('/'); openRecord('photo') }}>
              <div className="task-icon">
                <Camera size={17} />
              </div>
              <div className="grow">
                <div style={{ fontWeight: 600, fontSize: 14 }}>记录今天的样子</div>
                <div className="small muted">拍一张照片，作为时间线的起点</div>
              </div>
              <ArrowRight size={16} className="muted" />
            </button>
            <button className="card" style={{ textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center' }} onClick={() => { navigate('/'); openRecord('weight') }}>
              <div className="task-icon">
                <Scale size={17} />
              </div>
              <div className="grow">
                <div style={{ fontWeight: 600, fontSize: 14 }}>记录当前体重</div>
                <div className="small muted">只需要一个数字，之后能看到趋势</div>
              </div>
              <ArrowRight size={16} className="muted" />
            </button>
          </div>

          <div className="row-between" style={{ marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => navigate('/')}>
              稍后再说
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              进入首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content" style={{ maxWidth: 620 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">{isFirst ? '创建宠物档案' : '添加另一只宠物'}</h1>
          <div className="page-sub">必填只有 4 项，其余随时可以补</div>
        </div>
        {!isFirst && (
          <button className="btn btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> 返回
          </button>
        )}
      </div>

      <div className="onb-step">
        <span className="bar on" />
        <span className="bar" />
        <span>第 1 步 · 基本信息（必填）</span>
      </div>

      <div className="card stack">
        <div className="field">
          <span className="field-label">宠物类型<span style={{ color: '#d96340' }}>*</span></span>
          <div className="seg">
            <button
              className={species === 'cat' ? 'on' : ''}
              onClick={() => {
                setSpecies('cat')
                setAvatar(avatarMap.cat[0])
              }}
            >
              <Cat size={15} /> 猫
            </button>
            <button
              className={species === 'dog' ? 'on' : ''}
              onClick={() => {
                setSpecies('dog')
                setAvatar(avatarMap.dog[0])
              }}
            >
              <Dog size={15} /> 狗
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="pet-name">名字<span style={{ color: '#d96340' }}>*</span></label>
          <input
            id="pet-name"
            className={`input ${errors.name ? 'err' : ''}`}
            placeholder="例如 团子"
            value={name}
            maxLength={14}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <div className="err-text"><AlertTriangle size={12} />{errors.name}</div>}
        </div>

        <div className="field">
          <span className="field-label">日期<span style={{ color: '#d96340' }}>*</span></span>
          <div className="seg" style={{ marginBottom: 8 }}>
            <button className={dateType === 'birthday' ? 'on' : ''} onClick={() => setDateType('birthday')}>
              生日
            </button>
            <button className={dateType === 'gotcha' ? 'on' : ''} onClick={() => setDateType('gotcha')}>
              到家日
            </button>
          </div>
          <input
            type="date"
            className={`input ${errors.date ? 'err' : ''}`}
            max={todayISO()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.date ? (
            <div className="err-text"><AlertTriangle size={12} />{errors.date}</div>
          ) : (
            <div className="tiny muted">
              {date ? `${dateType === 'birthday' ? '现在' : '到家'} ${ageText(date)}` : '不确定具体日期的话，填一个大概的日子也可以'}
            </div>
          )}
        </div>

        <div className="field">
          <span className="field-label">头像<span style={{ color: '#d96340' }}>*</span></span>
          <div className="avatar-pick">
            {[...avatarMap.cat, ...avatarMap.dog].map((a) => (
              <button key={a} className={`avatar-opt${avatar === a ? ' on' : ''}`} onClick={() => setAvatar(a)} aria-label="选择头像">
                <img src={a} alt="" />
              </button>
            ))}
          </div>
          <div className="tiny muted">先用一张占位头像，之后可以换成真实照片。</div>
        </div>

        <div>
          <button className="btn btn-sm btn-ghost" onClick={() => setShowMore((v) => !v)} style={{ paddingLeft: 0 }}>
            <Plus size={14} style={{ transform: showMore ? 'rotate(45deg)' : 'none', transition: 'transform .15s' }} />
            {showMore ? '收起补充信息' : '补充更多信息（选填）'}
          </button>
        </div>

        {showMore && (
          <div className="form-grid">
            <div className="field">
              <label htmlFor="breed">品种</label>
              <input id="breed" className="input" placeholder="例如 英国短毛猫" value={breed} onChange={(e) => setBreed(e.target.value)} />
            </div>
            <div className="field">
              <span className="field-label">绝育情况</span>
              <select className="select" value={neutered} onChange={(e) => setNeutered(e.target.value as typeof neutered)}>
                <option value="unknown">暂不确定</option>
                <option value="yes">已绝育</option>
                <option value="no">未绝育</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="allergy">过敏信息</label>
              <input id="allergy" className="input" placeholder="例如 鸡肉轻微过敏" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="hospital">常去医院</label>
              <input id="hospital" className="input" placeholder="例如 安安宠物医院" value={hospital} onChange={(e) => setHospital(e.target.value)} />
            </div>
            <div className="field span2">
              <label htmlFor="em">紧急联系</label>
              <input id="em" className="input" placeholder="例如 139****2210 · 妈妈" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
            </div>
          </div>
        )}

        <div className="row-between" style={{ marginTop: 2 }}>
          <span className="tiny muted">
            {db?.user.nickname} · {db?.user.city} · {db?.user.district}
          </span>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? '创建中…' : '创建档案'}
            {!saving && <ArrowRight size={15} />}
          </button>
        </div>
      </div>

      <div className="row small muted" style={{ marginTop: 12, gap: 6 }}>
        <CheckCircle2 size={13} /> 档案默认只有你自己可见，不会自动公开到同城。
      </div>
    </div>
  )
}
