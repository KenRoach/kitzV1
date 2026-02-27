/**
 * Partnership Advisor skill — Strategic alliances, co-marketing, distribution.
 * Owner: CRO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface PartnerProfile { type: string; idealPartner: string; valueExchange: string; approach: string; }
export interface PartnershipStrategy {
  partnerTypes: PartnerProfile[];
  outreachPlan: Array<{ step: number; action: string; timeline: string }>;
  proposalTemplate: string;
  dealStructures: string[];
  redFlags: string[];
  successMetrics: string[];
  actionSteps: string[];
}
export interface PartnershipOptions { business: string; product: string; goal: string; targetPartners?: string[]; language?: string; }

const SYSTEM = 'You are a partnership strategist for LatAm SMBs. Design win-win alliances, co-marketing, distribution partnerships. Spanish default.';
const FORMAT = 'Respond with JSON: { "partnerTypes": [{ "type": string, "idealPartner": string, "valueExchange": string, "approach": string }], "outreachPlan": [object], "proposalTemplate": string, "dealStructures": [string], "redFlags": [string], "successMetrics": [string], "actionSteps": [string] }';

export async function advisePartnership(options: PartnershipOptions, llmClient?: LLMClient): Promise<PartnershipStrategy> {
  if (llmClient) {
    const prompt = `Partnership strategy for: ${options.business}\nProduct: ${options.product}\nGoal: ${options.goal}\nTargets: ${(options.targetPartners ?? []).join(', ') || 'TBD'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as PartnershipStrategy; } catch { /* fall through */ }
  }
  return {
    partnerTypes: [
      { type: 'Distribución', idealPartner: 'Negocio con tu cliente ideal como audiencia', valueExchange: 'Tú provees producto, ellos proveen clientes', approach: 'Ofrece comisión por referido o co-branding' },
      { type: 'Co-marketing', idealPartner: 'Negocio complementario (no competidor)', valueExchange: 'Ambos comparten audiencia', approach: 'Live conjunto, bundle, o contenido cruzado' },
      { type: 'Tecnología', idealPartner: 'Herramienta que tus clientes ya usan', valueExchange: 'Integración que beneficia a ambas bases', approach: 'API integration o plugin' },
    ],
    outreachPlan: [
      { step: 1, action: 'Identifica 10 partners potenciales', timeline: 'Semana 1' },
      { step: 2, action: 'Investiga y personaliza propuesta', timeline: 'Semana 2' },
      { step: 3, action: 'Primer contacto (WhatsApp/email)', timeline: 'Semana 3' },
      { step: 4, action: 'Reunión + propuesta formal', timeline: 'Semana 4' },
    ],
    proposalTemplate: 'Hola [nombre], soy [tu nombre] de [negocio]. Vi que atiendes a [audiencia similar]. Tengo una idea que beneficia a ambos: [propuesta]. ¿Te interesa una llamada de 15 min?',
    dealStructures: ['Comisión por referido (10-20%)', 'Revenue share (50/50)', 'Intercambio de servicios', 'Bundle con descuento conjunto'],
    redFlags: ['Partner que solo quiere tu base de clientes', 'Acuerdo sin métricas claras', 'Exclusividad en fase temprana'],
    successMetrics: ['Clientes referidos por mes', 'Revenue generado por partnership', 'Satisfacción de clientes compartidos'],
    actionSteps: ['Lista 5 negocios complementarios al tuyo', 'Contacta al que más se alinea esta semana', 'Propón un piloto de 30 días antes de formalizar'],
  };
}
