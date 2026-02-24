import { create } from 'zustand'

interface NavTarget {
  id: string
  label: string
}

interface OrbNavigatorStore {
  target: NavTarget | null
  highlighting: boolean
  navigateTo: (navId: string, label: string) => void
  clearTarget: () => void
}

export const useOrbNavigatorStore = create<OrbNavigatorStore>((set) => ({
  target: null,
  highlighting: false,

  navigateTo: (navId, label) => {
    // Find the nav item by data-nav attribute
    const el = document.querySelector(`[data-nav="${navId}"]`)
    if (el) {
      set({ target: { id: navId, label }, highlighting: true })
      el.classList.add('kitz-highlight')
      setTimeout(() => {
        el.classList.remove('kitz-highlight')
        set({ highlighting: false })
      }, 3000)
    }
  },

  clearTarget: () => set({ target: null, highlighting: false }),
}))

// Keyword-to-nav mapping — scans AI responses for navigation hints
const NAV_KEYWORDS: Record<string, { navId: string; label: string }> = {
  contact: { navId: 'workspace', label: 'Workspace' },
  crm: { navId: 'workspace', label: 'Workspace' },
  order: { navId: 'workspace', label: 'Workspace' },
  customer: { navId: 'workspace', label: 'Workspace' },
  agent: { navId: 'agents', label: 'Agents' },
  automat: { navId: 'automations', label: 'Automations' },
  setting: { navId: 'settings', label: 'Settings' },
  config: { navId: 'settings', label: 'Settings' },
  activit: { navId: 'activity', label: 'Activity' },
  dashboard: { navId: 'home', label: 'Home' },
  metric: { navId: 'home', label: 'Home' },
}

export function detectNavHint(responseText: string): { navId: string; label: string } | null {
  const lower = responseText.toLowerCase()
  for (const [keyword, target] of Object.entries(NAV_KEYWORDS)) {
    if (lower.includes(keyword)) return target
  }
  return null
}
