import { useState } from 'react'
import { COURSES } from '@/content/courses'
import type { Question } from '@/content/courses'

/* ── types ─────────────────────────────────────────────── */

type Difficulty = 'startup' | 'growth' | 'scale'
type Phase = 'select' | 'playing' | 'outcome' | 'won' | 'lost'

const DIFFS: Difficulty[] = ['startup', 'growth', 'scale']

const CFG: Record<
  Difficulty,
  {
    name: string
    desc: string
    color: string
    label: string
    labelColor: string
    startCash: number
    startCustomers: number
    revenueTarget: number
    maxMonths: number
    monthlyCost: number
    courses: string[]
  }
> = {
  startup: {
    name: 'The Startup',
    desc: 'Business basics, revenue & first customers',
    color: '#A855F7',
    label: 'EASY',
    labelColor: '#22C55E',
    startCash: 5000,
    startCustomers: 3,
    revenueTarget: 15000,
    maxMonths: 12,
    monthlyCost: 300,
    courses: ['intro-to-business'],
  },
  growth: {
    name: 'Growth Mode',
    desc: 'Marketing, social media & smart tools',
    color: '#3B82F6',
    label: 'MEDIUM',
    labelColor: '#FBBF24',
    startCash: 8000,
    startCustomers: 10,
    revenueTarget: 35000,
    maxMonths: 10,
    monthlyCost: 800,
    courses: ['social-media-marketing', 'smb-tech-stack'],
  },
  scale: {
    name: 'Scale Up',
    desc: 'Operations, automation & management',
    color: '#FBBF24',
    label: 'HARD',
    labelColor: '#EF4444',
    startCash: 12000,
    startCustomers: 25,
    revenueTarget: 60000,
    maxMonths: 8,
    monthlyCost: 1500,
    courses: ['business-management'],
  },
}

/* ── helpers ───────────────────────────────────────────── */

function getQuestions(diff: Difficulty): Question[] {
  const c = CFG[diff]
  let pool = COURSES.filter((cr) => c.courses.includes(cr.id)).flatMap((cr) => cr.questions)
  if (pool.length === 0) pool = COURSES.flatMap((cr) => cr.questions)
  return [...pool].sort(() => Math.random() - 0.5)
}

function outcome(correct: boolean, diff: Difficulty) {
  const m = diff === 'startup' ? 1 : diff === 'growth' ? 2 : 3
  return correct
    ? { revenue: 1200 * m, customers: 2 + m, brand: 8, cash: 500 * m }
    : { revenue: 200 * m, customers: 0, brand: -12, cash: -(300 * m) }
}

/* ── component ─────────────────────────────────────────── */

interface Props {
  onQuit: () => void
  onFinish: (score: number, worldNum: number) => void
}

