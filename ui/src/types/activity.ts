export type ActivityType = 'agent' | 'crm' | 'order' | 'message' | 'system'

export interface ActivityEntry {
  id: string
  type: ActivityType
  actor: { name: string; isAgent: boolean }
  action: string
  detail?: string
  timestamp: string
  traceId?: string
}
