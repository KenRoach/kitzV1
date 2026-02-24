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
  { num: 1, name: 'Startup Street', levels: WORLD_1, color: '#A855F7' },
  { num: 2, name: 'Market Square', levels: WORLD_2, color: '#3B82F6' },
  { num: 3, name: 'Finance Fortress', levels: WORLD_3, color: '#F59E0B' },
  { num: 4, name: 'Tech Tower', levels: WORLD_4, color: '#6366F1' },
  { num: 5, name: 'Empire Summit', levels: WORLD_5, color: '#EAB308' },
]

export function LevelSelect({ onSelectLevel, highScores, onShowLeaderboard }: LevelSelectProps) {
  return (
    <div
      className="flex min-h-full flex-col items-center py-8 px-4"
      style={{
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)',
      }}
    >
      {/* Title */}
      <h1
        className="mb-2 text-3xl font-bold tracking-widest text-white"
        style={{ textShadow: '0 0 30px #A855F7, 0 0 60px #7C3AED, 2px 2px 0 #4C1D95' }}
      >
        KITZ RUN
      </h1>
      <p
        className="mb-10 text-[10px] tracking-wider"
        style={{ color: '#C084FC', textShadow: '0 0 10px #A855F780' }}
      >
        {'>'} YOUR HUSTLE DESERVES INFRASTRUCTURE {'<'}
      </p>

      {/* Worlds */}
      <div className="w-full max-w-lg space-y-6">
        {WORLDS.map((world) => (
          <div key={world.num}>
            {/* World header */}
            <div className="mb-3 flex items-center gap-3">
              <div
                className="h-3 w-3"
                style={{ backgroundColor: world.color, boxShadow: `0 0 8px ${world.color}` }}
              />
              <h2
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: world.color, textShadow: `0 0 10px ${world.color}60` }}
              >
                World {world.num}: {world.name}
              </h2>
            </div>

            {/* Level buttons */}
            <div className="grid grid-cols-5 gap-2">
              {world.levels.map((level, i) => {
                const scoreVal = highScores[level.id]
                const isBoss = i === 4
                return (
                  <button
                    key={level.id}
                    onClick={() => onSelectLevel(level)}
                    className="group relative flex flex-col items-center gap-1 p-3 transition-all duration-150 hover:scale-105 active:scale-95"
                    style={{
                      background: isBoss
                        ? 'linear-gradient(180deg, #2d1b4e 0%, #1a0a2e 100%)'
                        : 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
                      border: `2px solid ${isBoss ? world.color + '80' : '#333355'}`,
                      boxShadow: isBoss ? `0 0 12px ${world.color}30, inset 0 1px 0 ${world.color}20` : 'inset 0 1px 0 #ffffff08',
                      imageRendering: 'pixelated',
                    }}
                  >
                    {/* Level number */}
                    <span
                      className="text-lg font-bold"
                      style={{
                        color: isBoss ? world.color : '#e2e8f0',
                        textShadow: isBoss ? `0 0 10px ${world.color}` : 'none',
                      }}
                    >
                      {i + 1}
                    </span>

                    {/* Level name */}
                    <span
                      className="w-full truncate text-center text-[7px]"
                      style={{ color: isBoss ? world.color + 'cc' : '#64748b' }}
                    >
                      {level.name}
                    </span>

                    {/* High score */}
                    {scoreVal !== undefined && (
                      <span className="text-[7px] text-yellow-400" style={{ textShadow: '0 0 6px #FBBF2460' }}>
                        {scoreVal.toLocaleString()}
                      </span>
                    )}

                    {/* Hover glow */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                      style={{
                        border: `2px solid ${world.color}`,
                        boxShadow: `0 0 15px ${world.color}40`,
                      }}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard button */}
      <button
        onClick={onShowLeaderboard}
        className="mt-10 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95"
        style={{
          color: '#FBBF24',
          background: 'linear-gradient(180deg, #2d1b00 0%, #1a1000 100%)',
          border: '2px solid #FBBF2480',
          boxShadow: '0 0 20px #FBBF2420, inset 0 1px 0 #FBBF2420',
          textShadow: '0 0 10px #FBBF2480',
        }}
      >
        Leaderboard
      </button>

      {/* Controls hint */}
      <div className="mt-6 flex items-center gap-4 text-[8px] tracking-wider" style={{ color: '#4a4a6a' }}>
        <span>[ARROWS] MOVE</span>
        <span>[SPACE] SHOOT</span>
        <span>[Z] SPECIAL</span>
        <span>[P] PAUSE</span>
      </div>
    </div>
  )
}
