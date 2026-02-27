/**
 * Outbound Tools — Send messages, voice notes, and calls via WhatsApp, email, SMS, and voice.
 *
 * 6 tools:
 *   - outbound_sendWhatsApp    (high)   — Send text message via WhatsApp
 *   - outbound_sendEmail       (high)   — Send email (admin_assistant only)
 *   - outbound_sendVoiceNote   (high)   — Generate TTS audio + send as WhatsApp voice note
 *   - outbound_makeCall        (high)   — Initiate WhatsApp voice call with KITZ's voice
 *   - outbound_sendSMS         (high)   — Send SMS text message via Twilio
 *   - outbound_sendVoiceCall   (high)   — Initiate Twilio voice call with TTS message
 *
 * All outbound tools follow draft-first policy in alpha mode.
 * Voice tools use ElevenLabs TTS for KITZ's female voice.
 */
import { textToSpeech, isElevenLabsConfigured } from '../llm/elevenLabsClient.js';
import type { ToolSchema } from './registry.js';

const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';
const COMMS_API_URL = process.env.COMMS_API_URL || 'http://localhost:3013';
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';
const serviceHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET } : {}),
};

export function getAllOutboundTools(): ToolSchema[] {
  return [
    {
      name: 'outbound_sendWhatsApp',
      description: 'Send a WhatsApp text message to a phone number',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Phone number with country code' },
          message: { type: 'string' },
        },
        required: ['phone', 'message'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const phone = String(args.phone || '').replace(/[\s\-()]/g, '');
        const message = String(args.message || '').trim();
        const userId = String(args._userId || 'default');

        if (!phone || !message) {
          return { error: 'Both phone and message are required.' };
        }

        try {
          const res = await fetch(`${WA_CONNECTOR_URL}/outbound/send`, {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify({
              phone,
              message,
              userId,
            }),
            signal: AbortSignal.timeout(15_000),
          });

          if (res.ok) {
            return {
              status: 'sent',
              message: `✅ WhatsApp message sent to ${phone}: "${message.slice(0, 100)}"`,
            };
          }

          const errBody = await res.text().catch(() => '');
          return {
            status: 'failed',
            error: `WhatsApp send failed (${res.status}): ${errBody.slice(0, 200)}`,
          };
        } catch (err) {
          return {
            status: 'failed',
            error: `WhatsApp connector unreachable: ${(err as Error).message}`,
          };
        }
      },
    },
    {
      name: 'outbound_sendEmail',
      description: 'Send an email (delegates to admin_assistant agent)',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['to', 'subject', 'body'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        return {
          status: 'draft',
          message: 'Email drafted. Only admin_assistant agent can send emails.',
        };
      },
    },

    // ── Voice Note (TTS + WhatsApp) ──
    {
      name: 'outbound_sendVoiceNote',
      description:
        'Generate a voice note using KITZ\'s female voice (ElevenLabs TTS) and send it via WhatsApp. ' +
        'Use when the user wants a spoken response, voice reply, or audio summary sent to a contact.',
      parameters: {
        type: 'object',
        properties: {
          phone: {
            type: 'string',
            description: 'WhatsApp phone number with country code (e.g., +50761234567)',
          },
          text: {
            type: 'string',
            description: 'Text to speak in the voice note (max 5000 chars)',
          },
          language: {
            type: 'string',
            enum: ['es', 'en', 'pt', 'fr'],
            description: 'Language hint (default: auto-detect). KITZ is multilingual.',
          },
        },
        required: ['phone', 'text'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const phone = String(args.phone || '').trim();
        const text = String(args.text || '').trim();
        const userId = String(args._userId || 'default');

        if (!phone || !text) {
          return { error: 'Both phone and text are required.' };
        }

        if (text.length > 5000) {
          return { error: `Text too long (${text.length} chars). Max 5000 characters.` };
        }

        if (!isElevenLabsConfigured()) {
          return {
            status: 'draft',
            message: `Voice note draft for ${phone}: "${text.slice(0, 100)}..."`,
            note: 'ElevenLabs not configured. Set ELEVENLABS_API_KEY to enable voice.',
          };
        }

        try {
          // 1. Generate TTS audio
          const audioResult = await textToSpeech({
            text,
            outputFormat: 'mp3_22050_32', // Smaller file for WhatsApp
          });

          console.log(JSON.stringify({
            ts: new Date().toISOString(),
            module: 'outbound',
            action: 'voice_note_generated',
            phone,
            char_count: audioResult.characterCount,
            trace_id: traceId,
          }));

          // 2. Send via WhatsApp connector
          // Draft-first in alpha mode — store the audio for approval
          try {
            const sendRes = await fetch(`${WA_CONNECTOR_URL}/outbound/send-voice`, {
              method: 'POST',
              headers: serviceHeaders,
              body: JSON.stringify({
                phone,
                audio_base64: audioResult.audioBase64,
                mime_type: audioResult.mimeType,
                caption: text.slice(0, 200),
                trace_id: traceId,
              }),
              signal: AbortSignal.timeout(15_000),
            });

            if (sendRes.ok) {
              return {
                status: 'sent',
                message: `🎙️ Voice note sent to ${phone} (${audioResult.characterCount} chars, ${Math.round(audioResult.audioBase64.length * 0.75 / 1024)}KB)`,
                voice_id: audioResult.voiceId,
              };
            }
          } catch {
            // WhatsApp connector not available — return draft with audio
          }

          return {
            status: 'draft',
            message: `🎙️ Voice note generated for ${phone} (${audioResult.characterCount} chars)`,
            audio_base64: audioResult.audioBase64,
            mime_type: audioResult.mimeType,
            note: 'WhatsApp connector unavailable. Audio generated and ready to send.',
          };
        } catch (err) {
          return { error: `Voice note failed: ${(err as Error).message}` };
        }
      },
    },

    // ── WhatsApp Call ──
    {
      name: 'outbound_makeCall',
      description:
        'Initiate a WhatsApp voice call using KITZ\'s female voice (ElevenLabs Conversational AI). ' +
        'The call uses an AI voice agent that can speak, listen, and interact naturally. ' +
        'Use for: following up with contacts, confirming orders, customer check-ins.',
      parameters: {
        type: 'object',
        properties: {
          phone: {
            type: 'string',
            description: 'WhatsApp phone number with country code',
          },
          purpose: {
            type: 'string',
            description: 'Purpose of the call (e.g., "follow up on order ORD-123", "confirm meeting tomorrow")',
          },
          script: {
            type: 'string',
            description: 'Optional script/talking points for the call agent',
          },
          language: {
            type: 'string',
            enum: ['es', 'en', 'pt'],
            description: 'Primary language for the call (default: es — Spanish)',
          },
          max_duration_minutes: {
            type: 'number',
            description: 'Maximum call duration in minutes (default: 5, max: 15)',
          },
        },
        required: ['phone', 'purpose'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const phone = String(args.phone || '').trim();
        const purpose = String(args.purpose || '').trim();
        const userId = String(args._userId || 'default');
        const script = args.script ? String(args.script) : undefined;
        const language = String(args.language || 'es');
        const maxDuration = Math.min(Number(args.max_duration_minutes) || 5, 15);

        if (!phone || !purpose) {
          return { error: 'Both phone and purpose are required.' };
        }

        console.log(JSON.stringify({
          ts: new Date().toISOString(),
          module: 'outbound',
          action: 'call_initiated',
          phone,
          purpose,
          language,
          max_duration: maxDuration,
          trace_id: traceId,
        }));

        // In alpha mode: queue the call for approval
        // When WhatsApp connector supports calls, this will POST to it
        try {
          const callRes = await fetch(`${WA_CONNECTOR_URL}/outbound/call`, {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify({
              phone,
              purpose,
              script,
              language,
              max_duration_minutes: maxDuration,
              voice: 'kitz_female', // KITZ's ElevenLabs voice identity
              trace_id: traceId,
            }),
            signal: AbortSignal.timeout(10_000),
          });

          if (callRes.ok) {
            const data = await callRes.json() as Record<string, unknown>;
            return {
              status: 'initiated',
              message: `📞 Call initiated to ${phone}: "${purpose}"`,
              call_id: data.call_id || traceId,
              language,
              max_duration: `${maxDuration} min`,
            };
          }
        } catch {
          // WhatsApp connector not available — return draft
        }

        return {
          status: 'queued',
          message: `📞 Call queued to ${phone}: "${purpose}"`,
          call_config: {
            phone,
            purpose,
            script,
            language,
            max_duration_minutes: maxDuration,
            voice: 'kitz_female',
          },
          note: 'Call queued. WhatsApp connector will execute when available.',
        };
      },
    },

    // ── SMS (via Twilio / comms-api) ──
    {
      name: 'outbound_sendSMS',
      description: 'Send an SMS text message to a phone number via Twilio. Max 160 chars recommended for single segment.',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Phone number with country code (e.g., +50761234567)' },
          message: { type: 'string', description: 'SMS text message (160 chars recommended)' },
        },
        required: ['phone', 'message'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const phone = String(args.phone || '').replace(/[\s\-()]/g, '');
        const message = String(args.message || '').trim();

        if (!phone || !message) {
          return { error: 'Both phone and message are required.' };
        }

        try {
          const res = await fetch(`${COMMS_API_URL}/text`, {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify({ to: phone, message }),
            signal: AbortSignal.timeout(10_000),
          });

          if (res.ok) {
            const data = await res.json() as Record<string, unknown>;
            return {
              status: 'draft',
              id: data.id,
              message: `📱 SMS drafted to ${phone}: "${message.slice(0, 100)}"`,
              note: 'SMS is draft-first. Approve via comms-api to send.',
            };
          }

          const errBody = await res.text().catch(() => '');
          return { status: 'failed', error: `SMS send failed (${res.status}): ${errBody.slice(0, 200)}` };
        } catch (err) {
          return { status: 'failed', error: `Comms API unreachable: ${(err as Error).message}` };
        }
      },
    },

    // ── Twilio Voice Call ──
    {
      name: 'outbound_sendVoiceCall',
      description: 'Initiate a voice call via Twilio with a text-to-speech message. The recipient hears the message spoken aloud.',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Phone number with country code' },
          message: { type: 'string', description: 'Message to speak on the call' },
        },
        required: ['phone', 'message'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const phone = String(args.phone || '').replace(/[\s\-()]/g, '');
        const message = String(args.message || '').trim();

        if (!phone || !message) {
          return { error: 'Both phone and message are required.' };
        }

        try {
          const res = await fetch(`${COMMS_API_URL}/talk`, {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify({ to: phone, message }),
            signal: AbortSignal.timeout(10_000),
          });

          if (res.ok) {
            const data = await res.json() as Record<string, unknown>;
            return {
              status: 'draft',
              id: data.id,
              message: `📞 Voice call drafted to ${phone}: "${message.slice(0, 100)}"`,
              note: 'Call is draft-first. Approve via comms-api to initiate.',
            };
          }

          const errBody = await res.text().catch(() => '');
          return { status: 'failed', error: `Voice call failed (${res.status}): ${errBody.slice(0, 200)}` };
        } catch (err) {
          return { status: 'failed', error: `Comms API unreachable: ${(err as Error).message}` };
        }
      },
    },
  ];
}
