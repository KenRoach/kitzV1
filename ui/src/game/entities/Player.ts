import type { Rect } from '../engine/Collision'
import type { Input } from '../engine/Input'
import type { Canvas } from '../engine/Canvas'
import type { Camera } from '../engine/Camera'
import {
  GRAVITY, MAX_FALL_SPEED, GROUND_Y,
  PLAYER_SPEED, PLAYER_JUMP_FORCE,
  PLAYER_WIDTH, PLAYER_HEIGHT,
  PLAYER_MAX_HP, PLAYER_INVINCIBLE_MS,
} from '../constants'
import {
  KITZ_BODY, KITZ_FEET, KITZ_ANTENNA,
  KITZ_PALETTES, LASER_SPRITE, LASER_PALETTES,
} from '../sprites/KitzSprite'
import { AuraRenderer } from '../systems/AuraRenderer'

export interface Projectile extends Rect {
  vx: number
  vy: number
  level: number
  alive: boolean
}

export class Player {
  x: number
  y: number
  vx = 0
  vy = 0
  hp = PLAYER_MAX_HP
  level = 1
  facing: 'left' | 'right' = 'right'
  grounded = false
  invincibleUntil = 0

  private feetFrame = 0
  private feetTimer = 0
  private shootCooldown = 0
  private aura = new AuraRenderer()

  projectiles: Projectile[] = []

  constructor(startX: number, startY: number) {
    this.x = startX
    this.y = startY
  }

  get rect(): Rect {
    return { x: this.x, y: this.y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT }
  }

  get isInvincible(): boolean {
    return performance.now() < this.invincibleUntil
  }

  update(input: Input, dt: number) {
    this.vx = 0
    if (input.isHeld('left')) {
      this.vx = -PLAYER_SPEED * dt
      this.facing = 'left'
    }
    if (input.isHeld('right')) {
      this.vx = PLAYER_SPEED * dt
      this.facing = 'right'
    }
    this.x += this.vx

    if (input.justPressed('jump') && this.grounded) {
      this.vy = PLAYER_JUMP_FORCE
      this.grounded = false
    }

    this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL_SPEED)
    this.y += this.vy * dt

    if (this.y + PLAYER_HEIGHT >= GROUND_Y) {
      this.y = GROUND_Y - PLAYER_HEIGHT
      this.vy = 0
      this.grounded = true
    }

    if (this.shootCooldown > 0) this.shootCooldown -= dt
    if (input.justPressed('shoot') && this.shootCooldown <= 0) {
      this.shoot()
      this.shootCooldown = 12
    }

    if (Math.abs(this.vx) > 0.1) {
      this.feetTimer += dt
      if (this.feetTimer > 6) {
        this.feetFrame = (this.feetFrame + 1) % 3
        this.feetTimer = 0
      }
    } else {
      this.feetFrame = 0
    }

    for (const p of this.projectiles) {
      p.x += p.vx * dt
      if (p.x < -50 || p.x > 5000) p.alive = false
    }
    this.projectiles = this.projectiles.filter((p) => p.alive)

    this.aura.update(dt)
  }

  shoot() {
    const dir = this.facing === 'right' ? 1 : -1
    this.projectiles.push({
      x: this.x + (dir > 0 ? PLAYER_WIDTH : -8),
      y: this.y + PLAYER_HEIGHT / 2 - 2,
      w: 8,
      h: 4,
      vx: 6 * dir,
      vy: 0,
      level: this.level,
      alive: true,
    })
  }

  takeDamage() {
    if (this.isInvincible) return false
    this.hp--
    this.invincibleUntil = performance.now() + PLAYER_INVINCIBLE_MS
    return true
  }

  render(canvas: Canvas, camera: Camera) {
    const sx = Math.round(this.x - camera.x)
    const sy = Math.round(this.y - camera.y)
    const px = 2
    const palette = KITZ_PALETTES[this.level] ?? KITZ_PALETTES[1]!

    if (this.isInvincible && Math.floor(performance.now() / 100) % 2 === 0) return

    // Aura behind the player
    this.aura.render(canvas, this.level, sx + PLAYER_WIDTH / 2, sy + PLAYER_HEIGHT / 2)

    canvas.sprite(KITZ_ANTENNA, sx, sy - px * 2, px, palette)
    canvas.sprite(KITZ_BODY, sx, sy, px, palette)

    const feet = KITZ_FEET[this.feetFrame] ?? KITZ_FEET[0]!
    canvas.sprite(feet, sx, sy + px * 8, px, palette)

    const lPalette = LASER_PALETTES[this.level] ?? LASER_PALETTES[1]!
    for (const p of this.projectiles) {
      canvas.sprite(LASER_SPRITE, Math.round(p.x - camera.x), Math.round(p.y - camera.y), 2, lPalette)
    }
  }

  reset(startX: number, startY: number) {
    this.x = startX
    this.y = startY
    this.vx = 0
    this.vy = 0
    this.hp = PLAYER_MAX_HP
    this.grounded = false
    this.projectiles = []
    this.shootCooldown = 0
    this.invincibleUntil = 0
  }
}
