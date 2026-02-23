export interface LogEntry {
  id: string
  timestamp: string
  agentId: string
  agentName: string
  action: string
  details: string
  status: 'success' | 'error' | 'pending'
}
