import { create } from 'zustand'
import { apiFetch } from '@/lib/api'
import type { CanvasArtifact, ArtifactAction, ArtifactCategory } from '@/types/artifact'

export type CanvasTab =
  | 'dashboard'
  | 'preview'
  | 'workspace'
  | 'knowledge'
  | 'automations'
  | 'activity'
  | 'settings'
  | 'agents'
  | 'learn'
  | 'game'
  | 'how-it-works'

interface CanvasStore {
  activeTab: CanvasTab
  artifacts: CanvasArtifact[]
  selectedArtifactId: string | null
  hasNewPreview: boolean
  actionLoading: string | null // action ID currently executing

  setActiveTab: (tab: CanvasTab) => void
  pushArtifact: (artifact: Omit<CanvasArtifact, 'id' | 'timestamp'>) => void
  selectArtifact: (id: string) => void
  updateArtifactStatus: (id: string, status: CanvasArtifact['status']) => void
  executeAction: (artifactId: string, action: ArtifactAction) => Promise<void>
  clearArtifacts: () => void

  /** @deprecated Use pushArtifact instead */
  pushPreview: (preview: { type: string; title: string; content: string }) => void
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  activeTab: 'dashboard',
  artifacts: [],
  selectedArtifactId: null,
  hasNewPreview: false,
  actionLoading: null,

  setActiveTab: (tab) =>
    set({ activeTab: tab, hasNewPreview: tab === 'preview' ? false : get().hasNewPreview }),

  pushArtifact: (artifact) => {
    const id = crypto.randomUUID()
    set((s) => ({
      artifacts: [
        ...s.artifacts,
        { ...artifact, id, timestamp: Date.now() },
      ],
      selectedArtifactId: id,
      activeTab: 'preview',
      hasNewPreview: false,
    }))
  },

  selectArtifact: (id) => set({ selectedArtifactId: id }),

  updateArtifactStatus: (id, status) =>
    set((s) => ({
      artifacts: s.artifacts.map((a) => (a.id === id ? { ...a, status } : a)),
    })),

  executeAction: async (artifactId, action) => {
    if (action.id === 'save_pdf') {
      window.print()
      return
    }

    set({ actionLoading: action.id })
    try {
      const res = await apiFetch<{ message?: string; error?: string }>(action.endpoint, {
        method: 'POST',
        body: JSON.stringify(action.payload),
      })
      if (res.error) {
        console.error('Action failed:', res.error)
      } else {
        // Update status based on action
        const statusMap: Record<string, CanvasArtifact['status']> = {
          approve_plan: 'approved',
          send_email: 'sent',
          send_whatsapp: 'sent',
        }
        const newStatus = statusMap[action.id]
        if (newStatus) {
          get().updateArtifactStatus(artifactId, newStatus)
        }
      }
    } catch (err) {
      console.error('Action failed:', err)
    } finally {
      set({ actionLoading: null })
    }
  },

  clearArtifacts: () => set({ artifacts: [], selectedArtifactId: null, hasNewPreview: false }),

  /** @deprecated Backward compat — wraps into CanvasArtifact */
  pushPreview: (preview) => {
    const id = crypto.randomUUID()
    set((s) => ({
      artifacts: [
        ...s.artifacts,
        {
          id,
          contentId: '',
          category: 'document' as ArtifactCategory,
          title: preview.title,
          html: preview.type === 'html' ? preview.content : '',
          previewUrl: preview.type === 'image' ? preview.content : '',
          actions: [],
          status: 'draft',
          timestamp: Date.now(),
        },
      ],
      selectedArtifactId: id,
      activeTab: 'preview',
      hasNewPreview: false,
    }))
  },
}))

export type { CanvasArtifact, ArtifactAction, ArtifactCategory }
