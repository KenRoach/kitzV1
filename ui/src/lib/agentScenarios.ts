export interface AgentAction {
  agent: string
  action: string
  tool?: string     // e.g., 'crm_listContacts', 'broadcast_send'
  detail?: string   // e.g., 'Querying CRM for active contacts'
}

/** Every customer-facing agent's 5-7 word action phrase (KITZ tone) */
export const AGENT_ACTIONS: Record<string, string> = {
  // WhatsApp / Comms
  'The Connector': 'Picking the right team',
  'Flow Builder': 'Building your chat flow',
  'Message Writer': 'Writing your message template',
  'Delivery Tracker': 'Checking if message landed',
  'Escalation Spotter': 'Flagging this for a human',
  // Sales / CRM
  'The Closer': 'Picking best sales move',
  'Lead Checker': 'Checking their lead score',
  'Pipeline Mover': 'Moving them through pipeline',
  'Follow-Up Writer': 'Writing their follow-up',
  'Deal Maker': 'Making their payment link',
  // Marketing / Growth
  'The Megaphone': 'Planning the next campaign',
  'Content Machine': 'Writing fresh content',
  'Search Guru': 'Checking your search ranking',
  'Campaign Launcher': 'Launching your campaign',
  'Social Scheduler': 'Scheduling your social post',
  // Growth Hacking
  'The Growth Hacker': 'Finding your growth lever',
  'Hook Specialist': 'Getting new users hooked',
  'Loyalty Keeper': 'Keeping customers coming back',
  'Referral Builder': 'Setting up referral codes',
  'Funnel Architect': 'Building your sales funnel',
  // Education / Onboarding
  'The Teacher': 'Mapping the learning path',
  'Tutorial Maker': 'Building a quick tutorial',
  'Doc Writer': 'Writing help docs',
  'Video Scripter': 'Scripting a short video',
  'Answer Bot': 'Finding the best answer',
  // Customer Success
  'The Listener': 'Listening to your customers',
  'Ticket Router': 'Sending ticket to right team',
  'Happy Checker': 'Checking if they\'re happy',
  'Churn Spotter': 'Spotting who might leave',
  'Feedback Collector': 'Collecting all the feedback',
  // Content / Brand
  'Brand Guardian': 'Keeping your brand voice',
  'Copy Writer': 'Writing customer-facing copy',
  'Translator': 'Translating to Spanish',
}

interface ScenarioChainStep {
  agent: string
  tool?: string
  detail?: string
}

interface ScenarioMatchV2 {
  keywords: string[]
  chain: ScenarioChainStep[]
}

