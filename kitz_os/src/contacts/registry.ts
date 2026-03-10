/**
 * Contact Registry — Track known contacts and their onboarding state.
 *
 * Detects first-time contacts across channels (WhatsApp, email).
 * Manages onboarding lifecycle: new → onboarding → trial → active → expired.
 *
 * Persistence: Supabase (kitz_contacts table) with in-memory + file fallback.
 * On boot: loads from Supabase first, falls back to data/contacts.json.
 * Every write: updates Supabase AND in-memory. File save as tertiary backup.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const log = createSubsystemLogger('contacts');

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const CONTACTS_FILE = join(DATA_DIR, 'contacts.json');

// ── Supabase Config ──

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.WORKSPACE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.WORKSPACE_SUPABASE_SERVICE_KEY || '';
const hasDB = !!(SUPABASE_URL && SUPABASE_KEY);

if (hasDB) {
  log.info('Contact Registry: Supabase persistence enabled');
} else {
  log.info('Contact Registry: No Supabase config — using file + in-memory fallback');
}

// ── Types ──

export type ContactStatus = 'new' | 'onboarding' | 'trial' | 'active' | 'expired';
export type OnboardingStep = 'welcome_sent' | 'awaiting_name' | 'awaiting_business' | 'trial_started' | 'complete';

export interface Contact {
  id: string;
  phone?: string;          // WhatsApp number (without @s.whatsapp.net)
  email?: string;
  name?: string;
  businessName?: string;
  businessType?: string;
  status: ContactStatus;
  onboardingStep: OnboardingStep;
  channel: 'whatsapp' | 'email' | 'web';
  trialStartedAt?: number;  // unix ms
  trialExpiresAt?: number;  // unix ms
  trialCredits: number;     // remaining trial credits
  paidAt?: number;          // unix ms — when user first paid for credits
  referredBy?: string;      // userId of the person who referred this contact
  totalMessages: number;
  firstContactAt: number;   // unix ms
  lastContactAt: number;    // unix ms
  tags: string[];
  locale: string;           // 'es' | 'en'
}

// ── Supabase row shape (snake_case) ──

interface DbContact {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  business_name: string | null;
  business_type: string | null;
  status: string;
  onboarding_step: string;
  channel: string;
  trial_started_at: number | null;
  trial_expires_at: number | null;
  trial_credits: number;
  paid_at: number | null;
  referred_by: string | null;
  total_messages: number;
  first_contact_at: number;
  last_contact_at: number;
  tags: string[];
  locale: string;
}

/** Convert DB row to Contact */
function fromDb(row: DbContact): Contact {
  return {
    id: row.id,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    name: row.name ?? undefined,
    businessName: row.business_name ?? undefined,
    businessType: row.business_type ?? undefined,
    status: row.status as ContactStatus,
    onboardingStep: row.onboarding_step as OnboardingStep,
    channel: row.channel as Contact['channel'],
    trialStartedAt: row.trial_started_at ?? undefined,
    trialExpiresAt: row.trial_expires_at ?? undefined,
    trialCredits: row.trial_credits,
    paidAt: row.paid_at ?? undefined,
    referredBy: row.referred_by ?? undefined,
    totalMessages: row.total_messages,
    firstContactAt: row.first_contact_at,
    lastContactAt: row.last_contact_at,
    tags: row.tags || [],
    locale: row.locale,
  };
}

/** Convert Contact to DB row */
function toDb(c: Contact): DbContact {
  return {
    id: c.id,
    phone: c.phone ?? null,
    email: c.email ?? null,
    name: c.name ?? null,
    business_name: c.businessName ?? null,
    business_type: c.businessType ?? null,
    status: c.status,
    onboarding_step: c.onboardingStep,
    channel: c.channel,
    trial_started_at: c.trialStartedAt ?? null,
    trial_expires_at: c.trialExpiresAt ?? null,
    trial_credits: c.trialCredits,
    paid_at: c.paidAt ?? null,
    referred_by: c.referredBy ?? null,
    total_messages: c.totalMessages,
    first_contact_at: c.firstContactAt,
    last_contact_at: c.lastContactAt,
    tags: c.tags,
    locale: c.locale,
  };
}

// ── Supabase REST helpers ──

