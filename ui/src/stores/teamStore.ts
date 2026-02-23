import { create } from 'zustand'
import type { TeamMember } from '@/types/team'

interface TeamState {
  members: TeamMember[]
}

export const useTeamStore = create<TeamState>(() => ({
  members: [],
}))
