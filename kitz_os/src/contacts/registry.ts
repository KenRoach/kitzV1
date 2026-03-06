/**
 * Contact Registry — Track known contacts and their onboarding state.
 *
 * Detects first-time contacts across channels (WhatsApp, email).
 * Manages onboarding lifecycle: new → onboarding → trial → active → expired.
 * File-based JSON persistence at data/contacts.json.
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
  totalMessages: number;
  firstContactAt: number;   // unix ms
  lastContactAt: number;    // unix ms
  tags: string[];
  locale: string;           // 'es' | 'en'
}

// ── In-memory store with file persistence ──

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

/** Load contacts from disk */
export function loadContacts(): void {
  try {
    if (existsSync(CONTACTS_FILE)) {
      const raw = readFileSync(CONTACTS_FILE, 'utf-8');
      const data: Contact[] = JSON.parse(raw);
      for (const c of data) {
        const key = c.phone ? `wa:${normalizePhone(c.phone)}` : `email:${c.email}`;
        contacts.set(key, c);
      }
      log.info('contacts loaded', { count: contacts.size });
    }
  } catch (err) {
    log.error('failed to load contacts', { err });
  }
}

/** Persist contacts to disk (debounced) */
let saveTimer: ReturnType<typeof setTimeout> | null = null;
async function saveContacts(): Promise<void> {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      const data = [...contacts.values()];
      await writeFile(CONTACTS_FILE, JSON.stringify(data, null, 2));
      dirty = false;
    } catch (err) {
      log.error('failed to save contacts', { err });
    }
  }, 1000);
}

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
  dirty = true;
  saveContacts();
  log.info('new contact registered', { key, channel, locale });
  return contact;
}

/** Update contact fields */
export function updateContact(
  identifier: string,
  channel: 'whatsapp' | 'email' | 'web',
  patch: Partial<Pick<Contact, 'name' | 'businessName' | 'businessType' | 'status' | 'onboardingStep' | 'trialStartedAt' | 'trialExpiresAt' | 'trialCredits' | 'tags' | 'locale'>>,
): Contact | undefined {
  const key = contactKey(identifier, channel);
  const contact = contacts.get(key);
  if (!contact) return undefined;

  Object.assign(contact, patch);
  contact.lastContactAt = Date.now();
  dirty = true;
  saveContacts();
  return contact;
}

/** Increment message count */
export function touchContact(identifier: string, channel: 'whatsapp' | 'email' | 'web'): Contact | undefined {
  const key = contactKey(identifier, channel);
  const contact = contacts.get(key);
  if (!contact) return undefined;

  contact.totalMessages++;
  contact.lastContactAt = Date.now();
  dirty = true;
  saveContacts();
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
