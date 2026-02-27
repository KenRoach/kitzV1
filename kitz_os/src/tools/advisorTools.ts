/**
 * AI Advisor Tools — Business Calculators & Intelligence Functions
 *
 * Real TypeScript calculation tools that agents can call for instant
 * business intelligence. Extracted from the intelligence docs and
 * turned into executable functions.
 *
 * 8 tools:
 *   - advisor_employerCost      (low) — Calculate total employer cost (salary + contributions)
 *   - advisor_severance         (low) — Estimate severance/liquidation for termination
 *   - advisor_pricing           (low) — Calculate optimal pricing (cost-plus, value-based, competitive)
 *   - advisor_breakeven         (low) — Break-even analysis (units, revenue, time)
 *   - advisor_unitEconomics     (low) — CAC, LTV, LTV/CAC, payback period
 *   - advisor_runway            (low) — Cash runway projection
 *   - advisor_invoiceTax        (low) — Calculate invoice totals with country-specific tax
 *   - advisor_loanPayment       (low) — Loan/financing payment calculator
 */

import type { ToolSchema } from './registry.js';
import { getCountryConfig, calculateTax, formatCurrency, type CountryConfig } from './countryConfigTools.js';

// ── Employer Cost Data by Country ──

interface EmployerContributions {
  socialSecurity: number;       // Employer % of gross salary
  healthInsurance: number;
  pensionFund: number;
  professionalRisk: number;
  otherMandatory: number;       // Education tax, SENA, ICBF, etc.
  thirteenthMonth: number;      // 0 or 1 (expressed as monthly fraction: 1/12 = 0.0833)
  fourteenthMonth: number;      // Some countries have 14th month
  vacationProvision: number;    // Monthly provision for vacation days
  seniorityBonus: number;       // Antiguedad / prima
}

const EMPLOYER_CONTRIBUTIONS: Record<string, EmployerContributions> = {
  PA: { socialSecurity: 0.1225, healthInsurance: 0, pensionFund: 0, professionalRisk: 0.028, otherMandatory: 0.015, thirteenthMonth: 0.0833, fourteenthMonth: 0, vacationProvision: 0.0833, seniorityBonus: 0.0192 },
  MX: { socialSecurity: 0.13, healthInsurance: 0.0204, pensionFund: 0.02, professionalRisk: 0.025, otherMandatory: 0.05, thirteenthMonth: 0.0833, fourteenthMonth: 0, vacationProvision: 0.0417, seniorityBonus: 0 },
  CO: { socialSecurity: 0.12, healthInsurance: 0.085, pensionFund: 0, professionalRisk: 0.0052, otherMandatory: 0.09, thirteenthMonth: 0.0833, fourteenthMonth: 0, vacationProvision: 0.0417, seniorityBonus: 0.0833 },
  BR: { socialSecurity: 0.20, healthInsurance: 0, pensionFund: 0.08, professionalRisk: 0.03, otherMandatory: 0.058, thirteenthMonth: 0.0833, fourteenthMonth: 0, vacationProvision: 0.1111, seniorityBonus: 0 },
  AR: { socialSecurity: 0.17, healthInsurance: 0.06, pensionFund: 0, professionalRisk: 0.03, otherMandatory: 0, thirteenthMonth: 0.0833, fourteenthMonth: 0, vacationProvision: 0.0417, seniorityBonus: 0 },
  CL: { socialSecurity: 0, healthInsurance: 0, pensionFund: 0, professionalRisk: 0.0093, otherMandatory: 0.0238, thirteenthMonth: 0.0833, fourteenthMonth: 0, vacationProvision: 0.0417, seniorityBonus: 0.0694 },
  PE: { socialSecurity: 0.09, healthInsurance: 0, pensionFund: 0, professionalRisk: 0.013, otherMandatory: 0, thirteenthMonth: 0.0833, fourteenthMonth: 0.0833, vacationProvision: 0.0833, seniorityBonus: 0.0139 },
  CR: { socialSecurity: 0.1467, healthInsurance: 0, pensionFund: 0.0475, professionalRisk: 0, otherMandatory: 0.05, thirteenthMonth: 0.0833, fourteenthMonth: 0, vacationProvision: 0.0556, seniorityBonus: 0.0556 },
  EC: { socialSecurity: 0.1115, healthInsurance: 0, pensionFund: 0, professionalRisk: 0, otherMandatory: 0, thirteenthMonth: 0.0833, fourteenthMonth: 0.0833, vacationProvision: 0.0417, seniorityBonus: 0 },
  DO: { socialSecurity: 0.0709, healthInsurance: 0.0709, pensionFund: 0, professionalRisk: 0.011, otherMandatory: 0.01, thirteenthMonth: 0.0833, fourteenthMonth: 0, vacationProvision: 0.0389, seniorityBonus: 0 },
  US: { socialSecurity: 0.0765, healthInsurance: 0, pensionFund: 0, professionalRisk: 0.01, otherMandatory: 0.06, thirteenthMonth: 0, fourteenthMonth: 0, vacationProvision: 0, seniorityBonus: 0 },
  GT: { socialSecurity: 0.1267, healthInsurance: 0, pensionFund: 0, professionalRisk: 0, otherMandatory: 0.01, thirteenthMonth: 0.0833, fourteenthMonth: 0.0833, vacationProvision: 0.0417, seniorityBonus: 0 },
};

