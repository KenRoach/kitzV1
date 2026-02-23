import { useState, useEffect, useRef } from 'react'
import { useOrbStore } from '@/stores/orbStore'

/* ── Brand colors ── */
const PURPLE = '#a855f7'
const DARK = '#0A0A0A'

/* ── Mood definitions ── */
interface MoodDef {
  eyes: string
  mouth: string
  color: string
  thought: string | null
}

type MoodKey = 'idle' | 'thinking' | 'happy' | 'alert' | 'talking' | 'sleeping'

const MOODS: Record<MoodKey, MoodDef> = {
  idle: { eyes: 'open', mouth: 'smile', color: PURPLE, thought: null },
  thinking: { eyes: 'squint', mouth: 'flat', color: '#F59E0B', thought: '...' },
  happy: { eyes: 'happy', mouth: 'grin', color: PURPLE, thought: '♪' },
  alert: { eyes: 'wide', mouth: 'oh', color: '#EF4444', thought: '!!' },
  talking: { eyes: 'happy', mouth: 'talk', color: PURPLE, thought: null },
  sleeping: { eyes: 'closed', mouth: 'flat', color: '#94a3b8', thought: null },
}

/* ── Pixel maps ── */
const ORB_SHAPE = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
]

const FEET_FRAMES = [
  [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 1, 0, 0]],
  [[0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 1, 0, 0]],
  [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 1, 0]],
]

/* ── Welcome sequence — Kitz greets user on first load ── */
const WELCOME_LINES = [
  { text: "hey! i'm kitz 👋", mood: 'happy' as MoodKey, duration: 2000 },
  { text: 'your AI business assistant', mood: 'talking' as MoodKey, duration: 2000 },
  { text: '100+ agents ready to help you', mood: 'talking' as MoodKey, duration: 2000 },
  { text: 'tap me anytime to chat!', mood: 'happy' as MoodKey, duration: 2000 },
]

/* ── Idle phrases — loop after welcome ── */
const IDLE_PHRASES = [
  { text: 'need help with anything?', mood: 'idle' as MoodKey, duration: 2000 },
  { text: "let's grow your business 🚀", mood: 'happy' as MoodKey, duration: 2000 },
  { text: 'tap me to chat!', mood: 'talking' as MoodKey, duration: 2000 },
  { text: 'your AI team is ready', mood: 'idle' as MoodKey, duration: 2000 },
  { text: 'just build it 💪', mood: 'happy' as MoodKey, duration: 2000 },
]

const PX = 8

/* ── Sub-components ── */

