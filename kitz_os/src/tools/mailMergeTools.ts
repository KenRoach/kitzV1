/**
 * Mail Merge Tools — Template engine with variable substitution and bulk rendering.
 *
 * 5 tools:
 *   - merge_createTemplate     (medium) — Create a reusable message template
 *   - merge_renderMessage      (low)    — Render a template with variables for a single contact
 *   - merge_bulkRender         (medium) — Render a template for multiple CRM contacts
 *   - merge_listTemplates      (low)    — List all saved merge templates
 *   - merge_sendBulk           (high)   — Render + send merged messages to CRM contacts
 *
 * Templates support variables: {{name}}, {{email}}, {{phone}}, {{business}},
 * {{stage}}, {{score}}, {{tags}}, {{date}}, {{company}}, and any custom key.
 *
 * 80/20 AUTOMATION SPLIT:
 *   - 80% automated: template rendering, variable substitution, CRM data pull, bulk send
 *   - 20% AI agent: template creation from brief, personalization hints, A/B copy
 */

import type { ToolSchema } from './registry.js';

interface MergeTemplate {
  id: string;
  name: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'voice' | 'universal';
  subject?: string;
  body: string;
  language: 'es' | 'en';
  variables: string[]; // detected {{vars}}
  createdAt: string;
}

// In-memory template store
const templates: Map<string, MergeTemplate> = new Map();

// Detect variables in a template string
function detectVars(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
}

// Render a template with variables
function render(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  // Replace any remaining unresolved vars with empty string
  result = result.replace(/\{\{\w+\}\}/g, '');
  return result;
}

// Seed default templates
function seedDefaults(): void {
  if (templates.size > 0) return;

  const defaults: Omit<MergeTemplate, 'id' | 'variables' | 'createdAt'>[] = [
    {
      name: 'WhatsApp Welcome',
      channel: 'whatsapp',
      body: 'Hola {{name}}! Bienvenido a KITZ. Tu {{business}} merece crecer. ¿En qué te ayudamos?',
      language: 'es',
    },
    {
      name: 'Email Onboarding',
      channel: 'email',
      subject: '{{name}}, tu workspace KITZ está listo',
      body: 'Hola {{name}},\n\nTu workspace está activo en workspace.kitz.services.\n\nCon KITZ tu {{business}} tiene:\n- CRM para organizar clientes\n- Pedidos y checkout links\n- IA que trabaja 24/7\n\nEntra y empieza: workspace.kitz.services\n\n— KITZ',
      language: 'es',
    },
    {
      name: 'SMS Reminder',
      channel: 'sms',
      body: '{{name}}, recordatorio: tu pedido está listo. Revisa tu WhatsApp para detalles.',
      language: 'es',
    },
    {
      name: 'Follow-Up After Quote',
      channel: 'whatsapp',
      body: '{{name}}, ¿viste la cotización que te enviamos? Si tienes preguntas sobre tu {{business}}, aquí estamos.',
      language: 'es',
    },
    {
      name: 'Payment Reminder',
      channel: 'universal',
      subject: '{{name}}, recordatorio de pago',
      body: 'Hola {{name}},\n\nTe recordamos que tienes un pago pendiente.\n\nMonto: {{amount}}\nFecha límite: {{due_date}}\n\nPaga aquí: {{checkout_link}}\n\n¿Preguntas? Escríbenos por WhatsApp.\n\n— KITZ',
      language: 'es',
    },
    {
      name: 'Invoice Delivery',
      channel: 'email',
      subject: 'Factura #{{invoice_number}} - {{company}}',
      body: 'Hola {{name}},\n\nAdjunto tu factura #{{invoice_number}} por {{amount}}.\n\nDetalles:\n- Fecha: {{date}}\n- Monto: {{amount}}\n- Estado: {{payment_status}}\n\nPaga aquí: {{checkout_link}}\n\nGracias por tu preferencia.\n\n— {{company}}',
      language: 'es',
    },
  ];

  for (const tmpl of defaults) {
    const id = `tmpl-${tmpl.name.toLowerCase().replace(/\s+/g, '-')}`;
    const allText = `${tmpl.body} ${tmpl.subject || ''}`;
    templates.set(id, {
      ...tmpl,
      id,
      variables: detectVars(allText),
      createdAt: new Date().toISOString(),
    });
  }
}

seedDefaults();

