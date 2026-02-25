/**
 * Country Configuration Tools — Auto-Configure by Country
 *
 * When a workspace selects their country, this auto-configures:
 *   - Tax rates (IVA/ITBMS/ISV/IGV/etc.)
 *   - Currency and formatting
 *   - Payment provider priorities
 *   - Invoice format and legal requirements
 *   - Tax ID validation (RUC, RFC, NIT, CNPJ, etc.)
 *   - Employment cost multipliers
 *
 * 3 tools:
 *   - country_configure     (medium) — Set country and auto-configure workspace
 *   - country_getConfig     (low)    — Get current country configuration
 *   - country_validateTaxId (low)    — Validate a tax ID for current country
 */

import type { ToolSchema } from './registry.js';

// ── Types ──

export interface CountryConfig {
  country: string;
  countryCode: string;       // ISO 3166-1 alpha-2
  currency: string;          // ISO 4217
  currencySymbol: string;
  currencyLocale: string;    // For Intl.NumberFormat
  taxName: string;           // Local name: IVA, ITBMS, ISV, etc.
  taxRate: number;           // Standard rate as decimal (0.07 = 7%)
  reducedTaxRates: Record<string, number>; // Category → rate
  taxIdName: string;         // RUC, RFC, NIT, CNPJ, etc.
  taxIdPattern: string;      // Regex pattern for validation
  taxIdExample: string;      // Example format
  paymentProviders: string[]; // Priority-ordered
  invoiceRequirements: string[]; // Legally required invoice fields
  fiscalYearEnd: string;     // MM-DD
  electronicInvoice: { required: boolean; system: string; authority: string };
  employerCostMultiplier: number; // e.g. 1.42 means 42% on top of salary
  minimumWage: { amount: number; currency: string; period: 'monthly' | 'hourly' };
  timezone: string;
  language: 'es' | 'en' | 'pt';
}

// ── Country Database ──

