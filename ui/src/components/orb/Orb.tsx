import { useState, useEffect, useRef } from 'react'
import { useOrbStore } from '@/stores/orbStore'

/* ── Brand colors ── */
const PURPLE = '#A855F7'
const PURPLE_LIGHT = '#C084FC'
const PURPLE_DARK = '#7C3AED'
const LAVENDER = '#DDD6FE'
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
  happy: { eyes: 'happy', mouth: 'grin', color: PURPLE, thought: null },
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
  { text: "hey! i'm kitz", mood: 'happy' as MoodKey, duration: 2000 },
  { text: 'i direct your agents', mood: 'talking' as MoodKey, duration: 2000 },
  { text: 'i lead your agents', mood: 'talking' as MoodKey, duration: 2000 },
  { text: 'tap me!', mood: 'happy' as MoodKey, duration: 2000 },
]

/* ── Idle phrases — loop after welcome ── */
const IDLE_PHRASES = [
  { text: 'coaching agents', mood: 'idle' as MoodKey, duration: 2500 },
  { text: 'organizing your crew', mood: 'talking' as MoodKey, duration: 2500 },
  { text: 'tap to text!', mood: 'talking' as MoodKey, duration: 2000 },
  { text: 'training agents...', mood: 'idle' as MoodKey, duration: 2500 },
  { text: '2x tap to talk', mood: 'talking' as MoodKey, duration: 2500 },
  { text: 'strategizing', mood: 'idle' as MoodKey, duration: 2000 },
  { text: 'leading the team', mood: 'happy' as MoodKey, duration: 2000 },
  { text: 'just build it', mood: 'happy' as MoodKey, duration: 2000 },
  { text: 'reskilling agents', mood: 'idle' as MoodKey, duration: 2500 },
  { text: 'stay focused', mood: 'idle' as MoodKey, duration: 2000 },
]

const PX = 8

/* ── Sub-components ── */

