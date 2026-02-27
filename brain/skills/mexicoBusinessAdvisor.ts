/**
 * Mexico Business Advisor skill — RFC, SAT, IMSS, labor law.
 * Owner: HeadIntelligenceRisk agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface MexicoBusinessAdvice {
  registration: { steps: string[]; estimatedCost: string; timeline: string; regimes: string[] };
  taxes: { iva: string; isr: string; filings: string[]; cfdi: string };
  labor: { minimumWage: string; benefits: string[]; imss: string; infonavit: string };
  compliance: { sat: string; imss_reg: string; stps: string; permits: string[] };
  actionSteps: string[];
}

export interface MexicoBusinessOptions { businessType: string; regime?: string; employees?: number; question?: string; language?: string; }

const SYSTEM = 'You are a Mexico business advisor. Expert in SAT (RFC, CFDI), IMSS, INFONAVIT, ISR, IVA, RESICO, labor law. Default language: Spanish.';
const FORMAT = 'Respond with JSON: { "registration": { "steps": [string], "estimatedCost": string, "timeline": string, "regimes": [string] }, "taxes": { "iva": string, "isr": string, "filings": [string], "cfdi": string }, "labor": { "minimumWage": string, "benefits": [string], "imss": string, "infonavit": string }, "compliance": { "sat": string, "imss_reg": string, "stps": string, "permits": [string] }, "actionSteps": [string] }';

export async function adviseMexicoBusiness(options: MexicoBusinessOptions, llmClient?: LLMClient): Promise<MexicoBusinessAdvice> {
  if (llmClient) {
    const prompt = `Mexico business advice for: ${options.businessType}\nRegime: ${options.regime ?? 'RESICO or general'}\nEmployees: ${options.employees ?? 0}\n${options.question ? `Question: ${options.question}\n` : ''}\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as MexicoBusinessAdvice; } catch { /* fall through */ }
  }
  return {
    registration: { steps: ['Obtener RFC en SAT (portal o presencial)', 'Elegir régimen fiscal', 'Alta en IMSS (si tienes empleados)', 'Alta en INFONAVIT', 'Permisos municipales'], estimatedCost: '$2,000-10,000 MXN', timeline: '1-2 semanas', regimes: ['RESICO (Régimen Simplificado de Confianza) — hasta 3.5M MXN', 'Persona Física con Actividad Empresarial', 'Sociedad (S.A. de C.V., S. de R.L.)'] },
    taxes: { iva: '16% (8% en zona fronteriza)', isr: 'RESICO: 1-2.5% / General: 30% corporativo', filings: ['Declaración mensual de IVA', 'Declaración mensual de ISR', 'Declaración anual (abril)', 'CFDI por cada venta'], cfdi: 'Factura electrónica obligatoria — usa sistemas como Facturama, CONTPAQi' },
    labor: { minimumWage: '$278.80 MXN/día (2025)', benefits: ['Aguinaldo: 15 días', 'Vacaciones: 12 días (primer año)', 'Prima vacacional: 25%', 'PTU: reparto de utilidades'], imss: 'Cuota patronal ~30-35% del salario', infonavit: '5% del salario (crédito vivienda)' },
    compliance: { sat: 'Servicio de Administración Tributaria — RFC + e.firma', imss_reg: 'Registro patronal obligatorio con empleados', stps: 'Secretaría del Trabajo — NOM-035', permits: ['Uso de suelo municipal', 'Protección civil', 'Licencia sanitaria (alimentos)'] },
    actionSteps: ['Obtén tu RFC en SAT', 'Evalúa si RESICO te conviene (< 3.5M MXN)', 'Contrata un contador para CFDI y declaraciones', 'Registra empleados en IMSS desde el día 1'],
  };
}
