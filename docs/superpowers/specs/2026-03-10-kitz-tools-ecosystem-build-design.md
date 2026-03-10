# KITZ Tools Ecosystem — Full Build Design

**Date:** 2026-03-10
**Scope:** Build all 16 tools in the KITZ ecosystem
**Approach:** Hybrid — React SPA pages in kitz-workspace, agent tools in kitz_os, RenewFlow standalone

---

## Context

KITZ has 16 tools catalogued in `kitz-knowledge-base/registry/kitz-tools-catalog.json` and registered in `kitz_os/src/tools/kitzToolsEcosystemTools.ts`. None are built as real apps yet. Kenneth wants all 16 shipped — the full sales, marketing, operations, and onboarding ecosystem.

---

## Architecture Decision

### Category A: React SPA Pages (6 tools → routes in kitz-workspace)
These need real interactive UI. They become routes inside `/UI:UX/kitz-workspace/`.

**Infrastructure changes needed:**
- Add `react-router-dom` to kitz-workspace
- Add navigation sidebar with tool categories
- Create shared page layout wrapper
- Each tool = one route component

### Category B: Agent Tools (9 tools → kitz_os ToolSchema modules)
These are LLM-powered generators. They stay as tool modules in `kitz_os/src/tools/`.

**Pattern:** Each gets a `xxxTools.ts` file exporting `getAllXxxTools(): ToolSchema[]`, using `callLLM()` from `shared/callLLM.ts`, registered in `registry.ts`.

### Category C: Standalone Product (1 tool → separate repo)
RenewFlow is a full product. Gets its own repo and deploy.

---

## Batch 1: kitz-workspace Infrastructure + 6 React SPAs

### Step 1.0: Add routing to kitz-workspace
- `npm install react-router-dom`
- Wrap `App.tsx` with `BrowserRouter`
- Create route structure: `/` (workspace home), `/demo`, `/roi`, `/battery`, `/proposals`, `/command`, `/onboarding`
- Add sidebar navigation component with tool categories
- Keep existing SplitLayout as the `/` home route

