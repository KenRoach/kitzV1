/**
 * Email connector DB — Supabase persistence with in-memory fallback.
 * Tables: email_templates, email_consent, email_suppression
 */

const DATABASE_URL = process.env.DATABASE_URL || '';

// ── In-memory fallback stores ──
const memTemplates = new Map<string, { orgId: string; name: string; content: string; updatedAt: string }>();
const memConsent = new Map<string, { contact: string; granted: boolean; updatedAt: string }>();
const memSuppression = new Set<string>();

function supabaseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''}`,
  };
}

// ── Templates ──

export async function upsertTemplate(orgId: string, name: string, content: string): Promise<void> {
  if (DATABASE_URL) {
    await fetch(`${DATABASE_URL}/rest/v1/email_templates`, {
      method: 'POST',
      headers: { ...supabaseHeaders(), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ org_id: orgId, name, content, updated_at: new Date().toISOString() }),
    });
    return;
  }
  memTemplates.set(`${orgId}:${name}`, { orgId, name, content, updatedAt: new Date().toISOString() });
}

export async function getTemplate(orgId: string, name: string): Promise<string | null> {
  if (DATABASE_URL) {
    const res = await fetch(
      `${DATABASE_URL}/rest/v1/email_templates?org_id=eq.${orgId}&name=eq.${name}&select=content&limit=1`,
      { headers: supabaseHeaders() },
    );
    const rows = (await res.json()) as Array<{ content: string }>;
    return rows[0]?.content ?? null;
  }
  return memTemplates.get(`${orgId}:${name}`)?.content ?? null;
}

export async function listTemplates(orgId: string): Promise<Array<{ name: string; updatedAt: string }>> {
  if (DATABASE_URL) {
    const res = await fetch(
      `${DATABASE_URL}/rest/v1/email_templates?org_id=eq.${orgId}&select=name,updated_at&order=name`,
      { headers: supabaseHeaders() },
    );
    const rows = (await res.json()) as Array<{ name: string; updated_at: string }>;
    return rows.map((r) => ({ name: r.name, updatedAt: r.updated_at }));
  }
  return [...memTemplates.values()]
    .filter((t) => t.orgId === orgId)
    .map((t) => ({ name: t.name, updatedAt: t.updatedAt }));
}

// ── Consent ──

export async function setConsent(contact: string, granted: boolean): Promise<void> {
  if (DATABASE_URL) {
    await fetch(`${DATABASE_URL}/rest/v1/email_consent`, {
      method: 'POST',
      headers: { ...supabaseHeaders(), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ contact, granted, updated_at: new Date().toISOString() }),
    });
    return;
  }
  memConsent.set(contact, { contact, granted, updatedAt: new Date().toISOString() });
}

export async function hasConsent(contact: string): Promise<boolean> {
  if (DATABASE_URL) {
    const res = await fetch(
      `${DATABASE_URL}/rest/v1/email_consent?contact=eq.${contact}&select=granted&limit=1`,
      { headers: supabaseHeaders() },
    );
    const rows = (await res.json()) as Array<{ granted: boolean }>;
    return rows[0]?.granted ?? false;
  }
  return memConsent.get(contact)?.granted ?? false;
}

// ── Suppression ──

export async function addToSuppression(email: string): Promise<void> {
  if (DATABASE_URL) {
    await fetch(`${DATABASE_URL}/rest/v1/email_suppression`, {
      method: 'POST',
      headers: { ...supabaseHeaders(), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ email, suppressed_at: new Date().toISOString() }),
    });
    return;
  }
  memSuppression.add(email);
}

export async function isSuppressed(email: string): Promise<boolean> {
  if (DATABASE_URL) {
    const res = await fetch(
      `${DATABASE_URL}/rest/v1/email_suppression?email=eq.${email}&select=email&limit=1`,
      { headers: supabaseHeaders() },
    );
    const rows = (await res.json()) as Array<{ email: string }>;
    return rows.length > 0;
  }
  return memSuppression.has(email);
}

export async function listSuppression(): Promise<string[]> {
  if (DATABASE_URL) {
    const res = await fetch(
      `${DATABASE_URL}/rest/v1/email_suppression?select=email&order=suppressed_at.desc&limit=500`,
      { headers: supabaseHeaders() },
    );
    const rows = (await res.json()) as Array<{ email: string }>;
    return rows.map((r) => r.email);
  }
  return [...memSuppression];
}
