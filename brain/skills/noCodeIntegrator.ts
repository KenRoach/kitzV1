/**
 * No-Code Integrator skill — Zapier, Make, n8n, Airtable, Notion integrations.
 * Owner: CTO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface IntegrationPlan {
  integrations: Array<{ source: string; destination: string; tool: string; complexity: string; useCase: string }>;
  stack: { recommended: string[]; why: string };
  costEstimate: string; setupTime: string; alternatives: string[]; actionSteps: string[];
}
export interface NoCodeOptions { business: string; currentTools: string[]; needs: string[]; budget?: string; language?: string; }

const SYSTEM = 'You are a no-code integration advisor for LatAm SMBs. Connect tools without code using Zapier, Make, n8n, and native integrations. Spanish default.';
const FORMAT = 'Respond with JSON: { "integrations": [{ "source": string, "destination": string, "tool": string, "complexity": string, "useCase": string }], "stack": { "recommended": [string], "why": string }, "costEstimate": string, "setupTime": string, "alternatives": [string], "actionSteps": [string] }';

export async function planIntegrations(options: NoCodeOptions, llmClient?: LLMClient): Promise<IntegrationPlan> {
  if (llmClient) {
    const prompt = `No-code integrations for: ${options.business}\nTools: ${options.currentTools.join(', ')}\nNeeds: ${options.needs.join(', ')}\nBudget: ${options.budget ?? 'low'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as IntegrationPlan; } catch { /* fall through */ }
  }
  return {
    integrations: [{ source: 'WhatsApp', destination: 'CRM (Kitz)', tool: 'n8n / built-in', complexity: 'Baja', useCase: 'Auto-crear contacto cuando alguien escribe' }],
    stack: { recommended: ['Kitz (CRM + AI)', 'n8n (automatización)', 'Google Sheets (reportes)'], why: 'Stack gratis/low-cost con máxima flexibilidad' },
    costEstimate: '$0-20/mes (n8n self-hosted + Google Sheets gratis)', setupTime: '1-2 horas por integración',
    alternatives: ['Zapier: más fácil pero $20-50/mes', 'Make: intermedio $9-16/mes', 'Directo API: gratis pero requiere código'],
    actionSteps: ['Lista todas las herramientas que usas', 'Identifica 2-3 tareas repetitivas que conecten herramientas', 'Empieza con 1 automatización simple en n8n'],
  };
}
