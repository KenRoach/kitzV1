import { useEffect, useState } from 'react'
import { Link, Copy, Plus } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'

export function CheckoutTab() {
  const { checkoutLinks, isLoading, fetchCheckoutLinks, addCheckoutLink } = useWorkspaceStore()
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => { void fetchCheckoutLinks() }, [fetchCheckoutLinks])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim() || !amount) return
    await addCheckoutLink({ label, amount: parseFloat(amount) })
    setLabel(''); setAmount('')
  }

  const copySlug = (slug: string) => {
    void navigator.clipboard.writeText(`https://pay.kitz.services/${slug}`)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Label *</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} required
            placeholder="Payment for..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-[#00D4AA]" />
        </div>
        <div className="w-32">
          <label className="block text-xs font-medium text-gray-500 mb-1">Amount *</label>
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required
            placeholder="$0.00"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-[#00D4AA]" />
        </div>
        <button type="submit" className="flex items-center gap-2 rounded-lg bg-[#00D4AA] px-4 py-2 text-sm font-medium text-white hover:bg-[#00E8BB] transition">
          <Plus className="h-4 w-4" /> Create
        </button>
      </form>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}

      {checkoutLinks.length === 0 && !isLoading && (
        <p className="py-8 text-center text-sm text-gray-400">No checkout links yet.</p>
      )}

      <div className="space-y-2">
        {checkoutLinks.map((link) => (
          <div key={link.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <Link className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium text-black">{link.label}</p>
                <p className="font-mono text-xs text-gray-400">{link.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${link.active ? 'bg-[#00D4AA]' : 'bg-gray-300'}`} />
                <span className="text-xs text-gray-500">{link.active ? 'Active' : 'Inactive'}</span>
              </span>
              <span className="font-semibold text-[#00D4AA]">${link.amount.toFixed(2)}</span>
              <button onClick={() => copySlug(link.slug)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