// ── Severance Rules by Country ──

interface SeveranceRule {
  perYearOfService: number;    // Days of salary per year
  maxYears: number;            // Cap on years counted
  noticePeriod: number;        // Days of notice required
  hasProRata: boolean;         // Pro-rate partial years
  additionalBenefits: string[];
}

const SEVERANCE_RULES: Record<string, SeveranceRule> = {
  PA: { perYearOfService: 3.4, maxYears: 100, noticePeriod: 30, hasProRata: true, additionalBenefits: ['Prima de antigüedad', 'Vacaciones proporcionales', 'Décimo tercer mes proporcional'] },
  MX: { perYearOfService: 20, maxYears: 100, noticePeriod: 0, hasProRata: true, additionalBenefits: ['3 meses constitucional', 'Prima vacacional', 'Aguinaldo proporcional', 'Prima de antigüedad (12 días/año)'] },
  CO: { perYearOfService: 30, maxYears: 100, noticePeriod: 15, hasProRata: true, additionalBenefits: ['Prima de servicios proporcional', 'Cesantías', 'Intereses sobre cesantías', 'Vacaciones proporcionales'] },
  BR: { perYearOfService: 0, maxYears: 0, noticePeriod: 30, hasProRata: false, additionalBenefits: ['40% multa FGTS', 'Aviso prévio indenizado', '13º proporcional', 'Férias proporcionais + 1/3'] },
  AR: { perYearOfService: 30, maxYears: 100, noticePeriod: 30, hasProRata: true, additionalBenefits: ['Integración mes despido', 'SAC proporcional', 'Vacaciones proporcionales'] },
  CL: { perYearOfService: 30, maxYears: 11, noticePeriod: 30, hasProRata: false, additionalBenefits: ['Vacaciones proporcionales', 'Gratificación proporcional'] },
  PE: { perYearOfService: 45, maxYears: 8, noticePeriod: 30, hasProRata: true, additionalBenefits: ['CTS', 'Gratificaciones proporcionales', 'Vacaciones truncas'] },
  US: { perYearOfService: 0, maxYears: 0, noticePeriod: 0, hasProRata: false, additionalBenefits: ['At-will employment — no mandatory severance', 'COBRA health continuation', 'PTO payout (if policy)'] },
};

// ── Tools ──

