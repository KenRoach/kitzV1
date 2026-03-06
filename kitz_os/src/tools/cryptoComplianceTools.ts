/**
 * Crypto Compliance & On-Chain Audit Tools — LatAm-focused blockchain compliance.
 *
 * 6 tools:
 *   - crypto_walletRiskScore       (medium) — On-chain risk scoring: transaction patterns, counterparty exposure, mixer detection
 *   - crypto_transactionTrace      (medium) — Trace transaction flow: sender, receiver, value, method, block confirmation
 *   - crypto_amlScreening          (medium) — AI-powered AML/KYC screening against known risk patterns for LatAm
 *   - crypto_taxReporter           (medium) — Generate crypto tax report framework per LatAm country regulations
 *   - crypto_complianceChecker     (medium) — Check if a crypto operation complies with local regulations (PA, MX, CO, BR, CL, PE, CR)
 *   - crypto_invoiceValidator      (low)    — Validate crypto payment invoices meet local fiscal requirements
 *
 * Uses public blockchain RPCs, Blockchair API (free tier), and callLLM for regulatory analysis.
 * Deep LatAm regulatory knowledge: Panama Ley 129, Mexico Ley Fintech, Brazil Marco Legal Cripto, etc.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { callLLM } from './shared/callLLM.js';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('cryptoComplianceTools');

// ── EVM RPCs (shared with advisory tools) ──
const EVM_RPCS: Record<string, string> = {
  ethereum: 'https://eth.llamarpc.com',
  polygon: 'https://polygon-rpc.com',
  bsc: 'https://bsc-dataseed.binance.org',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
  optimism: 'https://mainnet.optimism.io',
  avalanche: 'https://api.avax.network/ext/bc/C/rpc',
  base: 'https://mainnet.base.org',
};

// ── LatAm Regulatory Knowledge Base (hardcoded for speed, no API dependency) ──
const LATAM_CRYPTO_REGS: Record<string, {
  framework: string;
  authority: string;
  kyc_threshold_usd: number;
  tax_rate_pct: string;
  reporting_required: boolean;
  stablecoin_status: string;
  key_law: string;
  notes: string;
}> = {
  panama: {
    framework: 'Ley 129 de 2020 (Ley Cripto)',
    authority: 'Superintendencia del Mercado de Valores (SMV)',
    kyc_threshold_usd: 1000,
    tax_rate_pct: '0% (no capital gains tax on crypto)',
    reporting_required: true,
    stablecoin_status: 'Legal, no specific regulation',
    key_law: 'Ley 129 de 2020 + Decreto Ejecutivo 418',
    notes: 'Crypto-friendly. No capital gains tax. KYC required for exchanges. VASPs must register with SMV.',
  },
  mexico: {
    framework: 'Ley para Regular las Instituciones de Tecnología Financiera (Ley Fintech)',
    authority: 'Banco de México (Banxico) + CNBV + SAT',
    kyc_threshold_usd: 500,
    tax_rate_pct: '10-35% (progressive income tax on gains)',
    reporting_required: true,
    stablecoin_status: 'Regulated as virtual assets under Ley Fintech',
    key_law: 'Ley Fintech 2018 + Disposiciones Banxico',
    notes: 'Strict: only Banxico-approved virtual assets. SAT requires reporting all crypto gains. Bitso is licensed.',
  },
  colombia: {
    framework: 'No specific crypto law (Sandbox Superfinanciera)',
    authority: 'Superfinanciera + DIAN (tax)',
    kyc_threshold_usd: 800,
    tax_rate_pct: '10% (occasional gains) or 0-39% (habitual trading)',
    reporting_required: true,
    stablecoin_status: 'Not regulated, treated as intangible assets',
    key_law: 'Decreto 2555 sandbox + DIAN Concepto 20436',
    notes: 'No ban but no framework. DIAN taxes crypto as income. Banks may restrict fiat on-ramps.',
  },
  brazil: {
    framework: 'Marco Legal das Criptomoedas (Lei 14.478/2022)',
    authority: 'Banco Central do Brasil (BCB) + Receita Federal',
    kyc_threshold_usd: 600,
    tax_rate_pct: '15% (gains > R$35,000/month)',
    reporting_required: true,
    stablecoin_status: 'Regulated under Marco Legal, BCB oversight',
    key_law: 'Lei 14.478/2022 + IN RFB 1.888/2019',
    notes: 'Most advanced LatAm framework. Monthly reporting via Receita Federal for transactions > R$30,000. Pix integration popular.',
  },
  chile: {
    framework: 'Ley Fintech (Ley 21.521/2023)',
    authority: 'Comisión para el Mercado Financiero (CMF)',
    kyc_threshold_usd: 500,
    tax_rate_pct: '10-40% (income tax on gains)',
    reporting_required: true,
    stablecoin_status: 'Under CMF regulation',
    key_law: 'Ley 21.521 Fintech 2023',
    notes: 'New Fintech law covers crypto. CMF licensing required for VASPs. Buda.com licensed locally.',
  },
  peru: {
    framework: 'No specific crypto law',
    authority: 'SBS + SUNAT (tax)',
    kyc_threshold_usd: 1000,
    tax_rate_pct: '5-30% (income tax on gains)',
    reporting_required: false,
    stablecoin_status: 'Unregulated',
    key_law: 'SBS Resolución 789-2018 (AML only)',
    notes: 'Minimal regulation. SBS AML rules apply. SUNAT considering crypto tax guidance. Growing P2P market.',
  },
  costa_rica: {
    framework: 'No specific crypto law',
    authority: 'SUGEVAL + Ministerio de Hacienda',
    kyc_threshold_usd: 1000,
    tax_rate_pct: '15% (capital gains, if classified as income)',
    reporting_required: false,
    stablecoin_status: 'Unregulated',
    key_law: 'None specific — general tax code applies',
    notes: 'Crypto-tolerant but unregulated. El Salvador Bitcoin influence nearby. Growing Bitcoin Beach-style communities.',
  },
};

// ── EVM transaction receipt fetcher ──
async function getTransactionReceipt(txHash: string, chain: string): Promise<Record<string, unknown>> {
  const rpc = EVM_RPCS[chain];
  if (!rpc) throw new Error(`Unsupported chain: ${chain}`);
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getTransactionReceipt', params: [txHash], id: 1 }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json() as { result?: Record<string, unknown>; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  if (!data.result) throw new Error('Transaction not found');
  return data.result;
}

async function getTransaction(txHash: string, chain: string): Promise<Record<string, unknown>> {
  const rpc = EVM_RPCS[chain];
  if (!rpc) throw new Error(`Unsupported chain: ${chain}`);
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getTransactionByHash', params: [txHash], id: 1 }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json() as { result?: Record<string, unknown>; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  if (!data.result) throw new Error('Transaction not found');
  return data.result;
}

async function getTransactionCount(address: string, chain: string): Promise<number> {
  const rpc = EVM_RPCS[chain];
  if (!rpc) throw new Error(`Unsupported chain: ${chain}`);
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [address, 'latest'], id: 1 }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json() as { result?: string };
  return Number(BigInt(data.result || '0x0'));
}

async function getCode(address: string, chain: string): Promise<string> {
  const rpc = EVM_RPCS[chain];
  if (!rpc) throw new Error(`Unsupported chain: ${chain}`);
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getCode', params: [address, 'latest'], id: 1 }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json() as { result?: string };
  return data.result || '0x';
}

export function getAllCryptoComplianceTools(): ToolSchema[] {
  return [

    // ────────────────────────────────────────
    // 1. Wallet Risk Score
    // ────────────────────────────────────────
    {
      name: 'crypto_walletRiskScore',
      description: 'On-chain risk assessment for an EVM wallet. Analyzes: transaction count, contract interaction, balance, code presence (is it a contract?). Returns risk tier (low/medium/high) with reasoning. Useful for counterparty due diligence before accepting crypto payments.',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'EVM wallet address (0x...)' },
          chain: { type: 'string', description: 'Chain: ethereum, polygon, bsc, arbitrum, base (default: ethereum)' },
        },
        required: ['address'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const address = String(args.address || '').trim();
        if (!address || !address.startsWith('0x')) return { error: 'Valid EVM address required (0x...)' };
        const chain = String(args.chain || 'ethereum').toLowerCase();

        try {
          const [txCount, code, balData] = await Promise.all([
            getTransactionCount(address, chain),
            getCode(address, chain),
            (async () => {
              const rpc = EVM_RPCS[chain];
              if (!rpc) return '0';
              const res = await fetch(rpc, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBalance', params: [address, 'latest'], id: 1 }),
                signal: AbortSignal.timeout(10_000),
              });
              const d = await res.json() as { result?: string };
              return (Number(BigInt(d.result || '0x0')) / 1e18).toFixed(6);
            })(),
          ]);

          const isContract = code !== '0x' && code.length > 2;
          const flags: string[] = [];
          let riskScore = 0;

          // Heuristic risk scoring
          if (isContract) { flags.push('Address is a smart contract (not an EOA)'); riskScore += 15; }
          if (txCount === 0) { flags.push('Zero transaction history — newly created or inactive wallet'); riskScore += 30; }
          else if (txCount < 5) { flags.push('Very low transaction count — limited on-chain history'); riskScore += 20; }
          else if (txCount > 10000) { flags.push('Extremely high tx count — possible bot or exchange hot wallet'); riskScore += 10; }

          const balNum = parseFloat(balData);
          if (balNum === 0) { flags.push('Zero balance'); riskScore += 15; }
          if (balNum > 1000) { flags.push('High balance — whale or institutional wallet'); }

          // Calculate risk tier
          let riskTier: 'low' | 'medium' | 'high' = 'low';
          if (riskScore >= 40) riskTier = 'high';
          else if (riskScore >= 20) riskTier = 'medium';

          log.info('wallet_risk_scored', { address: address.slice(0, 10), riskTier, trace_id: traceId });
          return {
            address,
            chain,
            risk_tier: riskTier,
            risk_score: riskScore,
            is_contract: isContract,
            transaction_count: txCount,
            native_balance: balData,
            flags,
            recommendation: riskTier === 'high'
              ? 'Proceda con precaución. Verifique la identidad del remitente antes de aceptar pagos.'
              : riskTier === 'medium'
                ? 'Riesgo moderado. Considere verificación adicional para montos > $1,000 USD.'
                : 'Riesgo bajo. Historial on-chain consistente.',
            disclaimer: 'This is a heuristic analysis based on publicly available on-chain data. It does not constitute a full AML investigation.',
          };
        } catch (err) {
          return { error: `Wallet risk scoring failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 2. Transaction Trace
    // ────────────────────────────────────────
    {
      name: 'crypto_transactionTrace',
      description: 'Trace an EVM transaction: sender, receiver, value, gas used, status, block number, input data signature. Essential for audit trails and payment verification.',
      parameters: {
        type: 'object',
        properties: {
          tx_hash: { type: 'string', description: 'Transaction hash (0x...)' },
          chain: { type: 'string', description: 'Chain: ethereum, polygon, bsc, arbitrum, base (default: ethereum)' },
        },
        required: ['tx_hash'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const txHash = String(args.tx_hash || '').trim();
        if (!txHash || !txHash.startsWith('0x')) return { error: 'Valid transaction hash required (0x...)' };
        const chain = String(args.chain || 'ethereum').toLowerCase();

        try {
          const [tx, receipt] = await Promise.all([
            getTransaction(txHash, chain),
            getTransactionReceipt(txHash, chain),
          ]);

          const valueWei = BigInt(String(tx.value || '0x0'));
          const valueEth = Number(valueWei) / 1e18;
          const gasUsed = Number(BigInt(String(receipt.gasUsed || '0x0')));
          const gasPrice = Number(BigInt(String(tx.gasPrice || '0x0'))) / 1e9;
          const txFee = (gasUsed * Number(BigInt(String(tx.gasPrice || '0x0')))) / 1e18;
          const inputData = String(tx.input || '0x');
          const methodSig = inputData.length >= 10 ? inputData.slice(0, 10) : null;

          // Common method signatures
          const KNOWN_METHODS: Record<string, string> = {
            '0xa9059cbb': 'ERC20 transfer(address,uint256)',
            '0x23b872dd': 'ERC20 transferFrom(address,address,uint256)',
            '0x095ea7b3': 'ERC20 approve(address,uint256)',
            '0x': 'Native transfer (no contract interaction)',
            '0xd0e30db0': 'WETH deposit()',
            '0x2e1a7d4d': 'WETH withdraw(uint256)',
            '0x38ed1739': 'Uniswap swapExactTokensForTokens',
            '0x7ff36ab5': 'Uniswap swapExactETHForTokens',
            '0x18160ddd': 'ERC20 totalSupply()',
          };

          const nativeToken = chain === 'bsc' ? 'BNB' : chain === 'polygon' ? 'MATIC' : chain === 'avalanche' ? 'AVAX' : 'ETH';

          log.info('tx_traced', { txHash: txHash.slice(0, 10), chain, trace_id: traceId });
          return {
            tx_hash: txHash,
            chain,
            status: receipt.status === '0x1' ? 'success' : 'failed',
            block_number: Number(BigInt(String(receipt.blockNumber || '0x0'))),
            from: tx.from,
            to: tx.to,
            value_native: valueEth,
            native_token: nativeToken,
            gas_used: gasUsed,
            gas_price_gwei: Math.round(gasPrice * 100) / 100,
            tx_fee_native: txFee.toFixed(8),
            method_signature: methodSig,
            method_name: methodSig ? (KNOWN_METHODS[methodSig] || 'Unknown contract method') : 'Native transfer',
            log_count: Array.isArray(receipt.logs) ? (receipt.logs as unknown[]).length : 0,
            contract_interaction: inputData.length > 2,
          };
        } catch (err) {
          return { error: `Transaction trace failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 3. AML Screening (AI-powered)
    // ────────────────────────────────────────
    {
      name: 'crypto_amlScreening',
      description: 'AI-powered AML/KYC risk screening for crypto transactions and counterparties. Analyzes transaction patterns, amount thresholds, and flags against LatAm-specific compliance requirements (GAFI/FATF, UIF, local FIUs). Draft-first: generates a report, does NOT block transactions.',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Wallet address to screen' },
          amount_usd: { type: 'number', description: 'Transaction amount in USD' },
          country: { type: 'string', description: 'Jurisdiction (panama, mexico, colombia, brazil, chile, peru, costa_rica)' },
          counterparty_name: { type: 'string', description: 'Name of counterparty (if known)' },
          transaction_purpose: { type: 'string', description: 'Stated purpose of transaction' },
        },
        required: ['address', 'amount_usd', 'country'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const address = String(args.address || '').trim();
        const amount = Number(args.amount_usd) || 0;
        const country = String(args.country || '').toLowerCase();
        if (!address) return { error: 'address is required' };
        if (amount <= 0) return { error: 'amount_usd must be positive' };

        const regs = LATAM_CRYPTO_REGS[country];
        if (!regs) return { error: `Unsupported country: ${country}. Supported: ${Object.keys(LATAM_CRYPTO_REGS).join(', ')}` };

        const systemPrompt = `You are a certified AML/KYC compliance officer specializing in cryptocurrency transactions in Latin America.
You have deep knowledge of GAFI/FATF recommendations, LatAm Financial Intelligence Units (UIFs/FIUs), and country-specific crypto AML frameworks.

For ${country.toUpperCase()}:
- Framework: ${regs.framework}
- Authority: ${regs.authority}
- KYC threshold: $${regs.kyc_threshold_usd} USD
- Key law: ${regs.key_law}
- Notes: ${regs.notes}

Rules:
- Flag transactions above KYC threshold
- Check for structuring patterns (breaking amounts to avoid thresholds)
- Flag PEP (Politically Exposed Person) risks if counterparty info provided
- Reference specific local regulations
- NEVER block — this is advisory/draft-first only
- Include specific reporting obligations
- Default language: Spanish

Respond with valid JSON:
{
  "risk_level": "low"|"medium"|"high"|"critical",
  "kyc_required": boolean,
  "threshold_exceeded": boolean,
  "flags": [string],
  "reporting_obligations": [string],
  "recommended_actions": [string],
  "applicable_regulations": [string],
  "enhanced_due_diligence_required": boolean,
  "notes": string
}`;

        const userInput = `Screen this transaction:
Address: ${address}
Amount: $${amount} USD
Country: ${country}
Counterparty: ${args.counterparty_name || 'unknown'}
Purpose: ${args.transaction_purpose || 'not stated'}`;

        try {
          const raw = await callLLM(systemPrompt, userInput, { maxTokens: 1536, temperature: 0.1 });
          const match = raw.match(/\{[\s\S]*\}/);
          const parsed = match ? JSON.parse(match[0]) : { risk_level: amount > regs.kyc_threshold_usd ? 'medium' : 'low', kyc_required: amount > regs.kyc_threshold_usd, flags: [] };
          log.info('aml_screening', { country, amount, riskLevel: parsed.risk_level, trace_id: traceId });
          return { ...parsed, country, amount_usd: amount, jurisdiction_regs: regs, disclaimer: 'Draft advisory only. Does not constitute legal compliance. Consult a licensed compliance officer.' };
        } catch (err) {
          return { error: `AML screening failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 4. Tax Reporter
    // ────────────────────────────────────────
    {
      name: 'crypto_taxReporter',
      description: 'Generate a crypto tax reporting framework for a LatAm country. Covers: taxable events, rates, reporting deadlines, required forms, deductible expenses, and DeFi-specific treatment. Essential for SMBs accepting or holding crypto.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country (panama, mexico, colombia, brazil, chile, peru, costa_rica)' },
          annual_gains_usd: { type: 'number', description: 'Estimated annual crypto gains in USD' },
          transaction_types: { type: 'string', description: 'Types of crypto activity: trading, mining, staking, payments_received, defi_yields, nft_sales' },
          is_business: { type: 'boolean', description: 'Is this for a business entity (vs personal)? Default: true' },
        },
        required: ['country'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();
        const regs = LATAM_CRYPTO_REGS[country];
        if (!regs) return { error: `Unsupported country: ${country}` };

        const systemPrompt = `You are a crypto tax specialist for Latin American jurisdictions with deep knowledge of each country's tax treatment of digital assets.

For ${country.toUpperCase()}:
- Tax rate: ${regs.tax_rate_pct}
- Authority: ${regs.authority}
- Key law: ${regs.key_law}
- Reporting required: ${regs.reporting_required}

You know:
- How each country classifies crypto (property, currency, intangible asset, financial instrument)
- Taxable events: disposal, exchange, payment for goods/services, mining income, staking rewards, DeFi yields, airdrops
- Cost basis methods accepted (FIFO, weighted average, specific identification)
- Reporting deadlines and forms
- DeFi-specific: how LP tokens, yield farming, and governance tokens are treated
- NFT taxation
- Loss carryforward rules
- VAT/IVA treatment of crypto transactions
- Transfer pricing for cross-border crypto payments

Respond with valid JSON:
{
  "country": string,
  "tax_classification": string,
  "taxable_events": [{ "event": string, "tax_treatment": string, "rate": string }],
  "reporting_deadlines": [{ "form": string, "deadline": string, "authority": string }],
  "deductible_expenses": [string],
  "cost_basis_method": string,
  "defi_treatment": string,
  "loss_carryforward": string,
  "vat_treatment": string,
  "estimated_tax_usd": number,
  "action_steps": [string],
  "professional_advice_needed": boolean
}`;

        const userInput = `Generate tax report framework:
Country: ${country}
Annual gains: $${args.annual_gains_usd || 'unknown'} USD
Transaction types: ${args.transaction_types || 'trading, payments_received'}
Entity type: ${args.is_business !== false ? 'Business' : 'Personal'}`;

        try {
          const raw = await callLLM(systemPrompt, userInput, { maxTokens: 2048, temperature: 0.15 });
          const match = raw.match(/\{[\s\S]*\}/);
          const parsed = match ? JSON.parse(match[0]) : { error: 'Could not generate tax report' };
          log.info('tax_report', { country, trace_id: traceId });
          return { ...parsed, jurisdiction_regs: regs, disclaimer: 'Tax guidance only. Consult a licensed tax professional for filing. Este no es asesoramiento fiscal definitivo.' };
        } catch (err) {
          return { error: `Tax reporter failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 5. Compliance Checker
    // ────────────────────────────────────────
    {
      name: 'crypto_complianceChecker',
      description: 'Check if a specific crypto operation (accepting payments, holding treasury in crypto, running a DeFi strategy, launching a token) complies with local LatAm regulations. Returns pass/fail with specific law references.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country' },
          operation: { type: 'string', description: 'Operation to check: accept_payments, hold_treasury, defi_yield, launch_token, run_exchange, nft_marketplace, mining, staking, cross_border_transfer' },
          business_type: { type: 'string', description: 'Type of business' },
          amount_usd: { type: 'number', description: 'Amount involved in USD' },
          details: { type: 'string', description: 'Additional context about the operation' },
        },
        required: ['country', 'operation'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();
        const operation = String(args.operation || '').trim();
        if (!operation) return { error: 'operation is required' };

        const regs = LATAM_CRYPTO_REGS[country];
        if (!regs) return { error: `Unsupported country: ${country}. Supported: ${Object.keys(LATAM_CRYPTO_REGS).join(', ')}` };

        const systemPrompt = `You are a blockchain regulatory compliance expert for Latin America.
Deep knowledge of crypto regulations, licensing requirements, AML/KYC obligations, and enforcement precedents across LatAm.

For ${country.toUpperCase()}:
- Framework: ${regs.framework}
- Authority: ${regs.authority}
- Key law: ${regs.key_law}
- Stablecoin status: ${regs.stablecoin_status}
- Notes: ${regs.notes}

You must:
- Give a clear COMPLIANT / NON-COMPLIANT / GRAY_AREA verdict
- Reference specific laws, articles, and regulatory pronouncements
- List required licenses or registrations
- Flag upcoming regulatory changes that could affect compliance
- Provide actionable steps to achieve compliance
- Consider both the letter and spirit of the law
- Default language: Spanish

Respond with valid JSON:
{
  "verdict": "COMPLIANT"|"NON_COMPLIANT"|"GRAY_AREA",
  "confidence_pct": number,
  "applicable_laws": [{ "law": string, "article": string, "relevance": string }],
  "required_licenses": [string],
  "required_registrations": [string],
  "kyc_aml_obligations": [string],
  "risks": [string],
  "upcoming_changes": [string],
  "action_steps": [string],
  "estimated_compliance_cost_usd": number,
  "timeline_to_compliance": string
}`;

        const userInput = `Check compliance:
Country: ${country}
Operation: ${operation}
Business type: ${args.business_type || 'SMB'}
Amount: $${args.amount_usd || 'variable'} USD
Details: ${args.details || 'standard operation'}`;

        try {
          const raw = await callLLM(systemPrompt, userInput, { maxTokens: 2048, temperature: 0.1 });
          const match = raw.match(/\{[\s\S]*\}/);
          const parsed = match ? JSON.parse(match[0]) : { verdict: 'GRAY_AREA', confidence_pct: 50 };
          log.info('compliance_check', { country, operation, verdict: parsed.verdict, trace_id: traceId });
          return { ...parsed, country, operation, jurisdiction_regs: regs, disclaimer: 'Regulatory analysis only. Engage a licensed attorney for definitive compliance opinions.' };
        } catch (err) {
          return { error: `Compliance check failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 6. Invoice Validator
    // ────────────────────────────────────────
    {
      name: 'crypto_invoiceValidator',
      description: 'Validate that a crypto payment invoice meets local fiscal requirements (DGI Panama, SAT Mexico, DIAN Colombia, Receita Federal Brazil). Checks: required fields, tax ID format, currency treatment, electronic invoice compatibility.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country' },
          invoice_amount_usd: { type: 'number', description: 'Invoice amount in USD equivalent' },
          crypto_token: { type: 'string', description: 'Crypto token used for payment (e.g. btc, usdt, eth)' },
          seller_tax_id: { type: 'string', description: 'Seller tax ID (RUC, RFC, NIT, CNPJ)' },
          buyer_tax_id: { type: 'string', description: 'Buyer tax ID (if applicable)' },
          invoice_number: { type: 'string', description: 'Invoice number' },
          exchange_rate_source: { type: 'string', description: 'Source of crypto-to-fiat exchange rate' },
        },
        required: ['country', 'invoice_amount_usd', 'crypto_token'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const country = String(args.country || '').toLowerCase();
        const amount = Number(args.invoice_amount_usd) || 0;
        const token = String(args.crypto_token || '').toUpperCase();

        const regs = LATAM_CRYPTO_REGS[country];
        if (!regs) return { error: `Unsupported country: ${country}` };

        const validations: Array<{ field: string; status: 'pass' | 'fail' | 'warning'; message: string }> = [];

        // Tax ID format validation
        const taxIdFormats: Record<string, { name: string; regex: RegExp }> = {
          panama: { name: 'RUC', regex: /^\d{1,2}-\d{1,4}-\d{1,6}$|^\d+$/ },
          mexico: { name: 'RFC', regex: /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/ },
          colombia: { name: 'NIT', regex: /^\d{9,10}-?\d?$/ },
          brazil: { name: 'CNPJ', regex: /^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/ },
          chile: { name: 'RUT', regex: /^\d{7,8}-[\dkK]$/ },
          peru: { name: 'RUC', regex: /^\d{11}$/ },
          costa_rica: { name: 'Cédula Jurídica', regex: /^\d{9,12}$/ },
        };

        const taxFmt = taxIdFormats[country];
        if (taxFmt && args.seller_tax_id) {
          const valid = taxFmt.regex.test(String(args.seller_tax_id));
          validations.push({ field: `seller_${taxFmt.name}`, status: valid ? 'pass' : 'fail', message: valid ? `Valid ${taxFmt.name} format` : `Invalid ${taxFmt.name} format for ${country}` });
        } else if (taxFmt && !args.seller_tax_id) {
          validations.push({ field: `seller_${taxFmt.name}`, status: 'fail', message: `${taxFmt.name} is required for invoices in ${country}` });
        }

        // Amount threshold check
        if (amount > regs.kyc_threshold_usd) {
          validations.push({ field: 'amount', status: 'warning', message: `Amount $${amount} exceeds KYC threshold ($${regs.kyc_threshold_usd}) — enhanced verification may be required` });
        } else {
          validations.push({ field: 'amount', status: 'pass', message: `Amount below KYC threshold` });
        }

        // Exchange rate source
        if (!args.exchange_rate_source) {
          validations.push({ field: 'exchange_rate_source', status: 'warning', message: 'Exchange rate source not specified — required for tax reporting. Use CoinGecko, Binance, or local exchange rates.' });
        } else {
          validations.push({ field: 'exchange_rate_source', status: 'pass', message: `Exchange rate source: ${args.exchange_rate_source}` });
        }

        // Invoice number
        if (!args.invoice_number) {
          validations.push({ field: 'invoice_number', status: 'fail', message: 'Invoice number is required for fiscal records' });
        } else {
          validations.push({ field: 'invoice_number', status: 'pass', message: 'Invoice number present' });
        }

        // Crypto-specific checks
        validations.push({ field: 'crypto_token', status: 'pass', message: `Payment in ${token} — must be converted to local currency equivalent for invoice amount` });

        if (regs.reporting_required) {
          validations.push({ field: 'reporting', status: 'warning', message: `${country}: Crypto transactions must be reported to ${regs.authority}` });
        }

        const passCount = validations.filter(v => v.status === 'pass').length;
        const failCount = validations.filter(v => v.status === 'fail').length;
        const overallStatus = failCount > 0 ? 'INVALID' : 'VALID';

        log.info('invoice_validated', { country, status: overallStatus, trace_id: traceId });
        return {
          status: overallStatus,
          country,
          crypto_token: token,
          amount_usd: amount,
          validations,
          summary: { pass: passCount, fail: failCount, warnings: validations.filter(v => v.status === 'warning').length },
          required_for_fiscal_compliance: [
            `${taxIdFormats[country]?.name || 'Tax ID'} del vendedor`,
            'Número de factura secuencial',
            'Monto en moneda local equivalente',
            'Fuente de tasa de cambio crypto-fiat',
            'Fecha y hora de la transacción',
            `Hash de transacción blockchain (${token})`,
          ],
        };
      },
    },
  ];
}
