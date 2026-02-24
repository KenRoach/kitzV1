import type { LevelDef } from './LevelData'
import { GROUND_Y, TILE_SIZE } from '../constants'

const T = TILE_SIZE

/** World 2: Market Square — Marketing & Social Media */
export const WORLD_2: LevelDef[] = [
  {
    id: 'w2-1', name: 'Followers & Foes', world: 2, levelNum: 1, width: 2600,
    platforms: [
      { x: 280, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 550, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 850, y: GROUND_Y - T * 4, w: T * 4, h: T },
      { x: 1150, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 1450, y: GROUND_Y - T * 3, w: T * 5, h: T },
      { x: 1800, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 2100, y: GROUND_Y - T * 4, w: T * 4, h: T },
    ],
    enemies: [
      { type: 'badReview', x: 350, y: 0 }, { type: 'spamBot', x: 600, y: GROUND_Y - T * 8 },
      { type: 'badReview', x: 900, y: 0 }, { type: 'badReview', x: 950, y: 0 },
      { type: 'spamBot', x: 1200, y: GROUND_Y - T * 9 }, { type: 'taxGremlin', x: 1500, y: 0 },
      { type: 'spamBot', x: 1850, y: GROUND_Y - T * 8 }, { type: 'badReview', x: 2150, y: 0 },
    ],
    coins: [
      { x: 300, y: GROUND_Y - T * 5 }, { x: 320, y: GROUND_Y - T * 5 },
      { x: 580, y: GROUND_Y - T * 7 }, { x: 600, y: GROUND_Y - T * 7 },
      { x: 900, y: GROUND_Y - T * 6 }, { x: 1500, y: GROUND_Y - T * 5 },
      { x: 1850, y: GROUND_Y - T * 7 }, { x: 2150, y: GROUND_Y - T * 6 },
    ],
    quizTriggers: [{ x: 1000, triggered: false }],
    finishX: 2500, groundColor: '#1E3A5F', bgColor: '#0B1628',
  },
  {
    id: 'w2-2', name: 'Content Wars', world: 2, levelNum: 2, width: 2900,
    platforms: [
      { x: 300, y: GROUND_Y - T * 4, w: T * 3, h: T },
      { x: 600, y: GROUND_Y - T * 6, w: T * 2, h: T },
      { x: 850, y: GROUND_Y - T * 3, w: T * 5, h: T },
      { x: 1200, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 1500, y: GROUND_Y - T * 4, w: T * 4, h: T },
      { x: 1850, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 2200, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 2550, y: GROUND_Y - T * 5, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'spamBot', x: 400, y: GROUND_Y - T * 7 }, { type: 'badReview', x: 700, y: 0 },
      { type: 'taxGremlin', x: 950, y: 0 }, { type: 'spamBot', x: 1250, y: GROUND_Y - T * 8 },
      { type: 'badReview', x: 1550, y: 0 }, { type: 'badReview', x: 1600, y: 0 },
      { type: 'taxGremlin', x: 1900, y: 0 }, { type: 'spamBot', x: 2250, y: GROUND_Y - T * 6 },
      { type: 'badReview', x: 2600, y: 0 },
    ],
    coins: [
      { x: 330, y: GROUND_Y - T * 6 }, { x: 620, y: GROUND_Y - T * 8 },
      { x: 900, y: GROUND_Y - T * 5 }, { x: 920, y: GROUND_Y - T * 5 },
      { x: 1550, y: GROUND_Y - T * 6 }, { x: 1900, y: GROUND_Y - T * 8 },
      { x: 2250, y: GROUND_Y - T * 5 }, { x: 2600, y: GROUND_Y - T * 7 },
    ],
    quizTriggers: [{ x: 1100, triggered: false }, { x: 2000, triggered: false }],
    finishX: 2800, groundColor: '#1E3A5F', bgColor: '#0B1628',
  },
  {
    id: 'w2-3', name: 'Viral Rush', world: 2, levelNum: 3, width: 3100,
    platforms: [
      { x: 250, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 550, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 900, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 1250, y: GROUND_Y - T * 4, w: T * 4, h: T },
      { x: 1600, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 1950, y: GROUND_Y - T * 3, w: T * 5, h: T },
      { x: 2350, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 2700, y: GROUND_Y - T * 4, w: T * 4, h: T },
    ],
    enemies: [
      { type: 'badReview', x: 350, y: 0 }, { type: 'badReview', x: 400, y: 0 },
      { type: 'spamBot', x: 650, y: GROUND_Y - T * 7 }, { type: 'taxGremlin', x: 1000, y: 0 },
      { type: 'spamBot', x: 1300, y: GROUND_Y - T * 8 }, { type: 'badReview', x: 1650, y: 0 },
      { type: 'taxGremlin', x: 2000, y: 0 }, { type: 'spamBot', x: 2400, y: GROUND_Y - T * 9 },
      { type: 'badReview', x: 2750, y: 0 }, { type: 'badReview', x: 2800, y: 0 },
    ],
    coins: [
      { x: 280, y: GROUND_Y - T * 7 }, { x: 600, y: GROUND_Y - T * 5 },
      { x: 950, y: GROUND_Y - T * 8 }, { x: 1300, y: GROUND_Y - T * 6 },
      { x: 1650, y: GROUND_Y - T * 7 }, { x: 2000, y: GROUND_Y - T * 5 },
      { x: 2400, y: GROUND_Y - T * 8 }, { x: 2750, y: GROUND_Y - T * 6 },
    ],
    quizTriggers: [{ x: 1100, triggered: false }, { x: 2200, triggered: false }],
    finishX: 3000, groundColor: '#1E3A5F', bgColor: '#0B1628',
  },
  {
    id: 'w2-4', name: 'Engagement Gauntlet', world: 2, levelNum: 4, width: 3300,
    platforms: [
      { x: 300, y: GROUND_Y - T * 4, w: T * 3, h: T },
      { x: 600, y: GROUND_Y - T * 6, w: T * 2, h: T },
      { x: 850, y: GROUND_Y - T * 3, w: T * 5, h: T },
      { x: 1200, y: GROUND_Y - T * 7, w: T * 3, h: T },
      { x: 1550, y: GROUND_Y - T * 4, w: T * 4, h: T },
      { x: 1900, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 2250, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 2600, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 2950, y: GROUND_Y - T * 4, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'spamBot', x: 400, y: GROUND_Y - T * 7 }, { type: 'badReview', x: 700, y: 0 },
      { type: 'taxGremlin', x: 950, y: 0 }, { type: 'spamBot', x: 1300, y: GROUND_Y - T * 10 },
      { type: 'badReview', x: 1600, y: 0 }, { type: 'badReview', x: 1650, y: 0 },
      { type: 'taxGremlin', x: 1950, y: 0 }, { type: 'spamBot', x: 2300, y: GROUND_Y - T * 6 },
      { type: 'badReview', x: 2650, y: 0 }, { type: 'taxGremlin', x: 3000, y: 0 },
    ],
    coins: [
      { x: 330, y: GROUND_Y - T * 6 }, { x: 650, y: GROUND_Y - T * 8 },
      { x: 900, y: GROUND_Y - T * 5 }, { x: 1250, y: GROUND_Y - T * 9 },
      { x: 1600, y: GROUND_Y - T * 6 }, { x: 1950, y: GROUND_Y - T * 7 },
      { x: 2300, y: GROUND_Y - T * 5 }, { x: 2650, y: GROUND_Y - T * 8 },
    ],
    quizTriggers: [{ x: 1100, triggered: false }, { x: 2400, triggered: false }],
    finishX: 3200, groundColor: '#1E3A5F', bgColor: '#0B1628',
  },
  {
    id: 'w2-5', name: 'Boss: The Algorithm', world: 2, levelNum: 5, width: 1800,
    platforms: [
      { x: 200, y: GROUND_Y - T * 4, w: T * 4, h: T },
      { x: 550, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 900, y: GROUND_Y - T * 3, w: T * 6, h: T },
      { x: 1300, y: GROUND_Y - T * 7, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'spamBot', x: 400, y: GROUND_Y - T * 8 },
      { type: 'badReview', x: 700, y: 0 }, { type: 'badReview', x: 1000, y: 0 },
    ],
    coins: [
      { x: 250, y: GROUND_Y - T * 6 }, { x: 600, y: GROUND_Y - T * 8 }, { x: 1000, y: GROUND_Y - T * 5 },
    ],
    quizTriggers: [],
    finishX: 1700, groundColor: '#1E3A5F', bgColor: '#0B1628',
  },
]
