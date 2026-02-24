interface LevelCompleteScreenProps {
  levelName: string
  score: number
  xpEarned: number
  onNextLevel: () => void
  onQuit: () => void
}

export function LevelCompleteScreen({ levelName, score, xpEarned, onNextLevel, onQuit }: LevelCompleteScreenProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        background: 'radial-gradient(ellipse at center, #0a1a0a 0%, #000000cc 100%)',
      }}
    >
      <h2
        className="text-2xl font-bold tracking-widest"
        style={{ color: '#22C55E', textShadow: '0 0 40px #22C55E80, 0 0 80px #22C55E40, 2px 2px 0 #14532D' }}
      >
        MILESTONE REACHED!
      </h2>
      <p className="mt-3 text-[8px] uppercase tracking-[0.2em]" style={{ color: '#4ade80' }}>
        {levelName}
      </p>

      <div className="mt-6 flex items-center gap-8">
        <div className="text-center">
          <p className="text-[6px] uppercase tracking-[0.3em]" style={{ color: '#64748b' }}>Revenue</p>
          <div className="mt-1 flex items-center justify-center gap-1">
            <span className="text-[10px]" style={{ color: '#22C55E' }}>$</span>
            <span className="text-lg font-bold" style={{ color: '#FBBF24', textShadow: '0 0 10px #FBBF2460' }}>
              {score.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[6px] uppercase tracking-[0.3em]" style={{ color: '#64748b' }}>Biz XP</p>
          <p className="mt-1 text-lg font-bold" style={{ color: '#A855F7', textShadow: '0 0 10px #A855F760' }}>
            +{xpEarned}
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={onNextLevel}
          className="px-8 py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95"
          style={{
            color: '#22C55E',
            background: 'linear-gradient(180deg, #0a2e1a 0%, #0a1a0a 100%)',
            border: '2px solid #22C55E80',
            boxShadow: '0 0 15px #22C55E20',
            textShadow: '0 0 10px #22C55E80',
          }}
        >
          Next Challenge
        </button>
        <button
          onClick={onQuit}
          className="px-8 py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95"
          style={{
            color: '#94a3b8',
            background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
            border: '2px solid #33335580',
          }}
        >
          Game Select
        </button>
      </div>
    </div>
  )
}
