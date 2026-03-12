/**
 * Resend Email Tools — Resend API integration for transactional + marketing email.
 *
 * Tools:
 *   1. resend_send_email     — Send a transactional email
 *   2. resend_send_batch     — Send batch emails
 *   3. resend_get_email      — Get email delivery status
 *   4. resend_list_domains   — List verified sending domains
 *   5. resend_create_contact — Add contact to audience
 *   6. resend_list_contacts  — List contacts in audience
 *   7. resend_list_audiences — List all audiences
 *
 * Requires: RESEND_API_KEY
 */
import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('resendEmailTools');

const RESEND_API = 'https://api.resend.com';

function getApiKey(): string {
  return process.env.RESEND_API_KEY || '';
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export function getAllResendEmailTools(): ToolSchema[] {
  return [
    // ── 1. Send Transactional Email ──
    {
      name: 'resend_send_email',
      description: 'Send a transactional email via Resend. Supports HTML body, plain text fallback, cc, bcc, reply-to, and tags.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Sender email address (e.g., "Kitz <hello@kitz.services>")' },
          to: {
            oneOf: [
              { type: 'string', description: 'Recipient email address' },
              { type: 'array', items: { type: 'string' }, description: 'Array of recipient email addresses' },
            ],
            description: 'Recipient email(s)',
          },
          subject: { type: 'string', description: 'Email subject line' },
          html: { type: 'string', description: 'HTML email body' },
          text: { type: 'string', description: 'Plain text fallback (optional)' },
          replyTo: { type: 'string', description: 'Reply-to email address (optional)' },
          cc: {
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
            ],
            description: 'CC recipients (optional)',
          },
          bcc: {
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
            ],
            description: 'BCC recipients (optional)',
          },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                value: { type: 'string' },
              },
              required: ['name', 'value'],
            },
            description: 'Email tags for tracking (optional)',
          },
        },
        required: ['from', 'to', 'subject', 'html'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) {
          return { error: 'Resend not configured.', fix: 'Set RESEND_API_KEY in env.' };
        }
        try {
          const payload: Record<string, unknown> = {
            from: String(args.from),
            to: Array.isArray(args.to) ? args.to.map(String) : [String(args.to)],
            subject: String(args.subject),
            html: String(args.html),
          };
          if (args.text) payload.text = String(args.text);
          if (args.replyTo) payload.reply_to = String(args.replyTo);
          if (args.cc) payload.cc = Array.isArray(args.cc) ? args.cc.map(String) : [String(args.cc)];
          if (args.bcc) payload.bcc = Array.isArray(args.bcc) ? args.bcc.map(String) : [String(args.bcc)];
          if (args.tags) payload.tags = args.tags;

          const res = await fetch(`${RESEND_API}/emails`, {
            method: 'POST',
            headers: authHeaders(apiKey),
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Resend send failed (${res.status}): ${errText.slice(0, 200)}` };
          }

          const data = await res.json() as { id: string };
          log.info('resend_email_sent', { emailId: data.id, trace_id: traceId });
          return {
            success: true,
            id: data.id,
            from: payload.from,
            to: payload.to,
            subject: payload.subject,
            source: 'resend',
          };
        } catch (err) {
          return { error: `Resend send failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 2. Send Batch Emails ──
    {
      name: 'resend_send_batch',
      description: 'Send batch emails via Resend. Each email in the array can have its own from, to, subject, html, text, replyTo, cc, bcc, and tags.',
      parameters: {
        type: 'object',
        properties: {
          emails: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                from: { type: 'string', description: 'Sender email address' },
                to: {
                  oneOf: [
                    { type: 'string' },
                    { type: 'array', items: { type: 'string' } },
                  ],
                  description: 'Recipient email(s)',
                },
                subject: { type: 'string', description: 'Email subject line' },
                html: { type: 'string', description: 'HTML email body' },
                text: { type: 'string', description: 'Plain text fallback (optional)' },
                replyTo: { type: 'string', description: 'Reply-to email (optional)' },
                cc: {
                  oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
                  description: 'CC recipients (optional)',
                },
                bcc: {
                  oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
                  description: 'BCC recipients (optional)',
                },
                tags: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { name: { type: 'string' }, value: { type: 'string' } },
                    required: ['name', 'value'],
                  },
                  description: 'Email tags (optional)',
                },
              },
              required: ['from', 'to', 'subject', 'html'],
            },
            description: 'Array of email objects to send',
          },
        },
        required: ['emails'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) {
          return { error: 'Resend not configured.', fix: 'Set RESEND_API_KEY in env.' };
        }
        try {
          const emails = (args.emails as Record<string, unknown>[]).map((e) => {
            const email: Record<string, unknown> = {
              from: String(e.from),
              to: Array.isArray(e.to) ? e.to.map(String) : [String(e.to)],
              subject: String(e.subject),
              html: String(e.html),
            };
            if (e.text) email.text = String(e.text);
            if (e.replyTo) email.reply_to = String(e.replyTo);
            if (e.cc) email.cc = Array.isArray(e.cc) ? e.cc.map(String) : [String(e.cc)];
            if (e.bcc) email.bcc = Array.isArray(e.bcc) ? e.bcc.map(String) : [String(e.bcc)];
            if (e.tags) email.tags = e.tags;
            return email;
          });

          const res = await fetch(`${RESEND_API}/emails/batch`, {
            method: 'POST',
            headers: authHeaders(apiKey),
            body: JSON.stringify(emails),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Resend batch failed (${res.status}): ${errText.slice(0, 200)}` };
          }

          const data = await res.json() as { data: { id: string }[] };
          log.info('resend_batch_sent', { count: emails.length, trace_id: traceId });
          return { success: true, data: data.data, count: emails.length, source: 'resend' };
        } catch (err) {
          return { error: `Resend batch failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 3. Get Email Delivery Status ──
    {
      name: 'resend_get_email',
      description: 'Get email delivery status from Resend. Returns status, timestamps, and last event.',
      parameters: {
        type: 'object',
        properties: {
          emailId: { type: 'string', description: 'Email ID returned from resend_send_email' },
        },
        required: ['emailId'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) {
          return { error: 'Resend not configured.', fix: 'Set RESEND_API_KEY in env.' };
        }
        try {
          const emailId = String(args.emailId);
          const res = await fetch(`${RESEND_API}/emails/${emailId}`, {
            method: 'GET',
            headers: authHeaders(apiKey),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Resend get email failed (${res.status}): ${errText.slice(0, 200)}` };
          }

          const data = await res.json() as {
            id: string;
            from: string;
            to: string[];
            subject: string;
            created_at: string;
            last_event: string;
          };
          log.info('resend_email_status', { emailId: data.id, status: data.last_event, trace_id: traceId });
          return {
            success: true,
            id: data.id,
            from: data.from,
            to: data.to,
            subject: data.subject,
            status: data.last_event,
            createdAt: data.created_at,
            lastEvent: data.last_event,
            source: 'resend',
          };
        } catch (err) {
          return { error: `Resend get email failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 4. List Verified Sending Domains ──
    {
      name: 'resend_list_domains',
      description: 'List all verified sending domains in your Resend account.',
      parameters: {
        type: 'object',
        properties: {},
      },
      riskLevel: 'low',
      execute: async (_args, traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) {
          return { error: 'Resend not configured.', fix: 'Set RESEND_API_KEY in env.' };
        }
        try {
          const res = await fetch(`${RESEND_API}/domains`, {
            method: 'GET',
            headers: authHeaders(apiKey),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Resend list domains failed (${res.status}): ${errText.slice(0, 200)}` };
          }

          const data = await res.json() as {
            data: { id: string; name: string; status: string; region: string }[];
          };
          log.info('resend_domains_listed', { count: data.data.length, trace_id: traceId });
          return {
            success: true,
            domains: data.data.map((d) => ({
              id: d.id,
              name: d.name,
              status: d.status,
              region: d.region,
            })),
            source: 'resend',
          };
        } catch (err) {
          return { error: `Resend list domains failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 5. Create Contact in Audience ──
    {
      name: 'resend_create_contact',
      description: 'Add a contact to a Resend audience for email marketing.',
      parameters: {
        type: 'object',
        properties: {
          audienceId: { type: 'string', description: 'Audience ID to add the contact to' },
          email: { type: 'string', description: 'Contact email address' },
          firstName: { type: 'string', description: 'Contact first name (optional)' },
          lastName: { type: 'string', description: 'Contact last name (optional)' },
          unsubscribed: { type: 'boolean', description: 'Whether the contact is unsubscribed (optional, default: false)' },
        },
        required: ['audienceId', 'email'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) {
          return { error: 'Resend not configured.', fix: 'Set RESEND_API_KEY in env.' };
        }
        try {
          const audienceId = String(args.audienceId);
          const payload: Record<string, unknown> = {
            email: String(args.email),
          };
          if (args.firstName) payload.first_name = String(args.firstName);
          if (args.lastName) payload.last_name = String(args.lastName);
          if (args.unsubscribed !== undefined) payload.unsubscribed = Boolean(args.unsubscribed);

          const res = await fetch(`${RESEND_API}/audiences/${audienceId}/contacts`, {
            method: 'POST',
            headers: authHeaders(apiKey),
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Resend create contact failed (${res.status}): ${errText.slice(0, 200)}` };
          }

          const data = await res.json() as { id: string; email: string };
          log.info('resend_contact_created', { contactId: data.id, audienceId, trace_id: traceId });
          return {
            success: true,
            id: data.id,
            email: data.email,
            audienceId,
            source: 'resend',
          };
        } catch (err) {
          return { error: `Resend create contact failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 6. List Contacts in Audience ──
    {
      name: 'resend_list_contacts',
      description: 'List all contacts in a Resend audience.',
      parameters: {
        type: 'object',
        properties: {
          audienceId: { type: 'string', description: 'Audience ID to list contacts from' },
        },
        required: ['audienceId'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) {
          return { error: 'Resend not configured.', fix: 'Set RESEND_API_KEY in env.' };
        }
        try {
          const audienceId = String(args.audienceId);
          const res = await fetch(`${RESEND_API}/audiences/${audienceId}/contacts`, {
            method: 'GET',
            headers: authHeaders(apiKey),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Resend list contacts failed (${res.status}): ${errText.slice(0, 200)}` };
          }

          const data = await res.json() as {
            data: { id: string; email: string; first_name: string; last_name: string; created_at: string }[];
          };
          log.info('resend_contacts_listed', { audienceId, count: data.data.length, trace_id: traceId });
          return {
            success: true,
            contacts: data.data.map((c) => ({
              id: c.id,
              email: c.email,
              firstName: c.first_name,
              lastName: c.last_name,
              createdAt: c.created_at,
            })),
            audienceId,
            source: 'resend',
          };
        } catch (err) {
          return { error: `Resend list contacts failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 7. List All Audiences ──
    {
      name: 'resend_list_audiences',
      description: 'List all audiences (mailing lists) in your Resend account.',
      parameters: {
        type: 'object',
        properties: {},
      },
      riskLevel: 'low',
      execute: async (_args, traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) {
          return { error: 'Resend not configured.', fix: 'Set RESEND_API_KEY in env.' };
        }
        try {
          const res = await fetch(`${RESEND_API}/audiences`, {
            method: 'GET',
            headers: authHeaders(apiKey),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Resend list audiences failed (${res.status}): ${errText.slice(0, 200)}` };
          }

          const data = await res.json() as {
            data: { id: string; name: string; created_at: string }[];
          };
          log.info('resend_audiences_listed', { count: data.data.length, trace_id: traceId });
          return {
            success: true,
            audiences: data.data.map((a) => ({
              id: a.id,
              name: a.name,
              createdAt: a.created_at,
            })),
            source: 'resend',
          };
        } catch (err) {
          return { error: `Resend list audiences failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
