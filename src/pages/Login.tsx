import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ArrowRight, Smartphone, PawPrint, AlertTriangle } from 'lucide-react'
import { useApp } from '../store'
import { api } from '../lib/api'

export function Login() {
  const { toast } = useApp()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [busy, setBusy] = useState<null | 'demo' | 'new' | 'login'>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sendCode = () => {
    if (!/^1\d{10}$/.test(phone)) {
      setErrors({ phone: '请输入 11 位手机号' })
      return
    }
    setErrors({})
    setSent(true)
    setCountdown(60)
    toast('验证码已发送（演示环境请填 1234）', 'info')
    const timer = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(timer)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const login = async () => {
    const e: Record<string, string> = {}
    if (!/^1\d{10}$/.test(phone)) e.phone = '请输入 11 位手机号'
    if (!/^\d{4}$/.test(code)) e.code = '请输入 4 位验证码'
    setErrors(e)
    if (Object.keys(e).length) {
      toast('手机号或验证码格式不正确', 'error')
      return
    }
    setBusy('login')
    await api.login('demo')
    setBusy(null)
    toast('登录成功，欢迎回来', 'success')
    navigate('/')
  }

  return (
    <div className="auth-wrap">
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div className="row" style={{ gap: 10, marginBottom: 16, paddingLeft: 2 }}>
          <img className="brand-mark" src="img/paw.svg" alt="" style={{ width: 36, height: 36 }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: 0.5 }}>爪迹</div>
            <div className="tiny muted" style={{ marginTop: -2 }}>成长与健康档案</div>
          </div>
        </div>

        <div className="auth-card">
          <h1 className="auth-title">把每一次成长和照护，<br />都留在同一份档案里。</h1>
          <p className="auth-sub">记录体重、疫苗、驱虫和就诊，自动连成时间线与趋势。健康记录默认私密。</p>

          <div className="stack" style={{ marginTop: 18, gap: 12 }}>
            <div className="field">
              <label htmlFor="phone">手机号</label>
              <div style={{ position: 'relative' }}>
                <Smartphone size={15} style={{ position: 'absolute', left: 11, top: 12, color: '#6d7d77' }} />
                <input
                  id="phone"
                  className={`input ${errors.phone ? 'err' : ''}`}
                  style={{ paddingLeft: 32 }}
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="11 位手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              {errors.phone && <div className="err-text"><AlertTriangle size={12} />{errors.phone}</div>}
            </div>

            <div className="field">
              <label htmlFor="code">验证码</label>
              <div className="row" style={{ gap: 8 }}>
                <input
                  id="code"
                  className={`input ${errors.code ? 'err' : ''}`}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="4 位验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
                <button className="btn" onClick={sendCode} disabled={countdown > 0} style={{ minWidth: 104 }}>
                  {countdown > 0 ? `${countdown}s 后重发` : sent ? '重新发送' : '获取验证码'}
                </button>
              </div>
              {errors.code && <div className="err-text"><AlertTriangle size={12} />{errors.code}</div>}
            </div>

            <button className="btn btn-primary btn-block" onClick={login} disabled={busy !== null}>
              {busy === 'login' ? '登录中…' : '登录 / 注册'}
              {busy !== 'login' && <ArrowRight size={15} />}
            </button>
          </div>

          <div className="row" style={{ gap: 8, margin: '16px 0 12px' }}>
            <span style={{ height: 1, flex: 1, background: '#e2e8e5' }} />
            <span className="tiny muted">演示环境</span>
            <span style={{ height: 1, flex: 1, background: '#e2e8e5' }} />
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <button
              className="btn btn-soft btn-block"
              disabled={busy !== null}
              onClick={async () => {
                setBusy('demo')
                await api.login('demo')
                setBusy(null)
                toast('已进入演示档案：团子 和 麦麦', 'success')
                navigate('/')
              }}
            >
              <PawPrint size={15} /> {busy === 'demo' ? '载入中…' : '使用演示档案进入（2 只宠物）'}
            </button>
            <button
              className="btn btn-block"
              disabled={busy !== null}
              onClick={async () => {
                setBusy('new')
                await api.login('new')
                setBusy(null)
                navigate('/onboarding')
              }}
            >
              {busy === 'new' ? '准备中…' : '作为新用户开始，体验建档流程'}
            </button>
          </div>

          <div className="row tiny muted" style={{ marginTop: 14, gap: 5, lineHeight: 1.6, alignItems: 'flex-start' }}>
            <ShieldCheck size={13} style={{ flex: 'none', marginTop: 2 }} />
            登录即表示同意《用户协议》与《隐私说明》。我们不采集精确位置，健康数据不会用于广告，也不会自动公开。
          </div>
        </div>

        <div className="tiny muted" style={{ textAlign: 'center', marginTop: 14 }}>
          原型版本 · 数据保存在本机浏览器
        </div>
      </div>
    </div>
  )
}
