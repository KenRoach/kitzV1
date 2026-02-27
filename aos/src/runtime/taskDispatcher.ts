/**
 * Task Dispatcher — routes incoming tasks to the correct agent and executes via AgentExecutor.
 *
 * Provides the API surface for external services (kitz_os) to dispatch tasks to AOS agents.
 */

import { randomUUID } from 'node:crypto';
import type { BaseAgent } from '../agents/baseAgent.js';
import type { AgentMessage, AgentTier } from '../types.js';
import { executeAgentTask, getAgentMemory, type ExecutionResult } from './AgentExecutor.js';

// Agent instance registry (populated by createAOS or individual registration)
const agentInstances = new Map<string, BaseAgent>();

/** Register an agent instance for task dispatch */
export function registerAgent(agent: BaseAgent): void {
  agentInstances.set(agent.name, agent);
}

/** Get a registered agent by name */
export function getAgent(name: string): BaseAgent | undefined {
  return agentInstances.get(name);
}

/** List all registered agents */
export function listAgents(): Array<{ name: string; tier: AgentTier; team?: string; online: boolean }> {
  return [...agentInstances.values()].map((a) => {
    const status = a.getStatus();
    return {
      name: status.name,
      tier: status.tier,
      team: status.team,
      online: status.online,
    };
  });
}

/** Dispatch a task to a specific agent by name */
export async function dispatchToAgent(
  agentName: string,
  task: string,
  traceId?: string,
): Promise<ExecutionResult> {
  const agent = agentInstances.get(agentName);
  if (!agent) {
    return {
      agentName,
      response: `Agent "${agentName}" not found. Available agents: ${[...agentInstances.keys()].join(', ')}`,
      toolResults: [],
      iterations: 0,
      traceId: traceId || randomUUID(),
      durationMs: 0,
    };
  }

  const status = agent.getStatus();
  if (!status.online) {
    return {
      agentName,
      response: `Agent "${agentName}" is offline.`,
      toolResults: [],
      iterations: 0,
      traceId: traceId || randomUUID(),
      durationMs: 0,
    };
  }

  return executeAgentTask(agent, task, traceId);
}

/** Dispatch a task via an AgentMessage (used by EventBus routing) */
export async function dispatchMessage(msg: AgentMessage): Promise<ExecutionResult | null> {
  const targetName = typeof msg.target === 'string' ? msg.target : msg.target[0];
  if (!targetName) return null;

  const agent = agentInstances.get(targetName);
  if (!agent) return null;

  return executeAgentTask(agent, msg);
}

/**
 * Route a question to the best-fit agent based on content analysis.
 * Simple keyword-based routing — can be enhanced with LLM classification later.
 */
export async function routeQuestion(
  question: string,
  traceId?: string,
): Promise<ExecutionResult> {
  const tid = traceId || randomUUID();
  const lower = question.toLowerCase();

  // Keyword → agent mapping
  const routingRules: Array<{ keywords: string[]; agent: string }> = [
    { keywords: ['revenue', 'finance', 'budget', 'roi', 'spend', 'cost', 'credit', 'payment'], agent: 'CFO' },
    { keywords: ['marketing', 'campaign', 'content', 'brand', 'invite', 'growth'], agent: 'CMO' },
    { keywords: ['sales', 'lead', 'crm', 'pipeline', 'follow-up', 'prospect'], agent: 'CRO' },
    { keywords: ['operations', 'order', 'delivery', 'sla', 'logistics', 'fulfillment'], agent: 'COO' },
    { keywords: ['product', 'feature', 'roadmap', 'ux', 'design'], agent: 'CPO' },
    { keywords: ['engineering', 'code', 'deploy', 'infrastructure', 'api', 'bug'], agent: 'CTO' },
    { keywords: ['customer', 'support', 'complaint', 'satisfaction', 'feedback'], agent: 'HeadCustomer' },
    { keywords: ['strategy', 'vision', 'decision', 'approve', 'launch'], agent: 'CEO' },
  ];

  let bestAgent = 'CEO'; // Default: CEO handles unrouted questions
  let bestScore = 0;

  for (const rule of routingRules) {
    const score = rule.keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestAgent = rule.agent;
    }
  }

  return dispatchToAgent(bestAgent, question, tid);
}

/** Get agent status and memory for inspection */
export function getAgentStatus(agentName: string): {
  status: ReturnType<BaseAgent['getStatus']> | null;
  recentMemory: string[];
} {
  const agent = agentInstances.get(agentName);
  if (!agent) return { status: null, recentMemory: [] };

  const memory = getAgentMemory(agentName);
  return {
    status: agent.getStatus(),
    recentMemory: memory.getRecentContext(),
  };
}
