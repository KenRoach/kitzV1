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

export { triageInbox } from './inboxTriage.js';
export type { TriageResult, TriageOptions } from './inboxTriage.js';

export { createOnboardingPlan } from './customerOnboarding.js';
export type { OnboardingResult, OnboardingStep, OnboardingOptions } from './customerOnboarding.js';

export { planFulfillment } from './orderFulfillment.js';
export type { FulfillmentResult, FulfillmentStep, FulfillmentOptions } from './orderFulfillment.js';

export { planPaymentCollection } from './paymentCollection.js';
export type { PaymentCollectionResult, PaymentReminderStep, PaymentCollectionOptions } from './paymentCollection.js';

export { qualifyLead } from './leadQualification.js';
export type { LeadScore, LeadQualificationOptions } from './leadQualification.js';

export { scanDocument } from './docScanner.js';
export type { ScanResult, ScanOptions } from './docScanner.js';

export { generateImagePrompt } from './imageGeneration.js';
export type { ImageGenResult, ImageGenOptions } from './imageGeneration.js';

export { generateDeck } from './deckGeneration.js';
export type { DeckResult, Slide, DeckOptions } from './deckGeneration.js';

export { buildWebsite } from './websiteBuilder.js';
export type { WebsiteResult, WebsiteSection, WebsiteOptions } from './websiteBuilder.js';

export { createFlyer } from './flyerPromo.js';
export type { FlyerResult, FlyerOptions } from './flyerPromo.js';

export { createDirectResponse, writeSalesLetter } from './directResponseMarketing.js';
export type { DirectResponseResult, SalesLetterResult, DirectResponseOptions, SalesLetterOptions } from './directResponseMarketing.js';

export { applyPrinciples, analyzeEconomics } from './principlesAdvisor.js';
export type { PrinciplesDecision, EconomicAnalysis, PrinciplesOptions, EconomicOptions } from './principlesAdvisor.js';

export { adviseNegotiation } from './negotiationAdvisor.js';
export type { NegotiationAdvice, NegotiationOptions } from './negotiationAdvisor.js';

export { coachMindset } from './growthMindsetCoach.js';
export type { MindsetAssessment, MindsetOptions } from './growthMindsetCoach.js';

export { assessStartup } from './leanStartupAdvisor.js';
export type { PMFAssessment, LeanStartupOptions } from './leanStartupAdvisor.js';

export { designOffer } from './offersDesigner.js';
export type { OfferDesign, OfferOptions } from './offersDesigner.js';

export { designFunnel } from './funnelArchitect.js';
export type { FunnelDesign, FunnelOptions } from './funnelArchitect.js';

export { createStrategy } from './strategicPlanner.js';
export type { StrategicPlan, StrategyOptions } from './strategicPlanner.js';

export { analyzePowerDynamics } from './powerDynamicsAdvisor.js';
export type { PowerAnalysis, PowerOptions } from './powerDynamicsAdvisor.js';

export { adviseRelationship } from './relationshipBuilder.js';
export type { RelationshipAdvice, RelationshipOptions } from './relationshipBuilder.js';

export { adviseBookkeeping } from './bookkeepingAdvisor.js';
export type { BookkeepingAdvice, BookkeepingOptions, ExpenseCategory, CashFlowForecast } from './bookkeepingAdvisor.js';

export { advisePricing } from './pricingStrategist.js';
export type { PricingStrategy, PricingOptions, PriceTier, CompetitorPrice } from './pricingStrategist.js';

export { createCopyStrategy } from './copyStrategist.js';
export type { CopyStrategy, CopyOptions, HeadlineVariant, CTAVariant, CopyBlock } from './copyStrategist.js';

export { planSEOContent } from './seoContentPlanner.js';
export type { SEOContentPlan, SEOOptions, KeywordCluster, ContentPillar } from './seoContentPlanner.js';

export { buildEmailSequence } from './emailSequenceBuilder.js';
export type { EmailSequencePlan, EmailSequenceOptions, SequenceEmail, SegmentRule } from './emailSequenceBuilder.js';

export { advisePaidAds } from './paidAdsAdvisor.js';
export type { PaidAdsStrategy, PaidAdsOptions, AdCampaign } from './paidAdsAdvisor.js';

export { planSocialMedia } from './socialMediaPlanner.js';
export type { SocialMediaPlan, SocialMediaOptions, PlatformPlan } from './socialMediaPlanner.js';

export { coachColdOutreach } from './coldOutreachCoach.js';
export type { OutreachSequence, OutreachOptions, OutreachMessage } from './coldOutreachCoach.js';

export { handleObjection } from './salesObjectionHandler.js';
export type { ObjectionHandlerResult, ObjectionOptions, ObjectionScript } from './salesObjectionHandler.js';

export { buildReferralProgram } from './referralProgramBuilder.js';
export type { ReferralProgram, ReferralOptions, ReferralTier } from './referralProgramBuilder.js';

export { PROMPTS } from '../prompts/templates.js';
