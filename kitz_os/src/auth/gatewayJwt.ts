/**
 * JWT HS256 utilities — re-exports from kitz-schemas (single source of truth).
 *
 * All services should import from 'kitz-schemas' directly.
 * This file exists for backward compatibility with existing kitz_os imports.
 */

export {
  type JwtPayload,
  type AuthResult,
  verifyJwt,
  signJwt,
  base64UrlEncode,
  base64UrlDecode,
  extractAuthFromHeaders,
} from 'kitz-schemas';
