import React, { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Info, Scale, Syringe, Bug, Stethoscope, Camera, NotebookPen, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CareEventType } from '../types'
import { useApp } from '../store'

export function Avatar({ src, size = 36, square = false, alt = '' }: { src: string; size?: number; square?: boolean; alt?: string }) {
  return (
    <img
      className={`avatar${square ? ' avatar-sq' : ''}`}
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      onError={(e) => {
        const el = e.currentTarget
        el.onerror = null
        el.src = 'img/paw.svg'
      }}
    />
  )
}

export const eventMeta: Record<CareEventType, { label: string; icon: LucideIcon }> = {
  weight: { label: '体重', icon: Scale },
  vaccine: { label: '疫苗', icon: Syringe },
  deworm: { label: '驱虫', icon: Bug },
  visit: { label: '就诊', icon: Stethoscope },
  photo: { label: '照片', icon: Camera },
  daily: { label: '日常', icon: NotebookPen },
}

export function EventIcon({ type, size = 15 }: { type: CareEventType; size?: number }) {
  const Icon = eventMeta[type].icon
  return <Icon size={size} />
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: React.ReactNode
  title: string
  text?: string
  action?: React.ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon ?? <NotebookPen size={20} />}</div>
      <div className="empty-title">{title}</div>
      {text && <div className="empty-text">{text}</div>}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  )
}

export function ErrorState({ title, text, onRetry }: { title: string; text?: string; onRetry?: () => void }) {
  return (
    <div className="error-box" role="alert">
      <AlertTriangle size={16} style={{ flex: 'none', marginTop: 2 }} />
      <div className="grow">
        <div style={{ fontWeight: 600 }}>{title}</div>
        {text && <div style={{ marginTop: 2, opacity: 0.9 }}>{text}</div>}
        {onRetry && (
          <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={onRetry}>
            重试
          </button>
        )}
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="内容加载中">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton sk-card" />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card" aria-busy="true">
      <div className="skeleton sk-line" style={{ width: '32%' }} />
      <div className="skeleton sk-line" style={{ width: '78%', height: 18 }} />
      <div className="skeleton sk-line" style={{ width: '56%' }} />
    </div>
  )
}

export function Sheet({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head">
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="sheet-title">{title}</div>
            {subtitle && <div className="small muted" style={{ marginTop: 1 }}>{subtitle}</div>}
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function ToastStack() {
  const { toasts, dismissToast } = useApp()
  if (!toasts.length) return null
  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.kind === 'success' ? <CheckCircle2 size={16} /> : t.kind === 'error' ? <AlertTriangle size={16} /> : <Info size={16} />}
          <span className="grow">{t.text}</span>
          {t.action && (
            <button
              onClick={() => {
                t.action?.onClick()
                dismissToast(t.id)
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export function ConfirmSheet({
  open,
  title,
  text,
  confirmLabel = '确认',
  danger = false,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean
  title: string
  text?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
  children?: React.ReactNode
}) {
  return (
    <Sheet
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            取消
          </button>
          <button className={`btn ${danger ? 'btn-coral' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      {text && <div className="small" style={{ color: 'var(--ink-2)', lineHeight: 1.7 }}>{text}</div>}
      {children}
    </Sheet>
  )
}

export function Stat({ label, value, unit, icon }: { label: string; value: string; unit?: string; icon?: React.ReactNode }) {
  return (
    <div className="stat">
      <div className="stat-label">
        {icon}
        {label}
      </div>
      <div className="stat-value num">
        {value}
        {unit && <small>{unit}</small>}
      </div>
    </div>
  )
}
