import { useRef, useEffect, useState, useCallback } from 'react'
import { GameManager } from './GameManager'
import { useGameStore } from '@/stores/gameStore'
import { COURSES } from '@/content/courses'
import type { Question } from '@/content/courses'
import type { LevelDef } from './levels/LevelData'
import type { GameState } from './constants'
import { PLAYER_MAX_HP, PLAYER_MAX_LIVES } from './constants'
import { WORLD_1 } from './levels/World1'
import { WORLD_2 } from './levels/World2'
import { WORLD_3 } from './levels/World3'

import { HUD } from './ui/HUD'
import { TouchControls } from './ui/TouchControls'
import { QuizOverlay } from './ui/QuizOverlay'
import { LevelSelect } from './ui/LevelSelect'
import { Leaderboard } from './ui/Leaderboard'
import { GameOverScreen } from './ui/GameOverScreen'
import { LevelCompleteScreen } from './ui/LevelCompleteScreen'

// 3 games, 3 levels each = 9 total levels
const ALL_LEVELS = [
  ...WORLD_1.slice(0, 3),
  ...WORLD_2.slice(0, 3),
  ...WORLD_3.slice(0, 3),
]

/**
 * Map each game (world) to specific business courses:
 * Game 1 "The Startup" → Intro to Business
 * Game 2 "Growth Mode" → Social Media Marketing + SMB Tech Stack
 * Game 3 "Scale Up"    → Business Management Systems
 */
const WORLD_COURSES: Record<number, string[]> = {
  1: ['intro-to-business'],
  2: ['social-media-marketing', 'smb-tech-stack'],
  3: ['business-management'],
}

function getQuestionForWorld(worldNum: number): Question {
  const courseIds = WORLD_COURSES[worldNum] ?? []
  const pool = COURSES
    .filter((c) => courseIds.includes(c.id))
    .flatMap((c) => c.questions)

  // fallback to all questions if no match
  const questions = pool.length > 0 ? pool : COURSES.flatMap((c) => c.questions)
  return questions[Math.floor(Math.random() * questions.length)]!
}

function saveLeaderboardEntry(score: number, world: number, level: number) {
  try {
    const raw = localStorage.getItem('kitz-run-leaderboard')
    const entries: { name: string; score: number; world: number; level: number; date: string }[] = raw
      ? JSON.parse(raw)
      : []
    entries.push({ name: 'Founder', score, world, level, date: new Date().toISOString() })
    entries.sort((a, b) => b.score - a.score)
    localStorage.setItem('kitz-run-leaderboard', JSON.stringify(entries.slice(0, 20)))
  } catch { /* ignore */ }
}

