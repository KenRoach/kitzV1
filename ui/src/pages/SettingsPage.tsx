import {
  User,
  Globe,
  Moon,
  Bell,
  Shield,
  CreditCard,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/home/PageHeader'

/* ── Settings sections ── */
const sections = [
  {
    title: 'Profile',
    icon: User,
    fields: [
      { label: 'Display Name', value: 'Kenneth', type: 'text' as const },
      { label: 'Email', value: 'kenneth@kitz.services', type: 'text' as const },
      { label: 'Phone', value: '+507 6000-0000', type: 'text' as const },
    ],
  },
  {
    title: 'Language',
    icon: Globe,
    fields: [
      { label: 'Interface Language', value: 'English', type: 'select' as const, options: ['English', 'Español', 'Pashtun'] },
      { label: 'WhatsApp Bot Language', value: 'English', type: 'select' as const, options: ['English', 'Español', 'Auto-detect'] },
    ],
  },
  {
    title: 'Appearance',
    icon: Moon,
    fields: [
      { label: 'Theme', value: 'Light', type: 'select' as const, options: ['Light', 'Dark', 'System'] },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    fields: [
      { label: 'Email Notifications', value: 'On', type: 'toggle' as const },
      { label: 'WhatsApp Alerts', value: 'On', type: 'toggle' as const },
      { label: 'Agent Activity Digest', value: 'Daily', type: 'select' as const, options: ['Off', 'Daily', 'Weekly'] },
    ],
  },
  {
    title: 'AI Battery',
    icon: CreditCard,
    fields: [
      { label: 'Daily Credit Limit', value: '5', type: 'text' as const },
      { label: 'Current Balance', value: '$20.00', type: 'text' as const },
      { label: 'Monthly Spend', value: '$12.50', type: 'text' as const },
      { label: 'Low Balance Alert', value: 'On', type: 'toggle' as const },
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    fields: [
      { label: 'Kill Switch', value: 'Off', type: 'toggle' as const },
      { label: 'Draft-First Mode', value: 'On', type: 'toggle' as const },
      { label: 'Audit Trail', value: 'Enabled', type: 'select' as const, options: ['Enabled', 'Disabled'] },
    ],
  },
] as const

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-12">
      <PageHeader
        title="Settings"
        description="Manage your account, preferences, and integrations"
      />

      <div className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.title} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <Icon className="h-4 w-4 text-purple-500" />
                <h3 className="text-sm font-bold text-black">{section.title}</h3>
              </div>

              <div className="space-y-3">
                {section.fields.map((field) => (
                  <div key={field.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{field.label}</span>

                    {field.type === 'toggle' ? (
                      <button
                        className={`relative h-6 w-10 rounded-full transition ${
                          field.value === 'On' ? 'bg-purple-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                            field.value === 'On' ? 'left-[18px]' : 'left-0.5'
                          }`}
                        />
                      </button>
                    ) : field.type === 'select' ? (
                      <select
                        defaultValue={field.value}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-purple-500"
                      >
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        defaultValue={field.value}
                        className="w-48 rounded-lg border border-gray-200 px-3 py-1.5 text-right text-sm text-gray-700 outline-none focus:border-purple-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Danger zone */}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <Trash2 className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-bold text-red-700">Danger Zone</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">Delete Account</p>
              <p className="text-xs text-red-400">Permanently remove your account and all data</p>
            </div>
            <button className="rounded-lg border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
