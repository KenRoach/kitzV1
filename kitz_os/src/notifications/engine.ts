/**
 * Notification Engine — Proactive status updates, insights, and alerts.
 *
 * Sends scheduled and event-driven notifications to Kitz users via WhatsApp.
 *
 * Scheduled:
 *   - Morning brief: 7:30 AM (Panama) — day summary + tasks
 *   - Weekly insight: Monday 8:30 AM — trends + recommendations
 *   - Trial reminders: Day 3 and Day 6 for trial users
 *
 * Event-driven:
 *   - New lead captured
 *   - Payment received
 *   - Milestone reached (10th contact, first sale, etc.)
 *   - Trial expiring
 */

import { createSubsystemLogger } from 'kitz-schemas';
import cron from 'node-cron';
import { listContacts, getTrialStats, getExpiredTrials, type Contact } from '../contacts/registry.js';

const log = createSubsystemLogger('notifications');
const KITZ_DOMAIN = process.env.KITZ_DOMAIN || 'https://workspace.kitz.services';

const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';
const KITZ_PHONE = process.env.KITZ_WHATSAPP_NUMBER || '';
const OWNER_PHONE = process.env.CADENCE_PHONE || '';
const NOTIFICATIONS_ENABLED = process.env.NOTIFICATIONS_ENABLED !== 'false';
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';

// ── Types ──

export type NotificationType = 'morning_brief' | 'weekly_insight' | 'trial_reminder' | 'milestone' | 'new_lead' | 'payment' | 'alert';

