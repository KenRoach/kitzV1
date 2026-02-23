import { create } from 'zustand'
import { apiFetch } from '@/lib/api'
import { API } from '@/lib/constants'

// CRM Pipeline stages
export const PIPELINE_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] as const
export type PipelineStage = (typeof PIPELINE_STAGES)[number]

export const STAGE_LABELS: Record<PipelineStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
}

export const STAGE_COLORS: Record<PipelineStage, { bg: string; text: string; dot: string }> = {
  new: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  contacted: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  qualified: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  proposal: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  won: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  lost: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
}

export interface Lead {
  id: string
  name: string
  phone?: string
  email?: string
  source?: string
  stage: PipelineStage
  value?: number
  tags: string[]
  notes: string[]
  lastContact?: string
  createdAt: string
}

export interface Order {
  id: string; leadId?: string; description: string; total: number; status: string; createdAt: string
}
export interface Task {
  id: string; title: string; done: boolean; createdAt: string
}
export interface CheckoutLink {
  id: string; slug: string; amount: number; label: string; active: boolean; createdAt: string
}

export interface Payment {
  id: string
  type: 'incoming' | 'outgoing'
  description: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  date: string
  method: string
}

// Mock CRM data for demo
const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'Maria Rodriguez', phone: '+507 6234-5678', email: 'maria@cafebonito.pa', source: 'WhatsApp', stage: 'qualified', value: 450, tags: ['cafe', 'panama city'], notes: ['Interested in monthly subscription', 'Runs Cafe Bonito in Casco Viejo'], lastContact: '2026-02-22', createdAt: '2026-02-10' },
  { id: '2', name: 'Carlos Mendez', phone: '+507 6789-0123', email: 'carlos@fitzone.pa', source: 'Instagram', stage: 'proposal', value: 1200, tags: ['gym', 'subscription'], notes: ['Needs payment links for memberships', 'Has 3 locations'], lastContact: '2026-02-21', createdAt: '2026-02-08' },
  { id: '3', name: 'Sofia Chen', phone: '+507 6345-6789', source: 'Referral', stage: 'new', value: 200, tags: ['bakery'], notes: ['Just started, referred by Maria'], createdAt: '2026-02-20' },
  { id: '4', name: 'Diego Vargas', email: 'diego@surfshack.pa', source: 'WhatsApp', stage: 'contacted', value: 800, tags: ['retail', 'beach'], notes: ['Sells surf gear in Bocas del Toro'], lastContact: '2026-02-19', createdAt: '2026-02-05' },
  { id: '5', name: 'Ana Castillo', phone: '+507 6456-7890', email: 'ana@belleza.pa', source: 'Instagram', stage: 'won', value: 600, tags: ['beauty', 'salon'], notes: ['Signed up for AI Battery pack', 'Running checkout links for appointments'], lastContact: '2026-02-23', createdAt: '2026-01-15' },
  { id: '6', name: 'Roberto Flores', phone: '+507 6567-8901', source: 'WhatsApp', stage: 'contacted', tags: ['food truck'], notes: ['Wants WhatsApp ordering'], createdAt: '2026-02-18' },
  { id: '7', name: 'Isabella Torres', email: 'isa@modapanama.com', source: 'Website', stage: 'new', value: 350, tags: ['fashion', 'online'], notes: [], createdAt: '2026-02-22' },
  { id: '8', name: 'Luis Morales', phone: '+507 6678-9012', source: 'Referral', stage: 'lost', tags: ['restaurant'], notes: ['Too early stage, follow up in 3 months'], lastContact: '2026-02-10', createdAt: '2026-01-20' },
]

interface WorkspaceState {
  leads: Lead[]; orders: Order[]; tasks: Task[]; checkoutLinks: CheckoutLink[]; payments: Payment[]
  isLoading: boolean
  // Leads / CRM
  fetchLeads: () => Promise<void>
  addLead: (data: { name: string; phone?: string; email?: string; source?: string; stage?: PipelineStage; value?: number; tags?: string[] }) => Promise<void>
  deleteLead: (id: string) => Promise<void>
  updateLeadStage: (id: string, stage: PipelineStage) => void
  addLeadNote: (id: string, note: string) => void
  addLeadTag: (id: string, tag: string) => void
  removeLeadTag: (id: string, tag: string) => void
  // Orders
  fetchOrders: () => Promise<void>
  addOrder: (data: { description: string; total: number }) => Promise<void>
  // Tasks
  fetchTasks: () => Promise<void>
  addTask: (title: string) => Promise<void>
  // Checkout
  fetchCheckoutLinks: () => Promise<void>
  addCheckoutLink: (data: { label: string; amount: number }) => Promise<void>
  // Payments
  fetchPayments: () => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  leads: MOCK_LEADS, orders: [], tasks: [], checkoutLinks: [],
  payments: [
    { id: 'p1', type: 'incoming', description: 'Maria Rodriguez — Invoice #1042', amount: 450, status: 'completed', date: '2026-02-23', method: 'Yappy' },
    { id: 'p2', type: 'incoming', description: 'Carlos Mendez — Checkout link', amount: 120, status: 'completed', date: '2026-02-22', method: 'Stripe' },
    { id: 'p3', type: 'incoming', description: 'Ana Gutierrez — Invoice #1041', amount: 800, status: 'pending', date: '2026-02-22', method: 'PayPal' },
    { id: 'p4', type: 'outgoing', description: 'AI Battery — 100 credits', amount: 5, status: 'completed', date: '2026-02-21', method: 'Stripe' },
    { id: 'p5', type: 'incoming', description: 'Pedro Silva — Order #389', amount: 275, status: 'completed', date: '2026-02-20', method: 'BAC' },
    { id: 'p6', type: 'incoming', description: 'Laura Chen — Checkout link', amount: 650, status: 'failed', date: '2026-02-19', method: 'Stripe' },
  ],
  isLoading: false,

