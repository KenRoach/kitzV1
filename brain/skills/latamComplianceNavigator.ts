/**
 * LATAM Compliance Navigator skill — Cross-border compliance, data privacy, trade.
 * Owner: HeadIntelligenceRisk agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface CountryCompliance { country: string; dataPrivacy: string; consumerProtection: string; ecommerce: string; keyRegulator: string; }
export interface LatamComplianceAdvice {
  countries: CountryCompliance[];
  crossBorderRules: string[];
  dataPrivacy: { gdprEquivalents: string[]; consentRequirements: string[]; dataTransfer: string[] };
  ecommerceCompliance: string[];
  whatsappBusinessRules: string[];
  riskAreas: string[];
  actionSteps: string[];
}

export interface LatamComplianceOptions {
  business: string;
  countries: string[];
  sellsOnline?: boolean;
  handlesPersonalData?: boolean;
  question?: string;
  language?: string;
}

const SYSTEM = 'You are a Latin America compliance navigator. Expert in data privacy (LGPD Brazil, Ley 1581 Colombia, etc.), consumer protection, e-commerce regulations, WhatsApp Business rules, and cross-border trade. Default language: Spanish.';
const FORMAT = 'Respond with JSON: { "countries": [{ "country": string, "dataPrivacy": string, "consumerProtection": string, "ecommerce": string, "keyRegulator": string }], "crossBorderRules": [string], "dataPrivacy": { "gdprEquivalents": [string], "consentRequirements": [string], "dataTransfer": [string] }, "ecommerceCompliance": [string], "whatsappBusinessRules": [string], "riskAreas": [string], "actionSteps": [string] }';

export async function navigateLatamCompliance(options: LatamComplianceOptions, llmClient?: LLMClient): Promise<LatamComplianceAdvice> {
  if (llmClient) {
    const prompt = `Compliance for: ${options.business} in ${options.countries.join(', ')}\nOnline sales: ${options.sellsOnline ?? true}\nPersonal data: ${options.handlesPersonalData ?? true}\n${options.question ? `Question: ${options.question}\n` : ''}\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as LatamComplianceAdvice; } catch { /* fall through */ }
  }
  return {
    countries: [
      { country: 'Panama', dataPrivacy: 'Ley 81 de 2019 (Protección de Datos)', consumerProtection: 'ACODECO', ecommerce: 'No regulación específica', keyRegulator: 'ANTAI (Transparencia)' },
      { country: 'Mexico', dataPrivacy: 'LFPDPPP (Ley Federal de Protección de Datos)', consumerProtection: 'PROFECO', ecommerce: 'NOM-151-SCFI', keyRegulator: 'INAI' },
      { country: 'Colombia', dataPrivacy: 'Ley 1581 de 2012 + Decreto 1377', consumerProtection: 'SIC', ecommerce: 'Ley 527 de 1999', keyRegulator: 'SIC (Superintendencia de Industria y Comercio)' },
      { country: 'Brazil', dataPrivacy: 'LGPD (Lei Geral de Proteção de Dados)', consumerProtection: 'CDC + PROCON', ecommerce: 'Decreto 7.962/2013', keyRegulator: 'ANPD' },
    ],
    crossBorderRules: ['Cumple con la ley de datos del país del cliente, no solo del tuyo', 'Impuestos: revisa si aplica IVA/ITBMS del país destino', 'Aduanas: productos físicos requieren declaración de exportación', 'Pagos: verifica restricciones de cambio de divisas'],
    dataPrivacy: { gdprEquivalents: ['Brazil: LGPD', 'Colombia: Ley 1581', 'Mexico: LFPDPPP', 'Panama: Ley 81'], consentRequirements: ['Consentimiento explícito para datos personales', 'Opción de opt-out en marketing', 'Política de privacidad visible en sitio web'], dataTransfer: ['Transferencia internacional requiere país con nivel adecuado', 'O consentimiento explícito del titular', 'Cláusulas contractuales estándar para proveedores cloud'] },
    ecommerceCompliance: ['Política de devolución visible (7-30 días según país)', 'Precio final con impuestos incluidos', 'Términos y condiciones accesibles', 'Factura electrónica por cada venta'],
    whatsappBusinessRules: ['No spam: solo mensajes a contactos que consintieron', 'Usa plantillas aprobadas para mensajes proactivos', 'Incluye opción de opt-out en cada broadcast', 'Respeta horario local (no envíes de noche)', 'WhatsApp puede banear números con alta tasa de reportes'],
    riskAreas: ['Enviar marketing sin consentimiento = multas', 'No emitir factura electrónica = problemas fiscales', 'Vender en otro país sin declarar = evasión', 'No tener política de privacidad = riesgo legal'],
    actionSteps: ['Publica tu política de privacidad', 'Agrega checkbox de consentimiento en formularios', 'Configura opt-out en mensajes de WhatsApp', 'Consulta un abogado local para cada país donde operes'],
  };
}
