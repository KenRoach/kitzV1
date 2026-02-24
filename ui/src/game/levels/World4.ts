import type { LevelDef } from './LevelData'
import { GROUND_Y, TILE_SIZE } from '../constants'

const T = TILE_SIZE

/** World 4: Tech Tower — Technology, cybersecurity, tools */
export const WORLD_4: LevelDef[] = [
  {
    id: 'w4-1', name: 'Server Room', world: 4, levelNum: 1, width: 2800,
    platforms: [
      { x: 300, y: GROUND_Y - T * 5, w: T * 3, h: T }, { x: 600, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 950, y: GROUND_Y - T * 6, w: T * 3, h: T }, { x: 1300, y: GROUND_Y - T * 4, w: T * 5, h: T },
      { x: 1700, y: GROUND_Y - T * 5, w: T * 3, h: T }, { x: 2050, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 2400, y: GROUND_Y - T * 6, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'spamBot', x: 400, y: GROUND_Y - T * 8 }, { type: 'badReview', x: 700, y: 0 },
      { type: 'spamBot', x: 1000, y: GROUND_Y - T * 9 }, { type: 'taxGremlin', x: 1400, y: 0 },
      { type: 'spamBot', x: 1750, y: GROUND_Y - T * 8 }, { type: 'badReview', x: 2100, y: 0 },
      { type: 'spamBot', x: 2450, y: GROUND_Y - T * 9 }, { type: 'taxGremlin', x: 2600, y: 0 },
    ],
    coins: [
      { x: 350, y: GROUND_Y - T * 7 }, { x: 650, y: GROUND_Y - T * 5 },
      { x: 1000, y: GROUND_Y - T * 8 }, { x: 1400, y: GROUND_Y - T * 6 },
      { x: 1750, y: GROUND_Y - T * 7 }, { x: 2100, y: GROUND_Y - T * 5 },
      { x: 2450, y: GROUND_Y - T * 8 },
    ],
    quizTriggers: [{ x: 1100, triggered: false }, { x: 2200, triggered: false }],
    finishX: 2700, groundColor: '#1A1A2E', bgColor: '#0A0A14',
  },
  {
    id: 'w4-2', name: 'Data Pipeline', world: 4, levelNum: 2, width: 3000,
    platforms: [
      { x: 250, y: GROUND_Y - T * 4, w: T * 4, h: T }, { x: 600, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 950, y: GROUND_Y - T * 3, w: T * 5, h: T }, { x: 1350, y: GROUND_Y - T * 7, w: T * 2, h: T },
      { x: 1600, y: GROUND_Y - T * 4, w: T * 4, h: T }, { x: 2000, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 2400, y: GROUND_Y - T * 3, w: T * 4, h: T }, { x: 2700, y: GROUND_Y - T * 6, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'spamBot', x: 350, y: GROUND_Y - T * 7 }, { type: 'spamBot', x: 700, y: GROUND_Y - T * 9 },
      { type: 'badReview', x: 1050, y: 0 }, { type: 'taxGremlin', x: 1400, y: 0 },
      { type: 'spamBot', x: 1700, y: GROUND_Y - T * 7 }, { type: 'badReview', x: 2050, y: 0 },
      { type: 'spamBot', x: 2450, y: GROUND_Y - T * 6 }, { type: 'taxGremlin', x: 2750, y: 0 },
    ],
    coins: [
      { x: 300, y: GROUND_Y - T * 6 }, { x: 650, y: GROUND_Y - T * 8 },
      { x: 1000, y: GROUND_Y - T * 5 }, { x: 1650, y: GROUND_Y - T * 6 },
      { x: 2050, y: GROUND_Y - T * 7 }, { x: 2450, y: GROUND_Y - T * 5 },
      { x: 2750, y: GROUND_Y - T * 8 },
    ],
    quizTriggers: [{ x: 1200, triggered: false }, { x: 2300, triggered: false }],
    finishX: 2900, groundColor: '#1A1A2E', bgColor: '#0A0A14',
  },
  {
    id: 'w4-3', name: 'Firewall Breach', world: 4, levelNum: 3, width: 3200,
    platforms: [
      { x: 200, y: GROUND_Y - T * 5, w: T * 3, h: T }, { x: 550, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 900, y: GROUND_Y - T * 7, w: T * 2, h: T }, { x: 1150, y: GROUND_Y - T * 4, w: T * 5, h: T },
      { x: 1600, y: GROUND_Y - T * 6, w: T * 3, h: T }, { x: 1950, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 2350, y: GROUND_Y - T * 5, w: T * 3, h: T }, { x: 2700, y: GROUND_Y - T * 4, w: T * 4, h: T },
    ],
    enemies: [
      { type: 'spamBot', x: 300, y: GROUND_Y - T * 8 }, { type: 'badReview', x: 650, y: 0 },
      { type: 'spamBot', x: 1000, y: GROUND_Y - T * 10 }, { type: 'taxGremlin', x: 1250, y: 0 },
      { type: 'spamBot', x: 1650, y: GROUND_Y - T * 9 }, { type: 'badReview', x: 2000, y: 0 },
      { type: 'spamBot', x: 2400, y: GROUND_Y - T * 8 }, { type: 'taxGremlin', x: 2750, y: 0 },
      { type: 'badReview', x: 2900, y: 0 },
    ],
    coins: [
      { x: 250, y: GROUND_Y - T * 7 }, { x: 600, y: GROUND_Y - T * 5 },
      { x: 1200, y: GROUND_Y - T * 6 }, { x: 1650, y: GROUND_Y - T * 8 },
      { x: 2000, y: GROUND_Y - T * 5 }, { x: 2400, y: GROUND_Y - T * 7 },
      { x: 2750, y: GROUND_Y - T * 6 },
    ],
    quizTriggers: [{ x: 1100, triggered: false }, { x: 2500, triggered: false }],
    finishX: 3100, groundColor: '#1A1A2E', bgColor: '#0A0A14',
  },
  {
    id: 'w4-4', name: 'Cloud Summit', world: 4, levelNum: 4, width: 3400,
    platforms: [
      { x: 300, y: GROUND_Y - T * 4, w: T * 4, h: T }, { x: 700, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 1050, y: GROUND_Y - T * 3, w: T * 5, h: T }, { x: 1450, y: GROUND_Y - T * 7, w: T * 2, h: T },
      { x: 1700, y: GROUND_Y - T * 4, w: T * 4, h: T }, { x: 2100, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 2500, y: GROUND_Y - T * 3, w: T * 4, h: T }, { x: 2900, y: GROUND_Y - T * 6, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'spamBot', x: 400, y: GROUND_Y - T * 7 }, { type: 'spamBot', x: 800, y: GROUND_Y - T * 9 },
      { type: 'taxGremlin', x: 1150, y: 0 }, { type: 'badReview', x: 1500, y: 0 },
      { type: 'spamBot', x: 1800, y: GROUND_Y - T * 7 }, { type: 'taxGremlin', x: 2150, y: 0 },
      { type: 'spamBot', x: 2550, y: GROUND_Y - T * 6 }, { type: 'badReview', x: 2950, y: 0 },
      { type: 'spamBot', x: 3100, y: GROUND_Y - T * 8 },
    ],
    coins: [
      { x: 350, y: GROUND_Y - T * 6 }, { x: 750, y: GROUND_Y - T * 8 },
      { x: 1100, y: GROUND_Y - T * 5 }, { x: 1750, y: GROUND_Y - T * 6 },
      { x: 2150, y: GROUND_Y - T * 7 }, { x: 2550, y: GROUND_Y - T * 5 },
      { x: 2950, y: GROUND_Y - T * 8 },
    ],
    quizTriggers: [{ x: 1300, triggered: false }, { x: 2600, triggered: false }],
    finishX: 3300, groundColor: '#1A1A2E', bgColor: '#0A0A14',
  },
  {
    id: 'w4-5', name: 'Boss: The Hacker', world: 4, levelNum: 5, width: 1800,
    platforms: [
      { x: 200, y: GROUND_Y - T * 5, w: T * 4, h: T }, { x: 600, y: GROUND_Y - T * 3, w: T * 3, h: T },
      { x: 1000, y: GROUND_Y - T * 6, w: T * 5, h: T }, { x: 1400, y: GROUND_Y - T * 4, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'spamBot', x: 400, y: GROUND_Y - T * 8 }, { type: 'spamBot', x: 800, y: GROUND_Y - T * 9 },
    ],
    coins: [
      { x: 250, y: GROUND_Y - T * 7 }, { x: 650, y: GROUND_Y - T * 5 }, { x: 1050, y: GROUND_Y - T * 8 },
    ],
    quizTriggers: [],
    finishX: 1700, groundColor: '#1A1A2E', bgColor: '#0A0A14',
  },
]
