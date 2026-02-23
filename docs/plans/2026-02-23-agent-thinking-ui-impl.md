# Agent Thinking UI — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show customer-facing agent activity as expandable thinking blocks in ChatPanel + push completed steps to Activity tab.

**Architecture:** New Zustand store (`agentThinkingStore`) drives a simulation of agent steps with timed delays. A scenario classifier maps user input keywords to agent chains. Two new components render the thinking block inline in ChatPanel. Completed steps are pushed to the existing `activityStore`.

**Tech Stack:** React 19, Zustand 5, Tailwind CSS 4, Lucide React icons, TypeScript 5.9

---

### Task 1: Agent Scenarios Data Module

**Files:**
- Create: `ui/src/lib/agentScenarios.ts`

**Step 1: Create the scenarios file with action phrases and chains**

```typescript
// ui/src/lib/agentScenarios.ts

export interface AgentAction {
  agent: string
  action: string
}

/** Every customer-facing agent's 5-7 word action phrase (KITZ tone) */
export const AGENT_ACTIONS: Record<string, string> = {
  // WhatsApp / Comms
  HeadCustomer: 'Picking the right team',
  WAFlowDesigner: 'Building your chat flow',
  MessageTemplater: 'Writing your message template',
  DeliveryMonitor: 'Checking if message landed',
  EscalationBot: 'Flagging this for a human',
  // Sales / CRM
  CRO: 'Picking best sales move',
  LeadScorer: 'Checking their lead score',
  PipelineOptimizer: 'Moving them through pipeline',
  OutreachDrafter: 'Writing their follow-up',
  DealCloser: 'Making their payment link',
  // Marketing / Growth
  CMO: 'Planning the next campaign',
  ContentCreator: 'Writing fresh content',
  SEOAnalyst: 'Checking your search ranking',
  CampaignRunner: 'Launching your campaign',
  SocialManager: 'Scheduling your social post',
  // Growth Hacking
  HeadGrowth: 'Finding your growth lever',
  ActivationOptimizer: 'Getting new users hooked',
  RetentionAnalyst: 'Keeping customers coming back',
  ReferralEng: 'Setting up referral codes',
  FunnelDesigner: 'Building your sales funnel',
  // Education / Onboarding
  HeadEducation: 'Mapping the learning path',
  TutorialBuilder: 'Building a quick tutorial',
  DocWriter: 'Writing help docs',
  VideoScripter: 'Scripting a short video',
  FAQBot: 'Finding the best answer',
  // Customer Success
  CustomerVoice: 'Listening to your customers',
  TicketRouter: 'Sending ticket to right team',
  SatisfactionBot: 'Checking if they\'re happy',
  ChurnPredictor: 'Spotting who might leave',
  FeedbackAggregator: 'Collecting all the feedback',
  // Content / Brand
  FounderAdvocate: 'Keeping your brand voice',
  CopyWriter: 'Writing customer-facing copy',
  TranslationBot: 'Translating to Spanish',
}

interface ScenarioMatch {
  keywords: string[]
  chain: string[]
}

const SCENARIOS: ScenarioMatch[] = [
  {
    keywords: ['lead', 'score', 'sales', 'deal', 'close', 'pipeline', 'crm', 'prospect', 'client', 'customer'],
    chain: ['CRO', 'LeadScorer', 'PipelineOptimizer', 'OutreachDrafter', 'DealCloser'],
  },
  {
    keywords: ['whatsapp', 'message', 'send', 'text', 'chat', 'wa', 'template'],
    chain: ['HeadCustomer', 'MessageTemplater', 'DeliveryMonitor'],
  },
  {
    keywords: ['content', 'blog', 'post', 'write', 'article', 'copy', 'social'],
    chain: ['CMO', 'ContentCreator', 'CopyWriter', 'TranslationBot'],
  },
  {
    keywords: ['help', 'how', 'faq', 'tutorial', 'guide', 'learn', 'onboard'],
    chain: ['HeadEducation', 'FAQBot', 'DocWriter'],
  },
  {
    keywords: ['complaint', 'issue', 'problem', 'ticket', 'support', 'unhappy', 'refund'],
    chain: ['CustomerVoice', 'TicketRouter', 'SatisfactionBot'],
  },
  {
    keywords: ['grow', 'activate', 'retain', 'funnel', 'referral', 'churn'],
    chain: ['HeadGrowth', 'ActivationOptimizer', 'FunnelDesigner'],
  },
  {
    keywords: ['campaign', 'marketing', 'seo', 'ads', 'promote', 'launch'],
    chain: ['CMO', 'CampaignRunner', 'SEOAnalyst', 'SocialManager'],
  },
  {
    keywords: ['pay', 'checkout', 'invoice', 'price', 'payment', 'link'],
    chain: ['CRO', 'DealCloser'],
  },
  {
    keywords: ['brand', 'voice', 'tone', 'translate', 'spanish'],
    chain: ['FounderAdvocate', 'CopyWriter', 'TranslationBot'],
  },
]

/** Classify user input and return the agent chain with action phrases */
export function classifyScenario(input: string): AgentAction[] {
  const lower = input.toLowerCase()

  for (const scenario of SCENARIOS) {
    if (scenario.keywords.some((kw) => lower.includes(kw))) {
      return scenario.chain.map((agent) => ({
        agent,
        action: AGENT_ACTIONS[agent] ?? 'Working on it',
      }))
    }
  }

  // Default: lightweight sales chain
  return [
    { agent: 'CRO', action: AGENT_ACTIONS.CRO },
    { agent: 'LeadScorer', action: AGENT_ACTIONS.LeadScorer },
  ]
}
```

