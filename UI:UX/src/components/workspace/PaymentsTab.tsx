import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Payment {
  id: string
  type: 'incoming' | 'outgoing'
  description: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  date: string
  method: string
}

const MOCK_PAYMENTS: Payment[] = [
  { id: '1', type: 'incoming', description: 'Maria Rodriguez — Invoice #1042', amount: 450, status: 'completed', date: '2026-02-23', method: 'Yappy' },
  { id: '2', type: 'incoming', description: 'Carlos Mendez — Checkout link', amount: 120, status: 'completed', date: '2026-02-22', method: 'Stripe' },
  { id: '3', type: 'incoming', description: 'Ana Gutierrez — Invoice #1041', amount: 800, status: 'pending', date: '2026-02-22', method: 'PayPal' },
  { id: '4', type: 'outgoing', description: 'AI Battery — 100 credits', amount: 5, status: 'completed', date: '2026-02-21', method: 'Stripe' },
  { id: '5', type: 'incoming', description: 'Pedro Silva — Order #389', amount: 275, status: 'completed', date: '2026-02-20', method: 'BAC' },
  { id: '6', type: 'incoming', description: 'Laura Chen — Checkout link', amount: 650, status: 'failed', date: '2026-02-19', method: 'Stripe' },
]

const statusStyles = {
  completed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
}

export function PaymentsTab() {
  const totalIncoming = MOCK_PAYMENTS.filter((p) => p.type === 'incoming' && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = MOCK_PAYMENTS.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-xl border border-gray-200 p-4">
          <p className="font-mono text-xs text-gray-500">Received this week</p>
          <p className="mt-1 text-2xl font-bold text-[#00D4AA]">${totalIncoming.toLocaleString()}</p>
        </div>
        <div className="flex-1 rounded-xl border border-gray-200 p-4">
          <p className="font-mono text-xs text-gray-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-500">${pendingAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment list */}
      <div className="space-y-1">
        {MOCK_PAYMENTS.map((payment) => (
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
                payment.type === 'incoming' ? 'text-[#00D4AA]' : 'text-gray-500',
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
