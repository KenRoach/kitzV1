import { COLORS } from '../constants'

// ── Base Kitz (Level 1) ── 8x8 body (matches existing Orb shape)
export const KITZ_BODY: number[][] = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 4, 1, 1, 4, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 3, 3, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
]

// Feet frames for run animation
export const KITZ_FEET: number[][][] = [
  [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 3, 0, 0, 3, 0, 0]],
  [[0, 0, 0, 0, 0, 0, 0, 0], [0, 3, 0, 0, 0, 3, 0, 0]],
  [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 3, 0, 0, 0, 3, 0]],
]

// Antenna
export const KITZ_ANTENNA: number[][] = [
  [0, 0, 0, 5, 5, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0],
]

// Color palettes for each level
export const KITZ_PALETTES: Record<number, Record<number, string>> = {
  1: { 1: COLORS.purple, 2: COLORS.lavender, 3: COLORS.purpleDark, 4: COLORS.dark, 5: COLORS.purpleLight },
  2: { 1: COLORS.purple, 2: COLORS.lavender, 3: COLORS.purpleDark, 4: COLORS.dark, 5: COLORS.blue },
  3: { 1: COLORS.purple, 2: COLORS.gold, 3: COLORS.purpleDark, 4: COLORS.dark, 5: COLORS.gold },
  4: { 1: COLORS.purple, 2: COLORS.white, 3: COLORS.purpleDark, 4: COLORS.dark, 5: COLORS.white },
  5: { 1: COLORS.purple, 2: COLORS.gold, 3: COLORS.purpleDark, 4: COLORS.dark, 5: COLORS.gold },
}

// Laser projectile sprite (4x2)
export const LASER_SPRITE: number[][] = [
  [0, 1, 1, 2],
  [0, 1, 1, 2],
]

export const LASER_PALETTES: Record<number, Record<number, string>> = {
  1: { 1: COLORS.purpleLight, 2: '#fff' },
  2: { 1: COLORS.blue, 2: '#fff' },
  3: { 1: COLORS.gold, 2: '#fff' },
  4: { 1: COLORS.white, 2: '#fff' },
  5: { 1: COLORS.gold, 2: '#fff' },
}
