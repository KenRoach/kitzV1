import { useCallback } from 'react'

interface TouchControlsProps {
  onAction: (action: 'left' | 'right' | 'jump' | 'shoot' | 'special', pressed: boolean) => void
  onPause: () => void
}

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
      <div className="flex items-center gap-2">
        <button
          {...btn('left')}
          className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-xl text-white active:bg-white/20"
        >
          &larr;
        </button>
        <div className="flex flex-col gap-2">
          <button
            {...btn('jump')}
            className="flex h-10 w-14 items-center justify-center rounded-xl bg-white/10 text-xl text-white active:bg-white/20"
          >
            &uarr;
          </button>
        </div>
        <button
          {...btn('right')}
          className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-xl text-white active:bg-white/20"
        >
          &rarr;
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          {...btn('special')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/30 text-[10px] font-bold text-purple-300 active:bg-purple-500/50"
        >
          SP
        </button>
        <button
          {...btn('shoot')}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/40 text-xs font-bold text-white active:bg-purple-500/60"
        >
          FIRE
        </button>
      </div>
      <button
        onClick={onPause}
        className="absolute right-4 top-[-40px] flex h-8 w-8 items-center justify-center rounded bg-white/10 text-xs text-white"
      >
        ||
      </button>
    </div>
  )
}
