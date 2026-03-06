import { useEffect, useRef } from 'react';
import { useRunStore } from '../../store/runStore';

const levelColors: Record<string, string> = {
  info: 'text-kitz-muted',
  warn: 'text-kitz-yellow',
  error: 'text-kitz-red',
  success: 'text-kitz-green',
};

const agentColors: Record<string, string> = {
  IntentAgent: 'text-blue-400',
  ClassifierAgent: 'text-cyan-400',
  StrategyAgent: 'text-kitz-purple',
  DesignAgent: 'text-pink-400',
  CopywriterAgent: 'text-emerald-400',
  AnalyticsAgent: 'text-orange-400',
  GrowthAgent: 'text-kitz-green',
  OpsAgent: 'text-sky-400',
  VoiceAgent: 'text-violet-400',
  PolicyAgent: 'text-kitz-yellow',
};

export function TerminalLogs() {
  const runs = useRunStore((s) => s.runs);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [runs]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs leading-relaxed space-y-0.5">
      {runs.map((run) => (
        <div key={run.id} className="mb-3">
          <div className="text-kitz-purple/60 text-[10px] mb-1">
            {'>'} {run.command}
          </div>
          {run.logs.map((entry, i) => {
            const agentColor = agentColors[entry.agent] || 'text-kitz-muted';
            const lvlColor = levelColors[entry.level] || 'text-kitz-muted';
            const time = new Date(entry.ts).toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            return (
              <div key={i} className={`log-entry flex gap-2 ${lvlColor}`}>
                <span className="text-kitz-border shrink-0">{time}</span>
                <span className={`shrink-0 ${agentColor}`}>[{entry.agent}]</span>
                <span className="break-words">{entry.message}</span>
              </div>
            );
          })}
          {run.status === 'completed' && (
            <div className="text-kitz-green/50 text-[10px] mt-0.5">run completed — {run.costCredits} credits</div>
          )}
          {run.status === 'failed' && (
            <div className="text-kitz-red/50 text-[10px] mt-0.5">run failed</div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
