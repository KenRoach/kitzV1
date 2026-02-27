/**
 * Analytics Advisor skill — KPIs, dashboards, data-driven decisions.
 * Owner: CTO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface KPIDefinition { name: string; formula: string; target: string; frequency: string; }
export interface AnalyticsAdvice {
  kpis: KPIDefinition[]; dashboardLayout: string[]; dataSourceRecommendations: string[];
  insightsFramework: string; commonMistakes: string[]; toolRecommendations: string[]; actionSteps: string[];
}
export interface AnalyticsOptions { business: string; industry: string; goals?: string[]; currentTools?: string[]; language?: string; }

const SYSTEM = 'You are an analytics advisor for LatAm SMBs. Recommend KPIs, dashboard design, data tools. Keep it simple — most SMBs use spreadsheets. Spanish default.';
const FORMAT = 'Respond with JSON: { "kpis": [{ "name": string, "formula": string, "target": string, "frequency": string }], "dashboardLayout": [string], "dataSourceRecommendations": [string], "insightsFramework": string, "commonMistakes": [string], "toolRecommendations": [string], "actionSteps": [string] }';

export async function adviseAnalytics(options: AnalyticsOptions, llmClient?: LLMClient): Promise<AnalyticsAdvice> {
  if (llmClient) {
    const prompt = `Analytics for: ${options.business} (${options.industry})\nGoals: ${(options.goals ?? []).join(', ') || 'growth'}\nTools: ${(options.currentTools ?? []).join(', ') || 'none'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as AnalyticsAdvice; } catch { /* fall through */ }
  }
  return {
    kpis: [
      { name: 'Revenue mensual', formula: 'Suma de ventas del mes', target: '+10% mes a mes', frequency: 'Mensual' },
      { name: 'CAC', formula: 'Gasto marketing / Clientes nuevos', target: '< 1/3 del LTV', frequency: 'Mensual' },
      { name: 'Tasa de conversión', formula: 'Ventas / Leads × 100', target: '> 5%', frequency: 'Semanal' },
      { name: 'NPS', formula: 'Promotores - Detractores', target: '> 50', frequency: 'Trimestral' },
    ],
    dashboardLayout: ['Fila 1: Revenue + Orders + New Customers (cards)', 'Fila 2: Revenue trend (línea) + Top products (barras)', 'Fila 3: Funnel conversion + Customer satisfaction'],
    dataSourceRecommendations: ['CRM de Kitz (contactos, pedidos)', 'WhatsApp (mensajes, respuestas)', 'Pagos (transacciones)', 'Redes sociales (seguidores, engagement)'],
    insightsFramework: 'Pregunta → Dato → Insight → Acción. Siempre termina con una acción.',
    commonMistakes: ['Medir todo sin actuar', 'Ignorar métricas de retención', 'No segmentar por canal/producto'],
    toolRecommendations: ['Google Sheets (gratis, colaborativo)', 'Kitz Dashboard (integrado)', 'Google Analytics (web)', 'Meta Business Suite (redes)'],
    actionSteps: ['Define 3-5 KPIs principales', 'Crea un dashboard simple (Google Sheets o Kitz)', 'Revisa métricas cada lunes — 15 min', 'Toma 1 decisión basada en datos cada semana'],
  };
}
