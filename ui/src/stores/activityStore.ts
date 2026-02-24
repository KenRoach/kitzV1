import { create } from 'zustand'
import type { ActivityEntry, ActivityType } from '@/types/activity'
import { apiFetch } from '@/lib/api'
import { API } from '@/lib/constants'

interface ActivityStore {
  entries: ActivityEntry[]
  filter: ActivityType | 'all'
  hasMore: boolean
  isLoading: boolean
  setFilter: (filter: ActivityType | 'all') => void
  fetchActivity: () => Promise<void>
  loadMore: () => Promise<void>
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  entries: [],
  filter: 'all',
  hasMore: false,
  isLoading: false,

  setFilter: (filter) => {
    set({ filter })
    void get().fetchActivity()
  },

  fetchActivity: async () => {
    set({ isLoading: true })
    try {
      const { filter } = get()
      const params = new URLSearchParams({ limit: '50', offset: '0' })
      if (filter !== 'all') params.set('type', filter)
      const res = await apiFetch<ActivityEntry[] | { entries?: ActivityEntry[]; logs?: ActivityEntry[] }>(
        `${API.LOGS}/logs?${params.toString()}`,
      )
      const entries = Array.isArray(res) ? res : (
        (res as { entries?: ActivityEntry[] }).entries ??
        (res as { logs?: ActivityEntry[] }).logs ??
        []
      )
      set({ entries, hasMore: entries.length >= 50, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  loadMore: async () => {
    const { entries, filter } = get()
    try {
      const params = new URLSearchParams({ limit: '50', offset: String(entries.length) })
      if (filter !== 'all') params.set('type', filter)
      const res = await apiFetch<ActivityEntry[] | { entries?: ActivityEntry[]; logs?: ActivityEntry[] }>(
        `${API.LOGS}/logs?${params.toString()}`,
      )
      const more = Array.isArray(res) ? res : (
        (res as { entries?: ActivityEntry[] }).entries ??
        (res as { logs?: ActivityEntry[] }).logs ??
        []
      )
      set((s) => ({
        entries: [...s.entries, ...more],
        hasMore: more.length >= 50,
      }))
    } catch {
      set({ hasMore: false })
    }
  },
}))
