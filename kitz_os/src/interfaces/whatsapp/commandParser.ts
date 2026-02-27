/**
 * WhatsApp Command Parser — Regex-based fast routing (Tier 1).
 *
 * Parses incoming WhatsApp messages into structured commands.
 * If no regex match → falls through to AI semantic router (Tier 2).
 */

export type CommandAction =
  | 'status' | 'help' | 'greeting' | 'kill_switch' | 'resume'
  | 'report' | 'recharge' | 'battery'
  | 'list_contacts' | 'get_contact' | 'create_contact' | 'update_contact'
  | 'list_orders' | 'get_order' | 'create_order' | 'update_order'
  | 'business_summary'
  | 'list_storefronts' | 'create_storefront' | 'update_storefront' | 'delete_storefront'
  | 'mark_storefront_paid' | 'send_storefront'
  | 'list_products' | 'create_product' | 'update_product' | 'delete_product'
  | 'dashboard_metrics'
  | 'braindump'
  | 'run' | 'approve' | 'reject';

export interface KitzCommand {
  action: CommandAction;
  raw: string;
  goal?: string;
  value?: boolean;
  cadence?: string;
  credits?: number;
  contactId?: string;
  orderId?: string;
  storefrontId?: string;
  productId?: string;
  contactData?: Record<string, unknown>;
  orderData?: Record<string, unknown>;
  runId?: string;
  transcript?: string;
}

export function parseWhatsAppCommand(text: string): KitzCommand | null {
  const raw = text.trim();
  const lower = raw.toLowerCase().replace(/^kitz:\s*/i, '').trim();

  // ── Greetings ──
  if (/^(hi|hello|hey|hola|buenos|good\s+(morning|afternoon|evening)|sup|yo)\b/i.test(lower)) {
    return { action: 'greeting', raw };
  }

  // ── System ──
  if (/^(status|estado)$/i.test(lower)) {
    return { action: 'status', raw };
  }
  if (/^(help|ayuda|commands|menu)\b/i.test(lower)) {
    return { action: 'help', raw };
  }
  if (/^(kill|pause|stop|emergency)\b/i.test(lower)) {
    return { action: 'kill_switch', raw, value: true };
  }
  if (/^(resume|unpause|start)\b/i.test(lower)) {
    return { action: 'kill_switch', raw, value: false };
  }

  // ── CRM ──
  if (/^(contacts|clientes|leads|customers)$/i.test(lower)) {
    return { action: 'list_contacts', raw };
  }
  if (/^contact\s+(.+)/i.test(lower)) {
    const match = lower.match(/^contact\s+(.+)/i);
    return { action: 'get_contact', raw, contactId: match?.[1] };
  }
  if (/^(add|new|create)\s+contact\b/i.test(lower)) {
    return { action: 'create_contact', raw };
  }
  if (/^update\s+contact\b/i.test(lower)) {
    return { action: 'update_contact', raw };
  }

  // ── Orders ──
  if (/^(orders|pedidos|invoices)$/i.test(lower)) {
    return { action: 'list_orders', raw };
  }
  if (/^order\s+(.+)/i.test(lower)) {
    const match = lower.match(/^order\s+(.+)/i);
    return { action: 'get_order', raw, orderId: match?.[1] };
  }
  if (/^(new|create)\s+(order|invoice)\b/i.test(lower)) {
    return { action: 'create_order', raw };
  }
  if (/^(mark\s+order|update\s+order)\b/i.test(lower)) {
    return { action: 'update_order', raw };
  }

  // ── Storefronts ──
  if (/^(storefronts|payment\s+links?|tiendas)$/i.test(lower)) {
    return { action: 'list_storefronts', raw };
  }
  if (/^(create|new)\s+(storefront|payment\s+link|invoice)\b/i.test(lower)) {
    return { action: 'create_storefront', raw };
  }
  if (/^(mark|paid)\s+storefront\b/i.test(lower)) {
    return { action: 'mark_storefront_paid', raw };
  }
  if (/^(send)\s+storefront\b/i.test(lower)) {
    return { action: 'send_storefront', raw };
  }
  if (/^(delete|remove)\s+storefront\b/i.test(lower)) {
    return { action: 'delete_storefront', raw };
  }

  // ── Products ──
  if (/^(products|productos|catalog)$/i.test(lower)) {
    return { action: 'list_products', raw };
  }
  if (/^(create|new|add)\s+product\b/i.test(lower)) {
    return { action: 'create_product', raw };
  }
  if (/^(delete|remove)\s+product\b/i.test(lower)) {
    return { action: 'delete_product', raw };
  }

  // ── Dashboard / Summary ──
  if (/^(dashboard|metrics|kpis?)$/i.test(lower)) {
    return { action: 'dashboard_metrics', raw };
  }
  if (/^(summary|overview|resumen|how\s+are\s+we)$/i.test(lower)) {
    return { action: 'business_summary', raw };
  }

  // ── Brain Dump ──
  if (/^(brain\s*dump|idea|brainstorm)[\s:]/i.test(lower)) {
    const transcript = raw.replace(/^(brain\s*dump|idea|brainstorm)[\s:]*/i, '').trim();
    return { action: 'braindump', raw, transcript };
  }

  // ── AI Battery ──
  if (/^(battery|bateria|credits|creditos)$/i.test(lower)) {
    return { action: 'battery', raw };
  }
  if (/^recharge\s+(\d+)/i.test(lower)) {
    const match = lower.match(/^recharge\s+(\d+)/i);
    return { action: 'recharge', raw, credits: Number(match?.[1] || 10) };
  }

  // ── Reports ──
  if (/^(report|brief)\s*(daily|weekly|monthly|quarterly)?$/i.test(lower)) {
    const match = lower.match(/^(report|brief)\s*(daily|weekly|monthly|quarterly)?$/i);
    return { action: 'report', raw, cadence: match?.[2] || 'daily' };
  }

  // ── Run / Approve / Reject ──
  if (/^run\b/i.test(lower)) {
    return { action: 'run', raw, goal: raw.replace(/^run\s*/i, '').trim() };
  }
  if (/^(?:approve|aprobar|si|sí|dale|listo)\b/i.test(lower)) {
    const match = lower.match(/^(?:approve|aprobar|si|sí|dale|listo)\s+(.+)/i);
    return { action: 'approve', raw, runId: match?.[1] };
  }
  if (/^(?:reject|rechazar|no|cancel|cancelar)\b/i.test(lower)) {
    const match = lower.match(/^(?:reject|rechazar|no|cancel|cancelar)\s+(.+)/i);
    return { action: 'reject', raw, runId: match?.[1] };
  }

  // No regex match → will fall through to AI semantic router
  return null;
}
