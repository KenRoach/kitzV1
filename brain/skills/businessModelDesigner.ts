/**
 * Business Model Designer skill — Canvas, revenue models, unit economics.
 * Owner: CEO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface BusinessModelCanvas {
  valueProposition: string[]; customerSegments: string[]; channels: string[];
  revenueStreams: string[]; keyResources: string[]; keyActivities: string[];
  keyPartners: string[]; costStructure: string[]; customerRelationships: string[];
}
export interface BusinessModelResult {
  canvas: BusinessModelCanvas;
  revenueModel: { type: string; pricing: string; projectedMRR: string };
  unitEconomics: { cac: string; ltv: string; ltvCacRatio: string; paybackMonths: string };
  competitiveAdvantage: string[];
  risks: string[];
  actionSteps: string[];
}
export interface BusinessModelOptions { business: string; industry: string; targetCustomer: string; currentRevenue?: number; currency?: string; language?: string; }

const SYSTEM = 'You are a business model advisor using Lean Canvas and Osterwalder frameworks for LatAm SMBs. Analyze unit economics, revenue models, and competitive moats. Spanish default.';
const FORMAT = 'Respond with JSON: { "canvas": { "valueProposition": [string], "customerSegments": [string], "channels": [string], "revenueStreams": [string], "keyResources": [string], "keyActivities": [string], "keyPartners": [string], "costStructure": [string], "customerRelationships": [string] }, "revenueModel": object, "unitEconomics": object, "competitiveAdvantage": [string], "risks": [string], "actionSteps": [string] }';

export async function designBusinessModel(options: BusinessModelOptions, llmClient?: LLMClient): Promise<BusinessModelResult> {
  if (llmClient) {
    const prompt = `Business model for: ${options.business} (${options.industry})\nCustomer: ${options.targetCustomer}\nRevenue: ${options.currency ?? 'USD'} ${options.currentRevenue ?? 0}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as BusinessModelResult; } catch { /* fall through */ }
  }
  return {
    canvas: { valueProposition: [`${options.business} resuelve [problema] para ${options.targetCustomer}`], customerSegments: [options.targetCustomer], channels: ['WhatsApp', 'Instagram', 'Referidos'], revenueStreams: ['Venta directa', 'Suscripción'], keyResources: ['Equipo', 'Tecnología', 'Red de clientes'], keyActivities: ['Ventas', 'Servicio al cliente', 'Marketing'], keyPartners: ['Proveedores', 'Distribuidores'], costStructure: ['Personal', 'Marketing', 'Tecnología', 'Operaciones'], customerRelationships: ['WhatsApp directo', 'Soporte personalizado'] },
    revenueModel: { type: 'Híbrido (venta + recurrencia)', pricing: 'Freemium → pagado', projectedMRR: 'TBD — necesita data de conversión' },
    unitEconomics: { cac: 'Medir costo de adquisición por canal', ltv: 'AOV × frecuencia × retención', ltvCacRatio: 'Objetivo: > 3x', paybackMonths: 'Objetivo: < 6 meses' },
    competitiveAdvantage: ['Relación directa con clientes vía WhatsApp', 'Conocimiento del mercado local'],
    risks: ['Dependencia de un solo canal', 'Márgenes bajos sin escala'],
    actionSteps: ['Completa tu Lean Canvas', 'Calcula CAC y LTV reales', 'Valida con 10 clientes antes de escalar'],
  };
}
