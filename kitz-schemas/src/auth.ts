/**
 * Shared JWT HS256 utilities for the KITZ platform.
 *
 * Single source of truth — every service that needs to verify or sign
 * JWTs imports from here instead of rolling its own copy.
 *
 * Based on kitz_os/src/auth/gatewayJwt.ts (the battle-tested original).
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

// ── Types ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub?: string;      // userId
  org_id?: string;   // orgId
  scopes?: string[];
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/** Result of extractAuthFromHeaders — either a valid user or null. */
export interface AuthResult {
  userId: string;
  orgId: string;
  scopes: string[];
}

// ── Base64-URL helpers ─────────────────────────────────────────────────

export function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(str: string): Buffer {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64');
}

// ── JWT verify / sign ──────────────────────────────────────────────────

/**
 * Verify an HS256 JWT and return its payload.
 * Throws on invalid signature, unsupported algorithm, or expiration.
 */
export function verifyJwt(token: string, secret: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');

  const [headerB64, payloadB64, signatureB64] = parts;

  // Verify header algorithm
  const header = JSON.parse(base64UrlDecode(headerB64).toString('utf-8'));
  if (header.alg !== 'HS256') throw new Error(`Unsupported algorithm: ${header.alg}`);

  // Verify signature
  const signInput = `${headerB64}.${payloadB64}`;
  const expectedSig = base64UrlEncode(
    createHmac('sha256', secret).update(signInput).digest()
  );

  const sigBuf = Buffer.from(signatureB64);
  const expectedBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error('Invalid signature');
  }

  // Decode payload
  const payload: JwtPayload = JSON.parse(base64UrlDecode(payloadB64).toString('utf-8'));

  // Check expiration
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new Error('Token expired');
  }

  return payload;
}

/**
 * Sign a JWT payload with HS256.
 */
export function signJwt(payload: JwtPayload, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const signInput = `${headerB64}.${payloadB64}`;
  const signature = base64UrlEncode(
    createHmac('sha256', secret).update(signInput).digest()
  );
  return `${headerB64}.${payloadB64}.${signature}`;
}

// ── Header extraction helper ───────────────────────────────────────────

/**
 * Extract and verify auth from incoming request headers.
 *
 * Supports two modes:
 *  1. Service-to-service: `x-service-secret` matches the shared secret
 *     → returns orgId/userId from `x-org-id` / `x-user-id` headers.
 *  2. Bearer JWT: `Authorization: Bearer <token>`
 *     → verifies token, returns sub/org_id/scopes from payload.
 *
 * Returns null if neither mode succeeds (caller decides 401 vs guest).
 */
export function extractAuthFromHeaders(
  headers: Record<string, string | string[] | undefined>,
  jwtSecret: string,
  serviceSecret?: string,
): AuthResult | null {
  const get = (name: string): string | undefined => {
    const v = headers[name] ?? headers[name.toLowerCase()];
    return Array.isArray(v) ? v[0] : v;
  };

  // 1. Service-to-service auth
  if (serviceSecret) {
    const ss = get('x-service-secret');
    if (ss && ss === serviceSecret) {
      return {
        userId: get('x-user-id') ?? 'system',
        orgId: get('x-org-id') ?? 'system',
        scopes: ['*'],
      };
    }
  }

  // 2. Bearer JWT
  const auth = get('authorization') ?? get('Authorization');
  if (auth?.startsWith('Bearer ')) {
    try {
      const payload = verifyJwt(auth.slice(7), jwtSecret);
      return {
        userId: (payload.sub as string) ?? '',
        orgId: (payload.org_id as string) ?? '',
        scopes: payload.scopes ?? [],
      };
    } catch {
      return null;
    }
  }

  // 3. Dev token header (x-dev-secret — used by SPA in dev mode)
  const devSecret = get('x-dev-secret');
  if (devSecret && devSecret === jwtSecret) {
    return {
      userId: get('x-user-id') ?? 'dev-user',
      orgId: get('x-org-id') ?? 'dev-org',
      scopes: ['*'],
    };
  }

  return null;
}
