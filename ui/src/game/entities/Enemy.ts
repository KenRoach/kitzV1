import type { Rect } from '../engine/Collision'
import type { Canvas } from '../engine/Canvas'
import type { Camera } from '../engine/Camera'
import { GROUND_Y } from '../constants'
import {
  SPAM_BOT_FRAMES, SPAM_BOT_PALETTE,
  TAX_GREMLIN_FRAMES, TAX_GREMLIN_PALETTE,
  BAD_REVIEW_FRAMES, BAD_REVIEW_PALETTE,
} from '../sprites/EnemySprites'

export type EnemyType = 'spamBot' | 'taxGremlin' | 'badReview'

interface EnemyDef {
  frames: number[][][]
  palette: Record<number, string>
  w: number
  h: number
  hp: number
  speed: number
  points: number
  flying: boolean
}

const ENEMY_DEFS: Record<EnemyType, EnemyDef> = {
  spamBot: { frames: SPAM_BOT_FRAMES, palette: SPAM_BOT_PALETTE, w: 16, h: 16, hp: 1, speed: 1.5, points: 100, flying: true },
  taxGremlin: { frames: TAX_GREMLIN_FRAMES, palette: TAX_GREMLIN_PALETTE, w: 16, h: 16, hp: 2, speed: 1, points: 150, flying: false },
  badReview: { frames: BAD_REVIEW_FRAMES, palette: BAD_REVIEW_PALETTE, w: 12, h: 12, hp: 1, speed: 2.5, points: 80, flying: false },
}

export class Enemy {
  x: number
  y: number
  type: EnemyType
  hp: number
  alive = true

  private def: EnemyDef
  private animFrame = 0
  private animTimer = 0
  private floatOffset = 0

  constructor(type: EnemyType, x: number, y: number) {
    this.type = type
    this.x = x
    this.def = ENEMY_DEFS[type]
    this.hp = this.def.hp
    this.y = this.def.flying ? y : GROUND_Y - this.def.h
  }

  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.def.w, h: this.def.h }
  }

  get points(): number {
    return this.def.points
  }

  update(dt: number, playerX: number) {
    if (!this.alive) return

    const dir = playerX < this.x ? -1 : 1
    this.x += dir * this.def.speed * dt

    if (this.def.flying) {
      this.floatOffset += 0.05 * dt
      this.y += Math.sin(this.floatOffset) * 0.5
    }

    this.animTimer += dt
    if (this.animTimer > 15) {
      this.animFrame = (this.animFrame + 1) % this.def.frames.length
      this.animTimer = 0
    }
  }

  takeDamage(amount = 1) {
    this.hp -= amount
    if (this.hp <= 0) {
      this.alive = false
    }
  }

  render(canvas: Canvas, camera: Camera) {
    if (!this.alive) return
    const sx = Math.round(this.x - camera.x)
    const sy = Math.round(this.y - camera.y)
    const frame = this.def.frames[this.animFrame] ?? this.def.frames[0]!
    canvas.sprite(frame, sx, sy, 2, this.def.palette)
  }
}
