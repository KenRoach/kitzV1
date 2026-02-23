export interface AgentAction {
  agent: string
  action: string
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

interface ScenarioMatch {
  keywords: string[]
  chain: string[]
}

const SCENARIOS: ScenarioMatch[] = [
  {
    keywords: ['lead', 'score', 'sales', 'deal', 'close', 'pipeline', 'crm', 'prospect', 'client', 'customer'],
    chain: ['The Closer', 'Lead Checker', 'Pipeline Mover', 'Follow-Up Writer', 'Deal Maker'],
  },
  {
    keywords: ['whatsapp', 'message', 'send', 'text', 'chat', 'wa', 'template'],
    chain: ['The Connector', 'Message Writer', 'Delivery Tracker'],
  },
  {
    keywords: ['content', 'blog', 'post', 'write', 'article', 'copy', 'social'],
    chain: ['The Megaphone', 'Content Machine', 'Copy Writer', 'Translator'],
  },
  {
    keywords: ['help', 'how', 'faq', 'tutorial', 'guide', 'learn', 'onboard'],
    chain: ['The Teacher', 'Answer Bot', 'Doc Writer'],
  },
  {
    keywords: ['complaint', 'issue', 'problem', 'ticket', 'support', 'unhappy', 'refund'],
    chain: ['The Listener', 'Ticket Router', 'Happy Checker'],
  },
  {
    keywords: ['grow', 'activate', 'retain', 'funnel', 'referral', 'churn'],
    chain: ['The Growth Hacker', 'Hook Specialist', 'Funnel Architect'],
  },
  {
    keywords: ['campaign', 'marketing', 'seo', 'ads', 'promote', 'launch'],
    chain: ['The Megaphone', 'Campaign Launcher', 'Search Guru', 'Social Scheduler'],
  },
  {
    keywords: ['pay', 'checkout', 'invoice', 'price', 'payment', 'link'],
    chain: ['The Closer', 'Deal Maker'],
  },
  {
    keywords: ['brand', 'voice', 'tone', 'translate', 'spanish'],
    chain: ['Brand Guardian', 'Copy Writer', 'Translator'],
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
    { agent: 'The Closer', action: AGENT_ACTIONS['The Closer'] ?? 'Working on it' },
    { agent: 'Lead Checker', action: AGENT_ACTIONS['Lead Checker'] ?? 'Working on it' },
  ]
}
