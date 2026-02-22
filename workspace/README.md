# workspace

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


## Lovable sync
- Every automated ops content update attempts to push a webhook payload to Lovable.
- Configure `LOVABLE_WEBHOOK_URL` and `LOVABLE_WEBHOOK_TOKEN` in runtime/secrets.
- If webhook is unavailable, payloads are appended to `docs/ops/lovable-sync-queue.md` for manual operator sync.


## Full validation process
Run the full gate locally before merge:

```bash
npm run validate:full
```

This executes typecheck, lint, tests, nightly exporter, alerts check, weekly correlation update, and smoke validation of key routes/constraints.
