/**
 * Agent Factory — Dynamically imports and instantiates all 100 team agents.
 *
 * Follows the launchPipeline.ts pattern: static imports for reliability,
 * lazy construction for efficiency (only instantiate what's needed).
 */

import type { EventBus } from '../eventBus.js';
import type { MemoryStore } from '../memory/memoryStore.js';
import type { AgentToolBridge } from '../toolBridge.js';
import { BaseAgent } from '../agents/baseAgent.js';
import type { TeamName } from '../types.js';

// ── WhatsApp Comms ──
import { WAFlowDesignerAgent } from '../agents/teams/whatsapp-comms/WAFlowDesigner.js';
import { MessageTemplaterAgent } from '../agents/teams/whatsapp-comms/MessageTemplater.js';
import { DeliveryMonitorAgent } from '../agents/teams/whatsapp-comms/DeliveryMonitor.js';
import { EscalationBotAgent } from '../agents/teams/whatsapp-comms/EscalationBot.js';
import { QRLoginBotAgent } from '../agents/teams/whatsapp-comms/QRLoginBot.js';
import { ConversationAnalyzerAgent } from '../agents/teams/whatsapp-comms/ConversationAnalyzer.js';

// ── Sales CRM ──
import { LeadScorerAgent } from '../agents/teams/sales-crm/LeadScorer.js';
import { PipelineOptimizerAgent } from '../agents/teams/sales-crm/PipelineOptimizer.js';
import { OutreachDrafterAgent } from '../agents/teams/sales-crm/OutreachDrafter.js';
import { DealCloserAgent } from '../agents/teams/sales-crm/DealCloser.js';
import { QuoteGeneratorAgent } from '../agents/teams/sales-crm/QuoteGenerator.js';
import { WinLossAnalyzerAgent } from '../agents/teams/sales-crm/WinLossAnalyzer.js';

// ── Marketing Growth ──
import { ContentCreatorAgent } from '../agents/teams/marketing-growth/ContentCreator.js';
import { SEOAnalystAgent } from '../agents/teams/marketing-growth/SEOAnalyst.js';
import { CampaignRunnerAgent } from '../agents/teams/marketing-growth/CampaignRunner.js';
import { SocialManagerAgent } from '../agents/teams/marketing-growth/SocialManager.js';
import { ABTestRunnerAgent } from '../agents/teams/marketing-growth/ABTestRunner.js';
import { AudienceSegmenterAgent } from '../agents/teams/marketing-growth/AudienceSegmenter.js';

// ── Growth Hacking ──
import { ActivationOptimizerAgent } from '../agents/teams/growth-hacking/ActivationOptimizer.js';
import { RetentionAnalystAgent } from '../agents/teams/growth-hacking/RetentionAnalyst.js';
import { ReferralEngAgent } from '../agents/teams/growth-hacking/ReferralEng.js';
import { FunnelDesignerAgent } from '../agents/teams/growth-hacking/FunnelDesigner.js';
import { OnboardingTrackerAgent } from '../agents/teams/growth-hacking/OnboardingTracker.js';
import { ViralLoopTesterAgent } from '../agents/teams/growth-hacking/ViralLoopTester.js';

// ── Education Onboarding ──
import { TutorialBuilderAgent } from '../agents/teams/education-onboarding/TutorialBuilder.js';
import { DocWriterAgent } from '../agents/teams/education-onboarding/DocWriter.js';
import { VideoScripterAgent } from '../agents/teams/education-onboarding/VideoScripter.js';
import { FAQBotAgent } from '../agents/teams/education-onboarding/FAQBot.js';
import { CourseDesignerAgent } from '../agents/teams/education-onboarding/CourseDesigner.js';

// ── Customer Success ──
import { TicketRouterAgent } from '../agents/teams/customer-success/TicketRouter.js';
import { SatisfactionBotAgent } from '../agents/teams/customer-success/SatisfactionBot.js';
import { ChurnPredictorAgent } from '../agents/teams/customer-success/ChurnPredictor.js';
import { FeedbackAggregatorAgent } from '../agents/teams/customer-success/FeedbackAggregator.js';
import { CSATAnalyzerAgent } from '../agents/teams/customer-success/CSATAnalyzer.js';
import { EscalationHandlerAgent } from '../agents/teams/customer-success/EscalationHandler.js';

// ── Content Brand ──
import { CopyWriterAgent } from '../agents/teams/content-brand/CopyWriter.js';
import { TranslationBotAgent } from '../agents/teams/content-brand/TranslationBot.js';
import { BrandVoiceBotAgent } from '../agents/teams/content-brand/BrandVoiceBot.js';
import { AssetManagerAgent } from '../agents/teams/content-brand/AssetManager.js';
import { BackendCopyWriterAgent } from '../agents/teams/content-brand/BackendCopyWriter.js';
import { StyleGuardianAgent } from '../agents/teams/content-brand/StyleGuardian.js';

