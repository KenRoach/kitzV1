import { useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/stores/workspaceStore'

const statusStyles = {
  completed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
}

export function PaymentsTab() {
  const payments = useWorkspaceStore((s) => s.payments)
  const fetchPayments = useWorkspaceStore((s) => s.fetchPayments)

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const totalIncoming = payments
    .filter((p) => p.type === 'incoming' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-xl border border-gray-200 p-4">
          <p className="font-mono text-xs text-gray-500">Received this week</p>
          <p className="mt-1 text-2xl font-bold text-purple-500">${totalIncoming.toLocaleString()}</p>
        </div>
        <div className="flex-1 rounded-xl border border-gray-200 p-4">
          <p className="font-mono text-xs text-gray-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-500">${pendingAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment list */}
      <div className="space-y-1">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 transition hover:border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                payment.type === 'incoming' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500',
              )}>
                {payment.type === 'incoming'
                  ? <ArrowDownLeft className="h-4 w-4" />
                  : <ArrowUpRight className="h-4 w-4" />
                }
              </div>
              <div>
                <p className="text-sm font-medium text-black">{payment.description}</p>
                <p className="font-mono text-xs text-gray-400">{payment.date} · {payment.method}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn(
                'rounded-full px-2 py-0.5 font-mono text-[10px] font-medium',
                statusStyles[payment.status],
              )}>
                {payment.status}
              </span>
              <span className={cn(
                'font-mono text-sm font-semibold',
                payment.type === 'incoming' ? 'text-purple-500' : 'text-gray-500',
              )}>
                {payment.type === 'incoming' ? '+' : '-'}${payment.amount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