**Step 2: Commit**

```bash
git add ui/src/lib/agentScenarios.ts
git commit -m "feat(ui): add agent scenario classifier with KITZ-tone action phrases"
```

---

### Task 2: Agent Thinking Store

**Files:**
- Create: `ui/src/stores/agentThinkingStore.ts`

**Step 1: Create the store**

```typescript
// ui/src/stores/agentThinkingStore.ts

import { create } from 'zustand'
import { classifyScenario } from '@/lib/agentScenarios'
import { useActivityStore } from './activityStore'

export type StepStatus = 'pending' | 'done' | 'failed'

export interface ThinkingStep {
  id: string
  agentName: string
  action: string
  status: StepStatus
  detail?: string
  startedAt: number
  completedAt?: number
}

interface AgentThinkingStore {
  steps: ThinkingStep[]
  isThinking: boolean
  collapsed: boolean
  totalTimeMs: number
  toggleCollapsed: () => void
  /** Kicks off a simulated agent chain based on user input */
  simulateThinking: (userInput: string) => void
  reset: () => void
}

export const useAgentThinkingStore = create<AgentThinkingStore>((set, get) => ({
  steps: [],
  isThinking: false,
  collapsed: false,
  totalTimeMs: 0,

  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),

  simulateThinking: (userInput: string) => {
    const chain = classifyScenario(userInput)
    const startTime = Date.now()

    // Initialize all steps as pending
    const steps: ThinkingStep[] = chain.map((a, i) => ({
      id: `step_${startTime}_${i}`,
      agentName: a.agent,
      action: a.action,
      status: 'pending' as StepStatus,
      startedAt: startTime,
    }))

    set({ steps, isThinking: true, collapsed: false, totalTimeMs: 0 })

    // Simulate each step completing with a staggered delay
    chain.forEach((_, i) => {
      const delay = (i + 1) * (300 + Math.random() * 500) // 300-800ms per step
      setTimeout(() => {
        set((s) => {
          const updated = s.steps.map((step, j) =>
            j === i ? { ...step, status: 'done' as StepStatus, completedAt: Date.now() } : step,
          )
          const allDone = updated.every((st) => st.status === 'done')
          const elapsed = Date.now() - startTime

          // If all done, push completed steps to activity store
          if (allDone) {
            const activityStore = useActivityStore.getState()
            const newEntries = updated.map((st) => ({
              id: `act_${st.id}`,
              type: 'agent' as const,
              actor: { name: st.agentName, isAgent: true },
              action: st.action,
              timestamp: new Date().toISOString(),
            }))
            // Prepend to activity entries
            useActivityStore.setState({
              entries: [...newEntries, ...activityStore.entries],
            })
          }

          return {
            steps: updated,
            isThinking: !allDone,
            totalTimeMs: elapsed,
          }
        })
      }, delay)
    })
  },

  reset: () => set({ steps: [], isThinking: false, collapsed: false, totalTimeMs: 0 }),
}))
```

**Step 2: Commit**

```bash
git add ui/src/stores/agentThinkingStore.ts
git commit -m "feat(ui): add agent thinking store with simulated step timing"
```

---

### Task 3: AgentThinkingStep Component

**Files:**
- Create: `ui/src/components/chat/AgentThinkingStep.tsx`

**Step 1: Create the step component**

