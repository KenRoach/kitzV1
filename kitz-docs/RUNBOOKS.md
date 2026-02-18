# RUNBOOKS

## Incident Response
1. Identify impacted `orgId` and collect `traceId` chain from gateway + service logs.
2. Block affected scope/routes at gateway policy layer.
3. Pause workers in notifications queue if repeated delivery failures occur.
4. Route failed jobs to DLQ and replay once dependency is healthy.
5. Publish incident notes and permanent fixes.

## Key Rotation
1. Generate replacement provider credentials in admin-kitz-services.
2. Update environment variables in gateway/connectors/llm-hub.
3. Restart services and verify health + smoke checks.
4. Revoke old credentials and verify audit logs.

## Webhook Recovery
1. Validate provider signature verification settings.
2. Reprocess queued webhook events by traceId.
3. Confirm ledger and order/payment statuses are consistent.
