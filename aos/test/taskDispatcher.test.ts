import { describe, it, expect, beforeEach } from 'vitest';
import { routeQuestion, listAgents, registerAgent, dispatchToAgent, getAgentStatus } from '../src/runtime/taskDispatcher.js';
import { BaseAgent } from '../src/agents/baseAgent.js';
import { EventBus } from '../src/eventBus.js';
import { MemoryStore } from '../src/memory/memoryStore.js';
import { FileLedgerStore } from '../src/ledger/fileStore.js';

function createMockAgent(name: string, tier: 'c-suite' | 'team' = 'c-suite'): BaseAgent {
  const ledger = new FileLedgerStore('/tmp/test-aos-ledger');
  const bus = new EventBus(ledger);
  const memory = new MemoryStore('/tmp/test-aos-memory');
  const agent = new BaseAgent(name, bus, memory);
  agent.tier = tier;
  return agent;
}

describe('taskDispatcher', () => {
  beforeEach(() => {
    // Register test agents
    registerAgent(createMockAgent('CEO'));
    registerAgent(createMockAgent('CFO'));
    registerAgent(createMockAgent('CMO'));
    registerAgent(createMockAgent('COO'));
    registerAgent(createMockAgent('CTO'));
    registerAgent(createMockAgent('CRO'));
    registerAgent(createMockAgent('CPO'));
    registerAgent(createMockAgent('HeadCustomer'));
  });

  it('lists registered agents', () => {
    const agents = listAgents();
    expect(agents.length).toBeGreaterThanOrEqual(8);
    expect(agents.find((a) => a.name === 'CEO')).toBeDefined();
    expect(agents.find((a) => a.name === 'CFO')).toBeDefined();
  });

  it('routes finance questions to CFO', async () => {
    const result = await routeQuestion('What is our revenue this quarter?');
    expect(result.agentName).toBe('CFO');
  });

  it('routes marketing questions to CMO', async () => {
    const result = await routeQuestion('How is our marketing campaign performing?');
    expect(result.agentName).toBe('CMO');
  });

  it('routes sales questions to CRO', async () => {
    const result = await routeQuestion('What are our best sales leads?');
    expect(result.agentName).toBe('CRO');
  });

  it('routes engineering questions to CTO', async () => {
    const result = await routeQuestion('What is the status of the API deployment?');
    expect(result.agentName).toBe('CTO');
  });

  it('routes unknown questions to CEO as default', async () => {
    const result = await routeQuestion('What should we do next?');
    expect(result.agentName).toBe('CEO');
  });

  it('returns error for nonexistent agent', async () => {
    const result = await dispatchToAgent('NonExistent', 'test task');
    expect(result.response).toContain('not found');
  });

  it('returns agent status', () => {
    const status = getAgentStatus('CEO');
    expect(status.status).not.toBeNull();
    expect(status.status?.name).toBe('CEO');
    expect(status.status?.online).toBe(true);
  });

  it('returns null status for unknown agent', () => {
    const status = getAgentStatus('Unknown');
    expect(status.status).toBeNull();
  });
});
