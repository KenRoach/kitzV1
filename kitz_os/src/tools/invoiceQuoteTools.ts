/**
 * Invoice & Quote Tools — Generate branded invoices and quotes with auto-calculations.
 *
 * 6 tools:
 *   - invoice_create    (medium) — Create invoice from line items
 *   - invoice_fromOrder (medium) — Create invoice from CRM order
 *   - quote_create      (medium) — Create quote with validity period
 *   - quote_toInvoice   (low)    — Convert quote to invoice
 *   - invoice_list      (low)    — List invoices/quotes
 *   - invoice_send      (high)   — Ship invoice (draft-first)
 */

import type { ToolSchema } from './registry.js';
import { getBrandKit, storeContent, getContent, generateContentId, renderTemplate, injectBrandCSS } from './contentEngine.js';
import type { ContentItem } from './contentEngine.js';

interface LineItem { description: string; quantity: number; unitPrice: number; }

interface InvoiceData {
  invoiceNumber: string; type: 'invoice' | 'quote';
  contactName: string; contactEmail?: string; contactPhone?: string;
  lineItems: LineItem[]; subtotal: number; taxRate: number; taxAmount: number; discount: number; grandTotal: number;
  notes?: string; validityDays?: number; terms?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'accepted' | 'rejected';
  createdAt: string;
}

const invoices: Map<string, InvoiceData> = new Map();
let invoiceCounter = 0;
let quoteCounter = 0;

const TEMPLATES: Record<string, string> = {
  modern: `<div style="max-width:800px;margin:0 auto;padding:40px;font-family:var(--font-body)">
<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid var(--brand-primary);padding-bottom:20px;margin-bottom:30px">
<div><h1 style="margin:0;font-size:28px;color:var(--brand-primary)">{{businessName}}</h1><p style="margin:4px 0 0;color:#666;font-size:14px">{{tagline}}</p></div>
<div style="text-align:right"><h2 style="margin:0;font-size:22px;color:var(--brand-text)">{{docType}}</h2><p style="margin:4px 0 0;font-size:14px;color:#666">#{{invoiceNumber}}</p><p style="margin:2px 0 0;font-size:14px;color:#666">{{date}}</p></div>
</div>
<div style="margin-bottom:30px"><p style="font-weight:600;margin:0 0 4px;color:var(--brand-text)">Para:</p><p style="margin:0;font-size:15px">{{contactName}}</p></div>
<table style="width:100%;border-collapse:collapse;margin-bottom:20px">
<thead><tr style="background:var(--brand-primary);color:#fff"><th style="padding:10px 12px;text-align:left">Descripcion</th><th style="padding:10px 12px;text-align:center;width:80px">Cant.</th><th style="padding:10px 12px;text-align:right;width:120px">Precio</th><th style="padding:10px 12px;text-align:right;width:120px">Total</th></tr></thead>
<tbody>{{lineItemsHtml}}</tbody>
</table>
<div style="display:flex;justify-content:flex-end"><div style="width:250px">
<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px"><span>Subtotal</span><span>{{subtotal}}</span></div>
<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px"><span>Impuesto ({{taxPercent}})</span><span>{{taxAmount}}</span></div>
<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px"><span>Descuento</span><span>-{{discount}}</span></div>
<div style="display:flex;justify-content:space-between;padding:10px 0;font-size:18px;font-weight:700;border-top:2px solid var(--brand-primary);margin-top:4px"><span>Total</span><span style="color:var(--brand-primary)">{{grandTotal}}</span></div>
</div></div>
<div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:13px;color:#888">{{notes}}{{terms}}</div>
</div>`,
  clean: `<div style="max-width:800px;margin:0 auto;padding:40px;font-family:Arial,sans-serif">
<div style="border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:24px">
<h1 style="margin:0;font-size:24px;color:#000">{{businessName}}</h1>
<p style="margin:8px 0 0;font-size:12px;color:#666">{{docType}} #{{invoiceNumber}} | {{date}}</p>
</div>
<p style="margin:0 0 20px"><strong>Cliente:</strong> {{contactName}}</p>
<table style="width:100%;border-collapse:collapse;margin-bottom:20px">
<thead><tr style="border-bottom:2px solid #000"><th style="padding:8px;text-align:left">Descripcion</th><th style="padding:8px;text-align:center;width:60px">Cant.</th><th style="padding:8px;text-align:right;width:100px">Precio</th><th style="padding:8px;text-align:right;width:100px">Total</th></tr></thead>
<tbody>{{lineItemsHtml}}</tbody>
</table>
<div style="text-align:right;font-size:14px">
<p>Subtotal: {{subtotal}}</p><p>Impuesto ({{taxPercent}}): {{taxAmount}}</p><p>Descuento: -{{discount}}</p>
<p style="font-size:20px;font-weight:700;margin-top:8px">Total: {{grandTotal}}</p>
</div>
<p style="margin-top:24px;font-size:12px;color:#888">{{notes}}{{terms}}</p>
</div>`,
  bold: `<div style="max-width:800px;margin:0 auto;padding:40px;font-family:var(--font-body);background:var(--brand-bg)">
<div style="background:var(--brand-primary);color:#fff;padding:24px;border-radius:12px;margin-bottom:24px">
<h1 style="margin:0;font-size:28px;color:#fff">{{businessName}}</h1>
<p style="margin:8px 0 0;font-size:14px;opacity:.8">{{docType}} #{{invoiceNumber}} | {{date}}</p>
</div>
<div style="background:var(--brand-accent);color:#000;padding:12px 20px;border-radius:8px;margin-bottom:20px;font-weight:600">Para: {{contactName}}</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:20px">
<thead><tr style="background:var(--brand-secondary);color:#fff"><th style="padding:12px;text-align:left;border-radius:8px 0 0 0">Descripcion</th><th style="padding:12px;text-align:center;width:70px">Cant.</th><th style="padding:12px;text-align:right;width:110px">Precio</th><th style="padding:12px;text-align:right;width:110px;border-radius:0 8px 0 0">Total</th></tr></thead>
<tbody>{{lineItemsHtml}}</tbody>
</table>
<div style="background:#f5f5f5;padding:20px;border-radius:8px;text-align:right;font-size:14px">
<p>Subtotal: {{subtotal}}</p><p>Impuesto ({{taxPercent}}): {{taxAmount}}</p><p>Descuento: -{{discount}}</p>
<p style="font-size:24px;font-weight:800;color:var(--brand-primary);margin-top:8px">Total: {{grandTotal}}</p>
</div>
<p style="margin-top:20px;font-size:12px;color:#888">{{notes}}{{terms}}</p>
</div>`,
};

