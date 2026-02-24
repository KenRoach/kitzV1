export type TeamCluster = 'manager' | 'sales' | 'demand-gen' | 'operations' | 'finance'
export type AgentStatus = 'active' | 'idle' | 'paused' | 'offline'

export interface AgentInfo {
  id: string
  name: string
  role: string
  group: TeamCluster
  status: AgentStatus
  lastAction?: string
  lastActionAt?: string
  actionsToday: number
}

export interface Draft {
  id: string
  agentId: string
  agentName: string
  channel: 'whatsapp' | 'email' | 'sms'
  recipient: string
  preview: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
}
