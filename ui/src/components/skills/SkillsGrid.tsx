import { Zap } from 'lucide-react'

export function SkillsGrid() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
      <Zap className="mx-auto h-10 w-10 text-gray-300 mb-3" />
      <h3 className="text-lg font-bold text-black">Skills</h3>
      <p className="mt-1 text-sm text-gray-500">
        Tools and capabilities your agents can use.
      </p>
      <p className="mt-1 font-mono text-xs text-gray-400">
        Call transcription, smart replies, sentiment analysis.
      </p>
    </div>
  )
}
