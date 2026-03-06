import { FileText, Download, Mail, Send, Save, Image } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useArtifactStore } from '../../store/artifactStore';
import { runCommand } from '../../engine/runEngine';

const typeLabels: Record<string, string> = {
  flyer: 'Flyer',
  email_sequence: 'Email Sequence',
  audit: 'Audit Report',
  waitlist: 'Waitlist',
  landing: 'Landing Page',
  sop: 'SOP',
};

export function CanvasHeader() {
  const artifact = useArtifactStore((s) => {
    if (!s.activeArtifactId) return null;
    return s.artifacts.get(s.activeArtifactId) ?? null;
  });
  const setVersion = useArtifactStore((s) => s.setCurrentVersion);

  if (!artifact) return (
    <div className="flex items-center justify-center px-4 py-3 border-b border-kitz-border bg-kitz-surface/50 text-kitz-muted text-sm">
      No artifact selected
    </div>
  );

  const currentVer = artifact.versions.find((v) => v.version === artifact.currentVersion);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-kitz-border bg-kitz-surface/50">
      <div className="flex items-center gap-3">
        <FileText size={14} className="text-kitz-purple" />
        <span className="text-sm font-medium text-kitz-text truncate max-w-48">{artifact.name}</span>
        <Badge variant="purple">{typeLabels[artifact.type] || artifact.type}</Badge>
        <div className="flex items-center gap-1">
          {artifact.versions.map((v) => (
            <button
              key={v.version}
              onClick={() => setVersion(artifact.id, v.version)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                v.version === artifact.currentVersion
                  ? 'bg-kitz-purple/20 text-kitz-purple'
                  : 'text-kitz-muted hover:text-kitz-text hover:bg-kitz-border'
              }`}
            >
              v{v.version}
            </button>
          ))}
        </div>
        {currentVer?.meta.changeNote && (
          <span className="text-[10px] text-kitz-muted italic">{currentVer.meta.changeNote}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={() => runCommand('export pdf')}>
          <Download size={12} /> PDF
        </Button>
        <Button variant="ghost" size="sm" onClick={() => runCommand('export png')}>
          <Image size={12} /> PNG
        </Button>
        <Button variant="ghost" size="sm" onClick={() => runCommand('send email')}>
          <Mail size={12} /> Email
        </Button>
        <Button variant="ghost" size="sm" onClick={() => runCommand('send whatsapp')}>
          <Send size={12} /> WhatsApp
        </Button>
        <Button variant="primary" size="sm">
          <Save size={12} /> Save
        </Button>
      </div>
    </div>
  );
}
