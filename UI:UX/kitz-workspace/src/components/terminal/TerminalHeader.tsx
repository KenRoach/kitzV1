import { Cpu, Zap, Wifi } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useBatteryStore } from '../../store/batteryStore';
import { useRunStore } from '../../store/runStore';

export function TerminalHeader() {
  const battery = useBatteryStore();
  const activeRun = useRunStore((s) => {
    const r = s.runs.find((r) => r.id === s.activeRunId);
    return r;
  });

  const phase = activeRun?.phase || 'DONE';
  const status = activeRun?.status || 'idle';

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-kitz-border bg-kitz-surface/80">
      <div className="flex items-center gap-2">
        <span className="text-kitz-purple font-bold text-sm tracking-wide font-mono">KITZ OS</span>
        <Badge variant="purple">v0.1</Badge>
      </div>
      <div className="flex items-center gap-3 text-[11px]">
        <div className="flex items-center gap-1 text-kitz-green">
          <Wifi size={11} />
          <span>Online</span>
        </div>
        <div className="flex items-center gap-1 text-kitz-muted">
          <Zap size={11} className="text-kitz-yellow" />
          <span>{battery.mode === 'unlimited' ? 'Unlimited' : `${battery.creditsRemaining} credits`}</span>
        </div>
        <div className="flex items-center gap-1 text-kitz-muted">
          <Cpu size={11} />
          <span>{phase}</span>
        </div>
        {status === 'running' && (
          <Badge variant="purple">
            <span className="pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-kitz-purple" />
            RUNNING
          </Badge>
        )}
        {status === 'awaiting_approval' && (
          <Badge variant="yellow">APPROVAL</Badge>
        )}
        {status === 'completed' && (
          <Badge variant="green">DONE</Badge>
        )}
      </div>
    </div>
  );
}