export interface Notification {
  type: NotificationType;
  recipient: string;   // phone number
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

// ── Notification Queue ──

const pendingNotifications: Notification[] = [];

/** Queue a notification for delivery */
export function queueNotification(notif: Omit<Notification, 'createdAt'>): void {
  pendingNotifications.push({ ...notif, createdAt: Date.now() });
  log.info('notification queued', { type: notif.type, recipient: notif.recipient.slice(0, 6) + '***' });
}

/** Send a WhatsApp message to a phone number */
async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  try {
    const res = await fetch(`${WA_CONNECTOR_URL}/outbound/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SERVICE_SECRET ? { 'x-dev-secret': SERVICE_SECRET } : {}),
      },
      body: JSON.stringify({ phone, message, draftOnly: false }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch (err) {
    log.error('WhatsApp send failed', { phone: phone.slice(0, 6), err });
    return false;
  }
}

/** Flush pending notifications */
async function flushQueue(): Promise<void> {
  while (pendingNotifications.length > 0) {
    const notif = pendingNotifications.shift()!;
    await sendWhatsApp(notif.recipient, notif.message);
  }
}

// ── Scheduled Notifications ──

/** Morning brief for the owner */
function generateMorningBrief(): string {
  const contacts = listContacts();
  const trialStats = getTrialStats();
  const today = new Date();
  const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][today.getDay()];
  const monthDay = today.getDate();
  const monthName = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][today.getMonth()];

  // Recent contacts (last 24h)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentContacts = contacts.filter(c => c.lastContactAt > oneDayAgo);
  const newContacts = contacts.filter(c => c.firstContactAt > oneDayAgo);

  return `🟣 *KITZ — Buenos días*
${dayName} ${monthDay} ${monthName}
─────────────────

📊 *Status del día*
• Contactos totales: ${contacts.length}
• Nuevos (24h): ${newContacts.length}
• Activos (24h): ${recentContacts.length}

🧪 *Trials*
• Activos: ${trialStats.active}
• Expirados: ${trialStats.expired}
• Convertidos: ${trialStats.converted}

${newContacts.length > 0 ? `\n👤 *Nuevos contactos*\n${newContacts.slice(0, 5).map(c => `• ${c.name || c.phone || c.email || 'Anónimo'} — ${c.businessType || 'Sin negocio'}`).join('\n')}` : ''}

🟢 Kitz está activo y monitoreando.
Escríbeme para cualquier cosa. 💪`;
}

/** Weekly insight */
function generateWeeklyInsight(): string {
  const contacts = listContacts();
  const trialStats = getTrialStats();
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekContacts = contacts.filter(c => c.firstContactAt > oneWeekAgo);
  const activeTrials = contacts.filter(c => c.status === 'trial');

  return `🟣 *KITZ — Resumen Semanal*
─────────────────

📈 *Esta semana*
• Nuevos contactos: ${weekContacts.length}
• Trials activos: ${trialStats.active}
• Tasa de conversión: ${trialStats.total > 0 ? Math.round((trialStats.converted / trialStats.total) * 100) : 0}%

${activeTrials.length > 0 ? `\n⏰ *Trials por expirar*\n${activeTrials
  .filter(c => c.trialExpiresAt && c.trialExpiresAt - Date.now() < 2 * 24 * 60 * 60 * 1000)
  .slice(0, 5)
  .map(c => `• ${c.name || c.phone || 'Anónimo'} — ${Math.ceil((c.trialExpiresAt! - Date.now()) / (24 * 60 * 60 * 1000))} días restantes`)
  .join('\n') || 'Ninguno próximo a expirar'}` : ''}

💡 *Insight*
${weekContacts.length > 3
  ? 'Buen tráfico esta semana. Considera crear una oferta para convertir trials.'
  : 'Tráfico bajo. Comparte tu link wa.me para atraer más leads.'}

🟢 Seguimos construyendo. 🚀`;
}

/** Check for trial reminders */
function checkTrialReminders(): void {
  const contacts = listContacts();
  const now = Date.now();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  for (const contact of contacts) {
    if (contact.status !== 'trial' || !contact.trialStartedAt || !contact.phone) continue;
    const elapsed = now - contact.trialStartedAt;

    // Day 3 reminder
    if (elapsed >= THREE_DAYS_MS && elapsed < THREE_DAYS_MS + ONE_DAY_MS) {
      const name = contact.name || 'amigo/a';
      queueNotification({
        type: 'trial_reminder',
        recipient: contact.phone,
        message: `¡Hola ${name}! 👋 Ya van 3 días de tu trial con Kitz.\n\n¿Ya probaste crear un contacto o redactar un email? Escríbeme y te ayudo. 🚀\n\nTe quedan ${contact.trialCredits} créditos AI.`,
        priority: 'medium',
      });
    }

    // Day 6 reminder (last day warning)
    if (elapsed >= SIX_DAYS_MS && elapsed < SIX_DAYS_MS + ONE_DAY_MS) {
      const name = contact.name || 'amigo/a';
      queueNotification({
        type: 'trial_reminder',
        recipient: contact.phone,
        message: `⏰ ${name}, tu trial con Kitz termina mañana.\n\nTienes ${contact.trialCredits} créditos restantes. ¡Aprovéchalos!\n\nPara seguir usando Kitz después del trial, escríbeme "quiero continuar". 💪`,
        priority: 'high',
      });
    }
  }

  // ── Post-trial expiry notifications (sent to expired users) ──
  checkExpiredTrialNotifications();
}

/** Send upgrade nudges to recently expired trial users */
function checkExpiredTrialNotifications(): void {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;
  const FOURTEEN_DAYS_MS = 14 * ONE_DAY_MS;
  const now = Date.now();

  // Get all expired contacts (within 15 days)
  const expired = getExpiredTrials(15 * ONE_DAY_MS);

  for (const contact of expired) {
    if (!contact.phone || !contact.trialExpiresAt) continue;
    const sinceExpiry = now - contact.trialExpiresAt;
    const name = contact.name || 'amigo/a';

    // Day 7: Trial just expired (0-24h after expiry)
    if (sinceExpiry >= 0 && sinceExpiry < ONE_DAY_MS) {
      queueNotification({
        type: 'trial_reminder',
        recipient: contact.phone,
        message: `${name}, tu trial de 7 dias con Kitz termino. 🟣\n\nPero tu negocio no para — y yo tampoco.\n\n$5 = 100 acciones AI (emails, reportes, CRM, y mas).\n\n👉 ${KITZ_DOMAIN}/pricing\n\nO escribe "quiero continuar" y te ayudo.`,
        priority: 'high',
      });
    }

    // Day 14: Win-back (7 days after expiry)
    if (sinceExpiry >= SEVEN_DAYS_MS && sinceExpiry < SEVEN_DAYS_MS + ONE_DAY_MS) {
      queueNotification({
        type: 'trial_reminder',
        recipient: contact.phone,
        message: `Hola ${name} 👋 Hace una semana que terminaste tu trial con Kitz.\n\nTodavia puedo ayudarte con tu negocio:\n• Gestionar clientes y leads\n• Redactar emails y mensajes\n• Crear reportes y facturas\n\n$5 = 100 creditos AI. Eso son ~2 horas de trabajo ahorradas.\n\n👉 ${KITZ_DOMAIN}/pricing`,
        priority: 'medium',
      });
    }
  }
}

// ── Event-Driven Notifications ──

/** Notify owner about a new lead */
export function notifyNewLead(contact: Contact): void {
  if (!OWNER_PHONE) return;
  queueNotification({
    type: 'new_lead',
    recipient: OWNER_PHONE,
    message: `🆕 *Nuevo lead capturado*\n\n• Nombre: ${contact.name || 'Sin nombre'}\n• Tel: ${contact.phone || 'N/A'}\n• Negocio: ${contact.businessType || 'Sin especificar'}\n• Canal: ${contact.channel}\n\nKitz ya le está dando servicio. 🟢`,
    priority: 'medium',
  });
  flushQueue();
}

/** Notify about a milestone */
export function notifyMilestone(message: string, priority: 'low' | 'medium' | 'high' = 'medium'): void {
  if (!OWNER_PHONE) return;
  queueNotification({
    type: 'milestone',
    recipient: OWNER_PHONE,
    message: `🏆 *Milestone*\n\n${message}`,
    priority,
  });
  flushQueue();
}

// ── Engine ──

const scheduledTasks: cron.ScheduledTask[] = [];

/** Start the notification engine */
export function startNotificationEngine(): void {
  if (!NOTIFICATIONS_ENABLED) {
    log.info('Notifications disabled');
    return;
  }

  // Morning brief — 7:30 AM Panama time (to owner)
  if (OWNER_PHONE) {
    scheduledTasks.push(
      cron.schedule('30 7 * * *', () => {
        const brief = generateMorningBrief();
        sendWhatsApp(OWNER_PHONE, brief).catch((err) => { log.warn('morning_brief_send_failed', { error: (err as Error).message }); });
      }, { timezone: 'America/Panama' })
    );
  }

  // Weekly insight — Monday 8:30 AM (to owner)
  if (OWNER_PHONE) {
    scheduledTasks.push(
      cron.schedule('30 8 * * 1', () => {
        const insight = generateWeeklyInsight();
        sendWhatsApp(OWNER_PHONE, insight).catch((err) => { log.warn('weekly_insight_send_failed', { error: (err as Error).message }); });
      }, { timezone: 'America/Panama' })
    );
  }

  // Trial reminders — Check every day at 9 AM
  scheduledTasks.push(
    cron.schedule('0 9 * * *', () => {
      checkTrialReminders();
      flushQueue();
    }, { timezone: 'America/Panama' })
  );

  log.info(`Notification engine started — ${scheduledTasks.length} schedules active`);
}

/** Stop the notification engine */
export function stopNotificationEngine(): void {
  for (const task of scheduledTasks) task.stop();
  scheduledTasks.length = 0;
  log.info('Notification engine stopped');
}
