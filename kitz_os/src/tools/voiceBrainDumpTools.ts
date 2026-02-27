/**
 * Voice Brain Dump Tools — Transform voice memo transcripts into
 * structured tasks, ideas, notes, follow-ups, and decisions.
 *
 * 1 tool:
 *   - voicebraindump_process (medium) — Process transcript into structured items
 *
 * Uses Claude Sonnet for reasoning, falls back to OpenAI gpt-4o.
 * Saves extracted items to workspace CRM.
 */

import { callWorkspaceMcp } from './mcpClient.js';
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a brain dump organizer for small business owners in Latin America.
The user recorded a voice memo — messy, stream-of-consciousness. Your job:
1. Extract EVERY actionable item, idea, and note from the transcript.
2. Categorize each as: task, idea, note, followup, or decision.
3. Assign priority (low/medium/high) based on business impact and urgency.
4. Extract related contact names and due dates when mentioned.
5. Write a 2-3 sentence summary.

Default language: Spanish. Be thorough — capture everything, lose nothing.

Respond with valid JSON:
{
  "summary": "string (2-3 sentences)",
  "items": [{
    "type": "task" | "idea" | "note" | "followup" | "decision",
    "title": "string (short, actionable)",
    "body": "string (detail)",
    "priority": "low" | "medium" | "high",
    "related_contact": "string or null",
    "due_date": "string (ISO 8601) or null",
    "tags": ["string"]
  }]
}`;

interface BrainDumpParsed {
  summary: string;
  items: Array<{
    type: string;
    title: string;
    body: string;
    priority: string;
    related_contact?: string | null;
    due_date?: string | null;
    tags?: string[];
  }>;
  saved_to_workspace?: boolean;
  item_count?: number;
}

async function processBrainDump(transcript: string, context?: string): Promise<string> {
  const userMessage = context
    ? `Business context: ${context}\n\nVoice transcript:\n"${transcript}"`
    : `Voice transcript:\n"${transcript}"`;

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
          temperature: 0.3,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.ok) {
        const data = await res.json() as { content: Array<{ type: string; text?: string }> };
        return data.content?.find(c => c.type === 'text')?.text || '';
      }
    } catch { /* fall through to OpenAI */ }
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
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 4096,
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

  return JSON.stringify({ error: 'No AI available for brain dump processing' });
}

export function getAllVoiceBrainDumpTools(): ToolSchema[] {
  return [
    {
      name: 'voicebraindump_process',
      description:
        'Process a voice brain dump transcript into structured items: tasks, ideas, notes, follow-ups, and decisions. ' +
        'Extracts priorities, contacts, due dates, and tags. Saves items to workspace. ' +
        'Use when user sends a voice memo or dictates their thoughts.',
      parameters: {
        type: 'object',
        properties: {
          transcript: {
            type: 'string',
            description: 'The voice memo transcript text to process',
          },
          business_context: {
            type: 'string',
            description: 'Optional context about the business (industry, current projects)',
          },
        },
        required: ['transcript'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const transcript = String(args.transcript || '').trim();
        if (!transcript || transcript.length < 10) {
          return { error: 'Transcript too short. Need at least 10 characters.' };
        }

        const raw = await processBrainDump(transcript, args.business_context as string | undefined);

        let parsed: BrainDumpParsed;
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) as BrainDumpParsed : { summary: raw, items: [] };
        } catch {
          parsed = { summary: raw, items: [] };
        }

        // Save each extracted task to workspace
        let savedCount = 0;
        for (const item of parsed.items) {
          if (item.type === 'task' || item.type === 'followup') {
            try {
              await callWorkspaceMcp('create_task', {
                title: item.title,
                description: item.body,
                priority: item.priority,
                due_date: item.due_date || undefined,
                tags: item.tags || ['brain-dump'],
                source: 'voice-brain-dump',
              }, traceId);
              savedCount++;
            } catch { /* continue — best effort */ }
          }
        }

        // Save full dump to knowledge base
        try {
          await callWorkspaceMcp('add_knowledge', {
            title: `Brain Dump: ${parsed.summary?.slice(0, 50) || 'Voice Memo'}`,
            content: JSON.stringify(parsed),
            category: 'brain_dump',
          }, traceId);
        } catch { /* best effort */ }

        parsed.saved_to_workspace = savedCount > 0;
        parsed.item_count = parsed.items.length;

        console.log(JSON.stringify({
          ts: new Date().toISOString(),
          module: 'voiceBrainDumpTools',
          action: 'voicebraindump_process',
          item_count: parsed.items.length,
          saved_tasks: savedCount,
          transcript_length: transcript.length,
          trace_id: traceId,
        }));

        return parsed;
      },
    },
  ];
}