  fetchLeads: async () => {
    set({ isLoading: true })
    try {
      const leads = await apiFetch<Lead[]>(`${API.WORKSPACE}/leads`)
      set({ leads, isLoading: false })
    } catch {
      // Keep mock data on API failure
      set({ isLoading: false })
    }
  },
  addLead: async (data) => {
    const newLead: Lead = {
      id: `lead_${Date.now()}`,
      name: data.name,
      phone: data.phone,
      email: data.email,
      source: data.source,
      stage: data.stage ?? 'new',
      value: data.value,
      tags: data.tags ?? [],
      notes: [],
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ leads: [...s.leads, newLead] }))
    // Also try API
    try {
      await apiFetch(`${API.WORKSPACE}/leads`, { method: 'POST', body: JSON.stringify(data) })
    } catch { /* local-first */ }
  },
  deleteLead: async (id) => {
    set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }))
    try {
      await apiFetch(`${API.WORKSPACE}/leads/${id}`, { method: 'DELETE' })
    } catch { /* local-first */ }
  },
  updateLeadStage: (id, stage) => {
    set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, stage } : l) }))
    // Async API sync (local-first)
    apiFetch(`${API.WORKSPACE}/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    }).catch(() => { /* local-first: keep local state on failure */ })
  },
  addLeadNote: (id, note) => {
    set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, notes: [...l.notes, note] } : l) }))
    apiFetch(`${API.WORKSPACE}/leads/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }).catch(() => { /* local-first */ })
  },
  addLeadTag: (id, tag) => {
    set((s) => ({ leads: s.leads.map((l) => l.id === id && !l.tags.includes(tag) ? { ...l, tags: [...l.tags, tag] } : l) }))
    apiFetch(`${API.WORKSPACE}/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ addTag: tag }),
    }).catch(() => { /* local-first */ })
  },
  removeLeadTag: (id, tag) => {
    set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, tags: l.tags.filter((t) => t !== tag) } : l) }))
    apiFetch(`${API.WORKSPACE}/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ removeTag: tag }),
    }).catch(() => { /* local-first */ })
  },

  fetchOrders: async () => {
    set({ isLoading: true })
    try {
      const orders = await apiFetch<Order[]>(`${API.WORKSPACE}/orders`)
      set({ orders, isLoading: false })
    } catch { set({ isLoading: false }) }
  },
  addOrder: async (data) => {
    await apiFetch(`${API.WORKSPACE}/orders`, { method: 'POST', body: JSON.stringify(data) })
    await get().fetchOrders()
  },

  fetchTasks: async () => {
    set({ isLoading: true })
    try {
      const tasks = await apiFetch<Task[]>(`${API.WORKSPACE}/tasks`)
      set({ tasks, isLoading: false })
    } catch { set({ isLoading: false }) }
  },
  addTask: async (title) => {
    await apiFetch(`${API.WORKSPACE}/tasks`, { method: 'POST', body: JSON.stringify({ title }) })
    await get().fetchTasks()
  },

  fetchCheckoutLinks: async () => {
    set({ isLoading: true })
    try {
      const checkoutLinks = await apiFetch<CheckoutLink[]>(`${API.WORKSPACE}/checkout-links`)
      set({ checkoutLinks, isLoading: false })
    } catch { set({ isLoading: false }) }
  },
  addCheckoutLink: async (data) => {
    await apiFetch(`${API.WORKSPACE}/checkout-links`, { method: 'POST', body: JSON.stringify(data) })
    await get().fetchCheckoutLinks()
  },

  fetchPayments: async () => {
    // No payment query endpoint exists yet — keep mock data
    // Future: apiFetch<Payment[]>(`${API.LOGS}/logs?type=payment`)
  },
}))
