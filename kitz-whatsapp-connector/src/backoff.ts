/**
 * Exponential Backoff with Jitter — ported from OpenClaw reconnect.ts
 *
 * Used for reconnection delays instead of linear backoff.
 * Formula: min(maxMs, initialMs * factor^attempt) * (1 ± jitter)
 */

export interface ReconnectPolicy {
  initialMs: number;
  maxMs: number;
  factor: number;
  jitter: number;      // 0-1, fraction of random variation
  maxAttempts: number;
}

export const DEFAULT_RECONNECT_POLICY: ReconnectPolicy = {
  initialMs: 2_000,
  maxMs: 30_000,
  factor: 1.8,
  jitter: 0.25,
  maxAttempts: 12,
};

/**
 * Compute the backoff delay for a given attempt number.
 * Returns delay in milliseconds with jitter applied.
 */
export function computeBackoff(attempt: number, policy: ReconnectPolicy = DEFAULT_RECONNECT_POLICY): number {
  const base = Math.min(policy.maxMs, policy.initialMs * Math.pow(policy.factor, attempt));
  const jitterRange = base * policy.jitter;
  const jitter = (Math.random() * 2 - 1) * jitterRange; // ±jitter
  return Math.max(policy.initialMs, Math.round(base + jitter));
}
