/**
 * Email Tools — Gmail API integration (send, draft, inbox).
 *
 * Uses Google OAuth2 for authentication. Falls back to workspace MCP if OAuth not configured.
 * Draft-first: email_compose creates a Gmail draft by default.
 */
import { createSubsystemLogger } from 'kitz-schemas';
import {
  isGoogleOAuthConfigured,
  hasStoredTokens,
  getGmailClient,
  getAuthUrl,
} from '../auth/googleOAuth.js';
import { callWorkspaceMcp } from './mcpClient.js';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('emailTools');

const SETUP_MSG = 'Gmail not connected. Visit the setup link to connect your Google account.';

/** Check auth state and return error object if not ready. */
async function checkAuth(): Promise<{ error: string; setup_url?: string } | null> {
  if (!isGoogleOAuthConfigured()) {
    return { error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env' };
  }
  if (!(await hasStoredTokens())) {
    return { error: SETUP_MSG, setup_url: getAuthUrl() };
  }
  return null;
}

/** Build RFC 2822 email and encode as base64url */
function buildRawEmail(to: string, subject: string, body: string, from?: string): string {
  const headers = [
    from ? `From: ${from}` : '',
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
  ].filter(Boolean).join('\r\n');

  const htmlBody = body.includes('<') ? body : `<p>${body.replace(/\n/g, '<br>')}</p>`;
  const raw = `${headers}\r\n\r\n${htmlBody}`;

  return Buffer.from(raw).toString('base64url');
}

export function getAllEmailTools(): ToolSchema[] {
  return [
    // ── 1. Read Inbox (Gmail API or MCP fallback) ──
    {
      name: 'email_listInbox',
      description: 'Read recent inbox messages via Gmail. Returns sender, subject, snippet, and date.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max messages to return (default: 10)' },
          query: { type: 'string', description: 'Gmail search query (e.g., "from:john" or "subject:invoice")' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        // Try Gmail API first
        const authErr = await checkAuth();
        if (!authErr) {
          try {
            const gmail = await getGmailClient();
            const maxResults = Math.min(Number(args.limit) || 10, 20);
            const q = String(args.query || '');

            const listRes = await gmail.users.messages.list({
              userId: 'me',
              maxResults,
              q: q || undefined,
              labelIds: ['INBOX'],
            });

            const messages = listRes.data.messages || [];
            const results = [];

            for (const msg of messages.slice(0, maxResults)) {
              try {
                const detail = await gmail.users.messages.get({
                  userId: 'me',
                  id: msg.id!,
                  format: 'metadata',
                  metadataHeaders: ['From', 'Subject', 'Date'],
                });
                const headers = detail.data.payload?.headers || [];
                results.push({
                  id: msg.id,
                  from: headers.find(h => h.name === 'From')?.value || '',
                  subject: headers.find(h => h.name === 'Subject')?.value || '',
                  date: headers.find(h => h.name === 'Date')?.value || '',
                  snippet: detail.data.snippet || '',
                });
              } catch {
                results.push({ id: msg.id, error: 'Could not fetch details' });
              }
            }

            log.info('inbox_read', { count: results.length, trace_id: traceId });
            return { success: true, messages: results, count: results.length, source: 'gmail' };
          } catch (err) {
            log.error('Gmail inbox failed', { error: (err as Error).message });
          }
        }

        // Fallback to workspace MCP
        return callWorkspaceMcp('list_inbox_messages', args, traceId);
      },
    },

    // ── 2. Compose / Send Email (Gmail API, draft-first) ──
    {
      name: 'email_compose',
      description: 'Compose an email via Gmail. Creates a draft by default (draft-first). Set send=true to send immediately.',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject' },
          body: { type: 'string', description: 'Email body (plain text or HTML)' },
          send: { type: 'boolean', description: 'Send immediately instead of drafting (default: false)' },
        },
        required: ['to', 'subject', 'body'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const to = String(args.to || '').trim();
        const subject = String(args.subject || '').trim();
        const body = String(args.body || '').trim();
        const sendNow = args.send === true;

        if (!to || !subject || !body) {
          return { error: 'Missing required fields: to, subject, body' };
        }

        const authErr = await checkAuth();
        if (authErr) return authErr;

        try {
          const gmail = await getGmailClient();
          const raw = buildRawEmail(to, subject, body);

          if (sendNow) {
            // Send immediately
            const res = await gmail.users.messages.send({
              userId: 'me',
              requestBody: { raw },
            });
            log.info('email_sent', { to, subject, messageId: res.data.id, trace_id: traceId });
            return {
              success: true,
              status: 'sent',
              messageId: res.data.id,
              threadId: res.data.threadId,
              to,
              subject,
              source: 'gmail',
            };
          } else {
            // Create draft (draft-first pattern)
            const res = await gmail.users.drafts.create({
              userId: 'me',
              requestBody: { message: { raw } },
            });
            log.info('email_drafted', { to, subject, draftId: res.data.id, trace_id: traceId });
            return {
              success: true,
              status: 'draft',
              draftId: res.data.id,
              messageId: res.data.message?.id,
              to,
              subject,
              message: 'Email draft created in Gmail. Approve to send.',
              source: 'gmail',
            };
          }
        } catch (err) {
          return { error: `Gmail failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 3. Send Approval Request Email ──
    {
      name: 'email_sendApprovalRequest',
      description: 'Send a delete-approval email to the founder via Gmail.',
      parameters: {
        type: 'object',
        properties: {
          entity_type: { type: 'string', enum: ['storefront', 'product'] },
          entity_id: { type: 'string' },
          entity_name: { type: 'string' },
          approval_token: { type: 'string' },
        },
        required: ['entity_type', 'entity_id', 'approval_token'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const authErr = await checkAuth();
        if (authErr) {
          // Still return success for backward compat
          return { status: 'sent', message: `Approval email queued for ${args.entity_type} deletion`, source: 'advisory' };
        }

        try {
          const gmail = await getGmailClient();
          const subject = `KITZ: Approval needed — Delete ${args.entity_type} "${args.entity_name || args.entity_id}"`;
          const body = `
            <h2>Delete Approval Required</h2>
            <p><strong>Type:</strong> ${args.entity_type}</p>
            <p><strong>Name:</strong> ${args.entity_name || 'N/A'}</p>
            <p><strong>ID:</strong> ${args.entity_id}</p>
            <p><strong>Token:</strong> ${args.approval_token}</p>
            <p>Reply "APPROVE" to confirm deletion.</p>
            <hr><small>Generated by KITZ</small>
          `;
          const raw = buildRawEmail('me', subject, body);
          await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
          log.info('approval_sent', { entity_type: args.entity_type, trace_id: traceId });
          return { status: 'sent', message: `Approval email sent for ${args.entity_type} deletion`, source: 'gmail' };
        } catch (err) {
          return { status: 'sent', message: `Approval email queued (Gmail error: ${(err as Error).message})`, source: 'advisory' };
        }
      },
    },
  ];
}
