import { create } from 'zustand'

const STORAGE_KEY = 'kitz-game-progress'

const XP_PER_CORRECT = 50
const XP_COURSE_BONUS = 200

interface GameState {
  xp: number
  level: number
  completedQuestions: Record<string, string[]>
  completedCourses: string[]
  currentCourseId: string | null
  currentQuestionIndex: number

  startCourse: (courseId: string) => void
  answerQuestion: (courseId: string, questionId: string, correct: boolean) => void
  completeCourse: (courseId: string) => void
  nextQuestion: () => void
  resetCourse: () => void
  addXP: (amount: number) => void
}

function loadProgress(): Partial<GameState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function saveProgress(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      xp: state.xp,
      level: state.level,
      completedQuestions: state.completedQuestions,
      completedCourses: state.completedCourses,
    }))
  } catch { /* ignore */ }
}

const saved = loadProgress()

export const useGameStore = create<GameState>((set, get) => ({
  xp: saved.xp ?? 0,
  level: saved.level ?? 1,
  completedQuestions: saved.completedQuestions ?? {},
  completedCourses: saved.completedCourses ?? [],
  currentCourseId: null,
  currentQuestionIndex: 0,

  startCourse: (courseId) => set({ currentCourseId: courseId, currentQuestionIndex: 0 }),

  answerQuestion: (courseId, questionId, correct) => {
    if (!correct) return
    const state = get()
    const prev = state.completedQuestions[courseId] ?? []
    if (prev.includes(questionId)) return
    const updated = {
      ...state.completedQuestions,
      [courseId]: [...prev, questionId],
    }
    const newXP = state.xp + XP_PER_CORRECT
    set({ completedQuestions: updated, xp: newXP })
    saveProgress({ ...get(), completedQuestions: updated, xp: newXP })
  },

  completeCourse: (courseId) => {
    const state = get()
    if (state.completedCourses.includes(courseId)) return
    const courses = [...state.completedCourses, courseId]
    const newLevel = Math.min(5, state.level + 1)
    const newXP = state.xp + XP_COURSE_BONUS
    set({ completedCourses: courses, level: newLevel, xp: newXP, currentCourseId: null, currentQuestionIndex: 0 })
    saveProgress({ ...get(), completedCourses: courses, level: newLevel, xp: newXP })
  },

  nextQuestion: () => set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1 })),

  resetCourse: () => set({ currentCourseId: null, currentQuestionIndex: 0 }),

  addXP: (amount) => {
    const newXP = get().xp + amount
    set({ xp: newXP })
    saveProgress({ ...get(), xp: newXP })
  },
}))
