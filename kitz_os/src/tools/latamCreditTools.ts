/**
 * LatAm Credit & Lending Tools — SMB financing, credit scoring, microfinance, fintech lending.
 *
 * 5 tools:
 *   - credit_financingOptions     (low)    — Compare financing options: bank loans, fintech, microfinance, factoring, revenue-based
 *   - credit_scoreExplainer       (low)    — Explain credit scoring systems by country (Buró de Crédito, DataCrédito, SPC/Serasa, etc.)
 *   - credit_loanCalculator       (low)    — Calculate loan payments: monthly payment, total interest, effective annual rate
 *   - credit_fintechLenders       (low)    — Directory of fintech lenders by country with rates, requirements, and speed
 *   - credit_readinessAssessor    (medium) — AI assessment of business credit-readiness: documentation, financial health, bankability
 *
 * Deep knowledge of LatAm credit landscape: credit bureaus, fintech disruption, microfinance institutions.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { callLLM } from './shared/callLLM.js';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('latamCreditTools');

// ── Credit Bureau Knowledge ──

interface CreditBureau {
  country: string;
  bureaus: Array<{ name: string; type: string; coverage: string }>;
  scoring_range: string;
  access: string;
  key_factors: string[];
  informal_alternatives: string[];
}

const CREDIT_BUREAUS: Record<string, CreditBureau> = {
  panama: {
    country: 'Panama',
    bureaus: [
      { name: 'APC (Asociación Panameña de Crédito)', type: 'Private bureau', coverage: '2M+ records' },
      { name: 'Crédito y Más', type: 'Credit reference', coverage: 'Banking + commercial' },
    ],
    scoring_range: 'No standardized score — reports show payment history',
    access: 'Request via APC portal or banks',
    key_factors: ['Payment history on loans/cards', 'Outstanding debts', 'Number of inquiries', 'Public records (DGI liens)'],
    informal_alternatives: ['Bank statements (6-12 months)', 'Commercial references', 'Personal guarantee'],
  },
  mexico: {
    country: 'Mexico',
    bureaus: [
      { name: 'Buró de Crédito (TransUnion)', type: 'Consumer + commercial', coverage: '300M+ records' },
      { name: 'Círculo de Crédito', type: 'Consumer', coverage: '100M+ records' },
    ],
    scoring_range: '400-850 (similar to FICO)',
    access: 'Free report at burodecredito.com.mx (1/year)',
    key_factors: ['Payment timeliness', 'Credit utilization', 'Account age', 'Credit mix', 'New credit inquiries'],
    informal_alternatives: ['SAT Constancia de Situación Fiscal', 'Bank statements', 'IMSS employer registration'],
  },
  colombia: {
    country: 'Colombia',
    bureaus: [
      { name: 'DataCrédito (Experian)', type: 'Consumer + commercial', coverage: '25M+ records' },
      { name: 'TransUnion Colombia', type: 'Consumer', coverage: '20M+ records' },
      { name: 'Cifin (Asobancaria)', type: 'Banking sector', coverage: 'All bank clients' },
    ],
    scoring_range: '150-950 (DataCrédito score)',
    access: 'Free at midatacredito.com (Habeas Data law)',
    key_factors: ['Payment behavior', 'Outstanding obligations', 'Credit history length', 'Financial product mix'],
    informal_alternatives: ['Extractos bancarios', 'Certificación de ingresos (contador)', 'Declaración de renta'],
  },
  brazil: {
    country: 'Brazil',
    bureaus: [
      { name: 'Serasa Experian', type: 'Consumer + commercial', coverage: '300M+ records' },
      { name: 'SPC Brasil', type: 'Commercial (retail)', coverage: '250M+ records' },
      { name: 'Boa Vista SCPC', type: 'Consumer + commercial', coverage: '150M+ records' },
    ],
    scoring_range: '0-1000 (Serasa Score)',
    access: 'Free at serasa.com.br',
    key_factors: ['Cadastro Positivo (positive data since 2019)', 'Payment history', 'Protests/defaults', 'CPF/CNPJ regularity'],
    informal_alternatives: ['Comprovante de renda', 'Extrato bancário', 'Declaração de IR'],
  },
  chile: {
    country: 'Chile',
    bureaus: [
      { name: 'Equifax Chile (DICOM)', type: 'Consumer + commercial', coverage: 'Dominant bureau' },
      { name: 'TransUnion Chile', type: 'Consumer', coverage: 'Growing' },
    ],
    scoring_range: 'DICOM reports — scored by banks internally',
    access: 'Free basic report at equifax.cl',
    key_factors: ['DICOM status (estar en DICOM = defaulted)', 'Payment protests', 'Outstanding debts', 'Banking behavior'],
    informal_alternatives: ['Carpeta tributaria SII', 'Certificado de antecedentes laborales', 'Extracto AFP'],
  },
  peru: {
    country: 'Peru',
    bureaus: [
      { name: 'Sentinel', type: 'Consumer + commercial', coverage: 'Major bureau' },
      { name: 'Equifax Peru (Infocorp)', type: 'Consumer + commercial', coverage: 'Widely used' },
    ],
    scoring_range: 'SBS risk classification: Normal, CPP, Deficiente, Dudoso, Pérdida',
    access: 'Free at sentinel.pe or SBS portal',
    key_factors: ['SBS classification', 'Outstanding debts in financial system', 'Protests and morosidad', 'Tax compliance (SUNAT)'],
    informal_alternatives: ['Constancia SUNAT', 'Extractos bancarios', 'Boletas de pago'],
  },
  argentina: {
    country: 'Argentina',
    bureaus: [
      { name: 'Veraz (Equifax)', type: 'Consumer + commercial', coverage: 'Dominant bureau' },
      { name: 'Nosis', type: 'Commercial + consumer', coverage: 'Major alternative' },
      { name: 'BCRA Central de Deudores', type: 'Central bank', coverage: 'All bank debts' },
    ],
    scoring_range: 'BCRA categories: 1 (normal) to 5 (irrecoverable). Veraz score: 1-999.',
    access: 'Free BCRA query at bcra.gob.ar/centraldedeudores',
    key_factors: ['BCRA debtor classification', 'Veraz record', 'AFIP tax compliance', 'Check bouncing history (BCRA COELSA)'],
    informal_alternatives: ['Libre deuda certificate', 'Constancia AFIP monotributo/inscripto', 'Últimas 3 declaraciones juradas'],
  },
  costa_rica: {
    country: 'Costa Rica',
    bureaus: [
      { name: 'CIC (Centro de Información Crediticia) SUGEF', type: 'Regulatory', coverage: 'All supervised entities' },
      { name: 'Trans Union Costa Rica', type: 'Consumer', coverage: 'Growing' },
    ],
    scoring_range: 'SUGEF risk levels: A1 (best) to E (loss)',
    access: 'SUGEF query via banking entity',
    key_factors: ['SUGEF classification', 'Payment history', 'Outstanding obligations', 'Capacity analysis'],
    informal_alternatives: ['Certificación de ingresos (CPA)', 'Constancia CCSS', 'Estado de cuenta bancario'],
  },
};

// ── Financing Options ──

interface FinancingOption {
  type: string;
  typical_rate_annual_pct: string;
  amount_range_usd: string;
  term: string;
  speed: string;
  requirements: string[];
  pros: string[];
  cons: string[];
  best_for: string;
}

const FINANCING_TYPES: FinancingOption[] = [
  {
    type: 'Bank Term Loan (Préstamo bancario)',
    typical_rate_annual_pct: '8-18%',
    amount_range_usd: '$5,000 - $500,000+',
    term: '1-7 years',
    speed: '2-8 weeks',
    requirements: ['2+ years in business', 'Financial statements', 'Tax filings', 'Collateral (often required)', 'Credit bureau check'],
    pros: ['Lowest rates', 'Longer terms', 'Builds bank relationship', 'No equity dilution'],
    cons: ['Slow approval', 'Strict requirements', 'Collateral needed', 'Excludes informal businesses'],
    best_for: 'Established businesses with financials and collateral',
  },
  {
    type: 'Fintech Online Loan (Préstamo fintech)',
    typical_rate_annual_pct: '15-60%',
    amount_range_usd: '$500 - $100,000',
    term: '3-24 months',
    speed: '24-72 hours',
    requirements: ['6+ months in business', 'Bank statements (3-6 months)', 'Basic tax ID', 'Sometimes just bank connectivity (Open Banking)'],
    pros: ['Fast approval', 'Less paperwork', 'Works for informal businesses', 'Digital process'],
    cons: ['Higher rates', 'Shorter terms', 'Smaller amounts', 'Some use predatory practices'],
    best_for: 'Growing businesses needing fast working capital',
  },
  {
    type: 'Microfinance (Microcrédito)',
    typical_rate_annual_pct: '20-45%',
    amount_range_usd: '$100 - $10,000',
    term: '3-18 months',
    speed: '3-10 days',
    requirements: ['Minimal — often just ID and address proof', 'Group guarantee (some)', 'Business visit by loan officer'],
    pros: ['Accessible to informal/unbanked', 'Financial inclusion', 'Build credit history', 'Group support'],
    cons: ['Small amounts', 'Higher rates', 'Weekly/biweekly payments', 'Limited growth potential'],
    best_for: 'Micro-entrepreneurs, market vendors, informal businesses',
  },
  {
    type: 'Invoice Factoring (Factoraje)',
    typical_rate_annual_pct: '2-5% per invoice (discount rate)',
    amount_range_usd: '$1,000 - $1,000,000+',
    term: '30-90 days (invoice maturity)',
    speed: '24-48 hours',
    requirements: ['Outstanding invoices to creditworthy clients', 'Factura electrónica', 'Business registration'],
    pros: ['Fast cash', 'Based on client credit not yours', 'No debt on balance sheet', 'Scales with sales'],
    cons: ['Only works with B2B invoices', 'Discount reduces margin', 'Client may learn about factoring', 'Requires formal invoicing'],
    best_for: 'B2B businesses with creditworthy clients and 30-90 day payment terms',
  },
  {
    type: 'Revenue-Based Financing (Financiamiento por ingresos)',
    typical_rate_annual_pct: '12-30% (factor rate 1.12-1.30x)',
    amount_range_usd: '$5,000 - $500,000',
    term: '6-18 months (variable based on revenue)',
    speed: '3-7 days',
    requirements: ['6+ months revenue history', 'Consistent monthly revenue', 'Connected payment processor or bank account', 'Min $3K/month revenue'],
    pros: ['No fixed payments — adjusts to revenue', 'No equity given up', 'Fast', 'Works for seasonal businesses'],
    cons: ['Expensive on annualized basis', 'Daily/weekly remittance can strain cash', 'Not all processors supported'],
    best_for: 'E-commerce, SaaS, and businesses with consistent card/digital payments',
  },
  {
    type: 'Credit Line (Línea de crédito)',
    typical_rate_annual_pct: '12-25%',
    amount_range_usd: '$2,000 - $200,000',
    term: 'Revolving (annual renewal)',
    speed: '1-3 weeks (initial setup)',
    requirements: ['Existing bank relationship', '1+ year financials', 'Good credit history', 'Sometimes collateral'],
    pros: ['Only pay for what you use', 'Flexible', 'Good for seasonal needs', 'Revolving — reusable'],
    cons: ['Annual fees', 'Can be reduced/cancelled by bank', 'Temptation to over-borrow', 'Variable rates'],
    best_for: 'Businesses with variable cash flow needs, inventory purchases',
  },
];

// ── Fintech Lenders by Country ──

const FINTECH_LENDERS: Record<string, Array<{ name: string; type: string; rate: string; max_amount: string; speed: string; url: string }>> = {
  mexico: [
    { name: 'Konfío', type: 'Working capital', rate: '2-6%/month', max_amount: '$300K MXN', speed: '24 hours', url: 'konfio.mx' },
    { name: 'Credijusto (now Covalto)', type: 'SMB loans', rate: '1.5-4%/month', max_amount: '$20M MXN', speed: '3-5 days', url: 'covalto.com' },
    { name: 'Clip Capital', type: 'Merchant cash advance', rate: 'Factor 1.08-1.15', max_amount: 'Based on Clip sales', speed: '24 hours', url: 'clip.mx' },
    { name: 'Fairplay', type: 'Revenue-based', rate: 'Factor 1.06-1.12', max_amount: '$10M MXN', speed: '48 hours', url: 'fairplay.com' },
    { name: 'Aspira (Klar)', type: 'Personal/micro', rate: '3-6%/month', max_amount: '$200K MXN', speed: 'Instant', url: 'klar.mx' },
  ],
  colombia: [
    { name: 'Bold', type: 'Merchant cash advance', rate: 'Factor 1.05-1.12', max_amount: 'Based on Bold sales', speed: '24 hours', url: 'bold.co' },
    { name: 'Sempli', type: 'SMB working capital', rate: '1.8-3.5%/month', max_amount: '$500M COP', speed: '48 hours', url: 'sempli.co' },
    { name: 'Aflore', type: 'Microfinance (social lending)', rate: '2-4%/month', max_amount: '$5M COP', speed: '3 days', url: 'aflore.co' },
    { name: 'Addi', type: 'BNPL / credit', rate: '0% (merchant pays)', max_amount: '$10M COP', speed: 'Instant', url: 'co.addi.com' },
  ],
  brazil: [
    { name: 'Nubank (NuFinanciamento)', type: 'Working capital', rate: '1.5-4%/month', max_amount: 'R$200K', speed: '24 hours', url: 'nubank.com.br' },
    { name: 'Creditas', type: 'Secured loans', rate: '1-2.5%/month', max_amount: 'R$5M', speed: '5-10 days', url: 'creditas.com' },
    { name: 'Stone Capital de Giro', type: 'Merchant cash advance', rate: 'Factor 1.04-1.10', max_amount: 'Based on Stone sales', speed: '24 hours', url: 'stone.com.br' },
    { name: 'BizCapital', type: 'SMB loans', rate: '2-5%/month', max_amount: 'R$500K', speed: '48 hours', url: 'bizcapital.com.br' },
    { name: 'BNDES Card', type: 'Government-backed credit', rate: 'TLP + spread (~1%/month)', max_amount: 'R$2M', speed: '1-2 weeks', url: 'bndes.gov.br' },
  ],
  panama: [
    { name: 'Banistmo (digital)', type: 'Personal/SMB', rate: '8-14%/year', max_amount: '$50K', speed: '3-7 days', url: 'banistmo.com' },
    { name: 'Global Bank (digital)', type: 'SMB', rate: '9-16%/year', max_amount: '$100K', speed: '5-10 days', url: 'globalbank.com.pa' },
    { name: 'Microserfin', type: 'Microfinance', rate: '2-4%/month', max_amount: '$15K', speed: '3-5 days', url: 'microserfin.com' },
  ],
  chile: [
    { name: 'Chita', type: 'Invoice factoring', rate: '1-2.5%/invoice', max_amount: 'Based on invoices', speed: '24 hours', url: 'chita.cl' },
    { name: 'Cumplo', type: 'P2P lending', rate: '0.8-2%/month', max_amount: 'UF 5,000', speed: '3-5 days', url: 'cumplo.cl' },
    { name: 'Banca.Me', type: 'Revenue-based', rate: 'Factor 1.06-1.15', max_amount: '$50M CLP', speed: '48 hours', url: 'banca.me' },
  ],
  peru: [
    { name: 'Innova Funding', type: 'Invoice factoring', rate: '1.5-3%/invoice', max_amount: 'Based on invoices', speed: '48 hours', url: 'innovafunding.com' },
    { name: 'Independencia', type: 'Microfinance', rate: '2-5%/month', max_amount: 'S/50K', speed: '3-5 days', url: 'independencia.com.pe' },
  ],
  argentina: [
    { name: 'Ualá Bis', type: 'Merchant advance', rate: 'Factor 1.08-1.20', max_amount: 'Based on Ualá sales', speed: '24 hours', url: 'uala.com.ar' },
    { name: 'Wenance', type: 'Personal/micro', rate: '5-10%/month (high inflation context)', max_amount: '$1M ARS', speed: '24 hours', url: 'wenance.com' },
    { name: 'Facturante', type: 'Invoice factoring (e-cheques)', rate: '3-6%/month', max_amount: 'Based on invoices', speed: '24-48 hours', url: 'facturante.com' },
  ],
};

export function getAllLatamCreditTools(): ToolSchema[] {
  return [

    // 1. Financing Options
    {
      name: 'credit_financingOptions',
      description: 'Compare all financing options for LatAm SMBs: bank loans, fintech, microfinance, factoring, revenue-based, credit lines. Shows rates, terms, requirements, and best fit by business profile.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country' },
          amount_needed_usd: { type: 'number', description: 'How much capital needed' },
          purpose: { type: 'string', description: 'Purpose: working_capital, equipment, inventory, expansion, emergency' },
          months_in_business: { type: 'number', description: 'Months the business has been operating' },
          monthly_revenue_usd: { type: 'number', description: 'Monthly revenue' },
          has_formal_financials: { type: 'boolean', description: 'Has audited/formal financial statements?' },
          has_collateral: { type: 'boolean', description: 'Has assets to offer as collateral?' },
        },
        required: ['amount_needed_usd'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const amount = Number(args.amount_needed_usd) || 0;
        const months = Number(args.months_in_business) || 12;
        const hasFin = Boolean(args.has_formal_financials);
        const hasColl = Boolean(args.has_collateral);
        const country = String(args.country || '').toLowerCase();

        const eligible = FINANCING_TYPES.filter(f => {
          const maxStr = f.amount_range_usd.split('-').pop() || '';
          const maxNum = parseInt(maxStr.replace(/[^0-9]/g, '')) || Infinity;
          if (amount > maxNum * 1.5) return false;
          if (f.type.includes('Bank') && (months < 24 || !hasFin)) return false;
          if (f.type.includes('Factoring') && !hasFin) return false;
          return true;
        }).map(f => ({
          ...f,
          fit_score: (() => {
            let score = 50;
            if (f.type.includes('Micro') && amount < 5000) score += 20;
            if (f.type.includes('Fintech') && months >= 6) score += 15;
            if (f.type.includes('Bank') && hasFin && hasColl) score += 25;
            if (f.type.includes('Revenue') && months >= 6) score += 15;
            if (f.type.includes('Factoring') && hasFin) score += 20;
            return Math.min(score, 100);
          })(),
        })).sort((a, b) => b.fit_score - a.fit_score);

        const fintechs = country ? FINTECH_LENDERS[country] : undefined;

        log.info('financing_options', { amount, country, trace_id: traceId });
        return {
          amount_needed_usd: amount,
          eligible_options: eligible,
          ...(fintechs ? { fintech_lenders: fintechs } : {}),
          tip: amount < 5000
            ? 'Para montos pequeños, considere microcrédito o adelanto de ventas (merchant cash advance).'
            : amount < 50000
              ? 'Fintech y factoraje son las opciones más rápidas. Bancos si tiene historial y garantía.'
              : 'Para montos grandes, combine crédito bancario con línea de crédito revolving.',
        };
      },
    },

    // 2. Credit Score Explainer
    {
      name: 'credit_scoreExplainer',
      description: 'Explain credit scoring systems by LatAm country: bureaus, score ranges, how to check your score, key factors, and how to improve it. Covers Buró de Crédito, DataCrédito, Serasa/SPC, DICOM, Veraz, APC.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country or "all" for comparison' },
        },
        required: ['country'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();
        if (country === 'all' || country === 'compare') {
          log.info('credit_bureaus_all', { trace_id: traceId });
          return { credit_systems: Object.values(CREDIT_BUREAUS) };
        }
        const bureau = CREDIT_BUREAUS[country];
        if (!bureau) return { error: `Unknown country: ${country}. Supported: ${Object.keys(CREDIT_BUREAUS).join(', ')}` };
        log.info('credit_bureau', { country, trace_id: traceId });
        return {
          ...bureau,
          how_to_improve: [
            'Pague todas las obligaciones a tiempo — es el factor #1',
            'Reduzca utilización de tarjetas de crédito a < 30%',
            'No cierre cuentas antiguas — la antigüedad suma',
            'Limite las consultas nuevas — cada solicitud resta puntos',
            'Corrija errores en su reporte — solicite corrección formal',
            'Si tiene deudas vencidas, negocie y pague — el registro se actualiza',
          ],
        };
      },
    },

    // 3. Loan Calculator
    {
      name: 'credit_loanCalculator',
      description: 'Calculate loan payments: monthly installment, total interest, effective annual rate, amortization summary. Works with any currency and rate structure.',
      parameters: {
        type: 'object',
        properties: {
          principal_usd: { type: 'number', description: 'Loan amount' },
          annual_rate_pct: { type: 'number', description: 'Annual interest rate (%)' },
          term_months: { type: 'number', description: 'Loan term in months' },
          payment_type: { type: 'string', enum: ['fixed', 'declining'], description: 'Fixed installment (French) or declining balance (German). Default: fixed.' },
        },
        required: ['principal_usd', 'annual_rate_pct', 'term_months'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const P = Number(args.principal_usd) || 0;
        const annualRate = Number(args.annual_rate_pct) || 0;
        const n = Number(args.term_months) || 12;
        if (P <= 0) return { error: 'principal must be positive' };
        if (annualRate <= 0) return { error: 'annual_rate must be positive' };
        if (n <= 0) return { error: 'term_months must be positive' };

        const r = annualRate / 100 / 12; // Monthly rate

        if (String(args.payment_type) === 'declining') {
          // German amortization: fixed principal + declining interest
          const principalPayment = P / n;
          let totalInterest = 0;
          const schedule: Array<{ month: number; payment: number; principal: number; interest: number; balance: number }> = [];
          let balance = P;
          for (let m = 1; m <= n; m++) {
            const interest = balance * r;
            totalInterest += interest;
            balance -= principalPayment;
            if (m <= 6 || m === n) {
              schedule.push({ month: m, payment: Math.round((principalPayment + interest) * 100) / 100, principal: Math.round(principalPayment * 100) / 100, interest: Math.round(interest * 100) / 100, balance: Math.max(0, Math.round(balance * 100) / 100) });
            }
          }
          log.info('loan_calc', { type: 'declining', trace_id: traceId });
          return {
            type: 'declining_balance',
            principal: P,
            annual_rate_pct: annualRate,
            term_months: n,
            first_payment: schedule[0]?.payment,
            last_payment: schedule[schedule.length - 1]?.payment,
            total_interest: Math.round(totalInterest * 100) / 100,
            total_paid: Math.round((P + totalInterest) * 100) / 100,
            schedule_sample: schedule,
          };
        }

        // French amortization: fixed installment
        const payment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPaid = payment * n;
        const totalInterest = totalPaid - P;

        // Sample schedule
        const schedule: Array<{ month: number; payment: number; principal: number; interest: number; balance: number }> = [];
        let balance = P;
        for (let m = 1; m <= n; m++) {
          const interest = balance * r;
          const principalPart = payment - interest;
          balance -= principalPart;
          if (m <= 6 || m === n) {
            schedule.push({ month: m, payment: Math.round(payment * 100) / 100, principal: Math.round(principalPart * 100) / 100, interest: Math.round(interest * 100) / 100, balance: Math.max(0, Math.round(balance * 100) / 100) });
          }
        }

        log.info('loan_calc', { type: 'fixed', trace_id: traceId });
        return {
          type: 'fixed_installment',
          principal: P,
          annual_rate_pct: annualRate,
          monthly_rate_pct: Math.round(r * 10000) / 100,
          term_months: n,
          monthly_payment: Math.round(payment * 100) / 100,
          total_interest: Math.round(totalInterest * 100) / 100,
          total_paid: Math.round(totalPaid * 100) / 100,
          interest_to_principal_ratio: Math.round((totalInterest / P) * 10000) / 100 + '%',
          schedule_sample: schedule,
        };
      },
    },

    // 4. Fintech Lenders Directory
    {
      name: 'credit_fintechLenders',
      description: 'Directory of fintech lenders available by LatAm country. Shows rates, max amounts, speed, and type of financing. Covers Mexico, Colombia, Brazil, Panama, Chile, Peru, Argentina.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country' },
          financing_type: { type: 'string', description: 'Filter by type: working_capital, factoring, merchant_advance, microfinance, revenue_based' },
        },
        required: ['country'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();
        const lenders = FINTECH_LENDERS[country];
        if (!lenders) return { error: `No fintech data for: ${country}. Supported: ${Object.keys(FINTECH_LENDERS).join(', ')}` };
        const filterType = String(args.financing_type || '').toLowerCase();
        const filtered = filterType ? lenders.filter(l => l.type.toLowerCase().includes(filterType)) : lenders;
        log.info('fintech_lenders', { country, count: filtered.length, trace_id: traceId });
        return { country, lenders: filtered, total: filtered.length, disclaimer: 'Rates and availability change frequently. Verify directly with lender.' };
      },
    },

    // 5. Credit Readiness Assessor
    {
      name: 'credit_readinessAssessor',
      description: 'AI assessment of how credit-ready a LatAm business is. Scores documentation, financial health, bankability, and provides a step-by-step plan to become fundable. For informal businesses transitioning to formal credit access.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country' },
          months_in_business: { type: 'number', description: 'Months operating' },
          monthly_revenue_usd: { type: 'number', description: 'Monthly revenue' },
          has_tax_id: { type: 'boolean', description: 'Has RUC/RFC/NIT/CNPJ?' },
          has_bank_account: { type: 'boolean', description: 'Has business bank account?' },
          has_financial_statements: { type: 'boolean', description: 'Has P&L / balance sheet?' },
          has_electronic_invoicing: { type: 'boolean', description: 'Issues electronic invoices?' },
          existing_debt_usd: { type: 'number', description: 'Existing outstanding debt' },
          credit_history: { type: 'string', enum: ['none', 'good', 'bad', 'unknown'], description: 'Credit history status' },
          business_type: { type: 'string', description: 'Business type' },
        },
        required: ['country', 'monthly_revenue_usd'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();
        const revenue = Number(args.monthly_revenue_usd) || 0;
        const bureau = CREDIT_BUREAUS[country];

        const systemPrompt = `You are a credit readiness advisor for Latin American SMBs — especially those transitioning from informal to formal.
You understand:
- What banks and fintechs look for in ${country}
- Credit bureau system: ${bureau ? bureau.bureaus.map(b => b.name).join(', ') : 'local bureaus'}
- Documentation requirements
- Common barriers for informal businesses
- Step-by-step formalization path
- Alternative data scoring (bank transactions, mobile money, social selling history)

Score the business on:
1. Documentation readiness (0-25)
2. Financial health (0-25)
3. Credit history (0-25)
4. Bankability (0-25)

Provide specific, actionable steps to improve each area.
Default language: Spanish.

Respond with JSON:
{
  "overall_score": number,
  "readiness_tier": "not_ready"|"almost_ready"|"fundable"|"highly_fundable",
  "scores": { "documentation": number, "financial_health": number, "credit_history": number, "bankability": number },
  "strengths": [string],
  "gaps": [string],
  "action_plan": [{ "step": number, "action": string, "timeframe": string, "impact": string }],
  "eligible_financing": [string],
  "estimated_time_to_fundable": string
}`;

        try {
          const raw = await callLLM(systemPrompt, JSON.stringify(args), { maxTokens: 2048, temperature: 0.25 });
          const match = raw.match(/\{[\s\S]*\}/);
          log.info('credit_readiness', { country, trace_id: traceId });
          return match ? JSON.parse(match[0]) : { error: 'Could not assess readiness' };
        } catch (err) {
          return { error: `Credit readiness assessment failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
