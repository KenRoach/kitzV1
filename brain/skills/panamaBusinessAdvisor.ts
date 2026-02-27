/**
 * Panama Business Advisor skill — Registration, taxes, labor law, compliance.
 * Owner: HeadIntelligenceRisk agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface PanamaBusinessAdvice {
  registration: { steps: string[]; estimatedCost: string; timeline: string; entity_types: string[] };
  taxes: { itbms: string; incomeRate: string; filings: string[]; deadlines: string[] };
  labor: { minimumWage: string; benefits: string[]; termination: string; socialSecurity: string };
  compliance: { permits: string[]; municipality: string; dgi: string; css: string };
  banking: { recommended: string[]; requirements: string[]; tips: string[] };
  actionSteps: string[];
}

export interface PanamaBusinessOptions { businessType: string; employees?: number; revenue?: number; question?: string; language?: string; }

const SYSTEM = 'You are a Panama business advisor. Expert in Panamanian business registration (Registro Público), DGI taxes (ITBMS 7%), CSS (social security), labor code, municipality permits, and SEM. Default language: Spanish.';
const FORMAT = 'Respond with JSON: { "registration": { "steps": [string], "estimatedCost": string, "timeline": string, "entity_types": [string] }, "taxes": { "itbms": string, "incomeRate": string, "filings": [string], "deadlines": [string] }, "labor": { "minimumWage": string, "benefits": [string], "termination": string, "socialSecurity": string }, "compliance": { "permits": [string], "municipality": string, "dgi": string, "css": string }, "banking": { "recommended": [string], "requirements": [string], "tips": [string] }, "actionSteps": [string] }';

export async function advisePanamaBusiness(options: PanamaBusinessOptions, llmClient?: LLMClient): Promise<PanamaBusinessAdvice> {
  if (llmClient) {
    const prompt = `Panama business advice for: ${options.businessType}\nEmployees: ${options.employees ?? 0}\n${options.question ? `Question: ${options.question}\n` : ''}\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as PanamaBusinessAdvice; } catch { /* fall through */ }
  }
  return {
    registration: { steps: ['Reservar nombre en Registro Público', 'Redactar pacto social (abogado)', 'Inscripción en Registro Público', 'Obtener Aviso de Operación (municipio)', 'Registrarse en DGI (RUC)', 'Registrarse en CSS'], estimatedCost: '$500-1500 (incluye abogado)', timeline: '2-4 semanas', entity_types: ['S.A. (Sociedad Anónima)', 'SRL (Sociedad de Responsabilidad Limitada)', 'Persona Natural'] },
    taxes: { itbms: '7% sobre ventas (equivalente a IVA)', incomeRate: '25% corporativo / progresivo para personas', filings: ['Declaración de ITBMS (mensual)', 'Declaración de renta (anual)', 'Planilla CSS (mensual)'], deadlines: ['ITBMS: día 15 del mes siguiente', 'Renta: 31 de marzo', 'CSS: primeros 3 días del mes'] },
    labor: { minimumWage: 'B/. 326-624/mes (varía por sector)', benefits: ['Décimo tercer mes (3 pagos/año)', 'Vacaciones: 30 días/año', 'Prima de antigüedad', 'Licencia de maternidad: 14 semanas'], termination: 'Preaviso + indemnización según antigüedad', socialSecurity: 'CSS: 12.25% empleador + 9.75% empleado' },
    compliance: { permits: ['Aviso de Operación', 'Permiso de manipulación (alimentos)', 'Certificado de fumigación'], municipality: 'Municipio de Panamá / distrito correspondiente', dgi: 'Dirección General de Ingresos (DGI)', css: 'Caja de Seguro Social (CSS)' },
    banking: { recommended: ['Banco General', 'BAC', 'Banistmo'], requirements: ['Pacto social', 'RUC', 'Aviso de Operación', 'ID de representante legal'], tips: ['Abre cuenta corriente separada para el negocio', 'Activa Yappy Business para cobros'] },
    actionSteps: ['Consulta un abogado para elegir tipo de sociedad', 'Registra el nombre en Registro Público', 'Obtén tu RUC en DGI', 'Registra empleados en CSS'],
  };
}
