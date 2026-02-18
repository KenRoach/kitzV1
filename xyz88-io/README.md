# xyz88-io

Lite CRM + order dashboard + mobile checkout links (draft send via queue).

## Core constraints
- Manual mode is always available.
- AI mode is gated by AI Battery balance.

## Conversion telemetry wiring
- Frontend interactions are wired to funnel endpoints:
  - `POST /api/funnel/signup`
  - `POST /api/funnel/first-action`
  - `POST /api/funnel/confusing-step`
- Feedback tags can be recorded via:
  - `POST /api/feedback/tag`

## Ops metrics
- `GET /api/ops/metrics` returns:
  - p95 latency by route
  - error rate by route
  - auth failures
  - conversion metrics
  - top 10 feature usage
  - top feedback tags
  - confusing-step dropoff

## Ops automation scripts
```bash
npm run ops:export-scorecard
npm run ops:check-alerts
npm run ops:update-decision-log
```

## Scheduled checks
- Nightly: `.github/workflows/ops-nightly.yml`
- Weekly correlation: `.github/workflows/ops-weekly-correlation.yml`
