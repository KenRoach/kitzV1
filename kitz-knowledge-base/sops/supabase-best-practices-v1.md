# Supabase Best Practices SOP v1

**Owner:** CTO Agent
**Type:** technical

## Summary
Kitz uses Supabase (PostgreSQL + Edge Functions + Auth + Realtime) for persistence. This SOP captures production best practices.

## Edge Functions

### Architecture
- Serverless TypeScript functions distributed globally at the edge
- Low-latency for API endpoints, webhooks, real-time processing
- Kitz uses for: workspace MCP, tool execution

### Database Operations
- `supabase-js` does NOT support transactions (PostgREST limitation)
- Workaround: Write SQL functions in Postgres, call via RPC from Edge Functions
- Always use RPC for multi-step operations that need atomicity

### Background Jobs
- Use `pg_cron` to poke Edge Functions every minute
- Function wakes up, checks for "pending" jobs, processes, sleeps
- Better than polling from client side

### Scheduling
- Supabase supports scheduling Edge Functions via `pg_cron`
- Kitz uses for: daily/weekly cadence reports, battery resets

## Real-Time

### Best Practices
- Enable real-time ONLY on necessary tables
- Disable UPDATE/DELETE events if you only need INSERT notifications
- Don't broadcast every table change — it's expensive

### Kitz Tables with Real-Time
- `agent_audit_log` — AI Battery tracking
- `artifacts` — Tool output persistence
- Workspace tables — CRM, orders, tasks

## Security (Non-Negotiable)

### Row-Level Security (RLS)
- Enable RLS on ALL user-facing tables
- Define granular policies using `auth.uid()`
- Org isolation via `org_id` column + RLS policy
- Test RLS policies — a misconfigured policy = data leak

### Edge Function Auth
- Validate JWT in every Edge Function
- Use `supabase.auth.getUser()` to verify caller
- Never trust client-side data without server validation

## Performance

### Indexing
- Index frequently queried columns
- Use `EXPLAIN ANALYZE` to find slow queries
- Monitor with `pg_stat_statements`

### Connection Pooling
- Supabase handles this automatically (hosted)
- For self-hosted: use PgBouncer
- Watch max client limits

## Migration Patterns
- Kitz migrations in `database/migrations/`
- Seed data in `database/seed/`
- Always test migrations on staging before production
- Use `supabase db push` for schema changes

## Rules
- RLS on every user-facing table — no exceptions
- Transactions via SQL functions + RPC, never raw multi-query
- Real-time only where needed — disable unnecessary events
- Index before you complain about performance
- Edge Functions for compute, Postgres for logic (stored procedures)
