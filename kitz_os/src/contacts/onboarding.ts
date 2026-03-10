/**
 * Onboarding Flow — Multi-step welcome for first-time Kitz users.
 *
 * Flow:
 * 1. Welcome message → explain Kitz + ask for name
 * 2. Capture name → ask about business
 * 3. Capture business → start trial + show capabilities
 * 4. Trial started → route to normal semantic router
 *
 * Works across channels (WhatsApp, email).
 * Returns onboarding response if in flow, null if user is past onboarding.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import {
  isFirstContact,
  getContact,
  registerContact,
  updateContact,
  startTrial,
  touchContact,
  type Contact,
  type OnboardingStep,
} from './registry.js';
import { notifyNewLead } from '../notifications/engine.js';

const log = createSubsystemLogger('onboarding');
const KITZ_DOMAIN = process.env.KITZ_DOMAIN || 'https://workspace.kitz.services';

export interface OnboardingResult {
  response: string;
  isOnboarding: boolean;
  contact: Contact;
  voice_note?: { text: string };  // Optional TTS text for voice welcome
}

/** Check if user needs onboarding and return appropriate response */
export function handleOnboarding(
  identifier: string,
  channel: 'whatsapp' | 'email' | 'web',
  messageText: string,
  locale: string = 'es',
): OnboardingResult | null {
  // Check if first-time contact
  if (isFirstContact(identifier, channel)) {
    const contact = registerContact(identifier, channel, locale);
    log.info('first-time contact — starting onboarding', { identifier, channel });
    return {
      response: getWelcomeMessage(locale),
      isOnboarding: true,
      contact,
      voice_note: { text: getWelcomeVoiceText(locale) },
    };
  }

  const contact = getContact(identifier, channel);
  if (!contact) return null;

  // Touch — increment message count
  touchContact(identifier, channel);

  // If onboarding is complete or user is active/trial, check for expired trial
  if (contact.onboardingStep === 'complete' || contact.onboardingStep === 'trial_started') {
    // Intercept expired trial users with upgrade prompt
    if (contact.status === 'expired') {
      const expiredResponse = handleExpiredTrial(contact, messageText, locale);
      if (expiredResponse) return expiredResponse;
    }
    return null; // Let normal router handle
  }

  // Process based on current onboarding step
  const text = messageText.trim().toLowerCase();

  switch (contact.onboardingStep) {
    case 'welcome_sent':
    case 'awaiting_name': {
      // User responded to welcome — capture name
      const { name, businessContext } = extractNameAndBusiness(messageText);
      if (name) {
        // If the user also mentioned their business in the same message, skip to trial
        if (businessContext) {
          log.info('extracted name + business from single message', { identifier, name, businessContext });
          updateContact(identifier, channel, {
            name,
            businessType: businessContext,
            businessName: businessContext,
          });
          const trialContact = startTrial(identifier, channel);
          if (trialContact) {
            updateContact(identifier, channel, { onboardingStep: 'complete' });
            notifyNewLead(trialContact);
            return {
              response: getTrialStartedMessage(name, businessContext, locale),
              isOnboarding: true,
              contact: { ...trialContact, onboardingStep: 'complete' },
            };
          }
        }

        // Name only — ask for business
        updateContact(identifier, channel, {
          name,
          onboardingStep: 'awaiting_business',
        });
        return {
          response: getBusinessQuestion(name, locale),
          isOnboarding: true,
          contact: { ...contact, name, onboardingStep: 'awaiting_business' },
        };
      }
      // If we can't extract a name, ask again gently
      updateContact(identifier, channel, { onboardingStep: 'awaiting_name' });
      return {
        response: getNamePrompt(locale),
        isOnboarding: true,
        contact,
      };
    }

    case 'awaiting_business': {
      // Capture business info and start trial
      const businessType = messageText.trim();
      updateContact(identifier, channel, {
        businessType,
        businessName: businessType,
      });
      const trialContact = startTrial(identifier, channel);
      if (trialContact) {
        updateContact(identifier, channel, { onboardingStep: 'complete' });
        // Notify owner about new lead
        notifyNewLead(trialContact);
        return {
          response: getTrialStartedMessage(contact.name || '', businessType, locale),
          isOnboarding: true,
          contact: { ...trialContact, onboardingStep: 'complete' },
        };
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Extract name and optionally business context from user text.
 *
 * Handles messages like:
 *   "Jonathan" → name only
 *   "Me llamo Jonathan" → name only
 *   "Me llamo Jonathan, tengo un negocio de alfombras personalizadas" → name + business
 *   "Soy Maria y vendo ropa online" → name + business
 *   "Hi I'm Alex, I run a restaurant" → name + business
 */
function extractNameAndBusiness(text: string): { name: string | null; businessContext: string | null } {
  const trimmed = text.trim();
  if (trimmed.includes('?') || trimmed.length < 2) return { name: null, businessContext: null };

  // Business context indicators (Spanish + English)
  const businessSplitPatterns = [
    /[,\.]\s*(?:tengo|vendo|hago|trabajo|me dedico|mi negocio|mi empresa|soy\s+\w+\s+(?:de|en))/i,
    /[,\.]\s*(?:i\s+(?:have|sell|make|run|own|work)|my\s+(?:business|company|shop|store))/i,
    /\s+y\s+(?:tengo|vendo|hago|trabajo|me dedico)/i,
    /\s+and\s+(?:i\s+(?:have|sell|make|run|own))/i,
  ];

  // Try to split name from business context
  let namePart = trimmed;
  let businessPart: string | null = null;

  for (const pattern of businessSplitPatterns) {
    const match = trimmed.match(pattern);
    if (match && match.index !== undefined) {
      namePart = trimmed.slice(0, match.index).trim();
      businessPart = trimmed.slice(match.index).replace(/^[,.\s]+/, '').trim();
      break;
    }
  }

  // If message is very long (>120 chars) and no business split found, it might still contain both
  // But just extract name from the first part
  if (!businessPart && trimmed.length > 60) {
    // Try splitting on first comma, period, or newline
    const simpleSplit = trimmed.match(/^([^,.\n]{2,50})[,.\n]\s*(.{10,})$/);
    if (simpleSplit) {
      namePart = simpleSplit[1].trim();
      businessPart = simpleSplit[2].trim();
    }
  }

  // Extract name from the name part
  const cleaned = namePart
    .replace(/^(me llamo|mi nombre es|soy|i'm|my name is|hey,?\s*)/i, '')
    .replace(/^(hola,?\s*soy|hi,?\s*i'm)\s*/i, '')
    .trim();

  if (cleaned.length < 2 || cleaned.length > 40) return { name: null, businessContext: null };

  // Capitalize first letter of each word
  const name = cleaned.replace(/\b\w/g, c => c.toUpperCase());

  return { name, businessContext: businessPart };
}

// ── Expired Trial Handler ──

/** Keywords that signal upgrade intent (Spanish + English) */
const UPGRADE_KEYWORDS = /\b(quiero continuar|continuar|upgrade|pricing|precios|creditos|credits|pagar|pay|comprar|buy|suscribir|subscribe|planes|plans)\b/i;

/** Handle messages from users whose trial has expired */
function handleExpiredTrial(
  contact: Contact,
  messageText: string,
  locale: string,
): OnboardingResult | null {
  const text = messageText.trim().toLowerCase();

  // If user expresses upgrade intent, show pricing
  if (UPGRADE_KEYWORDS.test(text)) {
    log.info('expired trial user requesting upgrade', { phone: contact.phone, name: contact.name });
    return {
      response: getUpgradeMessage(contact.name || '', locale),
      isOnboarding: true,
      contact,
    };
  }

  // For first message after expiry, give a gentle nudge (only once per day)
  const lastContact = contact.lastContactAt || 0;
  const hoursSinceLastMsg = (Date.now() - lastContact) / (60 * 60 * 1000);
  if (hoursSinceLastMsg > 24) {
    return {
      response: getExpiredNudgeMessage(contact.name || '', locale),
      isOnboarding: true,
      contact,
    };
  }

  // If they messaged recently, let normal router handle (so they can still chat)
  return null;
}

function getUpgradeMessage(name: string, locale: string): string {
  const greeting = name ? `*${name}*` : 'amigo/a';
  if (locale === 'en') {
    return `Hey ${greeting}! 🟣 Ready to keep building?

*Kitz AI Credit Packs:*

💜 *100 credits* — $5 ($0.05/use)
💎 *500 credits* — $20 ($0.04/use)
🚀 *2,000 credits* — $60 ($0.03/use)

1 credit = 1 AI action (email, message, report, etc.)

👉 Get started: ${KITZ_DOMAIN}/pricing

Or just write "I want 100 credits" and I'll set it up for you.`;
  }

  return `${greeting}, 🟣 listo/a para seguir construyendo?

*Paquetes de Creditos AI de Kitz:*

💜 *100 creditos* — $5 ($0.05/uso)
💎 *500 creditos* — $20 ($0.04/uso)
🚀 *2,000 creditos* — $60 ($0.03/uso)

1 credito = 1 accion AI (email, mensaje, reporte, etc.)

👉 Empieza aqui: ${KITZ_DOMAIN}/pricing

O solo escribe "quiero 100 creditos" y te lo configuro.`;
}

function getExpiredNudgeMessage(name: string, locale: string): string {
  const greeting = name ? `*${name}*` : '';
  if (locale === 'en') {
    return `Hey${greeting ? ` ${greeting}` : ''}! 👋 Your free trial ended, but your business didn't stop.

I can still help you — just grab a credit pack and we're back in action.

Write *"pricing"* to see options, or visit: ${KITZ_DOMAIN}/pricing

$5 = 100 AI actions. That's about 2 hours of work saved. 💪`;
  }

  return `${greeting ? `${greeting}, ` : ''}👋 tu trial gratis termino, pero tu negocio no para.

Todavia puedo ayudarte — solo necesitas un paquete de creditos y volvemos a la accion.

Escribe *"precios"* para ver opciones, o visita: ${KITZ_DOMAIN}/pricing

$5 = 100 acciones AI. Eso son como 2 horas de trabajo ahorradas. 💪`;
}

// ── Message Templates ──

function getWelcomeMessage(locale: string): string {
  if (locale === 'en') {
    return `Hey there! 👋 I'm *Kitz*, your personal business assistant.

I help entrepreneurs and small businesses manage their day-to-day:

📋 *CRM & Contacts* — Track clients and leads
📊 *Orders & Invoices* — Manage sales end-to-end
📅 *Calendar & Scheduling* — Book appointments
📧 *Email & WhatsApp* — Communicate across channels
📈 *Reports & Insights* — Know your numbers
🎨 *Content & Marketing* — Create posts, ads, and more
🔊 *Voice Notes* — I can even talk back!

You get a *7-day free trial* with 50 AI credits to explore everything.

What's your name? 😊`;
  }

  return `¡Hola! 👋 Soy *Kitz*, tu asistente personal de negocios.

Ayudo a emprendedores y pequeños negocios a gestionar su día a día:

📋 *CRM y Contactos* — Lleva el control de clientes y prospectos
📊 *Pedidos y Facturas* — Gestiona ventas de principio a fin
📅 *Calendario y Citas* — Agenda reuniones y citas
📧 *Email y WhatsApp* — Comunícate por todos los canales
📈 *Reportes e Insights* — Conoce tus números
🎨 *Contenido y Marketing* — Crea posts, anuncios y más
🔊 *Notas de Voz* — ¡Hasta puedo responderte con voz!

Tienes un *trial gratis de 7 días* con 50 créditos AI para explorar todo.

¿Cómo te llamas? 😊`;
}

function getWelcomeVoiceText(locale: string): string {
  if (locale === 'en') {
    return 'Hey! I\'m Kitz, your personal business assistant. I\'m here to help you run your business more efficiently. You get a free 7-day trial to explore everything I can do. What\'s your name?';
  }
  return 'Hola! Soy Kitz, tu asistente personal de negocios. Estoy aquí para ayudarte a gestionar tu negocio de forma más eficiente. Tienes un trial gratis de 7 días para explorar todo lo que puedo hacer. ¿Cómo te llamas?';
}

function getNamePrompt(locale: string): string {
  if (locale === 'en') {
    return `No worries! Just tell me your name so I can personalize your experience. 😊`;
  }
  return `¡No te preocupes! Solo dime tu nombre para personalizar tu experiencia. 😊`;
}

function getBusinessQuestion(name: string, locale: string): string {
  if (locale === 'en') {
    return `Nice to meet you, *${name}*! 🎉

To set things up for you, tell me a little about your business:

What do you do? For example:
• "I sell clothes online"
• "I have a restaurant"
• "I'm a freelance designer"
• "Medical practice"
• "I'm just starting out"

Whatever it is, I'll customize Kitz for you! 🚀`;
  }

  return `¡Mucho gusto, *${name}*! 🎉

Para configurar todo para ti, cuéntame un poco sobre tu negocio:

¿A qué te dedicas? Por ejemplo:
• "Vendo ropa online"
• "Tengo un restaurante"
• "Soy diseñador freelance"
• "Consultorio médico"
• "Estoy empezando"

Sea lo que sea, ¡voy a personalizar Kitz para ti! 🚀`;
}

function getTrialStartedMessage(name: string, businessType: string, locale: string): string {
  if (locale === 'en') {
    return `Perfect, *${name}*! 🎯 Your Kitz is ready.

🟢 *7-day free trial activated*
⚡ 50 AI credits loaded
🏪 Business: ${businessType}

Here's what you can do right now:

1️⃣ *"Show me my dashboard"* — See your business overview
2️⃣ *"Create a contact"* — Start building your CRM
3️⃣ *"Draft an email"* — I'll write it for you
4️⃣ *"Send me a voice note with today's summary"* — Hear your daily brief
5️⃣ *"What can you do?"* — See all capabilities

Just write or send a voice note — I understand both! 🎙️

Let's build something great together. What would you like to do first?`;
  }

  return `¡Perfecto, *${name}*! 🎯 Tu Kitz está listo.

🟢 *Trial gratis de 7 días activado*
⚡ 50 créditos AI cargados
🏪 Negocio: ${businessType}

Esto es lo que puedes hacer ahora mismo:

1️⃣ *"Muéstrame mi dashboard"* — Ve tu resumen de negocio
2️⃣ *"Crear un contacto"* — Empieza a armar tu CRM
3️⃣ *"Redacta un email"* — Yo lo escribo por ti
4️⃣ *"Mándame una nota de voz con el resumen del día"* — Escucha tu brief diario
5️⃣ *"¿Qué puedes hacer?"* — Ve todas las funcionalidades

Solo escribe o manda una nota de voz — ¡entiendo ambos! 🎙️

Vamos a construir algo increíble juntos. ¿Qué te gustaría hacer primero?`;
}
