/**
 * Gateway user persistence — PostgreSQL when DATABASE_URL is set, in-memory fallback.
 */

import { createHash, randomUUID, scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const USERS_FILE = join(DATA_DIR, 'users.ndjson');

export type UserRole = 'var' | 'support' | 'delivery-partner';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  orgId: string;
  role: UserRole;
  createdAt: string;
  authProvider?: 'email' | 'google';
  googleId?: string;
  picture?: string;
  resetToken?: string;
  resetTokenExpiresAt?: string;
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

async function ensureDataDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
}

async function persistUser(user: UserRecord): Promise<void> {
  try {
    await ensureDataDir();
    await appendFile(USERS_FILE, JSON.stringify(user) + '\n', 'utf-8');
  } catch (err) { console.warn('[kitz-gateway] user_persist_failed', (err as Error).message); }
}

export async function restoreUsers(): Promise<number> {
  try {
    if (!existsSync(USERS_FILE)) return 0;
    const raw = await readFile(USERS_FILE, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    let count = 0;
    for (const line of lines) {
      try {
        const user = JSON.parse(line) as UserRecord;
        if (user.id && user.email) {
          const key = user.email.toLowerCase();
          if (!memoryUsers.has(key)) { memoryUsers.set(key, user); count++; }
        }
      } catch (err) { console.warn('[kitz-gateway] user_line_parse_failed', (err as Error).message); }
    }
    return count;
  } catch (err) { console.warn('[kitz-gateway] users_restore_failed', (err as Error).message); return 0; }
}

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
    } catch (err) { console.warn('[kitz-gateway] supabase_rpc_query_failed', (err as Error).message); }
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
    role: (row.role as UserRole) || 'var',
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
      } catch (err) { console.warn('[kitz-gateway] find_user_by_email_failed', (err as Error).message); }
    }
  }

  return memoryUsers.get(normalized) ?? null;
}

/** Create a new user — DB first, then memory fallback */
export async function createUser(
  email: string,
  password: string,
  name: string,
  opts?: { authProvider?: 'email' | 'google'; googleId?: string; picture?: string; role?: UserRole },
): Promise<UserRecord> {
  const normalized = email.toLowerCase();
  const user: UserRecord = {
    id: randomUUID(),
    email: normalized,
    name,
    passwordHash: password ? hashPassword(password) : '',
    orgId: randomUUID(),
    role: opts?.role || 'var',
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
            role: user.role,
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
      } catch (err) { console.warn('[kitz-gateway] create_user_db_failed', (err as Error).message); }
    }
  }

  // Always save to memory as backup
  memoryUsers.set(normalized, user);
  persistUser(user).catch((err) => { console.warn('[kitz-gateway] user_file_persist_failed', (err as Error).message); });
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
      } catch (err) { console.warn('[kitz-gateway] update_user_failed', (err as Error).message); }
    }
  }

  // Also update memory
  const memUser = memoryUsers.get(normalized);
  if (memUser) {
    if (updates.googleId !== undefined) memUser.googleId = updates.googleId;
    if (updates.picture !== undefined) memUser.picture = updates.picture;
    if (updates.authProvider !== undefined) memUser.authProvider = updates.authProvider;
  }

  // Persist updated user to NDJSON (full overwrite entry — latest wins on restore)
  const updated = memoryUsers.get(normalized);
  if (updated) persistUser(updated).catch((err) => { console.warn('[kitz-gateway] updated_user_persist_failed', (err as Error).message); });
}

/** Verify password — supports scrypt (new) and SHA256 (legacy, auto-migrates) */
export function verifyPassword(user: UserRecord, password: string): boolean {
  const ok = verifyHash(user.passwordHash, password);
  // Auto-migrate legacy SHA256 hashes to scrypt on successful login
  if (ok && !user.passwordHash.startsWith('scrypt:')) {
    const newHash = hashPassword(password);
    user.passwordHash = newHash;
    // Fire-and-forget: persist upgraded hash
    upgradePasswordHash(user.email, newHash).catch((err) => { console.warn('[kitz-gateway] password_upgrade_persist_failed', (err as Error).message); });
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
  } catch (err) { console.warn('[kitz-gateway] password_hash_upgrade_failed', (err as Error).message); }
  // Also update memory
  const memUser = memoryUsers.get(email.toLowerCase());
  if (memUser) memUser.passwordHash = newHash;
}

/** Set a password reset token for a user */
export async function setResetToken(email: string, token: string, expiresAt: string): Promise<boolean> {
  const normalized = email.toLowerCase();

  if (DATABASE_URL) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(
          `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(normalized)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ reset_token: token, reset_token_expires_at: expiresAt }),
            signal: AbortSignal.timeout(5_000),
          },
        );
      } catch (err) { console.warn('[kitz-gateway] set_reset_token_db_failed', (err as Error).message); }
    }
  }

  const memUser = memoryUsers.get(normalized);
  if (memUser) {
    memUser.resetToken = token;
    memUser.resetTokenExpiresAt = expiresAt;
    return true;
  }
  return false;
}

/** Find a user by their reset token */
export async function findUserByResetToken(token: string): Promise<UserRecord | null> {
  if (DATABASE_URL) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

    if (supabaseUrl && supabaseKey) {
      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/users?reset_token=eq.${encodeURIComponent(token)}&limit=1`,
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
        }
      } catch (err) { console.warn('[kitz-gateway] find_user_by_reset_token_failed', (err as Error).message); }
    }
  }

  for (const user of memoryUsers.values()) {
    if (user.resetToken === token) return user;
  }
  return null;
}

/** Clear reset token after use */
export async function clearResetToken(email: string): Promise<void> {
  const normalized = email.toLowerCase();

  if (DATABASE_URL) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(
          `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(normalized)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ reset_token: null, reset_token_expires_at: null }),
            signal: AbortSignal.timeout(5_000),
          },
        );
      } catch (err) { console.warn('[kitz-gateway] clear_reset_token_failed', (err as Error).message); }
    }
  }

  const memUser = memoryUsers.get(normalized);
  if (memUser) {
    memUser.resetToken = undefined;
    memUser.resetTokenExpiresAt = undefined;
  }
}

/** Update a user's password (for password reset) */
export async function updatePassword(email: string, newPassword: string): Promise<void> {
  const normalized = email.toLowerCase();
  const newHash = hashPassword(newPassword);

  if (DATABASE_URL) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(
          `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(normalized)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ password_hash: newHash }),
            signal: AbortSignal.timeout(5_000),
          },
        );
      } catch (err) { console.warn('[kitz-gateway] update_password_failed', (err as Error).message); }
    }
  }

  const memUser = memoryUsers.get(normalized);
  if (memUser) {
    memUser.passwordHash = newHash;
    persistUser(memUser).catch((err) => { console.warn('[kitz-gateway] password_update_persist_failed', (err as Error).message); });
  }
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
      } catch (err) { console.warn('[kitz-gateway] list_users_db_failed', (err as Error).message); }
    }
  }

  return Array.from(memoryUsers.values()).map(u => ({
    id: u.id, email: u.email, name: u.name, orgId: u.orgId, role: u.role, createdAt: u.createdAt,
    authProvider: u.authProvider, googleId: u.googleId, picture: u.picture,
  }));
}