// ── Platform Engineering ──
import { InfraOpsAgent } from '../agents/teams/platform-eng/InfraOps.js';
import { ServiceMeshAgent } from '../agents/teams/platform-eng/ServiceMesh.js';
import { DBAdminAgent } from '../agents/teams/platform-eng/DBAdmin.js';
import { APIDesignerAgent } from '../agents/teams/platform-eng/APIDesigner.js';
import { CapacityPlannerAgent } from '../agents/teams/platform-eng/CapacityPlanner.js';
import { LatencyMonitorAgent } from '../agents/teams/platform-eng/LatencyMonitor.js';

// ── Frontend ──
import { UIArchitectAgent } from '../agents/teams/frontend/UIArchitect.js';
import { ComponentDevAgent } from '../agents/teams/frontend/ComponentDev.js';
import { A11ySpecAgent } from '../agents/teams/frontend/A11ySpec.js';
import { PerformanceOptAgent } from '../agents/teams/frontend/PerformanceOpt.js';
import { DesignSystemBotAgent } from '../agents/teams/frontend/DesignSystemBot.js';

// ── Backend ──
import { SystemDesignerAgent } from '../agents/teams/backend/SystemDesigner.js';
import { DataModelerAgent } from '../agents/teams/backend/DataModeler.js';
import { IntegrationEngAgent } from '../agents/teams/backend/IntegrationEng.js';
import { SecurityEngAgent } from '../agents/teams/backend/SecurityEng.js';
import { MigrationRunnerAgent } from '../agents/teams/backend/MigrationRunner.js';
import { CacheOptimizerAgent } from '../agents/teams/backend/CacheOptimizer.js';

// ── DevOps CI ──
import { PipelineEngAgent } from '../agents/teams/devops-ci/PipelineEng.js';
import { ContainerOpsAgent } from '../agents/teams/devops-ci/ContainerOps.js';
import { MonitoringEngAgent } from '../agents/teams/devops-ci/MonitoringEng.js';
import { ReleaseManagerAgent } from '../agents/teams/devops-ci/ReleaseManager.js';
import { IncidentResponderAgent } from '../agents/teams/devops-ci/IncidentResponder.js';

// ── QA Testing ──
import { TestArchitectAgent } from '../agents/teams/qa-testing/TestArchitect.js';
import { E2ERunnerAgent } from '../agents/teams/qa-testing/E2ERunner.js';
import { LoadTesterAgent } from '../agents/teams/qa-testing/LoadTester.js';
import { RegressionBotAgent } from '../agents/teams/qa-testing/RegressionBot.js';
import { FlakyTestHunterAgent } from '../agents/teams/qa-testing/FlakyTestHunter.js';
import { CoverageTrackerAgent } from '../agents/teams/qa-testing/CoverageTracker.js';

// ── AI ML ──
import { PromptEngAgent } from '../agents/teams/ai-ml/PromptEng.js';
import { ModelEvalAgent } from '../agents/teams/ai-ml/ModelEval.js';
import { RAGSpecialistAgent } from '../agents/teams/ai-ml/RAGSpecialist.js';
import { FineTuneOpsAgent } from '../agents/teams/ai-ml/FineTuneOps.js';
import { CostTrackerAgent } from '../agents/teams/ai-ml/CostTracker.js';
import { BenchmarkRunnerAgent } from '../agents/teams/ai-ml/BenchmarkRunner.js';

// ── Finance Billing ──
import { InvoiceBotAgent } from '../agents/teams/finance-billing/InvoiceBot.js';
import { RevenueTrackerAgent } from '../agents/teams/finance-billing/RevenueTracker.js';
import { CostOptimizerAgent } from '../agents/teams/finance-billing/CostOptimizer.js';
import { ComplianceAuditorAgent } from '../agents/teams/finance-billing/ComplianceAuditor.js';
import { ForecastBotAgent } from '../agents/teams/finance-billing/ForecastBot.js';

// ── Legal Compliance ──
import { PanamaComplianceBotAgent } from '../agents/teams/legal-compliance/PanamaComplianceBot.js';
import { PrivacyAuditorAgent } from '../agents/teams/legal-compliance/PrivacyAuditor.js';
import { TOSMonitorAgent } from '../agents/teams/legal-compliance/TOS_Monitor.js';
import { DataRetentionAgent } from '../agents/teams/legal-compliance/DataRetention.js';
import { AuditLoggerAgent } from '../agents/teams/legal-compliance/AuditLogger.js';
import { FactCheckerAgent } from '../agents/teams/legal-compliance/FactChecker.js';

