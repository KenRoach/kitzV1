/**
 * Crypto Advisor — AI-powered blockchain investment & compliance skill.
 * Owner: CFO Agent.
 *
 * Provides portfolio allocation advice with deep LatAm regulatory awareness.
 * Conservative by default — prioritizes stablecoin reserves and cash flow safety.
 * Fallback logic works without LLM (hardcoded allocation tables).
 */

import type { LLMClient } from './callTranscription.js';

// ── Types ──

export interface CryptoPortfolioAdvice {
  allocation: Array<{ asset: string; percentage: number; rationale: string }>;
  stablecoin_reserve_pct: number;
  total_volatile_pct: number;
  monthly_dca_suggestion_usd: number;
  on_ramp_options: string[];
  regulatory_notes: string;
  risks: string[];
  action_steps: string[];
  disclaimer: string;
}

export interface CryptoAdvisorOptions {
  investmentAmountUsd: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  country?: string;
  businessType?: string;
  timeHorizon?: string;
  monthlyRevenueUsd?: number;
  language?: string;
}

export interface CryptoComplianceCheck {
  verdict: 'COMPLIANT' | 'NON_COMPLIANT' | 'GRAY_AREA';
  country: string;
  operation: string;
  applicable_laws: string[];
  required_actions: string[];
  risks: string[];
}

export interface ComplianceCheckOptions {
  country: string;
  operation: string;
  amountUsd?: number;
  language?: string;
}

// ── System prompts ──

const PORTFOLIO_SYSTEM = `You are an expert crypto portfolio advisor for Latin American SMBs.
Deep knowledge of blockchain fundamentals, DeFi protocols, tokenomics, and LatAm regulations.
Conservative approach: always prioritize business cash flow. Max 30% of monthly revenue in volatile crypto.
Recommend 3-6 month stablecoin reserve. Consider local on/off ramps (Binance P2P, Bitso, Buda.com).
Default language: Spanish.

Respond with valid JSON:
{
  "allocation": [{ "asset": string, "percentage": number, "rationale": string }],
  "stablecoin_reserve_pct": number,
  "total_volatile_pct": number,
  "monthly_dca_suggestion_usd": number,
  "on_ramp_options": [string],
  "regulatory_notes": string,
  "risks": [string],
  "action_steps": [string],
  "disclaimer": "Este no es consejo financiero. Consulte a un asesor certificado."
}`;

const COMPLIANCE_SYSTEM = `You are a blockchain regulatory compliance expert for Latin America.
Knowledge of: Panama Ley 129, Mexico Ley Fintech, Colombia Superfinanciera sandbox, Brazil Lei 14.478, Chile Ley 21.521.
Give clear verdicts with specific law references. Default language: Spanish.

Respond with valid JSON:
{
  "verdict": "COMPLIANT"|"NON_COMPLIANT"|"GRAY_AREA",
  "country": string,
  "operation": string,
  "applicable_laws": [string],
  "required_actions": [string],
  "risks": [string]
}`;

// ── Fallback allocations (no LLM needed) ──

const FALLBACK_ALLOCATIONS: Record<string, Array<{ asset: string; percentage: number; rationale: string }>> = {
  conservative: [
    { asset: 'USDC', percentage: 50, rationale: 'Reserva estable — liquidez inmediata para operaciones' },
    { asset: 'USDT', percentage: 15, rationale: 'Diversificación de stablecoins — mayor liquidez P2P en LatAm' },
    { asset: 'BTC', percentage: 25, rationale: 'Reserva de valor a largo plazo — activo más establecido' },
    { asset: 'ETH', percentage: 10, rationale: 'Exposición a ecosistema DeFi con menor volatilidad que altcoins' },
  ],
  moderate: [
    { asset: 'USDC', percentage: 30, rationale: 'Reserva operativa en stablecoin' },
    { asset: 'BTC', percentage: 35, rationale: 'Core holding — máxima seguridad y liquidez' },
    { asset: 'ETH', percentage: 25, rationale: 'Ecosistema DeFi y staking yield (~3-4% APR)' },
    { asset: 'SOL', percentage: 10, rationale: 'Alto rendimiento, transacciones baratas para pagos' },
  ],
  aggressive: [
    { asset: 'USDC', percentage: 15, rationale: 'Reserva mínima de emergencia' },
    { asset: 'BTC', percentage: 30, rationale: 'Core position — beta al mercado crypto' },
    { asset: 'ETH', percentage: 25, rationale: 'DeFi + staking + L2 growth' },
    { asset: 'SOL', percentage: 15, rationale: 'High throughput L1, growing DeFi ecosystem' },
    { asset: 'LINK', percentage: 10, rationale: 'Infraestructura oracle — esencial para DeFi' },
    { asset: 'ARB', percentage: 5, rationale: 'L2 governance — play on Ethereum scaling' },
  ],
};