export function getAllAdvisorTools(): ToolSchema[] {
  return [
    {
      name: 'advisor_employerCost',
      description:
        'Calculate total employer cost for an employee — gross salary + all mandatory contributions ' +
        '(social security, health, pension, 13th month, vacation provision, etc.). Country-specific.',
      parameters: {
        type: 'object',
        properties: {
          monthly_salary: { type: 'number', description: 'Gross monthly salary' },
          country_code: { type: 'string', description: 'Country code (PA, MX, CO, BR, etc.)' },
        },
        required: ['monthly_salary'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const salary = Number(args.monthly_salary);
        const code = args.country_code ? String(args.country_code).toUpperCase() : getCountryConfig().countryCode;
        const contributions = EMPLOYER_CONTRIBUTIONS[code];
        if (!contributions) return { error: `No employer cost data for country "${code}".` };

        const config = getCountryConfig();
        const breakdown: Record<string, number> = {};
        let totalContributions = 0;

        for (const [key, rate] of Object.entries(contributions)) {
          const amount = Math.round(salary * (rate as number) * 100) / 100;
          if (amount > 0) {
            breakdown[key] = amount;
            totalContributions += amount;
          }
        }

        const totalCost = salary + totalContributions;
        const multiplier = Math.round((totalCost / salary) * 10000) / 10000;

        return {
          grossSalary: salary,
          contributions: breakdown,
          totalContributions: Math.round(totalContributions * 100) / 100,
          totalMonthlyCost: Math.round(totalCost * 100) / 100,
          annualCost: Math.round(totalCost * 12 * 100) / 100,
          multiplier,
          currency: config.currency,
          country: code,
          message: `Total employer cost: ${formatCurrency(totalCost, config)}/month (${multiplier}x salary). Annual: ${formatCurrency(totalCost * 12, config)}.`,
        };
      },
    },
    {
      name: 'advisor_severance',
      description:
        'Estimate severance/liquidation cost for employee termination — days per year of service, ' +
        'notice period, and additional benefits by country.',
      parameters: {
        type: 'object',
        properties: {
          monthly_salary: { type: 'number', description: 'Gross monthly salary' },
          years_of_service: { type: 'number', description: 'Years worked (can be decimal, e.g. 2.5)' },
          country_code: { type: 'string', description: 'Country code' },
          termination_type: { type: 'string', enum: ['without_cause', 'with_cause', 'resignation'], description: 'Type of termination' },
        },
        required: ['monthly_salary', 'years_of_service'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const salary = Number(args.monthly_salary);
        const years = Number(args.years_of_service);
        const code = args.country_code ? String(args.country_code).toUpperCase() : getCountryConfig().countryCode;
        const type = (args.termination_type as string) || 'without_cause';
        const rule = SEVERANCE_RULES[code];
        if (!rule) return { error: `No severance data for country "${code}".` };

        const dailySalary = salary / 30;
        const cappedYears = Math.min(years, rule.maxYears);
        const yearsToUse = rule.hasProRata ? cappedYears : Math.floor(cappedYears);

        let severanceDays = 0;
        let noticePay = 0;

        if (type === 'without_cause') {
          severanceDays = yearsToUse * rule.perYearOfService;
          noticePay = dailySalary * rule.noticePeriod;
        } else if (type === 'resignation') {
          severanceDays = 0; // No severance for voluntary resignation
          noticePay = 0;
        } else {
          // With cause — typically no severance but still owed accrued benefits
          severanceDays = 0;
          noticePay = 0;
        }

        const severancePay = dailySalary * severanceDays;
        // Estimated additional benefits (proportional 13th month, vacation, etc.)
        const proportionalBenefits = salary * (years - Math.floor(years)) * 0.25; // rough estimate
        const totalEstimate = severancePay + noticePay + proportionalBenefits;

        const config = getCountryConfig();
        return {
          monthlySalary: salary,
          yearsOfService: years,
          terminationType: type,
          country: code,
          severanceDays: Math.round(severanceDays * 10) / 10,
          severancePay: Math.round(severancePay * 100) / 100,
          noticePay: Math.round(noticePay * 100) / 100,
          proportionalBenefits: Math.round(proportionalBenefits * 100) / 100,
          totalEstimate: Math.round(totalEstimate * 100) / 100,
          additionalBenefits: rule.additionalBenefits,
          currency: config.currency,
          disclaimer: 'This is an estimate. Consult local labor lawyer for exact calculation.',
          message: `Estimated severance: ${formatCurrency(totalEstimate, config)} (${Math.round(severanceDays)} days pay + notice + proportional benefits).`,
        };
      },
    },
    {
      name: 'advisor_pricing',
      description:
        'Calculate optimal pricing using multiple strategies — cost-plus, value-based target, and competitive positioning.',
      parameters: {
        type: 'object',
        properties: {
          unit_cost: { type: 'number', description: 'Cost per unit (COGS)' },
          target_margin: { type: 'number', description: 'Target profit margin as decimal (0.30 = 30%). Default: 0.30' },
          competitor_price: { type: 'number', description: 'Average competitor price (optional)' },
          perceived_value: { type: 'number', description: 'Customer perceived value (optional, for value-based pricing)' },
          monthly_fixed_costs: { type: 'number', description: 'Monthly fixed costs (rent, salaries, etc.)' },
          expected_monthly_units: { type: 'number', description: 'Expected monthly unit sales' },
        },
        required: ['unit_cost'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const unitCost = Number(args.unit_cost);
        const targetMargin = (args.target_margin as number) || 0.30;
        const competitorPrice = args.competitor_price as number | undefined;
        const perceivedValue = args.perceived_value as number | undefined;
        const fixedCosts = (args.monthly_fixed_costs as number) || 0;
        const monthlyUnits = (args.expected_monthly_units as number) || 0;

        // Cost-plus pricing
        const costPlusPrice = unitCost / (1 - targetMargin);

        // Full cost pricing (if fixed costs provided)
        let fullCostPrice: number | null = null;
        if (fixedCosts > 0 && monthlyUnits > 0) {
          const fixedCostPerUnit = fixedCosts / monthlyUnits;
          fullCostPrice = (unitCost + fixedCostPerUnit) / (1 - targetMargin);
        }

        // Value-based pricing (if perceived value provided)
        let valuePriceSuggestion: number | null = null;
        if (perceivedValue) {
          valuePriceSuggestion = perceivedValue * 0.7; // Capture 70% of perceived value
        }

        // Competitive positioning
        let competitiveRange: { low: number; mid: number; high: number } | null = null;
        if (competitorPrice) {
          competitiveRange = {
            low: competitorPrice * 0.85,  // Undercut by 15%
            mid: competitorPrice,          // Match
            high: competitorPrice * 1.15,  // Premium 15%
          };
        }

        // Recommended price
        const prices = [costPlusPrice];
        if (fullCostPrice) prices.push(fullCostPrice);
        if (valuePriceSuggestion) prices.push(valuePriceSuggestion);
        if (competitorPrice) prices.push(competitorPrice);
        const recommendedPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100;

        const grossProfit = recommendedPrice - unitCost;
        const grossMargin = grossProfit / recommendedPrice;

        return {
          unitCost,
          strategies: {
            costPlus: { price: Math.round(costPlusPrice * 100) / 100, margin: targetMargin, method: `Cost ÷ (1 - ${(targetMargin * 100).toFixed(0)}%)` },
            fullCost: fullCostPrice ? { price: Math.round(fullCostPrice * 100) / 100, fixedCostPerUnit: Math.round((fixedCosts / monthlyUnits) * 100) / 100 } : null,
            valueBased: valuePriceSuggestion ? { price: Math.round(valuePriceSuggestion * 100) / 100, perceivedValue, captureRate: '70%' } : null,
            competitive: competitiveRange ? { ...competitiveRange, competitorPrice } : null,
          },
          recommended: {
            price: recommendedPrice,
            grossProfit: Math.round(grossProfit * 100) / 100,
            grossMargin: Math.round(grossMargin * 10000) / 100,
          },
          message: `Recommended price: $${recommendedPrice} (${(grossMargin * 100).toFixed(1)}% margin, $${grossProfit.toFixed(2)} profit per unit).`,
        };
      },
    },
    {
      name: 'advisor_breakeven',
      description:
        'Calculate break-even point — how many units/revenue needed to cover all costs.',
      parameters: {
        type: 'object',
        properties: {
          selling_price: { type: 'number', description: 'Price per unit' },
          variable_cost: { type: 'number', description: 'Variable cost per unit (COGS)' },
          monthly_fixed_costs: { type: 'number', description: 'Total monthly fixed costs' },
        },
        required: ['selling_price', 'variable_cost', 'monthly_fixed_costs'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const price = Number(args.selling_price);
        const variableCost = Number(args.variable_cost);
        const fixedCosts = Number(args.monthly_fixed_costs);

        const contributionMargin = price - variableCost;
        if (contributionMargin <= 0) {
          return { error: `Price ($${price}) must be higher than variable cost ($${variableCost}).` };
        }

        const contributionRatio = contributionMargin / price;
        const breakEvenUnits = Math.ceil(fixedCosts / contributionMargin);
        const breakEvenRevenue = Math.round(fixedCosts / contributionRatio * 100) / 100;
        const breakEvenDaily = Math.ceil(breakEvenUnits / 30);

        return {
          sellingPrice: price,
          variableCost,
          contributionMargin: Math.round(contributionMargin * 100) / 100,
          contributionRatio: Math.round(contributionRatio * 10000) / 100,
          monthlyFixedCosts: fixedCosts,
          breakEvenUnits,
          breakEvenRevenue,
          breakEvenPerDay: breakEvenDaily,
          message: `Break-even: ${breakEvenUnits} units/month ($${breakEvenRevenue} revenue). That's ~${breakEvenDaily} units/day.`,
        };
      },
    },
    {
      name: 'advisor_unitEconomics',
      description:
        'Calculate unit economics — CAC, LTV, LTV/CAC ratio, payback period. Key metrics for growth.',
      parameters: {
        type: 'object',
        properties: {
          monthly_marketing_spend: { type: 'number', description: 'Total monthly marketing/sales spend' },
          new_customers_per_month: { type: 'number', description: 'New customers acquired per month' },
          average_revenue_per_customer: { type: 'number', description: 'Average monthly revenue per customer' },
          gross_margin: { type: 'number', description: 'Gross margin as decimal (0.70 = 70%)' },
          average_customer_lifetime_months: { type: 'number', description: 'Average months a customer stays' },
          monthly_churn_rate: { type: 'number', description: 'Monthly churn rate as decimal (0.05 = 5%). Alternative to lifetime.' },
        },
        required: ['monthly_marketing_spend', 'new_customers_per_month', 'average_revenue_per_customer'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const marketingSpend = Number(args.monthly_marketing_spend);
        const newCustomers = Number(args.new_customers_per_month);
        const arpc = Number(args.average_revenue_per_customer);
        const grossMargin = (args.gross_margin as number) || 0.70;

        // Customer lifetime
        let lifetimeMonths: number;
        if (args.average_customer_lifetime_months) {
          lifetimeMonths = Number(args.average_customer_lifetime_months);
        } else if (args.monthly_churn_rate) {
          lifetimeMonths = 1 / Number(args.monthly_churn_rate);
        } else {
          lifetimeMonths = 24; // Default assumption
        }

        const cac = marketingSpend / newCustomers;
        const ltv = arpc * grossMargin * lifetimeMonths;
        const ltvCacRatio = ltv / cac;
        const paybackMonths = cac / (arpc * grossMargin);

        // Health assessment
        let health: string;
        if (ltvCacRatio >= 3) health = 'Healthy (3:1+ is ideal)';
        else if (ltvCacRatio >= 2) health = 'Acceptable (aim for 3:1)';
        else if (ltvCacRatio >= 1) health = 'Warning (barely profitable)';
        else health = 'Critical (losing money per customer)';

        return {
          cac: Math.round(cac * 100) / 100,
          ltv: Math.round(ltv * 100) / 100,
          ltvCacRatio: Math.round(ltvCacRatio * 100) / 100,
          paybackMonths: Math.round(paybackMonths * 10) / 10,
          lifetimeMonths: Math.round(lifetimeMonths * 10) / 10,
          grossMargin: `${(grossMargin * 100).toFixed(0)}%`,
          health,
          message: `CAC: $${cac.toFixed(2)} | LTV: $${ltv.toFixed(2)} | LTV/CAC: ${ltvCacRatio.toFixed(1)}x | Payback: ${paybackMonths.toFixed(1)} months — ${health}`,
        };
      },
    },
    {
      name: 'advisor_runway',
      description:
        'Calculate cash runway — how many months until cash runs out at current burn rate.',
      parameters: {
        type: 'object',
        properties: {
          cash_balance: { type: 'number', description: 'Current cash in bank' },
          monthly_revenue: { type: 'number', description: 'Monthly revenue' },
          monthly_expenses: { type: 'number', description: 'Monthly expenses (total)' },
          monthly_growth_rate: { type: 'number', description: 'Monthly revenue growth rate as decimal (0.10 = 10%). Default: 0' },
        },
        required: ['cash_balance', 'monthly_revenue', 'monthly_expenses'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const cash = Number(args.cash_balance);
        const revenue = Number(args.monthly_revenue);
        const expenses = Number(args.monthly_expenses);
        const growthRate = (args.monthly_growth_rate as number) || 0;

        const monthlyBurn = expenses - revenue;

        if (monthlyBurn <= 0) {
          return {
            cashBalance: cash,
            monthlyRevenue: revenue,
            monthlyExpenses: expenses,
            monthlyBurn: monthlyBurn,
            runway: 'Infinite',
            profitable: true,
            monthlySurplus: Math.abs(monthlyBurn),
            message: `Business is profitable! Monthly surplus: $${Math.abs(monthlyBurn).toFixed(2)}. Cash grows each month.`,
          };
        }

        // Simple runway (no growth)
        const simpleRunway = cash / monthlyBurn;

        // Growth-adjusted runway (revenue increases each month)
        let growthRunway = simpleRunway;
        if (growthRate > 0) {
          let remainingCash = cash;
          let currentRevenue = revenue;
          let months = 0;
          while (remainingCash > 0 && months < 120) {
            months++;
            currentRevenue *= (1 + growthRate);
            const burn = expenses - currentRevenue;
            if (burn <= 0) { growthRunway = Infinity; break; }
            remainingCash -= burn;
          }
          if (growthRunway !== Infinity) growthRunway = months;
        }

        // Health assessment
        let urgency: string;
        if (simpleRunway > 18) urgency = 'Comfortable';
        else if (simpleRunway > 12) urgency = 'Healthy';
        else if (simpleRunway > 6) urgency = 'Watch closely';
        else if (simpleRunway > 3) urgency = 'Start fundraising NOW';
        else urgency = 'CRITICAL — cut costs or raise immediately';

        return {
          cashBalance: cash,
          monthlyRevenue: revenue,
          monthlyExpenses: expenses,
          monthlyBurn: Math.round(monthlyBurn * 100) / 100,
          runwayMonths: Math.round(simpleRunway * 10) / 10,
          growthAdjustedRunway: growthRunway === Infinity ? 'Reaches profitability' : `${Math.round(growthRunway * 10) / 10} months`,
          urgency,
          cashOutDate: new Date(Date.now() + simpleRunway * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          message: `Runway: ${simpleRunway.toFixed(1)} months (cash out ~${new Date(Date.now() + simpleRunway * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}). Burn: $${monthlyBurn.toFixed(2)}/month. ${urgency}.`,
        };
      },
    },
    {
      name: 'advisor_invoiceTax',
      description:
        'Calculate invoice totals with country-specific tax (IVA/ITBMS/IGV/etc.). Supports line items.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: 'Invoice line items: [{ description, quantity, unit_price, tax_category? }]',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                unit_price: { type: 'number' },
                tax_category: { type: 'string', description: 'Optional tax category for reduced rates' },
              },
            },
          },
          country_code: { type: 'string', description: 'Country code (uses workspace default if omitted)' },
          discount_percent: { type: 'number', description: 'Overall discount percentage (0-100)' },
        },
        required: ['items'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const items = args.items as Array<{ description: string; quantity: number; unit_price: number; tax_category?: string }>;
        const code = args.country_code ? String(args.country_code).toUpperCase() : undefined;
        const discountPercent = (args.discount_percent as number) || 0;

        // Use provided country or workspace default
        let config: CountryConfig;
        if (code) {
          const { getCountryConfig: getConfig } = await import('./countryConfigTools.js');
          config = getConfig();
          // If a specific code was given, try to match
          const allConfigs = await import('./countryConfigTools.js');
          const supported = allConfigs.getSupportedCountries();
          if (!supported.includes(code)) {
            return { error: `Country "${code}" not supported.` };
          }
        } else {
          config = getCountryConfig();
        }

        const lineItems = items.map(item => {
          const subtotal = item.quantity * item.unit_price;
          const taxResult = calculateTax(subtotal, config, item.tax_category);
          return {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            subtotal: Math.round(subtotal * 100) / 100,
            taxRate: `${(taxResult.rate * 100).toFixed(0)}%`,
            taxAmount: taxResult.tax,
            total: taxResult.total,
          };
        });

        const subtotalSum = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
        const taxSum = lineItems.reduce((sum, li) => sum + li.taxAmount, 0);
        const discountAmount = subtotalSum * (discountPercent / 100);
        const grandTotal = subtotalSum + taxSum - discountAmount;

        return {
          lineItems,
          subtotal: Math.round(subtotalSum * 100) / 100,
          taxName: config.taxName,
          taxTotal: Math.round(taxSum * 100) / 100,
          discount: discountPercent > 0 ? { percent: discountPercent, amount: Math.round(discountAmount * 100) / 100 } : null,
          grandTotal: Math.round(grandTotal * 100) / 100,
          currency: config.currency,
          country: config.country,
          formatted: formatCurrency(grandTotal, config),
        };
      },
    },
    {
      name: 'advisor_loanPayment',
      description:
        'Calculate loan/financing payment schedule — monthly payment, total interest, amortization.',
      parameters: {
        type: 'object',
        properties: {
          principal: { type: 'number', description: 'Loan amount' },
          annual_rate: { type: 'number', description: 'Annual interest rate as decimal (0.12 = 12%)' },
          term_months: { type: 'number', description: 'Loan term in months' },
          currency: { type: 'string', description: 'Currency code (default: workspace currency)' },
        },
        required: ['principal', 'annual_rate', 'term_months'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const principal = Number(args.principal);
        const annualRate = Number(args.annual_rate);
        const termMonths = Number(args.term_months);

        const monthlyRate = annualRate / 12;

        let monthlyPayment: number;
        if (monthlyRate === 0) {
          monthlyPayment = principal / termMonths;
        } else {
          monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
        }

        const totalPaid = monthlyPayment * termMonths;
        const totalInterest = totalPaid - principal;

        // First 3 months amortization preview
        const schedule: Array<{ month: number; payment: number; principal: number; interest: number; balance: number }> = [];
        let balance = principal;
        for (let m = 1; m <= Math.min(termMonths, 6); m++) {
          const interestPortion = balance * monthlyRate;
          const principalPortion = monthlyPayment - interestPortion;
          balance -= principalPortion;
          schedule.push({
            month: m,
            payment: Math.round(monthlyPayment * 100) / 100,
            principal: Math.round(principalPortion * 100) / 100,
            interest: Math.round(interestPortion * 100) / 100,
            balance: Math.max(0, Math.round(balance * 100) / 100),
          });
        }

        return {
          principal,
          annualRate: `${(annualRate * 100).toFixed(1)}%`,
          termMonths,
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          totalPaid: Math.round(totalPaid * 100) / 100,
          totalInterest: Math.round(totalInterest * 100) / 100,
          interestToCapitalRatio: Math.round((totalInterest / principal) * 10000) / 100,
          schedulePreview: schedule,
          message: `Monthly payment: $${monthlyPayment.toFixed(2)} for ${termMonths} months. Total interest: $${totalInterest.toFixed(2)} (${((totalInterest / principal) * 100).toFixed(1)}% of principal).`,
        };
      },
    },
  ];
}
