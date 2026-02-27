export { transcribeCall } from './callTranscription.js';
export type { TranscriptionResult, TranscriptionOptions, LLMClient } from './callTranscription.js';

export { draftEmail } from './emailDrafter.js';
export type { EmailDraftResult, EmailDraftOptions } from './emailDrafter.js';

export { analyzeSentiment } from './sentimentAnalysis.js';
export type { SentimentResult, Sentiment, Urgency } from './sentimentAnalysis.js';

export { generateSmartReply } from './smartReply.js';
export type { SmartReplyResult, ConversationMessage } from './smartReply.js';

export { PROMPTS } from '../prompts/templates.js';