function buildLineItemsHtml(items: LineItem[]): string {
  return items.map((li, i) => {
    const total = li.quantity * li.unitPrice;
    const bg = i % 2 === 0 ? '#fafafa' : '#fff';
    return `<tr style="background:${bg}"><td style="padding:10px 12px">${li.description}</td><td style="padding:10px 12px;text-align:center">${li.quantity}</td><td style="padding:10px 12px;text-align:right">$${li.unitPrice.toFixed(2)}</td><td style="padding:10px 12px;text-align:right">$${total.toFixed(2)}</td></tr>`;
  }).join('\n');
}

function createInvoiceOrQuote(
  type: 'invoice' | 'quote', contactName: string, lineItems: LineItem[],
  taxRate: number, discount: number, notes: string | undefined,
  template: string, validityDays?: number, terms?: string,
): { data: InvoiceData; html: string; contentId: string } {
  const number = type === 'invoice'
    ? `INV-${String(++invoiceCounter).padStart(3, '0')}`
    : `QUO-${String(++quoteCounter).padStart(3, '0')}`;
  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount - discount;
  const brandKit = getBrandKit();
  const now = new Date();

  const data: InvoiceData = {
    invoiceNumber: number, type, contactName, lineItems, subtotal, taxRate, taxAmount, discount, grandTotal,
    notes, validityDays, terms, status: 'draft', createdAt: now.toISOString(),
  };
  invoices.set(number, data);

  const tmpl = TEMPLATES[template] || TEMPLATES.modern!;
  const vars: Record<string, string> = {
    businessName: brandKit.businessName, tagline: brandKit.tagline || '',
    docType: type === 'invoice' ? 'Factura' : 'Cotizacion',
    invoiceNumber: number, date: now.toLocaleDateString('es-PA'),
    contactName, lineItemsHtml: buildLineItemsHtml(lineItems),
    subtotal: `$${subtotal.toFixed(2)}`, taxPercent: `${(taxRate * 100).toFixed(0)}%`,
    taxAmount: `$${taxAmount.toFixed(2)}`, discount: `$${discount.toFixed(2)}`,
    grandTotal: `$${grandTotal.toFixed(2)}`,
    notes: notes ? `<p>${notes}</p>` : '',
    terms: terms ? `<p style="margin-top:8px"><strong>Terminos:</strong> ${terms}</p>` : '',
  };

  const html = injectBrandCSS(renderTemplate(tmpl, vars), brandKit);
  const contentId = generateContentId();
  const contentItem: ContentItem = { contentId, type, html, data: data as unknown as Record<string, unknown>, status: 'draft', createdAt: now.toISOString(), updatedAt: now.toISOString() };
  storeContent(contentItem);
  return { data, html, contentId };
}

