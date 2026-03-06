import { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { CanvasPanel } from '../canvas/CanvasPanel';

export function SplitLayout() {
  const [terminalOpen, setTerminalOpen] = useState(true);

  return (
    <div className="h-full flex relative">
      {/* Mobile toggle */}
      <button
        onClick={() => setTerminalOpen(!terminalOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 bg-kitz-surface border border-kitz-border rounded-md p-1.5 text-kitz-muted hover:text-kitz-text"
      >
        <PanelLeft size={16} />
      </button>

      {/* Terminal */}
      <div
        className={`
          ${terminalOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-200
          fixed lg:static inset-y-0 left-0 z-40
          w-[85vw] sm:w-[400px] lg:w-[35%] lg:min-w-[380px] lg:max-w-[500px]
        `}
      >
        <TerminalPanel />
      </div>

      {/* Backdrop for mobile */}
      {terminalOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setTerminalOpen(false)}
        />
      )}

      {/* Canvas */}
      <div className="flex-1 min-w-0">
        <CanvasPanel />
      </div>
    </div>
  );
}
