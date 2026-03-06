/**
 * Fiat Currency & Exchange Rate Tools — Real-time FX, central bank rates, inflation, remittances.
 *
 * 7 tools:
 *   - fiat_exchangeRate          (low)    — Real-time exchange rates for LatAm currencies (USD/MXN, USD/COP, etc.)
 *   - fiat_currencyConverter     (low)    — Convert between any fiat currencies with live rates
 *   - fiat_centralBankRates      (low)    — Key interest rates for LatAm central banks (Banxico, BCB, BanRep, etc.)
 *   - fiat_inflationTracker      (low)    — Current & historical inflation data by country
 *   - fiat_remittanceAdvisor     (medium) — Compare remittance corridors: fees, speed, providers (Wise, Remitly, Western Union)
 *   - fiat_dollarizationAnalyzer (medium) — AI analysis of dollarization impact for business in dollarized vs local-currency economies
 *   - fiat_monetarySystemExplainer(low)   — Deep explainer on monetary system concepts: fractional reserve, M1/M2, CBDC, monetary policy
 *
 * Uses free APIs: ExchangeRate-API (free tier), frankfurter.app (ECB data).
 * Deep LatAm monetary knowledge hardcoded for offline fallback.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { callLLM } from './shared/callLLM.js';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('fiatCurrencyTools');

// ── LatAm Currency Knowledge Base ──

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  central_bank: string;
  central_bank_abbr: string;
  monetary_policy: string;
  regime: string;
  approximate_rate_per_usd: number; // Fallback rate
  key_facts: string[];
}

const LATAM_CURRENCIES: Record<string, CurrencyInfo> = {
  panama: {
    code: 'PAB',
    name: 'Balboa panameño',
    symbol: 'B/.',
    central_bank: 'Superintendencia de Bancos de Panamá',
    central_bank_abbr: 'SBP',
    monetary_policy: 'No independent monetary policy — pegged 1:1 to USD',
    regime: 'Full dollarization (USD circulates as legal tender alongside PAB)',
    approximate_rate_per_usd: 1.0,
    key_facts: [
      'Panama has been dollarized since 1904',
      'The Balboa exists only as coins — all bills are USD',
      'No central bank in the traditional sense — SBP regulates banks only',
      'No ability to print money or set interest rates independently',
      'Inflation closely tracks US CPI',
      'Banking hub: 70+ international banks, strong bank secrecy (weakening under FATF pressure)',
    ],
  },
  mexico: {
    code: 'MXN',
    name: 'Peso mexicano',
    symbol: '$',
    central_bank: 'Banco de México',
    central_bank_abbr: 'Banxico',
    monetary_policy: 'Inflation targeting (3% ± 1%)',
    regime: 'Free-floating exchange rate',
    approximate_rate_per_usd: 17.2,
    key_facts: [
      'MXN is the most traded LatAm currency and 15th globally',
      'Banxico is constitutionally autonomous since 1994',
      'Key rate (tasa objetivo) directly influences TIIE benchmark',
      'Mexico receives ~$60B/year in remittances (world #2 after India)',
      'SPEI real-time payment system processes same-day transfers 24/7',
      'CoDi (now DiMo) is Mexico\'s QR payment system',
    ],
  },
  colombia: {
    code: 'COP',
    name: 'Peso colombiano',
    symbol: '$',
    central_bank: 'Banco de la República',
    central_bank_abbr: 'BanRep',
    monetary_policy: 'Inflation targeting (3% ± 1%)',
    regime: 'Managed floating exchange rate',
    approximate_rate_per_usd: 4150,
    key_facts: [
      'COP denominations go up to 100,000 pesos (largest bill)',
      'BanRep intervenes via USD auctions to smooth volatility',
      'PSE (Pagos Seguros en Línea) dominates online bank transfers',
      'Nequi and Daviplata are leading mobile wallets (30M+ users combined)',
      'Colombia has the 4th largest economy in LatAm',
      'Remittances ~$10B/year, mainly from US and Spain',
    ],
  },
  brazil: {
    code: 'BRL',
    name: 'Real brasileiro',
    symbol: 'R$',
    central_bank: 'Banco Central do Brasil',
    central_bank_abbr: 'BCB',
    monetary_policy: 'Inflation targeting (3% ± 1.5%)',
    regime: 'Free-floating exchange rate',
    approximate_rate_per_usd: 5.0,
    key_facts: [
      'The Real was introduced in 1994 (Plano Real) to end hyperinflation',
      'Selic rate is the key policy rate — one of the highest real rates globally',
      'PIX instant payment system launched 2020 — 150M+ users, 24/7, free for individuals',
      'PIX processes more transactions than credit/debit cards combined in Brazil',
      'BCB is developing DREX (digital Real CBDC) — pilot phase',
      'Brazil has the largest economy in LatAm (GDP ~$2T)',
      'IOF tax applies to most financial transactions including FX',
    ],
  },
  chile: {
    code: 'CLP',
    name: 'Peso chileno',
    symbol: '$',
    central_bank: 'Banco Central de Chile',
    central_bank_abbr: 'BCCh',
    monetary_policy: 'Inflation targeting (3% ± 1%)',
    regime: 'Free-floating exchange rate',
    approximate_rate_per_usd: 950,
    key_facts: [
      'Chile has the highest sovereign credit rating in LatAm (A/A-)',
      'UF (Unidad de Fomento) is an inflation-indexed unit used for contracts and mortgages',
      'CLP has no cents — smallest denomination is 1 peso',
      'Transbank dominates card processing (quasi-monopoly, under competition reform)',
      'Chile Sovereign Wealth Funds: ESSF and PRF (~$20B combined)',
    ],
  },
  peru: {
    code: 'PEN',
    name: 'Sol peruano',
    symbol: 'S/.',
    central_bank: 'Banco Central de Reserva del Perú',
    central_bank_abbr: 'BCRP',
    monetary_policy: 'Inflation targeting (2% ± 1%)',
    regime: 'Managed floating exchange rate',
    approximate_rate_per_usd: 3.75,
    key_facts: [
      'Peru is highly dollarized informally — ~30% of bank deposits in USD',
      'BCRP actively intervenes in FX market to reduce volatility',
      'Yape (BCP) is the dominant mobile wallet — 15M+ users',
      'Peru has one of the lowest inflation rates in LatAm historically',
      'Mining (copper, gold) drives significant USD inflows',
    ],
  },
  costa_rica: {
    code: 'CRC',
    name: 'Colón costarricense',
    symbol: '₡',
    central_bank: 'Banco Central de Costa Rica',
    central_bank_abbr: 'BCCR',
    monetary_policy: 'Inflation targeting (3% ± 1%)',
    regime: 'Managed floating (crawling band abandoned 2015)',
    approximate_rate_per_usd: 510,
    key_facts: [
      'Costa Rica is semi-dollarized — many prices quoted in USD',
      'SINPE Móvil is the national instant payment system (phone-number based)',
      'Tourism drives significant USD inflows',
      'BCCR uses Monex electronic trading platform for interbank FX',
      'No army — budget redirected to education and healthcare since 1948',
    ],
  },
  argentina: {
    code: 'ARS',
    name: 'Peso argentino',
    symbol: '$',
    central_bank: 'Banco Central de la República Argentina',
    central_bank_abbr: 'BCRA',
    monetary_policy: 'Monetary aggregates targeting (shifting)',
    regime: 'Managed float with capital controls (cepo cambiario)',
    approximate_rate_per_usd: 900,
    key_facts: [
      'Argentina has parallel exchange rates: official, MEP (bolsa), CCL, blue (informal)',
      'Annual inflation has exceeded 100% — highest in LatAm',
      'The "blue dollar" spread can be 20-100% above official rate',
      'BCRA has severe reserve shortages — frequent IMF negotiations',
      'Mercado Pago (MercadoLibre) dominates digital payments',
      'Crypto adoption is among highest globally due to peso instability',
      'President Milei pursuing dollarization agenda (as of 2024-2025)',
    ],
  },
};

// ── Supported currency codes for FX ──
const FX_CURRENCIES = ['USD', 'EUR', 'GBP', 'MXN', 'COP', 'BRL', 'CLP', 'PEN', 'CRC', 'ARS', 'PAB', 'CAD', 'JPY', 'CNY', 'CHF'];

// ── Free FX API ──
async function fetchExchangeRate(from: string, to: string): Promise<{ rate: number; source: string }> {
  // Try frankfurter.app first (ECB data, very reliable, free)
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) {
      const data = await res.json() as { rates: Record<string, number> };
      if (data.rates[to]) return { rate: data.rates[to], source: 'ECB via frankfurter.app' };
    }
  } catch { /* fall through */ }

  // Fallback: ExchangeRate-API (free tier, no key)
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) {
      const data = await res.json() as { rates: Record<string, number> };
      if (data.rates[to]) return { rate: data.rates[to], source: 'open.er-api.com' };
    }
  } catch { /* fall through */ }

  // Hardcoded fallback for LatAm currencies
  const fromInfo = Object.values(LATAM_CURRENCIES).find(c => c.code === from);
  const toInfo = Object.values(LATAM_CURRENCIES).find(c => c.code === to);
  if (from === 'USD' && toInfo) return { rate: toInfo.approximate_rate_per_usd, source: 'hardcoded fallback (may be outdated)' };
  if (to === 'USD' && fromInfo) return { rate: 1 / fromInfo.approximate_rate_per_usd, source: 'hardcoded fallback (may be outdated)' };

  throw new Error(`Could not fetch ${from}/${to} rate from any source`);
}

