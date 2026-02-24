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
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 font-mono text-xs text-white">
      <div>
        <div className="text-[10px] text-purple-300">WORLD {worldNum}</div>
        <div className="text-sm font-bold">{score.toLocaleString()}</div>
      </div>
      <div className="text-center text-[10px] uppercase tracking-wider text-gray-400">
        {levelName}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex gap-0.5">
          {Array.from({ length: maxHp }, (_, i) => (
            <span key={i} className={i < hp ? 'text-red-500' : 'text-gray-600'}>
              {i < hp ? '\u2764' : '\u2661'}
            </span>
          ))}
        </div>
        <div className="text-[10px] text-gray-400">x{lives}</div>
      </div>
    </div>
  )
}
