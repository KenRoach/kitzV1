import { create } from 'zustand'

interface TeamMember {
  id: string
  name: string
  role: string
  status: 'active' | 'invited' | 'inactive'
}

interface TeamState {
  members: TeamMember[]
}

export const useTeamStore = create<TeamState>(() => ({
  members: [],
}))
