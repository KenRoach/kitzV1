/**
 * Smart reply skill — generate quick reply options for WhatsApp conversations.
 */

import { PROMPTS } from '../prompts/templates.js';
import type { LLMClient } from './callTranscription.js';

export interface SmartReplyResult {
  replies: string[];
  recommended: number;
}

export interface ConversationMessage {
  role: 'user' | 'business';
  text: string;
}

/**
 * Generate smart reply options for a business conversation.
 * When no llmClient is provided, returns generic responses.
 */
export async function generateSmartReply(
  history: ConversationMessage[],
  llmClient?: LLMClient,
): Promise<SmartReplyResult> {
  if (llmClient) {
    const conversationText = history
      .map(m => `${m.role === 'user' ? 'Cliente' : 'Negocio'}: ${m.text}`)
      .join('\n');

    const prompt =
      `Generate smart reply options for this conversation:\n\n${conversationText}\n\n` +
      PROMPTS.smartReply.format;

    const response = await llmClient.complete({
      prompt,
      system: PROMPTS.smartReply.system,
      tier: 'haiku',
    });

    try {
      const parsed = JSON.parse(response.text) as SmartReplyResult;
      return {
        replies: parsed.replies.slice(0, 3),
        recommended: Math.min(parsed.recommended, parsed.replies.length - 1),
      };
    } catch {
      return { replies: [response.text.slice(0, 100)], recommended: 0 };
    }
  }

  return {
    replies: [
      '¡Gracias por tu mensaje! Te respondo en un momento.',
      '¡Claro! Déjame revisar y te confirmo.',
      'Perfecto, ya lo tengo. ¿Algo más que necesites?',
    ],
    recommended: 0,
  };
}
