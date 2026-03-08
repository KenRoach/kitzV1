/**
 * Gateway user persistence — Supabase REST API when configured, in-memory fallback.
 * Copied from kitz-gateway/src/db.ts for embedding auth routes in kitz-os.
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

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
// Use Supabase REST API if both URL and key are set (DATABASE_URL not required)
const USE_SUPABASE = !!(SUPABASE_URL && SUPABASE_KEY);

// Log persistence mode on module load
if (USE_SUPABASE) {
  console.log('[gatewayDb] User persistence: Supabase REST API');
} else {
  console.log('[gatewayDb] ⚠ User persistence: IN-MEMORY ONLY (users lost on restart). Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for production.');
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

/** Find user by email — Supabase first, then memory fallback */
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.toLowerCase();

  if (USE_SUPABASE) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(normalized)}&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
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

  return memoryUsers.get(normalized) ?? null;
}

/** Create a new user — Supabase first, then memory fallback */
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

  if (USE_SUPABASE) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
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

  // Always save to memory as backup
  memoryUsers.set(normalized, user);
  return user;
}

/** Update user fields (for Google OAuth merge) */
export async function updateUser(email: string, updates: Partial<Pick<UserRecord, 'googleId' | 'picture' | 'authProvider'>>): Promise<void> {
  const normalized = email.toLowerCase();

  if (USE_SUPABASE) {
    try {
      const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.googleId !== undefined) body.google_id = updates.googleId;
      if (updates.picture !== undefined) body.picture = updates.picture;
      if (updates.authProvider !== undefined) body.auth_provider = updates.authProvider;

      await fetch(
        `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(normalized)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5_000),
        },
      );
    } catch { /* best effort */ }
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
  if (!USE_SUPABASE) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ password_hash: newHash }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch { /* best-effort upgrade */ }
  // Also update memory
  const memUser = memoryUsers.get(email.toLowerCase());
  if (memUser) memUser.passwordHash = newHash;
}

// ── Phone / WhatsApp identity (Phase 1b) ──────────────────────────────

/** Find user by phone number (E.164 format, e.g. +50761234567) */
export async function findUserByPhone(phone: string): Promise<UserRecord | null> {
  if (!phone) return null;

  if (USE_SUPABASE) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/users?phone=eq.${encodeURIComponent(phone)}&limit=1`,
        {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
          signal: AbortSignal.timeout(5_000),
        },
      );
      if (res.ok) {
        const rows = await res.json() as Record<string, unknown>[];
        if (rows.length > 0) return rowToUser(rows[0]);
      }
    } catch { /* fall through */ }
  }

  // In-memory fallback: scan by phone
  for (const u of memoryUsers.values()) {
    if ((u as any).phone === phone) return u;
  }
  return null;
}

/** Create a phone-only user (WhatsApp magic-link signup) */
export async function createUserByPhone(
  phone: string,
  name: string,
): Promise<UserRecord> {
  const user: UserRecord = {
    id: randomUUID(),
    email: `${phone.replace(/\+/g, '')}@phone.kitz.services`, // synthetic email for backward compat
    name,
    passwordHash: '',
    orgId: randomUUID(),
    createdAt: new Date().toISOString(),
    authProvider: 'email', // will become 'whatsapp' after migration runs
  };

  if (USE_SUPABASE) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          id: user.id, email: user.email, name: user.name,
          password_hash: '', org_id: user.orgId,
          auth_provider: 'email', phone,
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

  (user as any).phone = phone;
  memoryUsers.set(user.email, user);
  return user;
}

/** Link a WhatsApp JID to an existing user */
export async function linkWhatsAppToUser(userId: string, phone: string, whatsappJid: string): Promise<void> {
  if (USE_SUPABASE) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ phone, whatsapp_jid: whatsappJid, updated_at: new Date().toISOString() }),
        signal: AbortSignal.timeout(5_000),
      });
    } catch { /* best effort */ }
  }
}

// ── Magic-Link Tokens ─────────────────────────────────────────────────

export interface MagicLinkToken {
  id: string;
  userId: string | null;
  phone: string;
  token: string;
  expiresAt: string;
  usedAt: string | null;
}

const memoryTokens = new Map<string, MagicLinkToken>();

/** Create a magic-link token for a phone number (10 min expiry) */
export async function createMagicLinkToken(phone: string, userId: string | null): Promise<MagicLinkToken> {
  const token = randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const record: MagicLinkToken = { id: randomUUID(), userId, phone, token, expiresAt, usedAt: null };

  if (USE_SUPABASE) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/magic_link_tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          id: record.id, user_id: userId, phone, token, expires_at: expiresAt,
        }),
        signal: AbortSignal.timeout(5_000),
      });
    } catch { /* fall through to memory */ }
  }

  memoryTokens.set(token, record);
  return record;
}

/** Verify and consume a magic-link token. Returns the token record if valid. */
export async function verifyMagicLinkToken(token: string): Promise<MagicLinkToken | null> {
  // Try Supabase first
  if (USE_SUPABASE) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/magic_link_tokens?token=eq.${encodeURIComponent(token)}&used_at=is.null&limit=1`,
        {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
          signal: AbortSignal.timeout(5_000),
        },
      );
      if (res.ok) {
        const rows = await res.json() as Record<string, unknown>[];
        if (rows.length > 0) {
          const row = rows[0];
          const expiresAt = new Date(String(row.expires_at));
          if (expiresAt < new Date()) return null; // expired

          // Mark as used
          await fetch(`${SUPABASE_URL}/rest/v1/magic_link_tokens?id=eq.${row.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
            body: JSON.stringify({ used_at: new Date().toISOString() }),
            signal: AbortSignal.timeout(5_000),
          });

          return {
            id: String(row.id), userId: row.user_id ? String(row.user_id) : null,
            phone: String(row.phone), token: String(row.token),
            expiresAt: String(row.expires_at), usedAt: new Date().toISOString(),
          };
        }
      }
    } catch { /* fall through */ }
  }

  // Memory fallback
  const record = memoryTokens.get(token);
  if (!record || record.usedAt) return null;
  if (new Date(record.expiresAt) < new Date()) return null;
  record.usedAt = new Date().toISOString();
  memoryTokens.delete(token);
  return record;
}
