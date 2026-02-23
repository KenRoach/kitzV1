export function StatsRow() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <div className="flex items-center justify-center gap-6 font-mono text-xs text-gray-500">
        <span>AI Battery: <span className="font-semibold text-black">5 credits</span> <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500" /></span>
        <span className="text-gray-300">|</span>
        <span>Agents: <span className="font-semibold text-black">8 / 15</span> <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /></span>
        <span className="text-gray-300">|</span>
        <span>WhatsApp: <span className="font-semibold text-black">Connected</span> <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500" /></span>
      </div>
    </div>
  )
}
