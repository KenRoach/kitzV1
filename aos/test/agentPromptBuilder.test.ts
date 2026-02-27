import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, type AgentPromptContext } from '../src/runtime/agentPromptBuilder.js';

describe('buildSystemPrompt', () => {
  const baseCtx: AgentPromptContext = {
    agentName: 'TestAgent',
    role: 'c-suite',
    tier: 'c-suite',
    team: undefined,
    allowedTools: [],
    recentMemory: [],
    sops: [],
  };

  it('includes agent name and role', () => {
    const prompt = buildSystemPrompt(baseCtx);
    expect(prompt).toContain('TestAgent');
    expect(prompt).toContain('c-suite');
  });

  it('includes tier-specific instructions for c-suite', () => {
    const prompt = buildSystemPrompt(baseCtx);
    expect(prompt).toContain('C-suite executive');
  });

  it('includes tier-specific instructions for team', () => {
    const prompt = buildSystemPrompt({ ...baseCtx, tier: 'team', role: 'team' });
    expect(prompt).toContain('team-level specialist');
  });

  it('includes tier-specific instructions for guardian', () => {
    const prompt = buildSystemPrompt({ ...baseCtx, tier: 'guardian', role: 'guardian' });
    expect(prompt).toContain('service guardian');
  });

  it('includes core rules', () => {
    const prompt = buildSystemPrompt(baseCtx);
    expect(prompt).toContain('draft-first');
    expect(prompt).toContain('AI Battery');
    expect(prompt).toContain('traceId');
  });

  it('lists available tools when provided', () => {
    const prompt = buildSystemPrompt({
      ...baseCtx,
      allowedTools: ['crm_listContacts', 'orders_listOrders'],
    });
    expect(prompt).toContain('crm_listContacts');
    expect(prompt).toContain('orders_listOrders');
  });

  it('truncates tool list when more than 30', () => {
    const tools = Array.from({ length: 40 }, (_, i) => `tool_${i}`);
    const prompt = buildSystemPrompt({ ...baseCtx, allowedTools: tools });
    expect(prompt).toContain('and 10 more');
  });

  it('includes SOPs when provided', () => {
    const prompt = buildSystemPrompt({
      ...baseCtx,
      sops: ['Handle escalation: Route to CEO', 'Draft first: All messages are drafts'],
    });
    expect(prompt).toContain('Handle escalation');
    expect(prompt).toContain('Draft first');
  });

  it('includes recent memory when provided', () => {
    const prompt = buildSystemPrompt({
      ...baseCtx,
      recentMemory: ['[user] What are our leads?', '[agent] We have 5 warm leads.'],
    });
    expect(prompt).toContain('What are our leads');
    expect(prompt).toContain('5 warm leads');
  });

  it('includes team name when provided', () => {
    const prompt = buildSystemPrompt({ ...baseCtx, team: 'sales-crm' });
    expect(prompt).toContain('sales-crm');
  });

  it('includes JSON response format', () => {
    const prompt = buildSystemPrompt(baseCtx);
    expect(prompt).toContain('"reasoning"');
    expect(prompt).toContain('"actions"');
    expect(prompt).toContain('"response"');
    expect(prompt).toContain('"escalate"');
  });
});
