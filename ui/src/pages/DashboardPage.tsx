import { useState } from 'react'
import { MessageSquare as MessageSquareIcon } from 'lucide-react'
import { NavRail, MobileBottomNav } from '@/components/layout/NavRail'
import { CommandCenter } from '@/components/layout/ChatPanel'
import { Canvas } from '@/components/canvas/Canvas'
import { TalkToKitzModal } from '@/components/talk/TalkToKitzModal'
import { StatusBanner } from '@/components/layout/StatusBanner'

export function DashboardPage() {
  return (
    <div className="flex h-screen flex-col bg-white">
      <StatusBanner />
      <div className="flex flex-1 overflow-hidden">
        {/* 56px icon-only nav rail — desktop only */}
        <div className="hidden md:flex">
          <NavRail />
        </div>

        {/* Command Center — chat panel on the left (hidden on mobile/tablet) */}
        <div className="hidden lg:flex w-[380px] shrink-0 border-r border-white/10">
          <CommandCenter />
        </div>

        {/* Canvas — main content area, add bottom padding on mobile for nav */}
        <div className="flex-1 overflow-hidden pb-16 md:pb-0">
          <Canvas />
        </div>
      </div>

      {/* Mobile: bottom navigation bar */}
      <MobileBottomNav />

      {/* Mobile: FAB to open Command Center as overlay */}
      <MobileCommandCenterFAB />

      <TalkToKitzModal />
    </div>
  )
}

/** Floating action button on mobile to open Command Center as overlay */
function MobileCommandCenterFAB() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition hover:bg-purple-700 md:bottom-6 md:right-6 md:h-14 md:w-14 lg:hidden"
        aria-label="Open Command Center"
      >
        <MessageSquareIcon className="h-5 w-5 md:h-6 md:w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 top-12 rounded-t-2xl overflow-hidden">
            <CommandCenter />
          </div>
        </div>
      )}
    </>
  )
}
