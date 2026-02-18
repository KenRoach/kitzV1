import { describe, it, expect } from 'vitest';
import { health } from './index.js';
describe('health',()=>{it('ok',()=>expect(health.status).toBe('ok'));});