const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  PA: {
    country: 'Panama',
    countryCode: 'PA',
    currency: 'USD',
    currencySymbol: '$',
    currencyLocale: 'es-PA',
    taxName: 'ITBMS',
    taxRate: 0.07,
    reducedTaxRates: { alcohol_tobacco: 0.10, hotel_lodging: 0.10, essential_goods: 0 },
    taxIdName: 'RUC',
    taxIdPattern: '^\\d{1,2}-\\d{1,4}-\\d{1,6}$',
    taxIdExample: '8-123-456789',
    paymentProviders: ['yappy', 'bac', 'stripe', 'paypal', 'banco_general'],
    invoiceRequirements: ['RUC emisor', 'RUC receptor', 'ITBMS desglosado', 'DGI autorización', 'Fecha emisión', 'Número secuencial'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'FE DGI', authority: 'Dirección General de Ingresos' },
    employerCostMultiplier: 1.3825,
    minimumWage: { amount: 654, currency: 'USD', period: 'monthly' },
    timezone: 'America/Panama',
    language: 'es',
  },
  MX: {
    country: 'Mexico',
    countryCode: 'MX',
    currency: 'MXN',
    currencySymbol: '$',
    currencyLocale: 'es-MX',
    taxName: 'IVA',
    taxRate: 0.16,
    reducedTaxRates: { border_zone: 0.08, essential_food: 0, medicine: 0 },
    taxIdName: 'RFC',
    taxIdPattern: '^[A-ZÑ&]{3,4}\\d{6}[A-Z0-9]{3}$',
    taxIdExample: 'XAXX010101000',
    paymentProviders: ['stripe', 'mercadopago', 'oxxo_pay', 'spei', 'paypal'],
    invoiceRequirements: ['RFC emisor', 'RFC receptor', 'CFDI UUID', 'IVA desglosado', 'Régimen fiscal', 'Uso CFDI'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'CFDI 4.0', authority: 'SAT' },
    employerCostMultiplier: 1.35,
    minimumWage: { amount: 7468, currency: 'MXN', period: 'monthly' },
    timezone: 'America/Mexico_City',
    language: 'es',
  },
  CO: {
    country: 'Colombia',
    countryCode: 'CO',
    currency: 'COP',
    currencySymbol: '$',
    currencyLocale: 'es-CO',
    taxName: 'IVA',
    taxRate: 0.19,
    reducedTaxRates: { basic_food: 0, health: 0, reduced_goods: 0.05 },
    taxIdName: 'NIT',
    taxIdPattern: '^\\d{9}-\\d{1}$',
    taxIdExample: '900123456-7',
    paymentProviders: ['nequi', 'daviplata', 'stripe', 'mercadopago', 'pse'],
    invoiceRequirements: ['NIT emisor', 'NIT receptor', 'IVA discriminado', 'DIAN autorización', 'Resolución facturación', 'CUFE'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'FE DIAN', authority: 'DIAN' },
    employerCostMultiplier: 1.52,
    minimumWage: { amount: 1300000, currency: 'COP', period: 'monthly' },
    timezone: 'America/Bogota',
    language: 'es',
  },
  BR: {
    country: 'Brazil',
    countryCode: 'BR',
    currency: 'BRL',
    currencySymbol: 'R$',
    currencyLocale: 'pt-BR',
    taxName: 'ICMS/ISS',
    taxRate: 0.18,
    reducedTaxRates: { simples_nacional: 0.06, essential_food: 0.07, services_iss: 0.05 },
    taxIdName: 'CNPJ',
    taxIdPattern: '^\\d{2}\\.\\d{3}\\.\\d{3}\\/\\d{4}-\\d{2}$',
    taxIdExample: '12.345.678/0001-95',
    paymentProviders: ['pix', 'stripe', 'mercadopago', 'pagseguro', 'boleto'],
    invoiceRequirements: ['CNPJ emissor', 'CNPJ destinatário', 'NF-e chave acesso', 'ICMS', 'PIS/COFINS', 'Código NCM'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'NF-e / NFS-e', authority: 'SEFAZ / Prefeitura' },
    employerCostMultiplier: 1.70,
    minimumWage: { amount: 1518, currency: 'BRL', period: 'monthly' },
    timezone: 'America/Sao_Paulo',
    language: 'pt',
  },
  AR: {
    country: 'Argentina',
    countryCode: 'AR',
    currency: 'ARS',
    currencySymbol: '$',
    currencyLocale: 'es-AR',
    taxName: 'IVA',
    taxRate: 0.21,
    reducedTaxRates: { reduced: 0.105, essential_food: 0, technology: 0.105 },
    taxIdName: 'CUIT',
    taxIdPattern: '^\\d{2}-\\d{8}-\\d{1}$',
    taxIdExample: '20-12345678-9',
    paymentProviders: ['mercadopago', 'stripe', 'rapipago', 'pagofacil', 'transferencia'],
    invoiceRequirements: ['CUIT emisor', 'CUIT receptor', 'CAE/CAI', 'IVA discriminado', 'Punto de venta', 'Tipo comprobante'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'Factura Electrónica AFIP', authority: 'AFIP' },
    employerCostMultiplier: 1.45,
    minimumWage: { amount: 271571, currency: 'ARS', period: 'monthly' },
    timezone: 'America/Argentina/Buenos_Aires',
    language: 'es',
  },
  CL: {
    country: 'Chile',
    countryCode: 'CL',
    currency: 'CLP',
    currencySymbol: '$',
    currencyLocale: 'es-CL',
    taxName: 'IVA',
    taxRate: 0.19,
    reducedTaxRates: { exempt_exports: 0, construction: 0.065 },
    taxIdName: 'RUT',
    taxIdPattern: '^\\d{1,2}\\.\\d{3}\\.\\d{3}-[\\dkK]$',
    taxIdExample: '12.345.678-9',
    paymentProviders: ['webpay', 'stripe', 'mercadopago', 'khipu', 'flow'],
    invoiceRequirements: ['RUT emisor', 'RUT receptor', 'IVA desglosado', 'SII timbraje', 'Resolución exenta'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'DTE SII', authority: 'SII' },
    employerCostMultiplier: 1.30,
    minimumWage: { amount: 500000, currency: 'CLP', period: 'monthly' },
    timezone: 'America/Santiago',
    language: 'es',
  },
  PE: {
    country: 'Peru',
    countryCode: 'PE',
    currency: 'PEN',
    currencySymbol: 'S/',
    currencyLocale: 'es-PE',
    taxName: 'IGV',
    taxRate: 0.18,
    reducedTaxRates: { exempt_education: 0, agro: 0 },
    taxIdName: 'RUC',
    taxIdPattern: '^\\d{11}$',
    taxIdExample: '20123456789',
    paymentProviders: ['yape', 'plin', 'stripe', 'mercadopago', 'pagoefectivo'],
    invoiceRequirements: ['RUC emisor', 'RUC receptor', 'IGV desglosado', 'SUNAT autorización', 'Serie-Número'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'CPE SUNAT', authority: 'SUNAT' },
    employerCostMultiplier: 1.40,
    minimumWage: { amount: 1025, currency: 'PEN', period: 'monthly' },
    timezone: 'America/Lima',
    language: 'es',
  },
  EC: {
    country: 'Ecuador',
    countryCode: 'EC',
    currency: 'USD',
    currencySymbol: '$',
    currencyLocale: 'es-EC',
    taxName: 'IVA',
    taxRate: 0.15,
    reducedTaxRates: { basic_food: 0, health: 0, education: 0 },
    taxIdName: 'RUC',
    taxIdPattern: '^\\d{13}$',
    taxIdExample: '1234567890001',
    paymentProviders: ['stripe', 'payphone', 'datafast', 'paypal'],
    invoiceRequirements: ['RUC emisor', 'RUC receptor', 'IVA desglosado', 'SRI autorización', 'Clave de acceso'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'Facturación Electrónica SRI', authority: 'SRI' },
    employerCostMultiplier: 1.35,
    minimumWage: { amount: 460, currency: 'USD', period: 'monthly' },
    timezone: 'America/Guayaquil',
    language: 'es',
  },
  CR: {
    country: 'Costa Rica',
    countryCode: 'CR',
    currency: 'CRC',
    currencySymbol: '₡',
    currencyLocale: 'es-CR',
    taxName: 'IVA',
    taxRate: 0.13,
    reducedTaxRates: { canasta_basica: 0.01, health_services: 0.04, education: 0.02 },
    taxIdName: 'Cédula Jurídica',
    taxIdPattern: '^\\d{1}-\\d{3}-\\d{6}$',
    taxIdExample: '3-101-123456',
    paymentProviders: ['sinpe_movil', 'stripe', 'paypal', 'bac_cr'],
    invoiceRequirements: ['Cédula emisor', 'Cédula receptor', 'IVA desglosado', 'Hacienda autorización', 'Clave numérica'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'FE Hacienda', authority: 'Ministerio de Hacienda' },
    employerCostMultiplier: 1.42,
    minimumWage: { amount: 369113, currency: 'CRC', period: 'monthly' },
    timezone: 'America/Costa_Rica',
    language: 'es',
  },
  DO: {
    country: 'Dominican Republic',
    countryCode: 'DO',
    currency: 'DOP',
    currencySymbol: 'RD$',
    currencyLocale: 'es-DO',
    taxName: 'ITBIS',
    taxRate: 0.18,
    reducedTaxRates: { basic_food: 0, reduced: 0.16 },
    taxIdName: 'RNC',
    taxIdPattern: '^\\d{9}$',
    taxIdExample: '123456789',
    paymentProviders: ['stripe', 'paypal', 'banreservas', 'popular'],
    invoiceRequirements: ['RNC emisor', 'RNC receptor', 'ITBIS desglosado', 'NCF', 'DGII autorización'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'e-CF DGII', authority: 'DGII' },
    employerCostMultiplier: 1.28,
    minimumWage: { amount: 21000, currency: 'DOP', period: 'monthly' },
    timezone: 'America/Santo_Domingo',
    language: 'es',
  },
  US: {
    country: 'United States',
    countryCode: 'US',
    currency: 'USD',
    currencySymbol: '$',
    currencyLocale: 'en-US',
    taxName: 'Sales Tax',
    taxRate: 0, // Varies by state
    reducedTaxRates: { no_federal_sales_tax: 0 },
    taxIdName: 'EIN',
    taxIdPattern: '^\\d{2}-\\d{7}$',
    taxIdExample: '12-3456789',
    paymentProviders: ['stripe', 'square', 'paypal', 'ach', 'zelle'],
    invoiceRequirements: ['Business name', 'EIN optional', 'Sales tax if applicable', 'Payment terms', 'Invoice number'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: false, system: 'N/A', authority: 'IRS' },
    employerCostMultiplier: 1.30,
    minimumWage: { amount: 7.25, currency: 'USD', period: 'hourly' },
    timezone: 'America/New_York',
    language: 'en',
  },
  GT: {
    country: 'Guatemala',
    countryCode: 'GT',
    currency: 'GTQ',
    currencySymbol: 'Q',
    currencyLocale: 'es-GT',
    taxName: 'IVA',
    taxRate: 0.12,
    reducedTaxRates: { exports: 0 },
    taxIdName: 'NIT',
    taxIdPattern: '^\\d{7,8}-[\\dkK]$',
    taxIdExample: '1234567-K',
    paymentProviders: ['stripe', 'paypal', 'visanet_gt'],
    invoiceRequirements: ['NIT emisor', 'NIT receptor', 'IVA desglosado', 'SAT autorización', 'FEL'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'FEL SAT', authority: 'SAT Guatemala' },
    employerCostMultiplier: 1.42,
    minimumWage: { amount: 3268, currency: 'GTQ', period: 'monthly' },
    timezone: 'America/Guatemala',
    language: 'es',
  },
  HN: {
    country: 'Honduras',
    countryCode: 'HN',
    currency: 'HNL',
    currencySymbol: 'L',
    currencyLocale: 'es-HN',
    taxName: 'ISV',
    taxRate: 0.15,
    reducedTaxRates: { basic_goods: 0, reduced: 0.18 },
    taxIdName: 'RTN',
    taxIdPattern: '^\\d{14}$',
    taxIdExample: '08011900123456',
    paymentProviders: ['stripe', 'paypal', 'tigo_money'],
    invoiceRequirements: ['RTN emisor', 'RTN receptor', 'ISV desglosado', 'SAR autorización', 'CAI'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'DET SAR', authority: 'SAR' },
    employerCostMultiplier: 1.35,
    minimumWage: { amount: 11549, currency: 'HNL', period: 'monthly' },
    timezone: 'America/Tegucigalpa',
    language: 'es',
  },
  SV: {
    country: 'El Salvador',
    countryCode: 'SV',
    currency: 'USD',
    currencySymbol: '$',
    currencyLocale: 'es-SV',
    taxName: 'IVA',
    taxRate: 0.13,
    reducedTaxRates: { basic_food: 0 },
    taxIdName: 'NIT',
    taxIdPattern: '^\\d{4}-\\d{6}-\\d{3}-\\d{1}$',
    taxIdExample: '0614-010190-103-2',
    paymentProviders: ['stripe', 'paypal', 'chivo_wallet'],
    invoiceRequirements: ['NIT emisor', 'NIT receptor', 'IVA desglosado', 'Resolución MH'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'DTE MH', authority: 'Ministerio de Hacienda' },
    employerCostMultiplier: 1.32,
    minimumWage: { amount: 365, currency: 'USD', period: 'monthly' },
    timezone: 'America/El_Salvador',
    language: 'es',
  },
  UY: {
    country: 'Uruguay',
    countryCode: 'UY',
    currency: 'UYU',
    currencySymbol: '$U',
    currencyLocale: 'es-UY',
    taxName: 'IVA',
    taxRate: 0.22,
    reducedTaxRates: { basic_food: 0.10, tourism: 0 },
    taxIdName: 'RUT',
    taxIdPattern: '^\\d{12}$',
    taxIdExample: '211234560018',
    paymentProviders: ['stripe', 'mercadopago', 'redpagos', 'abitab'],
    invoiceRequirements: ['RUT emisor', 'RUT receptor', 'IVA desglosado', 'DGI autorización', 'CFE'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'CFE DGI', authority: 'DGI Uruguay' },
    employerCostMultiplier: 1.45,
    minimumWage: { amount: 22268, currency: 'UYU', period: 'monthly' },
    timezone: 'America/Montevideo',
    language: 'es',
  },
  PY: {
    country: 'Paraguay',
    countryCode: 'PY',
    currency: 'PYG',
    currencySymbol: '₲',
    currencyLocale: 'es-PY',
    taxName: 'IVA',
    taxRate: 0.10,
    reducedTaxRates: { basic_food: 0.05 },
    taxIdName: 'RUC',
    taxIdPattern: '^\\d{6,8}-\\d{1}$',
    taxIdExample: '12345678-9',
    paymentProviders: ['stripe', 'paypal', 'tigo_money_py'],
    invoiceRequirements: ['RUC emisor', 'RUC receptor', 'IVA desglosado', 'SET timbrado'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'SIFEN SET', authority: 'SET' },
    employerCostMultiplier: 1.27,
    minimumWage: { amount: 2798309, currency: 'PYG', period: 'monthly' },
    timezone: 'America/Asuncion',
    language: 'es',
  },
  BO: {
    country: 'Bolivia',
    countryCode: 'BO',
    currency: 'BOB',
    currencySymbol: 'Bs',
    currencyLocale: 'es-BO',
    taxName: 'IVA',
    taxRate: 0.13,
    reducedTaxRates: {},
    taxIdName: 'NIT',
    taxIdPattern: '^\\d{7,10}$',
    taxIdExample: '1234567890',
    paymentProviders: ['stripe', 'paypal'],
    invoiceRequirements: ['NIT emisor', 'NIT comprador', 'IVA', 'SIN autorización', 'Dosificación'],
    fiscalYearEnd: '12-31',
    electronicInvoice: { required: true, system: 'SFV SIN', authority: 'SIN' },
    employerCostMultiplier: 1.30,
    minimumWage: { amount: 2362, currency: 'BOB', period: 'monthly' },
    timezone: 'America/La_Paz',
    language: 'es',
  },
};

