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
    setTimeout(() => onAnswer(correct), 2000)
  }

  const correct = selected === question.correctIndex

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4"
      style={{
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #000000dd 100%)',
      }}
    >
      <div
        className="w-full max-w-lg p-6"
        style={{
          background: 'linear-gradient(180deg, #12122a 0%, #0a0a1a 100%)',
          border: '2px solid #A855F780',
          boxShadow: '0 0 40px #A855F720',
        }}
      >
        {/* Header */}
        <div className="mb-1 flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" style={{ boxShadow: '0 0 8px #22C55E' }} />
          <span className="text-[7px] uppercase tracking-[0.3em]" style={{ color: '#22C55E', textShadow: '0 0 8px #22C55E60' }}>
            Business Advisor
          </span>
        </div>
        <p className="mb-4 text-[6px]" style={{ color: '#4a4a6a' }}>
          Answer correctly to restore Brand Health and earn revenue!
        </p>

        {/* Question */}
        <h3 className="mb-5 text-[9px] leading-relaxed text-white" style={{ textShadow: '0 0 4px #ffffff20' }}>
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            let borderColor = '#333355'
            let bgColor = '#0f0f1a'
            let textColor = '#c4c4d4'
            let glow = ''

            if (revealed) {
              if (i === question.correctIndex) {
                borderColor = '#22C55E'
                bgColor = '#0a2e1a'
                textColor = '#4ade80'
                glow = '0 0 10px #22C55E30'
              } else if (i === selected) {
                borderColor = '#EF4444'
                bgColor = '#2e0a0a'
                textColor = '#f87171'
                glow = '0 0 10px #EF444430'
              } else {
                borderColor = '#1a1a2e'
                bgColor = '#0a0a12'
                textColor = '#333355'
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={revealed}
                className="w-full text-left text-[8px] leading-relaxed transition-all duration-150"
                style={{
                  padding: '10px 14px',
                  border: `2px solid ${borderColor}`,
                  background: bgColor,
                  color: textColor,
                  boxShadow: glow || (revealed ? 'none' : 'inset 0 1px 0 #ffffff05'),
                  cursor: revealed ? 'default' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!revealed) {
                    e.currentTarget.style.borderColor = '#A855F7'
                    e.currentTarget.style.boxShadow = '0 0 12px #A855F720'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!revealed) {
                    e.currentTarget.style.borderColor = '#333355'
                    e.currentTarget.style.boxShadow = 'inset 0 1px 0 #ffffff05'
                  }
                }}
              >
                <span style={{ color: revealed ? textColor : '#7C3AED', marginRight: 8 }}>
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            )
          })}
        </div>

        {/* Result */}
        {revealed && (
          <div
            className="mt-4 p-3 text-[7px] leading-relaxed"
            style={{
              border: `1px solid ${correct ? '#22C55E40' : '#EF444440'}`,
              background: correct ? '#0a2e1a' : '#2e0a0a',
              color: correct ? '#4ade80' : '#f87171',
            }}
          >
            <div className="mb-1 text-[9px] font-bold" style={{ textShadow: `0 0 10px ${correct ? '#22C55E60' : '#EF444460'}` }}>
              {correct ? '$ SMART MOVE — BRAND HEALTH RESTORED' : '! BAD DECISION — COMPETITORS CLOSING IN'}
            </div>
            <p style={{ color: '#94a3b8' }}>{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  )
}
