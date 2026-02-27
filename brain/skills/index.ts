export { transcribeCall } from './callTranscription.js';
export type { TranscriptionResult, TranscriptionOptions, LLMClient } from './callTranscription.js';

export { draftEmail } from './emailDrafter.js';
export type { EmailDraftResult, EmailDraftOptions } from './emailDrafter.js';

export { analyzeSentiment } from './sentimentAnalysis.js';
export type { SentimentResult, Sentiment, Urgency } from './sentimentAnalysis.js';

export { generateSmartReply } from './smartReply.js';
export type { SmartReplyResult, ConversationMessage } from './smartReply.js';

export { processVoiceBrainDump } from './voiceBrainDump.js';
export type { BrainDumpResult, BrainDumpItem, BrainDumpOptions } from './voiceBrainDump.js';

export { createVideoSpec } from './videoCreation.js';
export type { VideoCreationResult, VideoSpec, VideoScene, VideoCreationOptions } from './videoCreation.js';

export { planBrowserTask } from './browserAgent.js';
export type { BrowserTaskResult, BrowserTaskPlan, BrowserAction, BrowserAgentOptions } from './browserAgent.js';

export { createContent } from './contentCreation.js';
export type { ContentCreationResult, ContentPiece, ContentCreationOptions, ContentPlatform, ContentType } from './contentCreation.js';

export { automateOfficeTask } from './officeAutomation.js';
export type { OfficeTaskResult, GeneratedDocument, SpreadsheetReport, OfficeAutomationOptions, DocumentType } from './officeAutomation.js';

export { PROMPTS } from '../prompts/templates.js';
