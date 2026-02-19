# Incident Response Runbook

1. Confirm scope: affected routes/orgId/traceId.
2. Check top errors and latency from `GET /api/ops/metrics`.
3. If severe, rollback latest deploy or disable affected feature flag/path.
4. Validate manual mode availability and AI credit gating.
5. Post incident note with root cause and preventive action.
