import type { LevelDef } from './LevelData'
import { GROUND_Y, TILE_SIZE } from '../constants'

const T = TILE_SIZE

/** World 3: Finance Fortress — Money management, taxes, payments */
export const WORLD_3: LevelDef[] = [
  {
    id: 'w3-1', name: 'Cash Flow Canyon', world: 3, levelNum: 1, width: 2800,
    platforms: [
      { x: 300, y: GROUND_Y - T * 4, w: T * 4, h: T },
      { x: 600, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 950, y: GROUND_Y - T * 3, w: T * 5, h: T },
      { x: 1300, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 1650, y: GROUND_Y - T * 4, w: T * 4, h: T },
      { x: 2000, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 2350, y: GROUND_Y - T * 3, w: T * 4, h: T },
    ],
    enemies: [
      { type: 'taxGremlin', x: 400, y: 0 }, { type: 'badReview', x: 700, y: 0 },
      { type: 'taxGremlin', x: 1000, y: 0 }, { type: 'spamBot', x: 1350, y: GROUND_Y - T * 8 },
      { type: 'taxGremlin', x: 1700, y: 0 }, { type: 'badReview', x: 2050, y: 0 },
      { type: 'taxGremlin', x: 2400, y: 0 }, { type: 'spamBot', x: 2500, y: GROUND_Y - T * 7 },
    ],
    coins: [
      { x: 330, y: GROUND_Y - T * 6 }, { x: 350, y: GROUND_Y - T * 6 },
      { x: 650, y: GROUND_Y - T * 8 }, { x: 1000, y: GROUND_Y - T * 5 },
      { x: 1700, y: GROUND_Y - T * 6 }, { x: 2050, y: GROUND_Y - T * 8 },
      { x: 2400, y: GROUND_Y - T * 5 },
    ],
    quizTriggers: [{ x: 1100, triggered: false }, { x: 2100, triggered: false }],
    finishX: 2700, groundColor: '#2D1B00', bgColor: '#0D0800',
  },
  {
    id: 'w3-2', name: 'Invoice Alley', world: 3, levelNum: 2, width: 3000,
    platforms: [
      { x: 250, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 550, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 900, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 1250, y: GROUND_Y - T * 4, w: T * 5, h: T },
      { x: 1650, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 2000, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 2400, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 2700, y: GROUND_Y - T * 4, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'taxGremlin', x: 350, y: 0 }, { type: 'spamBot', x: 650, y: GROUND_Y - T * 7 },
      { type: 'taxGremlin', x: 1000, y: 0 }, { type: 'badReview', x: 1300, y: 0 },
      { type: 'taxGremlin', x: 1700, y: 0 }, { type: 'spamBot', x: 2050, y: GROUND_Y - T * 6 },
      { type: 'badReview', x: 2450, y: 0 }, { type: 'taxGremlin', x: 2750, y: 0 },
    ],
    coins: [
      { x: 280, y: GROUND_Y - T * 7 }, { x: 600, y: GROUND_Y - T * 5 },
      { x: 950, y: GROUND_Y - T * 8 }, { x: 1300, y: GROUND_Y - T * 6 },
      { x: 1700, y: GROUND_Y - T * 7 }, { x: 2050, y: GROUND_Y - T * 5 },
      { x: 2450, y: GROUND_Y - T * 8 }, { x: 2750, y: GROUND_Y - T * 6 },
    ],
    quizTriggers: [{ x: 1100, triggered: false }, { x: 2200, triggered: false }],
    finishX: 2900, groundColor: '#2D1B00', bgColor: '#0D0800',
  },
  {
    id: 'w3-3', name: 'Tax Season', world: 3, levelNum: 3, width: 3200,
    platforms: [
      { x: 200, y: GROUND_Y - T * 4, w: T * 4, h: T }, { x: 550, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 900, y: GROUND_Y - T * 3, w: T * 5, h: T }, { x: 1300, y: GROUND_Y - T * 7, w: T * 2, h: T },
      { x: 1550, y: GROUND_Y - T * 4, w: T * 4, h: T }, { x: 1950, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 2300, y: GROUND_Y - T * 3, w: T * 4, h: T }, { x: 2700, y: GROUND_Y - T * 6, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'taxGremlin', x: 300, y: 0 }, { type: 'taxGremlin', x: 500, y: 0 },
      { type: 'spamBot', x: 700, y: GROUND_Y - T * 9 }, { type: 'badReview', x: 1000, y: 0 },
      { type: 'taxGremlin', x: 1400, y: 0 }, { type: 'spamBot', x: 1600, y: GROUND_Y - T * 7 },
      { type: 'taxGremlin', x: 2000, y: 0 }, { type: 'badReview', x: 2350, y: 0 },
      { type: 'taxGremlin', x: 2750, y: 0 }, { type: 'spamBot', x: 2900, y: GROUND_Y - T * 8 },
    ],
    coins: [
      { x: 250, y: GROUND_Y - T * 6 }, { x: 600, y: GROUND_Y - T * 8 },
      { x: 950, y: GROUND_Y - T * 5 }, { x: 1350, y: GROUND_Y - T * 9 },
      { x: 1600, y: GROUND_Y - T * 6 }, { x: 2000, y: GROUND_Y - T * 7 },
      { x: 2350, y: GROUND_Y - T * 5 }, { x: 2750, y: GROUND_Y - T * 8 },
    ],
    quizTriggers: [{ x: 1100, triggered: false }, { x: 2400, triggered: false }],
    finishX: 3100, groundColor: '#2D1B00', bgColor: '#0D0800',
  },
  {
    id: 'w3-4', name: 'Profit Peaks', world: 3, levelNum: 4, width: 3400,
    platforms: [
      { x: 300, y: GROUND_Y - T * 5, w: T * 3, h: T }, { x: 650, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 1000, y: GROUND_Y - T * 7, w: T * 2, h: T }, { x: 1250, y: GROUND_Y - T * 4, w: T * 5, h: T },
      { x: 1650, y: GROUND_Y - T * 6, w: T * 3, h: T }, { x: 2000, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 2400, y: GROUND_Y - T * 5, w: T * 3, h: T }, { x: 2750, y: GROUND_Y - T * 4, w: T * 4, h: T },
      { x: 3100, y: GROUND_Y - T * 3, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'taxGremlin', x: 400, y: 0 }, { type: 'spamBot', x: 750, y: GROUND_Y - T * 6 },
      { type: 'badReview', x: 1100, y: 0 }, { type: 'taxGremlin', x: 1350, y: 0 },
      { type: 'spamBot', x: 1700, y: GROUND_Y - T * 9 }, { type: 'badReview', x: 2050, y: 0 },
      { type: 'taxGremlin', x: 2450, y: 0 }, { type: 'spamBot', x: 2800, y: GROUND_Y - T * 7 },
      { type: 'badReview', x: 3150, y: 0 }, { type: 'taxGremlin', x: 3200, y: 0 },
    ],
    coins: [
      { x: 350, y: GROUND_Y - T * 7 }, { x: 700, y: GROUND_Y - T * 5 },
      { x: 1050, y: GROUND_Y - T * 9 }, { x: 1700, y: GROUND_Y - T * 8 },
      { x: 2050, y: GROUND_Y - T * 5 }, { x: 2450, y: GROUND_Y - T * 7 },
      { x: 2800, y: GROUND_Y - T * 6 }, { x: 3150, y: GROUND_Y - T * 5 },
    ],
    quizTriggers: [{ x: 1200, triggered: false }, { x: 2600, triggered: false }],
    finishX: 3300, groundColor: '#2D1B00', bgColor: '#0D0800',
  },
  {
    id: 'w3-5', name: 'Boss: The Debt Collector', world: 3, levelNum: 5, width: 1800,
    platforms: [
      { x: 200, y: GROUND_Y - T * 4, w: T * 4, h: T }, { x: 600, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 1000, y: GROUND_Y - T * 3, w: T * 6, h: T }, { x: 1400, y: GROUND_Y - T * 7, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'taxGremlin', x: 400, y: 0 }, { type: 'taxGremlin', x: 800, y: 0 },
    ],
    coins: [
      { x: 250, y: GROUND_Y - T * 6 }, { x: 650, y: GROUND_Y - T * 8 }, { x: 1050, y: GROUND_Y - T * 5 },
    ],
    quizTriggers: [],
    finishX: 1700, groundColor: '#2D1B00', bgColor: '#0D0800',
  },
]
