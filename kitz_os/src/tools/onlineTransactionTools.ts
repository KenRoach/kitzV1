/**
 * Online Transaction Intelligence Tools — Payment processing, fraud detection, chargeback advisory.
 *
 * 6 tools:
 *   - txn_paymentProcessorCompare  (low)    — Compare online payment processors for LatAm (Stripe, PayPal, MercadoPago, dLocal, Conekta, Kushki)
 *   - txn_fraudRiskAssessor        (medium) — AI fraud risk scoring for online transactions
 *   - txn_chargebackAdvisor        (medium) — Chargeback prevention strategy and dispute response
 *   - txn_feeCalculator            (low)    — Calculate total cost of accepting online payments (processor fee + FX + local tax)
 *   - txn_checkoutOptimizer        (medium) — AI advice on optimizing checkout conversion for LatAm markets
 *   - txn_reconciliationHelper     (low)    — Help reconcile payment processor payouts with bank deposits
 *
 * Deep knowledge of LatAm payment landscape: local cards (Elo, Naranja), installments (MSI/cuotas),
 * alternative payment methods (OXXO, Boleto, PSE, Yappy, SINPE), and cross-border settlement.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { callLLM } from './shared/callLLM.js';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('onlineTransactionTools');

// ── Payment Processor Knowledge Base ──

interface ProcessorInfo {
  name: string;
  coverage: string[];
  card_fee_pct: number;
  card_fee_fixed_usd: number;
  local_methods: string[];
  payout_speed: string;
  payout_currency: string;
  installments: boolean;
  api_quality: 'excellent' | 'good' | 'basic';
  best_for: string;
  notes: string;
}

const PROCESSORS: Record<string, ProcessorInfo> = {
  stripe: {
    name: 'Stripe',
    coverage: ['MX', 'BR', 'global'],
    card_fee_pct: 2.9,
    card_fee_fixed_usd: 0.30,
    local_methods: ['OXXO (MX)', 'Boleto (BR)', 'PIX (BR)', 'SPEI (MX)'],
    payout_speed: '2-7 business days',
    payout_currency: 'Local currency or USD',
    installments: true,
    api_quality: 'excellent',
    best_for: 'SaaS, e-commerce with global reach, developers',
    notes: 'Best API/docs. Not available in all LatAm countries. MX and BR direct, others via cross-border.',
  },
  mercadopago: {
    name: 'MercadoPago',
    coverage: ['MX', 'AR', 'BR', 'CO', 'CL', 'PE', 'UY'],
    card_fee_pct: 3.49,
    card_fee_fixed_usd: 0,
    local_methods: ['QR code', 'Wallet balance', 'Cash (OXXO, Rapipago, Pago Fácil)', 'PSE (CO)', 'Boleto (BR)'],
    payout_speed: 'Instant to MercadoPago balance, 2-5 days to bank',
    payout_currency: 'Local currency only',
    installments: true,
    api_quality: 'good',
    best_for: 'LatAm-focused e-commerce, marketplace sellers, physical retail (QR)',
    notes: 'Largest LatAm processor. 150M+ users. Built-in buyer protection. Higher fees but highest conversion in LatAm.',
  },
  paypal: {
    name: 'PayPal',
    coverage: ['MX', 'BR', 'AR', 'CO', 'CL', 'PE', 'PA', 'CR', 'global'],
    card_fee_pct: 3.49,
    card_fee_fixed_usd: 0.49,
    local_methods: ['PayPal balance', 'PayPal Credit'],
    payout_speed: '3-5 business days',
    payout_currency: 'USD or local',
    installments: false,
    api_quality: 'good',
    best_for: 'Cross-border sales, freelancers, digital goods',
    notes: 'Global trust but high FX markup (~3-4%). Limited local method support. Strong buyer protection increases chargebacks.',
  },
  dlocal: {
    name: 'dLocal',
    coverage: ['MX', 'BR', 'AR', 'CO', 'CL', 'PE', 'EC', 'PA', 'CR', 'UY', 'PY', 'BO', 'DO'],
    card_fee_pct: 3.5,
    card_fee_fixed_usd: 0,
    local_methods: ['All major local methods per country', 'Bank transfers', 'Cash vouchers', 'Mobile wallets'],
    payout_speed: '2-5 business days',
    payout_currency: 'USD or local',
    installments: true,
    api_quality: 'good',
    best_for: 'Enterprise cross-border into LatAm, marketplace platforms',
    notes: 'Widest LatAm coverage. Single API for all countries. Enterprise-focused (high volume minimums). NASDAQ listed.',
  },
  conekta: {
    name: 'Conekta',
    coverage: ['MX'],
    card_fee_pct: 2.9,
    card_fee_fixed_usd: 0.25,
    local_methods: ['OXXO cash', 'SPEI bank transfer', 'MSI (meses sin intereses)'],
    payout_speed: '2-3 business days',
    payout_currency: 'MXN',
    installments: true,
    api_quality: 'good',
    best_for: 'Mexico-focused e-commerce, businesses needing OXXO/SPEI',
    notes: 'Mexico specialist. Best OXXO integration. Competitive rates. Good for SMBs.',
  },
  kushki: {
    name: 'Kushki',
    coverage: ['MX', 'CO', 'EC', 'PE', 'CL'],
    card_fee_pct: 3.25,
    card_fee_fixed_usd: 0,
    local_methods: ['PSE (CO)', 'Bank transfer', 'Cash (various)'],
    payout_speed: '3-5 business days',
    payout_currency: 'Local currency',
    installments: true,
    api_quality: 'good',
    best_for: 'Andean region + Mexico, subscription businesses',
    notes: 'Growing LatAm processor. Strong in Ecuador and Colombia. Tokenization support.',
  },
  yappy: {
    name: 'Yappy (Banco General)',
    coverage: ['PA'],
    card_fee_pct: 0,
    card_fee_fixed_usd: 0,
    local_methods: ['Yappy QR code', 'Yappy link'],
    payout_speed: 'Instant to Banco General account',
    payout_currency: 'USD (Panama is dollarized)',
    installments: false,
    api_quality: 'basic',
    best_for: 'Panama-only businesses, physical retail, WhatsApp commerce',
    notes: 'Free for merchants under certain volume. 3M+ users in Panama (75% banked population). No API — QR/link only.',
  },
  nequi: {
    name: 'Nequi (Bancolombia)',
    coverage: ['CO'],
    card_fee_pct: 0,
    card_fee_fixed_usd: 0.15,
    local_methods: ['Nequi push', 'QR code'],
    payout_speed: 'Instant to Bancolombia/Nequi',
    payout_currency: 'COP',
    installments: false,
    api_quality: 'basic',
    best_for: 'Colombia P2P, small merchants, WhatsApp commerce',
    notes: '18M+ users. Free P2P. Growing merchant acceptance. Limited API.',
  },
};

// ── Common fraud indicators for LatAm ──
const FRAUD_SIGNALS = [
  'Mismatched billing/shipping country',
  'Multiple failed payment attempts before success',
  'High-value order from new account',
  'Shipping to freight forwarder address',
  'Free email domain (gmail/outlook) for business purchases',
  'Velocity: multiple orders in short timeframe',
  'Card BIN country differs from IP geolocation',
  'Use of VPN/proxy detected',
  'Device fingerprint associated with previous fraud',
  'Unusual purchase time (3-5 AM local)',
];

export function getAllOnlineTransactionTools(): ToolSchema[] {
  return [

    // ────────────────────────────────────────
    // 1. Payment Processor Comparison
    // ────────────────────────────────────────
    {
      name: 'txn_paymentProcessorCompare',
      description: 'Compare online payment processors available for LatAm businesses. Shows fees, local payment methods, payout speed, and best-fit by country. Covers Stripe, MercadoPago, PayPal, dLocal, Conekta, Kushki, Yappy, Nequi.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Business country (e.g. panama, mexico, colombia, brazil)' },
          monthly_volume_usd: { type: 'number', description: 'Expected monthly payment volume in USD' },
          business_type: { type: 'string', description: 'Business type (e.g. e-commerce, SaaS, marketplace, physical retail)' },
          needs_installments: { type: 'boolean', description: 'Does the business need installment payments (MSI/cuotas)?' },
        },
        required: ['country'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();
        const volume = Number(args.monthly_volume_usd) || 5000;
        const needsInstallments = Boolean(args.needs_installments);

        // Map country to ISO code for filtering
        const countryToIso: Record<string, string> = { panama: 'PA', mexico: 'MX', colombia: 'CO', brazil: 'BR', chile: 'CL', peru: 'PE', argentina: 'AR', costa_rica: 'CR', ecuador: 'EC' };
        const iso = countryToIso[country] || country.toUpperCase();

        const available = Object.values(PROCESSORS)
          .filter(p => p.coverage.includes(iso) || p.coverage.includes('global'))
          .map(p => {
            const monthlyFees = (volume * p.card_fee_pct / 100) + (p.card_fee_fixed_usd * (volume / 50)); // Assume avg $50 order
            return {
              name: p.name,
              card_fee: `${p.card_fee_pct}% + $${p.card_fee_fixed_usd}`,
              estimated_monthly_cost_usd: Math.round(monthlyFees * 100) / 100,
              local_methods: p.local_methods,
              payout_speed: p.payout_speed,
              payout_currency: p.payout_currency,
              installments: p.installments,
              api_quality: p.api_quality,
              best_for: p.best_for,
              notes: p.notes,
            };
          })
          .sort((a, b) => a.estimated_monthly_cost_usd - b.estimated_monthly_cost_usd);

        if (needsInstallments) {
          available.forEach(p => {
            if (!p.installments) p.notes += ' [WARNING: No installment support]';
          });
        }

        log.info('processor_compare', { country, volume, trace_id: traceId });
        return {
          country,
          monthly_volume_usd: volume,
          processors: available,
          recommendation: available[0]?.name || 'No processors available for this country',
          tip: 'En LatAm, ofrecer métodos de pago locales (OXXO, PSE, Boleto, Yappy) aumenta la conversión 20-40% vs solo tarjetas.',
        };
      },
    },

    // ────────────────────────────────────────
    // 2. Fraud Risk Assessor
    // ────────────────────────────────────────
    {
      name: 'txn_fraudRiskAssessor',
      description: 'AI-powered fraud risk scoring for online transactions. Analyzes transaction attributes against known LatAm fraud patterns. Returns risk score (0-100), flags, and recommended actions. Draft-first: generates a report, does NOT block transactions automatically.',
      parameters: {
        type: 'object',
        properties: {
          amount_usd: { type: 'number', description: 'Transaction amount in USD' },
          payment_method: { type: 'string', description: 'Payment method: credit_card, debit_card, bank_transfer, cash, wallet, crypto' },
          customer_country: { type: 'string', description: 'Customer country' },
          shipping_country: { type: 'string', description: 'Shipping/delivery country (if different)' },
          is_new_customer: { type: 'boolean', description: 'First-time buyer?' },
          email_domain: { type: 'string', description: 'Customer email domain (e.g. gmail.com, company.com)' },
          previous_orders: { type: 'number', description: 'Number of previous orders from this customer' },
          failed_attempts: { type: 'number', description: 'Number of failed payment attempts before this one' },
          order_time_utc: { type: 'string', description: 'Order time in UTC (ISO format)' },
        },
        required: ['amount_usd', 'payment_method'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const amount = Number(args.amount_usd) || 0;
        const method = String(args.payment_method || 'credit_card');
        const custCountry = String(args.customer_country || '').toLowerCase();
        const shipCountry = String(args.shipping_country || '').toLowerCase();
        const isNew = Boolean(args.is_new_customer);
        const failedAttempts = Number(args.failed_attempts) || 0;
        const prevOrders = Number(args.previous_orders) || 0;

        let riskScore = 0;
        const flags: string[] = [];

        // Heuristic scoring
        if (amount > 500 && isNew) { riskScore += 20; flags.push('High-value order from new customer'); }
        if (amount > 2000) { riskScore += 15; flags.push('Very high transaction amount'); }
        if (custCountry && shipCountry && custCountry !== shipCountry) { riskScore += 25; flags.push('Billing/shipping country mismatch'); }
        if (failedAttempts >= 3) { riskScore += 30; flags.push(`${failedAttempts} failed payment attempts before success`); }
        else if (failedAttempts >= 1) { riskScore += 10; flags.push('Previous failed payment attempt'); }
        if (isNew && prevOrders === 0) { riskScore += 10; flags.push('First-time customer — no purchase history'); }
        if (method === 'credit_card' && amount > 1000 && isNew) { riskScore += 15; flags.push('High-value credit card from unknown buyer'); }
        const emailDomain = String(args.email_domain || '').toLowerCase();
        if (emailDomain && ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'].includes(emailDomain) && amount > 500) {
          riskScore += 5; flags.push('Free email domain on high-value business purchase');
        }

        // Cap at 100
        riskScore = Math.min(riskScore, 100);
        let riskTier: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (riskScore >= 70) riskTier = 'critical';
        else if (riskScore >= 45) riskTier = 'high';
        else if (riskScore >= 20) riskTier = 'medium';

        const recommendations: string[] = [];
        if (riskTier === 'critical') {
          recommendations.push('Manual review required before fulfilling', 'Contact customer to verify identity', 'Consider requesting additional ID');
        } else if (riskTier === 'high') {
          recommendations.push('Flag for review', 'Verify shipping address matches card', 'Send order confirmation and watch for disputes');
        } else if (riskTier === 'medium') {
          recommendations.push('Standard processing — monitor for chargebacks', 'Send order confirmation email');
        } else {
          recommendations.push('Approve — low risk transaction');
        }

        log.info('fraud_assessed', { amount, riskTier, riskScore, trace_id: traceId });
        return {
          risk_score: riskScore,
          risk_tier: riskTier,
          flags,
          recommendations,
          common_latam_fraud_signals: FRAUD_SIGNALS.slice(0, 5),
          disclaimer: 'Heuristic assessment only — not a substitute for a full fraud detection system (Stripe Radar, SIFT, Kount).',
        };
      },
    },

    // ────────────────────────────────────────
    // 3. Chargeback Advisor
    // ────────────────────────────────────────
    {
      name: 'txn_chargebackAdvisor',
      description: 'AI chargeback prevention strategy and dispute response for LatAm e-commerce. Covers Visa/Mastercard reason codes, evidence requirements, and prevention tactics specific to LatAm (cuotas, cash payments, delivery proof).',
      parameters: {
        type: 'object',
        properties: {
          situation: { type: 'string', description: 'Describe the chargeback situation or ask for prevention advice' },
          reason_code: { type: 'string', description: 'Visa/MC reason code if known (e.g. 10.4, 13.1, 4837)' },
          amount_usd: { type: 'number', description: 'Dispute amount' },
          payment_processor: { type: 'string', description: 'Payment processor (stripe, mercadopago, paypal)' },
          country: { type: 'string', description: 'Business country' },
        },
        required: ['situation'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const situation = String(args.situation || '').trim();
        if (!situation) return { error: 'situation description is required' };

        const systemPrompt = `You are an expert in payment disputes and chargebacks for Latin American e-commerce.
Deep knowledge of:
- Visa (TC40) and Mastercard (SAFE) fraud reporting systems
- Reason codes: Visa 10.x (fraud), 13.x (consumer disputes), Mastercard 48xx series
- Evidence requirements: delivery proof, signed receipts, IP logs, communication history
- LatAm-specific: installment (cuotas/MSI) disputes, cash payment proof (OXXO/Boleto vouchers), marketplace buyer protection
- Prevention: 3D Secure 2.0, AVS, CVV, velocity checks, delivery confirmation
- Processor-specific dispute flows: Stripe, MercadoPago, PayPal
- Win rates by reason code and evidence quality
- Friendly fraud (first-party fraud) detection in LatAm

Rules:
- Provide specific, actionable advice
- Reference exact reason codes when applicable
- Include evidence checklist for disputes
- Suggest prevention measures for future
- Default language: Spanish

Respond with JSON:
{
  "assessment": string,
  "likely_reason_code": string,
  "win_probability_pct": number,
  "evidence_needed": [string],
  "response_strategy": [string],
  "prevention_measures": [string],
  "deadline_warning": string,
  "estimated_resolution_days": number
}`;

        try {
          const raw = await callLLM(systemPrompt, `Situation: ${situation}\nReason code: ${args.reason_code || 'unknown'}\nAmount: $${args.amount_usd || 'unknown'}\nProcessor: ${args.payment_processor || 'unknown'}\nCountry: ${args.country || 'unknown'}`, { maxTokens: 1536, temperature: 0.2 });
          const match = raw.match(/\{[\s\S]*\}/);
          log.info('chargeback_advice', { trace_id: traceId });
          return match ? JSON.parse(match[0]) : { error: 'Could not generate advice' };
        } catch (err) {
          return { error: `Chargeback advisor failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 4. Fee Calculator
    // ────────────────────────────────────────
    {
      name: 'txn_feeCalculator',
      description: 'Calculate the total cost of accepting an online payment: processor fee + FX spread + local taxes (IVA/ITBMS on processing fees). Shows net amount the merchant receives.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Transaction amount' },
          currency: { type: 'string', description: 'Transaction currency (e.g. USD, MXN, COP, BRL)' },
          processor: { type: 'string', description: 'Payment processor: stripe, mercadopago, paypal, conekta, kushki, dlocal' },
          is_international: { type: 'boolean', description: 'Is the buyer in a different country than the merchant?' },
          installments: { type: 'number', description: 'Number of installments (cuotas/MSI). 1 = no installments.' },
        },
        required: ['amount', 'processor'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const amount = Number(args.amount) || 0;
        if (amount <= 0) return { error: 'amount must be positive' };
        const processorKey = String(args.processor || '').toLowerCase();
        const currency = String(args.currency || 'USD').toUpperCase();
        const isIntl = Boolean(args.is_international);
        const installments = Number(args.installments) || 1;

        const proc = PROCESSORS[processorKey];
        if (!proc) return { error: `Unknown processor: ${processorKey}. Supported: ${Object.keys(PROCESSORS).join(', ')}` };

        // Base processing fee
        let processingFee = (amount * proc.card_fee_pct / 100) + proc.card_fee_fixed_usd;

        // International surcharge (typically +1%)
        let intlSurcharge = 0;
        if (isIntl) {
          intlSurcharge = amount * 0.01;
          processingFee += intlSurcharge;
        }

        // FX spread (if cross-currency, typically 1-2%)
        let fxSpread = 0;
        if (isIntl || (currency !== 'USD' && ['stripe', 'paypal', 'dlocal'].includes(processorKey))) {
          fxSpread = amount * 0.015;
        }

        // Installment fee (merchant absorbs 3-8% for MSI/cuotas)
        let installmentFee = 0;
        if (installments > 1 && proc.installments) {
          const installmentRates: Record<number, number> = { 3: 0.035, 6: 0.055, 9: 0.065, 12: 0.08, 18: 0.10, 24: 0.12 };
          const rate = installmentRates[installments] || (installments * 0.008);
          installmentFee = amount * rate;
        }

        // Local tax on processing fees (IVA/ITBMS)
        const taxOnFees = processingFee * 0.07; // ~7% ITBMS Panama / varies by country

        const totalFees = processingFee + fxSpread + installmentFee + taxOnFees;
        const netAmount = amount - totalFees;

        log.info('fee_calculated', { processor: processorKey, amount, trace_id: traceId });
        return {
          gross_amount: amount,
          currency,
          processor: proc.name,
          breakdown: {
            processing_fee: Math.round(processingFee * 100) / 100,
            ...(intlSurcharge > 0 ? { international_surcharge: Math.round(intlSurcharge * 100) / 100 } : {}),
            ...(fxSpread > 0 ? { fx_spread_estimate: Math.round(fxSpread * 100) / 100 } : {}),
            ...(installmentFee > 0 ? { installment_fee: Math.round(installmentFee * 100) / 100, installments } : {}),
            tax_on_fees: Math.round(taxOnFees * 100) / 100,
          },
          total_fees: Math.round(totalFees * 100) / 100,
          effective_rate_pct: Math.round((totalFees / amount) * 10000) / 100,
          net_amount: Math.round(netAmount * 100) / 100,
          payout_speed: proc.payout_speed,
        };
      },
    },

    // ────────────────────────────────────────
    // 5. Checkout Optimizer
    // ────────────────────────────────────────
    {
      name: 'txn_checkoutOptimizer',
      description: 'AI advice on optimizing online checkout conversion for LatAm markets. Covers: local payment method mix, installment strategy, mobile UX, trust signals, cart abandonment recovery, and country-specific best practices.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Target market country' },
          current_conversion_pct: { type: 'number', description: 'Current checkout conversion rate (%)' },
          payment_methods_offered: { type: 'string', description: 'Currently offered payment methods' },
          average_order_value_usd: { type: 'number', description: 'Average order value' },
          business_type: { type: 'string', description: 'Business type' },
          mobile_traffic_pct: { type: 'number', description: 'Percentage of traffic from mobile devices' },
        },
        required: ['country'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();

        const systemPrompt = `You are a checkout conversion optimization expert for Latin American e-commerce.
Deep knowledge of:
- LatAm checkout behavior: 60-80% mobile, installments expected, trust badges critical
- Payment method conversion lift by country:
  - Mexico: OXXO cash (+15% conversion), MSI installments (+25% AOV), SPEI instant (+10%)
  - Brazil: PIX (+30% conversion, instant), Boleto (+10%), installments up to 12x expected
  - Colombia: PSE bank transfer (+20%), Nequi (+15%), Efecty cash (+10%)
  - Argentina: installments are MANDATORY (3/6/12 cuotas sin interés expected), Rapipago/Pago Fácil
  - Panama: Yappy (+20% conversion), ACH, few cards with 3D Secure issues
  - Chile: Webpay (Transbank) dominates, cuotas expected
- Cart abandonment: LatAm avg 75-85% (higher than global 70%)
- Trust signals: SSL badge, MercadoPago shield, local phone number, WhatsApp support button
- Mobile UX: thumb-friendly buttons, auto-fill, one-tap payment, progressive form
- A/B test recommendations specific to LatAm

Respond with JSON:
{
  "current_assessment": string,
  "missing_payment_methods": [{ "method": string, "estimated_conversion_lift_pct": number }],
  "installment_strategy": string,
  "mobile_optimizations": [string],
  "trust_signals_to_add": [string],
  "cart_recovery_tactics": [string],
  "estimated_conversion_improvement_pct": number,
  "quick_wins": [string],
  "advanced_optimizations": [string]
}`;

        const userInput = `Optimize checkout for ${country}:
Current conversion: ${args.current_conversion_pct || 'unknown'}%
Payment methods: ${args.payment_methods_offered || 'cards only'}
AOV: $${args.average_order_value_usd || 'unknown'}
Business: ${args.business_type || 'e-commerce'}
Mobile traffic: ${args.mobile_traffic_pct || 'unknown'}%`;

        try {
          const raw = await callLLM(systemPrompt, userInput, { maxTokens: 2048, temperature: 0.3 });
          const match = raw.match(/\{[\s\S]*\}/);
          log.info('checkout_optimized', { country, trace_id: traceId });
          return match ? JSON.parse(match[0]) : { error: 'Could not generate optimization advice' };
        } catch (err) {
          return { error: `Checkout optimizer failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 6. Reconciliation Helper
    // ────────────────────────────────────────
    {
      name: 'txn_reconciliationHelper',
      description: 'Help reconcile payment processor payouts with bank deposits. Calculates expected payout from gross sales minus fees, FX, holdbacks, and reserves. Identifies common discrepancy causes.',
      parameters: {
        type: 'object',
        properties: {
          gross_sales_amount: { type: 'number', description: 'Total gross sales for the period' },
          currency: { type: 'string', description: 'Sales currency' },
          processor: { type: 'string', description: 'Payment processor' },
          bank_deposit_amount: { type: 'number', description: 'Amount received in bank' },
          period: { type: 'string', description: 'Period (e.g. "March 2025", "last week")' },
          refunds: { type: 'number', description: 'Total refunds issued in the period' },
          chargebacks: { type: 'number', description: 'Total chargebacks in the period' },
        },
        required: ['gross_sales_amount', 'processor'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const gross = Number(args.gross_sales_amount) || 0;
        const bankDeposit = Number(args.bank_deposit_amount) || 0;
        const refunds = Number(args.refunds) || 0;
        const chargebacks = Number(args.chargebacks) || 0;
        const processorKey = String(args.processor || '').toLowerCase();
        const currency = String(args.currency || 'USD').toUpperCase();

        const proc = PROCESSORS[processorKey];
        const feeRate = proc ? proc.card_fee_pct / 100 : 0.035;
        const fixedFee = proc ? proc.card_fee_fixed_usd : 0.30;

        // Estimate transaction count (assume avg $50 order)
        const estTxCount = Math.round(gross / 50);
        const processingFees = (gross * feeRate) + (fixedFee * estTxCount);
        const chargebackFees = chargebacks > 0 ? chargebacks * 15 : 0; // ~$15 per chargeback fee
        const expectedPayout = gross - processingFees - refunds - chargebacks - chargebackFees;

        const discrepancy = bankDeposit > 0 ? bankDeposit - expectedPayout : 0;

        const commonDiscrepancyCauses = [
          'FX conversion spread (1-2% on cross-currency)',
          'Rolling reserve holdback (5-10% for new accounts)',
          'Delayed payout from weekend/holiday',
          'Chargeback fees ($15-25 each) not accounted',
          'Monthly platform/subscription fee deducted',
          'Tax withholding on processing fees',
          'Installment payments not yet settled',
          'Refund timing mismatch (processed but not yet deducted)',
        ];

        log.info('reconciliation', { gross, processor: processorKey, trace_id: traceId });
        return {
          period: args.period || 'current',
          currency,
          processor: proc?.name || processorKey,
          gross_sales: gross,
          deductions: {
            processing_fees: Math.round(processingFees * 100) / 100,
            refunds,
            chargebacks,
            chargeback_fees: chargebackFees,
          },
          expected_payout: Math.round(expectedPayout * 100) / 100,
          actual_bank_deposit: bankDeposit || 'not provided',
          ...(bankDeposit > 0 ? {
            discrepancy: Math.round(discrepancy * 100) / 100,
            discrepancy_pct: Math.round((discrepancy / expectedPayout) * 10000) / 100,
            discrepancy_status: Math.abs(discrepancy) < 1 ? 'MATCHED' : Math.abs(discrepancy) < expectedPayout * 0.03 ? 'MINOR_VARIANCE' : 'INVESTIGATE',
          } : {}),
          common_discrepancy_causes: commonDiscrepancyCauses,
          action: 'Compare processor dashboard payout report with bank statement line by line. Check for holdbacks and pending settlements.',
        };
      },
    },
  ];
}
