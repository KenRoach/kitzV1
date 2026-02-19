# Agent Operating System (AOS)

Minimal framework-agnostic orchestration layer for Kitz agents.

## What it includes

- 12 always-on core agents (C-suite + heads) defined in `config/agents.json`
- Governance agents for approvals, alignment, feedback coaching, focus/capacity, and capital allocation
- External audit councils (`US_MODEL_A`, `US_MODEL_B`, `CN_MODEL`) as advisory model slots
- Digital board members with independent voting stubs
- Event bus with middleware policy gates and persisted institutional memory (`aos/data/*.ndjson`)

## Policy guarantees

- Advisory + PR-based only (`deploy_execute` blocked)
- Reviewer approval required for submission recommendations
- CFO + CapitalAllocation required for capital allocation recommendations
- CTO + Security required for security change recommendations
- Focus/capacity and ad-hoc spawn limits enforceable (`max_ad_hoc=12`, `max_active_ad_hoc=3`)
- Incentive conflict warnings appended for KPI conflicts

## Event types

- `KPI_CHANGED`
- `CUSTOMER_FEEDBACK_RECEIVED`
- `BUG_REPORTED`
- `INCIDENT_DETECTED`
- `PR_OPENED`
- `PR_READY_FOR_REVIEW`
- `REVIEW_REJECTED`
- `COMPLIANCE_UPDATE_FOUND`
- `COST_SPIKE_DETECTED`
- `ROADMAP_CHANGE_PROPOSED`
- `CAPITAL_ALLOCATION_CYCLE`
- `BOARD_REVIEW_REQUESTED`
- plus advisory outputs: `ORG_DIGEST_READY`, `EXTERNAL_AUDIT_REPORT_READY`, `BOARD_REVIEW_COMPLETE`, `PROPOSAL_CREATED`

## Run locally

```bash
cd aos
npm install
node run daily
node run weekly-board
node run simulate --event INCIDENT_DETECTED
```

## Tests

```bash
cd aos
npm test
```

## Add a new ad-hoc agent

1. Ensure owner core agent has `can_spawn_ad_hoc=true` in `config/agents.json`.
2. Trigger via medium+ severity event or explicit owner request.
3. Generate proposal via `ParallelSolutionsAgent.propose(...)`.
4. Ensure proposal carries TTL and owner sign-off constraints.
