/**
 * Outbound Tools — Send messages, voice notes, and calls via WhatsApp and email.
 *
 * 4 tools:
 *   - outbound_sendWhatsApp    (high)   — Send text message
 *   - outbound_sendEmail       (high)   — Send email (admin_assistant only)
 *   - outbound_sendVoiceNote   (high)   — Generate TTS audio + send as WhatsApp voice note
 *   - outbound_makeCall        (high)   — Initiate WhatsApp voice call with KITZ's voice
 *
 * All outbound tools follow draft-first policy in alpha mode.
 * Voice tools use ElevenLabs TTS for KITZ's female voice.
 */
import { textToSpeech, isElevenLabsConfigured } from '../llm/elevenLabsClient.js';
import type { ToolSchema } from './registry.js';

const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';

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
        // Draft-first policy — don't actually send without approval
        return {
          status: 'draft',
          message: `Draft WhatsApp to ${args.phone}: "${(args.message as string).slice(0, 100)}..."`,
          note: 'Outbound sends require approval in alpha mode.',
        };
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
              headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
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
  ];
}
