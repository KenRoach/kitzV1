import { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface Props {
  onSubmit: (command: string) => void;
  disabled?: boolean;
}

export function TerminalInput({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const cmd = value.trim();
      if (!cmd) return;
      setHistory((h) => [cmd, ...h]);
      setHistIdx(-1);
      setValue('');
      onSubmit(cmd);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setValue(history[next]);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx <= 0) { setHistIdx(-1); setValue(''); return; }
      const next = histIdx - 1;
      setHistIdx(next);
      setValue(history[next]);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-t border-kitz-border bg-kitz-surface/50">
      <ChevronRight size={14} className="text-kitz-purple shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? 'Waiting...' : 'Type a command...'}
        className="flex-1 bg-transparent text-kitz-text font-mono text-sm outline-none placeholder:text-kitz-muted/40"
        autoFocus
      />
      {disabled && (
        <span className="text-kitz-purple text-xs font-mono pulse-dot">...</span>
      )}
    </div>
  );
}
