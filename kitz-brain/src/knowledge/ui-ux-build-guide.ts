/**
 * UI/UX Portal Build Guide — How Kitz OS Portal Was Built
 *
 * This file documents the architecture, decisions, and structure of the
 * Kitz OS Portal (UI:UX/) so that kitz-brain agents can reference it
 * when making decisions about the product, user experience, or frontend.
 *
 * Built by Claude Code (Opus 4.6) — Feb 2026
 */

export const UI_UX_BUILD_GUIDE = {
  overview: `
    The Kitz OS Portal is a React + Vite SPA that serves as the human interface
    for Kitz OS. It replaces the vanilla HTML frontends previously inlined in
    Fastify service files. The design follows a Lovable.dev-inspired split-panel
    layout: dark AI chat sidebar on the left, white canvas workspace on the right.
  `,

  techStack: {
    framework: 'React 19 + TypeScript (strict mode)',
    bundler: 'Vite 7.3.1 with @vitejs/plugin-react',
    styling: 'Tailwind CSS v4 with @tailwindcss/vite plugin',
    stateManagement: 'Zustand 5',
    routing: 'React Router v7 (react-router-dom)',
    icons: 'Lucide React',
    utilities: 'clsx + tailwind-merge for cn() helper',
  },

  designTokens: {
    background: '#FFFFFF',
    surface: '#F9FAFB (gray-50)',
    sidebar: '#0A0A0A (near-black)',
    textPrimary: '#000000',
    textSecondary: '#374151 (gray-700, code/monospace)',
    textMuted: '#6B7280 (gray-500)',
    brandAccent: '#00D4AA (Kitz teal)',
    brandGradient: 'linear-gradient(135deg, #00D4AA, #00B4D8)',
    danger: '#EF4444',
    border: '#E5E7EB (gray-200)',
    borderRadius: '12px cards, 8px buttons',
    font: 'Inter / system stack, font-mono for labels',
  },

  layout: {
    description: 'Split-panel layout inspired by Lovable.dev',
    leftPanel: {
      width: '420px',
      component: 'ChatPanel',
      style: 'Dark (#0A0A0A) with white/10 borders',
      features: [
        'Kitz OS v0.1 header with sparkle icon',
        'Build log cards (Details/Preview toggle)',
        'Chat messages (user: white/10 bg, assistant: plain text)',
        'Suggestion chips for quick actions',
        'Input bar with +, text input, Visual edits, Plan, Send buttons',
      ],
    },
    rightPanel: {
      width: 'flex-1 (remaining space)',
      component: 'CanvasPreview',
      style: 'White background',
      features: [
        'Voice Orb centered at top (gradient teal-to-cyan, pulse animation)',
        'Kitz logo header with tab navigation (Workspace/Agents/Automations)',
        'Progress bar under tabs (teal active, gray-200 inactive)',
        'Stats row (text-only: AI Battery, Agents, WhatsApp)',
        'Dynamic content based on active tab',
      ],
    },
  },

  routes: [
    { path: '/login', page: 'LoginPage', auth: false, notes: 'Auto-login bypass (dev mode), sets dev user and redirects' },
    { path: '/connect-whatsapp', page: 'WhatsAppPage', auth: true, notes: 'QR scanner with SSE + countdown ring, "Skip for now" option' },
    { path: '/', page: 'DashboardPage', auth: true, notes: 'Main split-panel dashboard' },
  ],

  agentArchitecture: {
    description: 'Two-layer agent system: frontend (user-facing) + backend (invisible AOS)',
    frontendAgents: {
      description: 'What the solopreneur sees — friendly names, practical roles',
      teams: [
        { name: 'Your Manager', agents: ['Kitz Manager'] },
        { name: 'Sales', agents: ['Lead Finder', 'Follow-Up Agent', 'Closer Agent', 'Checkout Agent'] },
        { name: 'Demand Gen', agents: ['Campaign Agent', 'Content Agent', 'Growth Agent'] },
        { name: 'Operations', agents: ['Order Tracker', 'Task Agent', 'Scheduler'] },
        { name: 'Finance', agents: ['Bookkeeper', 'Invoice Agent', 'Cash Flow Agent'] },
      ],
      total: 15,
    },
    backendAgents: {
      description: 'Enterprise-grade agents doing the heavy lifting (AOS layer)',
      file: 'UI:UX/src/lib/agents.ts',
      teams: [
        'Leadership', 'Sales', 'Marketing', 'Operations', 'Engineering',
        'Finance', 'Performance', 'Content Creation', 'Compliance', 'Legal',
        'Security', 'PMO', 'GTM', 'R&D', 'Coaching', 'QA',
        'Reporting', 'Support',
      ],
      total: 60,
      notes: 'Backend agents communicate results through frontend agents. Users never see them.',
    },
  },

  crmFeatures: {
    pipelineStages: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
    features: [
      'Kanban drag-and-drop pipeline view',
      'List view with search',
      'Add Contact wizard (3-step: Name → Contact → Details)',
      'Contact detail modal (stage selector, notes, tags, deal value)',
      'Pipeline value summary and stage progress bar',
    ],
    mockData: '8 pre-populated leads (Maria Rodriguez, Carlos Mendez, etc.)',
    dataPattern: 'Local-first: updates state immediately, tries API in background',
  },

  apiIntegration: {
    proxyConfig: 'Vite dev server proxies to backend services',
    endpoints: {
      gateway: 'localhost:4000 → /api/gateway/*',
      workspace: 'localhost:3001 → /api/workspace/*',
      whatsapp: 'localhost:3006 → /api/whatsapp/*',
      kitzOs: 'localhost:3012 → /api/kitz/*',
    },
    authHeaders: 'Authorization: Bearer <token>, x-trace-id, x-org-id',
  },

  buildCommands: {
    dev: 'cd UI:UX && npm run dev',
    build: 'cd UI:UX && npm run build',
    typeCheck: 'cd UI:UX && ./node_modules/.bin/tsc --noEmit',
  },

  keyFiles: [
    'UI:UX/src/pages/DashboardPage.tsx — Main split-panel layout',
    'UI:UX/src/components/layout/ChatPanel.tsx — Dark AI chat sidebar',
    'UI:UX/src/components/layout/CanvasPreview.tsx — White canvas preview',
    'UI:UX/src/components/orb/Orb.tsx — Voice orb (centered top)',
    'UI:UX/src/components/orb/OrbChat.tsx — Orb chat panel',
    'UI:UX/src/components/crm/CrmTab.tsx — CRM pipeline + Add Contact wizard',
    'UI:UX/src/components/crm/PipelineView.tsx — Kanban drag-and-drop',
    'UI:UX/src/components/crm/ContactDetail.tsx — Contact detail modal',
    'UI:UX/src/components/agents/AgentGrid.tsx — Frontend agent teams',
    'UI:UX/src/components/agents/AgentCard.tsx — Agent card component',
    'UI:UX/src/lib/agents.ts — Backend agent roster (AOS layer)',
    'UI:UX/src/stores/workspaceStore.ts — CRM, orders, tasks state',
    'UI:UX/src/stores/orbStore.ts — Orb chat state',
    'UI:UX/src/stores/authStore.ts — Auth state + JWT',
  ],
} as const;
