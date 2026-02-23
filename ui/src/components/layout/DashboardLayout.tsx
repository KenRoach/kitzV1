import { TopNavBar } from './TopNavBar'
import { StatusBanner } from './StatusBanner'
import { useAuthStore } from '@/stores/authStore'

interface DashboardLayoutProps {
  children: React.ReactNode
  currentNav: string
  onNavChange: (nav: string) => void
}

export function DashboardLayout({ children, currentNav, onNavChange }: DashboardLayoutProps) {
  const user = useAuthStore((s) => s.user)

  const userName = user?.email?.split('@')[0] ?? 'User'
  return (
    <div className="flex h-screen flex-col bg-white">
      {/* System status banner — shown when degraded/outage/maintenance */}
      <StatusBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar navigation */}
        <TopNavBar
          currentNav={currentNav}
          onNavChange={onNavChange}
          userName={userName}
        />

        {/* Main content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
