# Kitz Educational Game — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the Kitz character into an educational game inside the workspace UI where solopreneurs learn about business, BMS, tech stacks, and social media marketing through quizzes and scenarios. Kitz visually powers up (DBZ-style aura stacking) as users complete modules.

**Architecture:** Add a "Learn" nav item to the existing React SPA (`ui/`). The game has 4 course modules, each with 6 quiz/scenario questions. A Zustand store tracks XP, level, and progress (persisted to localStorage). The existing `Orb.tsx` component gets an optional `level` prop that adds stacking aura rings and particle effects. No backend changes needed for MVP.

**Tech Stack:** React 19, Zustand, Tailwind CSS, localStorage (existing stack — zero new dependencies)

---

### Task 1: Create the course content data file

**Files:**
- Create: `ui/src/data/courses.ts`

**Step 1: Create the course data**

This file holds all 4 courses and their questions. Each question is either a "quiz" (pick the right answer) or a "scenario" (what would you do?). Keep language simple — the audience is small business owners, not developers.

```typescript
export interface Question {
  id: string
  type: 'quiz' | 'scenario'
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface Course {
  id: string
  title: string
  description: string
  icon: string
  color: string
  questions: Question[]
}

export const COURSES: Course[] = [
  {
    id: 'intro-to-business',
    title: 'Intro to Business',
    description: 'Learn the basics of starting and running a small business',
    icon: '🏪',
    color: '#A855F7',
    questions: [
      {
        id: 'ib-1',
        type: 'quiz',
        question: 'What is the main purpose of a business plan?',
        options: [
          'To impress investors with big words',
          'To map out your goals, strategy, and how you will make money',
          'To get a tax break from the government',
          'To register your business name',
        ],
        correctIndex: 1,
        explanation: 'A business plan is your roadmap. It helps you think through your idea, figure out your customers, and plan how you will actually make money.',
      },
      {
        id: 'ib-2',
        type: 'scenario',
        question: 'A friend wants to start a food delivery business but has no savings. What should they do first?',
        options: [
          'Take out a big loan and go all in',
          'Start small — deliver from home, use their own car, test with 10 customers first',
          'Wait until they save $50,000',
          'Buy a food truck immediately',
        ],
        correctIndex: 1,
        explanation: 'Start small, test your idea with real customers, and grow from there. You do not need a lot of money to validate a business idea.',
      },
      {
        id: 'ib-3',
        type: 'quiz',
        question: 'What does "revenue" mean?',
        options: [
          'The profit you keep after expenses',
          'The total money your business brings in before expenses',
          'The money you owe to suppliers',
          'Your business savings account balance',
        ],
        correctIndex: 1,
        explanation: 'Revenue is all the money coming in. Profit is what is left after you pay your costs. A business can have high revenue but low profit if costs are too high.',
      },
      {
        id: 'ib-4',
        type: 'scenario',
        question: 'You sell handmade candles for $15 each. Your materials cost $5 per candle. You sold 100 candles this month. What is your gross profit?',
        options: [
          '$1,500',
          '$500',
          '$1,000',
          '$1,500 minus rent and other costs',
        ],
        correctIndex: 2,
        explanation: 'Gross profit = Revenue ($1,500) minus cost of goods ($500) = $1,000. This does not include rent, marketing, or other overhead — that would be net profit.',
      },
      {
        id: 'ib-5',
        type: 'quiz',
        question: 'What is a "target market"?',
        options: [
          'Everyone in your city',
          'The specific group of people most likely to buy your product',
          'The store where you sell your products',
          'Your competitors',
        ],
        correctIndex: 1,
        explanation: 'Your target market is the specific group of people you are trying to reach. Trying to sell to everyone means you connect with no one.',
      },
      {
        id: 'ib-6',
        type: 'quiz',
        question: 'Which is the most important thing for a new business?',
        options: [
          'A fancy logo and website',
          'A large office space',
          'Real customers who pay you money',
          'Business cards',
        ],
        correctIndex: 2,
        explanation: 'Nothing matters more than paying customers. You can always improve your brand later — but without customers, there is no business.',
      },
    ],
  },
  {
    id: 'business-management',
    title: 'Business Management Systems',
    description: 'Tools and systems to organize and run your business smoothly',
    icon: '⚙️',
    color: '#3B82F6',
    questions: [
      {
        id: 'bms-1',
        type: 'quiz',
        question: 'What is a CRM?',
        options: [
          'A type of social media platform',
          'A system to track your customers, conversations, and sales',
          'A government registration number',
          'A marketing technique',
        ],
        correctIndex: 1,
        explanation: 'CRM stands for Customer Relationship Management. It helps you keep track of who your customers are, what they bought, and when to follow up.',
      },
      {
        id: 'bms-2',
        type: 'scenario',
        question: 'You have 50 customers but keep losing track of who ordered what. Messages are scattered across WhatsApp, Instagram, and email. What should you do?',
        options: [
          'Hire an assistant to manage all messages',
          'Set up a simple CRM to centralize all customer info in one place',
          'Stop using Instagram and only use WhatsApp',
          'Write everything in a paper notebook',
        ],
        correctIndex: 1,
        explanation: 'A CRM puts all your customer info in one spot. You can see orders, messages, and follow-ups without digging through 5 different apps.',
      },
      {
        id: 'bms-3',
        type: 'quiz',
        question: 'What is the benefit of using checkout links instead of manual payment collection?',
        options: [
          'They look more professional',
          'Customers can pay instantly, you get paid faster, and there is a clear record',
          'They are required by law',
          'They cost less than cash',
        ],
        correctIndex: 1,
        explanation: 'Checkout links let customers pay right away without you chasing them. You get paid faster and have a clear record of every transaction.',
      },
      {
        id: 'bms-4',
        type: 'quiz',
        question: 'Why should you track your tasks and to-dos in a system instead of your head?',
        options: [
          'To impress your team',
          'Because your brain forgets things — a system does not',
          'It is required for tax purposes',
          'Only big companies need task management',
        ],
        correctIndex: 1,
        explanation: 'Your brain is for having ideas, not storing them. A task system makes sure nothing falls through the cracks.',
      },
      {
        id: 'bms-5',
        type: 'scenario',
        question: 'A customer messages you on WhatsApp asking about an order from 3 weeks ago. You cannot find the details. How do you prevent this from happening again?',
        options: [
          'Tell customers to keep their own records',
          'Log every order in a system with dates, amounts, and status',
          'Only accept orders in person',
          'Hire a bookkeeper',
        ],
        correctIndex: 1,
        explanation: 'When every order is logged in a system, you can look up any customer or order in seconds. No more digging through old chats.',
      },
      {
        id: 'bms-6',
        type: 'quiz',
        question: 'What does "automation" mean in a business context?',
        options: [
          'Replacing all employees with robots',
          'Setting up systems that do repetitive tasks for you automatically',
          'Making your website load faster',
          'Using social media scheduling tools only',
        ],
        correctIndex: 1,
        explanation: 'Automation means letting software handle repetitive work — like sending follow-up messages, updating order status, or generating reports — so you can focus on growing.',
      },
    ],
  },
  {
    id: 'smb-tech-stack',
    title: '2026 SMB Tech Stack',
    description: 'The essential technology tools every small business needs today',
    icon: '🛠️',
    color: '#10B981',
    questions: [
      {
        id: 'ts-1',
        type: 'quiz',
        question: 'What is a "tech stack" for a small business?',
        options: [
          'A pile of computers in your office',
          'The set of software tools you use to run your business',
          'A coding framework for developers',
          'An expensive IT department',
        ],
        correctIndex: 1,
        explanation: 'Your tech stack is simply the collection of apps and tools you use — like your payment processor, CRM, messaging app, and website builder.',
      },
      {
        id: 'ts-2',
        type: 'scenario',
        question: 'You are choosing between a free tool with limited features and a $30/month tool that does everything. Your business makes $2,000/month. What is the smart choice?',
        options: [
          'Always go free — never pay for software',
          'If the paid tool saves you 5+ hours a month, it pays for itself — go paid',
          'Wait until you make $10,000/month to invest in tools',
          'Build your own tool from scratch',
        ],
        correctIndex: 1,
        explanation: 'Time is money. If a $30 tool saves you 5 hours of manual work, and your time is worth $15/hour, you are saving $75 worth of time for $30.',
      },
      {
        id: 'ts-3',
        type: 'quiz',
        question: 'Why is WhatsApp important for small businesses in Latin America?',
        options: [
          'It has the best video quality',
          'Most customers already use it daily — it is where the conversations happen',
          'It is the only legal way to message customers',
          'It is free for businesses',
        ],
        correctIndex: 1,
        explanation: 'In Latin America, WhatsApp is how people communicate. Meeting your customers where they already are is smarter than asking them to download a new app.',
      },
      {
        id: 'ts-4',
        type: 'quiz',
        question: 'What is an AI assistant for business?',
        options: [
          'A robot that physically works in your store',
          'Software that can understand messages, answer questions, and do tasks for you',
          'A human virtual assistant from another country',
          'A chatbot that only says pre-written responses',
        ],
        correctIndex: 1,
        explanation: 'AI assistants like Kitz can understand what customers are asking, help manage orders, and automate repetitive work — like having a smart team member that never sleeps.',
      },
      {
        id: 'ts-5',
        type: 'scenario',
        question: 'You currently use 8 different apps to run your business and waste 2 hours a day switching between them. What should you do?',
        options: [
          'That is normal — keep going',
          'Consolidate into fewer tools that talk to each other, or use a platform that combines them',
          'Stop using technology altogether',
          'Hire someone to manage all the apps for you',
        ],
        correctIndex: 1,
        explanation: 'Tool sprawl kills productivity. Look for platforms that combine multiple functions (CRM + orders + payments + messaging) so you spend less time switching and more time selling.',
      },
      {
        id: 'ts-6',
        type: 'quiz',
        question: 'What should you look for first when choosing business software?',
        options: [
          'The coolest design and animations',
          'Whether it solves your biggest daily pain point',
          'How many features it has',
          'Whether it has an app for Apple Watch',
        ],
        correctIndex: 1,
        explanation: 'Start with your biggest headache. If chasing payments takes 3 hours a week, get a payment tool first. Solve real problems before adding nice-to-haves.',
      },
    ],
  },
  {
    id: 'social-media-marketing',
    title: 'Social Media Marketing',
    description: 'How to find and attract customers using social media',
    icon: '📱',
    color: '#F59E0B',
    questions: [
      {
        id: 'smm-1',
        type: 'quiz',
        question: 'What is the number one rule of social media marketing for small businesses?',
        options: [
          'Post as much as possible, even if it is low quality',
          'Be consistent and provide value — help people, do not just sell',
          'Only post product photos with prices',
          'Buy followers to look popular',
        ],
        correctIndex: 1,
        explanation: 'People follow accounts that help them or entertain them. If every post is "buy my stuff," people tune out. Share tips, stories, and behind-the-scenes content too.',
      },
      {
        id: 'smm-2',
        type: 'scenario',
        question: 'You posted 3 times this week. One post got 500 views, one got 50, and one got 2,000. What should you do?',
        options: [
          'Delete the post with 50 views',
          'Study what made the 2,000-view post work and make more content like it',
          'Post the same content every day',
          'Stop posting and try paid ads only',
        ],
        correctIndex: 1,
        explanation: 'Your best-performing content tells you what your audience actually wants. Double down on what works instead of guessing.',
      },
      {
        id: 'smm-3',
        type: 'quiz',
        question: 'What is "organic reach" on social media?',
        options: [
          'Reach from paid advertisements',
          'The number of people who see your content without you paying to promote it',
          'The reach of organic food businesses',
          'How many followers you have',
        ],
        correctIndex: 1,
        explanation: 'Organic reach is free visibility. When people share, comment, or save your posts, the platform shows it to more people — without you spending a dollar.',
      },
      {
        id: 'smm-4',
        type: 'scenario',
        question: 'A customer leaves a negative comment on your Instagram post. What do you do?',
        options: [
          'Delete it immediately',
          'Respond publicly with empathy, then take it to DMs to resolve it',
          'Ignore it and hope no one sees it',
          'Post a response calling them out',
        ],
        correctIndex: 1,
        explanation: 'How you handle complaints in public shows everyone what kind of business you are. Respond with care, then move the conversation to private messages to fix the issue.',
      },
      {
        id: 'smm-5',
        type: 'quiz',
        question: 'How often should a small business post on social media?',
        options: [
          'Once a month is enough',
          '3-5 times per week — consistent without burning out',
          '10 times a day to beat the algorithm',
          'Only when you have a sale or promotion',
        ],
        correctIndex: 1,
        explanation: '3-5 posts a week keeps you visible without overwhelming yourself. Quality and consistency matter more than volume.',
      },
      {
        id: 'smm-6',
        type: 'quiz',
        question: 'What is a "call to action" (CTA) in a social media post?',
        options: [
          'A phone number in your bio',
          'Telling the viewer exactly what to do next — like "DM us to order" or "tap the link"',
          'A hashtag at the end of your post',
          'Tagging another business in your post',
        ],
        correctIndex: 1,
        explanation: 'If you do not tell people what to do, they will scroll past. A clear CTA turns viewers into customers — "DM us," "click the link," "comment YES to get started."',
      },
    ],
  },
]
```