```tsx
// ui/src/components/chat/AgentThinkingStep.tsx

import { Bot, Check, X, Loader2 } from 'lucide-react'
import type { ThinkingStep } from '@/stores/agentThinkingStore'

interface AgentThinkingStepProps {
  step: ThinkingStep
  isLast: boolean
}

export function AgentThinkingStep({ step, isLast }: AgentThinkingStepProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      {/* Vertical line connector */}
      <div className="flex w-4 flex-col items-center">
        {step.status === 'pending' && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
        )}
        {step.status === 'done' && (
          <Check className="h-3.5 w-3.5 text-green-400" />
        )}
        {step.status === 'failed' && (
          <X className="h-3.5 w-3.5 text-red-400" />
        )}
      </div>

      {/* Agent name */}
      <span className="w-28 shrink-0 truncate font-mono text-[11px] font-medium text-gray-400">
        {step.agentName}
      </span>

      {/* Action phrase */}
      <span className="text-[11px] text-gray-500">
        {step.action}
      </span>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add ui/src/components/chat/AgentThinkingStep.tsx
git commit -m "feat(ui): add AgentThinkingStep component with status icons"
```

---

### Task 4: AgentThinkingBlock Component

**Files:**
- Create: `ui/src/components/chat/AgentThinkingBlock.tsx`

**Step 1: Create the block component**

```tsx
// ui/src/components/chat/AgentThinkingBlock.tsx

import { Bot, ChevronDown, ChevronRight } from 'lucide-react'
import { useAgentThinkingStore } from '@/stores/agentThinkingStore'
import { AgentThinkingStep } from './AgentThinkingStep'

export function AgentThinkingBlock() {
  const steps = useAgentThinkingStore((s) => s.steps)
  const isThinking = useAgentThinkingStore((s) => s.isThinking)
  const collapsed = useAgentThinkingStore((s) => s.collapsed)
  const totalTimeMs = useAgentThinkingStore((s) => s.totalTimeMs)
  const toggleCollapsed = useAgentThinkingStore((s) => s.toggleCollapsed)

  if (steps.length === 0) return null

  const doneCount = steps.filter((s) => s.status === 'done').length
  const totalCount = steps.length
  const timeStr = totalTimeMs > 0 ? `${(totalTimeMs / 1000).toFixed(1)}s` : ''

  return (
    <div className="my-2 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2">
      {/* Header — always visible, clickable */}
      <button
        onClick={toggleCollapsed}
        className="flex w-full items-center gap-2 text-left"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-purple-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-purple-400" />
        )}
        <Bot className="h-3.5 w-3.5 text-purple-400" />
        <span className="flex-1 text-xs font-medium text-purple-300">
          {isThinking
            ? `${doneCount}/${totalCount} agents working...`
            : `${totalCount} agents done`}
        </span>
        {timeStr && (
          <span className="font-mono text-[10px] text-gray-500">{timeStr}</span>
        )}
      </button>

      {/* Steps — collapsible */}
      {!collapsed && (
        <div className="mt-1.5 ml-1 border-l border-purple-500/20 pl-2">
          {steps.map((step, i) => (
            <AgentThinkingStep
              key={step.id}
              step={step}
              isLast={i === steps.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add ui/src/components/chat/AgentThinkingBlock.tsx
git commit -m "feat(ui): add collapsible AgentThinkingBlock container"
```

---

### Task 5: Wire Thinking Block into ChatPanel

**Files:**
- Modify: `ui/src/components/layout/ChatPanel.tsx`

**Step 1: Add imports (top of file, after existing imports at line 5)**

Add after `import { cn } from '@/lib/utils'` on line 5:

```typescript
import { useAgentThinkingStore } from '@/stores/agentThinkingStore'
import { AgentThinkingBlock } from '@/components/chat/AgentThinkingBlock'
```

**Step 2: Add store hook inside component (after line 17)**

Add after `const [input, setInput] = useState('')` on line 18:

```typescript
  const agentSteps = useAgentThinkingStore((s) => s.steps)
```

**Step 3: Replace the bouncing dots thinking indicator (lines 148-154) with the thinking block**

Replace this block:

```tsx
        {state === 'thinking' && (
          <div className="flex gap-1 py-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '300ms' }} />
          </div>
        )}
```

With:

```tsx
        {(state === 'thinking' || agentSteps.length > 0) && (
          <AgentThinkingBlock />
        )}
```

**Step 4: Commit**

```bash
git add ui/src/components/layout/ChatPanel.tsx
git commit -m "feat(ui): wire AgentThinkingBlock into ChatPanel replacing bounce dots"
```

---

