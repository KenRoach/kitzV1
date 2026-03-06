import { create } from 'zustand';
import type { Run, LogEntry, RunStatus, RunPhase } from '../types';

interface RunStore {
  runs: Run[];
  activeRunId: string | null;
  addRun: (run: Run) => void;
  appendLog: (runId: string, log: LogEntry) => void;
  setStatus: (runId: string, status: RunStatus) => void;
  setPhase: (runId: string, phase: RunPhase) => void;
  setArtifact: (runId: string, artifactId: string, version: number) => void;
  setApprovalAction: (runId: string, action: string) => void;
  getActive: () => Run | null;
}

export const useRunStore = create<RunStore>((set, get) => ({
  runs: [],
  activeRunId: null,
  addRun: (run) =>
    set((s) => ({ runs: [...s.runs, run], activeRunId: run.id })),
  appendLog: (runId, log) =>
    set((s) => ({
      runs: s.runs.map((r) =>
        r.id === runId ? { ...r, logs: [...r.logs, log] } : r
      ),
    })),
  setStatus: (runId, status) =>
    set((s) => ({
      runs: s.runs.map((r) => (r.id === runId ? { ...r, status } : r)),
    })),
  setPhase: (runId, phase) =>
    set((s) => ({
      runs: s.runs.map((r) => (r.id === runId ? { ...r, phase } : r)),
    })),
  setArtifact: (runId, artifactId, version) =>
    set((s) => ({
      runs: s.runs.map((r) =>
        r.id === runId ? { ...r, artifactId, artifactVersion: version } : r
      ),
    })),
  setApprovalAction: (runId, action) =>
    set((s) => ({
      runs: s.runs.map((r) =>
        r.id === runId ? { ...r, approvalAction: action } : r
      ),
    })),
  getActive: () => {
    const { runs, activeRunId } = get();
    return runs.find((r) => r.id === activeRunId) ?? null;
  },
}));
