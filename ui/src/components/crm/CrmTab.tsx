import { useState } from 'react'
import { UserPlus, LayoutGrid, List, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspaceStore, STAGE_LABELS, STAGE_COLORS, type Lead } from '@/stores/workspaceStore'
import { PipelineView } from './PipelineView'
import { ContactDetail } from './ContactDetail'

type ViewMode = 'pipeline' | 'list'

// Add contact wizard steps
type WizardStep = 'name' | 'contact' | 'details'

function AddContactWizard({ onClose }: { onClose: () => void }) {
  const { addLead } = useWorkspaceStore()
  const [step, setStep] = useState<WizardStep>('name')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState('')
  const [value, setValue] = useState('')

  const steps: { id: WizardStep; label: string; num: number }[] = [
    { id: 'name', label: 'Name', num: 1 },
    { id: 'contact', label: 'Contact', num: 2 },
    { id: 'details', label: 'Details', num: 3 },
  ]

  const currentIdx = steps.findIndex((s) => s.id === step)

  const handleNext = () => {
    if (step === 'name' && name.trim()) setStep('contact')
    else if (step === 'contact') setStep('details')
    else if (step === 'details') {
      void addLead({
        name,
        phone: phone || undefined,
        email: email || undefined,
        source: source || undefined,
        value: value ? parseFloat(value) : undefined,
      })
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* Logo */}
        <div className="pt-6 text-center">
          <div className="inline-flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <span className="text-xl font-extrabold tracking-tight text-black">kitz</span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mt-4 flex items-center justify-center gap-6 px-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className={cn(
                'font-mono text-xs',
                i <= currentIdx ? 'font-semibold text-black' : 'text-gray-400',
              )}>
                {s.num}.
              </span>
              <span className={cn(
                'font-mono text-xs uppercase tracking-wider',
                i <= currentIdx ? 'font-semibold text-black' : 'text-gray-400',
              )}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-3 flex gap-1 px-8">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i <= currentIdx ? 'bg-purple-500' : 'bg-gray-200',
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="px-8 pt-8 pb-6">
          {step === 'name' && (
            <div>
              <h2 className="text-2xl font-bold text-black">What's their name?</h2>
              <p className="mt-1 text-sm text-gray-500">We'll use this to identify the contact.</p>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maria Rodriguez"
                className="mt-6 w-full rounded-xl border border-gray-200 px-4 py-3.5 text-base text-black placeholder-gray-400 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>
          )}

          {step === 'contact' && (
            <div>
              <h2 className="text-2xl font-bold text-black">How do you reach them?</h2>
              <p className="mt-1 text-sm text-gray-500">Add phone, email, or both.</p>
              <div className="mt-6 space-y-3">
                <input
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+507 6234-5678"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-base text-black placeholder-gray-400 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@business.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-base text-black placeholder-gray-400 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                />
              </div>
            </div>
          )}

          {step === 'details' && (
            <div>
              <h2 className="text-2xl font-bold text-black">Any extra details?</h2>
              <p className="mt-1 text-sm text-gray-500">Source and estimated deal value.</p>
              <div className="mt-6 space-y-3">
                <div>
                  <label className="block font-mono text-xs text-gray-500 mb-1">Source</label>
                  <input
                    autoFocus
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="WhatsApp, Instagram, Referral..."
                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-base text-black placeholder-gray-400 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-gray-500 mb-1">Deal value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-base text-black placeholder-gray-400 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 px-8 py-4">
          <button
            onClick={onClose}
            className="font-mono text-xs text-gray-400 transition hover:text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            disabled={step === 'name' && !name.trim()}
            className="rounded-xl bg-purple-500 px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:opacity-40"
          >
            {step === 'details' ? 'Add Contact' : 'Continue'} →
          </button>
        </div>
      </div>
    </div>
  )
}

function ContactListView({ leads, onSelectLead }: { leads: Lead[]; onSelectLead: (lead: Lead) => void }) {
  return (
    <div className="space-y-1">
      {leads.map((lead) => {
        const stageColor = STAGE_COLORS[lead.stage]
        return (
          <button
            key={lead.id}
            onClick={() => onSelectLead(lead)}
            className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-left transition hover:shadow-sm hover:border-gray-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/10 text-sm font-bold text-purple-500 shrink-0">
                {lead.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-black truncate">{lead.name}</p>
                <p className="font-mono text-xs text-gray-400 truncate">
                  {[lead.phone, lead.email].filter(Boolean).join(' · ') || 'No contact info'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {lead.value != null && lead.value > 0 && (
                <span className="font-mono text-sm font-semibold text-purple-500">${lead.value}</span>
              )}
              <span className={cn(
                'rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium',
                stageColor.bg, stageColor.text,
              )}>
                {STAGE_LABELS[lead.stage]}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function CrmTab() {
  const { leads } = useWorkspaceStore()
  const [view, setView] = useState<ViewMode>('pipeline')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddWizard, setShowAddWizard] = useState(false)
  const [search, setSearch] = useState('')

  const filteredLeads = search
    ? leads.filter((l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.tags.some((t) => t.includes(search.toLowerCase())) ||
        (l.email?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : leads

  // Keep selected lead in sync with store
  const activeLead = selectedLead
    ? leads.find((l) => l.id === selectedLead.id) ?? null
    : null

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-black placeholder-gray-400 outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 p-0.5">
            <button
              onClick={() => setView('pipeline')}
              className={cn(
                'rounded-md px-2.5 py-1.5 transition',
                view === 'pipeline' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600',
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'rounded-md px-2.5 py-1.5 transition',
                view === 'list' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600',
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setShowAddWizard(true)}
            className="flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-400"
          >
            <UserPlus className="h-4 w-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'pipeline' ? (
        <PipelineView onSelectLead={setSelectedLead} />
      ) : (
        <ContactListView leads={filteredLeads} onSelectLead={setSelectedLead} />
      )}

      {/* Contact detail modal */}
      {activeLead && (
        <ContactDetail lead={activeLead} onClose={() => setSelectedLead(null)} />
      )}

      {/* Add contact wizard */}
      {showAddWizard && (
        <AddContactWizard onClose={() => setShowAddWizard(false)} />
      )}
    </div>
  )
}
