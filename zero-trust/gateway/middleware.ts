/**
 * Fastify preHandler hooks for auth, org-isolation, and scope enforcement.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJwt } from '../auth/jwt.js';
import type { JwtPayload } from '../auth/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    jwtPayload?: JwtPayload;
  }
}

/**
 * Require a valid JWT in the Authorization header.
 * Sets request.jwtPayload on success.
 */
export function requireAuth(secret: string) {
  return async function authHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      reply.code(401).send({ code: 'NO_TOKEN', message: 'Authorization header required' });
      return;
    }
    const token = auth.slice(7);
    try {
      request.jwtPayload = verifyJwt(token, secret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid token';
      reply.code(401).send({ code: 'AUTH_FAILED', message });
    }
  };
}

/** Require x-org-id header for org isolation. */
export function requireOrg() {
  return async function orgHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const orgId = request.headers['x-org-id'];
    if (!orgId) {
      reply.code(400).send({ code: 'MISSING_ORG', message: 'x-org-id header required' });
    }
  };
}

/**
 * Require a specific scope in the JWT payload.
 * Must be used after requireAuth.
 */
export function requireScope(scope: string) {
  return async function scopeHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const payload = request.jwtPayload;
    if (!payload) {
      reply.code(401).send({ code: 'NO_PAYLOAD', message: 'JWT payload not found — requireAuth must run first' });
      return;
    }
    const scopes = payload.scopes ?? [];
    if (!scopes.includes(scope)) {
      reply.code(403).send({ code: 'INSUFFICIENT_SCOPE', message: `Missing required scope: ${scope}` });
    }
  };
}
