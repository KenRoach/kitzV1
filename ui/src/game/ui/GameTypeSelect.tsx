const GAME_TYPES = [
  {
    id: 'tycoon',
    name: 'Business Tycoon',
    desc: 'Run a virtual business. Every decision teaches a real business concept.',
    icon: '🏢',
    color: '#A855F7',
    available: true,
  },
  {
    id: 'quiz-battle',
    name: 'Quiz Battle',
    desc: 'Fast-paced business trivia with streak multipliers and power-ups.',
    icon: '⚡',
    color: '#3B82F6',
    available: false,
  },
  {
    id: 'card-strategy',
    name: 'Card Strategy',
    desc: 'Build a deck of business concept cards to solve real challenges.',
    icon: '🃏',
    color: '#10B981',
    available: false,
  },
  {
    id: 'board-adventure',
    name: 'Board Adventure',
    desc: 'Roll dice, advance along the business path, learn as you go.',
    icon: '🎲',
    color: '#FBBF24',
    available: false,
  },
]

interface GameTypeSelectProps {
  onPlayTycoon: () => void
  onShowLeaderboard: () => void
}

export function GameTypeSelect({ onPlayTycoon, onShowLeaderboard }: GameTypeSelectProps) {
  return (
    <div
      className="flex min-h-full flex-col items-center px-4 py-8"
      style={{
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)',
      }}
    >
      <h1
        className="mb-2 text-2xl font-bold tracking-widest text-white"
        style={{ textShadow: '0 0 30px #A855F7, 0 0 60px #7C3AED, 2px 2px 0 #4C1D95' }}
      >
        KITZ ACADEMY
      </h1>
      <div className="mb-2 flex items-center gap-2">
        <div
          className="h-px w-10"
          style={{ background: 'linear-gradient(90deg, transparent, #C084FC60, transparent)' }}
        />
        <p className="text-[7px] uppercase tracking-[0.3em]" style={{ color: '#C084FC80' }}>
          Learn by Playing
        </p>
        <div
          className="h-px w-10"
          style={{ background: 'linear-gradient(90deg, transparent, #C084FC60, transparent)' }}
        />
      </div>
      <p className="mb-10 text-[6px]" style={{ color: '#4a4a6a' }}>
        Master business skills through interactive games
      </p>

      <div className="w-full max-w-md space-y-4">
        {GAME_TYPES.map((game) => (
          <div
            key={game.id}
            className={`relative transition-all duration-150 ${game.available ? 'hover:scale-[1.02]' : 'opacity-60'}`}
            style={{
              background: 'linear-gradient(180deg, #12122a 0%, #0a0a1a 100%)',
              border: `2px solid ${game.available ? game.color + '60' : '#333355'}`,
              boxShadow: game.available ? `0 0 20px ${game.color}15` : 'none',
            }}
          >
            {game.available ? (
              <button
                onClick={onPlayTycoon}
                className="flex w-full items-center gap-4 p-4 text-left"
              >
                <span className="text-2xl">{game.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: game.color, textShadow: `0 0 8px ${game.color}60` }}
                    >
                      {game.name}
                    </span>
                  </div>
                  <p className="mt-1 text-[7px] leading-relaxed" style={{ color: '#64748b' }}>
                    {game.desc}
                  </p>
                </div>
                <span
                  className="text-[8px] font-bold uppercase tracking-wider"
                  style={{
                    color: '#22C55E',
                    textShadow: '0 0 8px #22C55E60',
                  }}
                >
                  PLAY
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-4 p-4">
                <span className="text-2xl grayscale">{game.icon}</span>
                <div className="flex-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: '#4a4a6a' }}
                  >
                    {game.name}
                  </span>
                  <p className="mt-1 text-[7px] leading-relaxed" style={{ color: '#333355' }}>
                    {game.desc}
                  </p>
                </div>
                <span
                  className="text-[7px] font-bold uppercase tracking-wider"
                  style={{
                    color: '#FBBF24',
                    textShadow: '0 0 6px #FBBF2440',
                    padding: '4px 8px',
                    border: '1px solid #FBBF2440',
                    background: '#FBBF2410',
                  }}
                >
                  SOON
                </span>
              </div>
            )}
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
    </div>
  )
}
