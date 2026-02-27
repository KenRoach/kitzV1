# SOP: Browser Agent Automation

## Purpose
AI-powered browser automation for repetitive online tasks (competitor research, form filling, data extraction, marketplace management).

## Trigger
- User requests web task ("revisa precios en MercadoLibre")
- Scheduled competitor price monitoring
- Compliance form deadlines (Panama government sites)
- Marketplace listing management

## Flow
1. **Receive task** → Parse goal + target URL
2. **Plan** → `brain/skills/browserAgent.ts` (Sonnet tier) → step-by-step plan
3. **Review** → Present plan to user, flag high-risk actions (draft-first)
4. **Execute** → Stagehand SDK runs plan against real browser
5. **Report** → Return extracted data + screenshots

## Risk Levels
| Level | Examples | Approval |
|-------|----------|----------|
| Low | Read pages, extract prices, take screenshots | Auto-approved |
| Medium | Fill forms, create accounts, post content | User confirmation |
| High | Submit payments, delete accounts, legal filings | Explicit approval + confirmation |

## AI Battery Cost
- Planning: ~1.5 credits
- Execution: ~0.5 credits per step (observation/extraction)

## Runtime Options
- **Stagehand** (TypeScript) — recommended for KITZ stack
  - `act()` for single actions, `extract()` for data, `agent()` for multi-step
- **Browser-Use** (Python) — alternative for complex autonomous tasks
- **Browserbase** — cloud browser hosting for production

## Safety Rules
- Never submit payments without explicit user approval
- Never delete data or accounts
- Respect rate limits on target sites
- Log all browser actions with traceId
- Screenshot before/after critical actions

## Reference Repos
- browserbase/stagehand — TypeScript browser SDK (10k+ stars)
- browser-use/browser-use — Python agent framework (50k+ stars)
- Skyvern-AI/skyvern — visual browser agent
