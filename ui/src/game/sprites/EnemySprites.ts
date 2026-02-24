import { COLORS } from '../constants'

// ── Spam Bot (flying, shoots junk) ── 8x8
export const SPAM_BOT_FRAMES: number[][][] = [
  [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 2, 2, 1, 0, 0],
    [0, 3, 1, 1, 1, 1, 3, 0],
    [3, 3, 1, 4, 4, 1, 3, 3],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 3, 3, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 2, 2, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 4, 4, 1, 0, 0],
    [3, 3, 1, 1, 1, 1, 3, 3],
    [0, 3, 1, 3, 3, 1, 3, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
]

export const SPAM_BOT_PALETTE: Record<number, string> = {
  1: '#64748B',
  2: '#94A3B8',
  3: '#475569',
  4: COLORS.red,
}

// ── Tax Gremlin (ground, hops) ── 8x8
export const TAX_GREMLIN_FRAMES: number[][][] = [
  [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 4, 4, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 1, 1, 1, 1, 2, 1],
    [1, 1, 1, 3, 3, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 3, 0, 0, 3, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 4, 4, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 1, 1, 1, 1, 2, 1],
    [0, 1, 1, 3, 3, 1, 1, 0],
    [0, 3, 0, 0, 0, 0, 3, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
]

export const TAX_GREMLIN_PALETTE: Record<number, string> = {
  1: '#16A34A',
  2: '#4ADE80',
  3: '#15803D',
  4: COLORS.gold,
}

// ── Bad Review Bug (small, fast, swarms) ── 6x6
export const BAD_REVIEW_FRAMES: number[][][] = [
  [
    [0, 1, 1, 1, 1, 0],
    [1, 4, 1, 1, 4, 1],
    [1, 1, 1, 1, 1, 1],
    [0, 1, 3, 3, 1, 0],
    [0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  [
    [0, 0, 1, 1, 0, 0],
    [0, 1, 4, 4, 1, 0],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 3, 3, 1, 1],
    [0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
]

export const BAD_REVIEW_PALETTE: Record<number, string> = {
  1: '#F97316',
  2: '#FB923C',
  3: '#EA580C',
  4: COLORS.dark,
}

// ── Coin pickup ── 6x6
export const COIN_SPRITE: number[][] = [
  [0, 0, 1, 1, 0, 0],
  [0, 1, 2, 2, 1, 0],
  [1, 2, 1, 2, 2, 1],
  [1, 2, 2, 1, 2, 1],
  [0, 1, 2, 2, 1, 0],
  [0, 0, 1, 1, 0, 0],
]

export const COIN_PALETTE: Record<number, string> = {
  1: COLORS.gold,
  2: '#FDE68A',
}

// ── Health heart pickup ── 6x6
export const HEART_SPRITE: number[][] = [
  [0, 1, 0, 0, 1, 0],
  [1, 1, 1, 1, 1, 1],
  [1, 2, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0],
]

export const HEART_PALETTE: Record<number, string> = {
  1: COLORS.red,
  2: '#FCA5A5',
}
