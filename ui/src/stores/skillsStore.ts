import { create } from 'zustand'
import type { Skill } from '@/types/skills'

interface SkillsState {
  skills: Skill[]
}

export const useSkillsStore = create<SkillsState>(() => ({
  skills: [],
}))
