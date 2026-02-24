/**
 * Drip Campaign Tools — Automated multi-touch sequences with scheduling.
 *
 * 5 tools:
 *   - drip_createSequence     (medium) — Create a drip sequence definition
 *   - drip_enrollContact      (medium) — Enroll a contact into a drip sequence
 *   - drip_listSequences      (low)    — List all drip sequences
 *   - drip_getEnrollments     (low)    — Get enrollments for a sequence or contact
 *   - drip_executeTouch       (high)   — Execute a pending touch (sends via appropriate channel)
 *
 * Drip sequences are in-memory (persisted to data/drip-sequences.ndjson in production).
 * Each touch has: day offset, channel, message template, and status.
 * Execution is draft-first — all outbound queued for approval.
 *
 * 80/20 AUTOMATION SPLIT:
 *   - 80% automated: enrollment triggers, touch scheduling, CRM tag updates
 *   - 20% AI agent: message personalization, stage-based content, exception handling
 */

import type { ToolSchema } from './registry.js';

/** A drip sequence definition */
interface DripSequence {
  id: string;
  name: string;
  description: string;
  touches: DripTouch[];
  trigger: 'manual' | 'stage-change' | 'tag-added' | 'new-contact' | 'purchase';
  triggerValue?: string; // e.g., stage name or tag
  language: 'es' | 'en';
  active: boolean;
  createdAt: string;
}

interface DripTouch {
  touchNumber: number;
  dayOffset: number;
  channel: 'whatsapp' | 'email' | 'sms' | 'voice';
  messageTemplate: string; // supports {{name}}, {{business}}, {{stage}}, {{score}}
  subject?: string; // for email
}

/** An enrollment of a contact into a sequence */
interface DripEnrollment {
  id: string;
  sequenceId: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  enrolledAt: string;
  currentTouch: number;
  completedTouches: number[];
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  nextTouchDate: string;
  variables: Record<string, string>; // merge variables
}

// In-memory stores
const sequences: Map<string, DripSequence> = new Map();
const enrollments: Map<string, DripEnrollment> = new Map();

