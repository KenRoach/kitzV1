/**
 * Email drafting skill — generate professional emails via LLM.
 */

import { PROMPTS } from '../prompts/templates.js';
import type { LLMClient } from './callTranscription.js';

export interface EmailDraftResult {
  subject: string;
  body: string;
  suggestedRecipient: string | null;
  tone: string;
}

export interface EmailDraftOptions {
  context: string;
  tone?: string;
  recipientName?: string;
  businessName?: string;
  template?: string;
  language?: string;
}

/**
 * Draft an email using LLM.
 * When no llmClient is provided, returns a stub result.
 */
export async function draftEmail(
  options: EmailDraftOptions,
  llmClient?: LLMClient,
): Promise<EmailDraftResult> {
  const tone = options.tone ?? 'professional';
  const language = options.language ?? 'es';

  if (llmClient) {
    const prompt = PROMPTS.emailDraft.userTemplate({
      context: options.context,
      tone,
      recipientName: options.recipientName,
      businessName: options.businessName,
      template: options.template,
      language,
    });

    const response = await llmClient.complete({
      prompt,
      system: PROMPTS.emailDraft.system,
      tier: 'sonnet',
    });

    try {
      return JSON.parse(response.text) as EmailDraftResult;
    } catch {
      return {
        subject: 'Draft Email',
        body: response.text,
        suggestedRecipient: null,
        tone,
      };
    }
  }

  return {
    subject: '[Draft] ' + options.context.slice(0, 50),
    body: `[Email draft unavailable — no LLM client configured]\n\nContext: ${options.context}`,
    suggestedRecipient: null,
    tone,
  };
}
