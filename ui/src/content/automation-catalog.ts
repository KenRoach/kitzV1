/**
 * KITZ Automation Catalog
 *
 * User-facing automation positions — what KITZ automates for the business.
 * No internal tool names exposed. Agents MONITOR these automations.
 */

/* ── Types ── */

export type AutomationCategory =
  | 'sales-pipeline'
  | 'customer-comms'
  | 'marketing-content'
  | 'invoices-payments'
  | 'crm-contacts'
  | 'operations'
  | 'analytics-reports'
  | 'content-creation'
  | 'knowledge-base'
  | 'integrations'

export type AutomationStatus = 'live' | 'coming-soon'
export type AutomationTrigger = 'realtime' | 'scheduled' | 'on-demand' | 'webhook'

export interface AutomationItem {
  id: string
  name: string
  description: string
  /** Which agent monitors/manages this automation */
  monitoredBy: string
  status: AutomationStatus
  trigger: AutomationTrigger
}

export interface AutomationGroup {
  category: AutomationCategory
  label: string
  description: string
  icon: string
  color: string
  items: AutomationItem[]
}

/* ── Catalog Data ── */

export const AUTOMATION_CATALOG: AutomationGroup[] = [
  {
    category: 'sales-pipeline',
    label: 'Sales Pipeline',
    description: 'Lead scoring, funnel stages, deal closing',
    icon: 'TrendingUp',
    color: 'blue',
    items: [
      { id: 'sp-1', name: 'Lead Scoring', description: 'AI scores every lead 0-100 based on engagement and fit', monitoredBy: 'Lead Finder', status: 'live', trigger: 'on-demand' },
      { id: 'sp-2', name: 'Stage Transitions', description: 'Automatically move contacts through your pipeline', monitoredBy: 'Follow-Up Agent', status: 'live', trigger: 'realtime' },
      { id: 'sp-3', name: 'Next Best Action', description: 'AI recommends the best next move per lead', monitoredBy: 'Closer Agent', status: 'live', trigger: 'on-demand' },
      { id: 'sp-4', name: 'Pipeline Snapshot', description: 'Real-time funnel status with conversion rates', monitoredBy: 'Kitz Manager', status: 'live', trigger: 'on-demand' },
      { id: 'sp-5', name: 'Weekly Conversion Report', description: 'Conversion analysis with drop-off detection every Friday', monitoredBy: 'Kitz Manager', status: 'live', trigger: 'scheduled' },
      { id: 'sp-6', name: 'Morning Lead Score', description: 'Score all active leads every day at 8 AM', monitoredBy: 'Lead Finder', status: 'live', trigger: 'scheduled' },
      { id: 'sp-7', name: 'Stage Move Handler', description: 'When a lead moves stages, trigger follow-ups automatically', monitoredBy: 'Follow-Up Agent', status: 'live', trigger: 'webhook' },
    ],
  },
  {
    category: 'customer-comms',
    label: 'Customer Comms',
    description: 'WhatsApp, email, SMS — omni-channel messaging',
    icon: 'MessageSquare',
    color: 'green',
    items: [
      { id: 'cc-1', name: 'WhatsApp Messaging', description: 'Send WhatsApp messages with draft approval', monitoredBy: 'Follow-Up Agent', status: 'live', trigger: 'on-demand' },
      { id: 'cc-2', name: 'Email Delivery', description: 'Send branded emails through your provider', monitoredBy: 'Follow-Up Agent', status: 'live', trigger: 'on-demand' },
      { id: 'cc-3', name: 'Segment Broadcast', description: 'Blast messages to filtered customer segments', monitoredBy: 'Campaign Agent', status: 'live', trigger: 'on-demand' },
      { id: 'cc-4', name: 'Auto-Reply', description: 'Instant responses when you are away', monitoredBy: 'Order Tracker', status: 'live', trigger: 'realtime' },
      { id: 'cc-5', name: 'Welcome Sequence', description: '4-touch onboarding over 10 days for new contacts', monitoredBy: 'Follow-Up Agent', status: 'live', trigger: 'webhook' },
      { id: 'cc-6', name: 'Win-Back Campaign', description: 'Re-engage inactive contacts every Monday', monitoredBy: 'Campaign Agent', status: 'live', trigger: 'scheduled' },
      { id: 'cc-7', name: 'Post-Purchase Follow-Up', description: 'Thank you + review request after every sale', monitoredBy: 'Checkout Agent', status: 'live', trigger: 'webhook' },
    ],
  },
  {
    category: 'marketing-content',
    label: 'Marketing & Campaigns',
    description: 'Content generation, campaigns, social posts',
    icon: 'Megaphone',
    color: 'pink',
    items: [
      { id: 'mc-1', name: 'AI Content Writer', description: 'Generate social posts, email copy, and ad text', monitoredBy: 'Content Agent', status: 'live', trigger: 'on-demand' },
      { id: 'mc-2', name: 'Multi-Touch Campaign', description: 'Campaigns across WhatsApp, email, SMS with A/B variants', monitoredBy: 'Campaign Agent', status: 'live', trigger: 'on-demand' },
      { id: 'mc-3', name: 'Nurture Sequence', description: '4-touch nurture: WA, Email, SMS, Voice over 14 days', monitoredBy: 'Follow-Up Agent', status: 'live', trigger: 'on-demand' },
      { id: 'mc-4', name: 'Auto-Translate', description: 'Bilingual content in Spanish and English', monitoredBy: 'Content Agent', status: 'live', trigger: 'on-demand' },
      { id: 'mc-5', name: 'Social Post Scheduler', description: 'Create, translate, and schedule social content', monitoredBy: 'Content Agent', status: 'live', trigger: 'on-demand' },
      { id: 'mc-6', name: 'Campaign Performance', description: 'Track engagement, ROI, and conversions per campaign', monitoredBy: 'Campaign Agent', status: 'live', trigger: 'on-demand' },
    ],
  },
  {
    category: 'invoices-payments',
    label: 'Invoices & Payments',
    description: 'Billing, checkout links, payment tracking',
    icon: 'Receipt',
    color: 'emerald',
    items: [
      { id: 'ip-1', name: 'Checkout Links', description: 'One-tap payment links for Stripe, PayPal, Yappy', monitoredBy: 'Checkout Agent', status: 'live', trigger: 'on-demand' },
      { id: 'ip-2', name: 'Revenue Overview', description: 'Income, pending payments, and overdue summary', monitoredBy: 'Bookkeeper', status: 'live', trigger: 'on-demand' },
      { id: 'ip-3', name: 'Invoice Generator', description: 'Branded invoices with line items, tax, totals', monitoredBy: 'Invoice Agent', status: 'live', trigger: 'on-demand' },
      { id: 'ip-4', name: 'Quote Builder', description: 'Professional quotes with pricing and terms', monitoredBy: 'Closer Agent', status: 'live', trigger: 'on-demand' },
      { id: 'ip-5', name: 'Auto-Invoice on Sale', description: 'Invoice generated automatically when order confirms', monitoredBy: 'Invoice Agent', status: 'live', trigger: 'webhook' },
      { id: 'ip-6', name: 'Quote Follow-Up', description: '3-day reminder if quote goes unanswered', monitoredBy: 'Follow-Up Agent', status: 'live', trigger: 'scheduled' },
    ],
  },
  {
    category: 'crm-contacts',
    label: 'CRM & Contacts',
    description: 'Contact management, segmentation, tags',
    icon: 'Users',
    color: 'purple',
    items: [
      { id: 'cr-1', name: 'Contact Lookup', description: 'Instant search across all your contacts', monitoredBy: 'Follow-Up Agent', status: 'live', trigger: 'on-demand' },
      { id: 'cr-2', name: 'Smart Tags', description: 'Auto-tag contacts by behavior and stage', monitoredBy: 'Follow-Up Agent', status: 'live', trigger: 'realtime' },
      { id: 'cr-3', name: 'Audience Segments', description: 'Filter contacts by tags, status, or activity', monitoredBy: 'Campaign Agent', status: 'live', trigger: 'on-demand' },
      { id: 'cr-4', name: 'Business Summary', description: 'Full CRM overview — contacts, orders, revenue', monitoredBy: 'Kitz Manager', status: 'live', trigger: 'on-demand' },
      { id: 'cr-5', name: 'Personalized Messages', description: 'Merge customer data into message templates', monitoredBy: 'Follow-Up Agent', status: 'live', trigger: 'on-demand' },
      { id: 'cr-6', name: 'Bulk Personalization', description: 'Send personalized messages to entire segments', monitoredBy: 'Campaign Agent', status: 'live', trigger: 'webhook' },
    ],
  },
  {
    category: 'operations',
    label: 'Operations',
    description: 'Orders, tasks, scheduling, documents',
    icon: 'Settings',
    color: 'orange',
    items: [
      { id: 'op-1', name: 'Order Tracking', description: 'Track orders from placed to delivered', monitoredBy: 'Order Tracker', status: 'live', trigger: 'on-demand' },
      { id: 'op-2', name: 'Task Manager', description: 'Create and assign tasks to agents or team', monitoredBy: 'Task Agent', status: 'live', trigger: 'on-demand' },
      { id: 'op-3', name: 'Document Vault', description: 'Store and search documents with AI tagging', monitoredBy: 'Bookkeeper', status: 'live', trigger: 'on-demand' },
      { id: 'op-4', name: 'SOP Library', description: 'Standard procedures that keep quality consistent', monitoredBy: 'Kitz Manager', status: 'live', trigger: 'on-demand' },
      { id: 'op-5', name: 'Smart Notifications', description: 'Priority queue with retry and dead-letter handling', monitoredBy: 'Order Tracker', status: 'live', trigger: 'realtime' },
    ],
  },
  {
    category: 'analytics-reports',
    label: 'Analytics & Reports',
    description: 'Dashboards, metrics, scheduled reports',
    icon: 'BarChart3',
    color: 'indigo',
    items: [
      { id: 'ar-1', name: 'Live Dashboard', description: 'Real-time KPIs — revenue, contacts, orders', monitoredBy: 'Kitz Manager', status: 'live', trigger: 'on-demand' },
      { id: 'ar-2', name: 'Campaign Analytics', description: 'ROI, open rates, and engagement per campaign', monitoredBy: 'Campaign Agent', status: 'live', trigger: 'on-demand' },
      { id: 'ar-3', name: 'Funnel Analysis', description: 'Where leads drop off and how to fix it', monitoredBy: 'Kitz Manager', status: 'live', trigger: 'on-demand' },
      { id: 'ar-4', name: 'AI Credit Usage', description: 'Track AI battery credits and daily limits', monitoredBy: 'Cash Flow Agent', status: 'live', trigger: 'realtime' },
      { id: 'ar-5', name: 'Weekly Report', description: 'Performance digest delivered to WhatsApp every Friday', monitoredBy: 'Kitz Manager', status: 'live', trigger: 'scheduled' },
    ],
  },
  {
    category: 'content-creation',
    label: 'Content Creation',
    description: 'Decks, flyers, emails, websites, bio links',
    icon: 'Palette',
    color: 'rose',
    items: [
      { id: 'ct-1', name: 'Pitch Deck Builder', description: 'AI builds investor and sales decks from a brief', monitoredBy: 'Content Agent', status: 'live', trigger: 'on-demand' },
      { id: 'ct-2', name: 'Visual Email Builder', description: 'Branded HTML emails with responsive layout', monitoredBy: 'Campaign Agent', status: 'live', trigger: 'on-demand' },
      { id: 'ct-3', name: 'Flyer Generator', description: 'Promotional flyers for WhatsApp and print', monitoredBy: 'Content Agent', status: 'live', trigger: 'on-demand' },
      { id: 'ct-4', name: 'Landing Page Builder', description: 'Full landing pages with hero, features, and CTA', monitoredBy: 'Growth Agent', status: 'live', trigger: 'on-demand' },
      { id: 'ct-5', name: 'Product Catalog', description: 'Auto-generated catalog from your products', monitoredBy: 'Content Agent', status: 'live', trigger: 'on-demand' },
      { id: 'ct-6', name: 'Bio Link Page', description: 'Link-in-bio for Instagram and WhatsApp sharing', monitoredBy: 'Growth Agent', status: 'live', trigger: 'on-demand' },
      { id: 'ct-7', name: 'Brand Kit', description: 'Your logo, colors, fonts, and tone — everywhere', monitoredBy: 'Kitz Manager', status: 'live', trigger: 'on-demand' },
    ],
  },
  {
    category: 'integrations',
    label: 'Integrations',
    description: 'WhatsApp, Stripe, web, workspace',
    icon: 'Plug',
    color: 'gray',
    items: [
      { id: 'in-1', name: 'WhatsApp Connection', description: 'Multi-device WhatsApp bridge with QR login', monitoredBy: 'Order Tracker', status: 'live', trigger: 'realtime' },
      { id: 'in-2', name: 'Payment Webhooks', description: 'Instant payment confirmations from Stripe & PayPal', monitoredBy: 'Bookkeeper', status: 'live', trigger: 'webhook' },
      { id: 'in-3', name: 'Website Deploy', description: 'Push generated pages live to the web', monitoredBy: 'Growth Agent', status: 'live', trigger: 'on-demand' },
      { id: 'in-4', name: 'Workspace Sync', description: 'CRM, orders, and tasks synced to your workspace', monitoredBy: 'Task Agent', status: 'live', trigger: 'realtime' },
    ],
  },
]

