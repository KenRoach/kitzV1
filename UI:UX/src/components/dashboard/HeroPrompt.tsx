import { useState } from 'react'
import { ArrowUp } from 'lucide-react'

interface HeroPromptProps {
  userName: string
}

export function HeroPrompt({ userName }: HeroPromptProps) {
  const [prompt, setPrompt] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    // TODO: Wire to kitz_os POST /api/kitz
    setPrompt('')
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pt-12 pb-8 text-center">
      <h2 className="text-3xl font-bold text-black">
        Let's build something,{' '}
        <span className="text-gray-400">{userName}</span>
      </h2>

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm transition-shadow focus-within:shadow-md">
          <div className="flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Kitz to create an automation that..."
              className="w-full bg-transparent text-base text-black placeholder-gray-400 outline-none"
            />
          </div>
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100"
          >
            Plan
          </button>
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00D4AA] text-white transition hover:bg-[#00E8BB]"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
