import { Clock } from 'lucide-react';
import { useArtifactStore } from '../../store/artifactStore';

export function VersionHistory() {
  const artifact = useArtifactStore((s) => {
    if (!s.activeArtifactId) return null;
    return s.artifacts.get(s.activeArtifactId) ?? null;
  });
  const setVersion = useArtifactStore((s) => s.setCurrentVersion);

  if (!artifact || artifact.versions.length <= 1) return null;

  return (
    <div className="border-t border-kitz-border bg-kitz-surface/30 px-4 py-2">
      <div className="flex items-center gap-2 mb-1.5">
        <Clock size={11} className="text-kitz-muted" />
        <span className="text-[10px] font-semibold text-kitz-muted uppercase tracking-wider">Version History</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {artifact.versions.map((v) => {
          const isActive = v.version === artifact.currentVersion;
          const time = new Date(v.createdAt).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          });
          return (
            <button
              key={v.version}
              onClick={() => setVersion(artifact.id, v.version)}
              className={`shrink-0 rounded-md border px-3 py-1.5 text-left transition-colors ${
                isActive
                  ? 'border-kitz-purple bg-kitz-purple/10'
                  : 'border-kitz-border hover:border-kitz-purple/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold ${isActive ? 'text-kitz-purple' : 'text-kitz-muted'}`}>
                  v{v.version}
                </span>
                <span className="text-[10px] text-kitz-muted">{time}</span>
              </div>
              {v.meta.changeNote && (
                <div className="text-[10px] text-kitz-muted mt-0.5">{v.meta.changeNote}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
