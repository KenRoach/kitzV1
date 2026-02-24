import { GameLoop } from './engine/GameLoop'
import { Canvas } from './engine/Canvas'
import { Input } from './engine/Input'
import { Camera } from './engine/Camera'
import { aabb } from './engine/Collision'
import { Player } from './entities/Player'
import { Enemy } from './entities/Enemy'
import type { LevelDef } from './levels/LevelData'
import { COIN_SPRITE, COIN_PALETTE } from './sprites/EnemySprites'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, TILE_SIZE,
  SCORE_PER_COIN, SCORE_PER_LEVEL, SCORE_NO_DAMAGE_BONUS,
  XP_PER_ENEMY, XP_PER_LEVEL, XP_PER_QUIZ_CORRECT,
  PLAYER_MAX_HP, PLAYER_MAX_LIVES, EXTRA_LIFE_THRESHOLD,
  COLORS,
} from './constants'
import type { GameState } from './constants'

export interface GameCallbacks {
  onScoreChange: (score: number) => void
  onHpChange: (hp: number) => void
  onLivesChange: (lives: number) => void
  onStateChange: (state: GameState) => void
  onQuizTrigger: () => void
  onLevelComplete: (xpEarned: number) => void
  onGameOver: (finalScore: number) => void
}

/** Difficulty scaling per world (1-5) */
const WORLD_DIFFICULTY = [
  null, // index 0 unused
  { enemySpeed: 0.4, quizInterval: 350, label: 'Chill' },   // World 1: super easy, learn lots
  { enemySpeed: 0.65, quizInterval: 450, label: 'Easy' },    // World 2: easy, still learning
  { enemySpeed: 1.0, quizInterval: 600, label: 'Medium' },   // World 3: baseline
  { enemySpeed: 1.3, quizInterval: 800, label: 'Hard' },     // World 4: challenging
  { enemySpeed: 1.6, quizInterval: 1200, label: 'Beast' },   // World 5: beast mode
]

export class GameManager {
  private loop: GameLoop
  private canvas: Canvas
  private input: Input
  private camera: Camera
  private player: Player

  state: GameState = 'menu'
  score = 0
  lives = PLAYER_MAX_LIVES
  private tookDamage = false
  private nextLifeAt: number

  private level: LevelDef | null = null
  private enemies: Enemy[] = []
  private coins: { x: number; y: number; collected: boolean }[] = []
  private xpEarned = 0

  // Auto-quiz system: triggers quiz based on distance traveled
  private lastQuizX = 0
  private quizInterval = 500

  private callbacks: GameCallbacks
  private stars: { x: number; y: number; size: number; speed: number }[] = []