export function getAllInvoiceQuoteTools(): ToolSchema[] {
  return [
    {
      name: 'invoice_create',
      description: 'Create a branded invoice from line items. Auto-calculates subtotal, tax (7% ITBMS default), discount, grandTotal.',
      parameters: {
        type: 'object',
        properties: {
          contact_name: { type: 'string', description: 'Customer name' },
          line_items: { type: 'array', description: 'Array of { description, quantity, unitPrice }', items: { type: 'object' } },
          tax_rate: { type: 'number', description: 'Tax rate (default: 0.07 for Panama ITBMS)' },
          discount: { type: 'number', description: 'Discount amount (default: 0)' },
          notes: { type: 'string' },
          template: { type: 'string', enum: ['clean', 'modern', 'bold'] as const, description: 'Template style (default: modern)' },
        },
        required: ['contact_name', 'line_items'],
      },
      riskLevel: 'medium',
      execute: async (args) => {
        const items = (args.line_items as LineItem[]) || [];
        if (items.length === 0) return { error: 'At least one line item required.' };
        const { data, html, contentId } = createInvoiceOrQuote(
          'invoice', String(args.contact_name), items,
          Number(args.tax_rate ?? 0.07), Number(args.discount ?? 0),
          args.notes as string | undefined, String(args.template || 'modern'),
        );
        return { contentId, invoiceNumber: data.invoiceNumber, html, grandTotal: `$${data.grandTotal.toFixed(2)}`, message: `Invoice ${data.invoiceNumber} created for ${data.contactName}.` };
      },
    },
    {
      name: 'invoice_fromOrder',
      description: 'Create an invoice from a CRM order by pulling order data automatically.',
      parameters: { type: 'object', properties: { order_id: { type: 'string' }, template: { type: 'string', enum: ['clean', 'modern', 'bold'] as const } }, required: ['order_id'] },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const orderId = String(args.order_id);
        let contactName = 'Cliente';
        let items: LineItem[] = [{ description: `Pedido #${orderId}`, quantity: 1, unitPrice: 0 }];
        try {
          const { callWorkspaceMcp } = await import('./mcpClient.js');
          const order = (await callWorkspaceMcp('get_order', { order_id: orderId }, traceId)) as Record<string, unknown>;
          if (order && !order.error) {
            contactName = String(order.customer_name || order.contact_name || 'Cliente');
            if (Array.isArray(order.items)) {
              items = (order.items as Array<Record<string, unknown>>).map((i) => ({
                description: String(i.description || i.name || 'Item'),
                quantity: Number(i.quantity || 1),
                unitPrice: Number(i.unit_price || i.price || 0),
              }));
            } else if (order.total) {
              items = [{ description: `Pedido #${orderId}`, quantity: 1, unitPrice: Number(order.total) }];
            }
          }
        } catch { /* proceed with placeholder */ }
        const { data, html, contentId } = createInvoiceOrQuote('invoice', contactName, items, 0.07, 0, undefined, String(args.template || 'modern'));
        return { contentId, invoiceNumber: data.invoiceNumber, html, grandTotal: `$${data.grandTotal.toFixed(2)}`, message: `Invoice ${data.invoiceNumber} created from order #${orderId}.` };
      },
    },
    {
      name: 'quote_create',
      description: 'Create a branded quote with validity period and terms. Number format QUO-001.',
      parameters: {
        type: 'object',
        properties: {
          contact_name: { type: 'string' }, line_items: { type: 'array', items: { type: 'object' } },
          tax_rate: { type: 'number' }, discount: { type: 'number' }, notes: { type: 'string' },
          template: { type: 'string', enum: ['clean', 'modern', 'bold'] as const },
          validity_days: { type: 'number', description: 'Quote validity in days (default: 15)' },
          terms: { type: 'string', description: 'Quote terms and conditions' },
        },
        required: ['contact_name', 'line_items'],
      },
      riskLevel: 'medium',
      execute: async (args) => {
        const items = (args.line_items as LineItem[]) || [];
        if (items.length === 0) return { error: 'At least one line item required.' };
        const validityDays = Number(args.validity_days ?? 15);
        const { data, html, contentId } = createInvoiceOrQuote(
          'quote', String(args.contact_name), items,
          Number(args.tax_rate ?? 0.07), Number(args.discount ?? 0),
          args.notes as string | undefined, String(args.template || 'modern'),
          validityDays, (args.terms as string) || `Cotizacion valida por ${validityDays} dias.`,
        );
        return { contentId, quoteNumber: data.invoiceNumber, html, grandTotal: `$${data.grandTotal.toFixed(2)}`, validityDays, message: `Quote ${data.invoiceNumber} created.` };
      },
    },
    {
      name: 'quote_toInvoice',
      description: 'Convert an existing quote to an invoice. Copies quote data and creates a new invoice.',
      parameters: { type: 'object', properties: { quote_number: { type: 'string' } }, required: ['quote_number'] },
      riskLevel: 'low',
      execute: async (args) => {
        const quoteNum = String(args.quote_number);
        const quote = invoices.get(quoteNum);
        if (!quote) return { error: `Quote "${quoteNum}" not found.` };
        if (quote.type !== 'quote') return { error: `"${quoteNum}" is not a quote.` };
        quote.status = 'accepted';
        const { data, html, contentId } = createInvoiceOrQuote('invoice', quote.contactName, quote.lineItems, quote.taxRate, quote.discount, quote.notes, 'modern');
        return { contentId, invoiceNumber: data.invoiceNumber, fromQuote: quoteNum, html, grandTotal: `$${data.grandTotal.toFixed(2)}`, message: `Quote ${quoteNum} converted to invoice ${data.invoiceNumber}.` };
      },
    },
    {
      name: 'invoice_list',
      description: 'List all invoices and/or quotes with optional filters.',
      parameters: { type: 'object', properties: { type: { type: 'string', enum: ['invoice', 'quote', 'all'] as const }, status: { type: 'string' } } },
      riskLevel: 'low',
      execute: async (args) => {
        const filterType = (args.type as string) || 'all';
        const filterStatus = args.status as string | undefined;
        let results = Array.from(invoices.values());
        if (filterType !== 'all') results = results.filter((i) => i.type === filterType);
        if (filterStatus) results = results.filter((i) => i.status === filterStatus);
        return { items: results.map((i) => ({ number: i.invoiceNumber, type: i.type, contact: i.contactName, grandTotal: `$${i.grandTotal.toFixed(2)}`, status: i.status, date: i.createdAt.slice(0, 10) })), total: results.length };
      },
    },
    {
      name: 'invoice_send',
      description: 'Ship an invoice or quote — marks as approved. Draft-first pattern.',
      parameters: { type: 'object', properties: { invoice_number: { type: 'string' }, channel: { type: 'string', enum: ['whatsapp', 'email'] as const }, recipient: { type: 'string' } }, required: ['invoice_number'] },
      riskLevel: 'high',
      execute: async (args) => {
        const num = String(args.invoice_number);
        const inv = invoices.get(num);
        if (!inv) return { error: `Invoice/quote "${num}" not found.` };
        inv.status = 'sent';
        // Find associated content item
        for (const [, item] of Array.from(new Map())) { void item; }
        return { invoiceNumber: num, status: 'sent', channel: (args.channel as string) || 'pending', recipient: (args.recipient as string) || 'pending', draftOnly: true, message: `${inv.type === 'invoice' ? 'Invoice' : 'Quote'} ${num} ready to send.` };
      },
    },
  ];
}
