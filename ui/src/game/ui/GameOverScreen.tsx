interface GameOverScreenProps {
  score: number
  onRetry: () => void
  onQuit: () => void
}

export function GameOverScreen({ score, onRetry, onQuit }: GameOverScreenProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        background: 'radial-gradient(ellipse at center, #1a0000 0%, #000000cc 100%)',
      }}
    >
      <h2
        className="text-3xl font-bold tracking-widest"
        style={{ color: '#EF4444', textShadow: '0 0 40px #EF444480, 0 0 80px #EF444440, 2px 2px 0 #7F1D1D' }}
      >
        OUT OF BUSINESS
      </h2>
      <p className="mt-2 text-[8px]" style={{ color: '#f8717180' }}>Your startup ran out of funding.</p>

      <div className="mt-6 text-center">
        <p className="text-[7px] uppercase tracking-[0.3em]" style={{ color: '#64748b' }}>Total Revenue</p>
        <div className="mt-2 flex items-center justify-center gap-1">
          <span className="text-[14px]" style={{ color: '#22C55E' }}>$</span>
          <span
            className="text-2xl font-bold"
            style={{ color: '#FBBF24', textShadow: '0 0 15px #FBBF2460' }}
          >
            {score.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={onRetry}
          className="px-8 py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95"
          style={{
            color: '#A855F7',
            background: 'linear-gradient(180deg, #2d1b4e 0%, #1a0a2e 100%)',
            border: '2px solid #A855F780',
            boxShadow: '0 0 15px #A855F720',
            textShadow: '0 0 10px #A855F780',
          }}
        >
          Pivot & Retry
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
          Exit
        </button>
      </div>
    </div>
  )
}
