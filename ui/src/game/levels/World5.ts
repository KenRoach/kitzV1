import type { LevelDef } from './LevelData'
import { GROUND_Y, TILE_SIZE } from '../constants'

const T = TILE_SIZE

/** World 5: Empire Summit — Scaling, competition, leadership */
export const WORLD_5: LevelDef[] = [
  {
    id: 'w5-1', name: 'Growth Corridor', world: 5, levelNum: 1, width: 3000,
    platforms: [
      { x: 300, y: GROUND_Y - T * 4, w: T * 4, h: T }, { x: 650, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 1000, y: GROUND_Y - T * 3, w: T * 5, h: T }, { x: 1400, y: GROUND_Y - T * 7, w: T * 2, h: T },
      { x: 1650, y: GROUND_Y - T * 4, w: T * 4, h: T }, { x: 2050, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 2400, y: GROUND_Y - T * 3, w: T * 4, h: T }, { x: 2700, y: GROUND_Y - T * 6, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'badReview', x: 400, y: 0 }, { type: 'spamBot', x: 700, y: GROUND_Y - T * 9 },
      { type: 'taxGremlin', x: 1100, y: 0 }, { type: 'badReview', x: 1450, y: 0 },
      { type: 'spamBot', x: 1750, y: GROUND_Y - T * 7 }, { type: 'taxGremlin', x: 2100, y: 0 },
      { type: 'badReview', x: 2450, y: 0 }, { type: 'spamBot', x: 2750, y: GROUND_Y - T * 9 },
      { type: 'taxGremlin', x: 2850, y: 0 },
    ],
    coins: [
      { x: 350, y: GROUND_Y - T * 6 }, { x: 700, y: GROUND_Y - T * 8 },
      { x: 1050, y: GROUND_Y - T * 5 }, { x: 1700, y: GROUND_Y - T * 6 },
      { x: 2100, y: GROUND_Y - T * 7 }, { x: 2450, y: GROUND_Y - T * 5 },
      { x: 2750, y: GROUND_Y - T * 8 },
    ],
    quizTriggers: [{ x: 1200, triggered: false }, { x: 2300, triggered: false }],
    finishX: 2900, groundColor: '#1C1C1C', bgColor: '#050505',
  },
  {
    id: 'w5-2', name: 'Scale or Fail', world: 5, levelNum: 2, width: 3200,
    platforms: [
      { x: 250, y: GROUND_Y - T * 5, w: T * 3, h: T }, { x: 600, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 950, y: GROUND_Y - T * 7, w: T * 2, h: T }, { x: 1200, y: GROUND_Y - T * 4, w: T * 5, h: T },
      { x: 1650, y: GROUND_Y - T * 6, w: T * 3, h: T }, { x: 2000, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 2400, y: GROUND_Y - T * 5, w: T * 3, h: T }, { x: 2750, y: GROUND_Y - T * 4, w: T * 4, h: T },
    ],
    enemies: [
      { type: 'spamBot', x: 350, y: GROUND_Y - T * 8 }, { type: 'taxGremlin', x: 700, y: 0 },
      { type: 'badReview', x: 1050, y: 0 }, { type: 'spamBot', x: 1300, y: GROUND_Y - T * 7 },
      { type: 'taxGremlin', x: 1700, y: 0 }, { type: 'badReview', x: 2050, y: 0 },
      { type: 'spamBot', x: 2450, y: GROUND_Y - T * 8 }, { type: 'taxGremlin', x: 2800, y: 0 },
      { type: 'badReview', x: 2950, y: 0 }, { type: 'badReview', x: 3000, y: 0 },
    ],
    coins: [
      { x: 300, y: GROUND_Y - T * 7 }, { x: 650, y: GROUND_Y - T * 5 },
      { x: 1250, y: GROUND_Y - T * 6 }, { x: 1700, y: GROUND_Y - T * 8 },
      { x: 2050, y: GROUND_Y - T * 5 }, { x: 2450, y: GROUND_Y - T * 7 },
      { x: 2800, y: GROUND_Y - T * 6 },
    ],
    quizTriggers: [{ x: 1100, triggered: false }, { x: 2500, triggered: false }],
    finishX: 3100, groundColor: '#1C1C1C', bgColor: '#050505',
  },
  {
    id: 'w5-3', name: 'Team Assembly', world: 5, levelNum: 3, width: 3400,
    platforms: [
      { x: 200, y: GROUND_Y - T * 4, w: T * 4, h: T }, { x: 600, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 950, y: GROUND_Y - T * 3, w: T * 5, h: T }, { x: 1400, y: GROUND_Y - T * 7, w: T * 2, h: T },
      { x: 1650, y: GROUND_Y - T * 4, w: T * 4, h: T }, { x: 2100, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 2500, y: GROUND_Y - T * 3, w: T * 4, h: T }, { x: 2900, y: GROUND_Y - T * 6, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'taxGremlin', x: 300, y: 0 }, { type: 'spamBot', x: 700, y: GROUND_Y - T * 9 },
      { type: 'badReview', x: 1050, y: 0 }, { type: 'badReview', x: 1100, y: 0 },
      { type: 'taxGremlin', x: 1500, y: 0 }, { type: 'spamBot', x: 1750, y: GROUND_Y - T * 7 },
      { type: 'badReview', x: 2150, y: 0 }, { type: 'taxGremlin', x: 2550, y: 0 },
      { type: 'spamBot', x: 2950, y: GROUND_Y - T * 9 }, { type: 'badReview', x: 3100, y: 0 },
    ],
    coins: [
      { x: 250, y: GROUND_Y - T * 6 }, { x: 650, y: GROUND_Y - T * 8 },
      { x: 1000, y: GROUND_Y - T * 5 }, { x: 1700, y: GROUND_Y - T * 6 },
      { x: 2150, y: GROUND_Y - T * 7 }, { x: 2550, y: GROUND_Y - T * 5 },
      { x: 2950, y: GROUND_Y - T * 8 },
    ],
    quizTriggers: [{ x: 1200, triggered: false }, { x: 2600, triggered: false }],
    finishX: 3300, groundColor: '#1C1C1C', bgColor: '#050505',
  },
  {
    id: 'w5-4', name: 'Infrastructure Mode', world: 5, levelNum: 4, width: 3600,
    platforms: [
      { x: 300, y: GROUND_Y - T * 5, w: T * 3, h: T }, { x: 700, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 1100, y: GROUND_Y - T * 7, w: T * 2, h: T }, { x: 1350, y: GROUND_Y - T * 4, w: T * 5, h: T },
      { x: 1800, y: GROUND_Y - T * 6, w: T * 3, h: T }, { x: 2200, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 2600, y: GROUND_Y - T * 5, w: T * 3, h: T }, { x: 3000, y: GROUND_Y - T * 4, w: T * 4, h: T },
    ],
    enemies: [
      { type: 'spamBot', x: 400, y: GROUND_Y - T * 8 }, { type: 'taxGremlin', x: 800, y: 0 },
      { type: 'badReview', x: 1200, y: 0 }, { type: 'spamBot', x: 1450, y: GROUND_Y - T * 7 },
      { type: 'taxGremlin', x: 1850, y: 0 }, { type: 'badReview', x: 2250, y: 0 },
      { type: 'spamBot', x: 2650, y: GROUND_Y - T * 8 }, { type: 'taxGremlin', x: 3050, y: 0 },
      { type: 'badReview', x: 3200, y: 0 }, { type: 'spamBot', x: 3350, y: GROUND_Y - T * 7 },
    ],
    coins: [
      { x: 350, y: GROUND_Y - T * 7 }, { x: 750, y: GROUND_Y - T * 5 },
      { x: 1400, y: GROUND_Y - T * 6 }, { x: 1850, y: GROUND_Y - T * 8 },
      { x: 2250, y: GROUND_Y - T * 5 }, { x: 2650, y: GROUND_Y - T * 7 },
      { x: 3050, y: GROUND_Y - T * 6 },
    ],
    quizTriggers: [{ x: 1300, triggered: false }, { x: 2800, triggered: false }],
    finishX: 3500, groundColor: '#1C1C1C', bgColor: '#050505',
  },
  {
    id: 'w5-5', name: 'Boss: Competition Corp', world: 5, levelNum: 5, width: 2000,
    platforms: [
      { x: 200, y: GROUND_Y - T * 4, w: T * 4, h: T }, { x: 600, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 1000, y: GROUND_Y - T * 3, w: T * 6, h: T }, { x: 1500, y: GROUND_Y - T * 7, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'spamBot', x: 400, y: GROUND_Y - T * 8 }, { type: 'taxGremlin', x: 700, y: 0 },
      { type: 'badReview', x: 1100, y: 0 }, { type: 'badReview', x: 1200, y: 0 },
    ],
    coins: [
      { x: 250, y: GROUND_Y - T * 6 }, { x: 650, y: GROUND_Y - T * 8 },
      { x: 1050, y: GROUND_Y - T * 5 }, { x: 1550, y: GROUND_Y - T * 9 },
    ],
    quizTriggers: [],
    finishX: 1900, groundColor: '#1C1C1C', bgColor: '#050505',
  },
]
