import { useState, useEffect, useRef, useCallback } from 'react'
import { Orb } from './Orb'
import { useOrbStore } from '@/stores/orbStore'

/**
 * FloatingOrb — PUFF teleport between hero card and chatbox.
 *
 * Idle: hidden (hero Orb in HomePage handles idle display)
 * Thinking: puff-out at hero → puff-in at chatbox
 * Done: puff-out at chatbox → puff-in at hero
 */

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

/** Purple smoke puff particle */
function SmokePuff({ x, y }: { x: number; y: number }) {
  return (
    <div
      style={{ position: 'fixed', left: x, top: y, zIndex: 60, pointerEvents: 'none' }}
    >
      {/* Multiple offset smoke rings for depth */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="kitz-smoke"
          style={{
            position: 'absolute',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(168,85,247,${0.6 - i * 0.1}) 0%, transparent 70%)`,
            left: (i % 2 === 0 ? -1 : 1) * (8 + i * 6),
            top: (i % 3 === 0 ? -1 : 1) * (4 + i * 5),
            animationDelay: `${i * 0.06}s`,
          }}
        />
      ))}
      {/* Star sparkle */}
      <div
        className="kitz-smoke"
        style={{
          position: 'absolute',
          left: -4,
          top: -4,
          fontSize: 18,
          animationDelay: '0.1s',
        }}
      >
        ✨
      </div>
    </div>
  )
}

export function FloatingOrb() {
  const orbState = useOrbStore((s) => s.state)
  const prevStateRef = useRef(orbState)

  const [phase, setPhase] = useState<Phase>('hidden')
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [smokePos, setSmokePos] = useState<{ x: number; y: number } | null>(null)
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

      // 1) Smoke puff at hero position
      const hero = getHeroPosition()
      setSmokePos({ x: hero.x + 40, y: hero.y + 40 })

      // 2) After puff-out duration, appear at chatbox with puff-in
      timeoutRef.current = setTimeout(() => {
        setSmokePos(null)
        const chatbox = getChatboxPosition()
        setPos(chatbox)

        // Smoke at chatbox arrival
        setSmokePos({ x: chatbox.x + 40, y: chatbox.y + 40 })
        setPhase('puff-in')

        // Clear arrival smoke after animation
        timeoutRef.current = setTimeout(() => {
          setSmokePos(null)
          setPhase('visible')
        }, 500)
      }, 400)

    } else if (
      (orbState === 'success' || orbState === 'error' || orbState === 'idle') &&
      prev === 'thinking' &&
      phase !== 'hidden'
    ) {
      // === TELEPORT BACK TO HERO ===
      clearTimers()

      // Wait a beat so user sees the Orb at the chatbox with the response
      timeoutRef.current = setTimeout(() => {
        // Smoke puff at chatbox
        const chatbox = getChatboxPosition()
        setSmokePos({ x: chatbox.x + 40, y: chatbox.y + 40 })
        setPhase('puff-out')

        timeoutRef.current = setTimeout(() => {
          setSmokePos(null)
          setPhase('hidden')
        }, 500)
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
      {/* Smoke particles */}
      {smokePos && <SmokePuff x={smokePos.x} y={smokePos.y} />}

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
