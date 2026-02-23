export interface Skill {
  id: string
  name: string
  description: string
  category: 'communication' | 'analysis' | 'automation' | 'integration'
  enabled: boolean
  agentIds: string[]
}
