import { ChatPanel } from '@/components/layout/ChatPanel'
import { CanvasPreview } from '@/components/layout/CanvasPreview'
import { Orb } from '@/components/orb/Orb'

export function DashboardPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left: dark chat panel */}
      <div className="w-[420px] shrink-0 border-r border-white/10">
        <ChatPanel />
      </div>

      {/* Right: white canvas preview */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Voice orb centered at top */}
        <Orb />
        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <CanvasPreview />
        </div>
      </div>
    </div>
  )
}
