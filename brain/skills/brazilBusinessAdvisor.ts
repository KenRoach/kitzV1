/**
 * Brazil Business Advisor skill — CNPJ, Simples Nacional, PIX, MEI.
 * Owner: HeadIntelligenceRisk agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface BrazilBusinessAdvice {
  registration: { steps: string[]; estimatedCost: string; timeline: string; entityTypes: string[] };
  taxes: { simplesNacional: string; regimes: string[]; filings: string[]; nfe: string };
  labor: { minimumWage: string; benefits: string[]; inss: string; fgts: string };
  compliance: { receita: string; juntaComercial: string; alvara: string; permits: string[] };
  payments: { pix: string; boleto: string; tips: string[] };
  actionSteps: string[];
}

export interface BrazilBusinessOptions { businessType: string; revenue?: number; employees?: number; question?: string; language?: string; }

const SYSTEM = 'You are a Brazil business advisor. Expert in Receita Federal (CNPJ), Simples Nacional, MEI, ICMS, ISS, PIX, NF-e, CLT. Default language: Portuguese (or Spanish if requested).';
const FORMAT = 'Respond with JSON: { "registration": { "steps": [string], "estimatedCost": string, "timeline": string, "entityTypes": [string] }, "taxes": { "simplesNacional": string, "regimes": [string], "filings": [string], "nfe": string }, "labor": { "minimumWage": string, "benefits": [string], "inss": string, "fgts": string }, "compliance": { "receita": string, "juntaComercial": string, "alvara": string, "permits": [string] }, "payments": { "pix": string, "boleto": string, "tips": [string] }, "actionSteps": [string] }';

export async function adviseBrazilBusiness(options: BrazilBusinessOptions, llmClient?: LLMClient): Promise<BrazilBusinessAdvice> {
  if (llmClient) {
    const prompt = `Brazil business advice for: ${options.businessType}\nRevenue: BRL ${options.revenue ?? 0}/year\nEmployees: ${options.employees ?? 0}\n${options.question ? `Question: ${options.question}\n` : ''}\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as BrazilBusinessAdvice; } catch { /* fall through */ }
  }
  return {
    registration: { steps: ['Abrir MEI ou empresa no Portal do Empreendedor', 'Obter CNPJ na Receita Federal', 'Registro na Junta Comercial do estado', 'Alvará de funcionamento municipal', 'Inscrição estadual (ICMS) se vender produtos'], estimatedCost: 'MEI: grátis / Empresa: R$ 500-2000', timeline: '1-2 semanas (MEI: 1 dia)', entityTypes: ['MEI (< R$ 81,000/ano, 1 funcionário)', 'ME/EPP — Simples Nacional (< R$ 4.8M)', 'Ltda./S.A. — Lucro Presumido/Real'] },
    taxes: { simplesNacional: 'Alíquota única de 4-33% (varia por faturamento e atividade)', regimes: ['Simples Nacional (< R$ 4.8M)', 'Lucro Presumido', 'Lucro Real', 'MEI: R$ 75.90/mês (DAS fixo)'], filings: ['DAS mensal (Simples/MEI)', 'Declaração anual (DASN-SIMEI para MEI)', 'NF-e por venda', 'DIRF, ECF (outros regimes)'], nfe: 'Nota Fiscal eletrônica obrigatória — use emissores gratuitos (Sebrae, Bling)' },
    labor: { minimumWage: 'R$ 1,518/mês (2025)', benefits: ['13º salário', 'Férias: 30 dias + 1/3', 'FGTS: 8%', 'Vale-transporte', 'Licença maternidade: 120 dias'], inss: 'INSS patronal: 20% (Simples: incluso no DAS)', fgts: 'FGTS: 8% do salário — depósito mensal obrigatório' },
    compliance: { receita: 'Receita Federal do Brasil', juntaComercial: 'Junta Comercial do estado', alvara: 'Prefeitura municipal', permits: ['Alvará de funcionamento', 'Certificado de Vigilância Sanitária (alimentos)', 'Corpo de Bombeiros', 'Licença ambiental (se aplicável)'] },
    payments: { pix: 'PIX: instantâneo, grátis para PF, ~0.5-1% para PJ em gateways', boleto: 'Boleto bancário: R$ 2-5 por emissão, 1-3 dias para compensar', tips: ['PIX é o método #1 no Brasil — aceite sempre', 'Use Nubank PJ ou Banco Inter para conta grátis', 'PagSeguro e Mercado Pago para maquininhas'] },
    actionSteps: ['Avalie se MEI se aplica ao seu caso (< R$ 81k/ano)', 'Abra o CNPJ no Portal do Empreendedor', 'Configure PIX empresarial no seu banco', 'Emita NF-e desde a primeira venda'],
  };
}
