/**
 * JWT HS256 utilities — extracted for testing.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface JwtPayload {
  sub?: string;      // userId
  org_id?: string;   // orgId
  scopes?: string[];
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(str: string): Buffer {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64');
}

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
 * Sign a JWT payload with HS256 (for testing).
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
