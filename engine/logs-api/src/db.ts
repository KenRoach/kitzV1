/**
 * Logs API DB — Supabase persistence with in-memory fallback.
 * Table: activity_logs
 */

const DATABASE_URL = process.env.DATABASE_URL || ''

export interface LogEntry {
  id: string
  type: 'agent_action' | 'crm' | 'order' | 'message' | 'system' | 'draft'
  actor: { name: string; isAgent: boolean }
  action: string
  detail?: string
  timestamp: string
  traceId?: string
  status?: 'pending' | 'approved' | 'rejected'
  meta?: Record<string, unknown>
}

// In-memory store (always kept for fast reads, synced to DB)
const memLogs: LogEntry[] = []
const MAX_MEM = 10_000

function supabaseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''}`,
  }
}

export async function insertLog(entry: LogEntry): Promise<void> {
  memLogs.unshift(entry)
  if (memLogs.length > MAX_MEM) memLogs.length = MAX_MEM

  if (!DATABASE_URL) return

  await fetch(`${DATABASE_URL}/rest/v1/activity_logs`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify({
      id: entry.id,
      type: entry.type,
      actor_name: entry.actor.name,
      actor_is_agent: entry.actor.isAgent,
      action: entry.action,
      detail: entry.detail,
      timestamp: entry.timestamp,
      trace_id: entry.traceId,
      status: entry.status,
      meta: entry.meta,
    }),
  }).catch(() => {})
}

export async function updateLogStatus(id: string, status: 'approved' | 'rejected'): Promise<LogEntry | null> {
  const mem = memLogs.find((l) => l.id === id)
  if (mem) mem.status = status

  if (DATABASE_URL) {
    await fetch(`${DATABASE_URL}/rest/v1/activity_logs?id=eq.${id}`, {
      method: 'PATCH',
      headers: supabaseHeaders(),
      body: JSON.stringify({ status }),
    }).catch(() => {})
  }

  return mem ?? null
}

export interface LogQuery {
  type?: string
  agentId?: string
  status?: string
  search?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export async function queryLogs(q: LogQuery): Promise<{ entries: LogEntry[]; total: number; hasMore: boolean }> {
  const limit = q.limit || 50
  const offset = q.offset || 0

  // If DB available and we have date-range or search, prefer DB
  if (DATABASE_URL && (q.from || q.to || q.search)) {
    const params: string[] = ['select=*', `order=timestamp.desc`, `limit=${limit}`, `offset=${offset}`]

    if (q.type) params.push(`type=eq.${q.type}`)
    if (q.agentId) params.push(`meta->>agentId=eq.${q.agentId}`)
    if (q.status) params.push(`status=eq.${q.status}`)
    if (q.from) params.push(`timestamp=gte.${q.from}`)
    if (q.to) params.push(`timestamp=lte.${q.to}`)
    if (q.search) params.push(`or=(action.ilike.*${q.search}*,detail.ilike.*${q.search}*)`)

    const res = await fetch(
      `${DATABASE_URL}/rest/v1/activity_logs?${params.join('&')}`,
      { headers: { ...supabaseHeaders(), Prefer: 'count=exact' } },
    )

    const total = Number(res.headers.get('content-range')?.split('/')[1] || '0')
    const rows = (await res.json()) as Array<Record<string, unknown>>

    const entries: LogEntry[] = rows.map((r) => ({
      id: String(r.id),
      type: r.type as LogEntry['type'],
      actor: { name: String(r.actor_name), isAgent: Boolean(r.actor_is_agent) },
      action: String(r.action),
      detail: r.detail ? String(r.detail) : undefined,
      timestamp: String(r.timestamp),
      traceId: r.trace_id ? String(r.trace_id) : undefined,
      status: r.status as LogEntry['status'],
      meta: r.meta as Record<string, unknown> | undefined,
    }))

    return { entries, total, hasMore: offset + limit < total }
  }

  // In-memory filtering
  let filtered = [...memLogs]

  if (q.type) filtered = filtered.filter((l) => l.type === q.type)
  if (q.agentId) filtered = filtered.filter((l) => l.meta?.agentId === q.agentId)
  if (q.status) filtered = filtered.filter((l) => l.status === q.status)
  if (q.from) filtered = filtered.filter((l) => l.timestamp >= q.from!)
  if (q.to) filtered = filtered.filter((l) => l.timestamp <= q.to!)
  if (q.search) {
    const term = q.search.toLowerCase()
    filtered = filtered.filter(
      (l) => l.action.toLowerCase().includes(term) || (l.detail?.toLowerCase().includes(term) ?? false),
    )
  }

  const page = filtered.slice(offset, offset + limit)
  return { entries: page, total: filtered.length, hasMore: offset + limit < filtered.length }
}

export function getMemLogs(): LogEntry[] {
  return memLogs
}
