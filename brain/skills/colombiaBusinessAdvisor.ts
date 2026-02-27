/**
 * Colombia Business Advisor skill — NIT, DIAN, regulations.
 * Owner: HeadIntelligenceRisk agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface ColombiaBusinessAdvice {
  registration: { steps: string[]; estimatedCost: string; timeline: string; entityTypes: string[] };
  taxes: { iva: string; renta: string; retefuente: string; filings: string[] };
  labor: { minimumWage: string; benefits: string[]; eps: string; arl: string };
  compliance: { dian: string; camara: string; rut: string; permits: string[] };
  actionSteps: string[];
}

export interface ColombiaBusinessOptions { businessType: string; employees?: number; question?: string; language?: string; }

const SYSTEM = 'You are a Colombia business advisor. Expert in DIAN (NIT, RUT, factura electrónica), Cámara de Comercio, EPS, ARL, ICA, Reteica. Default language: Spanish.';
const FORMAT = 'Respond with JSON: { "registration": { "steps": [string], "estimatedCost": string, "timeline": string, "entityTypes": [string] }, "taxes": { "iva": string, "renta": string, "retefuente": string, "filings": [string] }, "labor": { "minimumWage": string, "benefits": [string], "eps": string, "arl": string }, "compliance": { "dian": string, "camara": string, "rut": string, "permits": [string] }, "actionSteps": [string] }';

export async function adviseColombianBusiness(options: ColombiaBusinessOptions, llmClient?: LLMClient): Promise<ColombiaBusinessAdvice> {
  if (llmClient) {
    const prompt = `Colombia business advice for: ${options.businessType}\nEmployees: ${options.employees ?? 0}\n${options.question ? `Question: ${options.question}\n` : ''}\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as ColombiaBusinessAdvice; } catch { /* fall through */ }
  }
  return {
    registration: { steps: ['Registro en Cámara de Comercio', 'Obtener NIT y RUT en DIAN', 'Inscripción en ICA (impuesto municipal)', 'Registro de empleados en EPS y ARL', 'Apertura de cuenta bancaria empresarial'], estimatedCost: 'COP 500,000-2,000,000', timeline: '1-3 semanas', entityTypes: ['SAS (Sociedad por Acciones Simplificada)', 'Persona Natural', 'S.A.', 'Ltda.'] },
    taxes: { iva: '19% (excluidos: canasta básica)', renta: '35% corporativo / tablas para personas', retefuente: 'Retención en la fuente según actividad', filings: ['Declaración bimestral de IVA', 'Declaración anual de renta', 'Retención mensual', 'Factura electrónica obligatoria'] },
    labor: { minimumWage: 'COP 1,423,500/mes + auxilio transporte COP 200,000 (2025)', benefits: ['Prima: 1 mes/año', 'Cesantías: 1 mes/año', 'Vacaciones: 15 días hábiles', 'Intereses sobre cesantías: 12%'], eps: 'EPS: 12.5% (8.5% empleador + 4% empleado)', arl: 'ARL: 0.522-6.96% según riesgo (empleador)' },
    compliance: { dian: 'Dirección de Impuestos y Aduanas Nacionales', camara: 'Cámara de Comercio de la ciudad', rut: 'Registro Único Tributario — obligatorio para facturar', permits: ['Registro mercantil', 'Concepto sanitario (alimentos)', 'Uso de suelo', 'Registro INVIMA (alimentos/cosméticos)'] },
    actionSteps: ['Constituye una SAS (más flexible para emprendedores)', 'Obtén tu RUT en DIAN', 'Configura factura electrónica', 'Afilia empleados a EPS y ARL desde el día 1'],
  };
}