// ── Strategy Intel ──
import { MarketScannerAgent } from '../agents/teams/strategy-intel/MarketScanner.js';
import { CompetitorTrackerAgent } from '../agents/teams/strategy-intel/CompetitorTracker.js';
import { TrendAnalystAgent } from '../agents/teams/strategy-intel/TrendAnalyst.js';
import { OpportunityBotAgent } from '../agents/teams/strategy-intel/OpportunityBot.js';
import { PricingAnalyzerAgent } from '../agents/teams/strategy-intel/PricingAnalyzer.js';

// ── Governance PMO ──
import { SprintPlannerAgent } from '../agents/teams/governance-pmo/SprintPlanner.js';
import { ResourceAllocatorAgent } from '../agents/teams/governance-pmo/ResourceAllocator.js';
import { RiskMonitorAgent } from '../agents/teams/governance-pmo/RiskMonitor.js';
import { ProgressTrackerAgent } from '../agents/teams/governance-pmo/ProgressTracker.js';
import { VelocityTrackerAgent } from '../agents/teams/governance-pmo/VelocityTracker.js';
import { MomentumGuardianAgent } from '../agents/teams/governance-pmo/MomentumGuardian.js';

// ── Coaches ──
import { AgentSkillTrainerAgent } from '../agents/teams/coaches/AgentSkillTrainer.js';
import { PlaybookCoachAgent } from '../agents/teams/coaches/PlaybookCoach.js';
import { OnboardingCoachAgent } from '../agents/teams/coaches/OnboardingCoach.js';
import { ProcessCoachAgent } from '../agents/teams/coaches/ProcessCoach.js';
import { PerformanceReviewerAgent } from '../agents/teams/coaches/PerformanceReviewer.js';

/** Agent constructor type */
type AgentCtor = new (bus: EventBus, memory: MemoryStore) => BaseAgent;

