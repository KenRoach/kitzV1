/**
 * Browser agent skill — AI-powered web automation for business tasks.
 *
 * Wraps Stagehand (TypeScript SDK) to let KITZ agents browse the web,
 * extract data, fill forms, and automate repetitive online tasks for SMBs.
 *
 * Use cases for KITZ SMBs:
 *  - Check competitor prices on e-commerce sites
 *  - Fill government/compliance forms (Panama SRL, tax filings)
 *  - Scrape supplier catalogs for product data
 *  - Monitor social media mentions
 *  - Automate marketplace listings (MercadoLibre, etc.)
 *  - Submit job postings, check order status on third-party platforms
 *
 * Reference repos:
 *  - Stagehand (github.com/browserbase/stagehand) — TypeScript browser SDK
 *  - Browser-Use (github.com/browser-use/browser-use) — Python agent framework
 *  - HyperAgent (github.com/hyperbrowserai/HyperAgent) — AI browser automation
 *  - Skyvern (github.com/Skyvern-AI/skyvern) — visual browser agent
 */

import type { LLMClient } from './callTranscription.js';

export type BrowserAction =
  | { type: 'navigate'; url: string }
  | { type: 'act'; instruction: string }
  | { type: 'extract'; instruction: string; schema?: Record<string, unknown> }
  | { type: 'observe'; instruction: string }
  | { type: 'screenshot' }
  | { type: 'wait'; milliseconds: number };

export interface BrowserTaskPlan {
  goal: string;
  steps: BrowserAction[];
  expectedOutput: string;
  estimatedDurationSeconds: number;
  requiresAuth: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface BrowserTaskResult {
  plan: BrowserTaskPlan;
  status: 'planned' | 'ready';
}

export interface BrowserAgentOptions {
  task: string;
  targetUrl?: string;
  credentials?: { type: 'stored'; credentialId: string };
  extractSchema?: Record<string, unknown>;
  maxSteps?: number;
  language?: string;
}

const BROWSER_AGENT_SYSTEM =
  'You are a browser automation planner for small businesses in Latin America. ' +
  'Plan step-by-step browser actions to accomplish the user\'s task. ' +
  'Be precise about what to click, type, and extract. ' +
  'Prioritize safety: never submit payments or delete data without explicit confirmation. ' +
  'Flag high-risk actions (form submissions, purchases, account changes). ' +
  'Default language context is Spanish (Latin America).';

const BROWSER_AGENT_FORMAT =
  'Respond with JSON: { "plan": { "goal": string, ' +
  '"steps": [{ "type": "navigate" | "act" | "extract" | "observe" | "screenshot" | "wait", ' +
  '"url"?: string, "instruction"?: string, "schema"?: object, "milliseconds"?: number }], ' +
  '"expectedOutput": string, "estimatedDurationSeconds": number, ' +
  '"requiresAuth": boolean, "riskLevel": "low" | "medium" | "high" } }';

/**
 * Plan a browser automation task. Returns a step-by-step plan
 * that can be executed by Stagehand or Browser-Use runtime.
 * When no llmClient is provided, returns a stub plan.
 */
export async function planBrowserTask(
  options: BrowserAgentOptions,
  llmClient?: LLMClient,
): Promise<BrowserTaskResult> {
  const language = options.language ?? 'es';

  if (llmClient) {
    const schemaLine = options.extractSchema
      ? `\nExtraction schema: ${JSON.stringify(options.extractSchema)}`
      : '';

    const prompt =
      `Plan browser automation for this task: ${options.task}\n` +
      `Target URL: ${options.targetUrl ?? 'determine from task'}\n` +
      `Max steps: ${options.maxSteps ?? 10}\n` +
      `Language context: ${language}${schemaLine}\n\n` +
      BROWSER_AGENT_FORMAT;

    const response = await llmClient.complete({
      prompt,
      system: BROWSER_AGENT_SYSTEM,
      tier: 'sonnet',
    });

    try {
      const parsed = JSON.parse(response.text) as { plan: BrowserTaskPlan };
      return { plan: parsed.plan, status: 'ready' };
    } catch {
      return buildStubPlan(options);
    }
  }

  return buildStubPlan(options);
}

function buildStubPlan(options: BrowserAgentOptions): BrowserTaskResult {
  const steps: BrowserAction[] = [];

  if (options.targetUrl) {
    steps.push({ type: 'navigate', url: options.targetUrl });
  }
  steps.push({ type: 'observe', instruction: `Understand page for: ${options.task}` });
  steps.push({ type: 'act', instruction: options.task });
  if (options.extractSchema) {
    steps.push({ type: 'extract', instruction: 'Extract requested data', schema: options.extractSchema });
  }
  steps.push({ type: 'screenshot' });

  return {
    plan: {
      goal: options.task,
      steps,
      expectedOutput: '[Plan requires LLM client for detailed output prediction]',
      estimatedDurationSeconds: steps.length * 5,
      requiresAuth: false,
      riskLevel: 'low',
    },
    status: 'planned',
  };
}
