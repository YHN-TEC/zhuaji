import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  Scale,
  Syringe,
  Bug,
  Stethoscope,
  Camera,
  Plus,
  CheckCircle2,
  AlertTriangle,
  BellPlus,
  ImagePlus,
  Wand2,
  ArrowRight,
} from 'lucide-react'
import { useApp } from '../store'
import { api } from '../lib/api'
import type { CareEvent, CareEventType } from '../types'
import { Sheet, EventIcon } from './ui'
import { addMonths, fmtDate, signed, todayISO } from '../lib/format'
import { fileToDataUrl } from '../lib/image'

const types: { key: CareEventType; label: string }[] = [
  { key: 'weight', label: '体重' },
  { key: 'vaccine', label: '疫苗' },
  { key: 'deworm', label: '驱虫' },
  { key: 'visit', label: '就诊' },
  { key: 'photo', label: '照片' },
]

const vaccinePresets = ['猫三联', '狂犬疫苗', '犬四联', '犬八联', '体内外驱虫']

export function QuickRecord() {
  const { record, closeRecord, pet, db, toast, openShare } = useApp()
  const open = record.open
  const [type, setType] = useState<CareEventType>(record.type)
  const [date, setDate] = useState(todayISO())
  const [weight, setWeight] = useState('')
  const [vaccineName, setVaccineName] = useState('')
  const [hospital, setHospital] = useState('')
  const [nextDate, setNextDate] = useState('')
  const [dewormKind, setDewormKind] = useState<'inner' | 'outer' | 'both'>('outer')
  const [medicine, setMedicine] = useState('')
  const [reason, setReason] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [cost, setCost] = useState('')
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState('')
  const [title, setTitle] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ event: CareEvent; prevWeight?: number; delta?: number } | null>(null)
  const [reminderDate, setReminderDate] = useState('')
  const [reminderSaved, setReminderSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const lastSameType = useMemo(() => {
    if (!db || !pet) return undefined
    return db.events
      .filter((e) => e.petId === pet.id && e.type === type)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0]
  }, [db, pet, type])

  useEffect(() => {
    if (!open) return
    setType(record.type)
    setDate(todayISO())
    setWeight('')
    setVaccineName('')
    setHospital(pet?.hospital ?? '')
    setNextDate('')
    setDewormKind('outer')
    setMedicine('')
    setReason('')
    setDiagnosis('')
    setCost('')
    setNote('')
    setPhoto('')
    setTitle('')
    setErrors({})
    setResult(null)
    setReminderDate('')
    setReminderSaved(false)
    setSaving(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record.type])

  const reuseLast = () => {
    if (!lastSameType) {
      toast('这类记录还没有历史内容可以沿用', 'info')
      return
    }
    if (type === 'vaccine') {
      setVaccineName(lastSameType.vaccineName ?? '')
      setHospital(lastSameType.hospital ?? hospital)
      setNextDate(lastSameType.date ? addMonths(lastSameType.date, 12) : '')
    }
    if (type === 'deworm') {
      setDewormKind(lastSameType.dewormKind ?? 'outer')
      setMedicine(lastSameType.medicine ?? '')
      setNextDate(addMonths(todayISO(), 3))
    }
    if (type === 'visit') {
      setHospital(lastSameType.hospital ?? hospital)
      setDiagnosis(lastSameType.diagnosis ?? '')
      setMedicine(lastSameType.medicine ?? '')
    }
    setNote(lastSameType.note ?? '')
    toast(`已沿用 ${fmtDate(lastSameType.date)} 的记录内容`, 'info')
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!date) e.date = '请选择日期'
    if (date > todayISO()) e.date = '记录日期不能晚于今天'
    if (type === 'weight') {
      const n = Number(weight)
      if (!weight.trim()) e.weight = '请填写体重数值'
      else if (Number.isNaN(n) || n <= 0) e.weight = '体重需要是大于 0 的数字'
      else if (n > 90) e.weight = '请确认单位是公斤（kg）'
    }
    if (type === 'vaccine' && !vaccineName.trim()) e.vaccineName = '请填写或选择疫苗类型'
    if (type === 'visit' && !reason.trim()) e.reason = '请简单说明就诊原因'
    if (type === 'photo' && !photo) e.photo = '请先添加一张照片'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = async () => {
    if (!pet) return
    if (!validate()) {
      toast('还有必填项没有完成', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await api.addEvent({
        petId: pet.id,
        type,
        date,
        weight: type === 'weight' ? Number(Number(weight).toFixed(1)) : undefined,
        vaccineName: type === 'vaccine' ? vaccineName.trim() : undefined,
        hospital: type === 'vaccine' || type === 'visit' ? hospital.trim() || undefined : undefined,
        dewormKind: type === 'deworm' ? dewormKind : undefined,
        medicine: type === 'deworm' || type === 'visit' ? medicine.trim() || undefined : undefined,
        reason: type === 'visit' ? reason.trim() : undefined,
        diagnosis: type === 'visit' ? diagnosis.trim() || undefined : undefined,
        cost: type === 'visit' && cost ? Number(cost) : undefined,
        note: note.trim() || undefined,
        photo: type === 'photo' ? photo : photo || undefined,
        title: type === 'photo' ? title.trim() || '照片记录' : undefined,
      })
      setResult(res)
      setReminderDate(
        type === 'vaccine' ? addMonths(date, 12) : type === 'deworm' ? addMonths(date, 3) : nextDate || '',
      )
      if (type === 'weight') toast('体重已记录，趋势图已更新', 'success')
      else toast('记录已保存到时间线', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : '保存失败，请稍后重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveReminder = async () => {
    if (!pet || !result) return
    if (!reminderDate) {
      toast('请选择提醒日期', 'error')
      return
    }
    await api.addReminder({
      petId: pet.id,
      kind: type === 'vaccine' ? 'vaccine' : 'deworm',
      title:
        type === 'vaccine'
          ? `${result.event.vaccineName ?? '疫苗'} 加强`
          : `驱虫 · ${result.event.medicine ?? (dewormKind === 'inner' ? '体内' : dewormKind === 'outer' ? '体外' : '体内外')}`,
      dueDate: reminderDate,
      sourceEventId: result.event.id,
    })
    setReminderSaved(true)
    toast(`已设置 ${fmtDate(reminderDate)} 的提醒`, 'success')
  }

  const pickPhoto = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('请选择图片文件', 'error')
      return
    }
    try {
      const url = await fileToDataUrl(file)
      setPhoto(url)
      setErrors((e) => ({ ...e, photo: '' }))
    } catch {
      toast('图片处理失败，请换一张试试', 'error')
    }
  }

  const done = () => {
    closeRecord()
    setResult(null)
  }

  return (
    <Sheet
      open={open}
      onClose={closeRecord}
      title={result ? '记录完成' : '快捷记录'}
      subtitle={result ? `${pet?.name} · ${fmtDate(result.event.date)}` : `为 ${pet?.name ?? '宠物'} 添加一条记录，必填项很少`}
      footer={
        result ? (
          <>
            <button className="btn" onClick={done}>
              完成
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                const ev = result.event
                closeRecord()
                setResult(null)
                openShare(ev)
              }}
            >
              分享这次记录
            </button>
          </>
        ) : (
          <>
            <button className="btn" onClick={closeRecord} disabled={saving}>
              取消
            </button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? '保存中…' : '保存记录'}
            </button>
          </>
        )
      }
    >
      {!result ? (
        <>
          <div className="type-tabs" role="tablist" aria-label="记录类型">
            {types.map((t) => (
              <button
                key={t.key}
                className={`type-tab ${type === t.key ? 'on' : ''} ${t.key === 'visit' ? 'visit' : ''}`}
                onClick={() => {
                  setType(t.key)
                  setErrors({})
                }}
                role="tab"
                aria-selected={type === t.key}
              >
                <EventIcon type={t.key} size={16} />
                {t.label}
              </button>
            ))}
          </div>

          {(type === 'vaccine' || type === 'deworm' || type === 'visit') && lastSameType && (
            <button className="btn btn-sm btn-soft" style={{ marginBottom: 12 }} onClick={reuseLast}>
              <Wand2 size={13} /> 沿用上次信息（{fmtDate(lastSameType.date)}）
            </button>
          )}

          {type === 'weight' && (
            <div className="form-grid">
              <div className="field">
                <label htmlFor="w">体重（kg）<span style={{ color: '#d96340' }}>*</span></label>
                <input
                  id="w"
                  className={`input ${errors.weight ? 'err' : ''}`}
                  inputMode="decimal"
                  placeholder="例如 5.8"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                {errors.weight ? (
                  <div className="err-text"><AlertTriangle size={12} />{errors.weight}</div>
                ) : (
                  <div className="tiny muted">保留一位小数即可</div>
                )}
              </div>
              <div className="field">
                <label htmlFor="d1">测量日期<span style={{ color: '#d96340' }}>*</span></label>
                <input id="d1" type="date" className={`input ${errors.date ? 'err' : ''}`} max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
                {errors.date && <div className="err-text"><AlertTriangle size={12} />{errors.date}</div>}
              </div>
              <div className="field span2">
                <span className="field-label">照片 / 备注 <span className="opt">选填，可后补</span></span>
                <PhotoPicker photo={photo} setPhoto={setPhoto} fileRef={fileRef} onPick={pickPhoto} />
                <textarea className="textarea" style={{ minHeight: 64 }} placeholder="例如：最近饭量变好，医生说保持这个节奏" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
          )}

          {type === 'vaccine' && (
            <div className="form-grid">
              <div className="field span2">
                <label htmlFor="vn">疫苗类型<span style={{ color: '#d96340' }}>*</span></label>
                <div className="chip-row" style={{ marginBottom: 2 }}>
                  {vaccinePresets.slice(0, 4).map((v) => (
                    <button key={v} className={`chip${vaccineName === v ? ' active' : ''}`} onClick={() => setVaccineName(v)}>
                      {v}
                    </button>
                  ))}
                </div>
                <input id="vn" className={`input ${errors.vaccineName ? 'err' : ''}`} placeholder="例如 猫三联（妙三多）" value={vaccineName} onChange={(e) => setVaccineName(e.target.value)} />
                {errors.vaccineName && <div className="err-text"><AlertTriangle size={12} />{errors.vaccineName}</div>}
              </div>
              <div className="field">
                <label htmlFor="d2">接种日期<span style={{ color: '#d96340' }}>*</span></label>
                <input id="d2" type="date" className={`input ${errors.date ? 'err' : ''}`} max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
                {errors.date && <div className="err-text"><AlertTriangle size={12} />{errors.date}</div>}
              </div>
              <div className="field">
                <label htmlFor="h1">医院 <span className="opt">选填</span></label>
                <input id="h1" className="input" placeholder="常去医院会自动带入" value={hospital} onChange={(e) => setHospital(e.target.value)} />
              </div>
              <div className="field span2">
                <span className="field-label">疫苗凭证 <span className="opt">选填</span></span>
                <PhotoPicker photo={photo} setPhoto={setPhoto} fileRef={fileRef} onPick={pickPhoto} label="上传凭证照片" />
              </div>
              <div className="field span2">
                <label htmlFor="n1">备注 <span className="opt">选填</span></label>
                <textarea id="n1" className="textarea" style={{ minHeight: 60 }} placeholder="接种后观察情况、批次号等" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
          )}

          {type === 'deworm' && (
            <div className="form-grid">
              <div className="field span2">
                <span className="field-label">驱虫类型<span style={{ color: '#d96340' }}>*</span></span>
                <div className="seg">
                  {[
                    ['inner', '体内'],
                    ['outer', '体外'],
                    ['both', '体内外同驱'],
                  ].map(([k, label]) => (
                    <button key={k} className={dewormKind === k ? 'on' : ''} onClick={() => setDewormKind(k as typeof dewormKind)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="d3">用药日期<span style={{ color: '#d96340' }}>*</span></label>
                <input id="d3" type="date" className={`input ${errors.date ? 'err' : ''}`} max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
                {errors.date && <div className="err-text"><AlertTriangle size={12} />{errors.date}</div>}
              </div>
              <div className="field">
                <label htmlFor="m1">药品 <span className="opt">选填</span></label>
                <input id="m1" className="input" placeholder="例如 大宠爱" value={medicine} onChange={(e) => setMedicine(e.target.value)} />
              </div>
              <div className="field span2">
                <label htmlFor="n2">备注 <span className="opt">选填</span></label>
                <textarea id="n2" className="textarea" style={{ minHeight: 60 }} placeholder="例如：滴在后颈，48 小时内不洗澡" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
          )}

          {type === 'visit' && (
            <div className="form-grid">
              <div className="field span2">
                <label htmlFor="r1">就诊原因<span style={{ color: '#d96340' }}>*</span></label>
                <input id="r1" className={`input ${errors.reason ? 'err' : ''}`} placeholder="例如：连续两天早上呕吐" value={reason} onChange={(e) => setReason(e.target.value)} />
                {errors.reason && <div className="err-text"><AlertTriangle size={12} />{errors.reason}</div>}
              </div>
              <div className="field">
                <label htmlFor="d4">就诊日期<span style={{ color: '#d96340' }}>*</span></label>
                <input id="d4" type="date" className={`input ${errors.date ? 'err' : ''}`} max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
                {errors.date && <div className="err-text"><AlertTriangle size={12} />{errors.date}</div>}
              </div>
              <div className="field">
                <label htmlFor="h2">医院 <span className="opt">选填</span></label>
                <input id="h2" className="input" value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="例如 安安宠物医院" />
              </div>
              <div className="field span2">
                <label htmlFor="dg">诊断摘要 <span className="opt">照抄医生记录，不做判断</span></label>
                <textarea id="dg" className="textarea" style={{ minHeight: 60 }} placeholder="医生怎么说的，就怎么记" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="m2">用药 <span className="opt">选填</span></label>
                <input id="m2" className="input" placeholder="例如 益生菌 5 天" value={medicine} onChange={(e) => setMedicine(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="c1">费用（元）<span className="opt">选填</span></label>
                <input id="c1" className="input" inputMode="numeric" placeholder="例如 380" value={cost} onChange={(e) => setCost(e.target.value)} />
              </div>
              <div className="field span2">
                <span className="field-label">病历 / 检查单 <span className="opt">选填</span></span>
                <PhotoPicker photo={photo} setPhoto={setPhoto} fileRef={fileRef} onPick={pickPhoto} label="上传附件照片" />
              </div>
            </div>
          )}

          {type === 'photo' && (
            <div className="form-grid">
              <div className="field span2">
                <span className="field-label">照片<span style={{ color: '#d96340' }}>*</span></span>
                <PhotoPicker photo={photo} setPhoto={setPhoto} fileRef={fileRef} onPick={pickPhoto} large error={errors.photo} />
                {errors.photo && <div className="err-text"><AlertTriangle size={12} />{errors.photo}</div>}
              </div>
              <div className="field">
                <label htmlFor="t1">标题 <span className="opt">选填</span></label>
                <input id="t1" className="input" placeholder="例如：第一次学会握手" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="d5">日期<span style={{ color: '#d96340' }}>*</span></label>
                <input id="d5" type="date" className={`input ${errors.date ? 'err' : ''}`} max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
                {errors.date && <div className="err-text"><AlertTriangle size={12} />{errors.date}</div>}
              </div>
              <div className="field span2">
                <label htmlFor="n3">备注 <span className="opt">选填</span></label>
                <textarea id="n3" className="textarea" style={{ minHeight: 60 }} placeholder="记一句当时的心情" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
          )}

          <div className="notice" style={{ marginTop: 14 }}>
            <CheckCircle2 size={14} style={{ flex: 'none', marginTop: 2 }} />
            <span>这条记录默认只有你自己可见，稍后可以在时间线里选择是否分享到同城。</span>
          </div>
        </>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
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
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                {type === 'weight' ? '体重已更新到趋势图' : '已加入成长时间线'}
              </div>
              <div className="small muted">{fmtDate(result.event.date)} · {pet?.name}</div>
            </div>
          </div>

          {type === 'weight' && (
            <div className="card" style={{ background: '#f8fbfa', boxShadow: 'none' }}>
              <div className="row-between">
                <div>
                  <div className="tiny muted">本次体重</div>
                  <div className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px' }}>
                    {result.event.weight?.toFixed(1)}
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#6d7d77' }}> kg</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="tiny muted">相对上次</div>
                  {result.delta === undefined ? (
                    <div className="small muted">首次记录</div>
                  ) : (
                    <div
                      className="badge"
                      style={{
                        marginTop: 4,
                        background: Math.abs(result.delta) >= 0.5 ? '#fceee8' : '#eaf4f1',
                        color: Math.abs(result.delta) >= 0.5 ? '#bd4f2f' : '#08453c',
                      }}
                    >
                      {signed(result.delta)}
                    </div>
                  )}
                  {result.prevWeight !== undefined && <div className="tiny muted" style={{ marginTop: 4 }}>上次 {result.prevWeight.toFixed(1)} kg</div>}
                </div>
              </div>
            </div>
          )}

          {(type === 'vaccine' || type === 'deworm') && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-head" style={{ marginBottom: 8 }}>
                <div className="card-title">
                  <BellPlus size={16} /> 设置下次提醒
                </div>
                <span className="card-hint">{type === 'vaccine' ? '建议 12 个月后' : '建议 3 个月后'}</span>
              </div>
              {reminderSaved ? (
                <div className="notice">
                  <CheckCircle2 size={14} style={{ flex: 'none', marginTop: 2 }} />
                  <span>已设置 {fmtDate(reminderDate)} 的提醒，届时会出现在首页「今天需要关注」。</span>
                </div>
              ) : (
                <>
                  <div className="field">
                    <input type="date" className="input" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
                    <div className="row" style={{ gap: 6, marginTop: 2 }}>
                      <button className="chip" onClick={() => setReminderDate(addMonths(date, 12))}>
                        一年后
                      </button>
                      <button className="chip" onClick={() => setReminderDate(addMonths(date, 6))}>
                        半年后
                      </button>
                      <button className="chip" onClick={() => setReminderDate(addMonths(date, 3))}>
                        三个月后
                      </button>
                    </div>
                  </div>
                  <div className="row" style={{ marginTop: 10, gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={saveReminder}>
                      保存提醒
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setReminderSaved(false)}>
                      暂不需要
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {type === 'visit' && (
            <div className="notice warm" style={{ marginTop: 12 }}>
              <Stethoscope size={14} style={{ flex: 'none', marginTop: 2 }} />
              <span>就诊记录已进入健康档案，可以在健康页一键导出近半年摘要带去复诊。</span>
            </div>
          )}

          {type === 'photo' && (
            <div className="notice" style={{ marginTop: 12 }}>
              <Camera size={14} style={{ flex: 'none', marginTop: 2 }} />
              <span>照片默认私密。如果愿意，可以生成分享卡发到同城，记得选择可见范围。</span>
            </div>
          )}

          <div className="small muted" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowRight size={12} /> 记录已实时进入时间线，可在「健康」页查看趋势变化。
          </div>
        </div>
      )}
    </Sheet>
  )
}

function PhotoPicker({
  photo,
  setPhoto,
  fileRef,
  onPick,
  label = '添加照片',
  large = false,
  error,
}: {
  photo: string
  setPhoto: (v: string) => void
  fileRef: RefObject<HTMLInputElement>
  onPick: (f?: File) => void
  label?: string
  large?: boolean
  error?: string
}) {
  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          onPick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {photo ? (
        <div style={{ position: 'relative' }}>
          <img
            src={photo}
            alt="已选择的照片"
            style={{
              width: '100%',
              height: large ? 168 : 104,
              objectFit: 'cover',
              borderRadius: 6,
              border: error ? '1px solid #d96340' : '1px solid #e2e8e5',
            }}
          />
          <div className="row" style={{ marginTop: 6, gap: 6 }}>
            <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>
              <ImagePlus size={13} /> 换一张
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => setPhoto('')}>
              移除
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn"
          style={{ height: large ? 120 : 44, width: '100%', borderStyle: 'dashed' }}
          onClick={() => fileRef.current?.click()}
          type="button"
        >
          <Plus size={15} /> {label}
        </button>
      )}
    </div>
  )
}
