export interface AgentAction {
  agent: string
  action: string
}

/** Every customer-facing agent's 5-7 word action phrase (KITZ tone) */
export const AGENT_ACTIONS: Record<string, string> = {
  // WhatsApp / Comms
  HeadCustomer: 'Picking the right team',
  WAFlowDesigner: 'Building your chat flow',
  MessageTemplater: 'Writing your message template',
  DeliveryMonitor: 'Checking if message landed',
  EscalationBot: 'Flagging this for a human',
  // Sales / CRM
  CRO: 'Picking best sales move',
  LeadScorer: 'Checking their lead score',
  PipelineOptimizer: 'Moving them through pipeline',
  OutreachDrafter: 'Writing their follow-up',
  DealCloser: 'Making their payment link',
  // Marketing / Growth
  CMO: 'Planning the next campaign',
  ContentCreator: 'Writing fresh content',
  SEOAnalyst: 'Checking your search ranking',
  CampaignRunner: 'Launching your campaign',
  SocialManager: 'Scheduling your social post',
  // Growth Hacking
  HeadGrowth: 'Finding your growth lever',
  ActivationOptimizer: 'Getting new users hooked',
  RetentionAnalyst: 'Keeping customers coming back',
  ReferralEng: 'Setting up referral codes',
  FunnelDesigner: 'Building your sales funnel',
  // Education / Onboarding
  HeadEducation: 'Mapping the learning path',
  TutorialBuilder: 'Building a quick tutorial',
  DocWriter: 'Writing help docs',
  VideoScripter: 'Scripting a short video',
  FAQBot: 'Finding the best answer',
  // Customer Success
  CustomerVoice: 'Listening to your customers',
  TicketRouter: 'Sending ticket to right team',
  SatisfactionBot: 'Checking if they\'re happy',
  ChurnPredictor: 'Spotting who might leave',
  FeedbackAggregator: 'Collecting all the feedback',
  // Content / Brand
  FounderAdvocate: 'Keeping your brand voice',
  CopyWriter: 'Writing customer-facing copy',
  TranslationBot: 'Translating to Spanish',
}

interface ScenarioMatch {
  keywords: string[]
  chain: string[]
}

const SCENARIOS: ScenarioMatch[] = [
  {
    keywords: ['lead', 'score', 'sales', 'deal', 'close', 'pipeline', 'crm', 'prospect', 'client', 'customer'],
    chain: ['CRO', 'LeadScorer', 'PipelineOptimizer', 'OutreachDrafter', 'DealCloser'],
  },
  {
    keywords: ['whatsapp', 'message', 'send', 'text', 'chat', 'wa', 'template'],
    chain: ['HeadCustomer', 'MessageTemplater', 'DeliveryMonitor'],
  },
  {
    keywords: ['content', 'blog', 'post', 'write', 'article', 'copy', 'social'],
    chain: ['CMO', 'ContentCreator', 'CopyWriter', 'TranslationBot'],
  },
  {
    keywords: ['help', 'how', 'faq', 'tutorial', 'guide', 'learn', 'onboard'],
    chain: ['HeadEducation', 'FAQBot', 'DocWriter'],
  },
  {
    keywords: ['complaint', 'issue', 'problem', 'ticket', 'support', 'unhappy', 'refund'],
    chain: ['CustomerVoice', 'TicketRouter', 'SatisfactionBot'],
  },
  {
    keywords: ['grow', 'activate', 'retain', 'funnel', 'referral', 'churn'],
    chain: ['HeadGrowth', 'ActivationOptimizer', 'FunnelDesigner'],
  },
  {
    keywords: ['campaign', 'marketing', 'seo', 'ads', 'promote', 'launch'],
    chain: ['CMO', 'CampaignRunner', 'SEOAnalyst', 'SocialManager'],
  },
  {
    keywords: ['pay', 'checkout', 'invoice', 'price', 'payment', 'link'],
    chain: ['CRO', 'DealCloser'],
  },
  {
    keywords: ['brand', 'voice', 'tone', 'translate', 'spanish'],
    chain: ['FounderAdvocate', 'CopyWriter', 'TranslationBot'],
  },
]

/** Classify user input and return the agent chain with action phrases */
export function classifyScenario(input: string): AgentAction[] {
  const lower = input.toLowerCase()

  for (const scenario of SCENARIOS) {
    if (scenario.keywords.some((kw) => lower.includes(kw))) {
      return scenario.chain.map((agent) => ({
        agent,
        action: AGENT_ACTIONS[agent] ?? 'Working on it',
      }))
    }
  }

  // Default: lightweight sales chain
  return [
    { agent: 'CRO', action: AGENT_ACTIONS.CRO ?? 'Working on it' },
    { agent: 'LeadScorer', action: AGENT_ACTIONS.LeadScorer ?? 'Working on it' },
  ]
}
