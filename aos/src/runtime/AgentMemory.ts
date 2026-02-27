/**
 * Agent Memory — short-term (in-memory ring buffer) + long-term (Supabase).
 * Each agent gets isolated memory keyed by agent name.
 */

const DATABASE_URL = process.env.DATABASE_URL || '';
const MAX_SHORT_TERM = 10;

export interface MemoryEntry {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  traceId?: string;
}

function supabaseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''}`,
  };
}

export class AgentMemory {
  private shortTerm: MemoryEntry[] = [];

  constructor(private readonly agentName: string) {}

  /** Add a message to short-term memory */
  addMessage(entry: MemoryEntry): void {
    this.shortTerm.push(entry);
    if (this.shortTerm.length > MAX_SHORT_TERM) {
      this.shortTerm.shift();
    }

    // Persist to DB (fire-and-forget)
    if (DATABASE_URL) {
      this.persistEntry(entry).catch(() => {});
    }
  }

  /** Get recent short-term messages as formatted strings */
  getRecentContext(): string[] {
    return this.shortTerm.map(
      (e) => `[${e.role}] ${e.content.slice(0, 200)}`,
    );
  }

  /** Get recent messages as structured entries */
  getRecentEntries(): MemoryEntry[] {
    return [...this.shortTerm];
  }

  /** Clear short-term memory */
  clear(): void {
    this.shortTerm = [];
  }

  /** Load last N entries from long-term storage */
  async loadFromLongTerm(limit: number = MAX_SHORT_TERM): Promise<void> {
    if (!DATABASE_URL) return;

    try {
      const res = await fetch(
        `${DATABASE_URL}/rest/v1/agent_memory?agent_name=eq.${this.agentName}&select=*&order=timestamp.desc&limit=${limit}`,
        { headers: supabaseHeaders() },
      );

      if (!res.ok) return;

      const rows = (await res.json()) as Array<{
        role: string;
        content: string;
        timestamp: string;
        trace_id?: string;
      }>;

      // Load in chronological order (oldest first)
      this.shortTerm = rows.reverse().map((r) => ({
        role: r.role as MemoryEntry['role'],
        content: r.content,
        timestamp: r.timestamp,
        traceId: r.trace_id,
      }));
    } catch {
      // Silently fail — in-memory fallback
    }
  }

  private async persistEntry(entry: MemoryEntry): Promise<void> {
    await fetch(`${DATABASE_URL}/rest/v1/agent_memory`, {
      method: 'POST',
      headers: supabaseHeaders(),
      body: JSON.stringify({
        agent_name: this.agentName,
        role: entry.role,
        content: entry.content,
        timestamp: entry.timestamp,
        trace_id: entry.traceId,
      }),
    });
  }
}
