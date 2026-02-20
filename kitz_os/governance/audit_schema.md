# Audit Logging Schema

## What Gets Logged
- Every tool invocation (name, args, result, duration)
- Every policy check (pass/fail, risk level)
- Every approval decision (approved/rejected, by whom)
- Every cadence report generation
- Every AI credit consumption
- Every kill switch state change

## Where
- **Primary**: agent_audit_log table (Supabase) — immutable, queryable
- **Secondary**: local NDJSON file — fast append, local backup

## Schema
```json
{
  "id": "uuid",
  "business_id": "uuid",
  "agent_type": "string",
  "action": "string",
  "tool_name": "string",
  "args": {},
  "result_summary": "string",
  "risk_level": "low|medium|high|critical",
  "trace_id": "string",
  "duration_ms": 0,
  "credits_consumed": 0,
  "created_at": "timestamp"
}
```

## Retention
- Supabase: indefinite
- Local NDJSON: 90 days
