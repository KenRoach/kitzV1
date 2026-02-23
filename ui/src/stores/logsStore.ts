import { create } from 'zustand'

interface LogEntry {
  id: string
  timestamp: string
  agent: string
  action: string
  details: string
}

interface LogsState {
  entries: LogEntry[]
}

export const useLogsStore = create<LogsState>(() => ({
  entries: [],
}))
