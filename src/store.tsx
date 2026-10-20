import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { api } from './lib/api'
import type { CareEventType, CareEvent, Pet } from './types'

export type ToastKind = 'success' | 'error' | 'info'
export interface Toast {
  id: string
  text: string
  kind: ToastKind
  action?: { label: string; onClick: () => void }
}

interface AppCtx {
  db: ReturnType<typeof api.getSnapshot>['db']
  auth: ReturnType<typeof api.getSnapshot>['auth']
  loading: boolean
  bootError: string | null
  pet: Pet | null
  pets: Pet[]
  toast: (text: string, kind?: ToastKind, action?: Toast['action']) => void
  toasts: Toast[]
  dismissToast: (id: string) => void
  record: { open: boolean; type: CareEventType }
  openRecord: (type?: CareEventType) => void
  closeRecord: () => void
  share: { open: boolean; event: CareEvent | null }
  openShare: (event: CareEvent) => void
  closeShare: () => void
}

const Ctx = createContext<AppCtx | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const snap = useSyncExternalStore(api.subscribe, api.getSnapshot, api.getSnapshot)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [record, setRecord] = useState<{ open: boolean; type: CareEventType }>({ open: false, type: 'weight' })
  const [share, setShare] = useState<{ open: boolean; event: CareEvent | null }>({ open: false, event: null })

  useEffect(() => {
    api.bootstrap()
  }, [])

  const toast = useCallback((text: string, kind: ToastKind = 'success', action?: Toast['action']) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev.slice(-2), { id, text, kind, action }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3600)
  }, [])

  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  const value = useMemo<AppCtx>(() => {
    const db = snap.db
    const pets = db?.pets ?? []
    const pet = pets.find((p) => p.id === db?.activePetId) ?? pets[0] ?? null
    return {
      db,
      auth: snap.auth,
      loading: snap.loading,
      bootError: snap.error,
      pet,
      pets,
      toast,
      toasts,
      dismissToast,
      record,
      openRecord: (type = 'weight') => setRecord({ open: true, type }),
      closeRecord: () => setRecord((r) => ({ ...r, open: false })),
      share,
      openShare: (event) => setShare({ open: true, event }),
      closeShare: () => setShare({ open: false, event: null }),
    }
  }, [snap, toasts, toast, dismissToast, record, share])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp 必须在 AppProvider 内使用')
  return ctx
}