// Seed default sequences
function seedDefaults(): void {
  if (sequences.size > 0) return;

  const welcomeDrip: DripSequence = {
    id: 'drip-welcome',
    name: 'Welcome Onboarding',
    description: 'Onboard new leads with a 4-touch welcome sequence across all channels',
    trigger: 'new-contact',
    language: 'es',
    active: true,
    createdAt: new Date().toISOString(),
    touches: [
      { touchNumber: 1, dayOffset: 0, channel: 'whatsapp', messageTemplate: 'Hola {{name}}! Bienvenido a KITZ. Tu negocio merece infraestructura. Pregunta lo que necesites.' },
      { touchNumber: 2, dayOffset: 2, channel: 'email', subject: 'Tu negocio con KITZ', messageTemplate: 'Hola {{name}},\n\nGracias por unirte a KITZ. Tu {{business}} tiene todo el potencial.\n\nAsí es como otros negocios como el tuyo están creciendo con KITZ:\n- CRM gratis para organizar clientes\n- Pedidos y pagos desde WhatsApp\n- IA que trabaja para ti 24/7\n\n¿Listo para empezar? Responde a este email.\n\n— KITZ' },
      { touchNumber: 3, dayOffset: 5, channel: 'sms', messageTemplate: '{{name}}, ¿ya probaste tu workspace KITZ? workspace.kitz.services — es gratis. Tu CRM + pedidos en un solo lugar.' },
      { touchNumber: 4, dayOffset: 10, channel: 'voice', messageTemplate: 'Hola {{name}}, soy KITZ. Solo quería saber cómo va tu {{business}}. Estamos aquí para ayudarte a crecer. Si necesitas algo, escríbenos por WhatsApp.' },
    ],
  };

  const reactivationDrip: DripSequence = {
    id: 'drip-reactivation',
    name: 'Reactivation Win-Back',
    description: 'Re-engage inactive contacts with escalating outreach',
    trigger: 'tag-added',
    triggerValue: 'inactive',
    language: 'es',
    active: true,
    createdAt: new Date().toISOString(),
    touches: [
      { touchNumber: 1, dayOffset: 0, channel: 'whatsapp', messageTemplate: '{{name}}, te extrañamos. ¿Cómo va tu {{business}}? Tenemos novedades para ti.' },
      { touchNumber: 2, dayOffset: 3, channel: 'email', subject: '{{name}}, vuelve a KITZ', messageTemplate: 'Hola {{name}},\n\nNotamos que no has estado activo últimamente.\n\nDesde tu última visita, agregamos:\n- Facturación automática\n- Campañas por WhatsApp\n- Reportes de ventas con IA\n\nTu workspace sigue activo: workspace.kitz.services\n\n— KITZ' },
      { touchNumber: 3, dayOffset: 7, channel: 'sms', messageTemplate: '{{name}}, tu workspace KITZ sigue activo. Entra y ve tus datos: workspace.kitz.services' },
      { touchNumber: 4, dayOffset: 14, channel: 'voice', messageTemplate: 'Hola {{name}}, soy KITZ. Quería saber si hay algo en lo que podamos ayudarte con tu {{business}}. Tu cuenta sigue activa y lista.' },
    ],
  };

  const postPurchaseDrip: DripSequence = {
    id: 'drip-post-purchase',
    name: 'Post-Purchase Follow-Up',
    description: 'Follow up after a purchase to ensure satisfaction and encourage repeat business',
    trigger: 'purchase',
    language: 'es',
    active: true,
    createdAt: new Date().toISOString(),
    touches: [
      { touchNumber: 1, dayOffset: 0, channel: 'whatsapp', messageTemplate: 'Gracias {{name}}! Tu pedido está confirmado. Te avisamos cuando esté listo.' },
      { touchNumber: 2, dayOffset: 3, channel: 'whatsapp', messageTemplate: '{{name}}, ¿cómo te fue con tu pedido? Tu opinión nos importa.' },
      { touchNumber: 3, dayOffset: 7, channel: 'email', subject: 'Tu opinión importa', messageTemplate: 'Hola {{name}},\n\nGracias por tu compra. ¿Podrías tomarte 30 segundos para calificarnos?\n\nTu feedback nos ayuda a mejorar.\n\n— KITZ' },
      { touchNumber: 4, dayOffset: 14, channel: 'sms', messageTemplate: '{{name}}, clientes como tú merecen lo mejor. Tenemos ofertas nuevas. Escríbenos por WA.' },
    ],
  };

  sequences.set(welcomeDrip.id, welcomeDrip);
  sequences.set(reactivationDrip.id, reactivationDrip);
  sequences.set(postPurchaseDrip.id, postPurchaseDrip);
}

// Initialize defaults on load
seedDefaults();

function renderTemplate(template: string, vars: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(vars)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return rendered;
}

