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

  // If onboarding is complete or user is active/trial, skip
  if (contact.onboardingStep === 'complete' || contact.onboardingStep === 'trial_started') {
    return null; // Let normal router handle
  }

  // Process based on current onboarding step
  const text = messageText.trim().toLowerCase();

  switch (contact.onboardingStep) {
    case 'welcome_sent':
    case 'awaiting_name': {
      // User responded to welcome — capture name
      const name = extractName(messageText);
      if (name) {
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

/** Extract a name from user text — simple heuristic */
function extractName(text: string): string | null {
  const trimmed = text.trim();
  // Skip if it looks like a question or command
  if (trimmed.includes('?') || trimmed.length > 60 || trimmed.length < 2) return null;
  // Remove common prefixes
  const cleaned = trimmed
    .replace(/^(me llamo|mi nombre es|soy|i'm|my name is|hey,?\s*)/i, '')
    .replace(/^(hola,?\s*soy|hi,?\s*i'm)\s*/i, '')
    .trim();
  if (cleaned.length < 2 || cleaned.length > 40) return null;
  // Capitalize first letter of each word
  return cleaned.replace(/\b\w/g, c => c.toUpperCase());
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