### Task 6: Trigger Thinking Simulation on Send Message

**Files:**
- Modify: `ui/src/stores/orbStore.ts`

**Step 1: Add import at top (after line 3)**

Add after `import { API } from '@/lib/constants'`:

```typescript
import { useAgentThinkingStore } from './agentThinkingStore'
```

**Step 2: Trigger simulation at start of sendMessage (after line 40)**

After the line `set((s) => ({ messages: [...s.messages, userMsg], state: 'thinking' }))` on line 40, add:

```typescript
    // Kick off agent thinking simulation
    useAgentThinkingStore.getState().simulateThinking(content)
```

**Step 3: Auto-collapse thinking block when response arrives (after line 56)**

After the line `set((s) => ({ messages: [...s.messages, assistantMsg], state: 'success' }))` on line 56, add:

```typescript
      // Auto-collapse the thinking block once we have a response
      const thinkingStore = useAgentThinkingStore.getState()
      if (!thinkingStore.collapsed) {
        useAgentThinkingStore.setState({ collapsed: true })
      }
```

**Step 4: Commit**

```bash
git add ui/src/stores/orbStore.ts
git commit -m "feat(ui): trigger agent thinking simulation on sendMessage"
```

---

### Task 7: Add Spinner Animation to CSS

**Files:**
- Modify: `ui/src/index.css`

**Step 1: Add spin keyframe (after the orb-breathe keyframe at line 30)**

Add after the closing `}` of the `orb-breathe` keyframe:

```css

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

Note: Lucide's `Loader2` with `animate-spin` uses Tailwind's built-in spin animation, so this is only needed if Tailwind 4 doesn't include it by default. Check after wiring — if spinner already works, skip this task.

**Step 2: Commit (if needed)**

```bash
git add ui/src/index.css
git commit -m "style(ui): add spin keyframe for agent thinking spinner"
```

---

### Task 8: Visual Verification

**Step 1: Start the UI dev server**

```bash
cd ui && npm run dev
```

**Step 2: Test in browser**

1. Open `http://localhost:5173`
2. Type "Score my new lead Maria" in chat input → hit Enter
3. **Verify:** Purple thinking block appears with agents loading one by one
4. **Verify:** Each step shows ⏳ spinner → ✅ check mark
5. **Verify:** Header shows "3/5 agents working..." → "5 agents done"
6. **Verify:** Block auto-collapses when Kitz's response arrives
7. **Verify:** Click collapsed header → expands to show all steps again
8. **Verify:** Timer shows total elapsed time (e.g., "2.1s")

**Step 3: Test different scenarios**

- Type "send a whatsapp message" → should show HeadCustomer, MessageTemplater, DeliveryMonitor
- Type "write me a blog post" → should show CMO, ContentCreator, CopyWriter, TranslationBot
- Type "I have a complaint" → should show CustomerVoice, TicketRouter, SatisfactionBot
- Type "random question" → should show default chain (CRO, LeadScorer)

**Step 4: Check Activity tab**

1. Click "Activity" tab on right panel
2. Filter by "Agents"
3. **Verify:** Completed thinking steps appear as new activity entries at the top

**Step 5: Commit all verified work**

```bash
git add -A
git commit -m "feat(ui): agent thinking blocks — visual verification pass"
```

---

### Task 9: Update Active Agents Counter

**Files:**
- Modify: `ui/src/components/layout/ChatPanel.tsx`

**Step 1: Make the "Active Agents" stat bar dynamic (around line 224)**

Replace the hardcoded `8` in the Active Agents stat:

```tsx
            <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-400">8</span>
```

With dynamic count from the thinking store:

```tsx
            <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-400">
              {agentSteps.filter((s) => s.status === 'pending').length || 8}
            </span>
```

This shows the count of currently-working agents when thinking, or the default `8` when idle.

**Step 2: Commit**

```bash
git add ui/src/components/layout/ChatPanel.tsx
git commit -m "feat(ui): dynamic active agents counter in stats bar"
```

---

### Task 10: Final Commit — Feature Complete

**Step 1: Stage all changes and do a final type check**

```bash
cd ui && npx tsc --noEmit
```

Expected: 0 errors.

**Step 2: Create feature commit if any uncommitted changes remain**

```bash
git add -A
git status
```

If clean: done. If changes remain:

```bash
git commit -m "feat(ui): agent thinking UI — complete implementation

Adds expandable thinking blocks to ChatPanel showing customer-facing
agent activity with KITZ-tone action phrases. Auto-collapses on
response. Pushes completed steps to Activity tab."
```
