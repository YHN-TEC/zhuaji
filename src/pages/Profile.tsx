import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Pencil,
  Plus,
  Users,
  Phone,
  Hospital,
  AlertTriangle,
  Pill,
  Download,
  ChevronRight,
  ShieldCheck,
  Cat,
  Dog,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import { useApp } from '../store'
import { api } from '../lib/api'
import { Avatar, EmptyState, Sheet, Stat } from '../components/ui'
import { ageText, fmtDateFull, fmtWeight, signed, todayISO } from '../lib/format'
import { latestWeight, petEvents, weightChange } from '../lib/health'
import type { Pet } from '../types'

export function Profile() {
  const { db, pet, pets, toast, loading } = useApp()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const events = useMemo(() => petEvents(db, pet?.id), [db, pet?.id])

  if (loading || !db) {
    return (
      <div className="content">
        <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
      </div>
    )
  }
  if (!pet) {
    return (
      <div className="content">
        <EmptyState
          title="还没有宠物档案"
          text="创建档案后才能记录健康数据。"
          action={
            <button className="btn btn-primary" onClick={() => navigate('/onboarding')}>
              创建宠物档案
            </button>
          }
        />
      </div>
    )
  }

  const latest = latestWeight(events)
  const change = weightChange(events, 30)
  const visits = events.filter((e) => e.type === 'visit')
  const vaccines = events.filter((e) => e.type === 'vaccine')
  const photos = events.filter((e) => e.type === 'photo')
  const members = db.members.filter((m) => m.petId === pet.id)

  const removeEvent = async (id: string, title: string) => {
    setDeleting(id)
    await api.deleteEvent(id)
    setDeleting(null)
    toast(`已删除「${title}」这条记录`, 'success')
  }

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">档案</h1>
          <div className="page-sub">宠物资料、健康关键信息与共享成员</div>
        </div>
        <button className="btn btn-sm" onClick={() => navigate('/onboarding')}>
          <Plus size={14} /> 添加宠物
        </button>
      </div>

      <div className="cols">
        <div className="stack">
          <section className="card">
            <div className="profile-hero">
              <Avatar src={pet.avatar} size={72} square alt={pet.name} />
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="row" style={{ gap: 8 }}>
                  <span className="truncate" style={{ fontSize: 21, fontWeight: 600 }}>
                    {pet.name}
                  </span>
                  <span className="badge badge-brand">
                    {pet.species === 'cat' ? <Cat size={11} /> : <Dog size={11} />}
                    {pet.species === 'cat' ? '猫' : '狗'}
                  </span>
                </div>
                <div className="small muted" style={{ marginTop: 2 }}>
                  {pet.breed ?? '品种待补充'} · {ageText(pet.date)}
                </div>
                <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-sm" onClick={() => setEditOpen(true)}>
                    <Pencil size={13} /> 编辑资料
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => navigate('/health')}>
                    <Download size={13} /> 导出摘要
                  </button>
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="stat-row">
              <Stat label="当前体重" value={latest ? latest.weight.toFixed(1) : '—'} unit={latest ? 'kg' : ''} />
              <Stat label="近 30 天" value={change !== undefined ? signed(change) : '—'} />
              <Stat label="记录总数" value={`${events.length}`} unit="条" />
            </div>
            <div className="tiny muted" style={{ marginTop: 8 }}>
              体重状态只展示记录结果与变化，不判断是否健康。有疑问请咨询兽医。
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <ShieldCheck size={16} /> 健康关键信息
              </div>
              <span className="card-hint">看诊时可以直接给医生看</span>
            </div>
            <dl className="kv">
              <dt>过敏信息</dt>
              <dd>{pet.allergies ?? <span className="muted">未填写</span>}</dd>
              <dt>绝育情况</dt>
              <dd>{pet.neutered === 'yes' ? '已绝育' : pet.neutered === 'no' ? '未绝育' : <span className="muted">未填写</span>}</dd>
              <dt>长期用药</dt>
              <dd>
                {visits.filter((v) => v.medicine).slice(0, 2).map((v) => v.medicine).join('；') || <span className="muted">暂无记录</span>}
              </dd>
              <dt>常去医院</dt>
              <dd>{pet.hospital ?? <span className="muted">未填写</span>}</dd>
              <dt>紧急联系</dt>
              <dd>{pet.emergencyContact ?? <span className="muted">未填写</span>}</dd>
              <dt>备注</dt>
              <dd>{pet.note ?? <span className="muted">未填写</span>}</dd>
            </dl>
            {!pet.allergies && (
              <div className="notice warm" style={{ marginTop: 10 }}>
                <AlertTriangle size={13} style={{ flex: 'none', marginTop: 2 }} />
                <span>过敏信息还没补充。就诊时医生通常会先问这一项，可以现在补上。</span>
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">
                <Pill size={16} /> 最近记录
              </div>
              <button className="link" onClick={() => navigate('/timeline')}>
                全部 <ChevronRight size={12} />
              </button>
            </div>
            {events.length === 0 ? (
              <EmptyState title="还没有任何记录" text="从体重或一张照片开始就可以。" />
            ) : (
              <div className="stack" style={{ gap: 0 }}>
                {events.slice(0, 5).map((e) => (
                  <div key={e.id} className="task-row">
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="task-title truncate">{e.title}</div>
                      <div className="task-meta num">
                        {fmtDateFull(e.date)}
                        {e.weight ? ` · ${e.weight.toFixed(1)} kg` : ''}
                        {e.hospital ? ` · ${e.hospital}` : ''}
                      </div>
                    </div>
                    <button
                      className="btn-icon"
                      aria-label={`删除 ${e.title}`}
                      onClick={() => removeEvent(e.id, e.title)}
                      disabled={deleting === e.id}
                      title="删除这条记录"
                    >
                      <Trash2 size={15} />
                    </button>
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
                <Users size={16} /> 家庭共享
              </div>
              <span className="badge badge-gray">下一版开放</span>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {members.map((m) => (
                <div key={m.id} className="row" style={{ gap: 9 }}>
                  <Avatar src={m.avatar} size={30} alt={m.name} />
                  <div className="grow">
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                    <div className="tiny muted">{m.role === 'owner' ? '主要照护人' : '家庭成员'}</div>
                  </div>
                  <span className="badge badge-brand">已加入</span>
                </div>
              ))}
            </div>
            <div className="small muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
              共享成员可以一起记录，但无法查看你设为私密的分享卡。邀请功能将在下一版本开放。
            </div>
            <button
              className="btn btn-block btn-sm"
              style={{ marginTop: 10 }}
              onClick={() => toast('家庭共享将在下一版本开放，当前仅支持主要照护人记录', 'info')}
            >
              <Plus size={13} /> 邀请家庭成员
            </button>
          </section>

          <section className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>
              <Hospital size={16} /> 档案统计
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {[
                ['疫苗记录', `${vaccines.length} 次`],
                ['就诊记录', `${visits.length} 次`],
                ['照片', `${photos.length} 张`],
                ['建档时间', fmtDateFull(pet.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="row-between">
                  <span className="small muted">{k}</span>
                  <span className="small num" style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>
              <Phone size={16} /> 切换宠物
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {pets.map((p) => (
                <button
                  key={p.id}
                  className="row"
                  style={{
                    gap: 9,
                    padding: 6,
                    borderRadius: 6,
                    background: p.id === pet.id ? '#eaf4f1' : 'transparent',
                    textAlign: 'left',
                  }}
                  onClick={() => api.setActivePet(p.id)}
                >
                  <Avatar src={p.avatar} size={28} alt={p.name} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="truncate" style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div className="tiny muted truncate">{ageText(p.date)}</div>
                  </div>
                  {p.id === pet.id && <CheckCircle2 size={15} color="#0e6b5c" />}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <EditPetSheet open={editOpen} onClose={() => setEditOpen(false)} pet={pet} />
    </div>
  )
}

function EditPetSheet({ open, onClose, pet }: { open: boolean; onClose: () => void; pet: Pet }) {
  const { toast } = useApp()
  const [form, setForm] = useState<{
    name: string
    breed: string
    date: string
    neutered: 'yes' | 'no' | 'unknown'
    allergies: string
    hospital: string
    emergencyContact: string
    note: string
  }>({
    name: pet.name,
    breed: pet.breed ?? '',
    date: pet.date ?? '',
    neutered: pet.neutered ?? 'unknown',
    allergies: pet.allergies ?? '',
    hospital: pet.hospital ?? '',
    emergencyContact: pet.emergencyContact ?? '',
    note: pet.note ?? '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name.trim()) {
      toast('名字不能为空', 'error')
      return
    }
    setSaving(true)
    await api.updatePet(pet.id, { ...form, name: form.name.trim(), neutered: form.neutered as Pet['neutered'] })
    setSaving(false)
    toast('档案已更新', 'success')
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="编辑宠物资料"
      subtitle="这些信息会出现在看诊摘要里"
      footer={
        <>
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field">
          <label htmlFor="e-name">名字</label>
          <input id="e-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="e-breed">品种</label>
          <input id="e-breed" className="input" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="例如 英国短毛猫" />
        </div>
        <div className="field">
          <label htmlFor="e-date">{pet.dateType === 'birthday' ? '生日' : '到家日'}</label>
          <input id="e-date" type="date" className="input" max={todayISO()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div className="field">
          <span className="field-label">绝育情况</span>
          <select className="select" value={form.neutered} onChange={(e) => setForm({ ...form, neutered: e.target.value as 'yes' | 'no' | 'unknown' })}>
            <option value="unknown">暂不确定</option>
            <option value="yes">已绝育</option>
            <option value="no">未绝育</option>
          </select>
        </div>
        <div className="field span2">
          <label htmlFor="e-allergy">过敏信息</label>
          <input id="e-allergy" className="input" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="没有已知过敏可以填「暂无」" />
        </div>
        <div className="field span2">
          <label htmlFor="e-hospital">常去医院</label>
          <input id="e-hospital" className="input" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} />
        </div>
        <div className="field span2">
          <label htmlFor="e-em">紧急联系</label>
          <input id="e-em" className="input" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
        </div>
        <div className="field span2">
          <label htmlFor="e-note">备注</label>
          <textarea id="e-note" className="textarea" style={{ minHeight: 64 }} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="例如：怕生，出门需要航空箱" />
        </div>
      </div>
    </Sheet>
  )
}
