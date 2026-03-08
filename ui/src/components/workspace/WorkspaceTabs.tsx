import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
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
  { id: 'crm', labelKey: 'workspace.crm' },
  { id: 'payments', labelKey: 'workspace.payments' },
  { id: 'leads', labelKey: 'workspace.contacts' },
  { id: 'orders', labelKey: 'workspace.orders' },
  { id: 'tasks', labelKey: 'workspace.tasks' },
  { id: 'checkout', labelKey: 'workspace.paymentLinks' },
  { id: 'inventory', labelKey: 'workspace.products' },
  { id: 'messages', labelKey: 'workspace.messages' },
  { id: 'calendar', labelKey: 'workspace.calendar' },
] as const

type TabId = (typeof tabs)[number]['id']

export function WorkspaceTabs() {
  const { t } = useTranslation()
  const [active, setActive] = useState<TabId>('crm')

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex overflow-x-auto border-b border-gray-200 px-4" role="tablist" aria-label={t('workspace.tabs')}>
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
            {t(tab.labelKey)}
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
