import { useState, useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { GameTypeSelect } from './ui/GameTypeSelect'
import { TycoonGame } from './ui/TycoonGame'
import { Leaderboard } from './ui/Leaderboard'

type View = 'menu' | 'tycoon' | 'leaderboard'

function saveLeaderboardEntry(score: number, world: number) {
  try {
    const raw = localStorage.getItem('kitz-run-leaderboard')
    const entries: { name: string; score: number; world: number; level: number; date: string }[] =
      raw ? JSON.parse(raw) : []
    entries.push({ name: 'Founder', score, world, level: 1, date: new Date().toISOString() })
    entries.sort((a, b) => b.score - a.score)
    localStorage.setItem('kitz-run-leaderboard', JSON.stringify(entries.slice(0, 20)))
  } catch {
    /* ignore */
  }
}

export function KitzGame() {
  const [view, setView] = useState<View>('menu')
  const addXP = useGameStore((s) => s.addXP)

  const handleFinish = useCallback(
    (score: number, worldNum: number) => {
      saveLeaderboardEntry(score, worldNum)
      addXP(Math.floor(score / 100))
    },
    [addXP],
  )

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0D0D12]">
      {view === 'menu' && (
        <div className="absolute inset-0 z-40 overflow-y-auto">
          <GameTypeSelect
            onPlayTycoon={() => setView('tycoon')}
            onShowLeaderboard={() => setView('leaderboard')}
          />
        </div>
      )}

      {view === 'tycoon' && (
        <TycoonGame onQuit={() => setView('menu')} onFinish={handleFinish} />
      )}

      {view === 'leaderboard' && (
        <div className="absolute inset-0 z-40 overflow-y-auto">
          <Leaderboard onBack={() => setView('menu')} />
        </div>
      )}
    </div>
  )
}
