import type { TeamConfig, TeamName } from './types.js';

export class TeamRegistry {
  private readonly teams = new Map<TeamName, TeamConfig>();

  register(config: TeamConfig): void {
    this.teams.set(config.name, config);
  }

  get(name: TeamName): TeamConfig | undefined {
    return this.teams.get(name);
  }

  getLead(name: TeamName): string | undefined {
    return this.teams.get(name)?.lead;
  }

  getMembers(name: TeamName): string[] {
    return this.teams.get(name)?.members ?? [];
  }

  getTeamForAgent(agentName: string): TeamConfig | undefined {
    for (const config of this.teams.values()) {
      if (config.lead === agentName || config.members.includes(agentName)) {
        return config;
      }
    }
    return undefined;
  }

  listTeams(): TeamConfig[] {
    return [...this.teams.values()];
  }

  get size(): number {
    return this.teams.size;
  }
}

/** All 18 team definitions */
export const TEAM_DEFINITIONS: TeamConfig[] = [
  // Customer-facing teams
  {
    name: 'whatsapp-comms',
    displayName: 'WhatsApp / Comms',
    lead: 'HeadCustomer',
    members: ['WAFlowDesigner', 'MessageTemplater', 'DeliveryMonitor', 'EscalationBot', 'QRLoginBot', 'ConversationAnalyzer'],
    description: 'Multi-session WhatsApp bridge, message flows, delivery',
  },
  {
    name: 'sales-crm',
    displayName: 'Sales / CRM',
    lead: 'CRO',
    members: ['LeadScorer', 'PipelineOptimizer', 'OutreachDrafter', 'DealCloser', 'QuoteGenerator', 'WinLossAnalyzer'],
    description: 'Lead qualification, pipeline management, outreach, deal closing',
  },
  {
    name: 'marketing-growth',
    displayName: 'Marketing / Growth',
    lead: 'CMO',
    members: ['ContentCreator', 'SEOAnalyst', 'CampaignRunner', 'SocialManager', 'ABTestRunner', 'AudienceSegmenter'],
    description: 'Demand generation, campaigns, content, SEO',
  },
  {
    name: 'growth-hacking',
    displayName: 'Growth Hacking',
    lead: 'HeadGrowth',
    members: ['ActivationOptimizer', 'RetentionAnalyst', 'ReferralEng', 'FunnelDesigner', 'OnboardingTracker', 'ViralLoopTester'],
    description: '<10min activation, retention, referrals, funnel optimization',
  },
  {
    name: 'education-onboarding',
    displayName: 'Education / Onboarding',
    lead: 'HeadEducation',
    members: ['TutorialBuilder', 'DocWriter', 'VideoScripter', 'FAQBot', 'CourseDesigner'],
    description: 'User education, onboarding tutorials, help system',
  },
  {
    name: 'customer-success',
    displayName: 'Customer Success',
    lead: 'customerVoice',
    members: ['TicketRouter', 'SatisfactionBot', 'ChurnPredictor', 'FeedbackAggregator', 'CSATAnalyzer', 'EscalationHandler'],
    description: 'Support routing, NPS, churn prediction, feedback',
  },
  {
    name: 'content-brand',
    displayName: 'Content / Brand',
    lead: 'founderAdvocate',
    members: ['CopyWriter', 'TranslationBot', 'BrandVoiceBot', 'AssetManager', 'BackendCopyWriter', 'StyleGuardian'],
    description: 'Customer-facing copy, translation, brand voice, internal docs',
  },
  // Backend engineering teams
  {
    name: 'platform-eng',
    displayName: 'Platform Engineering',
    lead: 'HeadEngineering',
    members: ['InfraOps', 'ServiceMesh', 'DBAdmin', 'APIDesigner', 'CapacityPlanner', 'LatencyMonitor'],
    description: 'Core infrastructure, service health, DB, API contracts',
  },
  {
    name: 'frontend',
    displayName: 'Frontend',
    lead: 'CPO',
    members: ['UIArchitect', 'ComponentDev', 'A11ySpec', 'PerformanceOpt', 'DesignSystemBot'],
    description: 'React/Vite/Tailwind UI, components, accessibility, performance',
  },
  {
    name: 'backend',
    displayName: 'Backend',
    lead: 'CTO',
    members: ['SystemDesigner', 'DataModeler', 'IntegrationEng', 'SecurityEng', 'MigrationRunner', 'CacheOptimizer'],
    description: 'Server-side architecture, data modeling, integrations, security',
  },
  {
    name: 'devops-ci',
    displayName: 'DevOps / CI',
    lead: 'COO',
    members: ['PipelineEng', 'ContainerOps', 'MonitoringEng', 'ReleaseManager', 'IncidentResponder'],
    description: 'GitHub Actions, Docker, Railway deploys, monitoring',
  },
  {
    name: 'qa-testing',
    displayName: 'QA / Testing',
    lead: 'Reviewer',
    members: ['TestArchitect', 'E2ERunner', 'LoadTester', 'RegressionBot', 'FlakyTestHunter', 'CoverageTracker'],
    description: 'Test strategy, e2e, load testing, regression detection',
  },
  // Backend support teams
  {
    name: 'ai-ml',
    displayName: 'AI / ML',
    lead: 'HeadIntelligenceRisk',
    members: ['PromptEng', 'ModelEval', 'RAGSpecialist', 'FineTuneOps', 'CostTracker', 'BenchmarkRunner'],
    description: 'LLM routing, prompt optimization, RAG, model evaluation',
  },
  {
    name: 'finance-billing',
    displayName: 'Finance / Billing',
    lead: 'CFO',
    members: ['InvoiceBot', 'RevenueTracker', 'CostOptimizer', 'ComplianceAuditor', 'ForecastBot'],
    description: 'AI Battery billing, revenue tracking, cost optimization',
  },
  {
    name: 'legal-compliance',
    displayName: 'Legal / Compliance',
    lead: 'EthicsTrustGuardian',
    members: ['PanamaComplianceBot', 'PrivacyAuditor', 'TOS_Monitor', 'DataRetention', 'AuditLogger', 'FactChecker'],
    description: 'Panama compliance, privacy, terms enforcement, data retention, fact-checking',
  },
  {
    name: 'strategy-intel',
    displayName: 'Strategy / Intel',
    lead: 'Chair',
    members: ['MarketScanner', 'CompetitorTracker', 'TrendAnalyst', 'OpportunityBot', 'PricingAnalyzer'],
    description: 'Market scanning, competitive analysis, trend detection',
  },
  {
    name: 'governance-pmo',
    displayName: 'Governance / PMO',
    lead: 'FocusCapacity',
    members: ['SprintPlanner', 'ResourceAllocator', 'RiskMonitor', 'ProgressTracker', 'VelocityTracker', 'MomentumGuardian'],
    description: 'Sprint planning, resource allocation, risk monitoring, progress tracking, continuity enforcement',
  },
  {
    name: 'coaches',
    displayName: 'Coaches & Skill Trainers',
    lead: 'FeedbackCoach',
    members: ['AgentSkillTrainer', 'PlaybookCoach', 'OnboardingCoach', 'ProcessCoach', 'PerformanceReviewer'],
    description: 'Agent training, playbook management, process optimization',
  },
  {
    name: 'meta-tooling',
    displayName: 'Meta-Tooling',
    lead: 'CTO',
    members: ['ToolInventory', 'TemplateDeployer', 'WorkflowGenerator', 'ComputeBuilder', 'ToolCurator'],
    description: 'Custom tool creation, n8n workflow deployment, compute DSL, tool lifecycle management',
  },
];

/** Create and populate a TeamRegistry with all 18 teams */
export function createTeamRegistry(): TeamRegistry {
  const registry = new TeamRegistry();
  for (const def of TEAM_DEFINITIONS) {
    registry.register(def);
  }
  return registry;
}
