/**
 * Brain Dump Tools — Process voice/text ideas into structured reports.
 *
 * Uses Claude Sonnet for analysis (mid-tier thinking).
 * Falls back to OpenAI gpt-4o if Claude unavailable.
 */
import { callXyz88Mcp } from './mcpClient.js';
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function analyzeBrainDump(transcript: string): Promise<string> {
  const systemPrompt = `You are KITZ Brain Dump Analyzer. Analyze this brain dump and extract:
1. Title (concise, 5-10 words)
2. Summary (2-3 sentences)
3. Key Points (3-7 bullets)
4. Pros (if applicable)
5. Cons (if applicable)
6. Next Steps (2-3 actionable items)

Respond in valid JSON: {"title","summary","key_points":[],"pros":[],"cons":[],"next_steps":[]}`;

  // Try Claude Sonnet first
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
          max_tokens: 2048,
          temperature: 0.3,
          system: systemPrompt,
          messages: [{ role: 'user', content: transcript }],
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.ok) {
        const data = await res.json() as { content: Array<{ type: string; text?: string }> };
        return data.content?.find(c => c.type === 'text')?.text || '';
      }
    } catch { /* fall through to OpenAI */ }
  }

  // Fallback to OpenAI
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
            { role: 'user', content: transcript },
          ],
          max_tokens: 2048,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.ok) {
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        return data.choices?.[0]?.message?.content || '';
      }
    } catch { /* return error */ }
  }

  return JSON.stringify({ error: 'No AI available for brain dump analysis' });
}

export function getAllBraindumpTools(): ToolSchema[] {
  return [
    {
      name: 'braindump_process',
      description: 'Process a brain dump (text or transcript) into a structured report with key points, pros, cons, and next steps. Saves to knowledge base.',
      parameters: {
        type: 'object',
        properties: {
          transcript: { type: 'string', description: 'The brain dump text or voice transcript to analyze' },
        },
        required: ['transcript'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const transcript = args.transcript as string;
        if (!transcript || transcript.length < 10) {
          return { error: 'Brain dump too short. Please provide more detail.' };
        }

        const analysis = await analyzeBrainDump(transcript);
        let parsed;
        try {
          // Try to extract JSON from response
          const jsonMatch = analysis.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: analysis };
        } catch {
          parsed = { summary: analysis };
        }

        // Save to knowledge base
        try {
          await callXyz88Mcp('add_knowledge', {
            title: parsed.title || 'Brain Dump',
            content: JSON.stringify(parsed),
            category: 'brain_dump',
          }, traceId);
          parsed.saved_to_knowledge = true;
        } catch {
          parsed.saved_to_knowledge = false;
        }

        return parsed;
      },
    },
  ];
}
