interface HUDProps {
  score: number
  hp: number
  maxHp: number
  lives: number
  levelName: string
  worldNum: number
}

const GAME_NAMES: Record<number, string> = {
  1: 'THE STARTUP',
  2: 'GROWTH MODE',
  3: 'SCALE UP',
}

export function HUD({ score, hp, maxHp, lives, levelName, worldNum }: HUDProps) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3"
        style={{ fontFamily: '"Press Start 2P", "Courier New", monospace' }}
      >
        {/* Left: game name + revenue */}
        <div>
          <div className="text-[6px] uppercase tracking-[0.2em]" style={{ color: '#C084FC', textShadow: '0 0 6px #A855F760' }}>
            {GAME_NAMES[worldNum] ?? `GAME ${worldNum}`}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[8px]" style={{ color: '#22C55E' }}>$</span>
            <span className="text-[12px] font-bold text-white" style={{ textShadow: '0 0 8px #22C55E30' }}>
              {score.toLocaleString()}
            </span>
          </div>
          <div className="text-[5px] uppercase tracking-wider" style={{ color: '#334155' }}>Revenue</div>
        </div>

        {/* Center: level name */}
        <div className="text-center">
          <div className="text-[7px] uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>
            {levelName}
          </div>
        </div>

        {/* Right: brand health + funding rounds */}
        <div className="text-right">
          <div className="text-[5px] uppercase tracking-wider" style={{ color: '#334155' }}>Brand Health</div>
          <div className="flex justify-end gap-1">
            {Array.from({ length: maxHp }, (_, i) => (
              <span
                key={i}
                className="text-[10px]"
                style={{
                  color: i < hp ? '#EF4444' : '#333355',
                  textShadow: i < hp ? '0 0 6px #EF444460' : 'none',
                }}
              >
                {i < hp ? '\u2764' : '\u2661'}
              </span>
            ))}
          </div>
          <div className="mt-1 text-[6px]" style={{ color: '#64748b' }}>
            Funding: <span style={{ color: '#FBBF24' }}>x{lives}</span>
          </div>
        </div>
      </div>

      {/* Bottom: control labels (desktop) */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-center justify-center gap-6 p-3 lg:flex"
        style={{ fontFamily: '"Press Start 2P", "Courier New", monospace' }}
      >
        <span className="text-[6px]" style={{ color: '#333355' }}>[&larr;&rarr;] MOVE</span>
        <span className="text-[6px]" style={{ color: '#333355' }}>[&uarr;] JUMP</span>
        <span className="text-[6px]" style={{ color: '#333355' }}>[SPACE] SHOOT</span>
        <span className="text-[6px]" style={{ color: '#333355' }}>[P] PAUSE</span>
      </div>
    </>
  )
}
