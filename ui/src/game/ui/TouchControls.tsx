import { useCallback } from 'react'

interface TouchControlsProps {
  onAction: (action: 'left' | 'right' | 'jump' | 'shoot' | 'special', pressed: boolean) => void
  onPause: () => void
}

const btnStyle = {
  border: '2px solid #A855F740',
  background: 'linear-gradient(180deg, #1a1a2e80 0%, #0f0f1a80 100%)',
  fontFamily: '"Press Start 2P", "Courier New", monospace',
  backdropFilter: 'blur(4px)',
} as const

export function TouchControls({ onAction, onPause }: TouchControlsProps) {
  const btn = useCallback(
    (action: 'left' | 'right' | 'jump' | 'shoot' | 'special') => ({
      onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); onAction(action, true) },
      onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); onAction(action, false) },
      onTouchCancel: (e: React.TouchEvent) => { e.preventDefault(); onAction(action, false) },
    }),
    [onAction],
  )

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex items-end justify-between p-4 lg:hidden">
      {/* D-pad */}
      <div className="flex items-center gap-2">
        <button
          {...btn('left')}
          className="flex h-14 w-14 items-center justify-center text-xl active:scale-95"
          style={{ ...btnStyle, color: '#C084FC' }}
        >
          &larr;
        </button>
        <div className="flex flex-col gap-2">
          <button
            {...btn('jump')}
            className="flex h-10 w-14 items-center justify-center text-xl active:scale-95"
            style={{ ...btnStyle, color: '#C084FC' }}
          >
            &uarr;
          </button>
        </div>
        <button
          {...btn('right')}
          className="flex h-14 w-14 items-center justify-center text-xl active:scale-95"
          style={{ ...btnStyle, color: '#C084FC' }}
        >
          &rarr;
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          {...btn('special')}
          className="flex h-12 w-12 items-center justify-center rounded-full text-[8px] font-bold active:scale-95"
          style={{ ...btnStyle, color: '#FBBF24', borderColor: '#FBBF2440', borderRadius: '50%' }}
        >
          SP
        </button>
        <button
          {...btn('shoot')}
          className="flex h-14 w-14 items-center justify-center rounded-full text-[9px] font-bold active:scale-95"
          style={{ ...btnStyle, color: '#22C55E', borderColor: '#22C55E40', borderRadius: '50%', boxShadow: '0 0 10px #22C55E20' }}
        >
          FIRE
        </button>
      </div>

      {/* Pause */}
      <button
        onClick={onPause}
        className="absolute right-4 top-[-40px] flex h-8 w-8 items-center justify-center text-[8px] active:scale-95"
        style={{ ...btnStyle, color: '#64748b' }}
      >
        ||
      </button>
    </div>
  )
}