  constructor(canvasEl: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = new Canvas(canvasEl)
    this.input = new Input()
    this.camera = new Camera()
    this.player = new Player(50, GROUND_Y - 32)
    this.callbacks = callbacks
    this.nextLifeAt = EXTRA_LIFE_THRESHOLD

    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * 3000,
        y: Math.random() * (GROUND_Y - 20),
        size: Math.random() > 0.7 ? 2 : 1,
        speed: 0.2 + Math.random() * 0.3,
      })
    }

    this.loop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render(),
    )
  }

  start() {
    this.loop.start()
  }

  destroy() {
    this.loop.stop()
    this.input.destroy()
  }

  resize() {
    this.canvas.resize()
  }

  loadLevel(levelDef: LevelDef, playerLevel: number) {
    this.level = levelDef
    this.camera.levelWidth = levelDef.width
    this.camera.x = 0
    this.player.reset(50, GROUND_Y - 32)
    this.player.level = playerLevel
    this.tookDamage = false
    this.xpEarned = 0
    this.lastQuizX = 0

    // Get world difficulty
    const diff = WORLD_DIFFICULTY[levelDef.world]
    const speedMult = diff?.enemySpeed ?? 1
    this.quizInterval = diff?.quizInterval ?? 500

    this.enemies = levelDef.enemies.map((s) => new Enemy(s.type, s.x, s.y, speedMult))
    this.coins = levelDef.coins.map((c) => ({ ...c, collected: false }))

    for (const qt of levelDef.quizTriggers) {
      qt.triggered = false
    }

    this.state = 'playing'
    this.callbacks.onStateChange('playing')
    this.callbacks.onHpChange(this.player.hp)
    this.callbacks.onLivesChange(this.lives)
    this.loop.resume()
  }

  pauseGame() {
    if (this.state !== 'playing') return
    this.state = 'paused'
    this.loop.pause()
    this.callbacks.onStateChange('paused')
  }

  resumeGame() {
    if (this.state !== 'paused') return
    this.state = 'playing'
    this.loop.resume()
    this.callbacks.onStateChange('playing')
  }

  answerQuiz(correct: boolean) {
    if (correct) {
      this.addScore(500)
      this.xpEarned += XP_PER_QUIZ_CORRECT
      if (this.player.hp < PLAYER_MAX_HP) {
        this.player.hp++
        this.callbacks.onHpChange(this.player.hp)
      }
    }
    this.state = 'playing'
    this.loop.resume()
    this.callbacks.onStateChange('playing')
  }

  touchAction(action: 'left' | 'right' | 'jump' | 'shoot' | 'special', pressed: boolean) {
    if (pressed) this.input.touchStart(action)
    else this.input.touchEnd(action)
  }

  private update(dt: number) {
    if (this.state !== 'playing' || !this.level) return

    if (this.input.justPressed('pause')) {
      this.pauseGame()
      this.input.endFrame()
      return
    }

    this.player.update(this.input, dt)

    // Platform collisions
    for (const plat of this.level.platforms) {
      const pr = this.player.rect
      if (this.player.vy >= 0 &&
        pr.x + pr.w > plat.x && pr.x < plat.x + plat.w &&
        pr.y + pr.h >= plat.y && pr.y + pr.h <= plat.y + plat.h + 4) {
        this.player.y = plat.y - pr.h
        this.player.vy = 0
        this.player.grounded = true
      }
    }

    for (const enemy of this.enemies) {
      enemy.update(dt, this.player.x)
    }

    // Projectile vs enemy
    for (const proj of this.player.projectiles) {
      for (const enemy of this.enemies) {
        if (!enemy.alive || !proj.alive) continue
        if (aabb(proj, enemy.rect)) {
          proj.alive = false
          enemy.takeDamage()
          if (!enemy.alive) {
            this.addScore(enemy.points)
            this.xpEarned += XP_PER_ENEMY
          }
        }
      }
    }

    // Enemy vs player
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue
      if (aabb(this.player.rect, enemy.rect)) {
        if (this.player.takeDamage()) {
          this.tookDamage = true
          this.callbacks.onHpChange(this.player.hp)
          if (this.player.hp <= 0) {
            this.loseLife()
          }
        }
      }
    }

    // Coin collection
    for (const coin of this.coins) {
      if (coin.collected) continue
      if (aabb(this.player.rect, { x: coin.x, y: coin.y, w: 12, h: 12 })) {
        coin.collected = true
        this.addScore(SCORE_PER_COIN)
      }
    }

    // Fixed quiz triggers from level data
    for (const qt of this.level.quizTriggers) {
      if (!qt.triggered && this.player.x >= qt.x) {
        qt.triggered = true
        this.triggerQuiz()
        return
      }
    }

    // Auto quiz trigger based on distance traveled (stealth learning)
    if (this.player.x - this.lastQuizX >= this.quizInterval) {
      this.lastQuizX = this.player.x
      // Don't trigger too close to finish or start
      if (this.player.x > 200 && this.player.x < this.level.finishX - 200) {
        this.triggerQuiz()
        return
      }
    }

    // Finish line
    if (this.player.x >= this.level.finishX) {
      this.completeLevel()
    }

    this.camera.update(this.player.x, this.player.y)
    this.input.endFrame()
  }

  private triggerQuiz() {
    this.state = 'quiz'
    this.loop.pause()
    this.callbacks.onStateChange('quiz')
    this.callbacks.onQuizTrigger()
  }

  private render() {
    if (!this.level) return
    const c = this.canvas
    const cam = this.camera

    c.clear()

    // Stars (parallax)
    for (const star of this.stars) {
      const sx = star.x - cam.x * star.speed
      const screenX = ((sx % CANVAS_WIDTH) + CANVAS_WIDTH) % CANVAS_WIDTH
      c.rect(screenX, star.y, star.size, star.size, COLORS.purpleLight + '30')
    }

    // Ground
    c.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y, this.level.groundColor)
    c.rect(0, GROUND_Y, CANVAS_WIDTH, 2, COLORS.purpleLight + '40')

    // Platforms
    for (const plat of this.level.platforms) {
      const px = Math.round(plat.x - cam.x)
      c.rect(px, plat.y, plat.w, plat.h, '#4B5563')
      c.rect(px, plat.y, plat.w, 2, '#6B7280')
    }

    // Coins
    for (const coin of this.coins) {
      if (coin.collected) continue
      c.sprite(COIN_SPRITE, Math.round(coin.x - cam.x), Math.round(coin.y - cam.y), 2, COIN_PALETTE)
    }

    // Enemies
    for (const enemy of this.enemies) {
      enemy.render(c, cam)
    }

    // Player
    this.player.render(c, cam)

    // Finish flag
    const fx = Math.round(this.level.finishX - cam.x)
    c.rect(fx, GROUND_Y - TILE_SIZE * 5, 3, TILE_SIZE * 5, COLORS.purpleLight)
    c.rect(fx + 3, GROUND_Y - TILE_SIZE * 5, TILE_SIZE, TILE_SIZE, COLORS.gold)
  }

  private addScore(points: number) {
    this.score += points
    this.callbacks.onScoreChange(this.score)

    if (this.score >= this.nextLifeAt) {
      this.lives++
      this.nextLifeAt += EXTRA_LIFE_THRESHOLD
      this.callbacks.onLivesChange(this.lives)
    }
  }

  private loseLife() {
    this.lives--
    this.callbacks.onLivesChange(this.lives)

    if (this.lives <= 0) {
      this.state = 'gameOver'
      this.loop.pause()
      this.callbacks.onStateChange('gameOver')
      this.callbacks.onGameOver(this.score)
    } else {
      this.player.reset(50, GROUND_Y - 32)
      this.player.hp = PLAYER_MAX_HP
      this.callbacks.onHpChange(this.player.hp)
    }
  }

  private completeLevel() {
    this.state = 'levelComplete'
    this.loop.pause()

    let levelScore = SCORE_PER_LEVEL
    if (!this.tookDamage) levelScore += SCORE_NO_DAMAGE_BONUS
    this.addScore(levelScore)

    this.xpEarned += XP_PER_LEVEL
    this.callbacks.onStateChange('levelComplete')
    this.callbacks.onLevelComplete(this.xpEarned)
  }
}