// ── Central Bank Rate Knowledge ──
interface CentralBankRate {
  country: string;
  bank: string;
  rate_name: string;
  approximate_rate_pct: number;
  last_decision: string;
  next_meeting: string;
  trend: 'rising' | 'falling' | 'holding';
  notes: string;
}

const CB_RATES: Record<string, CentralBankRate> = {
  mexico: { country: 'Mexico', bank: 'Banxico', rate_name: 'Tasa Objetivo', approximate_rate_pct: 9.5, last_decision: 'Cut 25bp', next_meeting: 'Check banxico.org.mx', trend: 'falling', notes: 'Easing cycle began mid-2024. TIIE 28d tracks closely.' },
  colombia: { country: 'Colombia', bank: 'BanRep', rate_name: 'Tasa de Intervención', approximate_rate_pct: 9.75, last_decision: 'Cut 50bp', next_meeting: 'Check banrep.gov.co', trend: 'falling', notes: 'Aggressive easing after peak of 13.25%. DTF benchmark follows.' },
  brazil: { country: 'Brazil', bank: 'BCB', rate_name: 'Taxa Selic', approximate_rate_pct: 13.25, last_decision: 'Hike 100bp', next_meeting: 'Check bcb.gov.br', trend: 'rising', notes: 'Counter-cyclical hiking while other LatAm banks cut. CDI tracks Selic.' },
  chile: { country: 'Chile', bank: 'BCCh', rate_name: 'Tasa de Política Monetaria (TPM)', approximate_rate_pct: 5.0, last_decision: 'Cut 25bp', next_meeting: 'Check bcentral.cl', trend: 'falling', notes: 'Fastest easing cycle in LatAm from peak of 11.25%.' },
  peru: { country: 'Peru', bank: 'BCRP', rate_name: 'Tasa de Referencia', approximate_rate_pct: 5.0, last_decision: 'Cut 25bp', next_meeting: 'Check bcrp.gob.pe', trend: 'falling', notes: 'Gradual easing. Peru typically has lowest rates in LatAm.' },
  costa_rica: { country: 'Costa Rica', bank: 'BCCR', rate_name: 'Tasa de Política Monetaria', approximate_rate_pct: 4.0, last_decision: 'Cut 25bp', next_meeting: 'Check bccr.fi.cr', trend: 'falling', notes: 'Moderate easing cycle. TBP (Tasa Básica Pasiva) is the deposit benchmark.' },
  argentina: { country: 'Argentina', bank: 'BCRA', rate_name: 'Tasa de Política Monetaria', approximate_rate_pct: 40.0, last_decision: 'Cut', next_meeting: 'Variable', trend: 'falling', notes: 'Rates were 133% in late 2023. Aggressive cuts under Milei. Real rates deeply negative vs inflation.' },
  panama: { country: 'Panama', bank: 'N/A (dollarized)', rate_name: 'N/A', approximate_rate_pct: 0, last_decision: 'N/A', next_meeting: 'N/A', trend: 'holding', notes: 'Panama has no central bank monetary policy. Interest rates follow US Fed Funds Rate (~5.25-5.50%).' },
};

