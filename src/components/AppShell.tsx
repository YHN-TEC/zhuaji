import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, PawPrint, Clock, HeartPulse, MapPin, Plus, Bell, Settings, ChevronDown, Check } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../store'
import { Avatar } from './ui'
import { ageText, fmtWeight } from '../lib/format'
import { api } from '../lib/api'

const navItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/profile', label: '档案', icon: PawPrint },
  { to: '/timeline', label: '时间线', icon: Clock },
  { to: '/health', label: '健康', icon: HeartPulse },
  { to: '/local', label: '同城', icon: MapPin },
]

export function PetSwitcher({ variant = 'hero' }: { variant?: 'hero' | 'side' }) {
  const { pets, pet, db } = useApp()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  if (!pet) return null

  const latestWeight = db?.events
    .filter((e) => e.petId === pet.id && e.type === 'weight' && e.weight)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.weight

  return (
    <div style={{ position: 'relative' }}>
      <button
        className={variant === 'hero' ? 'pet-switch' : 'side-pet'}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="切换宠物"
      >
        <Avatar src={pet.avatar} size={variant === 'hero' ? 20 : 32} alt={pet.name} />
        {variant === 'side' && (
          <div className="grow" style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }} className="truncate">
              {pet.name}
            </div>
            <div className="tiny muted truncate">
              {pet.breed ?? (pet.species === 'cat' ? '猫' : '狗')} · {ageText(pet.date)}
            </div>
          </div>
        )}
        <span style={{ fontSize: 12 }}>{variant === 'hero' ? '切换' : ''}</span>
        <ChevronDown size={13} style={{ flex: 'none' }} />
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 29 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="pet-menu" role="listbox" aria-label="我的宠物">
            <div className="tiny muted" style={{ padding: '4px 8px 6px' }}>
              我的宠物（{pets.length}）
            </div>
            {pets.map((p) => {
              const w = db?.events
                .filter((e) => e.petId === p.id && e.type === 'weight' && e.weight)
                .sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.weight
              return (
                <button
                  key={p.id}
                  className={`pet-menu-item${p.id === pet.id ? ' on' : ''}`}
                  onClick={() => {
                    api.setActivePet(p.id)
                    setOpen(false)
                  }}
                  role="option"
                  aria-selected={p.id === pet.id}
                >
                  <Avatar src={p.avatar} size={30} alt={p.name} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }} className="truncate">
                      {p.name}
                    </div>
                    <div className="tiny muted truncate">
                      {ageText(p.date)} · {fmtWeight(w)}
                    </div>
                  </div>
                  {p.id === pet.id && <Check size={15} color="#0e6b5c" />}
                </button>
              )
            })}
            <div className="divider" style={{ margin: '6px 0' }} />
            <button
              className="pet-menu-item"
              onClick={() => {
                setOpen(false)
                navigate('/onboarding')
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: '1px dashed #cfd9d5',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#6d7d77',
                }}
              >
                <Plus size={15} />
              </div>
              <span style={{ fontSize: 13 }}>添加另一只宠物</span>
            </button>
          </div>
        </>
      )}
      {variant === 'hero' && latestWeight !== undefined && null}
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { db, pet, openRecord, toast } = useApp()
  const navigate = useNavigate()
  const dueCount =
    db?.reminders.filter((r) => !r.done && r.petId === pet?.id && r.dueDate <= new Date().toISOString().slice(0, 10)).length ?? 0

  return (
    <div className="app">
      {/* 桌面端左侧导航 */}
      <aside className="sidebar">
        <div className="brand" style={{ marginBottom: 2 }}>
          <img className="brand-mark" src="img/paw.svg" alt="" />
          <div>
            <div className="brand-name">爪迹</div>
            <div className="tiny muted" style={{ marginTop: -3 }}>
              成长与健康档案
            </div>
          </div>
        </div>

        <PetSwitcher variant="side" />

        <button className="btn btn-coral btn-block" onClick={() => openRecord('weight')}>
          <Plus size={16} /> 记录
        </button>

        <div>
          <div className="side-label">我的档案</div>
          <nav className="side-nav">
            {navItems.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `side-link${isActive ? ' on' : ''}`}>
                <n.icon size={17} />
                {n.label}
                {n.to === '/' && dueCount > 0 && <span className="count">{dueCount}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <div className="side-label">社区</div>
          <nav className="side-nav">
            <NavLink to="/local" className="side-link">
              <MapPin size={17} /> 同城动态
            </NavLink>
            <NavLink to="/messages" className={({ isActive }) => `side-link${isActive ? ' on' : ''}`}>
              <Bell size={17} /> 消息与提醒
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `side-link${isActive ? ' on' : ''}`}>
              <Settings size={17} /> 设置与隐私
            </NavLink>
          </nav>
        </div>

        <div className="side-foot">
          <div className="notice warm" style={{ padding: '8px 10px', fontSize: 11.5 }}>
            <PawPrint size={13} style={{ flex: 'none', marginTop: 2 }} />
            <span>健康记录默认私密，分享前会再次确认可见范围。</span>
          </div>
          <button className="side-user" onClick={() => navigate('/settings')}>
            <Avatar src={db?.user.avatar ?? 'img/avatar-user.svg'} size={30} />
            <div className="grow" style={{ minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{db?.user.nickname}</div>
              <div className="tiny muted">
                {db?.user.city} · {db?.user.district}
              </div>
            </div>
          </button>
        </div>
      </aside>

      <div className="main">
        {/* 移动端顶部栏 */}
        <header className="topbar">
          <div className="brand">
            <img className="brand-mark" src="img/paw.svg" alt="" />
            <span className="brand-name">爪迹</span>
            <span className="brand-tag">成长与健康档案</span>
          </div>
          <div className="topbar-actions">
            <button
              className="btn-icon"
              aria-label="消息与提醒"
              onClick={() => navigate('/messages')}
              style={{ position: 'relative' }}
            >
              <Bell size={19} />
              {dueCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#d96340',
                    border: '1.5px solid #f5f8f7',
                  }}
                />
              )}
            </button>
            <button className="btn-icon" aria-label="设置" onClick={() => navigate('/settings')}>
              <Settings size={19} />
            </button>
          </div>
        </header>

        {children}

        <button className="fab" aria-label="快捷记录" onClick={() => openRecord('weight')}>
          <Plus size={26} />
        </button>

        <nav className="bottomnav" aria-label="主导航">
          {navItems.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <n.icon size={20} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
