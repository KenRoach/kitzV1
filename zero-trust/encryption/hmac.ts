/**
 * HMAC-SHA256 webhook verification — extracted from kitz-payments/src/index.ts.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

/** Generic HMAC-SHA256 verification (Yappy, BAC, etc.). */
export function verifyHmac(rawBody: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const sig = signature.replace(/^sha256=/, '');
  const computed = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(computed);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Stripe-specific signature verification with timestamp tolerance. */
export function verifyStripe(
  rawBody: string,
  header: string,
  secret: string,
  toleranceSeconds = 300,
): { valid: boolean; error?: string } {
  if (!header || !secret) return { valid: false, error: 'Missing signature or secret' };

  const parts: Record<string, string> = {};
  for (const item of header.split(',')) {
    const [key, ...v] = item.split('=');
    if (key && v.length) parts[key] = v.join('=');
  }

  const ts = parts['t'];
  const sig = parts['v1'];
  if (!ts || !sig) return { valid: false, error: 'Invalid stripe-signature format' };

  if (Math.abs(Math.floor(Date.now() / 1000) - Number(ts)) > toleranceSeconds) {
    return { valid: false, error: 'Timestamp outside tolerance' };
  }

  const computed = createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex');
  const a = Buffer.from(computed);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { valid: false, error: 'Signature mismatch' };
  return { valid: true };
}
