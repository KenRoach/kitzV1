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
  contacted: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
  qualified: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  proposal: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  won: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  lost: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-300' },
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

export interface Product {
  id: string
  name: string
  description: string
  price: number
  cost: number
  sku: string
  stock_qty: number
  low_stock_threshold: number
  category: string
  image_url: string
  is_active: boolean
  createdAt: string
  updatedAt: string
}


interface WorkspaceState {
  leads: Lead[]; orders: Order[]; tasks: Task[]; checkoutLinks: CheckoutLink[]; payments: Payment[]; products: Product[]
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
  addCheckoutLink: (data: { label: string; amount: number; product_id?: string }) => Promise<void>
  // Payments
  fetchPayments: () => Promise<void>
  // Products
  fetchProducts: () => Promise<void>
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  leads: [], orders: [], tasks: [], checkoutLinks: [],
  products: [],
  payments: [],
  isLoading: false,

  fetchLeads: async () => {
    set({ isLoading: true })
    try {
      const leads = await apiFetch<Lead[]>(`${API.WORKSPACE}/leads`)
      set({ leads, isLoading: false })
    } catch {
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
    set({ isLoading: true })
    try {
      const payments = await apiFetch<Payment[]>(`${API.WORKSPACE}/payments`)
      set({ payments, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchProducts: async () => {
    set({ isLoading: true })
    try {
      const products = await apiFetch<Product[]>(`${API.WORKSPACE}/products`)
      set({ products, isLoading: false })
    } catch {
      // Keep existing products on API failure
      set({ isLoading: false })
    }
  },
  addProduct: async (data) => {
    const now = new Date().toISOString()
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    }
    set((s) => ({ products: [...s.products, newProduct] }))
    try {
      await apiFetch(`${API.WORKSPACE}/products`, { method: 'POST', body: JSON.stringify(data) })
    } catch { /* local-first */ }
  },
  updateProduct: async (id, data) => {
    set((s) => ({
      products: s.products.map((p) => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p),
    }))
    try {
      await apiFetch(`${API.WORKSPACE}/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    } catch { /* local-first */ }
  },
  deleteProduct: async (id) => {
    set((s) => ({
      products: s.products.map((p) => p.id === id ? { ...p, is_active: false } : p),
    }))
    try {
      await apiFetch(`${API.WORKSPACE}/products/${id}`, { method: 'DELETE' })
    } catch { /* local-first */ }
  },
}))
