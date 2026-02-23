import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  durationMs: number
}

interface ToastStore {
  toasts: Toast[]
  add: (message: string, type?: ToastType, durationMs?: number) => void
  dismiss: (id: string) => void
}

let nextId = 0

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = 'info', durationMs = 3500) => {
    const id = `toast_${++nextId}`
    set((s) => ({ toasts: [...s.toasts, { id, message, type, durationMs }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, durationMs)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
