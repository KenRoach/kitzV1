import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: Props) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-kitz-purple/50 disabled:opacity-50';
  const sizes = { sm: 'px-2.5 py-1 text-xs', md: 'px-3.5 py-1.5 text-sm' };
  const variants = {
    primary: 'bg-kitz-purple hover:bg-kitz-deep text-white',
    ghost: 'bg-transparent hover:bg-kitz-border text-kitz-muted hover:text-kitz-text',
    danger: 'bg-kitz-red/20 hover:bg-kitz-red/30 text-kitz-red',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
