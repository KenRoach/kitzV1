import type { ReactNode } from 'react';

interface Props {
  variant?: 'purple' | 'green' | 'yellow' | 'red' | 'muted';
  children: ReactNode;
}

const colors = {
  purple: 'bg-kitz-purple/20 text-kitz-purple',
  green: 'bg-kitz-green/20 text-kitz-green',
  yellow: 'bg-kitz-yellow/20 text-kitz-yellow',
  red: 'bg-kitz-red/20 text-kitz-red',
  muted: 'bg-kitz-border text-kitz-muted',
};

export function Badge({ variant = 'muted', children }: Props) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colors[variant]}`}>
      {children}
    </span>
  );
}