export function TycoonGame({ onQuit, onFinish }: Props) {
  const [phase, setPhase] = useState<Phase>('select')
  const [diff, setDiff] = useState<Difficulty>('startup')
  const [month, setMonth] = useState(1)
  const [revenue, setRevenue] = useState(0)
  const [customers, setCustomers] = useState(3)
  const [brand, setBrand] = useState(100)
  const [cash, setCash] = useState(5000)
  const [questions, setQuestions] = useState<Question[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [deltas, setDeltas] = useState({ revenue: 0, customers: 0, brand: 0, cash: 0 })

  const cfg = CFG[diff]
  const q = questions[qIdx]

  /* actions */

  const start = (d: Difficulty) => {
    const c = CFG[d]
    setDiff(d)
    setMonth(1)
    setRevenue(0)
    setCustomers(c.startCustomers)
    setBrand(100)
    setCash(c.startCash)
    setQuestions(getQuestions(d))
    setQIdx(0)
    setSelected(null)
    setDeltas({ revenue: 0, customers: 0, brand: 0, cash: 0 })
    setPhase('playing')
  }

  const answer = (idx: number) => {
    if (selected !== null || !q) return
    const correct = idx === q.correctIndex
    const out = outcome(correct, diff)
    const netCash = out.cash - cfg.monthlyCost

    setSelected(idx)
    setWasCorrect(correct)
    setDeltas({ ...out, cash: netCash })
    setRevenue((r) => r + out.revenue)
    setCustomers((c) => Math.max(0, c + out.customers))
    setBrand((b) => Math.max(0, Math.min(100, b + out.brand)))
    setCash((c) => c + netCash)

    setTimeout(() => setPhase('outcome'), 1200)
  }

  const nextMonth = () => {
    if (revenue >= cfg.revenueTarget) {
      onFinish(revenue, diff === 'startup' ? 1 : diff === 'growth' ? 2 : 3)
      setPhase('won')
      return
    }
    if (cash <= 0 || brand <= 0) {
      onFinish(revenue, diff === 'startup' ? 1 : diff === 'growth' ? 2 : 3)
      setPhase('lost')
      return
    }
    if (month >= cfg.maxMonths) {
      onFinish(revenue, diff === 'startup' ? 1 : diff === 'growth' ? 2 : 3)
      setPhase(revenue >= cfg.revenueTarget ? 'won' : 'lost')
      return
    }
    let ni = qIdx + 1
    let nq = questions
    if (ni >= nq.length) {
      nq = getQuestions(diff)
      ni = 0
    }
    setQuestions(nq)
    setQIdx(ni)
    setMonth((m) => m + 1)
    setSelected(null)
    setDeltas({ revenue: 0, customers: 0, brand: 0, cash: 0 })
    setPhase('playing')
  }

  const retry = () => start(diff)

  /* shared style */
  const font = { fontFamily: '"Press Start 2P", "Courier New", monospace' } as const
  const bg = 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)'

  /* ── metrics bar (playing + outcome) ── */
  const metricsBar = (
    <div style={{ background: '#0a0a12' }}>
      {/* top info row */}
      <div
        className="flex items-center justify-between px-4 py-2 text-[7px] uppercase tracking-[0.2em]"
        style={{ borderBottom: '1px solid #1a1a2e' }}
      >
        <span style={{ color: '#C084FC' }}>
          Month {month}/{cfg.maxMonths}
        </span>
        <span style={{ color: cfg.color, textShadow: `0 0 8px ${cfg.color}60` }}>{cfg.name}</span>
        <span style={{ color: '#64748b' }}>Target ${cfg.revenueTarget.toLocaleString()}</span>
      </div>

      {/* revenue progress bar */}
      <div className="mx-4 mt-2">
        <div className="h-2 overflow-hidden" style={{ background: '#1a1a2e', border: '1px solid #333355' }}>
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${Math.min(100, (revenue / cfg.revenueTarget) * 100)}%`,
              background: 'linear-gradient(90deg, #A855F7, #22C55E)',
              boxShadow: '0 0 6px #22C55E60',
            }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[6px]" style={{ color: '#4a4a6a' }}>
          <span>${revenue.toLocaleString()}</span>
          <span>{Math.round((revenue / cfg.revenueTarget) * 100)}%</span>
        </div>
      </div>

      {/* metric cards */}
      <div className="grid grid-cols-4 gap-2 p-3">
        {[
          { label: 'Revenue', val: `$${revenue.toLocaleString()}`, color: '#22C55E' },
          { label: 'Customers', val: String(customers), color: '#3B82F6' },
          {
            label: 'Brand',
            val: `${brand}%`,
            color: brand > 50 ? '#22C55E' : brand > 25 ? '#FBBF24' : '#EF4444',
          },
          {
            label: 'Cash',
            val: `$${cash.toLocaleString()}`,
            color: cash > cfg.monthlyCost ? '#FBBF24' : '#EF4444',
          },
        ].map((m) => (
          <div
            key={m.label}
            className="p-2 text-center"
            style={{ background: '#0f0f1a', border: '1px solid #1a1a2e' }}
          >
            <div className="text-[5px] uppercase tracking-wider" style={{ color: '#4a4a6a' }}>
              {m.label}
            </div>
            <div
              className="mt-1 text-[9px] font-bold"
              style={{ color: m.color, textShadow: `0 0 6px ${m.color}40` }}
            >
              {m.val}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  /* ── render ── */

  return (
    <div className="h-full w-full overflow-y-auto" style={{ ...font, background: bg }}>
      {/* ════════ DIFFICULTY SELECT ════════ */}
      {phase === 'select' && (
        <div className="flex min-h-full flex-col items-center px-4 py-8">
          <h1
            className="mb-2 text-xl font-bold tracking-widest"
            style={{ color: '#C084FC', textShadow: '0 0 30px #A855F780, 2px 2px 0 #4C1D95' }}
          >
            BUSINESS TYCOON
          </h1>
          <p className="mb-2 text-[7px]" style={{ color: '#A855F780' }}>
            {'>'} RUN YOUR OWN BUSINESS {'<'}
          </p>
          <p className="mb-8 text-[6px]" style={{ color: '#4a4a6a' }}>
            Every decision teaches a real business concept
          </p>

          <div className="w-full max-w-md space-y-4">
            {DIFFS.map((d) => {
              const c = CFG[d]
              return (
                <button
                  key={d}
                  onClick={() => start(d)}
                  className="group w-full text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(180deg, #12122a 0%, #0a0a1a 100%)',
                    border: `2px solid ${c.color}40`,
                    padding: '16px',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: c.color, textShadow: `0 0 8px ${c.color}60` }}
                    >
                      {c.name}
                    </span>
                    <span
                      className="text-[7px] uppercase"
                      style={{ color: c.labelColor, textShadow: `0 0 6px ${c.labelColor}60` }}
                    >
                      {c.label}
                    </span>
                  </div>
                  <p className="mt-2 text-[7px] leading-relaxed" style={{ color: '#64748b' }}>
                    {c.desc}
                  </p>
                  <div
                    className="mt-3 flex gap-4 text-[6px] uppercase tracking-wider"
                    style={{ color: '#4a4a6a' }}
                  >
                    <span>
                      Cash: <span style={{ color: '#FBBF24' }}>${c.startCash.toLocaleString()}</span>
                    </span>
                    <span>
                      Target:{' '}
                      <span style={{ color: '#22C55E' }}>${c.revenueTarget.toLocaleString()}</span>
                    </span>
                    <span>
                      Months: <span style={{ color: '#C084FC' }}>{c.maxMonths}</span>
                    </span>
                  </div>
                  {/* hover glow */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ border: `2px solid ${c.color}`, boxShadow: `0 0 20px ${c.color}30` }}
                  />
                </button>
              )
            })}
          </div>

          <button
            onClick={onQuit}
            className="mt-8 px-6 py-2 text-[8px] uppercase tracking-[0.2em] transition-all hover:scale-105"
            style={{
              color: '#94a3b8',
              background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
              border: '2px solid #33335580',
            }}
          >
            {'<'} Back
          </button>
        </div>
      )}

      {/* ════════ PLAYING + OUTCOME ════════ */}
      {(phase === 'playing' || phase === 'outcome') && (
        <div className="flex min-h-full flex-col">
          {metricsBar}

          <div className="flex flex-1 items-center justify-center p-4">
            {/* ── scenario card (playing) ── */}
            {phase === 'playing' && q && (
              <div
                className="w-full max-w-lg p-5"
                style={{
                  background: 'linear-gradient(180deg, #12122a 0%, #0a0a1a 100%)',
                  border: '2px solid #A855F740',
                  boxShadow: '0 0 30px #A855F710',
                }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <div
                    className="h-2 w-2 animate-pulse rounded-full bg-green-400"
                    style={{ boxShadow: '0 0 8px #22C55E' }}
                  />
                  <span
                    className="text-[7px] uppercase tracking-[0.3em]"
                    style={{ color: '#22C55E', textShadow: '0 0 8px #22C55E60' }}
                  >
                    Business Advisor
                  </span>
                </div>
                <p className="mb-4 text-[6px]" style={{ color: '#4a4a6a' }}>
                  Make the right call to grow your business
                </p>

                <h3
                  className="mb-5 text-[9px] leading-relaxed text-white"
                  style={{ textShadow: '0 0 4px #ffffff20' }}
                >
                  {q.question}
                </h3>

                <div className="space-y-2">
                  {q.options.map((opt, i) => {
                    let borderColor = '#333355'
                    let bgColor = '#0f0f1a'
                    let textColor = '#c4c4d4'
                    let glow = ''

                    if (selected !== null) {
                      if (i === q.correctIndex) {
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
                        onClick={() => answer(i)}
                        disabled={selected !== null}
                        className="w-full text-left text-[8px] leading-relaxed transition-all duration-150"
                        style={{
                          padding: '10px 14px',
                          border: `2px solid ${borderColor}`,
                          background: bgColor,
                          color: textColor,
                          boxShadow: glow || (selected !== null ? 'none' : 'inset 0 1px 0 #ffffff05'),
                          cursor: selected !== null ? 'default' : 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          if (selected === null) {
                            e.currentTarget.style.borderColor = '#A855F7'
                            e.currentTarget.style.boxShadow = '0 0 12px #A855F720'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selected === null) {
                            e.currentTarget.style.borderColor = '#333355'
                            e.currentTarget.style.boxShadow = 'inset 0 1px 0 #ffffff05'
                          }
                        }}
                      >
                        <span style={{ color: selected !== null ? textColor : '#7C3AED', marginRight: 8 }}>
                          {String.fromCharCode(65 + i)}.
                        </span>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── outcome card ── */}
            {phase === 'outcome' && q && (
              <div
                className="w-full max-w-lg p-5"
                style={{
                  background: 'linear-gradient(180deg, #12122a 0%, #0a0a1a 100%)',
                  border: `2px solid ${wasCorrect ? '#22C55E40' : '#EF444440'}`,
                  boxShadow: `0 0 30px ${wasCorrect ? '#22C55E10' : '#EF444410'}`,
                }}
              >
                <div
                  className="mb-1 text-sm font-bold"
                  style={{
                    color: wasCorrect ? '#22C55E' : '#EF4444',
                    textShadow: `0 0 15px ${wasCorrect ? '#22C55E60' : '#EF444460'}`,
                  }}
                >
                  {wasCorrect ? '$ SMART MOVE!' : '! BAD DECISION'}
                </div>
                <p className="mb-4 text-[7px]" style={{ color: wasCorrect ? '#4ade8080' : '#f8717180' }}>
                  {wasCorrect
                    ? 'Great business instinct — your company grows!'
                    : 'Competitors are gaining ground...'}
                </p>

                {/* delta rows */}
                <div className="space-y-2">
                  {[
                    { label: 'Revenue', val: deltas.revenue, pre: '$' },
                    { label: 'Customers', val: deltas.customers, pre: '' },
                    { label: 'Brand Health', val: deltas.brand, pre: '', suf: '%' },
                    { label: 'Cash', val: deltas.cash, pre: '$' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-[8px]">
                      <span style={{ color: '#64748b' }}>{row.label}</span>
                      <span
                        style={{
                          color: row.val >= 0 ? '#4ade80' : '#f87171',
                          textShadow: `0 0 6px ${row.val >= 0 ? '#22C55E30' : '#EF444430'}`,
                        }}
                      >
                        {row.val >= 0 ? '+' : ''}
                        {row.pre}
                        {row.val.toLocaleString()}
                        {row.suf ?? ''}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-[6px]" style={{ color: '#333355' }}>
                  Operating costs: -${cfg.monthlyCost.toLocaleString()}/month
                </p>

                {/* explanation */}
                <div
                  className="mt-4 p-3 text-[7px] leading-relaxed"
                  style={{
                    border: '1px solid #1a1a2e',
                    background: '#0a0a12',
                    color: '#94a3b8',
                  }}
                >
                  {q.explanation}
                </div>

                <button
                  onClick={nextMonth}
                  className="mt-4 w-full py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    color: '#C084FC',
                    background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
                    border: '2px solid #A855F780',
                    boxShadow: '0 0 15px #A855F720',
                    textShadow: '0 0 8px #A855F780',
                  }}
                >
                  {month >= cfg.maxMonths || revenue >= cfg.revenueTarget
                    ? 'See Results'
                    : `Next Month (${month + 1}/${cfg.maxMonths})`}{' '}
                  {'>'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════ WON ════════ */}
      {phase === 'won' && (
        <div className="flex min-h-full flex-col items-center justify-center px-4">
          <h2
            className="text-2xl font-bold tracking-widest"
            style={{
              color: '#22C55E',
              textShadow: '0 0 40px #22C55E80, 0 0 80px #22C55E40, 2px 2px 0 #14532D',
            }}
          >
            EMPIRE BUILT!
          </h2>
          <p className="mt-3 text-[8px]" style={{ color: '#4ade80' }}>
            You hit ${cfg.revenueTarget.toLocaleString()} revenue in {month} months!
          </p>

          <div className="mt-8 grid grid-cols-4 gap-4">
            {[
              { label: 'Revenue', val: `$${revenue.toLocaleString()}`, color: '#22C55E' },
              { label: 'Customers', val: String(customers), color: '#3B82F6' },
              { label: 'Brand', val: `${brand}%`, color: brand > 50 ? '#22C55E' : '#FBBF24' },
              { label: 'Cash', val: `$${cash.toLocaleString()}`, color: '#FBBF24' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-[6px] uppercase tracking-wider" style={{ color: '#64748b' }}>
                  {s.label}
                </div>
                <div
                  className="mt-1 text-sm font-bold"
                  style={{ color: s.color, textShadow: `0 0 10px ${s.color}60` }}
                >
                  {s.val}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={retry}
              className="px-8 py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95"
              style={{
                color: '#22C55E',
                background: 'linear-gradient(180deg, #0a2e1a 0%, #0a1a0a 100%)',
                border: '2px solid #22C55E80',
                boxShadow: '0 0 15px #22C55E20',
                textShadow: '0 0 10px #22C55E80',
              }}
            >
              Play Again
            </button>
            <button
              onClick={onQuit}
              className="px-8 py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95"
              style={{
                color: '#94a3b8',
                background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
                border: '2px solid #33335580',
              }}
            >
              Menu
            </button>
          </div>
        </div>
      )}

      {/* ════════ LOST ════════ */}
      {phase === 'lost' && (
        <div className="flex min-h-full flex-col items-center justify-center px-4">
          <h2
            className="text-2xl font-bold tracking-widest"
            style={{
              color: '#EF4444',
              textShadow: '0 0 40px #EF444480, 0 0 80px #EF444440, 2px 2px 0 #7F1D1D',
            }}
          >
            OUT OF BUSINESS
          </h2>
          <p className="mt-3 text-[8px]" style={{ color: '#f87171' }}>
            {cash <= 0
              ? 'You ran out of cash.'
              : brand <= 0
                ? 'Your brand reputation collapsed.'
                : `Time ran out — needed $${(cfg.revenueTarget - revenue).toLocaleString()} more.`}
          </p>

          <div className="mt-8 grid grid-cols-4 gap-4">
            {[
              { label: 'Revenue', val: `$${revenue.toLocaleString()}`, color: '#22C55E' },
              { label: 'Customers', val: String(customers), color: '#3B82F6' },
              { label: 'Brand', val: `${brand}%`, color: brand > 0 ? '#FBBF24' : '#EF4444' },
              { label: 'Cash', val: `$${cash.toLocaleString()}`, color: cash > 0 ? '#FBBF24' : '#EF4444' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-[6px] uppercase tracking-wider" style={{ color: '#64748b' }}>
                  {s.label}
                </div>
                <div
                  className="mt-1 text-sm font-bold"
                  style={{ color: s.color, textShadow: `0 0 10px ${s.color}60` }}
                >
                  {s.val}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={retry}
              className="px-8 py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95"
              style={{
                color: '#A855F7',
                background: 'linear-gradient(180deg, #2d1b4e 0%, #1a0a2e 100%)',
                border: '2px solid #A855F780',
                boxShadow: '0 0 15px #A855F720',
                textShadow: '0 0 10px #A855F780',
              }}
            >
              Pivot & Retry
            </button>
            <button
              onClick={onQuit}
              className="px-8 py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95"
              style={{
                color: '#94a3b8',
                background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
                border: '2px solid #33335580',
              }}
            >
              Menu
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
