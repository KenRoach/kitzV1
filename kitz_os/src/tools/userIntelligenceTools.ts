/**
 * User Intelligence Tools — Track contacts, score churn risk, surface who needs attention.
 *
 * 2 tools:
 *   - user_intelligence_score        (low) — Score a contact's engagement and churn risk
 *   - user_intelligence_daily_report (low) — Generate daily attention report across contacts
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('userIntelligenceTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are KitZ User Intelligence. Track every contact: active, inactive, at-risk, prospects.
Score churn risk based on activity, engagement, payment. Identify who needs attention today.
Spanish default. Output in JSON.`;


export function getAllUserIntelligenceTools(): ToolSchema[] {
  return [
    {
      name: 'user_intelligence_score',
      description: 'Score a contact\'s engagement and churn risk (0-100). Returns riskLevel (active/at-risk/inactive/churned), score, recommendedAction, and reasoning.',
      parameters: {
        type: 'object',
        properties: {
          contact_name: { type: 'string', description: 'Contact name' },
          last_activity_days: { type: 'number', description: 'Days since last activity' },
          messages_sent: { type: 'number', description: 'Total messages sent to contact' },
          messages_replied: { type: 'number', description: 'Total messages replied by contact' },
          has_paid: { type: 'boolean', description: 'Whether the contact has made a payment' },
        },
        required: ['contact_name', 'last_activity_days', 'messages_sent', 'messages_replied', 'has_paid'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Contact: ${args.contact_name}\nLast activity: ${args.last_activity_days} days ago\nMessages sent: ${args.messages_sent}\nMessages replied: ${args.messages_replied}\nHas paid: ${args.has_paid}\n\nRespond with valid JSON:\n{ "riskLevel": "active"|"at-risk"|"inactive"|"churned", "score": number (0-100), "recommendedAction": string, "reasoning": string }`;
        const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw: raw }; }
        log.info('executed', { trace_id: traceId });
        return parsed;
      },
    },
    {
      name: 'user_intelligence_daily_report',
      description: 'Generate a daily attention report across all contacts. Returns who needs attention, why, and a summary.',
      parameters: {
        type: 'object',
        properties: {
          contacts: {
            type: 'array',
            description: 'Array of contacts: [{ name, lastActive, status }]',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                lastActive: { type: 'string', description: 'Last active date or description' },
                status: { type: 'string', description: 'Current status (active, inactive, prospect, etc.)' },
              },
            },
          },
        },
        required: ['contacts'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const contacts = args.contacts as Array<{ name: string; lastActive: string; status: string }>;
        const contactList = contacts.map(c => `- ${c.name}: last active ${c.lastActive}, status: ${c.status}`).join('\n');
        const input = `Contacts:\n${contactList}\n\nRespond with valid JSON:\n{ "needsAttention": [{ "name": string, "reason": string, "urgency": "high"|"medium"|"low" }], "summary": string }`;
        const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw: raw }; }
        log.info('executed', { trace_id: traceId });
        return parsed;
      },
    },
  ];
}
