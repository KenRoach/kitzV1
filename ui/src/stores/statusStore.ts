import { create } from 'zustand'

export type StatusLevel = 'degraded' | 'outage' | 'maintenance' | 'none'

interface StatusStore {
  level: StatusLevel
  message: string
  setStatus: (level: StatusLevel, message?: string) => void
  clear: () => void
}

const DEFAULT_MESSAGES: Record<StatusLevel, string> = {
  degraded: 'We are currently experiencing degraded performance. Please try again shortly.',
  outage: 'Services are currently unavailable. We are working to restore them.',
  maintenance: 'Scheduled maintenance in progress. Some features may be limited.',
  none: '',
}

export const useStatusStore = create<StatusStore>((set) => ({
  level: 'none',
  message: '',
  setStatus: (level, message) =>
    set({ level, message: message ?? DEFAULT_MESSAGES[level] }),
  clear: () => set({ level: 'none', message: '' }),
}))
