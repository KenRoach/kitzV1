import type { EnemyType } from '../entities/Enemy'

export interface Platform {
  x: number
  y: number
  w: number
  h: number
}

export interface EnemySpawn {
  type: EnemyType
  x: number
  y: number
}

export interface CoinSpawn {
  x: number
  y: number
}

export interface QuizTrigger {
  x: number
  triggered: boolean
}

export interface LevelDef {
  id: string
  name: string
  world: number
  levelNum: number
  width: number
  platforms: Platform[]
  enemies: EnemySpawn[]
  coins: CoinSpawn[]
  quizTriggers: QuizTrigger[]
  finishX: number
  groundColor: string
  bgColor: string
}
