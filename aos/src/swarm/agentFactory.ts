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

// ── Meta-Tooling ──
import { ToolInventoryAgent } from '../agents/teams/meta-tooling/ToolInventory.js';
import { TemplateDeployerAgent } from '../agents/teams/meta-tooling/TemplateDeployer.js';
import { WorkflowGeneratorAgent } from '../agents/teams/meta-tooling/WorkflowGenerator.js';
import { ComputeBuilderAgent } from '../agents/teams/meta-tooling/ComputeBuilder.js';
import { ToolCuratorAgent } from '../agents/teams/meta-tooling/ToolCurator.js';

// ── C-Suite (12) ──
import { CEOAgent } from '../agents/core/CEO.js';
import { CFOAgent } from '../agents/core/CFO.js';
import { CMOAgent } from '../agents/core/CMO.js';
import { COOAgent } from '../agents/core/COO.js';
import { CPOAgent } from '../agents/core/CPO.js';
import { CROAgent } from '../agents/core/CRO.js';
import { CTOAgent } from '../agents/core/CTO.js';
import { HeadCustomerAgent } from '../agents/core/HeadCustomer.js';
import { HeadEducationAgent } from '../agents/core/HeadEducation.js';
import { HeadEngineeringAgent } from '../agents/core/HeadEngineering.js';
import { HeadGrowthAgent } from '../agents/core/HeadGrowth.js';
import { HeadIntelligenceRiskAgent } from '../agents/core/HeadIntelligenceRisk.js';

// ── Board (9) ──
import { chairAgent } from '../agents/board/chair.js';
import { conservativeRiskAgent } from '../agents/board/conservativeRisk.js';
import { customerVoiceAgent } from '../agents/board/customerVoice.js';
import { efficiencyStrategistCNAgent } from '../agents/board/efficiencyStrategistCN.js';
import { ethicsTrustGuardianAgent } from '../agents/board/ethicsTrustGuardian.js';
import { founderAdvocateAgent } from '../agents/board/founderAdvocate.js';
import { growthVisionaryAgent } from '../agents/board/growthVisionary.js';
import { operationalRealistAgent } from '../agents/board/operationalRealist.js';
import { techFuturistAgent } from '../agents/board/techFuturist.js';

// ── Governance (9) ──
import { CapitalAllocationAgent } from '../agents/governance/CapitalAllocation.js';
import { FeedbackCoachAgent } from '../agents/governance/FeedbackCoach.js';
import { FocusCapacityAgent } from '../agents/governance/FocusCapacity.js';
import { ImpactStrategyAgent } from '../agents/governance/ImpactStrategy.js';
import { IncentiveAlignmentAgent } from '../agents/governance/IncentiveAlignment.js';
import { InstitutionalMemoryAgent } from '../agents/governance/InstitutionalMemory.js';
import { NetworkingBotAgent } from '../agents/governance/NetworkingBot.js';
import { ParallelSolutionsAgent } from '../agents/governance/ParallelSolutions.js';
import { ReviewerAgent } from '../agents/governance/Reviewer.js';

// ── External (3) ──
import { councilCNAgent } from '../agents/external/councilCN.js';
import { councilUS_AAgent } from '../agents/external/councilUS_A.js';
import { councilUS_BAgent } from '../agents/external/councilUS_B.js';

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
  // Meta-Tooling
  ToolInventory: ToolInventoryAgent,
  TemplateDeployer: TemplateDeployerAgent,
  WorkflowGenerator: WorkflowGeneratorAgent,
  ComputeBuilder: ComputeBuilderAgent,
  ToolCurator: ToolCuratorAgent,
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
  return [...Object.keys(AGENT_CTORS), ...Object.keys(CORE_AGENT_CTORS)];
}

/** Get agent count */
export function getAgentCount(): number {
  return Object.keys(AGENT_CTORS).length + Object.keys(CORE_AGENT_CTORS).length;
}

/** Agent constructor type for core agents — takes (name, bus, memory) */
type CoreAgentCtor = new (name: string, bus: EventBus, memory: MemoryStore) => BaseAgent;

/** Registry for C-Suite, Board, Governance, and External agents */
const CORE_AGENT_CTORS: Record<string, CoreAgentCtor> = {
  // C-Suite (12)
  CEO: CEOAgent,
  CFO: CFOAgent,
  CMO: CMOAgent,
  COO: COOAgent,
  CPO: CPOAgent,
  CRO: CROAgent,
  CTO: CTOAgent,
  HeadCustomer: HeadCustomerAgent,
  HeadEducation: HeadEducationAgent,
  HeadEngineering: HeadEngineeringAgent,
  HeadGrowth: HeadGrowthAgent,
  HeadIntelligenceRisk: HeadIntelligenceRiskAgent,
  // Board (9)
  Chair: chairAgent,
  ConservativeRisk: conservativeRiskAgent,
  CustomerVoice: customerVoiceAgent,
  EfficiencyStrategistCN: efficiencyStrategistCNAgent,
  EthicsTrustGuardian: ethicsTrustGuardianAgent,
  FounderAdvocate: founderAdvocateAgent,
  GrowthVisionary: growthVisionaryAgent,
  OperationalRealist: operationalRealistAgent,
  TechFuturist: techFuturistAgent,
  // Governance (9)
  CapitalAllocation: CapitalAllocationAgent,
  FeedbackCoach: FeedbackCoachAgent,
  FocusCapacity: FocusCapacityAgent,
  ImpactStrategy: ImpactStrategyAgent,
  IncentiveAlignment: IncentiveAlignmentAgent,
  InstitutionalMemory: InstitutionalMemoryAgent,
  NetworkingBot: NetworkingBotAgent,
  ParallelSolutions: ParallelSolutionsAgent,
  Reviewer: ReviewerAgent,
  // External (3)
  CouncilCN: councilCNAgent,
  CouncilUS_A: councilUS_AAgent,
  CouncilUS_B: councilUS_BAgent,
};

/** Instantiate C-Suite, Board, Governance, and External agents (33 agents) */
export function createCoreAgents(
  bus: EventBus,
  memory: MemoryStore,
  toolBridge?: AgentToolBridge,
): Map<string, BaseAgent> {
  const agents = new Map<string, BaseAgent>();
  for (const [name, Ctor] of Object.entries(CORE_AGENT_CTORS)) {
    const agent = new Ctor(name, bus, memory);
    if (toolBridge) agent.setToolBridge(toolBridge);
    agents.set(name, agent);
  }
  return agents;
}
