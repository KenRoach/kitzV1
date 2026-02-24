interface HUDProps {
  score: number
  hp: number
  maxHp: number
  lives: number
  levelName: string
  worldNum: number
}

export function HUD({ score, hp, maxHp, lives, levelName, worldNum }: HUDProps) {
  return (
    <>
      {/* Top HUD bar */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3"
        style={{ fontFamily: '"Press Start 2P", "Courier New", monospace' }}
      >
        {/* Left: world + score */}
        <div>
          <div className="text-[7px] uppercase tracking-[0.2em]" style={{ color: '#C084FC', textShadow: '0 0 6px #A855F760' }}>
            World {worldNum}
          </div>
          <div className="text-[12px] font-bold text-white" style={{ textShadow: '0 0 8px #ffffff30' }}>
            {score.toLocaleString()}
          </div>
        </div>

        {/* Center: level name */}
        <div className="text-center text-[7px] uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>
          {levelName}
        </div>

        {/* Right: HP + lives */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
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
          <div className="text-[8px]" style={{ color: '#64748b' }}>x{lives}</div>
        </div>
      </div>

      {/* Bottom: control labels (desktop only) */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-center justify-center gap-6 p-3 lg:flex"
        style={{ fontFamily: '"Press Start 2P", "Courier New", monospace' }}
      >
        <span className="text-[6px]" style={{ color: '#333355' }}>[&larr;&rarr;] MOVE</span>
        <span className="text-[6px]" style={{ color: '#333355' }}>[&uarr;] JUMP</span>
        <span className="text-[6px]" style={{ color: '#333355' }}>[SPACE] SHOOT</span>
        <span className="text-[6px]" style={{ color: '#333355' }}>[Z] SPECIAL</span>
        <span className="text-[6px]" style={{ color: '#333355' }}>[P] PAUSE</span>
      </div>
    </>
  )
}
