/**
 * LatAm Banking Infrastructure Tools — Banking systems, account types, digital banking, SWIFT/ACH.
 *
 * 5 tools:
 *   - banking_accountAdvisor       (low)    — Compare business bank accounts by country: fees, features, digital capabilities
 *   - banking_paymentRails         (low)    — Explain payment rails by country: ACH, SPEI, PIX, SINPE, PSE, CCI, Yappy, LBTR
 *   - banking_digitalBankCompare   (low)    — Compare digital banks/neobanks available in LatAm (Nubank, Ualá, Klar, Nequi, Rappipay)
 *   - banking_internationalWiring  (medium) — Guide for international wire transfers: SWIFT codes, intermediary banks, costs, alternatives
 *   - banking_accountOpening       (medium) — AI guide to opening a business bank account: requirements, documents, timeline by country
 *
 * Hardcoded banking infrastructure knowledge for 8 LatAm countries. No API keys needed.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { callLLM } from './shared/callLLM.js';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('latamBankingTools');

// ── Banking Infrastructure Knowledge ──

interface BankingSystem {
  country: string;
  currency: string;
  major_banks: Array<{ name: string; type: string; digital_quality: string }>;
  payment_rails: Array<{ name: string; type: string; speed: string; cost: string; hours: string; limit: string }>;
  digital_banks: Array<{ name: string; type: string; features: string; monthly_fee: string }>;
  account_requirements: string[];
  special_notes: string[];
  correspondent_banking: string;
}

const BANKING_SYSTEMS: Record<string, BankingSystem> = {
  panama: {
    country: 'Panama',
    currency: 'USD (PAB)',
    major_banks: [
      { name: 'Banco General', type: 'Local (largest)', digital_quality: 'Good — Yappy, app' },
      { name: 'Banistmo (Bancolombia)', type: 'Regional', digital_quality: 'Good' },
      { name: 'BAC Credomatic', type: 'Regional (Central America)', digital_quality: 'Good' },
      { name: 'Banco Nacional de Panamá', type: 'State-owned', digital_quality: 'Basic' },
      { name: 'Global Bank', type: 'Local', digital_quality: 'Good' },
      { name: 'Banesco', type: 'Venezuelan origin', digital_quality: 'Moderate' },
    ],
    payment_rails: [
      { name: 'ACH (Cámara de Compensación)', type: 'Bank transfer', speed: 'Same day / next day', cost: '$0.25-$1', hours: 'Business hours', limit: 'No fixed limit' },
      { name: 'Yappy (Banco General)', type: 'Mobile P2P/merchant', speed: 'Instant', cost: 'Free (under volume cap)', hours: '24/7', limit: '$500/day P2P, higher for merchants' },
      { name: 'Transferencia interbancaria', type: 'Wire', speed: '1-2 business days', cost: '$5-15', hours: 'Business hours', limit: 'Bank-dependent' },
      { name: 'SWIFT', type: 'International wire', speed: '2-5 business days', cost: '$25-50', hours: 'Business hours', limit: 'No fixed limit' },
    ],
    digital_banks: [
      { name: 'Yappy (Banco General)', type: 'Mobile wallet', features: 'P2P, merchant QR, bill pay', monthly_fee: 'Free' },
      { name: 'Nequi Panama (planned)', type: 'Neobank', features: 'Savings, transfers', monthly_fee: 'Free' },
    ],
    account_requirements: [
      'Cédula or passport', 'RUC (tax ID) for business', 'Aviso de Operación', 'Pacto Social (incorporation docs)',
      'Financial references (2)', 'Proof of address', 'Minimum opening deposit ($100-500)',
      'Source of funds documentation', 'Board resolution authorizing account',
    ],
    special_notes: [
      'Panama is a major international banking center (70+ banks)',
      'USD is legal tender — no FX conversion needed for USD transactions',
      'Due diligence is strict (FATF gray list history)',
      'Correspondent banking: many US/EU banks have cut Panama correspondents',
      'Opening timeline: 2-6 weeks for business accounts (due diligence intensive)',
      'Yappy dominates P2P — 3M+ users in a country of 4.3M',
    ],
    correspondent_banking: 'Limited US correspondents due to compliance scrutiny. Citibank, BofA via major local banks. Consider multi-bank strategy.',
  },
  mexico: {
    country: 'Mexico',
    currency: 'MXN',
    major_banks: [
      { name: 'BBVA México', type: 'Spanish (largest)', digital_quality: 'Excellent' },
      { name: 'Banorte', type: 'Local (2nd largest)', digital_quality: 'Good' },
      { name: 'Citibanamex', type: 'US (being sold)', digital_quality: 'Good' },
      { name: 'Santander México', type: 'Spanish', digital_quality: 'Good' },
      { name: 'HSBC México', type: 'British', digital_quality: 'Moderate' },
      { name: 'Scotiabank México', type: 'Canadian', digital_quality: 'Moderate' },
    ],
    payment_rails: [
      { name: 'SPEI (Sistema de Pagos Electrónicos Interbancarios)', type: 'Real-time gross settlement', speed: 'Seconds (24/7 since 2023)', cost: 'Free-$5 (bank dependent)', hours: '24/7', limit: 'No fixed limit' },
      { name: 'DiMo (ex-CoDi)', type: 'QR/NFC payments', speed: 'Instant', cost: 'Free', hours: '24/7', limit: '$8K MXN' },
      { name: 'TEF (Transferencia Electrónica de Fondos)', type: 'Same-bank transfer', speed: 'Instant', cost: 'Free', hours: '24/7', limit: 'Bank-dependent' },
      { name: 'SWIFT', type: 'International', speed: '2-4 business days', cost: '$25-45', hours: 'Business hours', limit: 'No fixed limit' },
    ],
    digital_banks: [
      { name: 'Nu México (Nubank)', type: 'Neobank', features: 'Savings, cards, transfers', monthly_fee: 'Free' },
      { name: 'Klar', type: 'Neobank', features: 'Cards, credit, cashback', monthly_fee: 'Free' },
      { name: 'Albo', type: 'Neobank', features: 'Debit card, savings, SPEI', monthly_fee: 'Free' },
      { name: 'Stori', type: 'Credit card fintech', features: 'Credit building, rewards', monthly_fee: 'Free' },
      { name: 'Mercado Pago', type: 'E-wallet', features: 'QR, P2P, credit, savings', monthly_fee: 'Free' },
    ],
    account_requirements: [
      'INE/IFE (voter ID) or passport', 'RFC (tax ID)', 'Constancia de Situación Fiscal',
      'Acta constitutiva (incorporation)', 'Poder del representante legal',
      'Comprobante de domicilio (< 3 months)', 'CURP',
    ],
    special_notes: [
      'SPEI is world-class: real-time, 24/7, near-free interbank transfers',
      'Mexico has the most developed fintech ecosystem in LatAm (Ley Fintech 2018)',
      'BBVA México processes 60%+ of SPEI transactions',
      'Business accounts relatively easy to open with RFC',
      'DiMo (QR payments) adoption growing but behind Brazil\'s PIX',
    ],
    correspondent_banking: 'Strong US correspondent relationships. Most major banks have direct Fedwire/CHIPS access via US branches.',
  },
  colombia: {
    country: 'Colombia',
    currency: 'COP',
    major_banks: [
      { name: 'Bancolombia', type: 'Local (largest)', digital_quality: 'Excellent (Nequi parent)' },
      { name: 'Banco de Bogotá (Grupo Aval)', type: 'Local', digital_quality: 'Good' },
      { name: 'Davivienda', type: 'Local', digital_quality: 'Good (Daviplata)' },
      { name: 'BBVA Colombia', type: 'Spanish', digital_quality: 'Good' },
      { name: 'Scotiabank Colpatria', type: 'Canadian', digital_quality: 'Moderate' },
    ],
    payment_rails: [
      { name: 'ACH Colombia', type: 'Interbank transfer', speed: 'Same day', cost: '$2K-5K COP', hours: 'Business hours', limit: 'No fixed limit' },
      { name: 'PSE (Pagos Seguros en Línea)', type: 'Online bank debit', speed: 'Instant', cost: 'Merchant pays ($2K-5K COP)', hours: '24/7', limit: 'Bank-dependent' },
      { name: 'Transfiya', type: 'Real-time P2P', speed: 'Instant', cost: 'Free', hours: '24/7', limit: '$3M COP' },
      { name: 'SWIFT', type: 'International', speed: '3-5 business days', cost: '$25-50', hours: 'Business hours', limit: 'No fixed limit' },
    ],
    digital_banks: [
      { name: 'Nequi', type: 'Neobank (Bancolombia)', features: 'P2P, savings goals, QR, bill pay', monthly_fee: 'Free' },
      { name: 'Daviplata', type: 'Mobile wallet (Davivienda)', features: 'P2P, deposits, withdrawals', monthly_fee: 'Free' },
      { name: 'Rappipay', type: 'Super-app banking', features: 'Cards, P2P, credit, savings', monthly_fee: 'Free' },
      { name: 'Bold', type: 'Merchant fintech', features: 'POS, QR, cash advance, transfers', monthly_fee: 'Free' },
    ],
    account_requirements: [
      'Cédula de ciudadanía', 'NIT or RUT', 'Certificado de Cámara de Comercio',
      'Estados financieros (2 years)', 'Declaración de renta', 'Composición accionaria',
      'Certificación bancaria existente', 'Visita comercial (some banks)',
    ],
    special_notes: [
      'Nequi + Daviplata combined: 35M+ users (80% of adult population)',
      'PSE dominates online commerce payments',
      'GMF (4x1000): 0.4% tax on bank withdrawals — affects all banking',
      'Colombia has aggressive financial inclusion programs',
      'Business account opening: 1-3 weeks',
    ],
    correspondent_banking: 'Stable correspondent relationships with US banks. Bancolombia has direct US presence.',
  },
  brazil: {
    country: 'Brazil',
    currency: 'BRL',
    major_banks: [
      { name: 'Itaú Unibanco', type: 'Private (largest LatAm bank)', digital_quality: 'Excellent' },
      { name: 'Banco do Brasil', type: 'State-controlled', digital_quality: 'Good' },
      { name: 'Bradesco', type: 'Private', digital_quality: 'Good' },
      { name: 'Santander Brasil', type: 'Spanish', digital_quality: 'Good' },
      { name: 'Caixa Econômica Federal', type: 'State-owned', digital_quality: 'Moderate' },
      { name: 'Nubank', type: 'Digital (5th largest by customers)', digital_quality: 'Excellent' },
    ],
    payment_rails: [
      { name: 'PIX', type: 'Instant payment (BCB)', speed: 'Seconds (24/7/365)', cost: 'Free for individuals, low for business', hours: '24/7/365', limit: 'Configurable (default R$1K-3K night)' },
      { name: 'TED (Transferência Eletrônica Disponível)', type: 'Same-day wire', speed: 'Same day (< 17:00)', cost: 'R$8-20', hours: 'Business hours', limit: 'No minimum' },
      { name: 'DOC', type: 'Next-day transfer', speed: 'Next business day', cost: 'R$8-15', hours: 'Business hours', limit: 'R$4,999.99 max' },
      { name: 'Boleto Bancário', type: 'Payment slip', speed: '1-3 business days to confirm', cost: 'R$2-5 per boleto', hours: '24/7 (payment)', limit: 'No fixed limit' },
      { name: 'SWIFT', type: 'International', speed: '2-5 business days', cost: 'R$100-250', hours: 'Business hours', limit: 'Requires Banco Central approval > $10K' },
    ],
    digital_banks: [
      { name: 'Nubank', type: 'Neobank (90M+ customers)', features: 'Checking, credit, savings, insurance, crypto, business accounts', monthly_fee: 'Free' },
      { name: 'Inter', type: 'Digital bank', features: 'Full banking, marketplace, insurance, investments', monthly_fee: 'Free' },
      { name: 'C6 Bank', type: 'Digital bank', features: 'Full banking, investments, international card', monthly_fee: 'Free' },
      { name: 'PagBank (PagSeguro)', type: 'Merchant + banking', features: 'POS, QR, PIX, business account, credit', monthly_fee: 'Free' },
      { name: 'Stone', type: 'Merchant acquirer', features: 'POS, PIX, working capital, banking', monthly_fee: 'Free' },
    ],
    account_requirements: [
      'CNPJ (Cadastro Nacional da Pessoa Jurídica)', 'Contrato social', 'CPF dos sócios',
      'Comprovante de endereço', 'Documentos dos sócios (RG/CNH)',
      'Faturamento dos últimos 12 meses (for credit)', 'Certificado de regularidade FGTS (some)',
    ],
    special_notes: [
      'PIX is the most successful instant payment system globally: 150M+ users, 3B+ transactions/month',
      'PIX killed boletos for most use cases — even street vendors accept PIX',
      'Nubank is the largest digital bank in the world outside China',
      'BCB developing DREX (digital Real CBDC) and PIX automático (recurring)',
      'IOF: 0.38% on credit operations, FX operations up to 1.1%',
      'Open Finance Brazil: mandatory for large banks, enables fintech innovation',
      'MEI can open free business accounts at Nubank, Inter, C6, PagBank',
    ],
    correspondent_banking: 'Largest banking system in LatAm. Major banks have direct US/EU relationships. BCB controls all FX operations (câmbio).',
  },
  chile: {
    country: 'Chile',
    currency: 'CLP',
    major_banks: [
      { name: 'Banco de Chile', type: 'Local (largest)', digital_quality: 'Good' },
      { name: 'BancoEstado', type: 'State-owned', digital_quality: 'Good (CuentaRUT)' },
      { name: 'Santander Chile', type: 'Spanish', digital_quality: 'Good' },
      { name: 'BCI', type: 'Local', digital_quality: 'Good (MACH)' },
      { name: 'Scotiabank Chile', type: 'Canadian', digital_quality: 'Moderate' },
      { name: 'Itaú Chile', type: 'Brazilian', digital_quality: 'Good' },
    ],
    payment_rails: [
      { name: 'TEF (Transferencia Electrónica de Fondos)', type: 'Interbank transfer', speed: 'Same day / instant (some banks)', cost: 'Free-$1K CLP', hours: 'Business hours', limit: 'No fixed limit' },
      { name: 'CuentaRUT transfers', type: 'BancoEstado universal account', speed: 'Instant (same bank)', cost: 'Free', hours: '24/7', limit: '$2M CLP/day' },
      { name: 'Webpay (Transbank)', type: 'Card acquiring', speed: 'Instant (payment)', cost: '2.5-3.5% + IVA', hours: '24/7', limit: 'No fixed limit' },
      { name: 'SWIFT', type: 'International', speed: '2-4 business days', cost: '$20-40', hours: 'Business hours', limit: 'No fixed limit' },
    ],
    digital_banks: [
      { name: 'MACH (BCI)', type: 'Prepaid + banking', features: 'Visa card, P2P, international purchases', monthly_fee: 'Free' },
      { name: 'Tenpo', type: 'Neobank', features: 'Visa card, transfers, cashback', monthly_fee: 'Free' },
      { name: 'Mercado Pago', type: 'E-wallet', features: 'QR, P2P, credit', monthly_fee: 'Free' },
    ],
    account_requirements: [
      'RUT (Rol Único Tributario)', 'Escritura de constitución', 'Extracto de sociedad (Registro Civil)',
      'Iniciación de actividades SII', 'Último balance tributario', 'Patente comercial municipal',
    ],
    special_notes: [
      'CuentaRUT: universal bank account by BancoEstado — 15M+ accounts (85% of adults)',
      'Transbank quasi-monopoly on card acquiring (under competition reform)',
      'Chile has strictest banking regulation in LatAm (Basel III compliant)',
      'Fintech law (2023) enabling competition — open banking coming',
      'Business accounts: 1-2 weeks with SII documentation',
    ],
    correspondent_banking: 'Strong correspondent network. Chile has A rating — lowest country risk in LatAm.',
  },
  peru: {
    country: 'Peru',
    currency: 'PEN',
    major_banks: [
      { name: 'BCP (Banco de Crédito)', type: 'Local (largest, Credicorp)', digital_quality: 'Good (Yape)' },
      { name: 'BBVA Peru', type: 'Spanish', digital_quality: 'Good (Lukita)' },
      { name: 'Interbank', type: 'Local', digital_quality: 'Good (Tunki)' },
      { name: 'Scotiabank Peru', type: 'Canadian', digital_quality: 'Moderate' },
      { name: 'BanBif', type: 'Local', digital_quality: 'Moderate' },
    ],
    payment_rails: [
      { name: 'CCI (Código de Cuenta Interbancario)', type: 'Interbank transfer', speed: 'Same day / next day', cost: 'S/3-10', hours: 'Business hours', limit: 'No fixed limit' },
      { name: 'Yape (BCP)', type: 'Mobile P2P/merchant', speed: 'Instant', cost: 'Free (P2P)', hours: '24/7', limit: 'S/2,000/day' },
      { name: 'Transferencias inmediatas', type: 'Same-bank', speed: 'Instant', cost: 'Free', hours: '24/7', limit: 'Bank-dependent' },
      { name: 'SWIFT', type: 'International', speed: '3-5 business days', cost: '$25-45', hours: 'Business hours', limit: 'No fixed limit' },
    ],
    digital_banks: [
      { name: 'Yape', type: 'Mobile wallet (BCP)', features: 'P2P, QR, merchant, bill pay', monthly_fee: 'Free' },
      { name: 'Tunki (Interbank)', type: 'Mobile wallet', features: 'P2P, card, transfers', monthly_fee: 'Free' },
      { name: 'Lukita (BBVA)', type: 'Mobile P2P', features: 'P2P transfers', monthly_fee: 'Free' },
    ],
    account_requirements: [
      'DNI or Carnet de Extranjería', 'RUC (for business)', 'Escritura pública de constitución',
      'Vigencia de poder', 'Declaración jurada de domicilio', 'Última declaración de renta',
    ],
    special_notes: [
      'Yape: 15M+ users — dominant mobile wallet (like PIX but via BCP, not central bank)',
      'Peru is ~30% dollarized — many accounts hold both PEN and USD',
      'SBS (Superintendencia de Banca) is a strong regulator',
      'ITF: 0.005% financial transaction tax (minimal)',
      'Business accounts: 1-3 weeks',
    ],
    correspondent_banking: 'Moderate correspondent network. BCP and BBVA Peru have solid US relationships.',
  },
  argentina: {
    country: 'Argentina',
    currency: 'ARS',
    major_banks: [
      { name: 'Banco Nación', type: 'State-owned (largest by branches)', digital_quality: 'Basic' },
      { name: 'Banco Galicia', type: 'Private (largest private)', digital_quality: 'Good' },
      { name: 'Banco Macro', type: 'Private', digital_quality: 'Good' },
      { name: 'Santander Argentina', type: 'Spanish', digital_quality: 'Good' },
      { name: 'BBVA Argentina', type: 'Spanish', digital_quality: 'Good' },
      { name: 'HSBC Argentina', type: 'British', digital_quality: 'Moderate' },
    ],
    payment_rails: [
      { name: 'Transferencia inmediata (DEBIN/CVU)', type: 'Instant interbank', speed: 'Instant (24/7)', cost: 'Free', hours: '24/7', limit: 'ARS limits apply' },
      { name: 'ECHEQ (Electronic Check)', type: 'Digital check', speed: '24-48 hours', cost: 'Free', hours: 'Business hours', limit: 'No fixed limit' },
      { name: 'Mercado Pago', type: 'E-wallet + QR', speed: 'Instant', cost: 'Free P2P, 3-4% merchant', hours: '24/7', limit: 'Account-dependent' },
      { name: 'SWIFT', type: 'International', speed: '3-7 business days', cost: '$30-80', hours: 'Business hours', limit: 'BCRA FX controls (cepo)' },
    ],
    digital_banks: [
      { name: 'Ualá', type: 'Neobank', features: 'Debit card, P2P, investments, crypto, credit', monthly_fee: 'Free' },
      { name: 'Mercado Pago', type: 'Super-app wallet', features: 'QR, P2P, credit, savings, crypto', monthly_fee: 'Free' },
      { name: 'Naranja X', type: 'Fintech', features: 'Credit card, savings, transfers', monthly_fee: 'Free' },
      { name: 'Brubank', type: 'Digital bank', features: 'Full banking, investments', monthly_fee: 'Free' },
    ],
    account_requirements: [
      'DNI', 'CUIT/CUIL', 'Constancia de inscripción AFIP', 'Contrato social',
      'Últimos balances certificados', 'Declaración jurada de Ganancias y Bienes Personales',
    ],
    special_notes: [
      'Cepo cambiario: strict capital controls limit USD purchases and international transfers',
      'Multiple exchange rates: official (~$900), MEP (~$1100), CCL (~$1150), blue (~$1200)',
      'Mercado Pago is Argentina\'s most used financial app (30M+ users)',
      'High-yield savings accounts (plazos fijos) at 80-100%+ annual — but barely beat inflation',
      'CVU (Clave Virtual Uniforme) connects fintechs to banking system',
      'Business accounts: 1-2 weeks but BCRA regulations are complex',
      'International transfers require BCRA approval and tax clearance (DJAI/SIRA)',
    ],
    correspondent_banking: 'Severely constrained by cepo cambiario. BCRA controls all FX. Many correspondent relationships degraded.',
  },
  costa_rica: {
    country: 'Costa Rica',
    currency: 'CRC',
    major_banks: [
      { name: 'Banco Nacional de Costa Rica', type: 'State-owned (largest)', digital_quality: 'Good' },
      { name: 'Banco de Costa Rica (BCR)', type: 'State-owned', digital_quality: 'Good' },
      { name: 'BAC Credomatic', type: 'Regional (Central America)', digital_quality: 'Good' },
      { name: 'Scotiabank Costa Rica', type: 'Canadian', digital_quality: 'Moderate' },
      { name: 'Davivienda Costa Rica', type: 'Colombian', digital_quality: 'Good' },
    ],
    payment_rails: [
      { name: 'SINPE (Sistema Nacional de Pagos Electrónicos)', type: 'Interbank transfer', speed: 'Same day', cost: '₡200-500', hours: 'Business hours', limit: 'No fixed limit' },
      { name: 'SINPE Móvil', type: 'Mobile instant P2P', speed: 'Instant', cost: 'Free', hours: '24/7', limit: '₡100K-500K/day' },
      { name: 'Transferencia BCCR', type: 'Central bank settlement', speed: 'Real-time', cost: '₡500-1000', hours: 'Business hours', limit: 'No fixed limit' },
      { name: 'SWIFT', type: 'International', speed: '3-5 business days', cost: '$25-45', hours: 'Business hours', limit: 'No fixed limit' },
    ],
    digital_banks: [
      { name: 'SINPE Móvil', type: 'Interbank mobile (BCCR)', features: 'P2P via phone number, all banks', monthly_fee: 'Free' },
      { name: 'BAC Credomatic app', type: 'Mobile banking', features: 'Full banking, SINPE, cards', monthly_fee: 'Included with account' },
    ],
    account_requirements: [
      'Cédula de identidad or DIMEX (foreigners)', 'Cédula jurídica', 'Personería jurídica',
      'Certificación de CCSS (social security)', 'Certificación tributaria Hacienda',
      'Comprobante de domicilio', 'Minimum deposit varies',
    ],
    special_notes: [
      'SINPE Móvil is excellent: phone-number-based instant transfers across all banks',
      'Costa Rica is semi-dollarized — many accounts in both CRC and USD',
      'State banks (Banco Nacional, BCR) guarantee deposits by law',
      'Business accounts: 2-4 weeks',
      'Dollarized accounts pay in USD directly — no FX needed for USD operations',
    ],
    correspondent_banking: 'Moderate. BAC has strong regional network. State banks have US correspondents.',
  },
};

export function getAllLatamBankingTools(): ToolSchema[] {
  return [

    // 1. Business Account Advisor
    {
      name: 'banking_accountAdvisor',
      description: 'Compare business bank accounts available in any LatAm country. Shows major banks, digital quality, fees, features, and account opening requirements. Essential for SMBs choosing where to bank.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country or "compare" for overview' },
          needs: { type: 'string', description: 'Specific needs: international_transfers, low_fees, digital_first, usd_account, merchant_services' },
        },
        required: ['country'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();

        if (country === 'compare' || country === 'all') {
          const overview = Object.entries(BANKING_SYSTEMS).map(([c, bs]) => ({
            country: c,
            currency: bs.currency,
            top_bank: bs.major_banks[0]?.name,
            bank_count: bs.major_banks.length,
            best_digital: bs.digital_banks[0]?.name,
            instant_payment: bs.payment_rails.find(r => r.speed.toLowerCase().includes('instant'))?.name || 'N/A',
          }));
          log.info('banking_compare', { trace_id: traceId });
          return { countries: overview };
        }

        const bs = BANKING_SYSTEMS[country];
        if (!bs) return { error: `Unknown country: ${country}. Supported: ${Object.keys(BANKING_SYSTEMS).join(', ')}` };

        log.info('banking_account', { country, trace_id: traceId });
        return {
          country: bs.country,
          currency: bs.currency,
          major_banks: bs.major_banks,
          digital_banks: bs.digital_banks,
          account_requirements: bs.account_requirements,
          special_notes: bs.special_notes,
          recommendation: bs.digital_banks[0]
            ? `Para un negocio digital, considere ${bs.digital_banks[0].name} (${bs.digital_banks[0].monthly_fee}) además de un banco tradicional.`
            : 'Abra cuenta en el banco más grande del país para mejor acceso a servicios.',
        };
      },
    },

    // 2. Payment Rails
    {
      name: 'banking_paymentRails',
      description: 'Explain domestic and international payment rails by country: ACH, SPEI, PIX, SINPE, PSE, Yappy, LBTR, SWIFT. Shows speed, cost, hours, and limits. Critical for understanding how money moves.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country or "compare"' },
        },
        required: ['country'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();

        if (country === 'compare' || country === 'all') {
          const comparison = Object.entries(BANKING_SYSTEMS).map(([c, bs]) => ({
            country: c,
            instant_system: bs.payment_rails.find(r => r.speed.toLowerCase().includes('instant') || r.speed.toLowerCase().includes('second'))?.name || 'None',
            rails_count: bs.payment_rails.length,
            cheapest_domestic: bs.payment_rails.filter(r => !r.name.includes('SWIFT')).sort((a, b) => {
              const costA = parseFloat(a.cost.replace(/[^0-9.]/g, '')) || 0;
              const costB = parseFloat(b.cost.replace(/[^0-9.]/g, '')) || 0;
              return costA - costB;
            })[0]?.name || 'N/A',
          }));
          log.info('rails_compare', { trace_id: traceId });
          return { payment_systems: comparison, note: 'PIX (Brazil), SPEI (Mexico), and SINPE Móvil (Costa Rica) are the most advanced instant payment systems in LatAm.' };
        }

        const bs = BANKING_SYSTEMS[country];
        if (!bs) return { error: `Unknown country: ${country}` };
        log.info('payment_rails', { country, trace_id: traceId });
        return { country: bs.country, currency: bs.currency, payment_rails: bs.payment_rails, correspondent_banking: bs.correspondent_banking };
      },
    },

    // 3. Digital Bank Comparison
    {
      name: 'banking_digitalBankCompare',
      description: 'Compare digital banks and neobanks in LatAm: Nubank, Ualá, Klar, Nequi, Daviplata, Rappipay, MACH, Mercado Pago. Features, fees, and availability by country.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country' },
        },
        required: ['country'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();
        const bs = BANKING_SYSTEMS[country];
        if (!bs) return { error: `Unknown country: ${country}` };
        log.info('digital_banks', { country, trace_id: traceId });
        return {
          country: bs.country,
          digital_banks: bs.digital_banks,
          instant_payment_system: bs.payment_rails.find(r => r.speed.toLowerCase().includes('instant'))?.name || 'No instant system',
          tip: 'En LatAm, las billeteras digitales ya superan en usuarios a los bancos tradicionales en varios países. Nequi (CO), PIX (BR), Yappy (PA), Yape (PE) son imprescindibles para cobrar.',
        };
      },
    },

    // 4. International Wiring Guide
    {
      name: 'banking_internationalWiring',
      description: 'Guide for sending/receiving international wire transfers from LatAm. Covers SWIFT codes, intermediary banks, costs, timing, documentation, and cheaper alternatives (Wise, crypto, fintech corridors).',
      parameters: {
        type: 'object',
        properties: {
          from_country: { type: 'string', description: 'Sending country' },
          to_country: { type: 'string', description: 'Receiving country' },
          amount_usd: { type: 'number', description: 'Amount in USD' },
          purpose: { type: 'string', description: 'Purpose: supplier_payment, salary, investment, personal, loan_repayment' },
        },
        required: ['from_country', 'to_country'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const from = String(args.from_country || '').toLowerCase();
        const to = String(args.to_country || '').toLowerCase();
        const amount = Number(args.amount_usd) || 1000;
        const purpose = String(args.purpose || 'general');

        const fromBanking = BANKING_SYSTEMS[from];
        const toBanking = BANKING_SYSTEMS[to];

        const systemPrompt = `You are an international payments specialist for Latin America.
Deep knowledge of SWIFT network, correspondent banking, FX controls, and documentation requirements.
${from === 'argentina' ? 'CRITICAL: Argentina has strict capital controls (cepo). All FX operations require BCRA approval. Use MEP/CCL for better rates legally.' : ''}

Know:
- SWIFT MT103 for wire transfers, MT202 for bank-to-bank
- Common intermediary banks for LatAm corridors (Citibank NY, JPMorgan, BofA)
- Documentation: invoices, contracts, tax clearance, central bank forms
- Alternatives: Wise, Payoneer, crypto (USDT on Tron), Western Union, Remitly
- FX spreads and hidden fees
- Regulatory requirements per country

${fromBanking ? `From ${from}: ${fromBanking.correspondent_banking}` : ''}
${toBanking ? `To ${to}: ${toBanking.correspondent_banking}` : ''}

Default language: Spanish.

Respond with JSON:
{
  "swift_transfer": { "estimated_cost_usd": number, "timeline_days": string, "documents_needed": [string], "intermediary_note": string },
  "alternatives": [{ "provider": string, "cost_usd": number, "speed": string, "pros": [string], "cons": [string] }],
  "fx_considerations": string,
  "regulatory_requirements": [string],
  "recommended_option": string,
  "tips": [string]
}`;

        try {
          const raw = await callLLM(systemPrompt, `Wire transfer: ${from} → ${to}, $${amount} USD, purpose: ${purpose}`, { maxTokens: 1536, temperature: 0.25 });
          const match = raw.match(/\{[\s\S]*\}/);
          log.info('intl_wiring', { from, to, amount, trace_id: traceId });
          return match ? JSON.parse(match[0]) : { error: 'Could not generate guide' };
        } catch (err) {
          return { error: `International wiring guide failed: ${(err as Error).message}` };
        }
      },
    },

    // 5. Account Opening Guide
    {
      name: 'banking_accountOpening',
      description: 'Step-by-step guide to opening a business bank account in any LatAm country. Requirements, documents, timeline, common pitfalls, and tips for foreigners.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country' },
          business_type: { type: 'string', description: 'Type of business entity (SAS, SA, SRL, sole prop, foreigner)' },
          is_foreigner: { type: 'boolean', description: 'Is the account holder a foreigner?' },
          has_local_entity: { type: 'boolean', description: 'Already has a local legal entity?' },
        },
        required: ['country'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();
        const bs = BANKING_SYSTEMS[country];
        if (!bs) return { error: `Unknown country: ${country}` };
        const isForeigner = Boolean(args.is_foreigner);

        const systemPrompt = `You are a banking relationship specialist for ${country}. Guide SMBs through opening a business bank account.

Banking landscape: ${bs.major_banks.map(b => b.name).join(', ')}
Required documents: ${bs.account_requirements.join(', ')}
${isForeigner ? 'IMPORTANT: This is a FOREIGNER opening an account — additional requirements and challenges apply.' : ''}

Know:
- Which banks are easiest for new businesses
- Which banks are foreigner-friendly
- Common rejection reasons and how to avoid them
- Digital account options that are faster
- Expected timeline
- Minimum balance requirements
- Tips for passing compliance/due diligence

Default language: Spanish.

Respond with JSON:
{
  "recommended_banks": [{ "name": string, "why": string, "timeline": string, "min_deposit": string }],
  "documents_checklist": [{ "document": string, "where_to_get": string, "cost": string }],
  "step_by_step": [{ "step": number, "action": string, "timeline": string }],
  "common_pitfalls": [string],
  "tips": [string],
  "digital_alternative": string,
  "total_estimated_cost_usd": number,
  "total_timeline": string
}`;

        try {
          const raw = await callLLM(systemPrompt, JSON.stringify({ ...args, banking_notes: bs.special_notes }), { maxTokens: 2048, temperature: 0.25 });
          const match = raw.match(/\{[\s\S]*\}/);
          log.info('account_opening', { country, foreigner: isForeigner, trace_id: traceId });
          return match ? JSON.parse(match[0]) : { error: 'Could not generate guide' };
        } catch (err) {
          return { error: `Account opening guide failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
