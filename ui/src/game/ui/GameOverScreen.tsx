interface GameOverScreenProps {
  score: number
  onRetry: () => void
  onQuit: () => void
}

export function GameOverScreen({ score, onRetry, onQuit }: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 font-mono">
      <h2 className="text-3xl font-bold text-red-500">GAME OVER</h2>
      <p className="mt-2 text-sm text-gray-400">Final Score</p>
      <p className="text-2xl font-bold text-white">{score.toLocaleString()}</p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={onRetry}
          className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-bold text-white hover:bg-purple-500"
        >
          Try Again
        </button>
        <button
          onClick={onQuit}
          className="rounded-lg bg-gray-700 px-6 py-2 text-sm font-bold text-white hover:bg-gray-600"
        >
          Quit
        </button>
      </div>
    </div>
  )
}
