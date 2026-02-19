import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EventBus } from '../src/eventBus.js';
import { MemoryStore } from '../src/memory/memoryStore.js';
import { AgentRegistry } from '../src/registry.js';
import { enforceApprovals } from '../src/policies/approvals.js';

describe('AOS core behavior', () => {
  it('routes events via event bus', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'aos-test-'));
    const bus = new EventBus(new MemoryStore(dir));
    let called = false;
    bus.subscribe('BUG_REPORTED', async () => {
      called = true;
    });
    await bus.publish({ type: 'BUG_REPORTED', source: 'test', severity: 'medium', payload: {} });
    expect(called).toBe(true);
  });

  it('enforces ad-hoc spawn limits', () => {
    const registry = new AgentRegistry();
    registry.register({ name: 'CTO', role: 'CTO', owns: [], triggers: [], allowed_actions: [], can_spawn_ad_hoc: true, max_ad_hoc: 12, max_active_ad_hoc: 3, approval_required: [] });
    registry.spawnAdHoc('CTO');
    registry.spawnAdHoc('CTO');
    registry.spawnAdHoc('CTO');
    expect(() => registry.spawnAdHoc('CTO')).toThrow(/max active ad-hoc limit/i);
  });

  it('blocks submission recommendations without reviewer approval', () => {
    expect(() =>
      enforceApprovals({
        id: '1',
        type: 'PR_READY_FOR_REVIEW',
        source: 'HeadEngineering',
        severity: 'high',
        timestamp: new Date().toISOString(),
        payload: { action: 'merge_pr_recommendation', approvals: [] }
      })
    ).toThrow(/Reviewer approval/);
  });

  it('writes memory records to ndjson', () => {
    const dir = mkdtempSync(join(tmpdir(), 'aos-memory-'));
    const memory = new MemoryStore(dir);
    memory.logDecision('ctx', ['a', 'b'], 'a', 'ok');
    expect(existsSync(join(dir, 'decisions.ndjson'))).toBe(true);
    const content = readFileSync(join(dir, 'decisions.ndjson'), 'utf-8');
    expect(content).toContain('"chosen":"a"');
  });

  it('attaches incentive alignment warnings on KPI conflicts', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'aos-kpi-'));
    const bus = new EventBus(new MemoryStore(dir));
    const event = await bus.publish({
      type: 'KPI_CHANGED',
      source: 'test',
      severity: 'medium',
      payload: { revenueDelta: 2, marginDelta: -2, growthDelta: 1, churnDelta: 1 }
    });
    expect(event.alignmentWarnings?.length).toBeGreaterThan(0);
  });
});
