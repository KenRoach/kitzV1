import {
  User,
  Globe,
  Bell,
  Shield,
  CreditCard,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/home/PageHeader'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Language } from '@/stores/settingsStore'

export function SettingsPage() {
  const settings = useSettingsStore()

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-12">
      <PageHeader
        title="Settings"
        description="Manage your account, preferences, and integrations"
      />

      <div className="space-y-6">
        {/* Profile */}
        <SettingsSection icon={User} title="Profile">
          <FieldRow label="Display Name">
            <input
              type="text"
              defaultValue="Kenneth"
              className="w-48 rounded-lg border border-gray-200 px-3 py-1.5 text-right text-sm text-gray-700 outline-none focus:border-purple-500"
            />
          </FieldRow>
          <FieldRow label="Email">
            <input
              type="text"
              defaultValue="kenneth@kitz.services"
              className="w-48 rounded-lg border border-gray-200 px-3 py-1.5 text-right text-sm text-gray-700 outline-none focus:border-purple-500"
            />
          </FieldRow>
          <FieldRow label="Phone">
            <input
              type="text"
              defaultValue="+507 6000-0000"
              className="w-48 rounded-lg border border-gray-200 px-3 py-1.5 text-right text-sm text-gray-700 outline-none focus:border-purple-500"
            />
          </FieldRow>
        </SettingsSection>

        {/* Language */}
        <SettingsSection icon={Globe} title="Language">
          <FieldRow label="Interface Language">
            <select
              value={settings.interfaceLang}
              onChange={(e) => settings.setInterfaceLang(e.target.value as Language)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-purple-500"
            >
              <option value="English">English</option>
              <option value="Español">Español</option>
              <option value="Português">Português</option>
            </select>
          </FieldRow>
          <FieldRow label="WhatsApp Bot Language">
            <select
              value={settings.botLang}
              onChange={(e) => settings.setBotLang(e.target.value as 'English' | 'Español' | 'Auto-detect')}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-purple-500"
            >
              <option value="English">English</option>
              <option value="Español">Español</option>
              <option value="Auto-detect">Auto-detect</option>
            </select>
          </FieldRow>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection icon={Bell} title="Notifications">
          <FieldRow label="Email Notifications">
            <Toggle on={settings.emailNotifications} onToggle={settings.setEmailNotifications} />
          </FieldRow>
          <FieldRow label="WhatsApp Alerts">
            <Toggle on={settings.whatsappAlerts} onToggle={settings.setWhatsappAlerts} />
          </FieldRow>
          <FieldRow label="Agent Activity Digest">
            <select
              value={settings.agentDigest}
              onChange={(e) => settings.setAgentDigest(e.target.value as 'Off' | 'Daily' | 'Weekly')}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-purple-500"
            >
              <option value="Off">Off</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
            </select>
          </FieldRow>
        </SettingsSection>

        {/* AI Battery */}
        <SettingsSection icon={CreditCard} title="AI Battery">
          <FieldRow label="Daily Credit Limit">
            <input
              type="number"
              value={settings.dailyCreditLimit}
              onChange={(e) => settings.setDailyCreditLimit(Number(e.target.value))}
              className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-right text-sm text-gray-700 outline-none focus:border-purple-500"
            />
          </FieldRow>
          <FieldRow label="Current Balance">
            <span className="text-sm font-medium text-gray-700">$20.00</span>
          </FieldRow>
          <FieldRow label="Monthly Spend">
            <span className="text-sm font-medium text-gray-700">$12.50</span>
          </FieldRow>
          <FieldRow label="Low Balance Alert">
            <Toggle on={settings.lowBalanceAlert} onToggle={settings.setLowBalanceAlert} />
          </FieldRow>
        </SettingsSection>

        {/* Security */}
        <SettingsSection icon={Shield} title="Security">
          <FieldRow label="Kill Switch">
            <Toggle on={settings.killSwitch} onToggle={settings.setKillSwitch} />
          </FieldRow>
          <FieldRow label="Draft-First Mode">
            <Toggle on={settings.draftFirst} onToggle={settings.setDraftFirst} />
          </FieldRow>
          <FieldRow label="Audit Trail">
            <Toggle on={settings.auditTrail} onToggle={settings.setAuditTrail} />
          </FieldRow>
        </SettingsSection>

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

/* ── Reusable sub-components ── */

function SettingsSection({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon className="h-4 w-4 text-purple-500" />
        <h3 className="text-sm font-bold text-black">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      {children}
    </div>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: (val: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onToggle(!on)}
      className={`relative h-6 w-10 rounded-full transition ${
        on ? 'bg-purple-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          on ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}
