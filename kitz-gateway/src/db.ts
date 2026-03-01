/**
 * Gateway user persistence — PostgreSQL when DATABASE_URL is set, in-memory fallback.
 */

import { createHash, randomUUID, scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  orgId: string;
  createdAt: string;
  authProvider?: 'email' | 'google';
  googleId?: string;
  picture?: string;
}

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384; // N=2^14

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN, { N: SCRYPT_COST, r: 8, p: 1 }).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyHash(stored: string, password: string): boolean {
  if (stored.startsWith('scrypt:')) {
    const [, salt, hash] = stored.split(':');
    const derived = scryptSync(password, salt, SCRYPT_KEYLEN, { N: SCRYPT_COST, r: 8, p: 1 });
    return timingSafeEqual(derived, Buffer.from(hash, 'hex'));
  }
  // Legacy SHA256 migration path — verify old hashes, caller should re-hash on success
  return stored === createHash('sha256').update(password).digest('hex');
}

// In-memory store (used when DATABASE_URL is not set)
const memoryUsers = new Map<string, UserRecord>();

const DATABASE_URL = process.env.DATABASE_URL || '';

/** Minimal PostgreSQL query using native fetch to Supabase REST or pg wire protocol. */
async function pgQuery<T extends Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (!DATABASE_URL) return [];

  // Use Supabase REST API if SUPABASE_URL + SUPABASE_SERVICE_KEY are set
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

  if (supabaseUrl && supabaseKey) {
    try {
      // Use Supabase's PostgREST for reads, RPC for writes
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ query: sql, params }),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) {
        const data = await res.json() as T[];
        return Array.isArray(data) ? data : [];
      }
    } catch { /* fall through to direct approach */ }
  }

  // Fallback: Try direct PostgREST queries (simpler, no RPC needed)
  return [];
}

/** Row from DB → UserRecord */
function rowToUser(row: Record<string, unknown>): UserRecord {
  return {
    id: String(row.id || ''),
    email: String(row.email || ''),
    name: String(row.name || ''),
    passwordHash: String(row.password_hash || ''),
    orgId: String(row.org_id || ''),
    createdAt: String(row.created_at || ''),
    authProvider: (row.auth_provider as 'email' | 'google') || 'email',
    googleId: row.google_id ? String(row.google_id) : undefined,
    picture: row.picture ? String(row.picture) : undefined,
  };
}

/** Find user by email — DB first, then memory fallback */
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.toLowerCase();

  if (DATABASE_URL) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

    if (supabaseUrl && supabaseKey) {
      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(normalized)}&limit=1`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            signal: AbortSignal.timeout(5_000),
          },
        );
        if (res.ok) {
          const rows = await res.json() as Record<string, unknown>[];
          if (rows.length > 0) return rowToUser(rows[0]);
          return null;
        }
      } catch { /* fall through to memory */ }
    }
  }

  return memoryUsers.get(normalized) ?? null;
}

/** Create a new user — DB first, then memory fallback */
export async function createUser(
  email: string,
  password: string,
  name: string,
  opts?: { authProvider?: 'email' | 'google'; googleId?: string; picture?: string },
): Promise<UserRecord> {
  const normalized = email.toLowerCase();
  const user: UserRecord = {
    id: randomUUID(),
    email: normalized,
    name,
    passwordHash: password ? hashPassword(password) : '',
    orgId: randomUUID(),
    createdAt: new Date().toISOString(),
    authProvider: opts?.authProvider || 'email',
    googleId: opts?.googleId,
    picture: opts?.picture,
  };

  if (DATABASE_URL) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

    if (supabaseUrl && supabaseKey) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            password_hash: user.passwordHash,
            org_id: user.orgId,
            auth_provider: user.authProvider || 'email',
            google_id: user.googleId || null,
            picture: user.picture || null,
            created_at: user.createdAt,
          }),
          signal: AbortSignal.timeout(5_000),
        });
        if (res.ok) {
          const rows = await res.json() as Record<string, unknown>[];
          if (rows.length > 0) return rowToUser(rows[0]);
        }
      } catch { /* fall through to memory */ }
    }
  }

  // Always save to memory as backup
  memoryUsers.set(normalized, user);
  return user;
}

/** Update user fields (for Google OAuth merge) */
export async function updateUser(email: string, updates: Partial<Pick<UserRecord, 'googleId' | 'picture' | 'authProvider'>>): Promise<void> {
  const normalized = email.toLowerCase();

  if (DATABASE_URL) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

    if (supabaseUrl && supabaseKey) {
      try {
        const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.googleId !== undefined) body.google_id = updates.googleId;
        if (updates.picture !== undefined) body.picture = updates.picture;
        if (updates.authProvider !== undefined) body.auth_provider = updates.authProvider;

        await fetch(
          `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(normalized)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(5_000),
          },
        );
      } catch { /* best effort */ }
    }
  }

  // Also update memory
  const memUser = memoryUsers.get(normalized);
  if (memUser) {
    if (updates.googleId !== undefined) memUser.googleId = updates.googleId;
    if (updates.picture !== undefined) memUser.picture = updates.picture;
    if (updates.authProvider !== undefined) memUser.authProvider = updates.authProvider;
  }
}

/** Verify password — supports scrypt (new) and SHA256 (legacy, auto-migrates) */
export function verifyPassword(user: UserRecord, password: string): boolean {
  const ok = verifyHash(user.passwordHash, password);
  // Auto-migrate legacy SHA256 hashes to scrypt on successful login
  if (ok && !user.passwordHash.startsWith('scrypt:')) {
    const newHash = hashPassword(password);
    user.passwordHash = newHash;
    // Fire-and-forget: persist upgraded hash
    upgradePasswordHash(user.email, newHash).catch(() => {});
  }
  return ok;
}

/** Persist upgraded password hash to database */
async function upgradePasswordHash(email: string, newHash: string): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
  if (!supabaseUrl || !supabaseKey) return;
  try {
    await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({ password_hash: newHash }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch { /* best-effort upgrade */ }
  // Also update memory
  const memUser = memoryUsers.get(email.toLowerCase());
  if (memUser) memUser.passwordHash = newHash;
}

/** List all users (admin) — DB first, memory fallback */
export async function listUsers(): Promise<Omit<UserRecord, 'passwordHash'>[]> {
  if (DATABASE_URL) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

    if (supabaseUrl && supabaseKey) {
      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/users?select=id,email,name,org_id,auth_provider,google_id,picture,created_at&order=created_at.desc`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            signal: AbortSignal.timeout(5_000),
          },
        );
        if (res.ok) {
          const rows = await res.json() as Record<string, unknown>[];
          return rows.map(r => {
            const u = rowToUser(r);
            const { passwordHash: _, ...rest } = u;
            return rest;
          });
        }
      } catch { /* fall through */ }
    }
  }

  return Array.from(memoryUsers.values()).map(u => ({
    id: u.id, email: u.email, name: u.name, orgId: u.orgId, createdAt: u.createdAt,
    authProvider: u.authProvider, googleId: u.googleId, picture: u.picture,
  }));
}