export function KitzGame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameManager | null>(null)
  const addXP = useGameStore((s) => s.addXP)
  const playerLevel = useGameStore((s) => s.level)

  const [gameState, setGameState] = useState<GameState>('menu')
  const [score, setScore] = useState(0)
  const [hp, setHp] = useState(PLAYER_MAX_HP)
  const [lives, setLives] = useState(PLAYER_MAX_LIVES)
  const [currentLevel, setCurrentLevel] = useState<LevelDef | null>(null)
  const [quizQuestion, setQuizQuestion] = useState<Question | null>(null)
  const [xpEarned, setXpEarned] = useState(0)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [highScores, setHighScores] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem('kitz-run-scores')
      return raw ? JSON.parse(raw) as Record<string, number> : {}
    } catch { return {} }
  })

  const currentLevelRef = useRef(currentLevel)
  currentLevelRef.current = currentLevel

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gm = new GameManager(canvas, {
      onScoreChange: setScore,
      onHpChange: setHp,
      onLivesChange: setLives,
      onStateChange: setGameState,
      onQuizTrigger: () => {
        const lvl = currentLevelRef.current
        setQuizQuestion(getQuestionForWorld(lvl?.world ?? 1))
      },
      onLevelComplete: (xp) => {
        setXpEarned(xp)
        addXP(xp)
        const lvl = currentLevelRef.current
        if (lvl) saveLeaderboardEntry(xp, lvl.world, lvl.levelNum)
      },
      onGameOver: (finalScore) => {
        const lvl = currentLevelRef.current
        if (lvl) {
          saveLeaderboardEntry(finalScore, lvl.world, lvl.levelNum)
          setHighScores((prev) => {
            const updated = { ...prev }
            const existing = updated[lvl.id]
            if (!existing || finalScore > existing) {
              updated[lvl.id] = finalScore
            }
            try { localStorage.setItem('kitz-run-scores', JSON.stringify(updated)) } catch { /* ignore */ }
            return updated
          })
        }
      },
    })

    gm.start()
    gameRef.current = gm

    const handleResize = () => gm.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      gm.destroy()
      window.removeEventListener('resize', handleResize)
    }
  }, [addXP])

  const handleSelectLevel = useCallback((level: LevelDef) => {
    setCurrentLevel(level)
    setScore(0)
    setHp(PLAYER_MAX_HP)
    setLives(PLAYER_MAX_LIVES)
    setShowLeaderboard(false)
    setTimeout(() => {
      gameRef.current?.resize()
      gameRef.current?.loadLevel(level, playerLevel)
    }, 50)
  }, [playerLevel])

  const handleQuizAnswer = useCallback((correct: boolean) => {
    setQuizQuestion(null)
    gameRef.current?.answerQuiz(correct)
  }, [])

  const handlePause = useCallback(() => {
    const gm = gameRef.current
    if (!gm) return
    if (gm.state === 'playing') gm.pauseGame()
    else if (gm.state === 'paused') gm.resumeGame()
  }, [])

  const handleTouchAction = useCallback(
    (action: 'left' | 'right' | 'jump' | 'shoot' | 'special', pressed: boolean) => {
      gameRef.current?.touchAction(action, pressed)
    }, [],
  )

  const handleRetry = useCallback(() => {
    if (!currentLevel) return
    setScore(0)
    setHp(PLAYER_MAX_HP)
    setLives(PLAYER_MAX_LIVES)
    gameRef.current?.resize()
    gameRef.current?.loadLevel(currentLevel, playerLevel)
  }, [currentLevel, playerLevel])

  const handleQuit = useCallback(() => {
    gameRef.current?.pauseGame()
    setGameState('menu')
    setCurrentLevel(null)
  }, [])

  const handleNextLevel = useCallback(() => {
    if (!currentLevel) return
    const idx = ALL_LEVELS.findIndex((l) => l.id === currentLevel.id)
    const next = ALL_LEVELS[idx + 1]
    if (next) {
      handleSelectLevel(next)
    } else {
      handleQuit()
    }
  }, [currentLevel, handleSelectLevel, handleQuit])

  const isPlaying = gameState !== 'menu'

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#0D0D12]">
      <div className="flex h-full w-full items-center justify-center">
        <canvas
          ref={canvasRef}
          style={{ imageRendering: 'pixelated', display: isPlaying ? 'block' : 'none' }}
        />
      </div>

      {gameState === 'menu' && (
        <div className="absolute inset-0 z-40 overflow-y-auto">
          {showLeaderboard ? (
            <Leaderboard onBack={() => setShowLeaderboard(false)} />
          ) : (
            <LevelSelect
              onSelectLevel={handleSelectLevel}
              highScores={highScores}
              onShowLeaderboard={() => setShowLeaderboard(true)}
            />
          )}
        </div>
      )}

      {currentLevel && gameState === 'playing' && (
        <HUD
          score={score}
          hp={hp}
          maxHp={PLAYER_MAX_HP}
          lives={lives}
          levelName={currentLevel.name}
          worldNum={currentLevel.world}
        />
      )}

      {gameState === 'playing' && (
        <TouchControls onAction={handleTouchAction} onPause={handlePause} />
      )}

      {gameState === 'paused' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ fontFamily: '"Press Start 2P", "Courier New", monospace', background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #000000cc 100%)' }}>
          <h2 className="text-3xl font-bold tracking-widest text-white" style={{ textShadow: '0 0 30px #A855F7, 0 0 60px #7C3AED' }}>PAUSED</h2>
          <div className="mt-8 flex gap-4">
            <button
              onClick={handlePause}
              className="px-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95"
              style={{ color: '#A855F7', background: 'linear-gradient(180deg, #2d1b4e 0%, #1a0a2e 100%)', border: '2px solid #A855F780', boxShadow: '0 0 15px #A855F720', textShadow: '0 0 10px #A855F780' }}
            >
              Resume
            </button>
            <button
              onClick={handleQuit}
              className="px-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95"
              style={{ color: '#94a3b8', background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)', border: '2px solid #33335580', boxShadow: '0 0 10px #33335520' }}
            >
              Quit
            </button>
          </div>
        </div>
      )}

      {gameState === 'quiz' && quizQuestion && (
        <QuizOverlay question={quizQuestion} onAnswer={handleQuizAnswer} />
      )}

      {gameState === 'levelComplete' && currentLevel && (
        <LevelCompleteScreen
          levelName={currentLevel.name}
          score={score}
          xpEarned={xpEarned}
          onNextLevel={handleNextLevel}
          onQuit={handleQuit}
        />
      )}

      {gameState === 'gameOver' && (
        <GameOverScreen score={score} onRetry={handleRetry} onQuit={handleQuit} />
      )}
    </div>
  )
}