function PixelGrid({
  grid,
  color,
  opacity = 1,
  offsetY = 0,
}: {
  grid: number[][]
  color: string
  opacity?: number
  offsetY?: number
}) {
  return (
    <div style={{ position: 'relative', top: offsetY }}>
      {grid.map((row, y) => (
        <div key={y} style={{ display: 'flex' }}>
          {row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              style={{
                width: PX,
                height: PX,
                background: cell ? color : 'transparent',
                opacity: cell ? opacity : 0,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function Eyes({ mood, blinkFrame }: { mood: string; blinkFrame: boolean }) {
  const s = PX
  const eyeStyle = (isLeft: boolean): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      top: s * 2.5,
      left: isLeft ? s * 2 : s * 5,
      transition: 'all 0.15s ease',
    }
    if (blinkFrame || mood === 'closed') {
      return { ...base, width: s, height: s * 0.3, background: DARK, borderRadius: 0, marginTop: s * 0.35 }
    }
    if (mood === 'happy') {
      return {
        ...base,
        width: s,
        height: s * 0.5,
        background: 'transparent',
        borderTop: `${Math.max(2, s * 0.3)}px solid ${DARK}`,
        borderRadius: '50% 50% 0 0',
      }
    }
    if (mood === 'squint') {
      return { ...base, width: s, height: s * 0.4, background: DARK, borderRadius: s * 0.1, marginTop: s * 0.2 }
    }
    if (mood === 'wide') {
      return {
        ...base,
        width: s * 1.2,
        height: s * 1.2,
        background: '#fff',
        borderRadius: '50%',
        border: `${Math.max(2, s * 0.25)}px solid ${DARK}`,
        marginLeft: -s * 0.1,
        marginTop: -s * 0.1,
      }
    }
    return { ...base, width: s * 0.8, height: s, background: DARK, borderRadius: s * 0.2, marginLeft: s * 0.1 }
  }

  if (mood === 'wide') {
    return (
      <>
        <div style={eyeStyle(true)}>
          <div style={{ width: s * 0.5, height: s * 0.5, background: DARK, borderRadius: '50%', position: 'absolute', bottom: s * 0.15, left: '50%', transform: 'translateX(-50%)' }} />
        </div>
        <div style={eyeStyle(false)}>
          <div style={{ width: s * 0.5, height: s * 0.5, background: DARK, borderRadius: '50%', position: 'absolute', bottom: s * 0.15, left: '50%', transform: 'translateX(-50%)' }} />
        </div>
      </>
    )
  }

  return (
    <>
      <div style={eyeStyle(true)} />
      <div style={eyeStyle(false)} />
    </>
  )
}

function Mouth({ mood, isTalking }: { mood: string; isTalking: boolean }) {
  const s = PX
  const base: React.CSSProperties = {
    position: 'absolute',
    top: s * 4.2,
    left: '50%',
    transform: 'translateX(-50%)',
    transition: 'all 0.15s ease',
  }
  if (mood === 'talk' || isTalking) {
    return (
      <div
        style={{
          ...base,
          width: s * 1.2,
          height: s * 0.8,
          background: DARK,
          borderRadius: '0 0 50% 50%',
          animation: 'talk-mouth 0.35s ease-in-out infinite',
        }}
      />
    )
  }
  if (mood === 'grin') {
    return (
      <div
        style={{
          ...base,
          width: s * 2.5,
          height: s,
          borderBottom: `${Math.max(2, s * 0.3)}px solid ${DARK}`,
          borderRadius: `0 0 ${s}px ${s}px`,
          borderLeft: `${Math.max(2, s * 0.3)}px solid ${DARK}`,
          borderRight: `${Math.max(2, s * 0.3)}px solid ${DARK}`,
        }}
      />
    )
  }
  if (mood === 'oh') {
    return (
      <div style={{ ...base, width: s * 0.8, height: s * 0.8, background: DARK, borderRadius: '50%' }} />
    )
  }
  if (mood === 'flat') {
    return (
      <div style={{ ...base, width: s * 1.5, height: Math.max(2, s * 0.25), background: DARK, borderRadius: 1 }} />
    )
  }
  return (
    <div
      style={{
        ...base,
        width: s * 2,
        height: s * 0.8,
        borderBottom: `${Math.max(2, s * 0.3)}px solid ${DARK}`,
        borderRadius: `0 0 ${s}px ${s}px`,
      }}
    />
  )
}

/* ── Thought bubble — appears with a gentle fade ── */
function ThoughtBubble({ text, color }: { text: string; color: string }) {
  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 12,
        padding: '6px 12px',
        background: '#f8f5ff',
        border: `2px solid ${color}40`,
        borderRadius: 4,
        color: '#4b2d8e',
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: 1.5,
        animation: 'fadeInUp 0.6s ease',
        textShadow: `0 0 10px ${color}30`,
        whiteSpace: 'nowrap',
        maxWidth: 140,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {text}
      {/* Arrow pointing down */}
      <div
        style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          marginLeft: -4,
          width: 8,
          height: 8,
          background: '#f8f5ff',
          border: `2px solid ${color}40`,
          borderTop: 'none',
          borderLeft: 'none',
          transform: 'rotate(45deg)',
        }}
      />
    </div>
  )
}

/* ── Sleep Z's — floating letters above Kitz ── */
function SleepZs() {
  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 8,
        height: 28,
        width: PX * 8,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}
    >
      {['Z', 'z', 'Z'].map((letter, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${30 + i * 18}%`,
            bottom: 0,
            fontSize: i === 1 ? 9 : 12,
            fontWeight: 800,
            color: '#94a3b8',
            animation: `sleep-float 2.4s ease-in-out ${i * 0.5}s infinite`,
            opacity: 0,
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  )
}

/* ── Main Orb Component ── */

interface OrbProps {
  sleeping?: boolean
}

export function Orb({ sleeping = false }: OrbProps) {
  const { open, state } = useOrbStore()
  const [feetFrame, setFeetFrame] = useState(0)
  const [bounceY, setBounceY] = useState(0)
  const [blinking, setBlinking] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)

  // Fade in with website on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setFadeIn(true))
    return () => cancelAnimationFrame(t)
  }, [])

  // Welcome flow state
  const [welcomeStep, setWelcomeStep] = useState(0)
  const [welcomeDone, setWelcomeDone] = useState(false)
  const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Idle phrase loop — cycles after welcome
  const [idlePhrase, setIdlePhrase] = useState(0)

  // Determine mood: sleeping overrides everything, then welcome flow, then orbStore state
  const currentWelcome = !sleeping && !welcomeDone && welcomeStep < WELCOME_LINES.length
    ? WELCOME_LINES[welcomeStep]
    : null

  const moodKey: MoodKey = sleeping
    ? 'sleeping'
    : currentWelcome
    ? currentWelcome.mood
    : state === 'success' ? 'happy' : state === 'error' ? 'alert' : state === 'thinking' ? 'thinking' : 'idle'

  const currentMood = MOODS[moodKey]
  const isTalking = !sleeping && (moodKey === 'talking' || !!currentWelcome)

  // Current idle phrase
  const currentIdlePhrase = !sleeping && welcomeDone && state === 'idle'
    ? IDLE_PHRASES[idlePhrase % IDLE_PHRASES.length]
    : null

  // Thought bubble text: sleeping shows Z's, welcome → active state → idle phrases
  const thoughtText = sleeping
    ? null
    : currentWelcome
    ? currentWelcome.text
    : state === 'thinking' ? '...'
    : state === 'success' ? '♪'
    : state === 'error' ? '!!'
    : currentIdlePhrase ? currentIdlePhrase.text
    : null

  // Welcome sequence — auto-advance through lines
  useEffect(() => {
    if (welcomeDone || welcomeStep >= WELCOME_LINES.length) return
    const line = WELCOME_LINES[welcomeStep]
    if (!line) return
    welcomeTimerRef.current = setTimeout(() => {
      const next = welcomeStep + 1
      if (next >= WELCOME_LINES.length) {
        setWelcomeDone(true)
      } else {
        setWelcomeStep(next)
      }
    }, line.duration)
    return () => {
      if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current)
    }
  }, [welcomeStep, welcomeDone])

  // Idle phrase loop — advance every phrase duration
  useEffect(() => {
    if (!welcomeDone || state !== 'idle') return
    const phrase = IDLE_PHRASES[idlePhrase % IDLE_PHRASES.length]
    if (!phrase) return
    const t = setTimeout(() => {
      setIdlePhrase((p) => (p + 1) % IDLE_PHRASES.length)
    }, phrase.duration)
    return () => clearTimeout(t)
  }, [welcomeDone, state, idlePhrase])

  // Idle foot animation — paused when sleeping
  useEffect(() => {
    if (sleeping) { setFeetFrame(0); return }
    const interval = setInterval(() => setFeetFrame((f) => (f + 1) % 3), 400)
    return () => clearInterval(interval)
  }, [sleeping])

  // Gentle bounce — soft breathing motion
  useEffect(() => {
    if (sleeping) { setBounceY(0); return }
    const interval = setInterval(() => {
      setBounceY((p) => (p === 0 ? -2 : p === -2 ? -3 : p === -3 ? -2 : 0))
    }, 400)
    return () => clearInterval(interval)
  }, [sleeping])

  // Random blinking
  useEffect(() => {
    const blink = () => {
      setBlinking(true)
      setTimeout(() => setBlinking(false), 150)
    }
    const interval = setInterval(blink, 2000 + Math.random() * 3000)
    return () => clearInterval(interval)
  }, [])

  const handleClick = () => {
    if (!welcomeDone) {
      if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current)
      setWelcomeDone(true)
    }
    open()
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        opacity: fadeIn ? 1 : 0,
        transform: fadeIn ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Talk to Kitz"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
    >
      {/* Thought bubble or sleep Z's */}
      {sleeping ? (
        <SleepZs />
      ) : thoughtText ? (
        <ThoughtBubble text={thoughtText} color={currentMood.color} />
      ) : null}

      {/* Character */}
      <div
        style={{
          position: 'relative',
          transform: `translateY(${sleeping ? 0 : bounceY}px)`,
          transition: 'transform 0.4s ease, filter 0.6s ease',
          filter: sleeping
            ? 'drop-shadow(0 0 4px rgba(148,163,184,0.25)) grayscale(0.4)'
            : `drop-shadow(0 0 8px ${PURPLE}50) drop-shadow(0 0 20px ${PURPLE}25)`,
        }}
      >
        {/* Aura — soft purple glow behind character */}
        {!sleeping && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: PX * 14,
              height: PX * 14,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${PURPLE}30 0%, ${PURPLE}15 40%, ${PURPLE}06 65%, transparent 80%)`,
              animation: 'orb-breathe 3s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Antenna */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -1 }}>
          <div
            style={{
              width: Math.max(2, PX * 0.3),
              height: PX * 1.5,
              background: currentMood.color,
              boxShadow: `0 -${PX * 0.5}px 0 ${currentMood.color}, 0 -${PX}px 6px ${currentMood.color}60`,
            }}
          />
        </div>

        {/* Body */}
        <div style={{ position: 'relative' }}>
          <PixelGrid grid={ORB_SHAPE} color={currentMood.color} />
          {/* Highlight pixels */}
          <div style={{ position: 'absolute', top: PX, left: PX * 2, width: PX * 0.6, height: PX * 0.6, background: '#fff', opacity: 0.7 }} />
          <div style={{ position: 'absolute', top: PX * 1.5, left: PX * 1.5, width: PX * 0.4, height: PX * 0.4, background: '#fff', opacity: 0.4 }} />
          <Eyes mood={blinking ? 'closed' : currentMood.eyes} blinkFrame={blinking} />
          <Mouth mood={currentMood.mouth} isTalking={isTalking} />
        </div>

        {/* Feet */}
        <PixelGrid grid={(FEET_FRAMES[feetFrame] ?? FEET_FRAMES[0])!} color={currentMood.color} opacity={0.7} offsetY={-1} />
      </div>

    </div>
  )
}
