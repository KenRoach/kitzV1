import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useOrbStore } from '@/stores/orbStore'

/**
 * FloatingOrb — PUFF teleport: Kitz disappears from hero → merges into chatbox.
 *
 * Departure: smoke particles, sparkles, "PUFF" text, central flash at hero
 * Ghost fly: A small glowing purple Kitz orb flies from hero to chatbox input
 * Merge: Ghost shrinks + blurs into the chatbox input → input glows purple
 */

/* ── Brand colors ── */
const PURPLE = '#A855F7'
const PURPLE_LIGHT = '#C084FC'
const PURPLE_DARK = '#7C3AED'
const LAVENDER = '#DDD6FE'

type Phase = 'hidden' | 'departing' | 'flying' | 'merging' | 'done'

/** Get the center of the chatbox INPUT field */
function getChatboxInputCenter(): { x: number; y: number; width: number } {
  const form = document.querySelector('[data-orb-chatbox]')
  const input = form?.querySelector('input')
  if (input) {
    const rect = input.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, width: rect.width }
  }
  if (form) {
    const rect = form.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, width: rect.width }
  }
  return { x: window.innerWidth - 200, y: window.innerHeight - 100, width: 300 }
}

function getHeroCenter(): { x: number; y: number } {
  const el = document.querySelector('[data-orb-home]')
  if (el) {
    const rect = el.getBoundingClientRect()
    return { x: rect.left + rect.width * 0.76, y: rect.top + rect.height * 0.48 }
  }
  return { x: window.innerWidth * 0.35, y: 200 }
}

/* ── Smoke Puff Particle ── */
function SmokePuffParticle({ x, y, delay, size, color, duration }: {
  x: number; y: number; delay: number; size: number; color: string; duration: number
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        animation: `kitz-smokePuff ${duration}ms ease-out ${delay}ms both`,
        pointerEvents: 'none',
      }}
    />
  )
}

/* ── Sparkle Particle ── */
function SparkleParticle({ x, y, delay, size, color }: {
  x: number; y: number; delay: number; size: number; color: string
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        animation: `kitz-sparkleFloat 800ms ease-out ${delay}ms both`,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: color,
        clipPath: 'polygon(50% 0%, 60% 35%, 100% 50%, 60% 65%, 50% 100%, 40% 65%, 0% 50%, 40% 35%)',
        filter: `drop-shadow(0 0 ${size * 0.5}px ${color})`,
      }} />
    </div>
  )
}

/* ── Generate smoke puffs ── */
function generateSmokePuffs(cx: number, cy: number, count = 12) {
  const COLORS = [PURPLE, PURPLE_LIGHT, PURPLE_DARK, LAVENDER, `${PURPLE}80`]
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
    const dist = 20 + Math.random() * 50
    return {
      id: i,
      x: cx + Math.cos(angle) * dist - 15,
      y: cy + Math.sin(angle) * dist - 15,
      delay: Math.random() * 150,
      size: 20 + Math.random() * 35,
      color: COLORS[i % COLORS.length]!,
      duration: 500 + Math.random() * 300,
    }
  })
}

/* ── Generate sparkles ── */
function generateSparkles(cx: number, cy: number, count = 16) {
  const COLORS = [PURPLE_LIGHT, LAVENDER, '#fff', PURPLE, '#E9D5FF']
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.8
    const dist = 30 + Math.random() * 70
    return {
      id: i,
      x: cx + Math.cos(angle) * dist - 4,
      y: cy + Math.sin(angle) * dist - 4,
      delay: Math.random() * 250,
      size: 4 + Math.random() * 10,
      color: COLORS[i % COLORS.length]!,
    }
  })
}

