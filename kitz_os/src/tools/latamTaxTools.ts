/**
 * LatAm Tax Intelligence Tools — Deep tax code knowledge for 8 countries.
 *
 * 6 tools:
 *   - tax_rateCalculator        (low)    — Calculate effective tax rate: income tax + sales tax + payroll + withholding
 *   - tax_filingCalendar        (low)    — Filing deadlines, forms, and penalties by country
 *   - tax_invoiceRequirements   (low)    — Electronic invoice (factura electrónica) requirements per country
 *   - tax_withholding           (low)    — Withholding tax rates on payments to suppliers, freelancers, cross-border
 *   - tax_payrollCalculator     (low)    — Employer cost calculator: social security, severance, benefits by country
 *   - tax_structureAdvisor      (medium) — AI advice on optimal legal structure (SAS, SA, SRL, sole prop) for tax efficiency
 *
 * Hardcoded tax tables for Panama, Mexico, Colombia, Brazil, Chile, Peru, Costa Rica, Argentina.
 * No API keys required — all knowledge is embedded.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { callLLM } from './shared/callLLM.js';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('latamTaxTools');

// ── Tax Code Knowledge Base ──

interface TaxRegime {
  income_tax: { corporate_rate_pct: number; progressive_personal: Array<{ bracket_usd: number; rate_pct: number }>; sme_regime?: string };
  sales_tax: { name: string; standard_rate_pct: number; reduced_rates: Array<{ category: string; rate_pct: number }>; exempt: string[] };
  payroll: { employer_social_security_pct: number; employee_social_security_pct: number; other_employer_costs: Array<{ name: string; rate_pct: number }>; thirteenth_month: boolean; fourteenth_month: boolean; severance_formula: string };
  withholding: { services_domestic_pct: number; services_foreign_pct: number; dividends_pct: number; royalties_pct: number; interest_pct: number };
  filing: { corporate_deadline: string; personal_deadline: string; sales_tax_frequency: string; authority: string; electronic_filing: boolean; penalties: string };
  invoice: { system_name: string; mandatory: boolean; provider: string; key_requirements: string[] };
  special: string[];
}

const TAX_CODES: Record<string, TaxRegime> = {
  panama: {
    income_tax: {
      corporate_rate_pct: 25,
      progressive_personal: [
        { bracket_usd: 11000, rate_pct: 0 },
        { bracket_usd: 50000, rate_pct: 15 },
        { bracket_usd: Infinity, rate_pct: 25 },
      ],
      sme_regime: 'SEM (Small Enterprise) regime: simplified tax for revenue < $150K/year',
    },
    sales_tax: {
      name: 'ITBMS (Impuesto de Transferencia de Bienes Muebles y Servicios)',
      standard_rate_pct: 7,
      reduced_rates: [{ category: 'Alcohol & tobacco', rate_pct: 10 }, { category: 'Hotels', rate_pct: 10 }],
      exempt: ['Basic food basket (canasta básica)', 'Medical services', 'Education', 'Exports', 'Financial services'],
    },
    payroll: {
      employer_social_security_pct: 12.25,
      employee_social_security_pct: 9.75,
      other_employer_costs: [
        { name: 'Seguro Educativo (employer)', rate_pct: 1.50 },
        { name: 'Riesgos Profesionales', rate_pct: 1.80 },
      ],
      thirteenth_month: true,
      fourteenth_month: false,
      severance_formula: '3.4 weeks per year worked (Fondo de Cesantía: 1.92% salary + seniority premium)',
    },
    withholding: { services_domestic_pct: 0, services_foreign_pct: 12.5, dividends_pct: 10, royalties_pct: 12.5, interest_pct: 12.5 },
    filing: { corporate_deadline: 'March 31 (fiscal year = calendar year)', personal_deadline: 'March 15', sales_tax_frequency: 'Monthly (15th of following month)', authority: 'DGI (Dirección General de Ingresos)', electronic_filing: true, penalties: '10% surcharge + 1% monthly interest on late payment' },
    invoice: { system_name: 'Factura Electrónica Panama (FEP)', mandatory: true, provider: 'PAC autorizado por DGI', key_requirements: ['RUC del emisor', 'Número secuencial', 'ITBMS desglosado', 'Código QR', 'Firma digital', 'Formato XML'] },
    special: ['Territorial tax system — only Panama-sourced income is taxed', 'No capital gains tax on securities', 'Zona Libre de Colón: special regime', 'SEM regime: flat 2% on gross income for small business < $36K', 'Sede de Empresas Multinacionales (SEM HQ) regime: reduced rates'],
  },
  mexico: {
    income_tax: {
      corporate_rate_pct: 30,
      progressive_personal: [
        { bracket_usd: 4200, rate_pct: 1.92 },
        { bracket_usd: 35600, rate_pct: 6.40 },
        { bracket_usd: 62500, rate_pct: 10.88 },
        { bracket_usd: 72700, rate_pct: 16 },
        { bracket_usd: 87000, rate_pct: 17.92 },
        { bracket_usd: 175000, rate_pct: 21.36 },
        { bracket_usd: 500000, rate_pct: 23.52 },
        { bracket_usd: Infinity, rate_pct: 35 },
      ],
      sme_regime: 'RESICO (Régimen Simplificado de Confianza): 1-2.5% on gross income for individuals < 3.5M MXN/year',
    },
    sales_tax: {
      name: 'IVA (Impuesto al Valor Agregado)',
      standard_rate_pct: 16,
      reduced_rates: [{ category: 'Border zone (20km)', rate_pct: 8 }],
      exempt: ['Basic food', 'Medicine', 'Books', 'Education', 'Medical services', 'Home sales (first)'],
    },
    payroll: {
      employer_social_security_pct: 26.5,
      employee_social_security_pct: 2.78,
      other_employer_costs: [
        { name: 'IMSS cuota patronal', rate_pct: 20.40 },
        { name: 'Infonavit (housing)', rate_pct: 5.0 },
        { name: 'SAR (retirement)', rate_pct: 2.0 },
        { name: 'Payroll tax (state)', rate_pct: 3.0 },
      ],
      thirteenth_month: true,
      fourteenth_month: false,
      severance_formula: '3 months salary + 20 days per year worked + seniority premium (12 days/year, capped at 2x min wage)',
    },
    withholding: { services_domestic_pct: 0, services_foreign_pct: 25, dividends_pct: 10, royalties_pct: 25, interest_pct: 4.9 },
    filing: { corporate_deadline: 'March 31', personal_deadline: 'April 30', sales_tax_frequency: 'Monthly (17th)', authority: 'SAT (Servicio de Administración Tributaria)', electronic_filing: true, penalties: '20-55% surcharge on omissions + CPI-adjusted interest' },
    invoice: { system_name: 'CFDI 4.0 (Comprobante Fiscal Digital por Internet)', mandatory: true, provider: 'PAC autorizado por SAT', key_requirements: ['RFC del emisor y receptor', 'Uso de CFDI code', 'Régimen fiscal', 'Código postal', 'UUID timbrado', 'Sello digital SAT', 'Complemento de pago for installments'] },
    special: ['RESICO: game-changer for SMBs — effectively 1-2.5% flat tax', 'PTU: 10% profit sharing to employees mandatory', 'Maquiladora regime for manufacturing', 'ISR provisional payments monthly', 'Declaración anual required even if no tax due'],
  },
  colombia: {
    income_tax: {
      corporate_rate_pct: 35,
      progressive_personal: [
        { bracket_usd: 8700, rate_pct: 0 },
        { bracket_usd: 14000, rate_pct: 19 },
        { bracket_usd: 33500, rate_pct: 28 },
        { bracket_usd: 79000, rate_pct: 33 },
        { bracket_usd: Infinity, rate_pct: 39 },
      ],
      sme_regime: 'Régimen Simple de Tributación (RST): unified tax 1.8-11.6% based on revenue brackets',
    },
    sales_tax: {
      name: 'IVA (Impuesto al Valor Agregado)',
      standard_rate_pct: 19,
      reduced_rates: [{ category: 'Basic food, agriculture inputs', rate_pct: 5 }],
      exempt: ['Basic food basket', 'Education', 'Health', 'Financial services (some)', 'Exports'],
    },
    payroll: {
      employer_social_security_pct: 20.5,
      employee_social_security_pct: 8,
      other_employer_costs: [
        { name: 'Salud (health)', rate_pct: 8.5 },
        { name: 'Pensión (pension)', rate_pct: 12 },
        { name: 'ARL (occupational risk)', rate_pct: 2.436 },
        { name: 'Caja de Compensación', rate_pct: 4 },
        { name: 'ICBF + SENA (if > 10 employees)', rate_pct: 9 },
      ],
      thirteenth_month: false,
      fourteenth_month: false,
      severance_formula: 'Cesantías: 1 month salary per year + interest (12%/year on cesantías). Prima: 1 month/year. Vacaciones: 15 days/year.',
    },
    withholding: { services_domestic_pct: 11, services_foreign_pct: 20, dividends_pct: 10, royalties_pct: 20, interest_pct: 15 },
    filing: { corporate_deadline: 'April (varies by NIT last digit)', personal_deadline: 'August-October (by cédula last digit)', sales_tax_frequency: 'Bimonthly', authority: 'DIAN (Dirección de Impuestos y Aduanas Nacionales)', electronic_filing: true, penalties: '5% per month late (max 100%) + interest' },
    invoice: { system_name: 'Facturación Electrónica DIAN', mandatory: true, provider: 'Proveedor tecnológico autorizado DIAN', key_requirements: ['NIT emisor/receptor', 'CUFE (código único)', 'Firma digital', 'Validación previa DIAN', 'Formato UBL 2.1', 'Nota crédito/débito electrónica'] },
    special: ['RST is excellent for SMBs: replaces income tax + ICA + IVA in one payment', 'ICA (Industria y Comercio): municipal tax 0.2-1.4% on revenue', '4x1000: financial transaction tax (0.4% on bank withdrawals)', 'Renta presuntiva abolished in 2022', 'GMF (Gravamen a los Movimientos Financieros): impacts all banking'],
  },
  brazil: {
    income_tax: {
      corporate_rate_pct: 34,
      progressive_personal: [
        { bracket_usd: 4560, rate_pct: 0 },
        { bracket_usd: 6840, rate_pct: 7.5 },
        { bracket_usd: 9120, rate_pct: 15 },
        { bracket_usd: 11400, rate_pct: 22.5 },
        { bracket_usd: Infinity, rate_pct: 27.5 },
      ],
      sme_regime: 'Simples Nacional: unified tax 4-33% (6 annexes) for revenue < R$4.8M/year. MEI: R$81K/year micro-entrepreneur, ~R$70/month flat tax.',
    },
    sales_tax: {
      name: 'ICMS (state) + IPI (federal) + ISS (municipal) — being replaced by IBS + CBS (tax reform 2026-2033)',
      standard_rate_pct: 26.5,
      reduced_rates: [{ category: 'Basic food', rate_pct: 0 }, { category: 'Health/education', rate_pct: 10.6 }],
      exempt: ['Basic food basket (cesta básica)', 'Exports'],
    },
    payroll: {
      employer_social_security_pct: 28.8,
      employee_social_security_pct: 14,
      other_employer_costs: [
        { name: 'INSS patronal', rate_pct: 20 },
        { name: 'RAT (accident)', rate_pct: 3 },
        { name: 'FGTS (severance fund)', rate_pct: 8 },
        { name: 'Sistema S (SENAI, SESC, etc.)', rate_pct: 5.8 },
        { name: 'Salário Educação', rate_pct: 2.5 },
      ],
      thirteenth_month: true,
      fourteenth_month: false,
      severance_formula: 'FGTS: 8% monthly deposit + 40% penalty on dismissal without cause. Aviso prévio: 30 days + 3 days per year worked.',
    },
    withholding: { services_domestic_pct: 1.5, services_foreign_pct: 15, dividends_pct: 0, royalties_pct: 15, interest_pct: 15 },
    filing: { corporate_deadline: 'July 31 (IRPJ quarterly or annual)', personal_deadline: 'May 31', sales_tax_frequency: 'Monthly (ICMS/ISS) — Simples Nacional monthly unified', authority: 'Receita Federal do Brasil', electronic_filing: true, penalties: '1% per month (min R$165.74) for late filing + 0.33%/day on late payment' },
    invoice: { system_name: 'NF-e (Nota Fiscal Eletrônica) / NFS-e (services)', mandatory: true, provider: 'SEFAZ (state) or municipal portal', key_requirements: ['CNPJ emisor', 'Chave de acesso (44 digits)', 'Certificado digital A1/A3', 'XML format', 'DANFE printed representation', 'Transmissão SEFAZ before goods ship'] },
    special: ['Simples Nacional is THE regime for SMBs — dramatically simplifies compliance', 'MEI (Microempreendedor Individual): R$81K/year, ~R$70/month, 1 employee allowed', 'Brazil tax reform (EC 132/2023): ICMS/ISS/IPI/PIS/COFINS → IBS + CBS by 2033', 'Transfer pricing rules aligned with OECD (2024)', 'Dividends currently tax-free (may change)', 'IOF: financial operations tax on credit, FX, insurance'],
  },
  chile: {
    income_tax: {
      corporate_rate_pct: 27,
      progressive_personal: [
        { bracket_usd: 9300, rate_pct: 0 },
        { bracket_usd: 20700, rate_pct: 4 },
        { bracket_usd: 34500, rate_pct: 8 },
        { bracket_usd: 48300, rate_pct: 13.5 },
        { bracket_usd: 62100, rate_pct: 23 },
        { bracket_usd: 82800, rate_pct: 30.4 },
        { bracket_usd: Infinity, rate_pct: 40 },
      ],
      sme_regime: 'Régimen Pro PyME (14D N°3): 25% rate, instant depreciation, simplified accounting for revenue < 75,000 UF/year',
    },
    sales_tax: {
      name: 'IVA (Impuesto al Valor Agregado)',
      standard_rate_pct: 19,
      reduced_rates: [],
      exempt: ['Exports', 'Education', 'Health', 'Financial services', 'Public transport'],
    },
    payroll: {
      employer_social_security_pct: 5.64,
      employee_social_security_pct: 19.11,
      other_employer_costs: [
        { name: 'Seguro de cesantía (employer)', rate_pct: 2.4 },
        { name: 'Mutual de seguridad', rate_pct: 0.93 },
        { name: 'SIS (Seguro Invalidez)', rate_pct: 1.53 },
      ],
      thirteenth_month: false,
      fourteenth_month: false,
      severance_formula: 'Indemnización: 1 month per year worked (max 11 months). No severance for < 1 year tenure.',
    },
    withholding: { services_domestic_pct: 0, services_foreign_pct: 15, dividends_pct: 0, royalties_pct: 15, interest_pct: 4 },
    filing: { corporate_deadline: 'April 30 (Operación Renta)', personal_deadline: 'April 30', sales_tax_frequency: 'Monthly (12th of following month)', authority: 'SII (Servicio de Impuestos Internos)', electronic_filing: true, penalties: '10% first month + 2% per additional month (max 30%) on late payment' },
    invoice: { system_name: 'DTE (Documento Tributario Electrónico)', mandatory: true, provider: 'SII portal or certified provider', key_requirements: ['RUT emisor/receptor', 'Folio autorizado SII', 'Timbre electrónico SII', 'Formato XML', 'Acuse de recibo del receptor'] },
    special: ['Chile has integrated tax system (Semi-Integrado): corporate tax is credit against personal tax', 'Pro PyME 14D N°3: best SMB regime — 25% rate + instant depreciation', 'UF-indexed tax brackets adjust for inflation automatically', 'Patente comercial: municipal business license fee (0.25-0.5% of equity)', 'Herencia (inheritance tax): 1-25% progressive'],
  },
  peru: {
    income_tax: {
      corporate_rate_pct: 29.5,
      progressive_personal: [
        { bracket_usd: 5800, rate_pct: 8 },
        { bracket_usd: 23200, rate_pct: 14 },
        { bracket_usd: 40600, rate_pct: 17 },
        { bracket_usd: 64400, rate_pct: 20 },
        { bracket_usd: Infinity, rate_pct: 30 },
      ],
      sme_regime: 'RMT (Régimen MYPE Tributario): 10% on first 15 UIT (~$60K), 29.5% above. RUS (Régimen Único Simplificado): flat S/20-50/month for micro businesses.',
    },
    sales_tax: {
      name: 'IGV (Impuesto General a las Ventas)',
      standard_rate_pct: 18,
      reduced_rates: [],
      exempt: ['Basic food (some)', 'Education', 'Financial services', 'Exports', 'Public transport'],
    },
    payroll: {
      employer_social_security_pct: 9,
      employee_social_security_pct: 13,
      other_employer_costs: [
        { name: 'EsSalud', rate_pct: 9 },
        { name: 'SCTR (high-risk activities)', rate_pct: 1.5 },
      ],
      thirteenth_month: true,
      fourteenth_month: true,
      severance_formula: 'CTS (Compensación por Tiempo de Servicios): ~1.17 months per year. Gratificaciones: 2 extra months per year (July + December).',
    },
    withholding: { services_domestic_pct: 8, services_foreign_pct: 30, dividends_pct: 5, royalties_pct: 30, interest_pct: 4.99 },
    filing: { corporate_deadline: 'April (varies by RUC last digit)', personal_deadline: 'April', sales_tax_frequency: 'Monthly', authority: 'SUNAT (Superintendencia Nacional de Aduanas y Administración Tributaria)', electronic_filing: true, penalties: '50% of tax due on omissions + TIM interest (1.2%/month)' },
    invoice: { system_name: 'Factura Electrónica SUNAT (CPE)', mandatory: true, provider: 'OSE (Operador de Servicios Electrónicos) or SEE-SOL (SUNAT portal)', key_requirements: ['RUC emisor', 'Serie electrónica', 'CDR (Constancia de Recepción)', 'Formato UBL 2.1', 'Firma digital'] },
    special: ['RUS is incredibly simple: flat S/20/month for income < S/8,000/month', 'RMT 10% rate on first 15 UIT is great for growing SMBs', 'ITF: 0.005% financial transaction tax', 'Detracciones/Percepciones/Retenciones system for IGV', 'Peru has 14 monthly salaries (2 gratificaciones)'],
  },
  costa_rica: {
    income_tax: {
      corporate_rate_pct: 30,
      progressive_personal: [
        { bracket_usd: 8300, rate_pct: 0 },
        { bracket_usd: 12400, rate_pct: 10 },
        { bracket_usd: 20700, rate_pct: 15 },
        { bracket_usd: 41400, rate_pct: 20 },
        { bracket_usd: Infinity, rate_pct: 25 },
      ],
      sme_regime: 'Régimen Simplificado: fixed amounts based on activity category for small taxpayers',
    },
    sales_tax: {
      name: 'IVA (replaced Impuesto de Ventas in 2019)',
      standard_rate_pct: 13,
      reduced_rates: [{ category: 'Basic food basket (canasta básica)', rate_pct: 1 }, { category: 'Health services, education', rate_pct: 2 }, { category: 'Medicines', rate_pct: 4 }],
      exempt: ['Exports', 'Social housing', 'Public transport'],
    },
    payroll: {
      employer_social_security_pct: 26.33,
      employee_social_security_pct: 10.34,
      other_employer_costs: [
        { name: 'CCSS (Caja) employer', rate_pct: 14.17 },
        { name: 'Ley de Protección al Trabajador', rate_pct: 4.75 },
        { name: 'IMAS + INA + Asignaciones', rate_pct: 7.41 },
      ],
      thirteenth_month: true,
      fourteenth_month: false,
      severance_formula: 'Auxilio de cesantía: ~1 month per year worked (max 8 months). Must pay preaviso (1-3 months depending on tenure).',
    },
    withholding: { services_domestic_pct: 2, services_foreign_pct: 25, dividends_pct: 15, royalties_pct: 25, interest_pct: 15 },
    filing: { corporate_deadline: 'December 15 (fiscal year Oct-Sep)', personal_deadline: 'December 15', sales_tax_frequency: 'Monthly (15th)', authority: 'Ministerio de Hacienda — Dirección General de Tributación', electronic_filing: true, penalties: '1% per month (max 20%) + interest' },
    invoice: { system_name: 'Factura Electrónica (FE) Hacienda', mandatory: true, provider: 'API Hacienda or certified provider', key_requirements: ['Cédula jurídica/física', 'Clave numérica (50 digits)', 'XML firmado', 'Envío API Hacienda en real-time', 'Confirmación/aceptación del receptor'] },
    special: ['Costa Rica fiscal year is Oct 1 - Sep 30 (not calendar year)', 'Zona Franca regime: tax holidays for qualifying exporters', 'IVA replaced old sales tax in 2019 — services now taxed', 'Aguinaldo (13th month) due in first 20 days of December', 'No municipal business taxes (patente) — only national'],
  },
  argentina: {
    income_tax: {
      corporate_rate_pct: 35,
      progressive_personal: [
        { bracket_usd: 3000, rate_pct: 5 },
        { bracket_usd: 6000, rate_pct: 9 },
        { bracket_usd: 9000, rate_pct: 12 },
        { bracket_usd: 18000, rate_pct: 15 },
        { bracket_usd: 36000, rate_pct: 19 },
        { bracket_usd: 60000, rate_pct: 23 },
        { bracket_usd: 90000, rate_pct: 27 },
        { bracket_usd: 120000, rate_pct: 31 },
        { bracket_usd: Infinity, rate_pct: 35 },
      ],
      sme_regime: 'Monotributo: unified monthly payment covering income tax + IVA + social security. Categories A-K based on revenue (max ~$50K/year equivalent).',
    },
    sales_tax: {
      name: 'IVA (Impuesto al Valor Agregado)',
      standard_rate_pct: 21,
      reduced_rates: [{ category: 'Basic food, medicine', rate_pct: 10.5 }, { category: 'Some services', rate_pct: 27 }],
      exempt: ['Education', 'Health', 'Books', 'Financial services (some)', 'Exports'],
    },
    payroll: {
      employer_social_security_pct: 24,
      employee_social_security_pct: 17,
      other_employer_costs: [
        { name: 'Jubilación (employer)', rate_pct: 10.77 },
        { name: 'Obra Social', rate_pct: 6 },
        { name: 'Asignaciones Familiares', rate_pct: 4.44 },
        { name: 'ART (occupational risk)', rate_pct: 3 },
      ],
      thirteenth_month: true,
      fourteenth_month: false,
      severance_formula: 'Indemnización: 1 month per year worked (no cap). Preaviso: 1-2 months. Integration month. Vacaciones proporcionales. SAC proporcional.',
    },
    withholding: { services_domestic_pct: 0, services_foreign_pct: 31.5, dividends_pct: 7, royalties_pct: 31.5, interest_pct: 15.05 },
    filing: { corporate_deadline: 'May (5th month after fiscal year end)', personal_deadline: 'June', sales_tax_frequency: 'Monthly (Monotributo) or biweekly (Responsable Inscripto)', authority: 'AFIP (Administración Federal de Ingresos Públicos)', electronic_filing: true, penalties: 'Multas from 50-100% of tax due + interest (Ley 11.683)' },
    invoice: { system_name: 'Factura Electrónica AFIP (AFIP WebService)', mandatory: true, provider: 'AFIP WSFE or certified software', key_requirements: ['CUIT emisor/receptor', 'CAE (Código de Autorización Electrónico)', 'Punto de venta', 'Tipo de factura (A, B, C, M)', 'Código de barras AFIP'] },
    special: ['Monotributo is essential for freelancers and micro businesses', 'Impuesto a los Bienes Personales: wealth tax 0.5-1.75% on assets > threshold', 'Ingresos Brutos: provincial turnover tax 1-5% (stacks with IVA!)', 'IIBB is one of the most distortive taxes in LatAm (cascading)', 'Régimen de factura de crédito electrónica MiPyME: faster payment for SMBs', 'Cepo cambiario affects FX treatment of international transactions'],
  },
};

export function getAllLatamTaxTools(): ToolSchema[] {
  return [

    // 1. Tax Rate Calculator
    {
      name: 'tax_rateCalculator',
      description: 'Calculate effective tax burden for a business in any LatAm country. Shows corporate income tax, sales tax (IVA/ITBMS/IGV), payroll costs, and withholding. Returns total effective rate and comparison across countries.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country or "compare" for all countries' },
          annual_revenue_usd: { type: 'number', description: 'Annual revenue in USD' },
          annual_expenses_usd: { type: 'number', description: 'Annual deductible expenses in USD' },
          employees: { type: 'number', description: 'Number of employees' },
          avg_salary_usd: { type: 'number', description: 'Average monthly salary per employee in USD' },
        },
        required: ['country', 'annual_revenue_usd'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();
        const revenue = Number(args.annual_revenue_usd) || 0;
        const expenses = Number(args.annual_expenses_usd) || revenue * 0.6;
        const employees = Number(args.employees) || 1;
        const avgSalary = Number(args.avg_salary_usd) || 1000;

        const calculate = (ctry: string) => {
          const tc = TAX_CODES[ctry];
          if (!tc) return null;
          const profit = revenue - expenses;
          const incomeTax = profit * (tc.income_tax.corporate_rate_pct / 100);
          const salesTaxCollected = revenue * (tc.sales_tax.standard_rate_pct / 100);
          const annualPayroll = employees * avgSalary * 12;
          const payrollTax = annualPayroll * (tc.payroll.employer_social_security_pct / 100);
          const thirteenthCost = tc.payroll.thirteenth_month ? annualPayroll / 12 : 0;
          const fourteenthCost = tc.payroll.fourteenth_month ? annualPayroll / 12 : 0;
          const totalTax = incomeTax + payrollTax + thirteenthCost + fourteenthCost;
          const effectiveRate = revenue > 0 ? Math.round((totalTax / revenue) * 10000) / 100 : 0;
          return {
            country: ctry,
            income_tax: { rate_pct: tc.income_tax.corporate_rate_pct, amount: Math.round(incomeTax) },
            sales_tax: { name: tc.sales_tax.name.split('(')[0].trim(), rate_pct: tc.sales_tax.standard_rate_pct, collected: Math.round(salesTaxCollected), note: 'Collected from customers, remitted to government' },
            payroll: { employer_rate_pct: tc.payroll.employer_social_security_pct, annual_cost: Math.round(payrollTax), thirteenth_month: thirteenthCost > 0 ? Math.round(thirteenthCost) : undefined, fourteenth_month: fourteenthCost > 0 ? Math.round(fourteenthCost) : undefined },
            total_tax_burden: Math.round(totalTax),
            effective_rate_pct: effectiveRate,
            sme_regime: tc.income_tax.sme_regime,
          };
        };

        if (country === 'compare' || country === 'all') {
          const results = Object.keys(TAX_CODES).map(c => calculate(c)).filter(Boolean).sort((a, b) => a!.effective_rate_pct - b!.effective_rate_pct);
          log.info('tax_compare', { trace_id: traceId });
          return { comparison: results, assumptions: { revenue, expenses, employees, avg_salary: avgSalary } };
        }

        const result = calculate(country);
        if (!result) return { error: `Unknown country: ${country}. Supported: ${Object.keys(TAX_CODES).join(', ')}` };
        log.info('tax_calculated', { country, trace_id: traceId });
        return result;
      },
    },

    // 2. Filing Calendar
    {
      name: 'tax_filingCalendar',
      description: 'Get tax filing deadlines, required forms, frequency, and penalty info for any LatAm country. Essential for staying compliant.',
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
        const tc = TAX_CODES[country];
        if (!tc) return { error: `Unknown country: ${country}` };
        log.info('filing_calendar', { country, trace_id: traceId });
        return { country, filing: tc.filing, invoice: tc.invoice, special_notes: tc.special };
      },
    },

    // 3. Invoice Requirements
    {
      name: 'tax_invoiceRequirements',
      description: 'Electronic invoice (factura electrónica) requirements per LatAm country. System name, mandatory fields, provider requirements, and format specifications (CFDI, NF-e, DTE, FEP, CPE).',
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
          const all = Object.entries(TAX_CODES).map(([c, tc]) => ({ country: c, ...tc.invoice }));
          log.info('invoice_reqs_all', { trace_id: traceId });
          return { invoicing_systems: all };
        }
        const tc = TAX_CODES[country];
        if (!tc) return { error: `Unknown country: ${country}` };
        log.info('invoice_reqs', { country, trace_id: traceId });
        return { country, ...tc.invoice, sales_tax_name: tc.sales_tax.name, sales_tax_rate: tc.sales_tax.standard_rate_pct };
      },
    },

    // 4. Withholding Tax
    {
      name: 'tax_withholding',
      description: 'Withholding tax rates on payments: domestic services, foreign services, dividends, royalties, interest. Critical for paying freelancers, suppliers, or receiving foreign investment.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country' },
          payment_type: { type: 'string', description: 'Type: services_domestic, services_foreign, dividends, royalties, interest' },
          amount_usd: { type: 'number', description: 'Payment amount in USD' },
        },
        required: ['country'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();
        const tc = TAX_CODES[country];
        if (!tc) return { error: `Unknown country: ${country}` };
        const amount = Number(args.amount_usd) || 0;
        const wh = tc.withholding;
        const paymentType = String(args.payment_type || '').toLowerCase();

        const rates = {
          services_domestic: { rate_pct: wh.services_domestic_pct, withholding: amount ? Math.round(amount * wh.services_domestic_pct / 100 * 100) / 100 : undefined },
          services_foreign: { rate_pct: wh.services_foreign_pct, withholding: amount ? Math.round(amount * wh.services_foreign_pct / 100 * 100) / 100 : undefined },
          dividends: { rate_pct: wh.dividends_pct, withholding: amount ? Math.round(amount * wh.dividends_pct / 100 * 100) / 100 : undefined },
          royalties: { rate_pct: wh.royalties_pct, withholding: amount ? Math.round(amount * wh.royalties_pct / 100 * 100) / 100 : undefined },
          interest: { rate_pct: wh.interest_pct, withholding: amount ? Math.round(amount * wh.interest_pct / 100 * 100) / 100 : undefined },
        };

        if (paymentType && rates[paymentType as keyof typeof rates]) {
          const r = rates[paymentType as keyof typeof rates];
          log.info('withholding', { country, type: paymentType, trace_id: traceId });
          return { country, payment_type: paymentType, ...r, net_payment: amount ? Math.round((amount - (r.withholding || 0)) * 100) / 100 : undefined, note: 'Check for applicable tax treaties that may reduce rates' };
        }

        log.info('withholding_all', { country, trace_id: traceId });
        return { country, withholding_rates: rates, note: 'Rates may be reduced by bilateral tax treaties. Verify with tax advisor.' };
      },
    },

    // 5. Payroll Calculator
    {
      name: 'tax_payrollCalculator',
      description: 'Calculate total employer cost per employee: gross salary + social security + benefits + 13th/14th month + severance provision. Shows the real cost of hiring in each LatAm country.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country or "compare"' },
          monthly_salary_usd: { type: 'number', description: 'Gross monthly salary in USD' },
          employees: { type: 'number', description: 'Number of employees (default: 1)' },
        },
        required: ['country', 'monthly_salary_usd'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const salary = Number(args.monthly_salary_usd) || 0;
        if (salary <= 0) return { error: 'monthly_salary_usd must be positive' };
        const empCount = Number(args.employees) || 1;
        const country = String(args.country || '').toLowerCase();

        const calc = (ctry: string) => {
          const tc = TAX_CODES[ctry];
          if (!tc) return null;
          const p = tc.payroll;
          const socialSecurity = salary * (p.employer_social_security_pct / 100);
          const otherCosts = p.other_employer_costs.reduce((sum, c) => sum + salary * (c.rate_pct / 100), 0);
          const thirteenth = p.thirteenth_month ? salary / 12 : 0;
          const fourteenth = p.fourteenth_month ? salary / 12 : 0;
          const totalMonthly = salary + socialSecurity + thirteenth + fourteenth;
          const totalAnnual = totalMonthly * 12;
          const multiplier = Math.round((totalMonthly / salary) * 100) / 100;

          return {
            country: ctry,
            gross_salary: salary,
            employer_social_security: Math.round(socialSecurity * 100) / 100,
            employer_ss_rate_pct: p.employer_social_security_pct,
            other_costs: p.other_employer_costs.map(c => ({ ...c, amount: Math.round(salary * c.rate_pct / 100 * 100) / 100 })),
            thirteenth_month_provision: thirteenth > 0 ? Math.round(thirteenth * 100) / 100 : undefined,
            fourteenth_month_provision: fourteenth > 0 ? Math.round(fourteenth * 100) / 100 : undefined,
            total_monthly_cost: Math.round(totalMonthly * 100) / 100,
            total_annual_cost: Math.round(totalAnnual * 100) / 100,
            cost_multiplier: `${multiplier}x salary`,
            severance: p.severance_formula,
          };
        };

        if (country === 'compare' || country === 'all') {
          const results = Object.keys(TAX_CODES).map(c => calc(c)).filter(Boolean).sort((a, b) => a!.total_monthly_cost - b!.total_monthly_cost);
          log.info('payroll_compare', { salary, trace_id: traceId });
          return { comparison: results, employees: empCount, total_monthly_all_employees: results.map(r => ({ country: r!.country, total: Math.round(r!.total_monthly_cost * empCount * 100) / 100 })) };
        }

        const result = calc(country);
        if (!result) return { error: `Unknown country: ${country}` };
        log.info('payroll_calculated', { country, trace_id: traceId });
        return { ...result, employees: empCount, total_monthly_all: Math.round(result.total_monthly_cost * empCount * 100) / 100 };
      },
    },

    // 6. Tax Structure Advisor
    {
      name: 'tax_structureAdvisor',
      description: 'AI advice on optimal legal/tax structure for a LatAm business. Compares: SAS, SA, SRL, sole proprietorship, Monotributo, Simples Nacional, RESICO, Régimen Simple, Pro PyME. Considers tax efficiency, liability, ease of setup, and growth path.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country' },
          business_type: { type: 'string', description: 'Business type' },
          annual_revenue_usd: { type: 'number', description: 'Expected annual revenue' },
          founders: { type: 'number', description: 'Number of founders' },
          employees: { type: 'number', description: 'Expected employees' },
          plans_to_raise_investment: { type: 'boolean', description: 'Will seek external investment?' },
          currently_informal: { type: 'boolean', description: 'Currently operating informally?' },
        },
        required: ['country', 'annual_revenue_usd'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();
        const tc = TAX_CODES[country];
        if (!tc) return { error: `Unknown country: ${country}` };

        const systemPrompt = `You are a corporate structuring and tax advisor for Latin American SMBs.
Deep knowledge of entity types and tax regimes in ${country}:
- Corporate rate: ${tc.income_tax.corporate_rate_pct}%
- SME regime: ${tc.income_tax.sme_regime || 'none'}
- Sales tax: ${tc.sales_tax.name} at ${tc.sales_tax.standard_rate_pct}%
- Special notes: ${tc.special.join('; ')}

Entity types you know:
- SAS (Sociedad por Acciones Simplificada): modern, flexible, 1+ shareholders, most LatAm countries
- SA (Sociedad Anónima): traditional corporation, board required, good for investment
- SRL/Ltda (Sociedad de Responsabilidad Limitada): limited liability, simpler than SA
- Sole proprietor (Persona Natural con Actividad Empresarial): simplest, unlimited liability
- Special regimes: Monotributo (AR), MEI/Simples (BR), RESICO (MX), RST (CO), RUS/RMT (PE)
- Zona Franca / Free Zone entities where applicable

Rules:
- If currently informal, always recommend formalizing (but acknowledge the transition cost)
- If < $50K/year revenue, usually recommend simplified regime first
- If plans to raise investment, SAS or SA is mandatory
- Consider payroll implications of each structure
- Default language: Spanish

Respond with JSON:
{
  "recommended_structure": string,
  "tax_regime": string,
  "estimated_effective_tax_rate_pct": number,
  "setup_cost_usd": number,
  "setup_time_days": number,
  "alternatives": [{ "structure": string, "pros": [string], "cons": [string] }],
  "formalization_steps": [string],
  "annual_compliance_cost_usd": number,
  "growth_path": string,
  "warnings": [string]
}`;

        try {
          const raw = await callLLM(systemPrompt, JSON.stringify(args), { maxTokens: 2048, temperature: 0.25 });
          const match = raw.match(/\{[\s\S]*\}/);
          log.info('structure_advice', { country, trace_id: traceId });
          return match ? JSON.parse(match[0]) : { error: 'Could not generate advice' };
        } catch (err) {
          return { error: `Structure advisor failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
