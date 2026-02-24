// ── Kitz Run — Shared Constants ──

// Canvas
export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 450
export const TILE_SIZE = 16

// Physics
export const GRAVITY = 0.6
export const MAX_FALL_SPEED = 12
export const GROUND_Y = CANVAS_HEIGHT - TILE_SIZE * 3

// Player
export const PLAYER_SPEED = 3
export const PLAYER_JUMP_FORCE = -10
export const PLAYER_WIDTH = 16
export const PLAYER_HEIGHT = 16
export const PLAYER_MAX_HP = 3
export const PLAYER_MAX_LIVES = 3
export const PLAYER_INVINCIBLE_MS = 1500

// Scoring
export const SCORE_PER_ENEMY = 100
export const SCORE_PER_BOSS = 1000
export const SCORE_PER_QUIZ = 500
export const SCORE_PER_COIN = 10
export const SCORE_PER_LEVEL = 2000
export const SCORE_NO_DAMAGE_BONUS = 1500
export const EXTRA_LIFE_THRESHOLD = 10000

// XP (syncs with gameStore)
export const XP_PER_ENEMY = 10
export const XP_PER_BOSS = 100
export const XP_PER_QUIZ_CORRECT = 50
export const XP_PER_LEVEL = 200

// Colors
export const COLORS = {
  purple: '#A855F7',
  purpleLight: '#C084FC',
  purpleDark: '#7C3AED',
  lavender: '#DDD6FE',
  gold: '#FBBF24',
  blue: '#60A5FA',
  white: '#F9FAFB',
  dark: '#0A0A0A',
  red: '#EF4444',
  green: '#22C55E',
  sky: '#0D0D12',
} as const

// Game states
export type GameState = 'menu' | 'playing' | 'paused' | 'quiz' | 'levelComplete' | 'gameOver'
