/**
 * Content Engine Enhanced — LinkedIn posts and WhatsApp broadcast content generation.
 *
 * 2 tools:
 *   - content_linkedin_post       (low) — Generate a LinkedIn post with hook, body, hashtags
 *   - content_whatsapp_broadcast  (low) — Generate a WhatsApp broadcast message under 300 chars
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('contentEngineEnhanced');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const LINKEDIN_SYSTEM_PROMPT = `KitZ Content Engine for LinkedIn. Bold hook (first line stops the scroll). 3-5 short punchy paragraphs. End with question or provocative statement.
Hashtags: #LATAM #AutomatizacionIA #KitZ #TransformacionDigital. Brand voice: direct, confident, operator-brained. Reference real KitZ infrastructure. Spanish default. Output in JSON.`;

const WHATSAPP_SYSTEM_PROMPT = `KitZ Content Engine for WhatsApp broadcasts. Under 300 chars. Hook line, one insight, one CTA. Conversational, not corporate. Spanish default. Reference KitZ capabilities naturally. Output in JSON.`;


export function getAllContentEngineEnhancedTools(): ToolSchema[] {
  return [
    {
      name: 'content_linkedin_post',
      description: 'Generate a LinkedIn post with bold hook, punchy body, and relevant hashtags. Returns hook, body, hashtags, and character count.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Post topic or theme' },
          language: { type: 'string', description: 'Language (default: es)', enum: ['es', 'en'] },
        },
        required: ['topic'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Topic: ${args.topic}\nLanguage: ${args.language || 'es'}\n\nRespond with valid JSON:\n{ "hook": string, "body": string, "hashtags": [string], "characterCount": number }`;
        const raw = await callLLM(LINKEDIN_SYSTEM_PROMPT, input, { temperature: 0.3 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw: raw }; }
        log.info('executed', { trace_id: traceId });
        return parsed;
      },
    },
    {
      name: 'content_whatsapp_broadcast',
      description: 'Generate a WhatsApp broadcast message under 300 characters. Returns message and character count.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Broadcast topic or theme' },
          language: { type: 'string', description: 'Language (default: es)', enum: ['es', 'en'] },
        },
        required: ['topic'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const input = `Topic: ${args.topic}\nLanguage: ${args.language || 'es'}\n\nRespond with valid JSON:\n{ "message": string, "characterCount": number }`;
        const raw = await callLLM(WHATSAPP_SYSTEM_PROMPT, input, { temperature: 0.3 });
        let parsed;
        try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw: raw }; }
        log.info('executed', { trace_id: traceId });
        return parsed;
      },
    },
  ];
}
