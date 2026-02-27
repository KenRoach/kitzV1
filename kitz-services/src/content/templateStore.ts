/**
 * Content template store — Supabase with in-memory fallback.
 * Stores reusable marketing templates for WhatsApp, email, social.
 */

const DATABASE_URL = process.env.DATABASE_URL || '';

export interface ContentTemplate {
  id: string;
  orgId: string;
  kind: 'whatsapp' | 'email' | 'social' | 'promo';
  name: string;
  content: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory fallback
const memTemplates = new Map<string, ContentTemplate>();

// Seed defaults
const DEFAULTS: Omit<ContentTemplate, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>[] = [
  { kind: 'whatsapp', name: 'check-in-reminder', content: '¡Hola {{name}}! Solo quería saber cómo va todo. ¿Necesitas algo?', language: 'es' },
  { kind: 'email', name: 'invoice-follow-up', content: 'Hola {{name}},\n\nTe recordamos que tu factura #{{invoice}} está pendiente.\n\nSaludos,\n{{business}}', language: 'es' },
  { kind: 'whatsapp', name: 'order-confirmation', content: '¡Gracias {{name}}! Tu pedido #{{orderId}} ha sido confirmado. Te avisamos cuando esté listo.', language: 'es' },
  { kind: 'social', name: 'new-product-announcement', content: '¡Nuevo producto disponible! {{product}} — {{description}}. Link en bio.', language: 'es' },
  { kind: 'promo', name: 'flash-sale', content: '🔥 ¡Oferta relámpago! {{discount}}% de descuento en {{product}}. Solo hoy. ¡No te lo pierdas!', language: 'es' },
];

function supabaseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''}`,
  };
}

export async function upsertTemplate(template: ContentTemplate): Promise<void> {
  memTemplates.set(template.id, template);

  if (!DATABASE_URL) return;

  await fetch(`${DATABASE_URL}/rest/v1/content_templates`, {
    method: 'POST',
    headers: { ...supabaseHeaders(), Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      id: template.id,
      org_id: template.orgId,
      kind: template.kind,
      name: template.name,
      content: template.content,
      language: template.language,
      created_at: template.createdAt,
      updated_at: template.updatedAt,
    }),
  }).catch(() => {});
}

export async function listTemplates(orgId: string, kind?: string): Promise<ContentTemplate[]> {
  // In-memory check first
  let results = [...memTemplates.values()].filter((t) => t.orgId === orgId || t.orgId === 'default');
  if (kind) results = results.filter((t) => t.kind === kind);

  if (results.length > 0) return results;

  // Return defaults if nothing stored
  const now = new Date().toISOString();
  return DEFAULTS
    .filter((d) => !kind || d.kind === kind)
    .map((d, i) => ({
      ...d,
      id: `default_${i}`,
      orgId: 'default',
      createdAt: now,
      updatedAt: now,
    }));
}

export async function getTemplateByName(orgId: string, name: string): Promise<ContentTemplate | null> {
  const mem = [...memTemplates.values()].find((t) => (t.orgId === orgId || t.orgId === 'default') && t.name === name);
  if (mem) return mem;

  const defaults = DEFAULTS.find((d) => d.name === name);
  if (defaults) {
    const now = new Date().toISOString();
    return { ...defaults, id: `default_${name}`, orgId: 'default', createdAt: now, updatedAt: now };
  }

  return null;
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
}
