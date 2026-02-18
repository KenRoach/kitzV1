import { describe,it,expect } from 'vitest';
import type { EventEnvelope } from './contracts.js';
describe('contracts',()=>it('traceId required',()=>{const e:EventEnvelope={orgId:'o',userId:'u',source:'s',event:'e',payload:{},traceId:'t',ts:new Date().toISOString()};expect(e.traceId).toBe('t');}));
