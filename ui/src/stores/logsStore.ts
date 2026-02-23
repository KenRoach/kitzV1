import { create } from 'zustand'
import type { LogEntry } from '@/types/logs'

interface LogsState {
  entries: LogEntry[]
}

export const useLogsStore = create<LogsState>(() => ({
  entries: [],
}))
