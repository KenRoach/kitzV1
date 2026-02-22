# Weekly Scorecard

_Last updated: 2026-02-18_

## Reliability
- Uptime: TBD (wire from monitoring)
- Error rate: tracked via `GET /api/ops/metrics` in xyz88-io (workspace.kitz.services)
- p95 latency: tracked via `GET /api/ops/metrics` in xyz88-io (workspace.kitz.services)
- Deploy count: TBD
- Incidents: TBD

## Security
- Auth failures: tracked via `GET /api/ops/metrics`
- Token handling: gateway one-time token pattern only
- Secret leak checks: run before each merge

## Growth / Product
- Conversion (visitor → signup → first action): tracked via funnel endpoints + `GET /api/ops/metrics`
- Top 10 feature usage: tracked via `GET /api/ops/metrics`
- Confusing steps drop-off: tracked via `/api/funnel/confusing-step`
- Top user pain points (weekly):
  1. TBD
  2. TBD
  3. TBD

## Cost
- Infra cost trend: TBD
- Optimization actions this week: TBD

## Links
- xyz88 metrics: `/api/ops/metrics`
- Compliance status: `kitz-services/compliance/panama`


<!-- NIGHTLY_SNAPSHOT_START -->
## Nightly Snapshot (2026-02-18T23:19:33.523Z)

- Auth failures: 0
- Confusing step dropoff: 0
- Conversion visitor→signup: 0
- Conversion signup→first-action: 0

### Route performance (top sampled)

### Feature usage (top 10)
<!-- NIGHTLY_SNAPSHOT_END -->