/* ── Helpers ── */

export function getAutomationStats() {
  const allItems = AUTOMATION_CATALOG.flatMap((g) => g.items)
  return {
    total: allItems.length,
    live: allItems.filter((i) => i.status === 'live').length,
    comingSoon: allItems.filter((i) => i.status === 'coming-soon').length,
    categories: AUTOMATION_CATALOG.length,
    agents: new Set(allItems.map((i) => i.monitoredBy)).size,
  }
}

export function getItemsByAgent(agentName: string): AutomationItem[] {
  return AUTOMATION_CATALOG.flatMap((g) => g.items).filter((i) => i.monitoredBy === agentName)
}

export interface CategoryColors {
  bg: string
  text: string
  border: string
  badge: string
  dot: string
}

const CATEGORY_COLORS: Record<string, CategoryColors> = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    badge: 'bg-blue-100 text-blue-600',    dot: 'bg-blue-500' },
  green:   { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',   badge: 'bg-green-100 text-green-600',   dot: 'bg-green-500' },
  pink:    { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200',    badge: 'bg-pink-100 text-pink-600',    dot: 'bg-pink-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  badge: 'bg-purple-100 text-purple-600',  dot: 'bg-purple-500' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  badge: 'bg-orange-100 text-orange-600',  dot: 'bg-orange-500' },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  badge: 'bg-indigo-100 text-indigo-600',  dot: 'bg-indigo-500' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    badge: 'bg-rose-100 text-rose-600',    dot: 'bg-rose-500' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-600',   dot: 'bg-amber-500' },
  gray:    { bg: 'bg-gray-50',    text: 'text-gray-700',    border: 'border-gray-200',    badge: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-500' },
}

const DEFAULT_COLORS: CategoryColors = { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-500' }

export function getCategoryColor(color: string): CategoryColors {
  return CATEGORY_COLORS[color] ?? DEFAULT_COLORS
}
