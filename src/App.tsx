import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from './store'
import { AppShell } from './components/AppShell'
import { QuickRecord } from './components/QuickRecord'
import { ShareSheet } from './components/ShareSheet'
import { ToastStack, EmptyState } from './components/ui'
import { Home } from './pages/Home'
import { Onboarding } from './pages/Onboarding'
import { Profile } from './pages/Profile'
import { Timeline } from './pages/Timeline'
import { Health } from './pages/Health'
import { Local } from './pages/Local'
import { Messages } from './pages/Messages'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'
import { Compass } from 'lucide-react'

function Boot() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: 220, textAlign: 'center' }}>
        <img src="img/paw.svg" alt="" width={44} height={44} style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>爪迹</div>
        <div className="small muted" style={{ marginBottom: 16 }}>正在载入你的档案…</div>
        <div className="skeleton" style={{ height: 8, borderRadius: 4, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 8, borderRadius: 4, width: '70%', margin: '0 auto' }} />
      </div>
    </div>
  )
}

function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="content">
      <EmptyState
        icon={<Compass size={20} />}
        title="这个页面不存在"
        text="链接可能已经失效，或者地址输入有误。"
        action={
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            回到首页
          </button>
        }
      />
    </div>
  )
}

export default function App() {
  const { auth, loading, pets, db } = useApp()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  if (loading) return <Boot />

  if (!auth.loggedIn) {
    return (
      <>
        <Login />
        <ToastStack />
      </>
    )
  }

  if (db && pets.length === 0 && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/health" element={<Health />} />
          <Route path="/local" element={<Local />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
      <QuickRecord />
      <ShareSheet />
      <ToastStack />
    </>
  )
}
