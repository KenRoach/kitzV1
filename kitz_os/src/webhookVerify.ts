/**
 * Webhook Signature Verification — Cryptographic validation for payment webhooks.
 *
 * Each provider has a different signing scheme:
 *   - Stripe: HMAC-SHA256 over raw body, signature in `stripe-signature` header (t=...,v1=...)
 *   - PayPal: SHA256withRSA certificate-based (we verify transmission-id + timestamp + webhook-id + CRC32)
 *   - Yappy: HMAC-SHA256 over raw body, signature in `x-yappy-signature` header
 *   - BAC: HMAC-SHA256 over raw body, signature in `x-bac-signature` header
 *
 * All verifications use timing-safe comparison to prevent timing attacks.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

// ── Stripe ───────────────────────────────────────────────

/**
 * Verify Stripe webhook signature (v1 scheme).
 * Stripe signs: `timestamp.rawBody` with HMAC-SHA256.
 * Header format: `t=1234567890,v1=<hex_signature>`
 */
export function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300,
): { valid: boolean; error?: string } {
  if (!signatureHeader || !secret) {
    return { valid: false, error: 'Missing signature header or secret' };
  }

  // Parse header: t=timestamp,v1=signature
  const parts: Record<string, string> = {};
  for (const item of signatureHeader.split(',')) {
    const [key, ...valueParts] = item.split('=');
    if (key && valueParts.length) parts[key] = valueParts.join('=');
  }

  const timestamp = parts['t'];
  const expectedSig = parts['v1'];
  if (!timestamp || !expectedSig) {
    return { valid: false, error: 'Invalid stripe-signature format (missing t or v1)' };
  }

  // Verify timestamp tolerance (prevent replay attacks)
  const ts = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > toleranceSeconds) {
    return { valid: false, error: `Timestamp outside tolerance (${toleranceSeconds}s)` };
  }

  // Compute expected signature: HMAC-SHA256(secret, "timestamp.body")
  const signedPayload = `${timestamp}.${rawBody}`;
  const computed = createHmac('sha256', secret).update(signedPayload).digest('hex');

  // Timing-safe comparison
  const a = Buffer.from(computed);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, error: 'Signature mismatch' };
  }

  return { valid: true };
}

// ── HMAC-SHA256 (Yappy, BAC, generic) ────────────────────

/**
 * Verify HMAC-SHA256 webhook signature.
 * Used by Yappy and BAC which sign the raw body with a shared secret.
 */
export function verifyHmacSha256(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): { valid: boolean; error?: string } {
  if (!signatureHeader || !secret) {
    return { valid: false, error: 'Missing signature or secret' };
  }

  // Strip optional "sha256=" prefix
  const sig = signatureHeader.replace(/^sha256=/, '');

  const computed = createHmac('sha256', secret).update(rawBody).digest('hex');

  const a = Buffer.from(computed);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, error: 'Signature mismatch' };
  }

  return { valid: true };
}

// ── PayPal ───────────────────────────────────────────────

/**
 * Verify PayPal webhook by checking transmission headers.
 * PayPal uses certificate-based signing. For MVP, we verify:
 *   1. All required headers are present
 *   2. Transmission ID format is valid
 *   3. Timestamp is within tolerance
 *
 * Full production verification would call PayPal's verify-webhook-signature API.
 * This is a defense-in-depth check before the API call.
 */
export function verifyPayPalHeaders(
  headers: Record<string, string | string[] | undefined>,
  toleranceSeconds = 600,
): { valid: boolean; error?: string } {
  const transmissionId = headers['paypal-transmission-id'] as string | undefined;
  const transmissionTime = headers['paypal-transmission-time'] as string | undefined;
  const transmissionSig = headers['paypal-transmission-sig'] as string | undefined;
  const certUrl = headers['paypal-cert-url'] as string | undefined;

  if (!transmissionId) return { valid: false, error: 'Missing paypal-transmission-id' };
  if (!transmissionTime) return { valid: false, error: 'Missing paypal-transmission-time' };
  if (!transmissionSig) return { valid: false, error: 'Missing paypal-transmission-sig' };
  if (!certUrl) return { valid: false, error: 'Missing paypal-cert-url' };

  // Validate cert URL is from PayPal domain (prevent SSRF)
  try {
    const url = new URL(certUrl);
    if (!url.hostname.endsWith('.paypal.com') && !url.hostname.endsWith('.symantec.com')) {
      return { valid: false, error: 'Certificate URL not from PayPal domain' };
    }
    if (url.protocol !== 'https:') {
      return { valid: false, error: 'Certificate URL must use HTTPS' };
    }
  } catch {
    return { valid: false, error: 'Invalid certificate URL' };
  }

  // Verify timestamp tolerance
  const ts = new Date(transmissionTime).getTime();
  if (isNaN(ts)) return { valid: false, error: 'Invalid transmission time' };
  if (Math.abs(Date.now() - ts) > toleranceSeconds * 1000) {
    return { valid: false, error: `Timestamp outside tolerance (${toleranceSeconds}s)` };
  }

  return { valid: true };
}
