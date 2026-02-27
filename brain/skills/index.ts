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

export { optimizeInventory } from './inventoryOptimizer.js';
export type { InventoryOptimization, InventoryOptions, ReorderPoint } from './inventoryOptimizer.js';

export { adviseSupplyChain } from './supplyChainAdvisor.js';
export type { SupplyChainAdvice, SupplyChainOptions, SupplierScore } from './supplyChainAdvisor.js';

export { advisePaymentMethods } from './paymentMethodAdvisor.js';
export type { PaymentMethodAdvice, PaymentMethodOptions, PaymentGateway } from './paymentMethodAdvisor.js';

export { adviseRetention } from './customerRetentionAdvisor.js';
export type { RetentionStrategy, RetentionOptions, ChurnSignal } from './customerRetentionAdvisor.js';

export { analyzeFunnel } from './salesFunnelAnalyzer.js';
export type { FunnelAnalysis, SalesFunnelOptions, FunnelStage } from './salesFunnelAnalyzer.js';

export { advisePanamaBusiness } from './panamaBusinessAdvisor.js';
export type { PanamaBusinessAdvice, PanamaBusinessOptions } from './panamaBusinessAdvisor.js';

export { adviseMexicoBusiness } from './mexicoBusinessAdvisor.js';
export type { MexicoBusinessAdvice, MexicoBusinessOptions } from './mexicoBusinessAdvisor.js';

export { adviseColombianBusiness } from './colombiaBusinessAdvisor.js';
export type { ColombiaBusinessAdvice, ColombiaBusinessOptions } from './colombiaBusinessAdvisor.js';

export { adviseBrazilBusiness } from './brazilBusinessAdvisor.js';
export type { BrazilBusinessAdvice, BrazilBusinessOptions } from './brazilBusinessAdvisor.js';

export { navigateLatamCompliance } from './latamComplianceNavigator.js';
export type { LatamComplianceAdvice, LatamComplianceOptions, CountryCompliance } from './latamComplianceNavigator.js';

// Week 5
export { designBusinessModel } from './businessModelDesigner.js';
export type { BusinessModelResult, BusinessModelOptions, BusinessModelCanvas } from './businessModelDesigner.js';
export { analyzeCompetition } from './competitiveAnalyst.js';
export type { CompetitiveAnalysis, CompetitiveOptions, CompetitorProfile } from './competitiveAnalyst.js';
export { sizeMarket } from './marketSizingAdvisor.js';
export type { MarketSizing, MarketSizingOptions } from './marketSizingAdvisor.js';
export { advisePartnership } from './partnershipAdvisor.js';
export type { PartnershipStrategy, PartnershipOptions } from './partnershipAdvisor.js';
export { adviseFundraising } from './fundraisingAdvisor.js';
export type { FundraisingStrategy, FundraisingOptions } from './fundraisingAdvisor.js';

// Week 6
export { designWorkflow } from './workflowDesigner.js';
export type { WorkflowDesign, WorkflowOptions } from './workflowDesigner.js';
export { adviseAnalytics } from './analyticsAdvisor.js';
export type { AnalyticsAdvice, AnalyticsOptions } from './analyticsAdvisor.js';
export { planIntegrations } from './noCodeIntegrator.js';
export type { IntegrationPlan, NoCodeOptions } from './noCodeIntegrator.js';
export { adviseHubSpot } from './hubspotAdvisor.js';
export type { HubSpotAdvice, HubSpotOptions } from './hubspotAdvisor.js';
export { adviseGoogleBusiness } from './googleBusinessAdvisor.js';
export type { GoogleBusinessAdvice, GoogleBusinessOptions } from './googleBusinessAdvisor.js';

// Week 7
export { planTaxes } from './taxPlanner.js';
export type { TaxPlan, TaxPlannerOptions } from './taxPlanner.js';
export { forecastBudget } from './budgetForecaster.js';
export type { BudgetForecast, BudgetOptions } from './budgetForecaster.js';
export { optimizeExpenses } from './expenseOptimizer.js';
export type { ExpenseOptimization, ExpenseOptions } from './expenseOptimizer.js';
export { analyzeUnitEconomics } from './unitEconomicsAdvisor.js';
export type { UnitEconomicsAnalysis, UnitEconomicsOptions } from './unitEconomicsAdvisor.js';
export { adviseSubscriptionBilling } from './subscriptionBillingAdvisor.js';
export type { SubscriptionAdvice, SubscriptionOptions } from './subscriptionBillingAdvisor.js';

