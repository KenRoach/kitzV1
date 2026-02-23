/**
 * Animated typing indicator — three bouncing dots shown while KITZ is thinking.
 * Uses the `typing-bounce` keyframe defined in index.css.
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-3">
        <span
          className="h-2 w-2 rounded-full bg-purple-400"
          style={{ animation: 'typing-bounce 1.4s ease-in-out infinite' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-purple-400"
          style={{ animation: 'typing-bounce 1.4s ease-in-out 0.2s infinite' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-purple-400"
          style={{ animation: 'typing-bounce 1.4s ease-in-out 0.4s infinite' }}
        />
      </div>
      <span className="text-[11px] text-gray-500">Kitz is thinking…</span>
    </div>
  )
}