async function supaGet(query: string): Promise<DbContact[]> {
  if (!hasDB) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kitz_contacts?${query}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    return await res.json() as DbContact[];
  } catch {
    return [];
  }
}

async function supaUpsert(row: DbContact): Promise<boolean> {
  if (!hasDB) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kitz_contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      log.error('Supabase upsert failed', { status: res.status, detail: errText.slice(0, 200) });
    }
    return res.ok;
  } catch (err) {
    log.error('Supabase upsert error', { error: (err as Error).message });
    return false;
  }
}

// ── In-memory store ──

const contacts = new Map<string, Contact>();
let dirty = false;

/** Normalize phone number: strip +, spaces, dashes */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\+\(\)]/g, '');
}

/** Get contact key from JID or email */
function contactKey(identifier: string, channel: 'whatsapp' | 'email' | 'web'): string {
  if (channel === 'whatsapp') {
    const phone = identifier.split('@')[0];
    return `wa:${normalizePhone(phone)}`;
  }
  return `email:${identifier.toLowerCase()}`;
}

// ── File persistence (fallback) ──

/** Persist contacts to disk (debounced) */
let saveTimer: ReturnType<typeof setTimeout> | null = null;
async function saveContactsToFile(): Promise<void> {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      const data = [...contacts.values()];
      await writeFile(CONTACTS_FILE, JSON.stringify(data, null, 2));
      dirty = false;
    } catch (err) {
      log.error('failed to save contacts to file', { err });
    }
  }, 1000);
}

// ── Load ──

/** Load contacts from Supabase (primary) or file (fallback) */
export async function loadContacts(): Promise<void> {
  // Try Supabase first
  if (hasDB) {
    try {
      const rows = await supaGet('order=last_contact_at.desc&limit=5000');
      if (rows.length > 0) {
        for (const row of rows) {
          const contact = fromDb(row);
          const key = contact.phone ? `wa:${normalizePhone(contact.phone)}` : `email:${contact.email}`;
          contacts.set(key, contact);
        }
        log.info('contacts loaded from Supabase', { count: contacts.size });
        // Also write to file as backup
        saveContactsToFile();
        return;
      }
      log.info('Supabase kitz_contacts table empty, checking file fallback');
    } catch (err) {
      log.error('failed to load contacts from Supabase, falling back to file', { err });
    }
  }

  // Fallback: load from file
  try {
    if (existsSync(CONTACTS_FILE)) {
      const raw = readFileSync(CONTACTS_FILE, 'utf-8');
      const data: Contact[] = JSON.parse(raw);
      for (const c of data) {
        const key = c.phone ? `wa:${normalizePhone(c.phone)}` : `email:${c.email}`;
        contacts.set(key, c);
      }
      log.info('contacts loaded from file', { count: contacts.size });

      // If we have Supabase now, sync file contacts up to DB
      if (hasDB && contacts.size > 0) {
        log.info('syncing file contacts to Supabase...', { count: contacts.size });
        for (const c of contacts.values()) {
          supaUpsert(toDb(c)).catch(() => {});  // fire-and-forget
        }
      }
    }
  } catch (err) {
    log.error('failed to load contacts from file', { err });
  }
}

// ── Persist helper (write to Supabase + file) ──

function persistContact(contact: Contact): void {
  dirty = true;
  // Supabase (async, non-blocking)
  supaUpsert(toDb(contact)).catch(() => {});
  // File backup
  saveContactsToFile();
}

// ── Public API ──

/** Check if a contact is first-time (never seen before) */
export function isFirstContact(identifier: string, channel: 'whatsapp' | 'email' | 'web'): boolean {
  const key = contactKey(identifier, channel);
  return !contacts.has(key);
}

/** Get contact by identifier */
export function getContact(identifier: string, channel: 'whatsapp' | 'email' | 'web'): Contact | undefined {
  const key = contactKey(identifier, channel);
  return contacts.get(key);
}