const SCENARIOS: ScenarioMatchV2[] = [
  {
    keywords: ['lead', 'score', 'sales', 'deal', 'close', 'pipeline', 'crm', 'prospect', 'client', 'customer'],
    chain: [
      { agent: 'The Closer', tool: 'crm_listContacts', detail: 'Querying CRM contacts' },
      { agent: 'Lead Checker', tool: 'crm_getContact', detail: 'Scoring lead quality' },
      { agent: 'Pipeline Mover', tool: 'crm_updateContact', detail: 'Moving through pipeline' },
      { agent: 'Follow-Up Writer', tool: 'outbound_sendWhatsApp', detail: 'Drafting follow-up message' },
      { agent: 'Deal Maker', tool: 'storefronts_create', detail: 'Creating payment link' },
    ],
  },
  {
    keywords: ['whatsapp', 'message', 'send', 'text', 'chat', 'wa', 'template'],
    chain: [
      { agent: 'The Connector', tool: 'outbound_sendWhatsApp', detail: 'Preparing WhatsApp delivery' },
      { agent: 'Message Writer', detail: 'Crafting message with KITZ tone' },
      { agent: 'Delivery Tracker', detail: 'Confirming message delivery' },
    ],
  },
  {
    keywords: ['broadcast', 'bulk', 'mass', 'blast'],
    chain: [
      { agent: 'The Connector', tool: 'broadcast_preview', detail: 'Finding matching contacts' },
      { agent: 'Message Writer', detail: 'Personalizing with {{name}}' },
      { agent: 'The Connector', tool: 'broadcast_send', detail: 'Sending to recipients' },
    ],
  },
  {
    keywords: ['auto-reply', 'autoreply', 'auto reply', 'away message'],
    chain: [
      { agent: 'The Connector', tool: 'autoreply_get', detail: 'Fetching current config' },
      { agent: 'Message Writer', tool: 'autoreply_set', detail: 'Updating auto-reply' },
    ],
  },
  {
    keywords: ['content', 'blog', 'post', 'write', 'article', 'copy', 'social'],
    chain: [
      { agent: 'The Megaphone', detail: 'Planning content strategy' },
      { agent: 'Content Machine', tool: 'artifact_generateDocument', detail: 'Writing content' },
      { agent: 'Copy Writer', detail: 'Polishing copy' },
      { agent: 'Translator', detail: 'Translating to Spanish' },
    ],
  },
  {
    keywords: ['help', 'how', 'faq', 'tutorial', 'guide', 'learn', 'onboard'],
    chain: [
      { agent: 'The Teacher', tool: 'sop_search', detail: 'Searching knowledge base' },
      { agent: 'Answer Bot', detail: 'Formulating answer' },
      { agent: 'Doc Writer', tool: 'sop_create', detail: 'Writing help doc' },
    ],
  },
  {
    keywords: ['complaint', 'issue', 'problem', 'ticket', 'support', 'unhappy', 'refund'],
    chain: [
      { agent: 'The Listener', detail: 'Analyzing customer sentiment' },
      { agent: 'Ticket Router', detail: 'Routing to right team' },
      { agent: 'Happy Checker', tool: 'crm_updateContact', detail: 'Updating customer status' },
    ],
  },
  {
    keywords: ['grow', 'activate', 'retain', 'funnel', 'referral', 'churn'],
    chain: [
      { agent: 'The Growth Hacker', tool: 'dashboard_metrics', detail: 'Analyzing growth data' },
      { agent: 'Hook Specialist', detail: 'Designing activation hooks' },
      { agent: 'Funnel Architect', detail: 'Building conversion funnel' },
    ],
  },
  {
    keywords: ['campaign', 'marketing', 'seo', 'ads', 'promote', 'launch'],
    chain: [
      { agent: 'The Megaphone', detail: 'Planning campaign strategy' },
      { agent: 'Campaign Launcher', tool: 'broadcast_preview', detail: 'Targeting audience' },
      { agent: 'Search Guru', tool: 'web_search', detail: 'Checking competitive landscape' },
      { agent: 'Social Scheduler', detail: 'Scheduling posts' },
    ],
  },
  {
    keywords: ['pay', 'checkout', 'invoice', 'price', 'payment', 'link'],
    chain: [
      { agent: 'The Closer', tool: 'payments_summary', detail: 'Checking payment status' },
      { agent: 'Deal Maker', tool: 'storefronts_create', detail: 'Creating checkout link' },
    ],
  },
  {
    keywords: ['brand', 'voice', 'tone', 'translate', 'spanish'],
    chain: [
      { agent: 'Brand Guardian', detail: 'Checking brand guidelines' },
      { agent: 'Copy Writer', detail: 'Writing in KITZ voice' },
      { agent: 'Translator', detail: 'Translating content' },
    ],
  },
  {
    keywords: ['metric', 'dashboard', 'how', 'doing', 'revenue', 'stat', 'report'],
    chain: [
      { agent: 'The Closer', tool: 'dashboard_metrics', detail: 'Pulling real-time KPIs' },
      { agent: 'Lead Checker', tool: 'payments_summary', detail: 'Checking revenue data' },
    ],
  },
]

/** Classify user input and return the agent chain with action phrases */
export function classifyScenario(input: string): AgentAction[] {
  const lower = input.toLowerCase()

  for (const scenario of SCENARIOS) {
    if (scenario.keywords.some((kw) => lower.includes(kw))) {
      return scenario.chain.map((step) => ({
        agent: step.agent,
        action: AGENT_ACTIONS[step.agent] ?? 'Working on it',
        tool: step.tool,
        detail: step.detail,
      }))
    }
  }

  // Default: lightweight sales chain
  return [
    { agent: 'The Closer', action: AGENT_ACTIONS['The Closer'] ?? 'Working on it', tool: 'crm_listContacts', detail: 'Scanning your business' },
    { agent: 'Lead Checker', action: AGENT_ACTIONS['Lead Checker'] ?? 'Working on it', detail: 'Analyzing data' },
  ]
}
