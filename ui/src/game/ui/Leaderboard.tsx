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
    <div className="flex min-h-full flex-col items-center justify-center bg-[#0D0D12] p-4 font-mono">
      <h2 className="mb-6 text-xl font-bold text-yellow-400">TOP SCORES</h2>
      {sorted.length === 0 ? (
        <p className="text-xs text-gray-500">No scores yet. Play a level!</p>
      ) : (
        <div className="w-full max-w-sm space-y-1">
          {sorted.map((e, i) => (
            <div key={`${e.date}-${e.score}`} className="flex items-center justify-between rounded bg-gray-900 px-3 py-2 text-xs">
              <span className="w-6 font-bold text-purple-400">{i + 1}.</span>
              <span className="flex-1 text-white">{e.name}</span>
              <span className="text-gray-400">
                W{e.world}-{e.level}
              </span>
              <span className="ml-3 font-bold text-yellow-400">{e.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onBack}
        className="mt-6 rounded-lg bg-gray-700 px-6 py-2 text-sm font-bold text-white hover:bg-gray-600"
      >
        Back
      </button>
    </div>
  )
}
