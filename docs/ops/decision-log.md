# Decision Log

## 2026-02-18 — Add baseline ops metrics endpoint in workspace (workspace.kitz.services)
- **Decision:** Added lightweight in-memory metrics telemetry and `/api/ops/metrics`.
- **Why:** Required minimum metrics were missing (p95 latency, error rate by route, auth failures, conversion, top feature usage, confusing step dropoff).
- **Evidence:** No prior route exposing operational KPIs; recurring operator requirement in ops directives.
- **Expected impact:** Faster daily triage and evidence-based prioritization.
- **Rollback:** Revert `workspace (workspace.kitz.services)/src/index.ts` and `workspace (workspace.kitz.services)/src/index.test.ts` to previous commit.

## 2026-02-18 — Establish ops artifacts scaffold
- **Decision:** Added `docs/ops/*`, runbooks, and site changelog skeleton.
- **Why:** Weekly loop requires persistent artifacts for scorecards, decisions, and runbooks.
- **Evidence:** Artifacts were absent in repo.
- **Expected impact:** Better continuity and auditability of operational decisions.
- **Rollback:** Remove docs files if process changes.


## Weekly Correlation Inputs
- Feedback tags source: `docs/ops/feedback-tags.json`
- Metrics source: `GET /api/ops/metrics`

## 2026-02-18 — Weekly feedback/metrics correlation
- **Feedback tags (top):** confusion-checkout (0), slow-page (0), missing-feature (0)
- **Metric reference:** confusingStepDropoff=0, visitor→signup=0
- **Performance reference:** no route sample yet
- **Usage reference:** no feature usage sample yet
- **Decision:** Prioritize fixes where feedback tags and drop-off/performance indicate friction.
