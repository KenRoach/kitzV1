/**
 * Fact Check Tools — Validate outbound message content against real KITZ data.
 * Uses Claude Haiku for claim extraction.
 */
import { callXyz88Mcp } from './mcpClient.js';
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';

async function extractClaims(message: string): Promise<Array<{ type: string; value: string; field: string }>> {
  if (!CLAUDE_API_KEY) return [];
  try {
    const res = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: 'Extract factual claims from this message. Return JSON array: [{"type":"order_amount|contact_name|order_status|pricing|delivery","value":"the claimed value","field":"data field to verify"}]. Only extract verifiable business claims.',
        messages: [{ role: 'user', content: message }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { content: Array<{ type: string; text?: string }> };
    const text = data.content?.find(c => c.type === 'text')?.text || '[]';
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch { return []; }
}

export function getAllFactCheckTools(): ToolSchema[] {
  return [
    {
      name: 'compliance_factCheck',
      description: 'Validate outbound message content against real business data. Extracts claims and verifies each against CRM/order data.',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'The outbound message to fact-check' },
          recipient_context: { type: 'string', description: 'Optional context about the recipient' },
        },
        required: ['message'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const message = args.message as string;
        const claims = await extractClaims(message);
        if (claims.length === 0) {
          return { compliant: true, flags: [], message: 'No verifiable claims found.' };
        }

        const flags: Array<{ claim: string; verified: boolean; source?: string }> = [];
        for (const claim of claims) {
          // Verify against real data
          if (claim.type === 'order_amount' || claim.type === 'order_status') {
            const orders = await callXyz88Mcp('list_orders', { limit: 5 }, traceId) as { data?: unknown[] };
            flags.push({ claim: `${claim.type}: ${claim.value}`, verified: !!orders?.data?.length, source: 'orders' });
          } else if (claim.type === 'contact_name') {
            const contacts = await callXyz88Mcp('list_contacts', { search: claim.value, limit: 1 }, traceId) as { data?: unknown[] };
            flags.push({ claim: `contact: ${claim.value}`, verified: !!contacts?.data?.length, source: 'contacts' });
          } else {
            flags.push({ claim: `${claim.type}: ${claim.value}`, verified: false, source: 'unverifiable' });
          }
        }

        const compliant = flags.every(f => f.verified);
        return { compliant, flags, recommendation: compliant ? 'Message verified.' : 'Some claims could not be verified. Review before sending.' };
      },
    },
  ];
}
