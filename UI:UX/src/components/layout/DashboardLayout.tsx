import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useAuthStore } from '@/stores/authStore'

interface DashboardLayoutProps {
  children: React.ReactNode
  currentNav: string
  onNavChange: (nav: string) => void
}

export function DashboardLayout({ children, currentNav, onNavChange }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)

  const userName = user?.email?.split('@')[0] ?? 'User'
  const userEmail = user?.email ?? ''

  return (
    <div className="flex h-screen bg-white">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar
          currentNav={currentNav}
          onNavChange={onNavChange}
          userName={userName}
          userEmail={userEmail}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <Sidebar
              currentNav={currentNav}
              onNavChange={(nav) => {
                onNavChange(nav)
                setSidebarOpen(false)
              }}
              userName={userName}
              userEmail={userEmail}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
