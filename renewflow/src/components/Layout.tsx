import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, RotateCcw, FileText, Users } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/renewals', icon: RotateCcw, label: 'Renovaciones' },
  { to: '/quotes', icon: FileText, label: 'Cotizaciones' },
  { to: '/resellers', icon: Users, label: 'Resellers' },
];

export function Layout() {
  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <aside className="w-56 bg-kitz-dark border-r border-kitz-border flex flex-col">
        <div className="px-4 py-5 border-b border-kitz-border">
          <span className="font-mono text-sm font-bold text-kitz-purple tracking-wider">RENEWFLOW</span>
          <div className="text-[10px] text-kitz-muted mt-0.5">by KITZ</div>
        </div>
        <nav className="flex-1 py-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2 mx-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-kitz-purple/15 text-kitz-purple font-medium'
                    : 'text-kitz-muted hover:text-kitz-text hover:bg-kitz-border/50'
                }`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-kitz-border text-[10px] text-kitz-muted font-mono">
          renewflow.kitz.services
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