// ── In-memory workspace config store ──

const workspaceConfigs: Map<string, CountryConfig> = new Map();

// Default to Panama
workspaceConfigs.set('default', COUNTRY_CONFIGS['PA']);

// ── Exported Helpers ──

export function getCountryConfig(orgId = 'default'): CountryConfig {
  return workspaceConfigs.get(orgId) || workspaceConfigs.get('default')!;
}

export function getSupportedCountries(): string[] {
  return Object.keys(COUNTRY_CONFIGS);
}

export function formatCurrency(amount: number, config: CountryConfig): string {
  return new Intl.NumberFormat(config.currencyLocale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: config.currency === 'CLP' || config.currency === 'PYG' ? 0 : 2,
  }).format(amount);
}

export function calculateTax(subtotal: number, config: CountryConfig, category?: string): { tax: number; total: number; rate: number; taxName: string } {
  const rate = (category && config.reducedTaxRates[category] !== undefined)
    ? config.reducedTaxRates[category]
    : config.taxRate;
  const tax = subtotal * rate;
  return { tax: Math.round(tax * 100) / 100, total: Math.round((subtotal + tax) * 100) / 100, rate, taxName: config.taxName };
}

// ── Tools ──

export function getAllCountryConfigTools(): ToolSchema[] {
  return [
    {
      name: 'country_configure',
      description:
        'Configure workspace for a specific country. Auto-sets tax rates, currency, payment providers, ' +
        'invoice requirements, and compliance rules. Supported: PA, MX, CO, BR, AR, CL, PE, EC, CR, DO, US, GT, HN, SV, UY, PY, BO.',
      parameters: {
        type: 'object',
        properties: {
          country_code: { type: 'string', description: 'ISO 3166-1 alpha-2 code (e.g. PA, MX, CO, BR)' },
          org_id: { type: 'string', description: 'Organization ID (default: "default")' },
        },
        required: ['country_code'],
      },
      riskLevel: 'medium',
      execute: async (args) => {
        const code = String(args.country_code).toUpperCase();
        const orgId = (args.org_id as string) || 'default';
        const config = COUNTRY_CONFIGS[code];
        if (!config) {
          return {
            error: `Country "${code}" not supported. Available: ${Object.keys(COUNTRY_CONFIGS).join(', ')}`,
          };
        }
        workspaceConfigs.set(orgId, config);
        return {
          config,
          message: `Workspace configured for ${config.country}. Tax: ${config.taxName} ${(config.taxRate * 100).toFixed(0)}%, Currency: ${config.currency}, E-Invoice: ${config.electronicInvoice.system}.`,
        };
      },
    },
    {
      name: 'country_getConfig',
      description: 'Get the current country configuration for the workspace — tax rates, currency, payment providers, invoice requirements.',
      parameters: {
        type: 'object',
        properties: {
          org_id: { type: 'string', description: 'Organization ID (default: "default")' },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        const orgId = (args.org_id as string) || 'default';
        const config = workspaceConfigs.get(orgId);
        if (!config) return { error: 'No country configured. Use country_configure first.' };
        return { config };
      },
    },
    {
      name: 'country_validateTaxId',
      description: 'Validate a tax ID (RUC, RFC, NIT, CNPJ, etc.) for the configured country.',
      parameters: {
        type: 'object',
        properties: {
          tax_id: { type: 'string', description: 'The tax ID to validate' },
          country_code: { type: 'string', description: 'Override country (uses workspace default if omitted)' },
        },
        required: ['tax_id'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const taxId = String(args.tax_id).trim();
        const code = args.country_code ? String(args.country_code).toUpperCase() : undefined;
        const config = code ? COUNTRY_CONFIGS[code] : workspaceConfigs.get('default');
        if (!config) return { error: 'No country configured.' };

        const regex = new RegExp(config.taxIdPattern);
        const valid = regex.test(taxId);
        return {
          valid,
          taxIdName: config.taxIdName,
          country: config.country,
          pattern: config.taxIdPattern,
          example: config.taxIdExample,
          message: valid
            ? `Valid ${config.taxIdName} for ${config.country}.`
            : `Invalid ${config.taxIdName}. Expected format: ${config.taxIdExample}`,
        };
      },
    },
  ];
}
