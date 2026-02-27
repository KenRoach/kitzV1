/**
 * zero-trust — Shared security library for the Kitz monorepo.
 */

export { verifyJwt, signJwt, base64UrlEncode, base64UrlDecode } from './auth/jwt.js';
export type { JwtPayload } from './auth/jwt.js';

export { parseScopes, hasScope, KNOWN_SCOPES } from './rbac/scopes.js';
export type { KnownScope } from './rbac/scopes.js';

export { verifyHmac, verifyStripe } from './encryption/hmac.js';

export { createAuditEntry } from './audit/auditLog.js';
export type { AuditEntryOpts } from './audit/auditLog.js';

export { enforceDraftFirst, isDraftApproved } from './policies/draftFirst.js';

export { requireAuth, requireOrg, requireScope } from './gateway/middleware.js';
