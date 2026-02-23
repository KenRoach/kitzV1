# Agent Thinking UI — Design Doc

**Date:** 2026-02-23
**Status:** Approved
**Branch:** `feat/106-agent-architecture`

## Goal

Show customer-facing agent activity and thought process in the ChatPanel as expandable thinking blocks (like Claude Code), plus persist actions in the Activity tab. Backend agents stay invisible.

## Design Decisions

- **Location:** Inline in ChatPanel + persistent in Activity tab
- **Detail level:** Summary bubbles — 5-7 word action phrases, 6th-grader readable, KITZ tone
- **Scope:** Customer-facing agents only (32 agents across 7 teams)
- **Data source:** Mock data with simulated timing (wire to real SSE later)
- **UI pattern:** Collapsible thinking block between user message and Kitz response

## Thinking Block Component

Appears between user message and assistant response in ChatPanel.

```
[User]: Score my new lead Maria Garcia

  ▼ 🤖 5 agents on it...                2.1s
  │ ✅ CRO          Picking best agent
  │ ✅ LeadScorer    Checking her score
  │ ✅ Pipeline      Moving her forward
  │ ✅ Outreach      Writing her message
  │ ✅ DealCloser    Making payment link

[Kitz]: Maria's a hot lead — 85/100...
```

### States

| Icon | Meaning |
|------|---------|
| ⏳ (purple spinner) | Agent is working |
| ✅ (green check) | Done |
| ❌ (red x) | Failed/blocked |

### Collapse Behavior

- Auto-expands when agents start working
- Auto-collapses once Kitz's final response appears
- Click header to toggle open/closed anytime

## Agent Action Phrases (KITZ Tone)

### WhatsApp / Comms
| Agent | Action |
|-------|--------|
| HeadCustomer | Picking the right team |
| WAFlowDesigner | Building your chat flow |
| MessageTemplater | Writing your message template |
| DeliveryMonitor | Checking if message landed |
| EscalationBot | Flagging this for a human |

### Sales / CRM
| Agent | Action |
|-------|--------|
| CRO | Picking best sales move |
| LeadScorer | Checking their lead score |
| PipelineOptimizer | Moving them through pipeline |
| OutreachDrafter | Writing their follow-up |
| DealCloser | Making their payment link |

### Marketing / Growth
| Agent | Action |
|-------|--------|
| CMO | Planning the next campaign |
| ContentCreator | Writing fresh content |
| SEOAnalyst | Checking your search ranking |
| CampaignRunner | Launching your campaign |
| SocialManager | Scheduling your social post |

### Growth Hacking
| Agent | Action |
|-------|--------|
| HeadGrowth | Finding your growth lever |
| ActivationOptimizer | Getting new users hooked |
| RetentionAnalyst | Keeping customers coming back |
| ReferralEng | Setting up referral codes |
| FunnelDesigner | Building your sales funnel |

### Education / Onboarding
| Agent | Action |
|-------|--------|
| HeadEducation | Mapping the learning path |
| TutorialBuilder | Building a quick tutorial |
| DocWriter | Writing help docs |
| VideoScripter | Scripting a short video |
| FAQBot | Finding the best answer |

### Customer Success
| Agent | Action |
|-------|--------|
| CustomerVoice | Listening to your customers |
| TicketRouter | Sending ticket to right team |
| SatisfactionBot | Checking if they're happy |
| ChurnPredictor | Spotting who might leave |
| FeedbackAggregator | Collecting all the feedback |

### Content / Brand
| Agent | Action |
|-------|--------|
| FounderAdvocate | Keeping your brand voice |
| CopyWriter | Writing customer-facing copy |
| TranslationBot | Translating to Spanish |

## Message Scenario → Agent Chain Mapping

| User intent | Agent chain |
|-------------|------------|
| Lead/sales query | CRO → LeadScorer → PipelineOptimizer → OutreachDrafter → DealCloser |
| WhatsApp message | HeadCustomer → MessageTemplater → DeliveryMonitor |
| Content request | CMO → ContentCreator → CopyWriter → TranslationBot |
| Help/FAQ | HeadEducation → FAQBot → DocWriter |
| Customer complaint | CustomerVoice → TicketRouter → SatisfactionBot |
| Growth/activation | HeadGrowth → ActivationOptimizer → FunnelDesigner |
| Default/general | CRO → LeadScorer |

## Data Architecture

### New Store: `useAgentThinkingStore`

```typescript
interface ThinkingStep {
  id: string
  agentName: string
  action: string
  status: 'pending' | 'done' | 'failed'
  detail?: string
  startedAt: number
  completedAt?: number
}

interface AgentThinkingStore {
  steps: ThinkingStep[]
  isThinking: boolean
  startThinking: () => void
  addStep: (agentName: string, action: string) => string
  completeStep: (id: string, detail?: string) => void
  failStep: (id: string, reason?: string) => void
  reset: () => void
}
```

### Mock Simulation

On `sendMessage()`, classify user input → select agent chain → simulate steps with 200-800ms delays. Each step triggers `addStep()` then `completeStep()` after delay.

## New Files

| File | Purpose |
|------|---------|
| `ui/src/components/chat/AgentThinkingBlock.tsx` | Collapsible thinking container |
| `ui/src/components/chat/AgentThinkingStep.tsx` | Single step row |
| `ui/src/stores/agentThinkingStore.ts` | Thinking state management |
| `ui/src/lib/agentScenarios.ts` | Scenario mapping + action phrases |

## Modified Files

| File | Change |
|------|--------|
| `ui/src/components/layout/ChatPanel.tsx` | Render thinking block between messages |
| `ui/src/stores/orbStore.ts` | Trigger thinking simulation on sendMessage |
| `ui/src/stores/activityStore.ts` | Receive completed agent steps |

## Activity Tab Integration

Completed thinking steps are pushed to `activityStore` as entries with `type: 'agent'`. This gives persistent history in the Activity tab.

## Future: Real Data

Replace mock simulation with SSE stream from AOS EventBus:
- Endpoint: `GET /api/logs/stream` (SSE)
- Events: `{ type: 'agent_step', agentName, action, status, traceId }`
- Use existing `useSSE` hook
