export type SOPType = 'business' | 'agent' | 'operational'
export type SOPStatus = 'active' | 'draft' | 'deprecated'
export type SOPLanguage = 'en' | 'es'

export interface SOPEntry {
  id: string
  slug: string
  version: number
  type: SOPType
  title: string
  content: string
  summary: string
  triggerKeywords: string[]
  applicableAgents: string[]
  applicableTeams: string[]
  language: SOPLanguage
  status: SOPStatus
  createdBy: string
  hash: string
  createdAt: number
  updatedAt: number
}

export type SOPInput = Omit<SOPEntry, 'id' | 'hash' | 'createdAt' | 'updatedAt'>
