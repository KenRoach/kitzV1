import { useState, useEffect } from 'react'
import { Orb } from './Orb'
import { useOrbNavigatorStore } from '@/hooks/useOrbNavigator'

const DEFAULT_X = -100  // positioned relative to right edge
const DEFAULT_Y = -150  // positioned relative to bottom edge

export function FloatingOrb() {
  const { target, highlighting } = useOrbNavigatorStore()
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [initialized, setInitialized] = useState(false)

  // Set initial position on mount
  useEffect(() => {
    setPosition({
      x: window.innerWidth + DEFAULT_X,
      y: window.innerHeight + DEFAULT_Y,
    })
    setInitialized(true)
  }, [])

  // Animate toward nav target when highlighting
  useEffect(() => {
    if (target && highlighting) {
      const el = document.querySelector(`[data-nav="${target.id}"]`)
      if (el) {
        const rect = el.getBoundingClientRect()
        // Position Orb just to the right of the nav item
        setPosition({
          x: rect.right + 16,
          y: rect.top + rect.height / 2 - 24,
        })
      }
    } else if (!highlighting && initialized) {
      // Return to default position
      setPosition({
        x: window.innerWidth + DEFAULT_X,
        y: window.innerHeight + DEFAULT_Y,
      })
    }
  }, [target, highlighting, initialized])

  if (!initialized) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transition: 'left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 40,
        pointerEvents: 'none',
      }}
    >
      <Orb />
    </div>
  )
}