// ── Remittance corridors ──
interface RemittanceCorridor {
  from: string;
  to: string;
  avg_fee_pct: number;
  providers: Array<{ name: string; fee_usd: number; speed: string; method: string }>;
}

const REMITTANCE_CORRIDORS: Record<string, RemittanceCorridor> = {
  'US-MX': { from: 'US', to: 'Mexico', avg_fee_pct: 3.5, providers: [
    { name: 'Wise', fee_usd: 4.5, speed: '1-2 days', method: 'Bank/debit' },
    { name: 'Remitly', fee_usd: 3.99, speed: 'Minutes (express)', method: 'Bank/card' },
    { name: 'Western Union', fee_usd: 7.99, speed: 'Minutes (cash pickup)', method: 'Cash/card' },
    { name: 'Xoom (PayPal)', fee_usd: 4.99, speed: 'Minutes-hours', method: 'Bank/card' },
    { name: 'MoneyGram', fee_usd: 5.99, speed: 'Same day', method: 'Cash/card' },
  ]},
  'US-CO': { from: 'US', to: 'Colombia', avg_fee_pct: 4.2, providers: [
    { name: 'Wise', fee_usd: 5.0, speed: '1-2 days', method: 'Bank/debit' },
    { name: 'Remitly', fee_usd: 3.99, speed: 'Minutes (Nequi/Bancolombia)', method: 'Bank/card' },
    { name: 'Western Union', fee_usd: 9.99, speed: 'Minutes (cash pickup)', method: 'Cash/card' },
    { name: 'Bancolombia Transfer', fee_usd: 8.0, speed: '1-3 days', method: 'Bank' },
  ]},
  'US-BR': { from: 'US', to: 'Brazil', avg_fee_pct: 4.0, providers: [
    { name: 'Wise', fee_usd: 5.5, speed: '1-2 days (PIX)', method: 'Bank/debit' },
    { name: 'Remitly', fee_usd: 3.99, speed: 'Hours (PIX)', method: 'Bank/card' },
    { name: 'Western Union', fee_usd: 8.99, speed: 'Minutes (cash)', method: 'Cash/card' },
    { name: 'Payoneer', fee_usd: 2.0, speed: '2-5 days', method: 'Bank' },
  ]},
  'US-PA': { from: 'US', to: 'Panama', avg_fee_pct: 5.0, providers: [
    { name: 'Wise', fee_usd: 5.0, speed: '1-3 days', method: 'Bank' },
    { name: 'Western Union', fee_usd: 8.99, speed: 'Minutes (cash)', method: 'Cash/card' },
    { name: 'Remitly', fee_usd: 4.99, speed: 'Hours', method: 'Bank/card' },
    { name: 'Zelle (if US bank)', fee_usd: 0, speed: 'Minutes', method: 'Bank (USD only)' },
  ]},
};

