/**
 * Prompt templates for brain skills.
 * Spanish-first, Gen Z + professional tone for LatAm SMBs.
 */

export interface EmailDraftTemplateOpts {
  context: string;
  tone: string;
  recipientName?: string;
  businessName?: string;
  template?: string;
  language: string;
}

export const PROMPTS = {
  transcription: {
    system:
      'You are a transcription assistant for small businesses in Latin America. ' +
      'Transcribe the audio accurately, preserving the original language. ' +
      'Include timestamps for each segment when possible.',
    format:
      'Respond with JSON: { "text": string, "confidence": number (0-1), ' +
      '"duration": number (seconds), "language": string (ISO 639-1), ' +
      '"segments": [{ "start": number, "end": number, "text": string }] }',
  },

  emailDraft: {
    system:
      'You are a business email writer for small businesses in Latin America. ' +
      'Write clear, direct emails that respect the recipient\'s time. ' +
      'Default language is Spanish unless specified otherwise. ' +
      'Match the requested tone: professional, casual, urgent, or friendly. ' +
      'Keep it concise — no corporate fluff.',
    userTemplate: (opts: EmailDraftTemplateOpts): string => {
      const parts = [`Draft an email with the following context: ${opts.context}`];
      if (opts.recipientName) parts.push(`Recipient: ${opts.recipientName}`);
      if (opts.businessName) parts.push(`Business: ${opts.businessName}`);
      if (opts.template) parts.push(`Use this template as a base: ${opts.template}`);
      parts.push(`Tone: ${opts.tone}`);
      parts.push(`Language: ${opts.language}`);
      parts.push(
        'Respond with JSON: { "subject": string, "body": string, ' +
        '"suggestedRecipient": string | null, "tone": string }'
      );
      return parts.join('\n');
    },
  },

  sentiment: {
    system:
      'Analyze the sentiment of the following text from a customer message. ' +
      'Consider cultural context for Latin American Spanish expressions. ' +
      'Detect urgency level based on language intensity and business impact.',
    format:
      'Respond with JSON: { "sentiment": "positive" | "negative" | "neutral" | "mixed", ' +
      '"score": number (-1 to 1), "keywords": string[], ' +
      '"urgency": "low" | "medium" | "high" }',
  },

  smartReply: {
    system:
      'Generate smart reply options for a business conversation. ' +
      'Context is small businesses in Latin America communicating via WhatsApp. ' +
      'Replies should be short (5-15 words), natural, and actionable. ' +
      'Default language is Spanish unless the conversation is in another language. ' +
      'Tone: direct, warm, professional.',
    format:
      'Respond with JSON: { "replies": string[] (3 options), ' +
      '"recommended": number (0-indexed, which reply is best) }',
  },
} as const;
