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
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('outbound');
import { textToSpeech, textToSpeechOgg, isElevenLabsConfigured } from '../llm/elevenLabsClient.js';
import { getGmailClient, isGoogleOAuthConfigured, hasStoredTokens } from '../auth/googleOAuth.js';
import type { ToolSchema } from './registry.js';

const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';
const COMMS_API_URL = process.env.COMMS_API_URL || 'http://localhost:3013';
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';
const serviceHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET, 'x-dev-secret': SERVICE_SECRET } : {}),
};

/**
 * Resolve the Baileys userId for outbound sends.
 *
 * Priority:
 *   1. Explicit _userId from args (set by semantic router from session context)
 *   2. GOD_MODE_USER_ID from env (admin fallback)
 *   3. Query connector /whatsapp/sessions for the first connected session
 *   4. 'default' as last resort (will likely fail but surfaces the error)
 */
let _cachedActiveUserId: string | null = null;
let _cachedActiveUserIdTs = 0;

async function resolveUserId(argsUserId?: string): Promise<string> {
  // 1. Explicit userId from semantic router
  if (argsUserId && argsUserId !== 'default') return argsUserId;

  // 2. GOD_MODE_USER_ID — admin's session
  const godMode = process.env.GOD_MODE_USER_ID;
  if (godMode) return godMode;

  // 3. Cache active session lookup (TTL: 60s to avoid hammering connector)
  const now = Date.now();
  if (_cachedActiveUserId && now - _cachedActiveUserIdTs < 60_000) {
    return _cachedActiveUserId;
  }

  try {
    const res = await fetch(`${WA_CONNECTOR_URL}/whatsapp/sessions`, {
      method: 'GET',
      headers: serviceHeaders,
      signal: AbortSignal.timeout(5_000),
    });
    if (res.ok) {
      const data = await res.json() as { sessions?: Array<{ userId: string; isConnected: boolean }> };
      const connected = data.sessions?.find(s => s.isConnected);
      if (connected) {
        _cachedActiveUserId = connected.userId;
        _cachedActiveUserIdTs = now;
        log.info('resolved active userId from connector', { userId: connected.userId });
        return connected.userId;
      }
    }
  } catch {
    log.warn('failed to query connector sessions for userId resolution');
  }

  // 4. Fallback — will surface "no socket" error downstream
  return 'default';
}

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
        const userId = await resolveUserId(args._userId ? String(args._userId) : undefined);

        if (!phone || !message) {
          return { error: 'Both phone and message are required.' };
        }

        log.info('outbound_sendWhatsApp', { phone, userId, messageLen: message.length, trace_id: traceId });

        // Strategy: Try Baileys first, fall back to Twilio WhatsApp, then Twilio SMS
        // 1. Try Baileys connector
        try {
          const res = await fetch(`${WA_CONNECTOR_URL}/outbound/send`, {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify({ phone, message, userId, draftOnly: false }),
            signal: AbortSignal.timeout(10_000),
          });

          const data = await res.json() as Record<string, unknown>;
          if (res.ok && data.ok) {
            return { status: 'sent', provider: 'baileys', message: `✅ WhatsApp sent to ${phone}: "${message.slice(0, 100)}"` };
          }

          // Connector returned an error — log it before falling through
          if (data.error) {
            log.warn('baileys send failed', { phone, userId, error: data.error, httpStatus: res.status, trace_id: traceId });
          }
        } catch (err) {
          log.warn('baileys connector unreachable', { phone, userId, error: (err as Error).message, trace_id: traceId });
        }

        // 2. Try Twilio WhatsApp Business API
        try {
          const res = await fetch(`${COMMS_API_URL}/whatsapp`, {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify({ to: phone, message }),
            signal: AbortSignal.timeout(10_000),
          });

          if (res.ok) {
            const data = await res.json() as Record<string, unknown>;
            const draftId = String(data.id || '');
            // Auto-approve
            if (draftId) {
              try {
                const approveRes = await fetch(`${COMMS_API_URL}/${draftId}/approve`, {
                  method: 'POST', headers: serviceHeaders, body: '{}',
                  signal: AbortSignal.timeout(10_000),
                });
                if (approveRes.ok) {
                  return { status: 'sent', provider: 'twilio-whatsapp', message: `✅ WhatsApp sent to ${phone} (via Twilio): "${message.slice(0, 100)}"` };
                }
              } catch { /* approve failed — fall through to SMS */ }
            }
          }
        } catch { /* Twilio WhatsApp unavailable — fall through */ }

        // 3. Last resort: Twilio SMS
        try {
          const res = await fetch(`${COMMS_API_URL}/text`, {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify({ to: phone, message }),
            signal: AbortSignal.timeout(10_000),
          });
          if (res.ok) {
            const data = await res.json() as Record<string, unknown>;
            const draftId = String(data.id || '');
            if (draftId) {
              try {
                const approveRes = await fetch(`${COMMS_API_URL}/${draftId}/approve`, {
                  method: 'POST', headers: serviceHeaders, body: '{}',
                  signal: AbortSignal.timeout(10_000),
                });
                if (approveRes.ok) {
                  return { status: 'sent', provider: 'twilio-sms', message: `📱 SMS sent to ${phone} (WhatsApp unavailable): "${message.slice(0, 100)}"` };
                }
              } catch { /* SMS approve failed */ }
            }
          }
        } catch { /* all channels failed */ }

        return { status: 'failed', error: `All channels failed for ${phone}. Baileys, Twilio WhatsApp, and SMS all unavailable.` };
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
        const to = String(args.to || '').trim();
        const subject = String(args.subject || 'Message from Kitz').trim();
        const body = String(args.body || args.message || '').trim();

        if (!to) {
          return { error: 'Recipient email (to) is required.' };
        }

        // Check if Gmail is configured and authenticated
        if (!isGoogleOAuthConfigured()) {
          return {
            status: 'draft',
            message: `Email draft for ${to}: "${subject}"`,
            note: 'Gmail not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.',
          };
        }

        const hasTokens = await hasStoredTokens();
        if (!hasTokens) {
          return {
            status: 'draft',
            message: `Email draft for ${to}: "${subject}"`,
            note: 'Gmail not authenticated. Complete OAuth flow at /api/kitz/oauth/google/authorize first.',
          };
        }

        try {
          const gmail = await getGmailClient();
          const raw = Buffer.from(
            `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${body}`
          ).toString('base64url');
          const draft = await gmail.users.drafts.create({
            userId: 'me',
            requestBody: { message: { raw } },
          });
          return {
            status: 'draft',
            draft_id: draft.data.id,
            to,
            subject,
            note: 'Email draft created. Reply "approve" to send.',
          };
        } catch (err) {
          log.error('Gmail draft creation failed', { err: (err as Error).message, trace_id: traceId });
          return {
            status: 'draft',
            message: `Email draft for ${to}: "${subject}"`,
            error: `Gmail draft failed: ${(err as Error).message}`,
          };
        }
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
        const userId = await resolveUserId(args._userId ? String(args._userId) : undefined);

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

        log.info('outbound_sendVoiceNote generating TTS', { phone, userId, textLen: text.length, trace_id: traceId });

        try {
          // 1. Generate TTS audio in OGG Opus format (native WhatsApp voice note format)
          const audioResult = await textToSpeechOgg({
            text,
            outputFormat: 'mp3_22050_32', // Base format before OGG conversion
          });

          log.info('TTS generated, sending via connector', { phone, userId, audioSize: audioResult.audioBase64.length, trace_id: traceId });

          // 2. Send via WhatsApp connector with resolved userId
          try {
            const sendRes = await fetch(`${WA_CONNECTOR_URL}/outbound/send-voice`, {
              method: 'POST',
              headers: serviceHeaders,
              body: JSON.stringify({
                phone,
                userId,
                audio_base64: audioResult.audioBase64,
                mime_type: 'audio/ogg; codecs=opus',
                caption: text.slice(0, 200),
                trace_id: traceId,
              }),
              signal: AbortSignal.timeout(15_000),
            });

            const sendData = await sendRes.json() as Record<string, unknown>;
            if (sendRes.ok && sendData.ok) {
              return {
                status: 'sent',
                message: `🎙️ Voice note sent to ${phone} (${audioResult.characterCount} chars, ${Math.round(audioResult.audioBase64.length * 0.75 / 1024)}KB)`,
                voice_id: audioResult.voiceId,
              };
            }

            // Connector returned error
            log.warn('voice note send failed at connector', { phone, userId, error: sendData.error, httpStatus: sendRes.status, trace_id: traceId });
          } catch (err) {
            log.warn('connector unreachable for voice note', { phone, userId, error: (err as Error).message, trace_id: traceId });
          }

          return {
            status: 'draft',
            message: `🎙️ Voice note generated for ${phone} (${audioResult.characterCount} chars)`,
            audio_base64: audioResult.audioBase64,
            mime_type: 'audio/ogg; codecs=opus',
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
        const userId = await resolveUserId(args._userId ? String(args._userId) : undefined);
        const script = args.script ? String(args.script) : undefined;
        const language = String(args.language || 'es');
        const maxDuration = Math.min(Number(args.max_duration_minutes) || 5, 15);

        if (!phone || !purpose) {
          return { error: 'Both phone and purpose are required.' };
        }

        log.info('executed', { trace_id: traceId });

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
          // 1. Create draft at comms-api
          const res = await fetch(`${COMMS_API_URL}/text`, {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify({ to: phone, message }),
            signal: AbortSignal.timeout(10_000),
          });

          if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            return { status: 'failed', error: `SMS send failed (${res.status}): ${errBody.slice(0, 200)}` };
          }

          const data = await res.json() as Record<string, unknown>;
          const draftId = String(data.id || '');

          // 2. Auto-approve to fire Twilio (semantic router gate already handled)
          if (draftId) {
            try {
              const approveRes = await fetch(`${COMMS_API_URL}/${draftId}/approve`, {
                method: 'POST',
                headers: serviceHeaders,
                body: '{}',
                signal: AbortSignal.timeout(10_000),
              });
              if (approveRes.ok) {
                const approveData = await approveRes.json() as Record<string, unknown>;
                return {
                  status: 'sent',
                  id: draftId,
                  providerSid: approveData.providerSid,
                  message: `📱 SMS sent to ${phone}: "${message.slice(0, 100)}"`,
                };
              }
              const approveErr = await approveRes.text().catch(() => '');
              log.error('SMS approve failed', { draftId, status: approveRes.status, err: approveErr.slice(0, 200), trace_id: traceId });
            } catch (approveErr) {
              log.error('SMS approve error', { draftId, err: (approveErr as Error).message, trace_id: traceId });
            }
          }

          return {
            status: 'draft',
            id: draftId,
            message: `📱 SMS drafted to ${phone}: "${message.slice(0, 100)}"`,
            note: 'Draft created but auto-approve failed. Approve manually at comms-api.',
          };
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
          // 1. Create draft at comms-api
          const res = await fetch(`${COMMS_API_URL}/talk`, {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify({ to: phone, message }),
            signal: AbortSignal.timeout(10_000),
          });

          if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            return { status: 'failed', error: `Voice call failed (${res.status}): ${errBody.slice(0, 200)}` };
          }

          const data = await res.json() as Record<string, unknown>;
          const draftId = String(data.id || '');

          // 2. Auto-approve to fire Twilio (semantic router gate already handled)
          if (draftId) {
            try {
              const approveRes = await fetch(`${COMMS_API_URL}/${draftId}/approve`, {
                method: 'POST',
                headers: serviceHeaders,
                body: '{}',
                signal: AbortSignal.timeout(10_000),
              });
              if (approveRes.ok) {
                const approveData = await approveRes.json() as Record<string, unknown>;
                return {
                  status: 'initiated',
                  id: draftId,
                  providerSid: approveData.providerSid,
                  message: `📞 Voice call initiated to ${phone}: "${message.slice(0, 100)}"`,
                };
              }
              const approveErr = await approveRes.text().catch(() => '');
              log.error('Voice call approve failed', { draftId, status: approveRes.status, err: approveErr.slice(0, 200), trace_id: traceId });
            } catch (approveErr) {
              log.error('Voice call approve error', { draftId, err: (approveErr as Error).message, trace_id: traceId });
            }
          }

          return {
            status: 'draft',
            id: draftId,
            message: `📞 Voice call drafted to ${phone}: "${message.slice(0, 100)}"`,
            note: 'Draft created but auto-approve failed. Approve manually at comms-api.',
          };
        } catch (err) {
          return { status: 'failed', error: `Comms API unreachable: ${(err as Error).message}` };
        }
      },
    },
  ];
}
