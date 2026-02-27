/**
 * Environment variable helpers — fail fast on missing required vars.
 */

/** Require an env var to be set; throws if missing. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Read an optional env var, returning fallback if unset. */
export function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value !== undefined && value !== '' ? value : fallback;
}
