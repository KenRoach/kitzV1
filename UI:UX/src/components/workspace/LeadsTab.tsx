import { useEffect, useState } from 'react'
import { UserPlus, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'

export function LeadsTab() {
  const { leads, isLoading, fetchLeads, addLead, deleteLead } = useWorkspaceStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => { void fetchLeads() }, [fetchLeads])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await addLead({ name, phone: phone || undefined, email: email || undefined })
    setName(''); setPhone(''); setEmail('')
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            placeholder="Contact name"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-[#00D4AA]" />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="+507..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-[#00D4AA]" />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="email@..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-[#00D4AA]" />
        </div>
        <button type="submit" className="flex items-center gap-2 rounded-lg bg-[#00D4AA] px-4 py-2 text-sm font-medium text-white hover:bg-[#00E8BB] transition">
          <UserPlus className="h-4 w-4" /> Add
        </button>
      </form>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}

      {leads.length === 0 && !isLoading && (
        <p className="py-8 text-center text-sm text-gray-400">No leads yet. Add your first contact above.</p>
      )}

      <div className="space-y-2">
        {leads.map((lead) => (
          <div key={lead.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition hover:bg-gray-50">
            <div>
              <p className="font-medium text-black">{lead.name}</p>
              <p className="text-xs text-gray-500">
                {[lead.phone, lead.email].filter(Boolean).join(' · ') || 'No contact info'}
              </p>
            </div>
            <button onClick={() => void deleteLead(lead.id)} className="text-gray-300 transition hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