### Step 1.1: Live Pipeline Demo (`/demo`)
**File:** `src/pages/LiveDemo.tsx`
- Animated 7-step pipeline: WhatsApp in → gateway → kitz_os → llm-hub → aos → workspace → logs → battery deduct
- Each step lights up sequentially with timing animation
- AI Battery counter decrements in real-time
- Panama business scenario (laptop quote, warranty renewal)
- Dark bg, purple (#7C3AED), monospace terminal energy
- Mobile-aware, completes in ~60 seconds
- **Deps:** Framer Motion for animations, lucide-react for icons

### Step 1.2: ROI Calculator (`/roi`)
**File:** `src/pages/ROICalculator.tsx`
- Slider inputs: messages/day, agent tasks/month, team size, avg salary
- Real-time output: KitZ cost vs team cost, monthly savings, 12-month ROI
- Recharts bar/comparison chart
- CFO-ready summary paragraph in Spanish
- Yappy/BAC payment callout

### Step 1.3: AI Battery Calculator (`/battery`)
**File:** `src/pages/BatteryCalculator.tsx`
- Category sliders: LLM calls, agent tasks, WhatsApp messages, notifications, cron jobs
- Credit consumption breakdown with visual gauge
- Hiring cost comparison
- Payback period in days
- CFO summary in Spanish

### Step 1.4: Proposal Generator (`/proposals`)
**File:** `src/pages/ProposalGenerator.tsx`
- Form: prospect name, company, industry (dropdown), pain point, company size
- Generates full Spanish proposal with sections:
  1. Portada 2. Resumen Ejecutivo 3. Solución Propuesta 4. Implementación (30/60/90) 5. Inversión 6. Cumplimiento Panameño 7. Próximos Pasos
- API call to kitz_os for LLM generation OR client-side template + callLLM
- PDF-ready formatted output
- Industry-specific content (Logistics, Banking, Retail, etc.)

### Step 1.5: Command Center Dashboard (`/command`)
**File:** `src/pages/CommandCenter.tsx`
- Service status grid: gateway, kitz_os, llm-hub, whatsapp, workspace, brain, payments
- Pipeline activity feed (recent runs)
- Key metrics: messages today, credits used, active contacts
- AI Battery gauge (visual meter)
- Recharts for trend lines

### Step 1.6: Onboarding Flow Builder (`/onboarding`)
**File:** `src/pages/OnboardingFlow.tsx`
- Multi-step wizard (3-5 diagnostic questions)
- Questions: where do conversations happen? biggest bottleneck? recurring contracts? team size? current tools?
- Module recommendation output: which KitZ services to activate first
- 30-day plan, welcome message template, first-win target
- Framer Motion step transitions

---

## Batch 2: 9 Agent Tools (kitz_os ToolSchema modules)

Each tool file follows the pattern:
```typescript
import { callLLM } from './shared/callLLM.js';
import type { ToolSchema } from './registry.js';

export function getAllXxxTools(): ToolSchema[] {
  return [{ name, description, parameters, riskLevel, execute }];
}
```

### Step 2.1: Prospect Outreach Generator
**File:** `kitz_os/src/tools/prospectOutreachTools.ts`
- Input: company name, industry, pain point, channel preference
- Output: personalized first-touch messages for WhatsApp, Email, LinkedIn
- Spanish default, English on request
- Builds on patterns from `coldOutreachCoachTools.ts`

### Step 2.2: WhatsApp Sequence Generator
**File:** `kitz_os/src/tools/whatsappSequenceTools.ts`
- Input: prospect name, company, industry, pain point, relevant KitZ module
- Output: 5-touch sequence (Day 1, 3, 5, 7, 10) with <160 char messages
- Each message demonstrates KitZ capability inline
- Flags which steps can be automated via kitz-brain cron
- Builds on `dripCampaignTools.ts` patterns

### Step 2.3: Competitive Battlecard Agent
**File:** `kitz_os/src/tools/battlecardTools.ts`
- Input: prospect name, competitor name
- Output: likely reason for considering competitor, top 3 KitZ advantages, rebuttal script in Spanish, red flags, closing question
- Hardcoded KitZ differentiators: AI Battery pricing, Yappy/BAC, WhatsApp-first, multi-LLM, Panama compliance, 30+ agents, zero-trust
- Builds on `salesObjectionHandlerTools.ts`

### Step 2.4: Demand Gen Strategist
**File:** `kitz_os/src/tools/demandGenTools.ts`
- Input: offer/product, ICP (industry, role, size), stage (awareness/consideration/decision), channels
- Output: campaign brief, outreach sequence, content calendar, lead magnet ideas, KPIs
- 4 channels: WhatsApp, Email, LinkedIn, Social
- Builds on `marketingSkillsTools.ts`

### Step 2.5: Sales Team AI
**File:** `kitz_os/src/tools/salesTeamTools.ts`
- Tools: qualify_lead, generate_followup, handle_objection, progress_deal, sales_report
- Orchestrates full pipeline: qualification → follow-up → objection handling → close
- Builds on `salesFunnelTools.ts` + `leadQualificationTools.ts`

### Step 2.6: User Intelligence
**File:** `kitz_os/src/tools/userIntelligenceTools.ts`
- Tools: track_contact, score_churn_risk, get_attention_list, contact_summary
- Tracks: active, inactive, at-risk, prospects
- Churn scoring based on last activity, engagement, payment status
- "Who needs attention today" daily report

### Step 2.7: Partner Reseller Kit Generator
**File:** `kitz_os/src/tools/partnerResellerTools.ts`
- Input: reseller name, company, client vertical, current services
- Output: co-branded one-pager (Spanish), 5-min pitch script, commission structure
- Positions as "[Reseller] powered by KitZ"
- Yappy/BAC mandatory in payment section

### Step 2.8: Onboarding Assistant
**File:** `kitz_os/src/tools/onboardingAssistantTools.ts`
- Tools: start_onboarding_chat, route_to_module, capture_needs
- Client-facing chatbot that walks through KitZ, captures needs, routes to correct module
- Builds on `customerOnboardingTools.ts`

### Step 2.9: Content Engine Enhancement
**File:** `kitz_os/src/tools/contentEngine.ts` (existing — enhance)
- Add: `content_linkedin_post` tool — topic in, LinkedIn post out (150-250 words, bold hook, hashtags)
- Add: `content_whatsapp_broadcast` tool — topic in, WhatsApp broadcast out (<300 chars)
- KitZ brand voice: direct, confident, LATAM-focused, automation-first
- Reference real infrastructure in content (connector, brain, aos, battery, llm-hub)

---

## Batch 3: RenewFlow (Standalone)

### Step 3.1: Scaffold RenewFlow
- Separate directory: `/Users/fliaroach/kitzV1/renewflow/`
- React + Vite + Tailwind (same design system)
- Core features: TPM/OEM quoting, renewal pipeline, reseller portal, end-customer self-service
- Own package.json, own deploy target

---

## Design System (shared across all)

```
Background: #0A0A0F (kitz-dark)
Surface:    #111118 (kitz-surface)
Border:     #1E1E2A (kitz-border)
Primary:    #7C3AED / #A855F7 (kitz-deep / kitz-purple)
Success:    #22C55E (kitz-green)
Warning:    #F59E0B (kitz-yellow)
Error:      #EF4444 (kitz-red)
Text:       #E5E7EB (kitz-text)
Muted:      #6B7280 (kitz-muted)
Font mono:  JetBrains Mono
Font sans:  Inter
```

Already defined in `UI:UX/kitz-workspace/src/styles.css` as CSS custom properties.

---

## Files to Modify/Create

### kitz-workspace (Batch 1)
- **Modify:** `package.json` — add react-router-dom, recharts, framer-motion
- **Modify:** `src/App.tsx` — wrap with BrowserRouter, add routes
- **Create:** `src/components/nav/Sidebar.tsx` — navigation sidebar
- **Create:** `src/components/layout/PageLayout.tsx` — shared page wrapper
- **Create:** `src/pages/LiveDemo.tsx`
- **Create:** `src/pages/ROICalculator.tsx`
- **Create:** `src/pages/BatteryCalculator.tsx`
- **Create:** `src/pages/ProposalGenerator.tsx`
- **Create:** `src/pages/CommandCenter.tsx`
- **Create:** `src/pages/OnboardingFlow.tsx`

### kitz_os (Batch 2)
- **Modify:** `src/tools/registry.ts` — register 8 new modules
- **Modify:** `src/tools/contentEngine.ts` — add linkedin + whatsapp tools
- **Create:** `src/tools/prospectOutreachTools.ts`
- **Create:** `src/tools/whatsappSequenceTools.ts`
- **Create:** `src/tools/battlecardTools.ts`
- **Create:** `src/tools/demandGenTools.ts`
- **Create:** `src/tools/salesTeamTools.ts`
- **Create:** `src/tools/userIntelligenceTools.ts`
- **Create:** `src/tools/partnerResellerTools.ts`
- **Create:** `src/tools/onboardingAssistantTools.ts`

### RenewFlow (Batch 3)
- **Create:** `renewflow/` — full React app scaffold

---

## Verification

1. `cd UI:UX/kitz-workspace && npm run dev` — all 6 SPA pages render, navigation works
2. `cd kitz_os && npx tsc --noEmit` — zero type errors
3. Each agent tool invocable via registry: `registry.invoke('tool_name', { ... })`
4. Sidebar navigation shows all tools by category
5. Design system consistent across all pages (dark bg, purple accent, JetBrains Mono)
