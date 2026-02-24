import { KitzGame } from '@/game/KitzGame'

export function GamePage() {
  return (
    <div className="flex min-h-full w-full items-stretch bg-[#0D0D12]" style={{ height: '100%' }}>
      <KitzGame />
    </div>
  )
}