/** Registry mapping agent names to constructors */
const AGENT_CTORS: Record<string, AgentCtor> = {
  // WhatsApp Comms
  WAFlowDesigner: WAFlowDesignerAgent,
  MessageTemplater: MessageTemplaterAgent,
  DeliveryMonitor: DeliveryMonitorAgent,
  EscalationBot: EscalationBotAgent,
  QRLoginBot: QRLoginBotAgent,
  ConversationAnalyzer: ConversationAnalyzerAgent,
  // Sales CRM
  LeadScorer: LeadScorerAgent,
  PipelineOptimizer: PipelineOptimizerAgent,
  OutreachDrafter: OutreachDrafterAgent,
  DealCloser: DealCloserAgent,
  QuoteGenerator: QuoteGeneratorAgent,
  WinLossAnalyzer: WinLossAnalyzerAgent,
  // Marketing Growth
  ContentCreator: ContentCreatorAgent,
  SEOAnalyst: SEOAnalystAgent,
  CampaignRunner: CampaignRunnerAgent,
  SocialManager: SocialManagerAgent,
  ABTestRunner: ABTestRunnerAgent,
  AudienceSegmenter: AudienceSegmenterAgent,
  // Growth Hacking
  ActivationOptimizer: ActivationOptimizerAgent,
  RetentionAnalyst: RetentionAnalystAgent,
  ReferralEng: ReferralEngAgent,
  FunnelDesigner: FunnelDesignerAgent,
  OnboardingTracker: OnboardingTrackerAgent,
  ViralLoopTester: ViralLoopTesterAgent,
  // Education Onboarding
  TutorialBuilder: TutorialBuilderAgent,
  DocWriter: DocWriterAgent,
  VideoScripter: VideoScripterAgent,
  FAQBot: FAQBotAgent,
  CourseDesigner: CourseDesignerAgent,
  // Customer Success
  TicketRouter: TicketRouterAgent,
  SatisfactionBot: SatisfactionBotAgent,
  ChurnPredictor: ChurnPredictorAgent,
  FeedbackAggregator: FeedbackAggregatorAgent,
  CSATAnalyzer: CSATAnalyzerAgent,
  EscalationHandler: EscalationHandlerAgent,
  // Content Brand
  CopyWriter: CopyWriterAgent,
  TranslationBot: TranslationBotAgent,
  BrandVoiceBot: BrandVoiceBotAgent,
  AssetManager: AssetManagerAgent,
  BackendCopyWriter: BackendCopyWriterAgent,
  StyleGuardian: StyleGuardianAgent,
  // Platform Engineering
  InfraOps: InfraOpsAgent,
  ServiceMesh: ServiceMeshAgent,
  DBAdmin: DBAdminAgent,
  APIDesigner: APIDesignerAgent,
  CapacityPlanner: CapacityPlannerAgent,
  LatencyMonitor: LatencyMonitorAgent,
  // Frontend
  UIArchitect: UIArchitectAgent,
  ComponentDev: ComponentDevAgent,
  A11ySpec: A11ySpecAgent,
  PerformanceOpt: PerformanceOptAgent,
  DesignSystemBot: DesignSystemBotAgent,
  // Backend
  SystemDesigner: SystemDesignerAgent,
  DataModeler: DataModelerAgent,
  IntegrationEng: IntegrationEngAgent,
  SecurityEng: SecurityEngAgent,
  MigrationRunner: MigrationRunnerAgent,
  CacheOptimizer: CacheOptimizerAgent,
  // DevOps CI
  PipelineEng: PipelineEngAgent,
  ContainerOps: ContainerOpsAgent,
  MonitoringEng: MonitoringEngAgent,
  ReleaseManager: ReleaseManagerAgent,
  IncidentResponder: IncidentResponderAgent,
  // QA Testing
  TestArchitect: TestArchitectAgent,
  E2ERunner: E2ERunnerAgent,
  LoadTester: LoadTesterAgent,
  RegressionBot: RegressionBotAgent,
  FlakyTestHunter: FlakyTestHunterAgent,
  CoverageTracker: CoverageTrackerAgent,
  // AI ML
  PromptEng: PromptEngAgent,
  ModelEval: ModelEvalAgent,
  RAGSpecialist: RAGSpecialistAgent,
  FineTuneOps: FineTuneOpsAgent,
  CostTracker: CostTrackerAgent,
  BenchmarkRunner: BenchmarkRunnerAgent,
  // Finance Billing
  InvoiceBot: InvoiceBotAgent,
  RevenueTracker: RevenueTrackerAgent,
  CostOptimizer: CostOptimizerAgent,
  ComplianceAuditor: ComplianceAuditorAgent,
  ForecastBot: ForecastBotAgent,
  // Legal Compliance
  PanamaComplianceBot: PanamaComplianceBotAgent,
  PrivacyAuditor: PrivacyAuditorAgent,
  TOS_Monitor: TOSMonitorAgent,
  DataRetention: DataRetentionAgent,
  AuditLogger: AuditLoggerAgent,
  FactChecker: FactCheckerAgent,
  // Strategy Intel
  MarketScanner: MarketScannerAgent,
  CompetitorTracker: CompetitorTrackerAgent,
  TrendAnalyst: TrendAnalystAgent,
  OpportunityBot: OpportunityBotAgent,
  PricingAnalyzer: PricingAnalyzerAgent,
  // Governance PMO
  SprintPlanner: SprintPlannerAgent,
  ResourceAllocator: ResourceAllocatorAgent,
  RiskMonitor: RiskMonitorAgent,
  ProgressTracker: ProgressTrackerAgent,
  VelocityTracker: VelocityTrackerAgent,
  MomentumGuardian: MomentumGuardianAgent,
  // Coaches
  AgentSkillTrainer: AgentSkillTrainerAgent,
  PlaybookCoach: PlaybookCoachAgent,
  OnboardingCoach: OnboardingCoachAgent,
  ProcessCoach: ProcessCoachAgent,
  PerformanceReviewer: PerformanceReviewerAgent,
};

/** Instantiate a single agent by name */
export function createAgent(
  name: string,
  bus: EventBus,
  memory: MemoryStore,
  toolBridge?: AgentToolBridge,
): BaseAgent | undefined {
  const Ctor = AGENT_CTORS[name];
  if (!Ctor) return undefined;
  const agent = new Ctor(bus, memory);
  if (toolBridge) agent.setToolBridge(toolBridge);
  return agent;
}

/** Instantiate all agents for a specific team */
export function createTeamAgents(
  team: TeamName,
  members: string[],
  bus: EventBus,
  memory: MemoryStore,
  toolBridge?: AgentToolBridge,
): BaseAgent[] {
  const agents: BaseAgent[] = [];
  for (const name of members) {
    const agent = createAgent(name, bus, memory, toolBridge);
    if (agent) agents.push(agent);
  }
  return agents;
}

/** Instantiate all 100 team agents */
export function createAllAgents(
  bus: EventBus,
  memory: MemoryStore,
  toolBridge?: AgentToolBridge,
): Map<string, BaseAgent> {
  const agents = new Map<string, BaseAgent>();
  for (const [name, Ctor] of Object.entries(AGENT_CTORS)) {
    const agent = new Ctor(bus, memory);
    if (toolBridge) agent.setToolBridge(toolBridge);
    agents.set(name, agent);
  }
  return agents;
}

/** Get the list of all registered agent names */
export function getRegisteredAgentNames(): string[] {
  return Object.keys(AGENT_CTORS);
}

/** Get agent count */
export function getAgentCount(): number {
  return Object.keys(AGENT_CTORS).length;
}