**Step 2: Verify the file compiles**

Run: `cd /tmp/kitzV1/ui && npx tsc --noEmit src/data/courses.ts`

---

### Task 2: Create the game progress Zustand store

**Files:**
- Create: `ui/src/stores/gameStore.ts`

**Step 1: Write the test**

```typescript
// ui/src/stores/__tests__/gameStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.setState({
      xp: 0,
      level: 1,
      completedQuestions: {},
      completedCourses: [],
      currentCourseId: null,
      currentQuestionIndex: 0,
    })
    localStorage.clear()
  })

  it('starts at level 1 with 0 XP', () => {
    const state = useGameStore.getState()
    expect(state.xp).toBe(0)
    expect(state.level).toBe(1)
  })

  it('adds XP and calculates level', () => {
    useGameStore.getState().addXP(100)
    expect(useGameStore.getState().xp).toBe(100)
  })

  it('marks a question as answered', () => {
    useGameStore.getState().answerQuestion('intro-to-business', 'ib-1', true)
    const completed = useGameStore.getState().completedQuestions['intro-to-business']
    expect(completed).toContain('ib-1')
  })

  it('levels up when a course is completed', () => {
    useGameStore.getState().completeCourse('intro-to-business')
    expect(useGameStore.getState().level).toBe(2)
    expect(useGameStore.getState().completedCourses).toContain('intro-to-business')
  })
})
```

