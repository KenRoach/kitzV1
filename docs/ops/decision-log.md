# Decision Log

## 2026-02-18 — Add baseline ops metrics endpoint in xyz88-io
- **Decision:** Added lightweight in-memory metrics telemetry and `/api/ops/metrics`.
- **Why:** Required minimum metrics were missing (p95 latency, error rate by route, auth failures, conversion, top feature usage, confusing step dropoff).
- **Evidence:** No prior route exposing operational KPIs; recurring operator requirement in ops directives.
- **Expected impact:** Faster daily triage and evidence-based prioritization.
- **Rollback:** Revert `xyz88-io/src/index.ts` and `xyz88-io/src/index.test.ts` to previous commit.

## 2026-02-18 — Establish ops artifacts scaffold
- **Decision:** Added `docs/ops/*`, runbooks, and site changelog skeleton.
- **Why:** Weekly loop requires persistent artifacts for scorecards, decisions, and runbooks.
- **Evidence:** Artifacts were absent in repo.
- **Expected impact:** Better continuity and auditability of operational decisions.
- **Rollback:** Remove docs files if process changes.