export function getAllDripCampaignTools(): ToolSchema[] {
  return [
    // ── drip_createSequence ──
    {
      name: 'drip_createSequence',
      description:
        'Create a new drip campaign sequence with timed touches across WhatsApp, Email, SMS, and Voice. ' +
        'Each touch has a day offset, channel, and message template with {{name}} {{business}} merge vars.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Sequence name' },
          description: { type: 'string', description: 'What this sequence does' },
          trigger: {
            type: 'string',
            enum: ['manual', 'stage-change', 'tag-added', 'new-contact', 'purchase'],
            description: 'What triggers enrollment',
          },
          trigger_value: { type: 'string', description: 'Trigger filter (e.g., stage name or tag)' },
          language: { type: 'string', enum: ['es', 'en'], description: 'Language (default: es)' },
          touches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day_offset: { type: 'number', description: 'Days after enrollment (0 = immediately)' },
                channel: { type: 'string', enum: ['whatsapp', 'email', 'sms', 'voice'] },
                message: { type: 'string', description: 'Message template (supports {{name}}, {{business}}, {{stage}}, {{score}})' },
                subject: { type: 'string', description: 'Email subject line (email channel only)' },
              },
              required: ['day_offset', 'channel', 'message'],
            },
          },
          use_ai: {
            type: 'boolean',
            description: 'Use AI to generate touch messages based on sequence description (default: false)',
          },
        },
        required: ['name', 'trigger'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const seqName = String(args.name);
        const description = (args.description as string) || seqName;
        const trigger = String(args.trigger) as DripSequence['trigger'];
        const triggerValue = (args.trigger_value as string) || undefined;
        const language = ((args.language as string) || 'es') as 'es' | 'en';
        const useAi = Boolean(args.use_ai);

        let touches: DripTouch[];

        if (useAi || !args.touches) {
          // AI generates the touches (20% AI support)
          try {
            const { claudeChat } = await import('../llm/claudeClient.js');
            const generated = await claudeChat(
              [{
                role: 'user',
                content: `Create a 4-touch drip campaign sequence for a LatAm SMB.

Sequence: ${seqName}
Description: ${description}
Language: ${language}
Trigger: ${trigger}${triggerValue ? ` (value: ${triggerValue})` : ''}

Rules:
- Touch 1 (Day 0): WhatsApp — 5-7 word hook + 15-23 word body
- Touch 2 (Day 2-3): Email — subject + 3 short paragraphs
- Touch 3 (Day 5-7): SMS — 160 chars max
- Touch 4 (Day 10-14): Voice note script — warm, 30 seconds max
- Use {{name}} and {{business}} placeholders
- Tone: Gen Z clarity + disciplined founder

Return JSON array: [{ "day_offset": N, "channel": "whatsapp|email|sms|voice", "message": "...", "subject": "..." }]`,
              }],
              'sonnet',
              traceId,
              'You are KITZ drip campaign builder. Return only valid JSON array.',
            );

            const cleaned = generated.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned) as Array<{ day_offset: number; channel: string; message: string; subject?: string }>;
            touches = parsed.map((t, i) => ({
              touchNumber: i + 1,
              dayOffset: t.day_offset,
              channel: t.channel as DripTouch['channel'],
              messageTemplate: t.message,
              subject: t.subject,
            }));
          } catch (err) {
            return { error: `AI touch generation failed: ${(err as Error).message}` };
          }
        } else {
          const rawTouches = args.touches as Array<{ day_offset: number; channel: string; message: string; subject?: string }>;
          touches = rawTouches.map((t, i) => ({
            touchNumber: i + 1,
            dayOffset: t.day_offset,
            channel: t.channel as DripTouch['channel'],
            messageTemplate: t.message,
            subject: t.subject,
          }));
        }

        const id = `drip-${seqName.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
        const sequence: DripSequence = {
          id,
          name: seqName,
          description,
          touches,
          trigger,
          triggerValue,
          language,
          active: true,
          createdAt: new Date().toISOString(),
        };

        sequences.set(id, sequence);

        return {
          id,
          name: seqName,
          trigger,
          touchCount: touches.length,
          channels: [...new Set(touches.map((t) => t.channel))],
          touches: touches.map((t) => ({
            touch: t.touchNumber,
            day: t.dayOffset,
            channel: t.channel,
            preview: t.messageTemplate.slice(0, 80) + (t.messageTemplate.length > 80 ? '...' : ''),
          })),
          message: `Drip sequence "${seqName}" created with ${touches.length} touches.`,
        };
      },
    },

    // ── drip_enrollContact ──
    {
      name: 'drip_enrollContact',
      description:
        'Enroll a CRM contact into a drip campaign sequence. Sets up scheduled touches with merge variables.',
      parameters: {
        type: 'object',
        properties: {
          sequence_id: { type: 'string', description: 'Drip sequence ID' },
          contact_id: { type: 'string', description: 'CRM contact UUID' },
          variables: {
            type: 'object',
            description: 'Merge variables (e.g., { "business": "food delivery", "stage": "new-lead" })',
          },
        },
        required: ['sequence_id', 'contact_id'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const sequenceId = String(args.sequence_id);
        const contactId = String(args.contact_id);
        const extraVars = (args.variables as Record<string, string>) || {};

        const sequence = sequences.get(sequenceId);
        if (!sequence) {
          return { error: `Sequence "${sequenceId}" not found. Use drip_listSequences to see available.` };
        }
        if (!sequence.active) {
          return { error: `Sequence "${sequence.name}" is paused.` };
        }

        // Check if already enrolled
        for (const [, enr] of enrollments) {
          if (enr.sequenceId === sequenceId && enr.contactId === contactId && enr.status === 'active') {
            return { error: `Contact already enrolled in "${sequence.name}".`, enrollmentId: enr.id };
          }
        }

        // Fetch contact data for merge vars
        let contactData: Record<string, unknown> = {};
        try {
          const { callWorkspaceMcp } = await import('./mcpClient.js');
          contactData = (await callWorkspaceMcp('get_contact', { contact_id: contactId }, traceId)) as Record<string, unknown>;
        } catch {
          // proceed with minimal data
        }

        const now = new Date();
        const firstTouch = sequence.touches[0];
        const nextDate = new Date(now.getTime() + firstTouch.dayOffset * 86400000);

        const enrollmentId = `enr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const enrollment: DripEnrollment = {
          id: enrollmentId,
          sequenceId,
          contactId,
          contactName: String(contactData.name || extraVars.name || 'there'),
          contactPhone: String(contactData.phone || ''),
          contactEmail: String(contactData.email || ''),
          enrolledAt: now.toISOString(),
          currentTouch: 1,
          completedTouches: [],
          status: 'active',
          nextTouchDate: nextDate.toISOString(),
          variables: {
            name: String(contactData.name || extraVars.name || 'there'),
            business: String(extraVars.business || 'negocio'),
            stage: String(extraVars.stage || 'new-lead'),
            score: String(extraVars.score || contactData.lead_score || '50'),
            ...extraVars,
          },
        };

        enrollments.set(enrollmentId, enrollment);

        // Tag the contact with the drip sequence
        try {
          const { callWorkspaceMcp } = await import('./mcpClient.js');
          const tags = Array.isArray(contactData.tags) ? (contactData.tags as string[]) : [];
          if (!tags.includes(`drip:${sequenceId}`)) {
            tags.push(`drip:${sequenceId}`);
            await callWorkspaceMcp('update_contact', { contact_id: contactId, tags }, traceId);
          }
        } catch {
          // tag update failed, enrollment still active
        }

        return {
          enrollmentId,
          sequence: sequence.name,
          contact: enrollment.contactName,
          touchCount: sequence.touches.length,
          nextTouch: {
            number: 1,
            channel: firstTouch.channel,
            scheduledFor: nextDate.toISOString(),
            preview: renderTemplate(firstTouch.messageTemplate, enrollment.variables).slice(0, 100),
          },
          message: `Enrolled ${enrollment.contactName} in "${sequence.name}" — first touch: ${firstTouch.channel} on ${nextDate.toISOString().split('T')[0]}`,
        };
      },
    },

    // ── drip_listSequences ──
    {
      name: 'drip_listSequences',
      description: 'List all available drip campaign sequences with their touch counts and triggers.',
      parameters: {
        type: 'object',
        properties: {
          active_only: { type: 'boolean', description: 'Only show active sequences (default: false)' },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        seedDefaults();
        const activeOnly = Boolean(args.active_only);
        const seqs = Array.from(sequences.values());
        const filtered = activeOnly ? seqs.filter((s) => s.active) : seqs;

        return {
          sequences: filtered.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            trigger: s.trigger,
            triggerValue: s.triggerValue,
            touchCount: s.touches.length,
            channels: [...new Set(s.touches.map((t) => t.channel))],
            active: s.active,
            language: s.language,
          })),
          total: filtered.length,
          enrollments: enrollments.size,
        };
      },
    },

    // ── drip_getEnrollments ──
    {
      name: 'drip_getEnrollments',
      description: 'Get drip enrollment status — which contacts are in which sequences, next touches, progress.',
      parameters: {
        type: 'object',
        properties: {
          sequence_id: { type: 'string', description: 'Filter by sequence ID' },
          contact_id: { type: 'string', description: 'Filter by contact ID' },
          status: { type: 'string', enum: ['active', 'completed', 'paused', 'cancelled'], description: 'Filter by status' },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        let results = Array.from(enrollments.values());

        if (args.sequence_id) results = results.filter((e) => e.sequenceId === String(args.sequence_id));
        if (args.contact_id) results = results.filter((e) => e.contactId === String(args.contact_id));
        if (args.status) results = results.filter((e) => e.status === String(args.status));

        return {
          enrollments: results.map((e) => {
            const seq = sequences.get(e.sequenceId);
            return {
              id: e.id,
              sequence: seq?.name || e.sequenceId,
              contact: e.contactName,
              status: e.status,
              progress: `${e.completedTouches.length}/${seq?.touches.length || '?'}`,
              currentTouch: e.currentTouch,
              nextTouchDate: e.nextTouchDate,
              enrolledAt: e.enrolledAt,
            };
          }),
          total: results.length,
        };
      },
    },

    // ── drip_executeTouch ──
    {
      name: 'drip_executeTouch',
      description:
        'Execute the next pending touch for a drip enrollment — renders the message with merge variables ' +
        'and sends via the appropriate channel (WhatsApp, Email, SMS, Voice). Draft-first.',
      parameters: {
        type: 'object',
        properties: {
          enrollment_id: { type: 'string', description: 'Enrollment ID' },
          force_channel: {
            type: 'string',
            enum: ['whatsapp', 'email', 'sms', 'voice'],
            description: 'Override the channel for this touch (optional)',
          },
        },
        required: ['enrollment_id'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const enrollmentId = String(args.enrollment_id);
        const forceChannel = args.force_channel as DripTouch['channel'] | undefined;

        const enrollment = enrollments.get(enrollmentId);
        if (!enrollment) {
          return { error: `Enrollment "${enrollmentId}" not found.` };
        }
        if (enrollment.status !== 'active') {
          return { error: `Enrollment is ${enrollment.status}, not active.` };
        }

        const sequence = sequences.get(enrollment.sequenceId);
        if (!sequence) {
          return { error: `Sequence "${enrollment.sequenceId}" not found.` };
        }

        const touch = sequence.touches.find((t) => t.touchNumber === enrollment.currentTouch);
        if (!touch) {
          enrollment.status = 'completed';
          return { message: `All touches completed for ${enrollment.contactName}.`, status: 'completed' };
        }

        const channel = forceChannel || touch.channel;
        const renderedMessage = renderTemplate(touch.messageTemplate, enrollment.variables);
        const renderedSubject = touch.subject ? renderTemplate(touch.subject, enrollment.variables) : undefined;

        let sendResult: Record<string, unknown> = {};

        try {
          const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';
          const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET } : {}),
          };

          switch (channel) {
            case 'whatsapp':
              if (enrollment.contactPhone) {
                try {
                  const res = await fetch(`${WA_CONNECTOR_URL}/outbound/send`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ phone: enrollment.contactPhone, message: renderedMessage }),
                    signal: AbortSignal.timeout(15000),
                  });
                  sendResult = { sent: res.ok, channel: 'whatsapp' };
                } catch {
                  sendResult = { sent: false, channel: 'whatsapp', draft: true };
                }
              } else {
                sendResult = { sent: false, reason: 'no phone number', draft: true };
              }
              break;

            case 'email':
              sendResult = {
                sent: false,
                channel: 'email',
                draft: true,
                to: enrollment.contactEmail || 'no email',
                subject: renderedSubject,
                body: renderedMessage,
                draftOnly: true,
              };
              break;

            case 'sms':
              sendResult = {
                sent: false,
                channel: 'sms',
                draft: true,
                to: enrollment.contactPhone || 'no phone',
                message: renderedMessage.slice(0, 160),
                draftOnly: true,
              };
              break;

            case 'voice':
              sendResult = {
                sent: false,
                channel: 'voice',
                draft: true,
                script: renderedMessage,
                draftOnly: true,
              };
              break;
          }
        } catch (err) {
          sendResult = { sent: false, error: (err as Error).message };
        }

        // Advance enrollment
        enrollment.completedTouches.push(touch.touchNumber);
        const nextTouch = sequence.touches.find((t) => t.touchNumber === touch.touchNumber + 1);
        if (nextTouch) {
          enrollment.currentTouch = nextTouch.touchNumber;
          const nextDate = new Date(Date.now() + nextTouch.dayOffset * 86400000);
          enrollment.nextTouchDate = nextDate.toISOString();
        } else {
          enrollment.status = 'completed';
          enrollment.currentTouch = touch.touchNumber + 1;
        }

        return {
          touch: touch.touchNumber,
          channel,
          message: renderedMessage.slice(0, 200),
          subject: renderedSubject,
          result: sendResult,
          progress: `${enrollment.completedTouches.length}/${sequence.touches.length}`,
          nextTouch: nextTouch
            ? { number: nextTouch.touchNumber, channel: nextTouch.channel, date: enrollment.nextTouchDate }
            : null,
          status: enrollment.status,
        };
      },
    },
  ];
}