export function getAllFiatCurrencyTools(): ToolSchema[] {
  return [

    // ────────────────────────────────────────
    // 1. Exchange Rate
    // ────────────────────────────────────────
    {
      name: 'fiat_exchangeRate',
      description: 'Get real-time exchange rates for any currency pair. Supports all LatAm currencies (MXN, COP, BRL, CLP, PEN, CRC, ARS, PAB) plus major globals (USD, EUR, GBP, CAD, JPY, CNY).',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Source currency code (e.g. USD)' },
          to: { type: 'string', description: 'Target currency code (e.g. MXN). Comma-separated for multiple (e.g. MXN,COP,BRL)' },
        },
        required: ['from', 'to'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const from = String(args.from || '').toUpperCase().trim();
        const targets = String(args.to || '').toUpperCase().split(/[,\s]+/).map(t => t.trim()).filter(Boolean);
        if (!from) return { error: 'from currency is required' };
        if (targets.length === 0) return { error: 'to currency is required' };

        const results: Record<string, { rate: number; source: string }> = {};
        const errors: string[] = [];

        await Promise.all(targets.map(async (to) => {
          try {
            results[to] = await fetchExchangeRate(from, to);
          } catch (err) {
            errors.push(`${to}: ${(err as Error).message}`);
          }
        }));

        log.info('exchange_rate', { from, to: targets, trace_id: traceId });
        return {
          base: from,
          rates: results,
          ...(errors.length > 0 ? { errors } : {}),
          timestamp: new Date().toISOString(),
        };
      },
    },

    // ────────────────────────────────────────
    // 2. Currency Converter
    // ────────────────────────────────────────
    {
      name: 'fiat_currencyConverter',
      description: 'Convert an amount between any two fiat currencies using live exchange rates. Shows rate, converted amount, and inverse rate.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Amount to convert' },
          from: { type: 'string', description: 'Source currency (e.g. USD)' },
          to: { type: 'string', description: 'Target currency (e.g. MXN)' },
        },
        required: ['amount', 'from', 'to'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const amount = Number(args.amount) || 0;
        if (amount <= 0) return { error: 'amount must be positive' };
        const from = String(args.from || '').toUpperCase().trim();
        const to = String(args.to || '').toUpperCase().trim();
        if (!from || !to) return { error: 'from and to currencies required' };

        try {
          const { rate, source } = await fetchExchangeRate(from, to);
          const converted = Math.round(amount * rate * 100) / 100;
          const inverseRate = Math.round((1 / rate) * 1000000) / 1000000;
          log.info('currency_converted', { from, to, amount, trace_id: traceId });
          return {
            from: { currency: from, amount },
            to: { currency: to, amount: converted },
            rate,
            inverse_rate: inverseRate,
            source,
            timestamp: new Date().toISOString(),
          };
        } catch (err) {
          return { error: `Conversion failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 3. Central Bank Rates
    // ────────────────────────────────────────
    {
      name: 'fiat_centralBankRates',
      description: 'Key interest rates for LatAm central banks (Banxico, BCB, BanRep, BCCh, BCRP, BCCR, BCRA). Shows rate, trend, last decision. Essential for understanding borrowing costs and monetary conditions.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country (mexico, colombia, brazil, chile, peru, costa_rica, argentina, panama). Or "all" for comparison.' },
        },
        required: [],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const country = String(args.country || 'all').toLowerCase();

        if (country === 'all') {
          const comparison = Object.entries(CB_RATES)
            .sort((a, b) => b[1].approximate_rate_pct - a[1].approximate_rate_pct)
            .map(([key, r]) => ({
              country: r.country,
              bank: r.bank,
              rate_name: r.rate_name,
              rate_pct: r.approximate_rate_pct,
              trend: r.trend,
              last_decision: r.last_decision,
            }));
          log.info('cb_rates_all', { trace_id: traceId });
          return {
            rates: comparison,
            us_fed_funds_pct: 5.25,
            ecb_main_refinancing_pct: 4.25,
            note: 'Rates are approximate and may lag behind the latest decision. Verify at central bank websites.',
            timestamp: new Date().toISOString(),
          };
        }

        const rate = CB_RATES[country];
        if (!rate) return { error: `Unknown country: ${country}. Supported: ${Object.keys(CB_RATES).join(', ')}` };

        const currencyInfo = LATAM_CURRENCIES[country];
        log.info('cb_rate', { country, trace_id: traceId });
        return {
          ...rate,
          currency: currencyInfo ? { code: currencyInfo.code, name: currencyInfo.name, regime: currencyInfo.regime } : null,
          us_fed_funds_comparison_pct: 5.25,
          real_rate_estimate_pct: rate.approximate_rate_pct > 0 ? Math.round((rate.approximate_rate_pct - 5) * 100) / 100 : null,
          note: 'Rates are approximate. Verify at the central bank website.',
        };
      },
    },

    // ────────────────────────────────────────
    // 4. Inflation Tracker
    // ────────────────────────────────────────
    {
      name: 'fiat_inflationTracker',
      description: 'Current and historical inflation data for LatAm countries. Shows annual CPI, food inflation, core inflation, and context on how it affects SMB purchasing power and pricing strategy.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country or "all" for comparison' },
        },
        required: [],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        // Approximate annual CPI data (updated periodically in code)
        const inflationData: Record<string, { annual_cpi_pct: number; food_pct: number; core_pct: number; trend: string; smb_impact: string }> = {
          panama: { annual_cpi_pct: 1.5, food_pct: 2.0, core_pct: 1.3, trend: 'stable', smb_impact: 'Low inflation — pricing stable. Dollarization eliminates FX risk.' },
          mexico: { annual_cpi_pct: 4.2, food_pct: 5.8, core_pct: 3.9, trend: 'falling', smb_impact: 'Moderate inflation. Food costs elevated. Adjust menu/product prices quarterly.' },
          colombia: { annual_cpi_pct: 6.5, food_pct: 7.2, core_pct: 6.0, trend: 'falling', smb_impact: 'Still elevated. Consider monthly price reviews. Input costs rising.' },
          brazil: { annual_cpi_pct: 4.5, food_pct: 5.5, core_pct: 4.0, trend: 'stable', smb_impact: 'Within BCB target band. IPCA drives contract adjustments.' },
          chile: { annual_cpi_pct: 3.5, food_pct: 4.0, core_pct: 3.2, trend: 'falling', smb_impact: 'Approaching target. UF-indexed contracts auto-adjust.' },
          peru: { annual_cpi_pct: 2.8, food_pct: 3.5, core_pct: 2.5, trend: 'stable', smb_impact: 'Near target. Stable pricing environment.' },
          costa_rica: { annual_cpi_pct: 0.5, food_pct: 1.0, core_pct: 0.8, trend: 'falling', smb_impact: 'Near-zero inflation. No urgent pricing adjustments needed.' },
          argentina: { annual_cpi_pct: 120.0, food_pct: 150.0, core_pct: 110.0, trend: 'falling from peak', smb_impact: 'Hyperinflation environment. Price daily or weekly. Accept USD/crypto when possible. Peso costs erode immediately.' },
        };

        const country = String(args.country || 'all').toLowerCase();

        if (country === 'all') {
          const comparison = Object.entries(inflationData)
            .sort((a, b) => b[1].annual_cpi_pct - a[1].annual_cpi_pct)
            .map(([key, d]) => ({ country: key, ...d }));
          log.info('inflation_all', { trace_id: traceId });
          return { inflation: comparison, us_cpi_pct: 3.2, note: 'Approximate annual CPI figures. For live data check each central bank.', timestamp: new Date().toISOString() };
        }

        const data = inflationData[country];
        if (!data) return { error: `Unknown country: ${country}` };
        const curr = LATAM_CURRENCIES[country];
        log.info('inflation', { country, trace_id: traceId });
        return {
          country,
          currency: curr?.code,
          ...data,
          purchasing_power_loss_monthly_pct: Math.round((data.annual_cpi_pct / 12) * 100) / 100,
          pricing_recommendation: data.annual_cpi_pct > 10
            ? 'Revise precios semanalmente. Considere indexación automática.'
            : data.annual_cpi_pct > 5
              ? 'Revise precios mensualmente. Ajuste contratos trimestralmente.'
              : 'Revise precios trimestralmente. Ambiente de precios estable.',
        };
      },
    },

    // ────────────────────────────────────────
    // 5. Remittance Advisor
    // ────────────────────────────────────────
    {
      name: 'fiat_remittanceAdvisor',
      description: 'Compare remittance options for sending money to LatAm. Shows fees, speed, and providers for US→Mexico, US→Colombia, US→Brazil, US→Panama corridors. Critical for SMBs with cross-border operations or diaspora customers.',
      parameters: {
        type: 'object',
        properties: {
          from_country: { type: 'string', description: 'Sending country (e.g. US, ES, CA)' },
          to_country: { type: 'string', description: 'Receiving country (e.g. mexico, colombia, brazil, panama)' },
          amount_usd: { type: 'number', description: 'Amount to send in USD' },
          priority: { type: 'string', enum: ['cheapest', 'fastest', 'most_reliable'], description: 'What matters most (default: cheapest)' },
        },
        required: ['to_country'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const from = String(args.from_country || 'US').toUpperCase().trim();
        const toRaw = String(args.to_country || '').toLowerCase().trim();
        const amount = Number(args.amount_usd) || 500;
        const priority = String(args.priority || 'cheapest');

        // Map country name to corridor code
        const countryToCode: Record<string, string> = { mexico: 'MX', colombia: 'CO', brazil: 'BR', panama: 'PA' };
        const toCode = countryToCode[toRaw] || toRaw.toUpperCase();
        const corridorKey = `${from}-${toCode}`;
        const corridor = REMITTANCE_CORRIDORS[corridorKey];

        if (!corridor) {
          // Use AI for unknown corridors
          const systemPrompt = `You are a remittance and international transfer specialist. Compare the top 5 providers for sending money from ${from} to ${toRaw}. Include: provider name, fee for $${amount}, speed, and method. Default language: Spanish.
Respond with JSON: { "providers": [{ "name": string, "fee_usd": number, "speed": string, "method": string, "fx_markup_pct": number }], "best_option": string, "tips": [string] }`;
          try {
            const raw = await callLLM(systemPrompt, `Send $${amount} from ${from} to ${toRaw}`, { maxTokens: 1024 });
            const match = raw.match(/\{[\s\S]*\}/);
            log.info('remittance_ai', { from, to: toRaw, trace_id: traceId });
            return match ? JSON.parse(match[0]) : { error: 'Could not generate remittance comparison' };
          } catch (err) {
            return { error: `Remittance advisor failed: ${(err as Error).message}` };
          }
        }

        // Sort by priority
        let sorted = [...corridor.providers];
        if (priority === 'cheapest') sorted.sort((a, b) => a.fee_usd - b.fee_usd);
        else if (priority === 'fastest') sorted.sort((a, b) => (a.speed.includes('Minute') ? 0 : 1) - (b.speed.includes('Minute') ? 0 : 1));

        const withCosts = sorted.map(p => ({
          ...p,
          total_cost_usd: p.fee_usd,
          fee_pct_of_amount: Math.round((p.fee_usd / amount) * 10000) / 100,
        }));

        log.info('remittance', { corridor: corridorKey, trace_id: traceId });
        return {
          corridor: corridorKey,
          amount_usd: amount,
          providers: withCosts,
          best_option: withCosts[0]?.name,
          avg_corridor_fee_pct: corridor.avg_fee_pct,
          crypto_alternative: `Consider USDT on Tron network — fee ~$1, arrives in minutes. Receiver needs exchange account or P2P.`,
          timestamp: new Date().toISOString(),
        };
      },
    },

    // ────────────────────────────────────────
    // 6. Dollarization Analyzer
    // ────────────────────────────────────────
    {
      name: 'fiat_dollarizationAnalyzer',
      description: 'AI analysis of how dollarization (full, partial, or de facto) impacts a business. Compares operating in USD (Panama, Ecuador) vs local currency economies. Covers: FX risk, pricing strategy, supplier payments, payroll, and competitive dynamics.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Business country' },
          business_type: { type: 'string', description: 'Type of business' },
          revenue_currency: { type: 'string', description: 'Primary revenue currency (e.g. USD, MXN, COP)' },
          cost_currency: { type: 'string', description: 'Primary cost currency' },
          monthly_revenue_usd: { type: 'number', description: 'Monthly revenue in USD equivalent' },
        },
        required: ['country'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();
        const curr = LATAM_CURRENCIES[country];

        const systemPrompt = `You are a macroeconomic advisor specializing in dollarization and currency regimes in Latin America.
Deep knowledge of:
- Full dollarization: Panama (since 1904), Ecuador (since 2000), El Salvador (since 2001 + BTC legal tender)
- De facto dollarization: Argentina (blue dollar economy), Peru (30% deposit dollarization), Costa Rica (semi-dollarized), Uruguay
- Currency regime implications: loss of monetary sovereignty, imported inflation, competitiveness effects
- Business impact: FX risk elimination vs loss of devaluation competitiveness, pricing in dual currencies, payroll considerations
- Hedging strategies for non-dollarized economies: forward contracts, natural hedging, USD invoicing, stablecoin treasury

${curr ? `Country context: ${curr.regime}. ${curr.monetary_policy}. Rate: ~${curr.approximate_rate_per_usd} per USD.` : ''}

Respond with JSON:
{
  "dollarization_status": "full"|"partial"|"de_facto"|"none",
  "fx_risk_level": "none"|"low"|"medium"|"high"|"extreme",
  "business_implications": [{ "area": string, "impact": string, "recommendation": string }],
  "pricing_strategy": string,
  "hedging_options": [string],
  "competitive_advantage": string,
  "risks": [string],
  "action_steps": [string]
}`;

        const userInput = `Analyze dollarization impact:
Country: ${country}
Business: ${args.business_type || 'SMB'}
Revenue currency: ${args.revenue_currency || 'unknown'}
Cost currency: ${args.cost_currency || 'unknown'}
Monthly revenue: $${args.monthly_revenue_usd || 'unknown'} USD`;

        try {
          const raw = await callLLM(systemPrompt, userInput, { maxTokens: 2048, temperature: 0.3 });
          const match = raw.match(/\{[\s\S]*\}/);
          log.info('dollarization_analysis', { country, trace_id: traceId });
          return match ? JSON.parse(match[0]) : { error: 'Could not generate analysis' };
        } catch (err) {
          return { error: `Dollarization analysis failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 7. Monetary System Explainer
    // ────────────────────────────────────────
    {
      name: 'fiat_monetarySystemExplainer',
      description: 'Deep explainer on how the modern monetary system works. Covers: fractional reserve banking, money creation (M0/M1/M2/M3), central bank operations (OMOs, repo, discount window), CBDC development, the petrodollar system, IMF/World Bank role in LatAm, and how it all connects to crypto as an alternative. Expert-level but accessible.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic: fractional_reserve, money_supply, central_bank_operations, cbdc, petrodollar, imf_latam, fiat_vs_crypto, interest_rates, inflation_mechanics, bank_runs, currency_crises, stablecoins_vs_fiat',
          },
          country_context: { type: 'string', description: 'Optional: explain in context of a specific country (e.g. panama, argentina)' },
          depth: { type: 'string', enum: ['beginner', 'intermediate', 'expert'], description: 'Explanation depth (default: intermediate)' },
        },
        required: ['topic'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const topic = String(args.topic || '').trim();
        if (!topic) return { error: 'topic is required' };
        const depth = String(args.depth || 'intermediate');
        const country = String(args.country_context || '').toLowerCase();
        const curr = country ? LATAM_CURRENCIES[country] : null;

        const systemPrompt = `You are a monetary economist and financial educator with deep expertise in:
- How modern money works: fractional reserve banking, money multiplier, reserve requirements
- Money supply: M0 (monetary base), M1 (cash + checking), M2 (+ savings + CDs), M3 (+ large deposits + repos)
- Central bank operations: open market operations (OMOs), repo/reverse repo, discount window, quantitative easing (QE), yield curve control
- Interest rate transmission: policy rate → interbank rate → lending rate → economy
- Inflation mechanics: demand-pull, cost-push, monetary inflation, expectations channel, Phillips curve
- CBDC (Central Bank Digital Currencies): retail vs wholesale, account-based vs token-based, privacy trade-offs
  - LatAm CBDCs: Brazil's DREX (pilot), Mexico's digital peso (study), Colombia (study), Eastern Caribbean DCash
- The petrodollar system: 1971 Nixon shock, oil pricing in USD, recycling, de-dollarization trends (BRICS)
- IMF role in LatAm: structural adjustment programs, conditionality, Argentina's serial borrower status
- Currency crises history: Mexico Tequila (1994), Argentina Corralito (2001), Brazil Real crisis (1999)
- Crypto as monetary alternative: Bitcoin as hard money, stablecoins as dollar access, DeFi as shadow banking
- How banks create money through lending (not just intermediation)
- Bank runs: mechanics, deposit insurance, lender of last resort

${curr ? `Country context (${country}): ${curr.regime}. ${curr.monetary_policy}. Central bank: ${curr.central_bank}. Key facts: ${curr.key_facts.join('; ')}` : ''}

Depth: ${depth}. Default language: Spanish. Use analogies for beginner level.

Respond with JSON:
{
  "topic": string,
  "title": string,
  "explanation": string,
  "key_concepts": [{ "term": string, "definition": string }],
  "real_world_example": string,
  "latam_relevance": string,
  "crypto_connection": string,
  "further_reading": [string]
}`;

        try {
          const raw = await callLLM(systemPrompt, `Explain: ${topic}${country ? ` in the context of ${country}` : ''}. Depth: ${depth}.`, { maxTokens: 2048, temperature: 0.4 });
          const match = raw.match(/\{[\s\S]*\}/);
          log.info('monetary_explainer', { topic, trace_id: traceId });
          return match ? JSON.parse(match[0]) : { error: 'Could not generate explanation' };
        } catch (err) {
          return { error: `Monetary explainer failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