function PixelGrid({
  grid,
  color,
  opacity = 1,
  offsetY = 0,
  pixelSize,
}: {
  grid: number[][]
  color: string
  opacity?: number
  offsetY?: number
  pixelSize?: number
}) {
  const s = pixelSize ?? PX
  return (
    <div style={{ position: 'relative', top: offsetY }}>
      {grid.map((row, y) => (
        <div key={y} style={{ display: 'flex' }}>
          {row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              style={{
                width: s,
                height: s,
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

function Eyes({ mood, blinkFrame, pixelSize }: { mood: string; blinkFrame: boolean; pixelSize?: number }) {
  const s = pixelSize ?? PX
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
    // Default "open" eyes: half-pill shape
    return { ...base, width: s, height: s * 0.7, background: DARK, borderRadius: `${s * 0.5}px ${s * 0.5}px 0 0`, marginTop: s * 0.15 }
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

function Mouth({ mood, isTalking, pixelSize }: { mood: string; isTalking: boolean; pixelSize?: number }) {
  const s = pixelSize ?? PX
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
  // Default smile
  return (
    <div
      style={{
        ...base,
        width: s * 1.8,
        height: s * 0.6,
        background: DARK,
        borderRadius: `0 0 ${s}px ${s}px`,
      }}
    />
  )
}

/* ── Thought bubble ── */
function ThoughtBubble({ text, color }: { text: string; color: string }) {
  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 10,
        padding: '4px 10px',
        background: '#f8f5ff',
        border: `2px solid ${color}40`,
        borderRadius: 4,
        color: '#4b2d8e',
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: 1.2,
        animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
        textShadow: `0 0 10px ${color}30`,
        whiteSpace: 'nowrap',
        textAlign: 'center' as const,
      }}
    >
      {text}
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

/* ── Sleep Z's ── */
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
            animation: `sleep-float 3s ease-in-out ${i * 0.6}s infinite`,
            opacity: 0,
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  )
}

/* ── Trailing sparkles beneath Kitz ── */
function TrailingSparkles({ color }: { color: string }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={`trail-${i}`}
          style={{
            position: 'absolute',
            bottom: -8 - i * 10,
            left: '50%',
            marginLeft: (i - 1) * 12,
            width: 3 + i,
            height: 3 + i,
            background: color,
            borderRadius: '50%',
            opacity: 0.4 - i * 0.1,
            animation: `kitz-trail-float ${1 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
            filter: `blur(${i * 0.5}px)`,
          }}
        />
      ))}
    </>
  )
}

/* ── Main Orb Component ── */

interface OrbProps {
  sleeping?: boolean
  /** Render a frozen idle state — no animations, no interactions */
  static?: boolean
  level?: number
  /** Disable internal click handling — parent manages clicks */
  disableClick?: boolean
}

type WakePhase = 'sleeping' | 'stirring' | 'waking' | 'awake'

const MOODY_PHRASES = ['five more min...', 'not yet...', 'shhh...', 'zzz... later', 'still charging']

/* ── Level-based aura layers ── */
const AURA_LAYERS = [
  null,
  { color: '#60A5FA', size: 13, blur: 12, opacity: 0.25, speed: 3 },
  { color: '#FBBF24', size: 15, blur: 16, opacity: 0.3, speed: 2.5 },
  { color: '#F9FAFB', size: 17, blur: 20, opacity: 0.2, speed: 2 },
  { color: '#7C3AED', size: 19, blur: 24, opacity: 0.35, speed: 1.5 },
]

function OrbAuras({ level }: { level: number }) {
  const layers = AURA_LAYERS.slice(1, level)
  if (layers.length === 0) return null

  return (
    <>
      {layers.map((layer, i) => layer && (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: PX * layer.size,
            height: PX * layer.size,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${layer.color}${Math.round(layer.opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
            animation: `orb-breathe ${layer.speed}s ease-in-out infinite`,
            pointerEvents: 'none',
            filter: `blur(${layer.blur}px)`,
          }}
        />
      ))}
      {level >= 5 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: PX * 20,
            height: PX * 20,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '2px solid #FBBF2430',
            animation: 'orb-breathe 1.2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  )
}

export function Orb({ sleeping = false, static: isStatic = false, level = 1, disableClick = false }: OrbProps) {
  const { open, focusChat, state, speaking } = useOrbStore()
  const [feetFrame, setFeetFrame] = useState(0)
  const [bounceY, setBounceY] = useState(0)
  const [blinking, setBlinking] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)
  const [wakePhase, setWakePhase] = useState<WakePhase>(sleeping ? 'sleeping' : 'awake')
  const wakeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const [moodyText, setMoodyText] = useState<string | null>(null)
  const moodyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const moodyIndexRef = useRef(0)

  /* ── Static mode: frozen idle Orb ── */
  if (isStatic) {
    const staticMood = MOODS.idle
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            filter: `drop-shadow(0 0 8px ${PURPLE}50) drop-shadow(0 0 20px ${PURPLE}25)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: PX * 10,
              height: PX * 10,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${PURPLE}30 0%, ${PURPLE}15 40%, ${PURPLE}06 65%, transparent 80%)`,
              pointerEvents: 'none',
            }}
          />
          {/* Antenna with flag */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -1, position: 'relative' }}>
            <div
              style={{
                width: Math.max(2, PX * 0.3),
                height: PX * 1.8,
                background: PURPLE,
                boxShadow: `0 0 8px ${PURPLE}60`,
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              marginLeft: 1,
              width: PX * 0.7,
              height: PX * 0.6,
              background: PURPLE_LIGHT,
              boxShadow: `0 0 6px ${PURPLE_LIGHT}60`,
            }} />
          </div>
          <div style={{ position: 'relative' }}>
            <PixelGrid grid={ORB_SHAPE} color={PURPLE} />
            <div style={{ position: 'absolute', top: PX, left: PX * 2, width: PX * 0.7, height: PX * 0.7, background: LAVENDER, opacity: 0.6 }} />
            <div style={{ position: 'absolute', top: PX * 1.5, left: PX * 1.5, width: PX * 0.4, height: PX * 0.4, background: '#fff', opacity: 0.3 }} />
            <Eyes mood={staticMood.eyes} blinkFrame={false} />
            <Mouth mood={staticMood.mouth} isTalking={false} />
          </div>
          <PixelGrid grid={FEET_FRAMES[0]!} color={PURPLE_DARK} opacity={0.8} offsetY={-1} />
        </div>
      </div>
    )
  }

  // Wake-up sequence
  useEffect(() => {
    wakeTimersRef.current.forEach(clearTimeout)
    wakeTimersRef.current = []

    if (sleeping) {
      setWakePhase('sleeping')
      if (moodyTimerRef.current) clearTimeout(moodyTimerRef.current)
      setMoodyText(null)
      return
    }

    if (wakePhase === 'sleeping') {
      setWakePhase('stirring')
      const t1 = setTimeout(() => setWakePhase('waking'), 1000)
      const t2 = setTimeout(() => setWakePhase('awake'), 4000)
      wakeTimersRef.current = [t1, t2]
    }
    return () => {
      wakeTimersRef.current.forEach(clearTimeout)
      wakeTimersRef.current = []
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleeping])

  const isFullyAwake = wakePhase === 'awake'
  const isAsleep = wakePhase === 'sleeping'
  const isStirring = wakePhase === 'stirring'
  const isWaking = wakePhase === 'waking'

  // Fade in
  useEffect(() => {
    const t = requestAnimationFrame(() => setFadeIn(true))
    return () => cancelAnimationFrame(t)
  }, [])

  // Welcome flow
  const [welcomeStep, setWelcomeStep] = useState(0)
  const [welcomeDone, setWelcomeDone] = useState(false)
  const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Idle phrase loop
  const [idlePhrase, setIdlePhrase] = useState(0)

  const currentWelcome = isFullyAwake && !welcomeDone && welcomeStep < WELCOME_LINES.length
    ? WELCOME_LINES[welcomeStep]
    : null

  const moodKey: MoodKey = isAsleep
    ? 'sleeping'
    : isStirring
    ? 'sleeping'
    : isWaking
    ? 'idle'
    : speaking
    ? 'talking'
    : currentWelcome
    ? currentWelcome.mood
    : state === 'success' ? 'happy' : state === 'error' ? 'alert' : state === 'thinking' ? 'thinking' : 'idle'

  const currentMood = MOODS[moodKey]
  const isTalking = isFullyAwake && (moodKey === 'talking' || !!currentWelcome)

  const displayColor = isAsleep
    ? '#94a3b8'
    : isStirring
    ? '#b0a0c0'
    : isWaking
    ? PURPLE_LIGHT
    : currentMood.color

  const currentIdlePhrase = isFullyAwake && welcomeDone && state === 'idle'
    ? IDLE_PHRASES[idlePhrase % IDLE_PHRASES.length]
    : null

  const thoughtText = isAsleep
    ? null
    : isStirring
    ? null
    : isWaking
    ? "yay, i'm up!"
    : currentWelcome
    ? currentWelcome.text
    : state === 'thinking' ? '...'
    : state === 'success' ? null
    : state === 'error' ? '!!'
    : currentIdlePhrase ? currentIdlePhrase.text
    : null

  // Welcome sequence
  useEffect(() => {
    if (!isFullyAwake || welcomeDone || welcomeStep >= WELCOME_LINES.length) return
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
  }, [welcomeStep, welcomeDone, isFullyAwake])

  // Idle phrase loop
  useEffect(() => {
    if (!isFullyAwake || !welcomeDone || state !== 'idle') return
    const phrase = IDLE_PHRASES[idlePhrase % IDLE_PHRASES.length]
    if (!phrase) return
    const t = setTimeout(() => {
      setIdlePhrase((p) => (p + 1) % IDLE_PHRASES.length)
    }, phrase.duration)
    return () => clearTimeout(t)
  }, [welcomeDone, state, idlePhrase, isFullyAwake])

  // Foot animation
  useEffect(() => {
    if (!isFullyAwake) { setFeetFrame(0); return }
    const interval = setInterval(() => setFeetFrame((f) => (f + 1) % 3), 400)
    return () => clearInterval(interval)
  }, [isFullyAwake])

  // Gentle bounce
  useEffect(() => {
    if (isAsleep || isStirring) { setBounceY(0); return }
    let t = 0
    let raf: number
    const speed = isWaking ? 0.015 : 0.03
    const amplitude = isWaking ? -1.5 : -2.5
    const tick = () => {
      t += speed
      setBounceY(Math.sin(t) * amplitude)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isAsleep, isStirring, isWaking])

  // Rapid blinking during stirring
  useEffect(() => {
    if (!isStirring) return
    const interval = setInterval(() => {
      setBlinking((b) => !b)
    }, 300)
    return () => clearInterval(interval)
  }, [isStirring])

  // Random blinking
  useEffect(() => {
    const blink = () => {
      setBlinking(true)
      setTimeout(() => setBlinking(false), 150)
    }
    const interval = setInterval(blink, 2000 + Math.random() * 3000)
    return () => clearInterval(interval)
  }, [])

  // Single tap → text | Double tap → voice
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = () => {
    if (disableClick) return
    if (isAsleep) {
      if (moodyTimerRef.current) clearTimeout(moodyTimerRef.current)
      const phrase = MOODY_PHRASES[moodyIndexRef.current % MOODY_PHRASES.length]!
      moodyIndexRef.current += 1
      setMoodyText(phrase)
      moodyTimerRef.current = setTimeout(() => setMoodyText(null), 2000)
      return
    }

    if (!welcomeDone) {
      if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current)
      setWelcomeDone(true)
    }

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      open()
      return
    }

    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      focusChat()
    }, 280)
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
      {isAsleep && moodyText ? (
        <ThoughtBubble text={moodyText} color="#EF4444" />
      ) : isAsleep ? (
        <SleepZs />
      ) : thoughtText ? (
        <ThoughtBubble text={thoughtText} color={displayColor} />
      ) : null}

      {/* Character */}
      <div
        style={{
          position: 'relative',
          transform: `translateY(${isAsleep ? 0 : bounceY}px)`,
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), filter 1.2s ease',
          filter: isAsleep
            ? 'drop-shadow(0 0 4px rgba(148,163,184,0.25)) grayscale(0.4)'
            : isStirring
            ? 'drop-shadow(0 0 5px rgba(168,85,247,0.1)) grayscale(0.2)'
            : isWaking
            ? `drop-shadow(0 0 6px ${PURPLE}25) grayscale(0)`
            : `drop-shadow(0 0 14px ${PURPLE}50)`,
        }}
      >
        {/* Glow halo */}
        {(isWaking || isFullyAwake) && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: PX * 14,
              height: PX * 14,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${PURPLE}20, transparent 70%)`,
              animation: 'kitz-halo-pulse 2s ease-in-out infinite',
              opacity: isWaking ? 0.4 : 1,
              transition: 'opacity 1s ease',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Level-based stacking auras */}
        <OrbAuras level={level} />

        {/* Antenna with flag */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -1, position: 'relative' }}>
          <div
            style={{
              width: Math.max(2, PX * 0.3),
              height: PX * 1.8,
              background: displayColor,
              boxShadow: `0 0 8px ${displayColor}60`,
              transition: 'background 1s ease, box-shadow 1s ease',
            }}
          />
          {/* Flag on antenna */}
          {isFullyAwake && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              marginLeft: 1,
              width: PX * 0.7,
              height: PX * 0.6,
              background: PURPLE_LIGHT,
              boxShadow: `0 0 6px ${PURPLE_LIGHT}60`,
            }} />
          )}
        </div>

        {/* Body */}
        <div style={{ position: 'relative' }}>
          <PixelGrid grid={ORB_SHAPE} color={displayColor} />
          {/* Highlight pixels (top-left shine) */}
          <div style={{ position: 'absolute', top: PX, left: PX * 2, width: PX * 0.7, height: PX * 0.7, background: LAVENDER, opacity: 0.6 }} />
          <div style={{ position: 'absolute', top: PX * 1.5, left: PX * 1.5, width: PX * 0.4, height: PX * 0.4, background: '#fff', opacity: 0.3 }} />
          <Eyes mood={blinking ? 'closed' : currentMood.eyes} blinkFrame={blinking} />
          <Mouth mood={currentMood.mouth} isTalking={isTalking} />
        </div>

        {/* Feet */}
        <PixelGrid grid={(FEET_FRAMES[feetFrame] ?? FEET_FRAMES[0])!} color={PURPLE_DARK} opacity={0.8} offsetY={-1} />

        {/* Trailing sparkles when awake and idle */}
        {isFullyAwake && state === 'idle' && (
          <TrailingSparkles color={PURPLE_LIGHT} />
        )}
      </div>
    </div>
  )
}
