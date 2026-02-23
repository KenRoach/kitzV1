import { useEffect, useState } from 'react'
import { ShoppingCart, Plus } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'

export function OrdersTab() {
  const { orders, isLoading, fetchOrders, addOrder } = useWorkspaceStore()
  const [description, setDescription] = useState('')
  const [total, setTotal] = useState('')

  useEffect(() => { void fetchOrders() }, [fetchOrders])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !total) return
    await addOrder({ description, total: parseFloat(total) })
    setDescription(''); setTotal('')
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Description *</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} required
            placeholder="Order description"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-[#00D4AA]" />
        </div>
        <div className="w-32">
          <label className="block text-xs font-medium text-gray-500 mb-1">Total *</label>
          <input type="number" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} required
            placeholder="$0.00"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-[#00D4AA]" />
        </div>
        <button type="submit" className="flex items-center gap-2 rounded-lg bg-[#00D4AA] px-4 py-2 text-sm font-medium text-white hover:bg-[#00E8BB] transition">
          <Plus className="h-4 w-4" /> Create
        </button>
      </form>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}

      {orders.length === 0 && !isLoading && (
        <p className="py-8 text-center text-sm text-gray-400">No orders yet.</p>
      )}

      <div className="space-y-2">
        {orders.map((order) => (
          <div key={order.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium text-black">{order.description}</p>
                <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {order.status}
              </span>
              <span className="font-semibold text-[#00D4AA]">${order.total.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