**Step 2: Run test to see it fail**

Run: `cd /tmp/kitzV1/ui && npx vitest run src/stores/__tests__/gameStore.test.ts`
Expected: FAIL — module not found

**Step 3: Write the store**

```typescript
// ui/src/stores/gameStore.ts
import { create } from 'zustand'

const STORAGE_KEY = 'kitz-game-progress'

// XP per correct answer, bonus for completing a course
const XP_PER_CORRECT = 50
const XP_COURSE_BONUS = 200

interface GameState {
  xp: number
  level: number // 1-5, goes up when you complete a course
  completedQuestions: Record<string, string[]> // courseId -> questionIds answered correctly
  completedCourses: string[]
  currentCourseId: string | null
  currentQuestionIndex: number

  // Actions
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
    if (prev.includes(questionId)) return // already answered
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
```

**Step 4: Run test to see it pass**

Run: `cd /tmp/kitzV1/ui && npx vitest run src/stores/__tests__/gameStore.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add ui/src/data/courses.ts ui/src/stores/gameStore.ts ui/src/stores/__tests__/gameStore.test.ts
git commit -m "feat: add course data and game progress store for Kitz educational game"
```

---

### Task 3: Add level-based aura system to Orb

**Files:**
- Modify: `ui/src/components/orb/Orb.tsx`

