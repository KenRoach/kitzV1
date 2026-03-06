import { ShieldAlert } from 'lucide-react';
import { useRunStore } from '../../store/runStore';

export function ApprovalBanner() {
  const activeRun = useRunStore((s) => {
    const r = s.runs.find((r) => r.id === s.activeRunId);
    return r?.status === 'awaiting_approval' ? r : null;
  });

  if (!activeRun) return null;

  return (
    <div className="mx-3 mb-2 rounded-md border border-kitz-yellow/30 bg-kitz-yellow/5 px-3 py-2 flex items-center gap-2">
      <ShieldAlert size={14} className="text-kitz-yellow shrink-0" />
      <div className="flex-1 text-xs">
        <span className="text-kitz-yellow font-semibold">APPROVAL REQUIRED</span>
        <span className="text-kitz-muted ml-2">{activeRun.approvalAction} — {activeRun.costCredits} credits — Risk: {activeRun.risk}</span>
      </div>
      <div className="text-[10px] text-kitz-muted">
        type <span className="text-kitz-green font-mono">approve</span> or <span className="text-kitz-red font-mono">cancel</span>
      </div>
    </div>
  );
}
