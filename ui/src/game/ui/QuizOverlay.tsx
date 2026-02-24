import { useState } from 'react'
import type { Question } from '@/content/courses'

interface QuizOverlayProps {
  question: Question
  onAnswer: (correct: boolean) => void
}

export function QuizOverlay({ question, onAnswer }: QuizOverlayProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const handleSelect = (idx: number) => {
    if (revealed) return
    setSelected(idx)
    setRevealed(true)
    const correct = idx === question.correctIndex
    setTimeout(() => onAnswer(correct), 1500)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-purple-500/30 bg-gray-900 p-6 shadow-2xl">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-purple-400">
          Incoming Intel
        </div>
        <h3 className="mb-4 text-sm font-bold leading-snug text-white">
          {question.question}
        </h3>
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            let style = 'border-gray-700 bg-gray-800 hover:border-purple-400 text-gray-200'
            if (revealed) {
              if (i === question.correctIndex) {
                style = 'border-green-500 bg-green-900/30 text-green-300'
              } else if (i === selected) {
                style = 'border-red-500 bg-red-900/30 text-red-300'
              } else {
                style = 'border-gray-800 bg-gray-900 text-gray-600'
              }
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={revealed}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-xs transition ${style}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
        {revealed && (
          <div className={`mt-3 rounded-lg p-3 text-xs ${selected === question.correctIndex ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
            {selected === question.correctIndex ? 'Correct! +1 HP restored.' : 'Wrong \u2014 enemies incoming faster!'}
            <p className="mt-1 text-gray-400">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  )
}
