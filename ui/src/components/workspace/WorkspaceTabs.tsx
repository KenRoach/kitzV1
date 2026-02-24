import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CrmTab } from '../crm/CrmTab'
import { LeadsTab } from './LeadsTab'
import { OrdersTab } from './OrdersTab'
import { TasksTab } from './TasksTab'
import { CheckoutTab } from './CheckoutTab'
import { InventoryTab } from './InventoryTab'
import { PaymentsTab } from './PaymentsTab'
import { CalendarTab } from './CalendarTab'
import { MessagesTab } from './MessagesTab'

const tabs = [
  { id: 'crm', label: 'CRM' },
  { id: 'payments', label: 'Payments' },
  { id: 'leads', label: 'Contacts' },
  { id: 'orders', label: 'Orders' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'checkout', label: 'Payment Links' },
  { id: 'inventory', label: 'Products' },
  { id: 'messages', label: 'Messages' },
  { id: 'calendar', label: 'Calendar' },
] as const

type TabId = (typeof tabs)[number]['id']

export function WorkspaceTabs() {
  const [active, setActive] = useState<TabId>('crm')

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex overflow-x-auto border-b border-gray-200 px-4" role="tablist" aria-label="Workspace tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'whitespace-nowrap px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider transition-colors',
              active === tab.id
                ? 'border-b-2 border-purple-500 text-black'
                : 'text-gray-400 hover:text-gray-600',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-5" role="tabpanel">
        {active === 'crm' && <CrmTab />}
        {active === 'payments' && <PaymentsTab />}
        {active === 'leads' && <LeadsTab />}
        {active === 'orders' && <OrdersTab />}
        {active === 'tasks' && <TasksTab />}
        {active === 'checkout' && <CheckoutTab />}
        {active === 'inventory' && <InventoryTab />}
        {active === 'messages' && <MessagesTab />}
        {active === 'calendar' && <CalendarTab />}
      </div>
    </div>
  )
}
