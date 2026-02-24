import { WORLD_1 } from '../levels/World1'
import { WORLD_2 } from '../levels/World2'
import { WORLD_3 } from '../levels/World3'
import type { LevelDef } from '../levels/LevelData'

interface LevelSelectProps {
  onSelectLevel: (level: LevelDef) => void
  highScores: Record<string, number>
  onShowLeaderboard: () => void
}

const GAMES = [
  {
    num: 1,
    name: 'The Startup',
    desc: 'Business plans, revenue, customers & getting started',
    levels: WORLD_1.slice(0, 3),
    color: '#A855F7',
    icon: '🚀',
    difficulty: 'EASY',
  },
  {
    num: 2,
    name: 'Growth Mode',
    desc: 'Marketing, social media, tools & tech stack',
    levels: WORLD_2.slice(0, 3),
    color: '#3B82F6',
    icon: '📈',
    difficulty: 'MEDIUM',
  },
  {
    num: 3,
    name: 'Scale Up',
    desc: 'Operations, automation, payments & management',
    levels: WORLD_3.slice(0, 3),
    color: '#FBBF24',
    icon: '👑',
    difficulty: 'HARD',
  },
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
        className="mb-4 text-[8px] tracking-wider"
        style={{ color: '#C084FC', textShadow: '0 0 10px #A855F780' }}
      >
        {'>'} BUILD YOUR BUSINESS EMPIRE {'<'}
      </p>
      <p className="mb-10 text-[7px]" style={{ color: '#4a4a6a' }}>
        Collect revenue. Defeat threats. Learn business skills.
      </p>

      {/* Games */}
      <div className="w-full max-w-lg space-y-8">
        {GAMES.map((game) => (
          <div key={game.num}>
            {/* Game header */}
            <div className="mb-3 flex items-center gap-3">
              <div
                className="h-3 w-3"
                style={{ backgroundColor: game.color, boxShadow: `0 0 8px ${game.color}` }}
              />
              <h2
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: game.color, textShadow: `0 0 10px ${game.color}60` }}
              >
                Game {game.num}: {game.name}
              </h2>
              <span
                className="ml-auto text-[7px] uppercase tracking-wider"
                style={{
                  color: game.num === 1 ? '#22C55E' : game.num === 2 ? '#FBBF24' : '#EF4444',
                  textShadow: `0 0 6px ${game.num === 1 ? '#22C55E' : game.num === 2 ? '#FBBF24' : '#EF4444'}60`,
                }}
              >
                {game.difficulty}
              </span>
            </div>

            {/* Description */}
            <p className="mb-3 text-[7px] leading-relaxed" style={{ color: '#64748b' }}>
              {game.icon} {game.desc}
            </p>

            {/* Level buttons */}
            <div className="grid grid-cols-3 gap-3">
              {game.levels.map((level, i) => {
                const scoreVal = highScores[level.id]
                return (
                  <button
                    key={level.id}
                    onClick={() => onSelectLevel(level)}
                    className="group relative flex flex-col items-center gap-1 p-4 transition-all duration-150 hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
                      border: `2px solid ${game.color}40`,
                      boxShadow: 'inset 0 1px 0 #ffffff08',
                    }}
                  >
                    <span
                      className="text-xl font-bold"
                      style={{ color: '#e2e8f0', textShadow: '0 0 6px #ffffff20' }}
                    >
                      {i + 1}
                    </span>
                    <span className="w-full truncate text-center text-[7px]" style={{ color: '#64748b' }}>
                      {level.name}
                    </span>
                    {scoreVal !== undefined && (
                      <span className="text-[7px]" style={{ color: '#22C55E', textShadow: '0 0 6px #22C55E60' }}>
                        ${scoreVal.toLocaleString()}
                      </span>
                    )}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ border: `2px solid ${game.color}`, boxShadow: `0 0 15px ${game.color}40` }}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <button
        onClick={onShowLeaderboard}
        className="mt-10 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95"
        style={{
          color: '#FBBF24',
          background: 'linear-gradient(180deg, #2d1b00 0%, #1a1000 100%)',
          border: '2px solid #FBBF2480',
          boxShadow: '0 0 20px #FBBF2420',
          textShadow: '0 0 10px #FBBF2480',
        }}
      >
        Top Founders
      </button>

      {/* Controls */}
      <div className="mt-6 flex items-center gap-4 text-[7px] tracking-wider" style={{ color: '#4a4a6a' }}>
        <span>[ARROWS] MOVE</span>
        <span>[SPACE] SHOOT</span>
        <span>[Z] SPECIAL</span>
        <span>[P] PAUSE</span>
      </div>
    </div>
  )
}
