/**
 * Browser Agent Tools — AI-powered web automation planning.
 *
 * 2 tools:
 *   - browser_planTask    (medium) — Plan step-by-step browser automation
 *   - browser_extractData (high)   — Plan data extraction from a URL
 *
 * Uses Claude Sonnet for planning, falls back to OpenAI gpt-4o.
 * Plans are Stagehand-compatible (act/extract/observe/navigate).
 * Execution requires user approval (draft-first).
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('browserAgentTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const PLAN_SYSTEM_PROMPT = `You are a browser automation planner for small businesses in Latin America.
Plan step-by-step browser actions using Stagehand SDK primitives:
- navigate: go to a URL
- act: perform an action (click, type, scroll) via natural language
- extract: pull structured data from the page
- observe: understand what's on the page
- screenshot: capture the current page state
- wait: pause for a specified time

SAFETY RULES:
- Flag ALL form submissions as high risk
- NEVER plan payment submissions without explicit confirmation step
- NEVER plan account deletions
- Always include a screenshot step before and after critical actions
- Respect rate limits on target sites

Default language context: Spanish (Latin America).

Respond with valid JSON:
{
  "goal": "string",
  "steps": [{
    "step": number,
    "action": "navigate" | "act" | "extract" | "observe" | "screenshot" | "wait",
    "target": "string (URL or instruction)",
    "schema": {} | null,
    "wait_ms": number | null,
    "risk": "low" | "medium" | "high",
    "note": "string"
  }],
  "expected_output": "string",
  "estimated_seconds": number,
  "requires_auth": boolean,
  "risk_level": "low" | "medium" | "high"
}`;

const EXTRACT_SYSTEM_PROMPT = `You are a data extraction planner for small businesses in Latin America.
Given a URL and extraction goal, create a structured extraction plan:
1. Navigate to the URL
2. Observe the page structure
3. Extract data matching the requested schema
4. Validate and return results

Respond with valid JSON:
{
  "goal": "string",
  "steps": [{
    "step": number,
    "action": "navigate" | "observe" | "extract" | "screenshot",
    "target": "string",
    "schema": {} | null,
    "note": "string"
  }],
  "extraction_schema": {
    "fields": [{ "name": "string", "type": "string", "description": "string" }]
  },
  "estimated_rows": number,
  "estimated_seconds": number
}`;

async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': CLAUDE_API_VERSION,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          temperature: 0.2,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.ok) {
        const data = await res.json() as { content: Array<{ type: string; text?: string }> };
        return data.content?.find(c => c.type === 'text')?.text || '';
      }
    } catch { /* fall through */ }
  }

  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 4096,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.ok) {
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        return data.choices?.[0]?.message?.content || '';
      }
    } catch { /* return error */ }
  }

  return JSON.stringify({ error: 'No AI available for browser planning' });
}

export function getAllBrowserAgentTools(): ToolSchema[] {
  return [
    {
      name: 'browser_planTask',
      description:
        'Plan a browser automation task: competitor price checks, form filling, compliance submissions, ' +
        'marketplace listing, social media monitoring. Returns Stagehand-compatible step-by-step plan. ' +
        'High-risk actions are flagged for user approval.',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            description: 'What to accomplish (e.g., "check competitor prices on MercadoLibre for product X")',
          },
          target_url: {
            type: 'string',
            description: 'Starting URL (optional — AI will determine from task if not provided)',
          },
          max_steps: {
            type: 'number',
            description: 'Maximum number of browser actions (default: 10)',
          },
        },
        required: ['task'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const task = String(args.task || '').trim();
        if (!task) {
          return { error: 'Task description is required.' };
        }

        const maxSteps = Number(args.max_steps) || 10;
        const urlLine = args.target_url ? `\nStarting URL: ${args.target_url}` : '';

        const raw = await callLLM(
          PLAN_SYSTEM_PROMPT,
          `Task: ${task}${urlLine}\nMax steps: ${maxSteps}`,
        );

        let parsed;
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { goal: task, steps: [], error: 'Failed to parse plan' };
        } catch {
          parsed = { goal: task, steps: [], error: 'Failed to parse plan' };
        }

        parsed.status = 'planned';
        parsed.note = 'This is a PLAN only. Execution requires user approval (draft-first).';

        log.info('executed', { trace_id: traceId });

        return parsed;
      },
    },

    {
      name: 'browser_extractData',
      description:
        'Plan structured data extraction from a website. For scraping product catalogs, ' +
        'competitor listings, supplier prices, or public business data. ' +
        'Returns extraction plan with field schema. Requires user approval before execution.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to extract data from',
          },
          goal: {
            type: 'string',
            description: 'What data to extract (e.g., "product names and prices from catalog page")',
          },
          fields: {
            type: 'string',
            description: 'Comma-separated field names to extract (e.g., "name, price, image_url, description")',
          },
        },
        required: ['url', 'goal'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const url = String(args.url || '').trim();
        const goal = String(args.goal || '').trim();

        if (!url) return { error: 'URL is required.' };
        if (!goal) return { error: 'Extraction goal is required.' };

        const fieldsLine = args.fields ? `\nRequested fields: ${args.fields}` : '';

        const raw = await callLLM(
          EXTRACT_SYSTEM_PROMPT,
          `URL: ${url}\nGoal: ${goal}${fieldsLine}`,
        );

        let parsed;
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { goal, steps: [], error: 'Failed to parse extraction plan' };
        } catch {
          parsed = { goal, steps: [], error: 'Failed to parse extraction plan' };
        }

        parsed.status = 'planned';
        parsed.note = 'Extraction PLAN only. Execution requires user approval.';
        parsed.target_url = url;

        log.info('executed', { trace_id: traceId });

        return parsed;
      },
    },
  ];
}
