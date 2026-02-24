import { useState } from 'react'
import type { Question } from '@/content/courses'

interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  onAnswer: (correct: boolean) => void
  onNext: () => void
  alreadyAnswered: boolean
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNext,
  alreadyAnswered,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(alreadyAnswered)

  const handleSelect = (index: number) => {
    if (revealed) return
    setSelected(index)
    const correct = index === question.correctIndex
    setRevealed(true)
    onAnswer(correct)
  }

  const isCorrect = selected === question.correctIndex

  return (
    <div className="mx-auto max-w-lg px-4">
      {/* Progress indicator */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-purple-500 transition-all"
            style={{ width: `${((questionNumber) / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-400">
          {questionNumber}/{totalQuestions}
        </span>
      </div>

      {/* Question type badge */}
      <div className="mb-3">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
          question.type === 'scenario'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-purple-100 text-purple-700'
        }`}>
          {question.type === 'scenario' ? 'Scenario' : 'Quiz'}
        </span>
      </div>

      {/* Question */}
      <h2 className="mb-5 text-lg font-bold leading-snug text-gray-900">
        {question.question}
      </h2>

      {/* Options */}
      <div className="space-y-2.5">
        {question.options.map((option, i) => {
          let style = 'border-gray-200 bg-white hover:border-purple-300'
          if (revealed) {
            if (i === question.correctIndex) {
              style = 'border-green-500 bg-green-50'
            } else if (i === selected && !isCorrect) {
              style = 'border-red-400 bg-red-50'
            } else {
              style = 'border-gray-100 bg-gray-50 opacity-50'
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={revealed}
              className={`w-full rounded-lg border-2 px-4 py-3 text-left text-sm transition ${style}`}
            >
              {option}
            </button>
          )
        })}
      </div>

      {/* Explanation — shows after answering */}
      {revealed && (
        <div className={`mt-5 rounded-lg p-4 ${isCorrect || alreadyAnswered ? 'bg-green-50' : 'bg-amber-50'}`}>
          <p className={`text-sm font-semibold ${isCorrect || alreadyAnswered ? 'text-green-700' : 'text-amber-700'}`}>
            {isCorrect || alreadyAnswered ? '+50 XP!' : 'Not quite — here is the answer:'}
          </p>
          <p className="mt-1 text-sm text-gray-700">{question.explanation}</p>
          <button
            onClick={onNext}
            className="mt-3 rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-600"
          >
            {questionNumber >= totalQuestions ? 'Finish Course' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  )
}
