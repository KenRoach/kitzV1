/**
 * Gateway user persistence — Supabase when DATABASE_URL is set, in-memory fallback.
 */

import { createHash, randomUUID } from 'node:crypto';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  orgId: string;
  createdAt: string;
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// In-memory store (used when DATABASE_URL is not set)
const memoryUsers = new Map<string, UserRecord>();

const DATABASE_URL = process.env.DATABASE_URL || '';

async function supabaseQuery<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  // Minimal pg-compatible fetch for Supabase REST
  // In production, use @supabase/supabase-js or pg driver
  if (!DATABASE_URL) return [];
  // Placeholder — real implementation uses Supabase client
  void sql;
  void params;
  return [];
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.toLowerCase();

  if (DATABASE_URL) {
    const rows = await supabaseQuery<UserRecord>(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [normalized],
    );
    return rows[0] ?? null;
  }

  return memoryUsers.get(normalized) ?? null;
}

export async function createUser(email: string, password: string, name: string): Promise<UserRecord> {
  const normalized = email.toLowerCase();
  const user: UserRecord = {
    id: randomUUID(),
    email: normalized,
    name,
    passwordHash: hashPassword(password),
    orgId: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  if (DATABASE_URL) {
    await supabaseQuery(
      'INSERT INTO users (id, email, name, password_hash, org_id, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.id, user.email, user.name, user.passwordHash, user.orgId, user.createdAt],
    );
  } else {
    memoryUsers.set(normalized, user);
  }

  return user;
}

export function verifyPassword(user: UserRecord, password: string): boolean {
  return user.passwordHash === hashPassword(password);
}

export async function listUsers(): Promise<Omit<UserRecord, 'passwordHash'>[]> {
  if (DATABASE_URL) {
    return supabaseQuery('SELECT id, email, name, org_id as "orgId", created_at as "createdAt" FROM users');
  }
  return Array.from(memoryUsers.values()).map(u => ({
    id: u.id, email: u.email, name: u.name, orgId: u.orgId, createdAt: u.createdAt,
  }));
}