The existing Orb already has a simple purple aura. We are going to add a `level` prop (1-5) that stacks more visual effects on top of the existing orb. The orb shape stays the same — we are just adding glowing rings and particles around it.

**Step 1: Add OrbAura component inside Orb.tsx**

Add this new component above the main `Orb` component. It renders layered aura rings based on the level:

```typescript
/* ── Level-based aura layers ── */
const AURA_LAYERS = [
  null, // Level 1: no extra aura (base purple glow only)
  { color: '#60A5FA', size: 13, blur: 12, opacity: 0.25, speed: 3 },     // Level 2: blue ring
  { color: '#FBBF24', size: 15, blur: 16, opacity: 0.3, speed: 2.5 },    // Level 3: gold ring
  { color: '#F9FAFB', size: 17, blur: 20, opacity: 0.2, speed: 2 },      // Level 4: white field
  { color: '#E879F9', size: 19, blur: 24, opacity: 0.35, speed: 1.5 },   // Level 5: rainbow/pink
]

function OrbAuras({ level }: { level: number }) {
  // Render all unlocked aura layers (stacking)
  const layers = AURA_LAYERS.slice(1, level)
  if (layers.length === 0) return null

  return (
    <>
      {layers.map((layer, i) => layer && (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: PX * layer.size,
            height: PX * layer.size,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${layer.color}${Math.round(layer.opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
            animation: `orb-breathe ${layer.speed}s ease-in-out infinite`,
            pointerEvents: 'none',
            filter: `blur(${layer.blur}px)`,
          }}
        />
      ))}
      {/* Level 5 special: lightning sparks */}
      {level >= 5 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: PX * 20,
            height: PX * 20,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: `2px solid #E879F930`,
            animation: 'orb-breathe 1.2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  )
}
```

**Step 2: Update Orb props and render the aura**

Add `level?: number` to `OrbProps`:

```typescript
interface OrbProps {
  sleeping?: boolean
  static?: boolean
  level?: number  // 1-5, controls aura stacking
}
```

Update the Orb function signature:

```typescript
export function Orb({ sleeping = false, static: isStatic = false, level = 1 }: OrbProps) {
```

Add `<OrbAuras level={level} />` right after the existing aura `div` (the one with `orb-breathe` animation), inside the character wrapper div (around line 645-662 in the current file). Place it just after the existing aura:

```tsx
{/* Level-based stacking auras */}
<OrbAuras level={level} />
```

**Step 3: Verify it renders without errors**

Run: `cd /tmp/kitzV1/ui && npx tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add ui/src/components/orb/Orb.tsx
git commit -m "feat: add level-based aura stacking to Orb (DBZ-style power evolution)"
```

---

### Task 4: Build the Module Select screen component

**Files:**
- Create: `ui/src/components/learn/ModuleSelect.tsx`

This is the "course picker" screen. Shows 4 cards — one per course. Completed courses have a checkmark. The current Kitz level and XP are shown at the top.

**Step 1: Create the component**

```tsx
import { COURSES } from '@/data/courses'
import { useGameStore } from '@/stores/gameStore'

interface ModuleSelectProps {
  onSelectCourse: (courseId: string) => void
}

export function ModuleSelect({ onSelectCourse }: ModuleSelectProps) {
  const { level, xp, completedCourses, completedQuestions } = useGameStore()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header — Level + XP */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Learn with Kitz</h1>
        <p className="mt-1 text-sm text-gray-500">Complete courses to power up Kitz</p>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="rounded-full bg-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-700">
            Level {level}
          </div>
          <div className="text-sm font-medium text-gray-600">
            {xp} XP
          </div>
        </div>
      </div>

      {/* Course cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {COURSES.map((course) => {
          const isCompleted = completedCourses.includes(course.id)
          const answered = completedQuestions[course.id]?.length ?? 0
          const total = course.questions.length
          const progress = total > 0 ? Math.round((answered / total) * 100) : 0

          return (
            <button
              key={course.id}
              onClick={() => onSelectCourse(course.id)}
              className="group relative rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-purple-300 hover:shadow-md"
            >
              {isCompleted && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                  ✓
                </div>
              )}
              <div className="mb-2 text-2xl">{course.icon}</div>
              <h3 className="text-sm font-bold text-gray-900">{course.title}</h3>
              <p className="mt-1 text-xs text-gray-500">{course.description}</p>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: course.color }}
                />
              </div>
              <p className="mt-1 text-[10px] text-gray-400">{answered}/{total} questions</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: Verify it compiles**

Run: `cd /tmp/kitzV1/ui && npx tsc --noEmit`

---

### Task 5: Build the Question Card component

**Files:**
- Create: `ui/src/components/learn/QuestionCard.tsx`

This is the main gameplay screen. Shows one question at a time. User picks an answer. If correct: celebration + XP. If wrong: explanation + try again.

**Step 1: Create the component**

```tsx
import { useState } from 'react'
import type { Question } from '@/data/courses'

interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  onAnswer: (correct: boolean) => void
  onNext: () => void
  alreadyAnswered: boolean
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNext,
  alreadyAnswered,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(alreadyAnswered)

  const handleSelect = (index: number) => {
    if (revealed) return
    setSelected(index)
    const correct = index === question.correctIndex
    setRevealed(true)
    onAnswer(correct)
  }

  const isCorrect = selected === question.correctIndex

  return (
    <div className="mx-auto max-w-lg px-4">
      {/* Progress indicator */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-purple-500 transition-all"
            style={{ width: `${((questionNumber) / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-400">
          {questionNumber}/{totalQuestions}
        </span>
      </div>

      {/* Question type badge */}
      <div className="mb-3">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
          question.type === 'scenario'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-purple-100 text-purple-700'
        }`}>
          {question.type === 'scenario' ? 'Scenario' : 'Quiz'}
        </span>
      </div>

      {/* Question */}
      <h2 className="mb-5 text-lg font-bold leading-snug text-gray-900">
        {question.question}
      </h2>

      {/* Options */}
      <div className="space-y-2.5">
        {question.options.map((option, i) => {
          let style = 'border-gray-200 bg-white hover:border-purple-300'
          if (revealed) {
            if (i === question.correctIndex) {
              style = 'border-green-500 bg-green-50'
            } else if (i === selected && !isCorrect) {
              style = 'border-red-400 bg-red-50'
            } else {
              style = 'border-gray-100 bg-gray-50 opacity-50'
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={revealed}
              className={`w-full rounded-lg border-2 px-4 py-3 text-left text-sm transition ${style}`}
            >
              {option}
            </button>
          )
        })}
      </div>

      {/* Explanation — shows after answering */}
      {revealed && (
        <div className={`mt-5 rounded-lg p-4 ${isCorrect || alreadyAnswered ? 'bg-green-50' : 'bg-amber-50'}`}>
          <p className={`text-sm font-semibold ${isCorrect || alreadyAnswered ? 'text-green-700' : 'text-amber-700'}`}>
            {isCorrect || alreadyAnswered ? '+50 XP!' : 'Not quite — here is the answer:'}
          </p>
          <p className="mt-1 text-sm text-gray-700">{question.explanation}</p>
          <button
            onClick={onNext}
            className="mt-3 rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-600"
          >
            {questionNumber >= totalQuestions ? 'Finish Course' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify it compiles**

Run: `cd /tmp/kitzV1/ui && npx tsc --noEmit`

---

### Task 6: Build the Learn page and wire it all together

**Files:**
- Create: `ui/src/pages/LearnPage.tsx`
- Modify: `ui/src/App.tsx` (add route)
- Modify: `ui/src/components/layout/TopNavBar.tsx` (add nav item)

**Step 1: Create LearnPage**

This page manages the flow: Module Select → Question Cards → Course Complete → back to Module Select.

```tsx
import { useState } from 'react'
import { ModuleSelect } from '@/components/learn/ModuleSelect'
import { QuestionCard } from '@/components/learn/QuestionCard'
import { COURSES } from '@/data/courses'
import { useGameStore } from '@/stores/gameStore'
import { Orb } from '@/components/orb/Orb'

export function LearnPage() {
  const {
    currentCourseId,
    currentQuestionIndex,
    level,
    completedQuestions,
    startCourse,
    answerQuestion,
    completeCourse,
    nextQuestion,
    resetCourse,
  } = useGameStore()

  const [showComplete, setShowComplete] = useState(false)

  const currentCourse = COURSES.find((c) => c.id === currentCourseId)
  const currentQuestion = currentCourse?.questions[currentQuestionIndex]

  const handleSelectCourse = (courseId: string) => {
    setShowComplete(false)
    startCourse(courseId)
  }

  const handleAnswer = (correct: boolean) => {
    if (currentCourseId && currentQuestion) {
      answerQuestion(currentCourseId, currentQuestion.id, correct)
    }
  }

  const handleNext = () => {
    if (!currentCourse) return
    if (currentQuestionIndex + 1 >= currentCourse.questions.length) {
      // Course finished
      completeCourse(currentCourse.id)
      setShowComplete(true)
    } else {
      nextQuestion()
    }
  }

  const handleBackToModules = () => {
    resetCourse()
    setShowComplete(false)
  }

  // Course complete screen
  if (showComplete && currentCourse) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
        <div className="mb-6 scale-150">
          <Orb level={level} static />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Course Complete!</h2>
        <p className="mt-2 text-sm text-gray-500">
          You finished "{currentCourse.title}" — Kitz leveled up!
        </p>
        <div className="mt-2 rounded-full bg-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-700">
          Now Level {level}
        </div>
        <button
          onClick={handleBackToModules}
          className="mt-6 rounded-lg bg-purple-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-600"
        >
          Back to Courses
        </button>
      </div>
    )
  }

  // Question view
  if (currentCourse && currentQuestion) {
    const alreadyAnswered = (completedQuestions[currentCourse.id] ?? []).includes(currentQuestion.id)
    return (
      <div className="min-h-full py-8">
        {/* Back button */}
        <div className="mx-auto mb-4 max-w-lg px-4">
          <button
            onClick={handleBackToModules}
            className="text-sm font-medium text-gray-400 hover:text-gray-600"
          >
            ← Back to courses
          </button>
          <h3 className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {currentCourse.icon} {currentCourse.title}
          </h3>
        </div>
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={currentCourse.questions.length}
          onAnswer={handleAnswer}
          onNext={handleNext}
          alreadyAnswered={alreadyAnswered}
        />
      </div>
    )
  }

  // Module select (default)
  return <ModuleSelect onSelectCourse={handleSelectCourse} />
}
```

**Step 2: Add "Learn" route to App.tsx**

Add import at top:
```typescript
import { LearnPage } from '@/pages/LearnPage'
```

Add route before the catch-all `*` route:
```tsx
<Route
  path="/learn"
  element={
    <ProtectedRoute>
      <LearnPage />
    </ProtectedRoute>
  }
/>
```

**Step 3: Add "Learn" nav item to TopNavBar.tsx**

Import the `GraduationCap` icon from lucide-react (add to existing import):
```typescript
import { Home, Briefcase, Bot, Zap, Activity, HelpCircle, Settings, GraduationCap } from 'lucide-react'
```

Add to the `navItems` array (after 'home', so it is the second item):
```typescript
{ id: 'learn', label: 'Learn', icon: GraduationCap },
```

**Step 4: Handle nav for Learn page in DashboardPage**

Read `ui/src/pages/DashboardPage.tsx` to understand how nav changes work. The nav items currently render different page components based on `currentNav` state. Add a case for `'learn'` that renders `<LearnPage />`.

Look for the switch/conditional that maps `currentNav` to components and add:
```tsx
// Inside the content area conditional rendering:
{currentNav === 'learn' && <LearnPage />}
```

**Step 5: Verify everything compiles**

Run: `cd /tmp/kitzV1/ui && npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add ui/src/pages/LearnPage.tsx ui/src/components/learn/ModuleSelect.tsx ui/src/components/learn/QuestionCard.tsx ui/src/App.tsx ui/src/components/layout/TopNavBar.tsx ui/src/pages/DashboardPage.tsx
git commit -m "feat: add Kitz educational game with 4 courses, quiz/scenarios, and level-up system"
```

---

### Task 7: Smoke test the full flow

**Step 1: Start the dev server**

Run: `cd /tmp/kitzV1/ui && npm run dev`

**Step 2: Manual test checklist**

- [ ] Click "Learn" in the left nav — module select screen appears
- [ ] See 4 course cards with progress bars
- [ ] Click a course — first question appears
- [ ] Answer a question correctly — green highlight, +50 XP, explanation shown
- [ ] Answer a question wrong — red highlight, explanation shown
- [ ] Click "Next Question" — next question appears
- [ ] Finish all 6 questions — "Course Complete" screen with leveled-up Orb
- [ ] Go back to modules — progress bar updated, completed course has checkmark
- [ ] Refresh the page — progress is saved (localStorage)
- [ ] Complete 2nd course — Kitz should have 2 aura layers now

**Step 3: Fix any issues found**

**Step 4: Final commit if any fixes**

```bash
git add -u
git commit -m "fix: address issues found in smoke test"
```
