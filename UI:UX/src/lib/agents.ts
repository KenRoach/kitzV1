// Agent definitions for Kitz OS
// Frontend agents = what the user sees in the portal
// Backend agents = invisible layer doing the heavy lifting (AOS)

export interface AgentDef {
  name: string
  role: string
  group: string
}

// ─── Backend Agents (AOS layer — user never sees these) ───────────────────────
// These agents power the system behind the scenes.
// Each backend agent maps to one or more frontend agents that the user interacts with.

export const BACKEND_AGENTS: AgentDef[] = [
  // Leadership
  { name: 'Manager', role: 'Strategic direction & decisions', group: 'leadership' },
  { name: 'Ops Lead', role: 'Operations & process flow', group: 'leadership' },
  { name: 'Product Lead', role: 'Product roadmap & features', group: 'leadership' },
  { name: 'Founder Advisor', role: 'Founder vision alignment', group: 'leadership' },

  // Sales
  { name: 'Revenue Agent', role: 'Sales pipeline & closing', group: 'sales' },
  { name: 'Growth Agent', role: 'Acquisition & retention', group: 'sales' },
  { name: 'Growth Strategist', role: 'Growth strategy & planning', group: 'sales' },
  { name: 'Networking Agent', role: 'Connection building & outreach', group: 'sales' },

  // Marketing
  { name: 'Marketing Agent', role: 'Demand generation & campaigns', group: 'marketing' },
  { name: 'Customer Voice', role: 'Customer representation & feedback', group: 'marketing' },

  // Operations
  { name: 'Efficiency Agent', role: 'Process optimization', group: 'operations' },
  { name: 'Ops Realist', role: 'Practical execution & delivery', group: 'operations' },
  { name: 'Focus Agent', role: 'Workload & capacity management', group: 'operations' },
  { name: 'Parallel Solver', role: 'Multi-approach problem solving', group: 'operations' },

  // Engineering
  { name: 'Tech Lead', role: 'Engineering & infrastructure', group: 'engineering' },
  { name: 'Engineering Agent', role: 'Code quality & delivery', group: 'engineering' },
  { name: 'Tech Futurist', role: 'Emerging tech advisory', group: 'engineering' },

  // Finance
  { name: 'Finance Agent', role: 'Financial planning & AI Battery', group: 'finance' },
  { name: 'Capital Agent', role: 'Budget & resource allocation', group: 'finance' },
  { name: 'Incentive Agent', role: 'Incentive design & alignment', group: 'finance' },

  // Performance
  { name: 'Feedback Coach', role: 'Performance feedback & reviews', group: 'performance' },
  { name: 'Impact Agent', role: 'Impact measurement & KPIs', group: 'performance' },
  { name: 'Reviewer', role: 'Quality assurance & review', group: 'performance' },

  // Content Creation
  { name: 'Copywriter', role: 'Ad copy, captions & messaging', group: 'content-creation' },
  { name: 'Content Planner', role: 'Editorial calendar & strategy', group: 'content-creation' },
  { name: 'Social Media Agent', role: 'Post scheduling & engagement', group: 'content-creation' },
  { name: 'Brand Voice Agent', role: 'Tone consistency & guidelines', group: 'content-creation' },

  // Compliance
  { name: 'Ethics Guardian', role: 'Ethics & compliance', group: 'compliance' },
  { name: 'Risk Agent', role: 'Risk assessment & security', group: 'compliance' },
  { name: 'Risk Advisor', role: 'Risk-averse advisory', group: 'compliance' },
  { name: 'Board Chair', role: 'Governance oversight', group: 'compliance' },

  // Legal
  { name: 'Contract Agent', role: 'Contract drafting & review', group: 'legal' },
  { name: 'Terms Agent', role: 'Terms of service & policies', group: 'legal' },
  { name: 'IP Agent', role: 'Intellectual property protection', group: 'legal' },

  // Security
  { name: 'Security Lead', role: 'Threat detection & response', group: 'security' },
  { name: 'Auth Agent', role: 'Authentication & access control', group: 'security' },
  { name: 'Data Guard', role: 'Data protection & encryption', group: 'security' },
  { name: 'Audit Agent', role: 'Security audits & pen testing', group: 'security' },

  // PMO
  { name: 'Project Lead', role: 'Project planning & timelines', group: 'pmo' },
  { name: 'Sprint Agent', role: 'Sprint management & standups', group: 'pmo' },
  { name: 'Resource Agent', role: 'Resource allocation & tracking', group: 'pmo' },
  { name: 'Milestone Agent', role: 'Milestone tracking & delivery', group: 'pmo' },

  // GTM
  { name: 'Launch Agent', role: 'Product launch coordination', group: 'gtm' },
  { name: 'Positioning Agent', role: 'Market positioning & messaging', group: 'gtm' },
  { name: 'Channel Agent', role: 'Distribution channel strategy', group: 'gtm' },
  { name: 'Pricing Agent', role: 'Pricing strategy & tiers', group: 'gtm' },

  // R&D
  { name: 'Research Agent', role: 'Market & competitor research', group: 'r-and-d' },
  { name: 'Prototype Agent', role: 'Rapid prototyping & experiments', group: 'r-and-d' },
  { name: 'Innovation Agent', role: 'New feature exploration', group: 'r-and-d' },
  { name: 'Data Scientist', role: 'Data analysis & insights', group: 'r-and-d' },

  // Coaching
  { name: 'Business Coach', role: 'Strategic business coaching', group: 'coaching' },
  { name: 'Skills Coach', role: 'Skill development & mentoring', group: 'coaching' },
  { name: 'Accountability Coach', role: 'Goal tracking & follow-ups', group: 'coaching' },

  // QA
  { name: 'QA Lead', role: 'Quality standards & testing', group: 'qa' },
  { name: 'UX Analyst', role: 'User experience review', group: 'qa' },
  { name: 'Data QA Agent', role: 'Data integrity & validation', group: 'qa' },
  { name: 'Process Analyst', role: 'Workflow quality checks', group: 'qa' },

  // Reporting
  { name: 'Memory Agent', role: 'Knowledge preservation & logs', group: 'reporting' },

  // Support
  { name: 'Customer Agent', role: 'Customer success & support', group: 'support' },
  { name: 'Onboarding Agent', role: 'User onboarding & training', group: 'support' },
]

export const BACKEND_TEAMS = [
  'leadership', 'sales', 'marketing', 'operations', 'engineering',
  'finance', 'performance', 'content-creation', 'compliance', 'legal',
  'security', 'pmo', 'gtm', 'r-and-d', 'coaching', 'qa',
  'reporting', 'support',
] as const
