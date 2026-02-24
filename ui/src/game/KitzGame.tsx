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
import { WORLD_4 } from './levels/World4'
import { WORLD_5 } from './levels/World5'

import { HUD } from './ui/HUD'
import { TouchControls } from './ui/TouchControls'
import { QuizOverlay } from './ui/QuizOverlay'
import { LevelSelect } from './ui/LevelSelect'
import { Leaderboard } from './ui/Leaderboard'
import { GameOverScreen } from './ui/GameOverScreen'
import { LevelCompleteScreen } from './ui/LevelCompleteScreen'

const ALL_LEVELS = [...WORLD_1, ...WORLD_2, ...WORLD_3, ...WORLD_4, ...WORLD_5]

function getRandomQuestion(): Question {
  const allQuestions = COURSES.flatMap((c) => c.questions)
  return allQuestions[Math.floor(Math.random() * allQuestions.length)]!
}

function saveLeaderboardEntry(score: number, world: number, level: number) {
  try {
    const raw = localStorage.getItem('kitz-run-leaderboard')
    const entries: { name: string; score: number; world: number; level: number; date: string }[] = raw
      ? JSON.parse(raw)
      : []
    entries.push({ name: 'Kitz', score, world, level, date: new Date().toISOString() })
    entries.sort((a, b) => b.score - a.score)
    localStorage.setItem('kitz-run-leaderboard', JSON.stringify(entries.slice(0, 20)))
  } catch { /* ignore */ }
}

export function KitzGame() {
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
        setQuizQuestion(getRandomQuestion())
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
    // Resize after canvas becomes visible, then load
    requestAnimationFrame(() => {
      gameRef.current?.resize()
      gameRef.current?.loadLevel(level, playerLevel)
    })
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
    gameRef.current?.loadLevel(currentLevel, playerLevel)
  }, [currentLevel, playerLevel])

  const handleQuit = useCallback(() => {
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

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#0D0D12]">
      {/* Canvas is always mounted so GameManager can initialize */}
      <canvas
        ref={canvasRef}
        className={gameState === 'menu' ? 'absolute opacity-0 pointer-events-none' : 'block'}
        style={{ imageRendering: 'pixelated' }}
      />

      {gameState === 'menu' && (
        showLeaderboard ? (
          <Leaderboard onBack={() => setShowLeaderboard(false)} />
        ) : (
          <LevelSelect
            onSelectLevel={handleSelectLevel}
            highScores={highScores}
            onShowLeaderboard={() => setShowLeaderboard(true)}
          />
        )
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
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 font-mono">
          <h2 className="text-2xl font-bold text-white">PAUSED</h2>
          <div className="mt-4 flex gap-3">
            <button onClick={handlePause} className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-bold text-white hover:bg-purple-500">
              Resume
            </button>
            <button onClick={handleQuit} className="rounded-lg bg-gray-700 px-6 py-2 text-sm font-bold text-white hover:bg-gray-600">
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
