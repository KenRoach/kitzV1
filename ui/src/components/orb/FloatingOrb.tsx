import { useState, useEffect, useRef, useCallback } from 'react'
import { Orb } from './Orb'
import { useOrbStore } from '@/stores/orbStore'

/**
 * FloatingOrb — PUFF teleport between hero card and chatbox.
 *
 * Uses smoke particles, sparkles, central flash, PUFF text on teleport.
 * Idle: hidden (hero Orb in HomePage handles idle display)
 * Thinking: puff-out at hero → puff-in at chatbox
 * Done: puff-out at chatbox → puff-in at hero
 */

/* ── Brand colors ── */
const PURPLE = '#A855F7'
const PURPLE_LIGHT = '#C084FC'
const PURPLE_DARK = '#7C3AED'
const LAVENDER = '#DDD6FE'

type Phase = 'hidden' | 'puff-out' | 'puff-in' | 'visible'

function getChatboxPosition(): { x: number; y: number } {
  const el = document.querySelector('[data-orb-chatbox]')
  if (el) {
    const rect = el.getBoundingClientRect()
    return { x: rect.left + rect.width / 2 - 40, y: rect.top - 80 }
  }
  return { x: window.innerWidth - 250, y: window.innerHeight - 200 }
}

function getHeroPosition(): { x: number; y: number } {
  const el = document.querySelector('[data-orb-home]')
  if (el) {
    const rect = el.getBoundingClientRect()
    return { x: rect.left + rect.width * 0.76 - 40, y: rect.top + rect.height * 0.48 - 40 }
  }
  return { x: window.innerWidth * 0.35, y: 160 }
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
        zIndex: 50,
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
        zIndex: 55,
      }}
    >
      {/* 4-point star shape */}
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

/* ── Generate smoke puffs around a center point ── */
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

/* ── Generate sparkles around a center point ── */
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

/* ── Full puff effect at a position ── */
function PuffEffect({ x, y, isArrival = false, puffKey }: {
  x: number; y: number; isArrival?: boolean; puffKey: number
}) {
  const center = 40 // half the orb visual size
  const smokes = generateSmokePuffs(center, center, isArrival ? 10 : 12)
  const sparkles = generateSparkles(center, center, isArrival ? 20 : 16)

  return (
    <div
      key={`puff-${isArrival ? 'arrive' : 'depart'}-${puffKey}`}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 60,
        pointerEvents: 'none',
      }}
    >
      {/* Smoke particles */}
      {smokes.map((p) => (
        <SmokePuffParticle
          key={p.id}
          x={p.x}
          y={p.y}
          delay={p.delay}
          size={p.size}
          color={p.color}
          duration={isArrival ? p.duration * 0.8 : p.duration}
        />
      ))}

      {/* Sparkles */}
      {sparkles.map((s) => (
        <SparkleParticle
          key={`s-${s.id}`}
          x={s.x}
          y={s.y}
          delay={s.delay}
          size={s.size}
          color={s.color}
        />
      ))}

      {/* Central flash */}
      <div style={{
        position: 'absolute',
        left: center - 30,
        top: center - 30,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: isArrival
          ? `radial-gradient(circle, ${LAVENDER}90, ${PURPLE}30, transparent)`
          : `radial-gradient(circle, ${LAVENDER}cc, ${PURPLE}40, transparent)`,
        animation: isArrival
          ? 'kitz-arrivalFlash 500ms ease-out both'
          : 'kitz-centralFlash 400ms ease-out both',
        zIndex: 45,
      }} />

      {/* PUFF text only on departure */}
      {!isArrival && <PuffText />}
    </div>
  )
}

export function FloatingOrb() {
  const orbState = useOrbStore((s) => s.state)
  const focusChat = useOrbStore((s) => s.focusChat)
  const prevStateRef = useRef(orbState)

  const [phase, setPhase] = useState<Phase>('hidden')
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [departPuff, setDepartPuff] = useState<{ x: number; y: number } | null>(null)
  const [arrivePuff, setArrivePuff] = useState<{ x: number; y: number } | null>(null)
  const [puffKey, setPuffKey] = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // React to orbStore state changes
  useEffect(() => {
    const prev = prevStateRef.current
    prevStateRef.current = orbState

    if (orbState === 'thinking' && prev !== 'thinking') {
      // === TELEPORT TO CHATBOX ===
      clearTimers()
      setPuffKey((k) => k + 1)

      // 1) Departure puff at hero position
      const hero = getHeroPosition()
      setDepartPuff({ x: hero.x, y: hero.y })

      // 2) Hide Orb during teleport
      timeoutRef.current = setTimeout(() => {
        setDepartPuff(null)
        const chatbox = getChatboxPosition()
        setPos(chatbox)

        // Arrival puff at chatbox + activate chatbox
        setArrivePuff({ x: chatbox.x, y: chatbox.y })
        setPhase('puff-in')
        focusChat() // activate the chatbox when Kitz arrives

        // Clear arrival effects
        timeoutRef.current = setTimeout(() => {
          setArrivePuff(null)
          setPhase('visible')
        }, 600)
      }, 500)

    } else if (
      (orbState === 'success' || orbState === 'error' || orbState === 'idle') &&
      prev === 'thinking' &&
      phase !== 'hidden'
    ) {
      // === TELEPORT BACK TO HERO ===
      clearTimers()

      timeoutRef.current = setTimeout(() => {
        setPuffKey((k) => k + 1)
        const chatbox = getChatboxPosition()
        setDepartPuff({ x: chatbox.x, y: chatbox.y })
        setPhase('puff-out')

        timeoutRef.current = setTimeout(() => {
          setDepartPuff(null)
          setArrivePuff(null)
          setPhase('hidden')
        }, 600)
      }, 1500)
    }

    return () => clearTimers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orbState])

  // Clean up on unmount
  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  return (
    <>
      {/* Departure puff effect (smoke + sparkles + PUFF text) */}
      {departPuff && (
        <PuffEffect x={departPuff.x} y={departPuff.y} puffKey={puffKey} />
      )}

      {/* Arrival puff effect */}
      {arrivePuff && (
        <PuffEffect x={arrivePuff.x} y={arrivePuff.y} isArrival puffKey={puffKey} />
      )}

      {/* The Orb — only rendered when not hidden */}
      {phase !== 'hidden' && (
        <div
          className={
            phase === 'puff-out' ? 'kitz-puff-out' :
            phase === 'puff-in' ? 'kitz-puff-in' :
            ''
          }
          style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y,
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          <Orb />
        </div>
      )}
    </>
  )
}
