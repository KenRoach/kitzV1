/**
 * HubSpot Tools — Real CRM API integration + advisory fallback.
 *
 * Tools:
 *   1. hubspot_listContacts  — List contacts from HubSpot CRM
 *   2. hubspot_createContact — Create a new contact
 *   3. hubspot_listDeals     — List deals/pipeline
 *   4. hubspot_createDeal    — Create a new deal
 *   5. hubspot_advise        — Advisory: CRM setup optimization (original)
 *
 * Requires: HUBSPOT_ACCESS_TOKEN
 */
import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const log = createSubsystemLogger('hubspotTools');
const SYS = 'HubSpot CRM advisor for LatAm SMBs. Free tier optimization. Spanish default. Respond with JSON.';

function getHubSpotToken(): string {
  return process.env.HUBSPOT_ACCESS_TOKEN || '';
}

async function hubspotFetch<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = getHubSpotToken();
  const res = await fetch(`https://api.hubapi.com${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`HubSpot ${res.status}: ${errText.slice(0, 200)}`);
  }
  return res.json() as T;
}

export function getAllHubspotAdvisorTools(): ToolSchema[] {
  return [
    {
      name: 'hubspot_listContacts',
      description: 'List contacts from HubSpot CRM with optional search.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max contacts (default: 10)' },
          query: { type: 'string', description: 'Search query (name, email, company)' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        if (!getHubSpotToken()) {
          return { error: 'HubSpot not configured.', fix: 'Set HUBSPOT_ACCESS_TOKEN in env.', source: 'advisory' };
        }
        try {
          const limit = Math.min(Number(args.limit) || 10, 50);
          if (args.query) {
            const data = await hubspotFetch<{ results: unknown[] }>('/crm/v3/objects/contacts/search', 'POST', {
              query: String(args.query),
              limit,
              properties: ['firstname', 'lastname', 'email', 'phone', 'company'],
            });
            log.info('hubspot_searchContacts', { count: data.results.length, trace_id: traceId });
            return { success: true, contacts: data.results, count: data.results.length, source: 'hubspot' };
          }
          const data = await hubspotFetch<{ results: unknown[] }>(`/crm/v3/objects/contacts?limit=${limit}&properties=firstname,lastname,email,phone,company`);
          log.info('hubspot_listContacts', { count: data.results.length, trace_id: traceId });
          return { success: true, contacts: data.results, count: data.results.length, source: 'hubspot' };
        } catch (err) {
          return { error: `HubSpot failed: ${(err as Error).message}` };
        }
      },
    },

    {
      name: 'hubspot_createContact',
      description: 'Create a new contact in HubSpot CRM.',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Contact email' },
          firstname: { type: 'string', description: 'First name' },
          lastname: { type: 'string', description: 'Last name' },
          phone: { type: 'string', description: 'Phone number' },
          company: { type: 'string', description: 'Company name' },
        },
        required: ['email'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        if (!getHubSpotToken()) {
          return { error: 'HubSpot not configured.', fix: 'Set HUBSPOT_ACCESS_TOKEN in env.' };
        }
        try {
          const properties: Record<string, string> = { email: String(args.email) };
          if (args.firstname) properties.firstname = String(args.firstname);
          if (args.lastname) properties.lastname = String(args.lastname);
          if (args.phone) properties.phone = String(args.phone);
          if (args.company) properties.company = String(args.company);

          const data = await hubspotFetch<{ id: string; properties: unknown }>('/crm/v3/objects/contacts', 'POST', { properties });
          log.info('hubspot_createContact', { id: data.id, email: args.email, trace_id: traceId });
          return { success: true, contactId: data.id, properties: data.properties, source: 'hubspot' };
        } catch (err) {
          return { error: `HubSpot create failed: ${(err as Error).message}` };
        }
      },
    },

    {
      name: 'hubspot_listDeals',
      description: 'List deals from HubSpot CRM pipeline.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max deals (default: 10)' },
          stage: { type: 'string', description: 'Filter by deal stage' },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        if (!getHubSpotToken()) {
          return { error: 'HubSpot not configured.', fix: 'Set HUBSPOT_ACCESS_TOKEN in env.' };
        }
        try {
          const limit = Math.min(Number(args.limit) || 10, 50);
          const data = await hubspotFetch<{ results: unknown[] }>(`/crm/v3/objects/deals?limit=${limit}&properties=dealname,amount,dealstage,closedate,pipeline`);
          log.info('hubspot_listDeals', { count: data.results.length, trace_id: traceId });
          return { success: true, deals: data.results, count: data.results.length, source: 'hubspot' };
        } catch (err) {
          return { error: `HubSpot deals failed: ${(err as Error).message}` };
        }
      },
    },

    {
      name: 'hubspot_createDeal',
      description: 'Create a new deal in HubSpot CRM pipeline.',
      parameters: {
        type: 'object',
        properties: {
          dealname: { type: 'string', description: 'Deal name' },
          amount: { type: 'string', description: 'Deal amount' },
          dealstage: { type: 'string', description: 'Deal stage (e.g., appointmentscheduled, qualifiedtobuy, closedwon)' },
          closedate: { type: 'string', description: 'Expected close date (ISO)' },
        },
        required: ['dealname'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        if (!getHubSpotToken()) {
          return { error: 'HubSpot not configured.', fix: 'Set HUBSPOT_ACCESS_TOKEN in env.' };
        }
        try {
          const properties: Record<string, string> = { dealname: String(args.dealname) };
          if (args.amount) properties.amount = String(args.amount);
          if (args.dealstage) properties.dealstage = String(args.dealstage);
          if (args.closedate) properties.closedate = String(args.closedate);

          const data = await hubspotFetch<{ id: string; properties: unknown }>('/crm/v3/objects/deals', 'POST', { properties });
          log.info('hubspot_createDeal', { id: data.id, name: args.dealname, trace_id: traceId });
          return { success: true, dealId: data.id, properties: data.properties, source: 'hubspot' };
        } catch (err) {
          return { error: `HubSpot deal create failed: ${(err as Error).message}` };
        }
      },
    },

    // ── Advisory: CRM Setup Optimization (original) ──
    {
      name: 'hubspot_advise',
      description: 'HubSpot CRM setup, pipelines, automations, free tier optimization — advisory.',
      parameters: {
        type: 'object',
        properties: {
          business: { type: 'string', description: 'Business name' },
          current_crm: { type: 'string', description: 'Current CRM' },
          contact_count: { type: 'number', description: 'Number of contacts' },
        },
        required: ['business'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const raw = await callLLM(SYS, JSON.stringify(args));
        let p;
        try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; }
        p.source = 'advisory';
        log.info('hubspot_advise', { trace_id: traceId });
        return p;
      },
    },
  ];
}
