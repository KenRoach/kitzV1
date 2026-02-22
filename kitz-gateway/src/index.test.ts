import { describe, it, expect } from 'vitest';
import { verifyJwt, signJwt } from './jwt.js';

describe('JWT HS256 verification', () => {
  const secret = 'test-secret-key-for-kitz-gateway';

  it('signs and verifies a valid token', () => {
    const payload = { sub: 'user-123', org_id: 'org-456', scopes: ['events:write', 'battery:read'] };
    const token = signJwt(payload, secret);
    const result = verifyJwt(token, secret);

    expect(result.sub).toBe('user-123');
    expect(result.org_id).toBe('org-456');
    expect(result.scopes).toEqual(['events:write', 'battery:read']);
  });

  it('rejects a token signed with wrong secret', () => {
    const token = signJwt({ sub: 'user-1' }, 'wrong-secret');
    expect(() => verifyJwt(token, secret)).toThrow('Invalid signature');
  });

  it('rejects a malformed token (missing parts)', () => {
    expect(() => verifyJwt('only-one-part', secret)).toThrow('Malformed JWT');
  });

  it('rejects an expired token', () => {
    const expired = signJwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) - 60 }, secret);
    expect(() => verifyJwt(expired, secret)).toThrow('Token expired');
  });

  it('accepts a token with future expiration', () => {
    const future = signJwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 }, secret);
    const result = verifyJwt(future, secret);
    expect(result.sub).toBe('user-1');
  });

  it('extracts all standard claims', () => {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;
    const token = signJwt({ sub: 'u1', org_id: 'o1', scopes: ['a:b'], iat, exp }, secret);
    const result = verifyJwt(token, secret);

    expect(result.sub).toBe('u1');
    expect(result.org_id).toBe('o1');
    expect(result.scopes).toEqual(['a:b']);
    expect(result.iat).toBe(iat);
    expect(result.exp).toBe(exp);
  });

  it('rejects a tampered payload', () => {
    const token = signJwt({ sub: 'user-1' }, secret);
    const parts = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ sub: 'admin' })).toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const tampered = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
    expect(() => verifyJwt(tampered, secret)).toThrow('Invalid signature');
  });
});
