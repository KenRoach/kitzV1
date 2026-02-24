interface LeaderboardEntry {
  name: string
  score: number
  world: number
  level: number
  date: string
}

interface LeaderboardProps {
  onBack: () => void
}

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

export function Leaderboard({ onBack }: LeaderboardProps) {
  const entries: LeaderboardEntry[] = (() => {
    try {
      const raw = localStorage.getItem('kitz-run-leaderboard')
      return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : []
    } catch {
      return []
    }
  })()

  const sorted = [...entries].sort((a, b) => b.score - a.score).slice(0, 10)

  return (
    <div
      className="flex min-h-full flex-col items-center py-8 px-4"
      style={{
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)',
      }}
    >
      {/* Title */}
      <h2
        className="mb-2 text-2xl font-bold tracking-widest"
        style={{ color: '#FBBF24', textShadow: '0 0 30px #FBBF2480, 2px 2px 0 #92400E' }}
      >
        HIGH SCORES
      </h2>
      <div className="mb-8 flex items-center gap-2">
        <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, #FBBF2460, transparent)' }} />
        <span className="text-[8px] tracking-[0.3em]" style={{ color: '#FBBF2480' }}>TOP 10</span>
        <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, #FBBF2460, transparent)' }} />
      </div>

      {/* Scoreboard */}
      <div
        className="w-full max-w-md"
        style={{
          border: '2px solid #333355',
          background: 'linear-gradient(180deg, #12122a 0%, #0a0a1a 100%)',
          boxShadow: '0 0 30px #0a0a2a, inset 0 1px 0 #ffffff08',
        }}
      >
        {/* Header row */}
        <div
          className="flex items-center px-4 py-3 text-[8px] uppercase tracking-[0.2em]"
          style={{ borderBottom: '2px solid #333355', color: '#6366F1' }}
        >
          <span className="w-10">Rank</span>
          <span className="flex-1">Player</span>
          <span className="w-16 text-center">Stage</span>
          <span className="w-24 text-right">Score</span>
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <p className="text-[9px]" style={{ color: '#4a4a6a' }}>NO SCORES YET</p>
            <p className="mt-2 text-[7px]" style={{ color: '#333355' }}>PLAY A LEVEL TO GET STARTED</p>
          </div>
        ) : (
          sorted.map((e, i) => {
            const rankColor = RANK_COLORS[i] ?? '#C084FC'
            return (
              <div
                key={`${e.date}-${e.score}`}
                className="flex items-center px-4 py-3 transition-colors"
                style={{
                  borderBottom: '1px solid #1a1a2e',
                  background: i === 0 ? '#FBBF2408' : 'transparent',
                }}
              >
                {/* Rank */}
                <span
                  className="w-10 text-[10px] font-bold"
                  style={{ color: rankColor, textShadow: i < 3 ? `0 0 8px ${rankColor}60` : 'none' }}
                >
                  {i < 3 ? ['1ST', '2ND', '3RD'][i] : `${i + 1}.`}
                </span>

                {/* Name */}
                <span className="flex-1 text-[9px] text-white">{e.name}</span>

                {/* Stage */}
                <span className="w-16 text-center text-[8px]" style={{ color: '#64748b' }}>
                  W{e.world}-{e.level}
                </span>

                {/* Score */}
                <span
                  className="w-24 text-right text-[10px] font-bold"
                  style={{
                    color: i === 0 ? '#FBBF24' : '#e2e8f0',
                    textShadow: i === 0 ? '0 0 10px #FBBF2460' : 'none',
                  }}
                >
                  {e.score.toLocaleString()}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="mt-8 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95"
        style={{
          color: '#C084FC',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
          border: '2px solid #6366F180',
          boxShadow: '0 0 15px #6366F120, inset 0 1px 0 #6366F120',
          textShadow: '0 0 10px #A855F780',
        }}
      >
        {'<'} Back
      </button>
    </div>
  )
}
