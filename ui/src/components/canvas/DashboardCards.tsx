import { useEffect } from 'react'
import { DollarSign, ShoppingCart, MessageSquare, ListTodo } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { useTranslation } from '@/lib/i18n'

export function DashboardCards() {
  const { payments, orders, tasks, leads, fetchPayments, fetchOrders, fetchTasks, fetchLeads } = useWorkspaceStore()
  const setActiveTab = useCanvasStore((s) => s.setActiveTab)
  const { t } = useTranslation()

  useEffect(() => {
    void fetchPayments()
    void fetchOrders()
    void fetchTasks()
    void fetchLeads()
  }, [fetchPayments, fetchOrders, fetchTasks, fetchLeads])

  const revenue = payments
    .filter((p) => p.type === 'incoming' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const completedOrders = orders.filter((o) => o.status === 'completed').length

  const doneTasks = tasks.filter((tk) => tk.done).length
  const totalTasks = tasks.length

  const cards = [
    {
      label: t('dashboard.revenue'),
      value: `$${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `${payments.filter((p) => p.status === 'completed').length} ${t('dashboard.payments')}`,
      icon: DollarSign,
      color: 'text-purple-600',
      onClick: () => setActiveTab('workspace'),
    },
    {
      label: t('dashboard.orders'),
      value: String(orders.length),
      sub: `${pendingOrders} ${t('dashboard.pending')}, ${completedOrders} ${t('dashboard.done')}`,
      icon: ShoppingCart,
      color: 'text-purple-600',
      onClick: () => setActiveTab('workspace'),
    },
    {
      label: t('dashboard.contacts'),
      value: String(leads.length),
      sub: `${leads.filter((l) => l.stage === 'new').length} ${t('dashboard.newLeads')}`,
      icon: MessageSquare,
      color: 'text-purple-500',
      onClick: () => setActiveTab('workspace'),
    },
    {
      label: t('dashboard.tasks'),
      value: `${doneTasks}/${totalTasks}`,
      sub: totalTasks > 0 ? `${Math.round((doneTasks / totalTasks) * 100)}% ${t('dashboard.complete')}` : t('dashboard.noTasksYet'),
      icon: ListTodo,
      color: 'text-gray-500',
      onClick: () => setActiveTab('workspace'),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-2.5 md:gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.label}
              onClick={card.onClick}
              className="flex flex-col items-start gap-2 rounded-xl border border-gray-200 bg-white p-3.5 md:flex-row md:items-start md:gap-4 md:p-5 text-left shadow-sm transition hover:shadow-md hover:border-purple-200"
            >
              <Icon className={cn('h-5 w-5 shrink-0', card.color)} />
              <div className="min-w-0">
                <p className="text-[11px] md:text-xs font-medium text-gray-500">{card.label}</p>
                <p className="mt-0.5 text-lg md:text-xl font-bold text-gray-900">{card.value}</p>
                <p className="mt-0.5 text-[10px] md:text-xs text-gray-400 leading-tight">{card.sub}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Today's tasks */}
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 md:p-5">
        <h3 className="text-sm font-semibold text-gray-900">{t('dashboard.todaysTasks')}</h3>
        {tasks.length === 0 ? (
          <p className="mt-3 text-xs text-gray-400">{t('dashboard.askKitzCreate')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <li key={task.id} className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'h-4 w-4 shrink-0 rounded border-2 transition',
                    task.done
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300',
                  )}
                />
                <span
                  className={cn(
                    'text-sm',
                    task.done ? 'text-gray-400 line-through' : 'text-gray-700',
                  )}
                >
                  {task.title}
                </span>
              </li>
            ))}
            {tasks.length > 5 && (
              <li className="text-xs text-gray-400">+{tasks.length - 5} {t('more')}</li>
            )}
          </ul>
        )}
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 md:p-5">
        <h3 className="text-sm font-semibold text-gray-900">{t('dashboard.recentActivity')}</h3>
        {orders.length === 0 && payments.length === 0 ? (
          <p className="mt-3 text-xs text-gray-400">{t('dashboard.noActivityYet')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {[...orders.slice(0, 3).map((o) => ({
              id: o.id,
              text: `${t('dashboard.order')}: ${o.description}`,
              sub: `$${o.total} - ${o.status}`,
              time: o.createdAt,
            })), ...payments.slice(0, 2).map((p) => ({
              id: p.id,
              text: `${t('dashboard.payment')}: ${p.description}`,
              sub: `$${p.amount} - ${p.status}`,
              time: p.date,
            }))]
              .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
              .slice(0, 5)
              .map((item) => (
                <li key={item.id} className="text-sm text-gray-600">
                  <span className="font-medium">{item.text}</span>
                  <span className="ml-2 text-xs text-gray-400">{item.sub}</span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}
