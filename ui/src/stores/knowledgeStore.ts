import { create } from 'zustand'
import { apiFetch } from '@/lib/api'
import { API } from '@/lib/constants'

export interface KnowledgeEntry {
  id: string
  source: string
  category: string
  title?: string
  content: string
  hash: string
  updatedAt: number
}

interface KnowledgeStore {
  entries: KnowledgeEntry[]
  loading: boolean
  error: string | null
  searchQuery: string

  setSearchQuery: (q: string) => void
  fetchEntries: () => Promise<void>
  addEntry: (entry: { title: string; content: string; category: string; source?: string }) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  entries: [],
  loading: false,
  error: null,
  searchQuery: '',

  setSearchQuery: (q) => set({ searchQuery: q }),

  fetchEntries: async () => {
    set({ loading: true, error: null })
    try {
      const res = await apiFetch<{ entries: KnowledgeEntry[] }>(`${API.KITZ_OS}/knowledge`)
      set({ entries: res.entries || [], loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  addEntry: async (entry) => {
    set({ loading: true, error: null })
    try {
      const res = await apiFetch<{ ok: boolean; entry: KnowledgeEntry }>(`${API.KITZ_OS}/knowledge`, {
        method: 'POST',
        body: JSON.stringify({
          title: entry.title,
          content: entry.content,
          category: entry.category,
          source: entry.source || 'upload',
        }),
      })
      if (res.entry) {
        set((s) => ({ entries: [...s.entries, res.entry], loading: false }))
      } else {
        await get().fetchEntries()
      }
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  deleteEntry: async (id) => {
    try {
      await apiFetch(`${API.KITZ_OS}/knowledge/${id}`, { method: 'DELETE' })
      set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }))
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },
}))
