/**
 * Competitive Analyst skill — SWOT, Porter's 5 Forces, competitive mapping.
 * Owner: CEO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface CompetitorProfile { name: string; strengths: string[]; weaknesses: string[]; pricePoint: string; positioning: string; }
export interface CompetitiveAnalysis {
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  porterForces: { rivalry: string; newEntrants: string; substitutes: string; buyerPower: string; supplierPower: string };
  competitors: CompetitorProfile[];
  differentiators: string[];
  blindSpots: string[];
  actionSteps: string[];
}
export interface CompetitiveOptions { business: string; industry: string; competitors?: string[]; country?: string; language?: string; }

const SYSTEM = 'You are a competitive analyst for LatAm SMBs. SWOT, Porter 5 Forces, competitor mapping. Be brutally honest about weaknesses. Spanish default.';
const FORMAT = 'Respond with JSON: { "swot": { "strengths": [string], "weaknesses": [string], "opportunities": [string], "threats": [string] }, "porterForces": object, "competitors": [object], "differentiators": [string], "blindSpots": [string], "actionSteps": [string] }';

export async function analyzeCompetition(options: CompetitiveOptions, llmClient?: LLMClient): Promise<CompetitiveAnalysis> {
  if (llmClient) {
    const prompt = `Competitive analysis for: ${options.business} (${options.industry})\nCountry: ${options.country ?? 'LatAm'}\nCompetitors: ${(options.competitors ?? []).join(', ') || 'unknown'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as CompetitiveAnalysis; } catch { /* fall through */ }
  }
  return {
    swot: { strengths: ['Conocimiento del mercado local', 'Relación directa con clientes'], weaknesses: ['Recursos limitados', 'Falta de marca establecida'], opportunities: ['Mercado digital en crecimiento en LatAm', 'Competidores tradicionales lentos en digital'], threats: ['Competidores con más capital', 'Cambios regulatorios'] },
    porterForces: { rivalry: 'Media — mercado fragmentado', newEntrants: 'Alta — bajas barreras de entrada', substitutes: 'Media — soluciones informales', buyerPower: 'Alta — muchas opciones', supplierPower: 'Baja — múltiples proveedores' },
    competitors: (options.competitors ?? ['Competidor A']).map(c => ({ name: c, strengths: ['Marca conocida'], weaknesses: ['Servicio impersonal'], pricePoint: 'Similar', positioning: 'Generalista' })),
    differentiators: ['Atención personalizada', 'Rapidez de respuesta (WhatsApp)', 'Precio competitivo'],
    blindSpots: ['¿Qué hace tu competidor mejor que tú?', '¿Qué clientes perdiste y por qué?'],
    actionSteps: ['Compra el producto de tu competidor — experimenta como cliente', 'Pregunta a 5 clientes por qué te eligieron', 'Identifica 1 diferenciador que nadie más tenga'],
  };
}