// Week 8
export { adviseHiring } from './hiringAdvisor.js';
export type { HiringPlan, HiringOptions } from './hiringAdvisor.js';
export { buildEmployeeOnboarding } from './employeeOnboardingBuilder.js';
export type { OnboardingPlan as EmployeeOnboardingPlan, EmployeeOnboardingOptions } from './employeeOnboardingBuilder.js';
export { buildTeamCulture } from './teamCultureBuilder.js';
export type { CulturePlan, CultureOptions } from './teamCultureBuilder.js';
export { adviseCompensation } from './compensationAdvisor.js';
export type { CompensationPlan, CompensationOptions } from './compensationAdvisor.js';
export { advisePsychologicalSafety } from './psychologicalSafetyAdvisor.js';
export type { PsychSafetyPlan, PsychSafetyOptions } from './psychologicalSafetyAdvisor.js';

// Week 9
export { optimizeShopify } from './shopifyOptimizer.js';
export type { ShopifyOptimization, ShopifyOptions } from './shopifyOptimizer.js';
export { adviseMercadoLibre } from './mercadoLibreAdvisor.js';
export type { MercadoLibreAdvice, MercadoLibreOptions } from './mercadoLibreAdvisor.js';
export { adviseWooCommerce } from './wooCommerceAdvisor.js';
export type { WooCommerceAdvice, WooCommerceOptions } from './wooCommerceAdvisor.js';
export { adviseWhatsAppBusiness } from './whatsappBusinessAdvisor.js';
export type { WhatsAppBusinessAdvice, WhatsAppBusinessOptions } from './whatsappBusinessAdvisor.js';
export { advisePixIntegration } from './pixIntegrationAdvisor.js';
export type { PixIntegrationAdvice, PixIntegrationOptions } from './pixIntegrationAdvisor.js';

// Week 10
export { adviseBlogPost } from './blogPostAdvisor.js';
export type { BlogPostAdvice, BlogPostOptions } from './blogPostAdvisor.js';
export { buildPersonalBrand } from './personalBrandBuilder.js';
export type { PersonalBrandAdvice, PersonalBrandOptions } from './personalBrandBuilder.js';
export { advisePodcast } from './podcastAdvisor.js';
export type { PodcastAdvice, PodcastOptions } from './podcastAdvisor.js';
export { writePr } from './prWriter.js';
export type { PrWriterAdvice, PrWriterOptions } from './prWriter.js';
export { adviseProductLaunch } from './productLaunchAdvisor.js';
export type { ProductLaunchAdvice, ProductLaunchOptions } from './productLaunchAdvisor.js';

// Week 11
export { adviseDripCampaign } from './dripCampaignAdvisor.js';
export type { DripCampaignAdvice, DripCampaignOptions } from './dripCampaignAdvisor.js';
export { adviseDocumentArchive } from './documentArchiveAdvisor.js';
export type { DocumentArchiveAdvice, DocumentArchiveOptions } from './documentArchiveAdvisor.js';
export { adviseMailMerge } from './mailMergeAdvisor.js';
export type { MailMergeAdvice, MailMergeOptions } from './mailMergeAdvisor.js';
export { adviseScheduling } from './schedulingAdvisor.js';
export type { SchedulingAdvice, SchedulingOptions } from './schedulingAdvisor.js';
export { adviseInvoicing } from './invoicingAdvisor.js';
export type { InvoicingAdvice, InvoicingOptions } from './invoicingAdvisor.js';

// Week 12
export { adviseChileBusiness } from './chileBusinessAdvisor.js';
export type { ChileBusinessAdvice, ChileBusinessOptions } from './chileBusinessAdvisor.js';
export { advisePeruBusiness } from './peruBusinessAdvisor.js';
export type { PeruBusinessAdvice, PeruBusinessOptions } from './peruBusinessAdvisor.js';
export { adviseArgentinaBusiness } from './argentinaBusinessAdvisor.js';
export type { ArgentinaBusinessAdvice, ArgentinaBusinessOptions } from './argentinaBusinessAdvisor.js';
export { adviseCostaRicaBusiness } from './costaRicaBusinessAdvisor.js';
export type { CostaRicaBusinessAdvice, CostaRicaBusinessOptions } from './costaRicaBusinessAdvisor.js';
export { adviseCrossBorderTrade } from './crossBorderTradeAdvisor.js';
export type { CrossBorderTradeAdvice, CrossBorderTradeOptions } from './crossBorderTradeAdvisor.js';

export { PROMPTS } from '../prompts/templates.js';
