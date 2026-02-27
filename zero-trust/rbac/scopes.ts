/**
 * RBAC scope parsing and checking — extracted from kitz-gateway.
 */

export const KNOWN_SCOPES = [
  'admin',
  'billing',
  'crm:read',
  'crm:write',
  'orders:read',
  'orders:write',
  'whatsapp:send',
  'email:send',
  'agent:execute',
  'tools:invoke',
  'reports:read',
  'settings:write',
] as const;

export type KnownScope = (typeof KNOWN_SCOPES)[number];

/** Parse comma-separated scopes from header value. */
export function parseScopes(header: string | undefined): string[] {
  if (!header || header.trim() === '') return [];
  return header.split(',').map(s => s.trim()).filter(Boolean);
}

/** Check if a scope list includes a required scope. */
export function hasScope(scopes: string[], required: string): boolean {
  if (scopes.includes('admin')) return true;
  return scopes.includes(required);
}