const ON_RAMPS: Record<string, string[]> = {
  panama: ['Binance P2P (Yappy, banco local)', 'Bitget P2P', 'Bybit P2P', 'ATMs Bitcoin Panamá'],
  mexico: ['Bitso (SPEI)', 'Binance P2P (SPEI/OXXO)', 'Mercado Pago crypto', 'Tauros'],
  colombia: ['Binance P2P (Nequi, Bancolombia)', 'Bitso Colombia', 'Buda.com'],
  brazil: ['Binance (Pix)', 'Mercado Bitcoin', 'Foxbit', 'Bitybank (Pix instant)'],
  chile: ['Buda.com (transferencia bancaria)', 'Binance P2P', 'CryptoMKT'],
  peru: ['Binance P2P (Yape, BCP)', 'Buda.com Peru'],
  costa_rica: ['Binance P2P (SINPE)', 'Bull Bitcoin'],
};

// ── Main functions ──

export async function adviseCryptoPortfolio(
  options: CryptoAdvisorOptions,
  llmClient?: LLMClient,
): Promise<CryptoPortfolioAdvice> {
  const { investmentAmountUsd, riskProfile, country = 'panama', monthlyRevenueUsd } = options;

  if (llmClient) {
    const prompt = `Portfolio advice for LatAm SMB:
Amount: $${investmentAmountUsd} USD
Risk: ${riskProfile}
Country: ${country}
Business: ${options.businessType || 'general'}
Horizon: ${options.timeHorizon || 'medium-term'}
Monthly revenue: $${monthlyRevenueUsd || 'unknown'} USD`;

    const response = await llmClient.complete({ prompt, system: PORTFOLIO_SYSTEM, tier: 'haiku' });
    try {
      const match = response.text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as CryptoPortfolioAdvice;
    } catch { /* fall through to hardcoded */ }
  }

  // Fallback — no LLM
  const allocation = FALLBACK_ALLOCATIONS[riskProfile] || FALLBACK_ALLOCATIONS.moderate;
  const stablePct = allocation.filter(a => ['USDC', 'USDT', 'DAI'].includes(a.asset)).reduce((s, a) => s + a.percentage, 0);
  const dcaSuggestion = monthlyRevenueUsd ? Math.min(investmentAmountUsd * 0.1, monthlyRevenueUsd * 0.1) : investmentAmountUsd * 0.1;

  return {
    allocation,
    stablecoin_reserve_pct: stablePct,
    total_volatile_pct: 100 - stablePct,
    monthly_dca_suggestion_usd: Math.round(dcaSuggestion),
    on_ramp_options: ON_RAMPS[country] || ON_RAMPS.panama,
    regulatory_notes: `Consulte regulación local en ${country}. Mantenga registros de todas las transacciones.`,
    risks: [
      'Volatilidad del mercado crypto puede superar 50% en períodos cortos',
      'Riesgo regulatorio: las leyes crypto en LatAm están en evolución constante',
      'Riesgo de custodia: use wallets con 2FA y backup de seed phrase',
      'Riesgo de liquidez: P2P spreads pueden ser 2-5% en mercados pequeños',
    ],
    action_steps: [
      'Abrir cuenta en exchange con KYC verificado',
      'Configurar wallet hardware para holdings > $1,000 USD',
      'Establecer DCA semanal automático',
      'Mantener registro de costo base para declaración fiscal',
      'Revisar allocación trimestralmente',
    ],
    disclaimer: 'Este no es consejo financiero. Consulte a un asesor certificado.',
  };
}

export async function checkCryptoCompliance(
  options: ComplianceCheckOptions,
  llmClient?: LLMClient,
): Promise<CryptoComplianceCheck> {
  const { country, operation, amountUsd } = options;

  if (llmClient) {
    const prompt = `Check compliance:
Country: ${country}
Operation: ${operation}
Amount: $${amountUsd || 'variable'} USD`;

    const response = await llmClient.complete({ prompt, system: COMPLIANCE_SYSTEM, tier: 'haiku' });
    try {
      const match = response.text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as CryptoComplianceCheck;
    } catch { /* fall through */ }
  }

  // Fallback — conservative default
  return {
    verdict: 'GRAY_AREA',
    country,
    operation,
    applicable_laws: [`Consulte legislación vigente de ${country} para operación: ${operation}`],
    required_actions: [
      'Consultar abogado especializado en fintech/crypto',
      'Verificar requisitos de registro ante autoridad financiera local',
      'Implementar KYC/AML básico si maneja fondos de terceros',
    ],
    risks: [
      'Marco regulatorio en evolución — monitorear cambios legislativos',
      'Posibles restricciones bancarias para cuentas asociadas a crypto',
    ],
  };
}
