/**
 * HubSpot Advisor skill — CRM setup, pipelines, automation, free tier optimization.
 * Owner: CRO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface HubSpotAdvice {
  crmSetup: { properties: string[]; pipelines: string[]; lifecycle: string[] };
  automations: Array<{ name: string; trigger: string; action: string }>;
  freeTierTips: string[]; migrationSteps: string[]; integrations: string[]; actionSteps: string[];
}
export interface HubSpotOptions { business: string; currentCRM?: string; contactCount?: number; needs?: string[]; language?: string; }

const SYSTEM = 'You are a HubSpot CRM advisor for LatAm SMBs. Optimize free tier, set up pipelines, automate follow-ups. Also advise on Kitz as alternative. Spanish default.';
const FORMAT = 'Respond with JSON: { "crmSetup": { "properties": [string], "pipelines": [string], "lifecycle": [string] }, "automations": [object], "freeTierTips": [string], "migrationSteps": [string], "integrations": [string], "actionSteps": [string] }';

export async function adviseHubSpot(options: HubSpotOptions, llmClient?: LLMClient): Promise<HubSpotAdvice> {
  if (llmClient) {
    const prompt = `HubSpot advice for: ${options.business}\nCurrent CRM: ${options.currentCRM ?? 'none'}\nContacts: ${options.contactCount ?? 0}\nNeeds: ${(options.needs ?? []).join(', ')}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as HubSpotAdvice; } catch { /* fall through */ }
  }
  return {
    crmSetup: { properties: ['Nombre', 'Teléfono (WhatsApp)', 'Email', 'Fuente', 'Valor potencial', 'Última interacción'], pipelines: ['Nuevo → Contactado → Interesado → Propuesta → Cerrado/Ganado → Cerrado/Perdido'], lifecycle: ['Suscriptor → Lead → MQL → SQL → Oportunidad → Cliente → Promotor'] },
    automations: [{ name: 'Follow-up automático', trigger: 'Lead sin respuesta en 3 días', action: 'Enviar email de seguimiento' }, { name: 'Bienvenida', trigger: 'Nuevo contacto creado', action: 'Enviar secuencia de bienvenida' }],
    freeTierTips: ['Hasta 1,000,000 contactos gratis', 'Forms y live chat incluidos', 'Email marketing básico (2,000/mes)', 'Usa Kitz para WhatsApp + HubSpot para email'],
    migrationSteps: ['Exporta contactos actuales a CSV', 'Mapea campos al formato HubSpot', 'Importa y deduplica', 'Configura pipeline de ventas'],
    integrations: ['Kitz ↔ HubSpot (vía n8n webhook)', 'WhatsApp → HubSpot (crear contacto)', 'HubSpot → Email (secuencias automáticas)'],
    actionSteps: ['Crea cuenta gratis en HubSpot', 'Configura propiedades personalizadas', 'Importa tus contactos actuales', 'Conecta con Kitz vía webhook'],
  };
}
