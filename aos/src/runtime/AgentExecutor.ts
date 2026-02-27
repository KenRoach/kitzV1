/**
 * Agent Executor — the core runtime that gives agents LLM reasoning.
 *
 * Takes an agent + message → builds prompt → calls LLM hub → executes tool calls → returns result.
 * Implements an agentic loop (max iterations) similar to kitz_os semanticRouter.
 */

import { randomUUID } from 'node:crypto';
import type { BaseAgent } from '../agents/baseAgent.js';
import type { AgentMessage } from '../types.js';
import { AgentMemory, type MemoryEntry } from './AgentMemory.js';
import { buildSystemPrompt, type AgentPromptContext } from './agentPromptBuilder.js';

const LLM_HUB_URL = process.env.LLM_HUB_URL || 'http://localhost:4010';
const MAX_ITERATIONS = 5;

export interface ExecutionResult {
  agentName: string;
  response: string;
  toolResults: Array<{ tool: string; success: boolean; data?: unknown; error?: string }>;
  iterations: number;
  escalation?: { to: string; reason: string };
  traceId: string;
  durationMs: number;
}

interface LLMResponse {
  reasoning?: string;
  actions?: Array<{ tool: string; args: Record<string, unknown> }>;
  response?: string;
  escalate?: { to: string; reason: string } | null;
}

/** Call the LLM hub and get a completion */
async function callLLM(system: string, prompt: string, traceId: string): Promise<string> {
  const res = await fetch(`${LLM_HUB_URL}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-trace-id': traceId,
    },
    body: JSON.stringify({
      system,
      prompt,
      tier: 'haiku',
      taskType: 'classification',
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`LLM Hub ${res.status}: ${await res.text().catch(() => 'unknown')}`);
  }

  const data = (await res.json()) as { text?: string };
  return data.text || '';
}

/** Parse LLM response — expects JSON but handles gracefully */
function parseLLMResponse(text: string): LLMResponse {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]) as LLMResponse;
    } catch {
      // Fall through
    }
  }

  // If no JSON, treat the whole response as text
  return {
    reasoning: '',
    actions: [],
    response: text,
    escalate: null,
  };
}

// In-memory registry of agent memories
const agentMemories = new Map<string, AgentMemory>();

function getMemory(agentName: string): AgentMemory {
  let mem = agentMemories.get(agentName);
  if (!mem) {
    mem = new AgentMemory(agentName);
    agentMemories.set(agentName, mem);
  }
  return mem;
}

/**
 * Execute a task using an agent with LLM reasoning.
 *
 * Flow:
 * 1. Build system prompt from agent context
 * 2. Call LLM with task description
 * 3. Execute any tool calls the LLM requests
 * 4. Feed tool results back to LLM (loop up to MAX_ITERATIONS)
 * 5. Return final response
 */
export async function executeAgentTask(
  agent: BaseAgent,
  message: AgentMessage | string,
  traceId?: string,
): Promise<ExecutionResult> {
  const start = Date.now();
  const tid = traceId || randomUUID();
  const memory = getMemory(agent.name);

  // Build prompt context
  const allowedTools = agent.listMyTools();
  const sops = await agent.getMySOPs().catch(() => []);

  const promptContext: AgentPromptContext = {
    agentName: agent.name,
    role: agent.tier,
    tier: agent.tier,
    team: agent.team,
    allowedTools,
    recentMemory: memory.getRecentContext(),
    sops: sops.map((s) => `${s.title}: ${s.summary || ''}`),
  };

  const systemPrompt = buildSystemPrompt(promptContext);

  // Extract the task from message
  const taskText = typeof message === 'string'
    ? message
    : `Task from ${(message as AgentMessage).source}: ${JSON.stringify((message as AgentMessage).payload)}`;

  // Record incoming message in memory
  memory.addMessage({
    role: 'user',
    content: taskText.slice(0, 500),
    timestamp: new Date().toISOString(),
    traceId: tid,
  });

  const toolResults: ExecutionResult['toolResults'] = [];
  let finalResponse = '';
  let escalation: ExecutionResult['escalation'];
  let iterations = 0;
  let currentPrompt = taskText;

  // Agentic loop
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    iterations++;

    let llmText: string;
    try {
      llmText = await callLLM(systemPrompt, currentPrompt, tid);
    } catch (err) {
      finalResponse = `LLM unavailable: ${(err as Error).message}. Agent ${agent.name} cannot process this task.`;
      break;
    }

    const parsed = parseLLMResponse(llmText);
    finalResponse = parsed.response || finalResponse;

    // Check for escalation
    if (parsed.escalate) {
      escalation = parsed.escalate;
      break;
    }

    // If no actions, we're done
    if (!parsed.actions || parsed.actions.length === 0) {
      break;
    }

    // Execute tool calls
    const iterationResults: string[] = [];

    for (const action of parsed.actions) {
      try {
        const result = await agent.invokeTool(action.tool, action.args, tid);
        toolResults.push({
          tool: action.tool,
          success: result.success,
          data: result.data,
          error: result.error,
        });
        iterationResults.push(
          `Tool ${action.tool}: ${result.success ? 'OK' : `FAILED: ${result.error}`}` +
            (result.data ? ` → ${JSON.stringify(result.data).slice(0, 200)}` : ''),
        );
      } catch (err) {
        const error = (err as Error).message;
        toolResults.push({ tool: action.tool, success: false, error });
        iterationResults.push(`Tool ${action.tool}: ERROR: ${error}`);
      }
    }

    // Feed results back if there are more iterations possible
    if (i < MAX_ITERATIONS - 1) {
      currentPrompt = `Tool results:\n${iterationResults.join('\n')}\n\nBased on these results, what's your next action? If done, provide your final response.`;
    }
  }

  // Record agent response in memory
  memory.addMessage({
    role: 'agent',
    content: finalResponse.slice(0, 500),
    timestamp: new Date().toISOString(),
    traceId: tid,
  });

  return {
    agentName: agent.name,
    response: finalResponse,
    toolResults,
    iterations,
    escalation,
    traceId: tid,
    durationMs: Date.now() - start,
  };
}

/** Get an agent's memory for inspection */
export function getAgentMemory(agentName: string): AgentMemory {
  return getMemory(agentName);
}
