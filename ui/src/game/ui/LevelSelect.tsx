import { WORLD_1 } from '../levels/World1'
import { WORLD_2 } from '../levels/World2'
import { WORLD_3 } from '../levels/World3'
import { WORLD_4 } from '../levels/World4'
import { WORLD_5 } from '../levels/World5'
import type { LevelDef } from '../levels/LevelData'

interface LevelSelectProps {
  onSelectLevel: (level: LevelDef) => void
  highScores: Record<string, number>
  onShowLeaderboard: () => void
}

const WORLDS = [
  { num: 1, name: 'Startup Street', levels: WORLD_1, color: '#A855F7', unlocked: true },
  { num: 2, name: 'Market Square', levels: WORLD_2, color: '#3B82F6', unlocked: true },
  { num: 3, name: 'Finance Fortress', levels: WORLD_3, color: '#F59E0B', unlocked: true },
  { num: 4, name: 'Tech Tower', levels: WORLD_4, color: '#6366F1', unlocked: true },
  { num: 5, name: 'Empire Summit', levels: WORLD_5, color: '#EAB308', unlocked: true },
]

export function LevelSelect({ onSelectLevel, highScores, onShowLeaderboard }: LevelSelectProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#0D0D12] p-4 font-mono">
      <h1 className="mb-1 text-2xl font-bold text-white">KITZ RUN</h1>
      <p className="mb-8 text-xs text-purple-300">Your hustle deserves infrastructure.</p>

      {WORLDS.map((world) => (
        <div key={world.num} className="mb-6 w-full max-w-md">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-purple-400">
            World {world.num}: {world.name}
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {world.levels.map((level, i) => {
              const score = highScores[level.id]
              return (
                <button
                  key={level.id}
                  onClick={() => world.unlocked && onSelectLevel(level)}
                  disabled={!world.unlocked}
                  className={`flex flex-col items-center rounded-lg border p-3 transition ${
                    world.unlocked
                      ? 'border-purple-500/30 bg-gray-900 text-white hover:border-purple-400 hover:bg-gray-800'
                      : 'cursor-not-allowed border-gray-800 bg-gray-950 text-gray-600'
                  }`}
                >
                  <span className="text-lg font-bold">{i + 1}</span>
                  <span className="mt-1 w-full truncate text-center text-[8px] text-gray-400">{level.name}</span>
                  {score !== undefined && (
                    <span className="mt-1 text-[8px] text-yellow-400">{score.toLocaleString()}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <button
        onClick={onShowLeaderboard}
        className="mt-6 rounded-lg bg-yellow-600 px-6 py-2 text-sm font-bold text-white hover:bg-yellow-500"
      >
        Leaderboard
      </button>

      <p className="mt-4 text-[10px] text-gray-600">
        Arrow keys to move &middot; Space to shoot &middot; Z for special
      </p>
    </div>
  )
}
