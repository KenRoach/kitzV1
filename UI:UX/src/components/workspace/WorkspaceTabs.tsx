import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CrmTab } from '../crm/CrmTab'
import { LeadsTab } from './LeadsTab'
import { OrdersTab } from './OrdersTab'
import { TasksTab } from './TasksTab'
import { CheckoutTab } from './CheckoutTab'

const tabs = [
  { id: 'crm', label: 'CRM' },
  { id: 'leads', label: 'Contacts' },
  { id: 'orders', label: 'Orders' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'checkout', label: 'Checkout' },
] as const

type TabId = (typeof tabs)[number]['id']

export function WorkspaceTabs() {
  const [active, setActive] = useState<TabId>('crm')

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex border-b border-gray-200 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider transition-colors',
              active === tab.id
                ? 'border-b-2 border-[#00D4AA] text-black'
                : 'text-gray-400 hover:text-gray-600',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-5">
        {active === 'crm' && <CrmTab />}
        {active === 'leads' && <LeadsTab />}
        {active === 'orders' && <OrdersTab />}
        {active === 'tasks' && <TasksTab />}
        {active === 'checkout' && <CheckoutTab />}
      </div>
    </div>
  )
}
