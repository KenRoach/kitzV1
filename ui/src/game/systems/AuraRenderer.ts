import type { Canvas } from '../engine/Canvas'
import { COLORS } from '../constants'

interface AuraLayer {
  color: string
  radius: number
  pulseSpeed: number
  opacity: number
}

const AURA_DEFS: Record<number, AuraLayer[]> = {
  1: [],
  2: [
    { color: COLORS.blue, radius: 14, pulseSpeed: 0.04, opacity: 0.2 },
  ],
  3: [
    { color: COLORS.blue, radius: 14, pulseSpeed: 0.04, opacity: 0.15 },
    { color: COLORS.gold, radius: 18, pulseSpeed: 0.03, opacity: 0.25 },
  ],
  4: [
    { color: COLORS.blue, radius: 14, pulseSpeed: 0.04, opacity: 0.1 },
    { color: COLORS.gold, radius: 18, pulseSpeed: 0.03, opacity: 0.15 },
    { color: COLORS.white, radius: 22, pulseSpeed: 0.02, opacity: 0.2 },
  ],
  5: [
    { color: COLORS.blue, radius: 14, pulseSpeed: 0.04, opacity: 0.08 },
    { color: COLORS.gold, radius: 18, pulseSpeed: 0.03, opacity: 0.12 },
    { color: COLORS.white, radius: 22, pulseSpeed: 0.02, opacity: 0.15 },
    { color: COLORS.gold, radius: 26, pulseSpeed: 0.015, opacity: 0.2 },
  ],
}

export class AuraRenderer {
  private time = 0

  update(dt: number) {
    this.time += dt
  }

  render(canvas: Canvas, level: number, centerX: number, centerY: number) {
    const layers = AURA_DEFS[level] ?? []
    const ctx = canvas.ctx

    for (const layer of layers) {
      const pulse = Math.sin(this.time * layer.pulseSpeed) * 0.3 + 0.7
      const r = layer.radius * pulse

      ctx.save()
      ctx.globalAlpha = layer.opacity * pulse
      ctx.beginPath()
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
      ctx.fillStyle = layer.color
      ctx.filter = `blur(${Math.round(r * 0.4)}px)`
      ctx.fill()
      ctx.restore()
    }

    // Founder Mode: orbiting dots representing agent teams
    if (level >= 5) {
      const teamCount = 8
      for (let i = 0; i < teamCount; i++) {
        const angle = (i / teamCount) * Math.PI * 2 + this.time * 0.02
        const orbitR = 20 + Math.sin(this.time * 0.01 + i) * 3
        const dx = Math.cos(angle) * orbitR
        const dy = Math.sin(angle) * orbitR * 0.6
        ctx.save()
        ctx.globalAlpha = 0.6
        ctx.fillStyle = i % 2 === 0 ? COLORS.gold : COLORS.purpleLight
        ctx.beginPath()
        ctx.arc(centerX + dx, centerY + dy, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }
  }
}
