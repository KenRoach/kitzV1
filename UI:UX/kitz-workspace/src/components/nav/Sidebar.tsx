import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Play, Calculator, Zap, FileText, LayoutDashboard, UserPlus,
  Terminal, ChevronLeft, ChevronRight, Menu,
} from 'lucide-react';

const tools = [
  { to: '/', icon: Terminal, label: 'Workspace', category: 'core' },
  { to: '/demo', icon: Play, label: 'Live Demo', category: 'sales' },
  { to: '/roi', icon: Calculator, label: 'ROI Calculator', category: 'sales' },
  { to: '/battery', icon: Zap, label: 'AI Battery', category: 'sales' },
  { to: '/proposals', icon: FileText, label: 'Propuestas', category: 'sales' },
  { to: '/command', icon: LayoutDashboard, label: 'Command Center', category: 'ops' },
  { to: '/onboarding', icon: UserPlus, label: 'Onboarding', category: 'onboarding' },
];

const categoryLabels: Record<string, string> = {
  core: 'Core',
  sales: 'Ventas',
  ops: 'Operaciones',
  onboarding: 'Onboarding',
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const grouped = tools.reduce<Record<string, typeof tools>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  const nav = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-kitz-border">
        {!collapsed && (
          <span className="font-mono text-sm font-bold text-kitz-purple tracking-wider">KITZ TOOLS</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex text-kitz-muted hover:text-kitz-text p-1"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-4">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            {!collapsed && (
              <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-kitz-muted">
                {categoryLabels[cat] ?? cat}
              </div>
            )}
            {items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 mx-1 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-kitz-purple/15 text-kitz-purple font-medium'
                      : 'text-kitz-muted hover:text-kitz-text hover:bg-kitz-border/50'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                end={to === '/'}
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-kitz-border text-[10px] text-kitz-muted font-mono">
          kitz.services
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      {location.pathname !== '/' && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden fixed top-3 left-3 z-50 bg-kitz-surface border border-kitz-border rounded-md p-1.5 text-kitz-muted hover:text-kitz-text"
        >
          <Menu size={16} />
        </button>
      )}

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-200
          fixed lg:static inset-y-0 left-0 z-40
          bg-kitz-dark border-r border-kitz-border
          ${collapsed ? 'w-14' : 'w-56'}
        `}
      >
        {nav}
      </aside>
    </>
  );
}
