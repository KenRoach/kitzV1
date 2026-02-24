import { useState, useEffect, useRef } from 'react'
import { Orb } from './Orb'
import { useOrbStore } from '@/stores/orbStore'
import { useOrbNavigatorStore } from '@/hooks/useOrbNavigator'

/**
 * FloatingOrb — the Orb that glides from the hero card to the chatbox.
 *
 * Behavior:
 * - Idle: gentle Lissajous drift near its "home" position (hero card area)
 * - Thinking: glides to the chatbox input area
 * - Done: glides back to home
 * - Nav highlight: glides to the highlighted nav item
 */

// Drift parameters for idle floating
const DRIFT_RANGE_X = 10
const DRIFT_RANGE_Y = 6
const DRIFT_SPEED = 0.0007

type GlideTarget = 'home' | 'chatbox' | 'nav'

function getHomePosition(): { x: number; y: number } {
  // Try to find the hero card and position in its right half
  const hero = document.querySelector('[data-orb-home]')
  if (hero) {
    const rect = hero.getBoundingClientRect()
    return {
      x: rect.left + rect.width * 0.76,
      y: rect.top + rect.height * 0.48,
    }
  }
  // Fallback: center-right of viewport
  return {
    x: window.innerWidth * 0.4,
    y: 180,
  }
}

function getChatboxPosition(): { x: number; y: number } {
  // Find the chatbox input area
  const chatInput = document.querySelector('[data-orb-chatbox]')
  if (chatInput) {
    const rect = chatInput.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2 - 40,
      y: rect.top - 60,
    }
  }
  // Fallback: right panel area
  return {
    x: window.innerWidth - 250,
    y: window.innerHeight - 200,
  }
}

export function FloatingOrb() {
  const orbState = useOrbStore((s) => s.state)
  const { target, highlighting } = useOrbNavigatorStore()

  const [basePos, setBasePos] = useState({ x: 0, y: 0 })
  const [drift, setDrift] = useState({ x: 0, y: 0 })
  const [initialized, setInitialized] = useState(false)
  const [glideTarget, setGlideTarget] = useState<GlideTarget>('home')
  const [visible, setVisible] = useState(true)

  const rafRef = useRef<number>(0)
  const startTimeRef = useRef(Date.now())

  // Initialize at home position
  useEffect(() => {
    const home = getHomePosition()
    setBasePos(home)
    setInitialized(true)
    startTimeRef.current = Date.now()
  }, [])

  // Idle drift — Lissajous figure-8 via transform
  useEffect(() => {
    if (!initialized) return

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current
      const dx = Math.sin(elapsed * DRIFT_SPEED) * DRIFT_RANGE_X
      const dy = Math.sin(elapsed * DRIFT_SPEED * 1.4 + 0.8) * DRIFT_RANGE_Y
      setDrift({ x: dx, y: dy })
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [initialized])

  // React to orbStore state changes — glide to chatbox when thinking
  useEffect(() => {
    if (orbState === 'thinking') {
      setGlideTarget('chatbox')
      setVisible(true)
      const pos = getChatboxPosition()
      setBasePos(pos)
    } else if (orbState === 'idle' || orbState === 'success' || orbState === 'error') {
      // Only glide back if we were at chatbox
      if (glideTarget === 'chatbox') {
        // Small delay so user sees the Orb at the chatbox when response appears
        setTimeout(() => {
          setGlideTarget('home')
          const home = getHomePosition()
          setBasePos(home)
        }, 1200)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orbState])

  // React to nav highlighting — overrides chatbox targeting
  useEffect(() => {
    if (target && highlighting) {
      setGlideTarget('nav')
      setVisible(true)
      const el = document.querySelector(`[data-nav="${target.id}"]`)
      if (el) {
        const rect = el.getBoundingClientRect()
        setBasePos({
          x: rect.right + 16,
          y: rect.top + rect.height / 2 - 24,
        })
      }
    } else if (!highlighting && glideTarget === 'nav') {
      setGlideTarget('home')
      const home = getHomePosition()
      setBasePos(home)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, highlighting])

  if (!initialized || !visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: basePos.x,
        top: basePos.y,
        // Smooth glide for position changes (home ↔ chatbox ↔ nav)
        transition: 'left 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), top 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        // Idle drift layered via transform — doesn't fight CSS transitions
        transform: `translate(${drift.x}px, ${drift.y}px)`,
        zIndex: 50,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    >
      <Orb />
    </div>
  )
}