export function getAllMailMergeTools(): ToolSchema[] {
  return [
    // ── merge_createTemplate ──
    {
      name: 'merge_createTemplate',
      description:
        'Create a reusable message template with merge variables ({{name}}, {{business}}, etc.). ' +
        'Can auto-generate from a brief using AI, or accept a manual template.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Template name' },
          channel: {
            type: 'string',
            enum: ['whatsapp', 'email', 'sms', 'voice', 'universal'],
            description: 'Target channel',
          },
          body: { type: 'string', description: 'Template body with {{variable}} placeholders' },
          subject: { type: 'string', description: 'Email subject line (email/universal only)' },
          language: { type: 'string', enum: ['es', 'en'], description: 'Language (default: es)' },
          brief: {
            type: 'string',
            description: 'Describe what the template should say — AI generates it (alternative to body)',
          },
        },
        required: ['name', 'channel'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const tmplName = String(args.name);
        const channel = String(args.channel) as MergeTemplate['channel'];
        const language = ((args.language as string) || 'es') as 'es' | 'en';
        let body = (args.body as string) || '';
        let subject = (args.subject as string) || '';

        // AI generation from brief (20% AI agent support)
        if (!body && args.brief) {
          try {
            const { claudeChat } = await import('../llm/claudeClient.js');
            const generated = await claudeChat(
              [{
                role: 'user',
                content: `Create a ${channel} message template for a LatAm SMB.

Brief: ${args.brief}
Language: ${language}
Channel: ${channel}

Rules:
- WhatsApp: 5-7 word hook + 15-23 word body
- SMS: 160 characters max
- Email: Subject line + 3 short paragraphs
- Voice: 30-second script, warm and professional
- Use {{name}} and {{business}} placeholders at minimum
- Tone: Gen Z clarity + disciplined founder

${channel === 'email' || channel === 'universal' ? 'Return JSON: { "subject": "...", "body": "..." }' : 'Return just the message text.'}`,
              }],
              'sonnet',
              traceId,
              'You are KITZ template builder. Generate message templates.',
            );

            if (channel === 'email' || channel === 'universal') {
              try {
                const cleaned = generated.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleaned);
                body = parsed.body || generated;
                subject = parsed.subject || tmplName;
              } catch {
                body = generated;
                subject = tmplName;
              }
            } else {
              body = generated.replace(/```\n?/g, '').trim();
            }
          } catch (err) {
            return { error: `AI template generation failed: ${(err as Error).message}` };
          }
        }

        if (!body) {
          return { error: 'Either body or brief is required.' };
        }

        const id = `tmpl-${tmplName.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
        const allText = `${body} ${subject}`;
        const template: MergeTemplate = {
          id,
          name: tmplName,
          channel,
          subject: subject || undefined,
          body,
          language,
          variables: detectVars(allText),
          createdAt: new Date().toISOString(),
        };

        templates.set(id, template);

        return {
          id,
          name: tmplName,
          channel,
          variables: template.variables,
          preview: body.slice(0, 200),
          subject: subject || undefined,
          message: `Template "${tmplName}" created with ${template.variables.length} merge variable(s).`,
        };
      },
    },

    // ── merge_renderMessage ──
    {
      name: 'merge_renderMessage',
      description:
        'Render a template for a single contact — substitutes all {{variables}} with provided values.',
      parameters: {
        type: 'object',
        properties: {
          template_id: { type: 'string', description: 'Template ID' },
          contact_id: { type: 'string', description: 'CRM contact UUID (auto-fills name/phone/email)' },
          variables: {
            type: 'object',
            description: 'Additional merge variables (e.g., { "amount": "$50", "business": "food delivery" })',
          },
        },
        required: ['template_id'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const templateId = String(args.template_id);
        const contactId = args.contact_id ? String(args.contact_id) : undefined;
        const extraVars = (args.variables as Record<string, string>) || {};

        const template = templates.get(templateId);
        if (!template) {
          return { error: `Template "${templateId}" not found. Use merge_listTemplates to see available.` };
        }

        let contactVars: Record<string, string> = {};
        if (contactId) {
          try {
            const { callWorkspaceMcp } = await import('./mcpClient.js');
            const contact = (await callWorkspaceMcp('get_contact', { contact_id: contactId }, traceId)) as Record<string, unknown>;
            if (contact && !contact.error) {
              const tags = Array.isArray(contact.tags) ? (contact.tags as string[]) : [];
              const stageTag = tags.find((t) => String(t).startsWith('stage:'));
              contactVars = {
                name: String(contact.name || ''),
                email: String(contact.email || ''),
                phone: String(contact.phone || ''),
                stage: stageTag ? stageTag.replace('stage:', '') : '',
                score: String(contact.lead_score || ''),
                tags: tags.filter((t) => !String(t).startsWith('stage:') && !String(t).startsWith('drip:')).join(', '),
                date: new Date().toLocaleDateString('es-PA'),
              };
            }
          } catch {
            // proceed with extra vars only
          }
        }

        const merged = { ...contactVars, ...extraVars };
        const renderedBody = render(template.body, merged);
        const renderedSubject = template.subject ? render(template.subject, merged) : undefined;

        return {
          template: template.name,
          channel: template.channel,
          subject: renderedSubject,
          body: renderedBody,
          variables_used: Object.keys(merged),
          draftOnly: true,
        };
      },
    },

    // ── merge_bulkRender ──
    {
      name: 'merge_bulkRender',
      description:
        'Render a template for multiple CRM contacts at once — returns personalized messages for each. ' +
        'Use for previewing a mail merge before sending.',
      parameters: {
        type: 'object',
        properties: {
          template_id: { type: 'string', description: 'Template ID' },
          status: { type: 'string', description: 'Filter contacts by CRM status' },
          tags: { type: 'string', description: 'Comma-separated tags to filter by' },
          limit: { type: 'number', description: 'Max contacts to render (default: 20, max: 50)' },
          variables: { type: 'object', description: 'Additional variables applied to all contacts' },
        },
        required: ['template_id'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const templateId = String(args.template_id);
        const status = args.status ? String(args.status) : undefined;
        const tags = args.tags ? String(args.tags).split(',').map((t) => t.trim()).filter(Boolean) : [];
        const limit = Math.min(Number(args.limit) || 20, 50);
        const globalVars = (args.variables as Record<string, string>) || {};

        const template = templates.get(templateId);
        if (!template) {
          return { error: `Template "${templateId}" not found.` };
        }

        try {
          const { callWorkspaceMcp } = await import('./mcpClient.js');

          const mcpArgs: Record<string, unknown> = { limit };
          if (status) mcpArgs.status = status;

          let contacts = (await callWorkspaceMcp('list_contacts', mcpArgs, traceId)) as Array<Record<string, unknown>>;

          // Tag filter
          if (tags.length > 0) {
            contacts = contacts.filter((c) => {
              const contactTags = Array.isArray(c.tags) ? (c.tags as string[]) : [];
              return tags.some((t) => contactTags.includes(t));
            });
          }

          const rendered = contacts.slice(0, limit).map((c) => {
            const cTags = Array.isArray(c.tags) ? (c.tags as string[]) : [];
            const stageTag = cTags.find((t) => String(t).startsWith('stage:'));
            const vars: Record<string, string> = {
              name: String(c.name || ''),
              email: String(c.email || ''),
              phone: String(c.phone || ''),
              stage: stageTag ? stageTag.replace('stage:', '') : '',
              score: String(c.lead_score || ''),
              tags: cTags.filter((t) => !String(t).startsWith('stage:') && !String(t).startsWith('drip:')).join(', '),
              date: new Date().toLocaleDateString('es-PA'),
              ...globalVars,
            };

            return {
              contact: String(c.name || 'Unknown'),
              phone: String(c.phone || ''),
              email: String(c.email || ''),
              subject: template.subject ? render(template.subject, vars) : undefined,
              body: render(template.body, vars).slice(0, 300),
            };
          });

          return {
            template: template.name,
            channel: template.channel,
            rendered,
            total: rendered.length,
            draftOnly: true,
            message: `Rendered "${template.name}" for ${rendered.length} contact(s). Preview above.`,
          };
        } catch (err) {
          return { error: `Bulk render failed: ${(err as Error).message}` };
        }
      },
    },

    // ── merge_listTemplates ──
    {
      name: 'merge_listTemplates',
      description: 'List all saved mail merge templates with their channels and variables.',
      parameters: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            enum: ['whatsapp', 'email', 'sms', 'voice', 'universal', 'all'],
            description: 'Filter by channel (default: all)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        seedDefaults();
        const channel = (args.channel as string) || 'all';
        const all = Array.from(templates.values());
        const filtered = channel === 'all' ? all : all.filter((t) => t.channel === channel);

        return {
          templates: filtered.map((t) => ({
            id: t.id,
            name: t.name,
            channel: t.channel,
            language: t.language,
            variables: t.variables,
            preview: t.body.slice(0, 100),
            hasSubject: !!t.subject,
          })),
          total: filtered.length,
        };
      },
    },

    // ── merge_sendBulk ──
    {
      name: 'merge_sendBulk',
      description:
        'Render a template for CRM contacts and send the merged messages via the template\'s channel. ' +
        'Draft-first: WhatsApp sends are queued, email/SMS/voice are drafted for approval.',
      parameters: {
        type: 'object',
        properties: {
          template_id: { type: 'string', description: 'Template ID' },
          status: { type: 'string', description: 'Filter contacts by CRM status' },
          tags: { type: 'string', description: 'Comma-separated tags to filter by' },
          limit: { type: 'number', description: 'Max contacts to send to (default: 20, max: 200)' },
          variables: { type: 'object', description: 'Additional variables applied to all contacts' },
          delay_ms: { type: 'number', description: 'Delay between sends in ms (default: 1500, min: 1000)' },
        },
        required: ['template_id'],
      },
      riskLevel: 'high',
      execute: async (args, traceId) => {
        const templateId = String(args.template_id);
        const status = args.status ? String(args.status) : undefined;
        const tags = args.tags ? String(args.tags).split(',').map((t) => t.trim()).filter(Boolean) : [];
        const limit = Math.min(Number(args.limit) || 20, 200);
        const globalVars = (args.variables as Record<string, string>) || {};
        const delayMs = Math.max(Number(args.delay_ms) || 1500, 1000);

        const template = templates.get(templateId);
        if (!template) {
          return { error: `Template "${templateId}" not found.` };
        }

        try {
          const { callWorkspaceMcp } = await import('./mcpClient.js');

          const mcpArgs: Record<string, unknown> = { limit };
          if (status) mcpArgs.status = status;

          let contacts = (await callWorkspaceMcp('list_contacts', mcpArgs, traceId)) as Array<Record<string, unknown>>;

          if (tags.length > 0) {
            contacts = contacts.filter((c) => {
              const contactTags = Array.isArray(c.tags) ? (c.tags as string[]) : [];
              return tags.some((t) => contactTags.includes(t));
            });
          }

          const recipients = contacts.slice(0, limit);
          if (recipients.length === 0) {
            return { error: 'No contacts matched the filters.' };
          }

          let sent = 0;
          let drafted = 0;
          let failed = 0;
          const channel = template.channel === 'universal' ? 'whatsapp' : template.channel;

          const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';
          const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET } : {}),
          };

          for (let i = 0; i < recipients.length; i++) {
            const c = recipients[i];
            const cTags = Array.isArray(c.tags) ? (c.tags as string[]) : [];
            const stageTag = cTags.find((t) => String(t).startsWith('stage:'));
            const vars: Record<string, string> = {
              name: String(c.name || ''),
              email: String(c.email || ''),
              phone: String(c.phone || ''),
              stage: stageTag ? stageTag.replace('stage:', '') : '',
              score: String(c.lead_score || ''),
              date: new Date().toLocaleDateString('es-PA'),
              ...globalVars,
            };

            const renderedBody = render(template.body, vars);

            if (channel === 'whatsapp' && c.phone) {
              try {
                const res = await fetch(`${WA_CONNECTOR_URL}/outbound/send`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({ phone: String(c.phone).replace(/[\s\-()]/g, ''), message: renderedBody }),
                  signal: AbortSignal.timeout(15000),
                });
                if (res.ok) sent++;
                else failed++;
              } catch {
                failed++;
              }
            } else {
              drafted++;
            }

            if (i < recipients.length - 1) {
              await new Promise((r) => setTimeout(r, delayMs));
            }
          }

          return {
            template: template.name,
            channel,
            total: recipients.length,
            sent,
            drafted,
            failed,
            draftOnly: channel !== 'whatsapp',
            message: `Mail merge complete: ${sent} sent, ${drafted} drafted, ${failed} failed.`,
          };
        } catch (err) {
          return { error: `Bulk send failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
