interface LevelCompleteScreenProps {
  levelName: string
  score: number
  xpEarned: number
  onNextLevel: () => void
  onQuit: () => void
}

export function LevelCompleteScreen({ levelName, score, xpEarned, onNextLevel, onQuit }: LevelCompleteScreenProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 font-mono">
      <h2 className="text-2xl font-bold text-green-400">LEVEL CLEAR!</h2>
      <p className="mt-1 text-xs text-gray-400">{levelName}</p>
      <div className="mt-4 flex items-center gap-6">
        <div className="text-center">
          <p className="text-[10px] text-gray-500">SCORE</p>
          <p className="text-lg font-bold text-white">{score.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500">XP EARNED</p>
          <p className="text-lg font-bold text-purple-400">+{xpEarned}</p>
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          onClick={onNextLevel}
          className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-bold text-white hover:bg-purple-500"
        >
          Next Level
        </button>
        <button
          onClick={onQuit}
          className="rounded-lg bg-gray-700 px-6 py-2 text-sm font-bold text-white hover:bg-gray-600"
        >
          Level Select
        </button>
      </div>
    </div>
  )
}
