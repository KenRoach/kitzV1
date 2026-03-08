import { useState } from 'react'
import { MessageSquare as MessageSquareIcon } from 'lucide-react'
import { NavRail } from '@/components/layout/NavRail'
import { CommandCenter } from '@/components/layout/ChatPanel'
import { Canvas } from '@/components/canvas/Canvas'
import { TalkToKitzModal } from '@/components/talk/TalkToKitzModal'
import { StatusBanner } from '@/components/layout/StatusBanner'

export function DashboardPage() {
  return (
    <div className="flex h-screen flex-col bg-white">
      <StatusBanner />
      <div className="flex flex-1 overflow-hidden">
        {/* 56px icon-only nav rail */}
        <NavRail />

        {/* Command Center — chat panel on the left (hidden on mobile) */}
        <div className="hidden lg:flex w-[380px] shrink-0 border-r border-white/10">
          <CommandCenter />
        </div>

        {/* Canvas — main content area */}
        <div className="flex-1 overflow-hidden">
          <Canvas />
        </div>
      </div>

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
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition hover:bg-purple-700 lg:hidden"
        aria-label="Open Command Center"
      >
        <MessageSquareIcon className="h-6 w-6" />
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
