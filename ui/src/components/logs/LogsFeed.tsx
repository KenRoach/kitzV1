import { ScrollText } from 'lucide-react'

export function LogsFeed() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
      <ScrollText className="mx-auto h-10 w-10 text-gray-300 mb-3" />
      <h3 className="text-lg font-bold text-black">Logs</h3>
      <p className="mt-1 text-sm text-gray-500">
        Everything your agents did, in one place.
      </p>
      <p className="mt-1 font-mono text-xs text-gray-400">
        Follow-ups sent, orders tracked, payments received.
      </p>
    </div>
  )
}