/** Register a new first-time contact */
export function registerContact(
  identifier: string,
  channel: 'whatsapp' | 'email' | 'web',
  locale: string = 'es',
): Contact {
  const key = contactKey(identifier, channel);
  const existing = contacts.get(key);
  if (existing) return existing;

  const now = Date.now();
  const phone = channel === 'whatsapp' ? identifier.split('@')[0] : undefined;
  const email = channel === 'email' ? identifier : undefined;

  const contact: Contact = {
    id: randomUUID(),
    phone,
    email,
    status: 'new',
    onboardingStep: 'welcome_sent',
    channel,
    trialCredits: 0,
    totalMessages: 0,
    firstContactAt: now,
    lastContactAt: now,
    tags: ['first-contact'],
    locale,
  };

  contacts.set(key, contact);
  persistContact(contact);
  log.info('new contact registered', { key, channel, locale });
  return contact;
}

/** Update contact fields */
export function updateContact(
  identifier: string,
  channel: 'whatsapp' | 'email' | 'web',
  patch: Partial<Pick<Contact, 'name' | 'businessName' | 'businessType' | 'status' | 'onboardingStep' | 'trialStartedAt' | 'trialExpiresAt' | 'trialCredits' | 'tags' | 'locale' | 'paidAt' | 'referredBy'>>,
): Contact | undefined {
  const key = contactKey(identifier, channel);
  const contact = contacts.get(key);
  if (!contact) return undefined;

  Object.assign(contact, patch);
  contact.lastContactAt = Date.now();
  persistContact(contact);
  return contact;
}

/** Increment message count */
export function touchContact(identifier: string, channel: 'whatsapp' | 'email' | 'web'): Contact | undefined {
  const key = contactKey(identifier, channel);
  const contact = contacts.get(key);
  if (!contact) return undefined;

  contact.totalMessages++;
  contact.lastContactAt = Date.now();
  persistContact(contact);
  return contact;
}

/** Start trial for a contact — 7 days, 50 credits */
export function startTrial(identifier: string, channel: 'whatsapp' | 'email' | 'web'): Contact | undefined {
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  return updateContact(identifier, channel, {
    status: 'trial',
    onboardingStep: 'trial_started',
    trialStartedAt: now,
    trialExpiresAt: now + SEVEN_DAYS_MS,
    trialCredits: 50,
    tags: ['trial-user'],
  });
}

/** Check if trial is still valid */
export function isTrialActive(identifier: string, channel: 'whatsapp' | 'email' | 'web'): boolean {
  const contact = getContact(identifier, channel);
  if (!contact || contact.status !== 'trial') return false;
  if (!contact.trialExpiresAt) return false;
  if (Date.now() > contact.trialExpiresAt) {
    updateContact(identifier, channel, { status: 'expired' });
    return false;
  }
  return contact.trialCredits > 0;
}

/** Consume a trial credit */
export function consumeTrialCredit(identifier: string, channel: 'whatsapp' | 'email' | 'web'): boolean {
  const contact = getContact(identifier, channel);
  if (!contact || contact.trialCredits <= 0) return false;
  updateContact(identifier, channel, { trialCredits: contact.trialCredits - 1 });
  return true;
}

/** Get all contacts (for admin/reporting) */
export function listContacts(): Contact[] {
  return [...contacts.values()];
}

/** Get trial stats */
export function getTrialStats(): { total: number; active: number; expired: number; converted: number } {
  let active = 0, expired = 0, converted = 0;
  for (const c of contacts.values()) {
    if (c.status === 'trial') active++;
    else if (c.status === 'expired') expired++;
    else if (c.status === 'active') converted++;
  }
  return { total: contacts.size, active, expired, converted };
}

/** Activate a paid tier for an expired-trial contact */
export function activatePaid(identifier: string, channel: 'whatsapp' | 'email' | 'web'): Contact | undefined {
  const contact = getContact(identifier, channel);
  if (!contact) return undefined;
  return updateContact(identifier, channel, {
    status: 'active',
    paidAt: Date.now(),
    tags: [...(contact.tags || []).filter(t => t !== 'expired-trial'), 'paid-user'],
  });
}

/** Get contacts whose trials expired recently (within given ms window) */
export function getExpiredTrials(withinMs: number = 24 * 60 * 60 * 1000): Contact[] {
  const now = Date.now();
  return [...contacts.values()].filter(c =>
    c.status === 'expired' &&
    c.trialExpiresAt &&
    now - c.trialExpiresAt < withinMs
  );
}

/** Get contacts by status */
export function getContactsByStatus(status: ContactStatus): Contact[] {
  return [...contacts.values()].filter(c => c.status === status);
}
