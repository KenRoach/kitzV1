import { create } from 'zustand'

interface Skill {
  id: string
  name: string
  description: string
  enabled: boolean
}

interface SkillsState {
  skills: Skill[]
}

export const useSkillsStore = create<SkillsState>(() => ({
  skills: [],
}))
