import { create } from 'zustand'

export type Language = 'English' | 'Español' | 'Português'

interface SettingsState {
  /* Language */
  interfaceLang: Language
  botLang: 'English' | 'Español' | 'Auto-detect'

  /* Notifications */
  emailNotifications: boolean
  whatsappAlerts: boolean
  agentDigest: 'Off' | 'Daily' | 'Weekly'

  /* AI Battery */
  dailyCreditLimit: number
  lowBalanceAlert: boolean

  /* Security */
  killSwitch: boolean
  draftFirst: boolean
  auditTrail: boolean

  /* Actions */
  setInterfaceLang: (lang: Language) => void
  setBotLang: (lang: 'English' | 'Español' | 'Auto-detect') => void
  setEmailNotifications: (on: boolean) => void
  setWhatsappAlerts: (on: boolean) => void
  setAgentDigest: (freq: 'Off' | 'Daily' | 'Weekly') => void
  setDailyCreditLimit: (limit: number) => void
  setLowBalanceAlert: (on: boolean) => void
  setKillSwitch: (on: boolean) => void
  setDraftFirst: (on: boolean) => void
  setAuditTrail: (on: boolean) => void
}

/** Reads from localStorage, applying defaults */
function loadPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`kitz_settings_${key}`)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function persist<T>(key: string, value: T): void {
  localStorage.setItem(`kitz_settings_${key}`, JSON.stringify(value))
}

export const useSettingsStore = create<SettingsState>((set) => ({
  interfaceLang: loadPersisted<Language>('interfaceLang', 'English'),
  botLang: loadPersisted<'English' | 'Español' | 'Auto-detect'>('botLang', 'English'),
  emailNotifications: loadPersisted('emailNotifications', true),
  whatsappAlerts: loadPersisted('whatsappAlerts', true),
  agentDigest: loadPersisted<'Off' | 'Daily' | 'Weekly'>('agentDigest', 'Daily'),
  dailyCreditLimit: loadPersisted('dailyCreditLimit', 5),
  lowBalanceAlert: loadPersisted('lowBalanceAlert', true),
  killSwitch: loadPersisted('killSwitch', false),
  draftFirst: loadPersisted('draftFirst', true),
  auditTrail: loadPersisted('auditTrail', true),

  setInterfaceLang: (lang) => { persist('interfaceLang', lang); set({ interfaceLang: lang }) },
  setBotLang: (lang) => { persist('botLang', lang); set({ botLang: lang }) },
  setEmailNotifications: (on) => { persist('emailNotifications', on); set({ emailNotifications: on }) },
  setWhatsappAlerts: (on) => { persist('whatsappAlerts', on); set({ whatsappAlerts: on }) },
  setAgentDigest: (freq) => { persist('agentDigest', freq); set({ agentDigest: freq }) },
  setDailyCreditLimit: (limit) => { persist('dailyCreditLimit', limit); set({ dailyCreditLimit: limit }) },
  setLowBalanceAlert: (on) => { persist('lowBalanceAlert', on); set({ lowBalanceAlert: on }) },
  setKillSwitch: (on) => { persist('killSwitch', on); set({ killSwitch: on }) },
  setDraftFirst: (on) => { persist('draftFirst', on); set({ draftFirst: on }) },
  setAuditTrail: (on) => { persist('auditTrail', on); set({ auditTrail: on }) },
}))