/* ── Generate merge sparkles along the chatbox width ── */
function generateMergeSparkles(width: number, count = 10) {
  const COLORS = [PURPLE_LIGHT, LAVENDER, '#fff', PURPLE]
  return Array.from({ length: count }, (_, i) => {
    const xPos = (i / count) * width - width / 2
    return {
      id: i,
      x: xPos + (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 30,
      delay: Math.random() * 200,
      size: 3 + Math.random() * 6,
      color: COLORS[i % COLORS.length]!,
    }
  })
}

/* ── PUFF Text Burst ── */
function PuffText() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 60,
        display: 'flex',
        gap: 2,
        animation: 'kitz-puffWordBurst 700ms ease-out both',
        pointerEvents: 'none',
      }}
    >
      {'PUFF'.split('').map((letter, i) => (
        <span
          key={i}
          style={{
            fontSize: 36,
            fontWeight: 'bold',
            color: '#FFFFFF',
            textShadow: `0 0 20px ${PURPLE}90, 0 0 40px ${PURPLE}60, 0 0 60px ${PURPLE}40, 2px 2px 0 #0A0A0A, -2px -2px 0 #0A0A0A, 2px -2px 0 #0A0A0A, -2px 2px 0 #0A0A0A`,
            animation: `kitz-puffLetterPop 600ms ease-out ${80 * i}ms both`,
            display: 'inline-block',
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  )
}

/* ── Departure puff — smoke + sparkles + PUFF text at hero ── */
function DeparturePuff({ x, y }: { x: number; y: number }) {
  const center = 40
  const [smokes] = useState(() => generateSmokePuffs(center, center, 12))
  const [sparkles] = useState(() => generateSparkles(center, center, 16))

  return (
    <div style={{ position: 'fixed', left: x - center, top: y - center, zIndex: 9999, pointerEvents: 'none' }}>
      {smokes.map((p) => (
        <SmokePuffParticle key={p.id} x={p.x} y={p.y} delay={p.delay} size={p.size} color={p.color} duration={p.duration} />
      ))}
      {sparkles.map((s) => (
        <SparkleParticle key={`s-${s.id}`} x={s.x} y={s.y} delay={s.delay} size={s.size} color={s.color} />
      ))}
      <div style={{
        position: 'absolute', left: center - 30, top: center - 30, width: 60, height: 60,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${LAVENDER}cc, ${PURPLE}40, transparent)`,
        animation: 'kitz-centralFlash 400ms ease-out both',
      }} />
      <PuffText />
    </div>
  )
}

/* ── Merge sparkles at the chatbox ── */
function MergeEffect({ x, y, width }: { x: number; y: number; width: number }) {
  const [sparkles] = useState(() => generateMergeSparkles(width, 12))

  return (
    <div style={{ position: 'fixed', left: x, top: y, zIndex: 9999, pointerEvents: 'none' }}>
      {sparkles.map((s) => (
        <SparkleParticle key={`m-${s.id}`} x={s.x} y={s.y} delay={s.delay} size={s.size} color={s.color} />
      ))}
      <div style={{
        position: 'absolute', left: -width / 2, top: -20, width, height: 40,
        borderRadius: 12,
        background: `radial-gradient(ellipse, ${LAVENDER}80, ${PURPLE}30, transparent)`,
        animation: 'kitz-arrivalFlash 500ms ease-out both',
      }} />
    </div>
  )
}

/* ── Mini Kitz face for the ghost — simple, lightweight, no store deps ── */
function MiniKitz({ size }: { size: number }) {
  const px = size / 8
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle at 35% 35%, ${PURPLE_LIGHT}, ${PURPLE} 60%, ${PURPLE_DARK})`,
      position: 'relative',
      boxShadow: `0 0 ${size * 0.3}px ${PURPLE}80, 0 0 ${size * 0.6}px ${PURPLE}40`,
    }}>
      {/* Eyes */}
      <div style={{
        position: 'absolute',
        top: size * 0.32,
        left: size * 0.25,
        width: px * 1.2,
        height: px * 0.9,
        background: '#0A0A0A',
        borderRadius: `${px}px ${px}px 0 0`,
      }} />
      <div style={{
        position: 'absolute',
        top: size * 0.32,
        right: size * 0.25,
        width: px * 1.2,
        height: px * 0.9,
        background: '#0A0A0A',
        borderRadius: `${px}px ${px}px 0 0`,
      }} />
      {/* Smile */}
      <div style={{
        position: 'absolute',
        top: size * 0.52,
        left: '50%',
        transform: 'translateX(-50%)',
        width: px * 2,
        height: px * 0.8,
        background: '#0A0A0A',
        borderRadius: `0 0 ${px}px ${px}px`,
      }} />
      {/* Highlight */}
      <div style={{
        position: 'absolute',
        top: size * 0.15,
        left: size * 0.22,
        width: px * 0.8,
        height: px * 0.8,
        background: 'rgba(255,255,255,0.5)',
        borderRadius: '50%',
      }} />
    </div>
  )
}

/* ── Ghost Kitz flying via Web Animations API ── */
function GhostFlyingOrb({ startX, startY, endX, endY, onArrived }: {
  startX: number; startY: number; endX: number; endY: number; onArrived: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const arrivedRef = useRef(false)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Animate the whole container from hero position to chatbox
    const anim = el.animate(
      [
        {
          transform: `translate(${startX}px, ${startY}px) translate(-50%, -50%) scale(1)`,
          opacity: '0.9',
        },
        {
          transform: `translate(${endX}px, ${endY}px) translate(-50%, -50%) scale(0.3)`,
          opacity: '0.4',
        },
      ],
      {
        duration: 600,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
      },
    )

    anim.onfinish = () => {
      if (!arrivedRef.current) {
        arrivedRef.current = true
        onArrived()
      }
    }

    // Fallback
    const timer = setTimeout(() => {
      if (!arrivedRef.current) {
        arrivedRef.current = true
        onArrived()
      }
    }, 650)

    return () => {
      anim.cancel()
      clearTimeout(timer)
    }
  }, [startX, startY, endX, endY, onArrived])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        // Initial position set via transform in the animation
        transform: `translate(${startX}px, ${startY}px) translate(-50%, -50%) scale(1)`,
      }}
    >
      <MiniKitz size={40} />
      {/* Trailing glow */}
      <div style={{
        position: 'absolute',
        inset: -8,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${PURPLE}40, transparent 70%)`,
        animation: 'kitz-halo-pulse 0.6s ease-in-out infinite',
      }} />
    </div>
  )
}

/* ── Ghost merging into chatbox (shrink + blur + fade) ── */
function GhostMerging({ x, y }: { x: number; y: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const anim = el.animate(
      [
        {
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: '0.6',
          filter: `drop-shadow(0 0 20px ${PURPLE}80) blur(0px)`,
        },
        {
          transform: 'translate(-50%, -50%) scale(0.5)',
          opacity: '0.4',
          filter: `drop-shadow(0 0 15px ${PURPLE}a0) blur(2px)`,
        },
        {
          transform: 'translate(-50%, -50%) scale(0.1)',
          opacity: '0.1',
          filter: `drop-shadow(0 0 8px ${PURPLE}60) blur(6px)`,
        },
        {
          transform: 'translate(-50%, -50%) scale(0)',
          opacity: '0',
          filter: 'blur(10px)',
        },
      ],
      {
        duration: 500,
        easing: 'ease-in',
        fill: 'forwards',
      },
    )

    return () => anim.cancel()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 9999,
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%) scale(1)',
      }}
    >
      <MiniKitz size={14} />
    </div>
  )
}

export function FloatingOrb() {
  const orbState = useOrbStore((s) => s.state)
  const focusChat = useOrbStore((s) => s.focusChat)
  const glowChat = useOrbStore((s) => s.glowChat)
  const teleportSeq = useOrbStore((s) => s.teleportSeq)
  const prevStateRef = useRef(orbState)
  const prevTeleportRef = useRef(teleportSeq)

  const [phase, setPhase] = useState<Phase>('hidden')
  const heroRef = useRef({ x: 0, y: 0 })
  const chatRef = useRef({ x: 0, y: 0, width: 300 })
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms)
    timersRef.current.push(t)
    return t
  }, [])

  /** Called when ghost arrives at chatbox */
  const handleGhostArrived = useCallback(() => {
    setPhase('merging')
    focusChat()
    glowChat()

    addTimer(() => {
      setPhase('done')
      addTimer(() => setPhase('hidden'), 300)
    }, 500)
  }, [focusChat, glowChat, addTimer])

  /** Kick off the full puff teleport sequence */
  const doPuffTeleport = useCallback(() => {
    clearTimers()

    // Snapshot positions NOW
    heroRef.current = getHeroCenter()
    chatRef.current = getChatboxInputCenter()

    // Phase 1: Departure puff
    setPhase('departing')

    // Phase 2: After puff, ghost flies
    addTimer(() => {
      setPhase('flying')
    }, 500)
  }, [clearTimers, addTimer])

  // React to orbStore 'thinking' state
  useEffect(() => {
    const prev = prevStateRef.current
    prevStateRef.current = orbState

    if (orbState === 'thinking' && prev !== 'thinking') {
      doPuffTeleport()
    }

    return () => clearTimers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orbState])

  // React to tap-teleport signal from HomePage single-click
  useEffect(() => {
    if (teleportSeq === prevTeleportRef.current) return
    prevTeleportRef.current = teleportSeq
    if (teleportSeq > 0) {
      doPuffTeleport()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teleportSeq])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  const hero = heroRef.current
  const chat = chatRef.current

  return (
    <>
      {/* Phase 1: Departure puff at hero */}
      {phase === 'departing' && (
        <DeparturePuff x={hero.x} y={hero.y} />
      )}

      {/* Phase 2: Ghost flies from hero to chatbox */}
      {phase === 'flying' && (
        <GhostFlyingOrb
          startX={hero.x}
          startY={hero.y}
          endX={chat.x}
          endY={chat.y}
          onArrived={handleGhostArrived}
        />
      )}

      {/* Phase 3: Ghost merges into chatbox + sparkles */}
      {phase === 'merging' && (
        <>
          <GhostMerging x={chat.x} y={chat.y} />
          <MergeEffect x={chat.x} y={chat.y} width={chat.width} />
        </>
      )}
    </>
  )
}
