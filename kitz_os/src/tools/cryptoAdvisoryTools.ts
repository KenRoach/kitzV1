/**
 * Crypto Advisory Tools — Market analysis, portfolio tracking, wallet monitoring for SMBs.
 *
 * 8 tools:
 *   - crypto_getMarketPrice        (low)    — Real-time price + 24h/7d/30d change via CoinGecko
 *   - crypto_portfolioSnapshot     (low)    — Portfolio valuation across holdings
 *   - crypto_walletBalance         (low)    — On-chain balance lookup (EVM, BTC, SOL)
 *   - crypto_gasTracker            (low)    — Current gas/fee estimates for EVM + BTC + SOL
 *   - crypto_tokenAnalysis         (medium) — Fundamental analysis: TVL, volume, market cap, supply
 *   - crypto_investmentAdvisor     (medium) — AI-driven portfolio allocation advice for LatAm SMBs
 *   - crypto_deFiYieldScanner      (low)    — Top DeFi yields on stablecoins (USDT/USDC/DAI)
 *   - crypto_paymentGatewayAdvisor (medium) — Advise on accepting crypto payments for LatAm businesses
 *
 * Uses CoinGecko (free tier, no key required), public RPCs, and callLLM for advisory.
 * Claude Haiku default, OpenAI gpt-4o-mini fallback.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { callLLM } from './shared/callLLM.js';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('cryptoAdvisoryTools');

// ── CoinGecko (free, no key) ──
const CG_BASE = 'https://api.coingecko.com/api/v3';

// Optional pro key for higher rate limits
const CG_API_KEY = process.env.COINGECKO_API_KEY || '';
const cgHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  ...(CG_API_KEY ? { 'x-cg-demo-api-key': CG_API_KEY } : {}),
};

// ── Token ID mapping (CoinGecko IDs) ──
const TOKEN_MAP: Record<string, string> = {
  btc: 'bitcoin', bitcoin: 'bitcoin',
  eth: 'ethereum', ethereum: 'ethereum',
  usdt: 'tether', tether: 'tether',
  usdc: 'usd-coin', 'usd-coin': 'usd-coin',
  sol: 'solana', solana: 'solana',
  bnb: 'binancecoin', binancecoin: 'binancecoin',
  matic: 'matic-network', polygon: 'matic-network',
  avax: 'avalanche-2', avalanche: 'avalanche-2',
  dai: 'dai',
  xrp: 'ripple', ripple: 'ripple',
  ada: 'cardano', cardano: 'cardano',
  dot: 'polkadot', polkadot: 'polkadot',
  link: 'chainlink', chainlink: 'chainlink',
  arb: 'arbitrum', arbitrum: 'arbitrum',
  op: 'optimism', optimism: 'optimism',
};

function resolveTokenId(input: string): string | null {
  const key = input.toLowerCase().trim();
  return TOKEN_MAP[key] || null;
}

function resolveMultipleTokenIds(input: string): string[] {
  return input
    .split(/[,\s]+/)
    .map(t => resolveTokenId(t))
    .filter((t): t is string => t !== null);
}

// ── Helpers ──

async function cgFetch<T>(path: string, timeoutMs = 10_000): Promise<T> {
  const res = await fetch(`${CG_BASE}${path}`, {
    headers: cgHeaders,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}: ${await res.text().catch(() => 'unknown')}`);
  return res.json() as Promise<T>;
}

// ── EVM balance via public RPC ──
const EVM_RPCS: Record<string, string> = {
  ethereum: 'https://eth.llamarpc.com',
  polygon: 'https://polygon-rpc.com',
  bsc: 'https://bsc-dataseed.binance.org',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
  optimism: 'https://mainnet.optimism.io',
  avalanche: 'https://api.avax.network/ext/bc/C/rpc',
  base: 'https://mainnet.base.org',
};

async function getEvmBalance(address: string, chain: string): Promise<{ balanceWei: string; balanceEth: string }> {
  const rpc = EVM_RPCS[chain.toLowerCase()];
  if (!rpc) throw new Error(`Unsupported EVM chain: ${chain}`);
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBalance', params: [address, 'latest'], id: 1 }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json() as { result?: string; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  const wei = BigInt(data.result || '0x0');
  const eth = Number(wei) / 1e18;
  return { balanceWei: wei.toString(), balanceEth: eth.toFixed(6) };
}

// ── SOL balance via public RPC ──
async function getSolBalance(address: string): Promise<{ lamports: number; sol: string }> {
  const res = await fetch('https://api.mainnet-beta.solana.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address] }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json() as { result?: { value: number }; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  const lamports = data.result?.value || 0;
  return { lamports, sol: (lamports / 1e9).toFixed(6) };
}

// ── Tools ──

export function getAllCryptoAdvisoryTools(): ToolSchema[] {
  return [

    // ────────────────────────────────────────
    // 1. Real-time market price
    // ────────────────────────────────────────
    {
      name: 'crypto_getMarketPrice',
      description: 'Get real-time crypto price with 24h/7d/30d change, market cap, volume. Supports BTC, ETH, SOL, USDT, USDC, BNB, MATIC, AVAX, DAI, XRP, ADA, DOT, LINK, ARB, OP.',
      parameters: {
        type: 'object',
        properties: {
          tokens: { type: 'string', description: 'Comma-separated token symbols (e.g. "btc,eth,sol")' },
          vs_currency: { type: 'string', description: 'Fiat currency for pricing (default: usd). Supports: usd, eur, mxn, cop, brl, pen, clp, pab' },
        },
        required: ['tokens'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const raw = String(args.tokens || '').trim();
        if (!raw) return { error: 'tokens is required (e.g. "btc,eth")' };
        const ids = resolveMultipleTokenIds(raw);
        if (ids.length === 0) return { error: `Unknown tokens: ${raw}. Supported: ${Object.keys(TOKEN_MAP).filter(k => k.length <= 5).join(', ')}` };
        const vs = String(args.vs_currency || 'usd').toLowerCase();
        try {
          const data = await cgFetch<Record<string, Record<string, number>>>(
            `/simple/price?ids=${ids.join(',')}&vs_currencies=${vs}&include_24hr_change=true&include_7d_change=true&include_30d_change=true&include_market_cap=true&include_24hr_vol=true`,
          );
          log.info('price_fetched', { tokens: ids, trace_id: traceId });
          return { prices: data, vs_currency: vs, timestamp: new Date().toISOString() };
        } catch (err) {
          log.error('price_fetch_failed', { error: (err as Error).message });
          return { error: `Failed to fetch prices: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 2. Portfolio snapshot
    // ────────────────────────────────────────
    {
      name: 'crypto_portfolioSnapshot',
      description: 'Calculate total portfolio value from holdings. Input your tokens and amounts, get back USD value, allocation %, and 24h change per asset.',
      parameters: {
        type: 'object',
        properties: {
          holdings: {
            type: 'array',
            description: 'Array of holdings: [{ "token": "btc", "amount": 0.5 }, { "token": "eth", "amount": 10 }]',
            items: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                amount: { type: 'number' },
              },
              required: ['token', 'amount'],
            },
          },
          vs_currency: { type: 'string', description: 'Fiat currency (default: usd)' },
        },
        required: ['holdings'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const holdings = args.holdings as Array<{ token: string; amount: number }> | undefined;
        if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
          return { error: 'holdings array is required. Example: [{ "token": "btc", "amount": 0.5 }]' };
        }
        const vs = String(args.vs_currency || 'usd').toLowerCase();
        const ids = holdings.map(h => resolveTokenId(h.token)).filter((t): t is string => t !== null);
        if (ids.length === 0) return { error: 'No valid tokens in holdings' };
        try {
          const prices = await cgFetch<Record<string, Record<string, number>>>(
            `/simple/price?ids=${ids.join(',')}&vs_currencies=${vs}&include_24hr_change=true`,
          );
          let totalValue = 0;
          const breakdown = holdings.map(h => {
            const cgId = resolveTokenId(h.token);
            if (!cgId || !prices[cgId]) return { token: h.token, amount: h.amount, error: 'price unavailable' };
            const price = prices[cgId][vs] || 0;
            const change24h = prices[cgId][`${vs}_24h_change`] || 0;
            const value = h.amount * price;
            totalValue += value;
            return { token: h.token.toUpperCase(), amount: h.amount, price, value: Math.round(value * 100) / 100, change_24h_pct: Math.round(change24h * 100) / 100 };
          });
          // Add allocation %
          const withAlloc = breakdown.map(b => {
            if ('error' in b) return b;
            return { ...b, allocation_pct: totalValue > 0 ? Math.round((b.value / totalValue) * 10000) / 100 : 0 };
          });
          log.info('portfolio_snapshot', { total: totalValue, assets: holdings.length, trace_id: traceId });
          return { total_value: Math.round(totalValue * 100) / 100, vs_currency: vs, assets: withAlloc, timestamp: new Date().toISOString() };
        } catch (err) {
          return { error: `Portfolio fetch failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 3. Wallet balance (on-chain)
    // ────────────────────────────────────────
    {
      name: 'crypto_walletBalance',
      description: 'Look up on-chain native balance for any EVM wallet (Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, Base) or Solana address. Returns balance in native token.',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Wallet address (0x... for EVM, base58 for Solana)' },
          chain: { type: 'string', description: 'Chain: ethereum, polygon, bsc, arbitrum, optimism, avalanche, base, solana (default: ethereum)' },
        },
        required: ['address'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const address = String(args.address || '').trim();
        if (!address) return { error: 'address is required' };
        const chain = String(args.chain || 'ethereum').toLowerCase();

        try {
          if (chain === 'solana' || chain === 'sol') {
            const bal = await getSolBalance(address);
            log.info('sol_balance', { address: address.slice(0, 8), trace_id: traceId });
            return { chain: 'solana', address, native_token: 'SOL', balance: bal.sol, lamports: bal.lamports };
          }
          const bal = await getEvmBalance(address, chain);
          const nativeToken = chain === 'bsc' ? 'BNB' : chain === 'polygon' ? 'MATIC' : chain === 'avalanche' ? 'AVAX' : 'ETH';
          log.info('evm_balance', { chain, address: address.slice(0, 8), trace_id: traceId });
          return { chain, address, native_token: nativeToken, balance: bal.balanceEth, balance_wei: bal.balanceWei };
        } catch (err) {
          return { error: `Balance lookup failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 4. Gas / fee tracker
    // ────────────────────────────────────────
    {
      name: 'crypto_gasTracker',
      description: 'Current gas prices for EVM chains (Ethereum, Polygon, BSC, Arbitrum, Base). Returns slow/standard/fast estimates in Gwei.',
      parameters: {
        type: 'object',
        properties: {
          chain: { type: 'string', description: 'Chain: ethereum, polygon, bsc, arbitrum, base (default: ethereum)' },
        },
        required: [],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const chain = String(args.chain || 'ethereum').toLowerCase();
        const rpc = EVM_RPCS[chain];
        if (!rpc) return { error: `Unsupported chain: ${chain}. Supported: ${Object.keys(EVM_RPCS).join(', ')}` };
        try {
          const res = await fetch(rpc, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 1 }),
            signal: AbortSignal.timeout(10_000),
          });
          const data = await res.json() as { result?: string };
          const gasPriceWei = BigInt(data.result || '0x0');
          const gasPriceGwei = Number(gasPriceWei) / 1e9;
          // Estimate tiers
          const slow = Math.round(gasPriceGwei * 0.85 * 100) / 100;
          const standard = Math.round(gasPriceGwei * 100) / 100;
          const fast = Math.round(gasPriceGwei * 1.2 * 100) / 100;
          // Cost estimates for common ops (21000 gas for transfer)
          const transferCostUsd = async () => {
            try {
              const nativeId = chain === 'bsc' ? 'binancecoin' : chain === 'polygon' ? 'matic-network' : chain === 'avalanche' ? 'avalanche-2' : 'ethereum';
              const p = await cgFetch<Record<string, { usd: number }>>(`/simple/price?ids=${nativeId}&vs_currencies=usd`);
              const price = p[nativeId]?.usd || 0;
              return Math.round((standard * 21000 / 1e9) * price * 10000) / 10000;
            } catch { return null; }
          };
          const txCostUsd = await transferCostUsd();
          log.info('gas_tracked', { chain, standard, trace_id: traceId });
          return { chain, gas_gwei: { slow, standard, fast }, transfer_cost_usd: txCostUsd, timestamp: new Date().toISOString() };
        } catch (err) {
          return { error: `Gas fetch failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 5. Token fundamental analysis
    // ────────────────────────────────────────
    {
      name: 'crypto_tokenAnalysis',
      description: 'Deep fundamental analysis of a token: market cap, fully diluted valuation, circulating/total/max supply, 24h volume, ATH/ATL, TVL, price history. Expert-level data for investment decisions.',
      parameters: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'Token symbol (e.g. btc, eth, sol)' },
        },
        required: ['token'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const tokenRaw = String(args.token || '').trim();
        const cgId = resolveTokenId(tokenRaw);
        if (!cgId) return { error: `Unknown token: ${tokenRaw}` };
        try {
          const data = await cgFetch<Record<string, unknown>>(
            `/coins/${cgId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`,
            15_000,
          );
          const md = data.market_data as Record<string, unknown> | undefined;
          if (!md) return { error: 'No market data available' };
          const usd = (v: unknown) => (v as Record<string, number> | undefined)?.usd;
          const analysis = {
            token: tokenRaw.toUpperCase(),
            name: data.name,
            symbol: (data.symbol as string || '').toUpperCase(),
            market_cap_rank: data.market_cap_rank,
            current_price_usd: usd(md.current_price),
            market_cap_usd: usd(md.market_cap),
            fully_diluted_valuation_usd: usd(md.fully_diluted_valuation),
            total_volume_24h_usd: usd(md.total_volume),
            circulating_supply: md.circulating_supply,
            total_supply: md.total_supply,
            max_supply: md.max_supply,
            ath_usd: usd(md.ath),
            ath_date: (md.ath_date as Record<string, string> | undefined)?.usd,
            ath_change_pct: (md.ath_change_percentage as Record<string, number> | undefined)?.usd,
            atl_usd: usd(md.atl),
            atl_date: (md.atl_date as Record<string, string> | undefined)?.usd,
            price_change_24h_pct: md.price_change_percentage_24h,
            price_change_7d_pct: md.price_change_percentage_7d,
            price_change_30d_pct: md.price_change_percentage_30d,
            price_change_1y_pct: md.price_change_percentage_1y,
            mcap_to_volume_ratio: (usd(md.market_cap) && usd(md.total_volume))
              ? Math.round((usd(md.market_cap)! / usd(md.total_volume)!) * 100) / 100
              : null,
            supply_ratio: (md.circulating_supply && md.max_supply)
              ? Math.round(((md.circulating_supply as number) / (md.max_supply as number)) * 10000) / 100
              : null,
            categories: data.categories,
            genesis_date: data.genesis_date,
          };
          log.info('token_analysis', { token: cgId, trace_id: traceId });
          return analysis;
        } catch (err) {
          return { error: `Token analysis failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 6. AI Investment Advisor
    // ────────────────────────────────────────
    {
      name: 'crypto_investmentAdvisor',
      description: 'AI-powered crypto portfolio allocation advice for LatAm SMBs. Considers risk profile, business cash flow needs, local regulations (Panama, Mexico, Colombia, Brazil), and stablecoin treasury strategies.',
      parameters: {
        type: 'object',
        properties: {
          investment_amount_usd: { type: 'number', description: 'Amount to invest in USD' },
          risk_profile: { type: 'string', enum: ['conservative', 'moderate', 'aggressive'], description: 'Risk tolerance' },
          country: { type: 'string', description: 'Business country (panama, mexico, colombia, brazil, chile, peru, costa_rica)' },
          business_type: { type: 'string', description: 'Type of business (e.g. e-commerce, food delivery, freelance, SaaS)' },
          time_horizon: { type: 'string', description: 'Investment horizon (e.g. 3 months, 1 year, 3 years)' },
          existing_holdings: { type: 'string', description: 'Current crypto holdings if any (e.g. "0.1 BTC, 2 ETH")' },
          monthly_revenue_usd: { type: 'number', description: 'Monthly business revenue in USD (for cash flow context)' },
        },
        required: ['investment_amount_usd', 'risk_profile'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const amount = Number(args.investment_amount_usd) || 0;
        if (amount <= 0) return { error: 'investment_amount_usd must be positive' };
        const risk = String(args.risk_profile || 'moderate');
        const country = String(args.country || 'panama').toLowerCase();

        const systemPrompt = `You are an expert crypto & blockchain investment advisor specializing in Latin America.
You have deep knowledge of:
- Blockchain fundamentals: consensus mechanisms, layer 1/2 architecture, DeFi protocols, tokenomics
- LatAm regulatory landscape: Panama (crypto-friendly, Ley 129 de 2020), Mexico (Ley Fintech, SAT reporting), Colombia (Superfinanciera sandbox), Brazil (Marco Legal Cripto Lei 14.478), Chile (CMF), Peru (SBS), Costa Rica (SUGEVAL)
- Treasury management for SMBs: stablecoin strategies (USDT/USDC on-chain vs. CEX), yield farming risk tiers, liquidity needs
- DeFi safety: smart contract risk, impermanent loss, rug pull indicators, audit status
- On/off ramp options: Binance P2P, Bitso, Mercado Pago, local bank ACH, Yappy (Panama)
- Tax implications by country

Rules:
- NEVER recommend more than 30% of monthly revenue in volatile crypto
- ALWAYS recommend keeping 3-6 months operating expenses in stablecoins/fiat
- Flag regulatory risks specific to the user's country
- Recommend only established protocols (top 50 by TVL for DeFi)
- Include on-ramp/off-ramp instructions for their country
- Default language: Spanish

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

        const userInput = `Investment: $${amount} USD
Risk profile: ${risk}
Country: ${country}
Business type: ${args.business_type || 'general'}
Time horizon: ${args.time_horizon || 'medium-term'}
Existing holdings: ${args.existing_holdings || 'none'}
Monthly revenue: $${args.monthly_revenue_usd || 'unknown'} USD`;

        try {
          const raw = await callLLM(systemPrompt, userInput, { maxTokens: 2048, temperature: 0.3 });
          const match = raw.match(/\{[\s\S]*\}/);
          const parsed = match ? JSON.parse(match[0]) : { error: 'Could not parse advice' };
          log.info('investment_advice', { amount, risk, country, trace_id: traceId });
          return parsed;
        } catch (err) {
          return { error: `Investment advisor failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 7. DeFi Yield Scanner
    // ────────────────────────────────────────
    {
      name: 'crypto_deFiYieldScanner',
      description: 'Scan top DeFi protocols for stablecoin yields (USDT, USDC, DAI). Returns APY, TVL, protocol risk tier, and chain. Focuses on battle-tested protocols only.',
      parameters: {
        type: 'object',
        properties: {
          stablecoin: { type: 'string', description: 'Stablecoin to scan yields for: usdt, usdc, dai (default: usdc)' },
          min_tvl_usd: { type: 'number', description: 'Minimum TVL filter in USD (default: 10000000 = $10M)' },
          max_results: { type: 'number', description: 'Max results to return (default: 10)' },
        },
        required: [],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const stablecoin = String(args.stablecoin || 'usdc').toUpperCase();
        const minTvl = Number(args.min_tvl_usd) || 10_000_000;
        const maxResults = Math.min(Number(args.max_results) || 10, 25);

        try {
          // Use DeFiLlama yields API (free, no key)
          const res = await fetch('https://yields.llama.fi/pools', {
            signal: AbortSignal.timeout(15_000),
          });
          if (!res.ok) throw new Error(`DeFiLlama ${res.status}`);
          const data = await res.json() as { data: Array<{ pool: string; chain: string; project: string; symbol: string; tvlUsd: number; apy: number; apyBase: number; apyReward: number; stablecoin: boolean; ilRisk: string; exposure: string; audits: string }> };

          const filtered = data.data
            .filter(p =>
              p.stablecoin &&
              p.symbol.toUpperCase().includes(stablecoin) &&
              p.tvlUsd >= minTvl &&
              p.apy > 0 && p.apy < 50, // Filter out unrealistic APYs
            )
            .sort((a, b) => b.apy - a.apy)
            .slice(0, maxResults)
            .map(p => ({
              protocol: p.project,
              chain: p.chain,
              pool: p.symbol,
              apy_pct: Math.round(p.apy * 100) / 100,
              apy_base_pct: Math.round((p.apyBase || 0) * 100) / 100,
              apy_reward_pct: Math.round((p.apyReward || 0) * 100) / 100,
              tvl_usd: Math.round(p.tvlUsd),
              il_risk: p.ilRisk || 'no',
            }));

          log.info('defi_yields_scanned', { stablecoin, results: filtered.length, trace_id: traceId });
          return {
            stablecoin,
            min_tvl_filter: minTvl,
            pools: filtered,
            disclaimer: 'DeFi yields are variable and carry smart contract risk. Past performance does not guarantee future returns.',
            timestamp: new Date().toISOString(),
          };
        } catch (err) {
          return { error: `DeFi yield scan failed: ${(err as Error).message}` };
        }
      },
    },

    // ────────────────────────────────────────
    // 8. Crypto Payment Gateway Advisor
    // ────────────────────────────────────────
    {
      name: 'crypto_paymentGatewayAdvisor',
      description: 'Advise LatAm SMBs on accepting crypto payments: gateway comparison (Bitpay, Coinbase Commerce, Binance Pay, MercadoPago crypto), integration effort, fees, settlement options, and regulatory compliance by country.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Business country' },
          business_type: { type: 'string', description: 'Type of business' },
          monthly_volume_usd: { type: 'number', description: 'Expected monthly crypto payment volume in USD' },
          preferred_settlement: { type: 'string', enum: ['crypto', 'fiat', 'both'], description: 'How to receive funds (default: both)' },
          current_payment_methods: { type: 'string', description: 'Current payment methods (e.g. "Yappy, cash, bank transfer")' },
        },
        required: ['country'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const country = String(args.country || '').trim();
        if (!country) return { error: 'country is required' };

        const systemPrompt = `You are an expert on crypto payment infrastructure for Latin American businesses.
Deep knowledge of:
- Payment gateways: BitPay, Coinbase Commerce, Binance Pay, NOWPayments, CoinGate, BTCPay Server (self-hosted)
- Local solutions: Bitso (MX), Buda.com (CL/CO/PE), Lemon Cash (AR), Mercado Pago crypto (BR/MX/AR)
- Stablecoin rails: USDT/USDC on Tron (low fees), Polygon, BSC, Solana
- On/off ramps by country: Binance P2P liquidity, local bank integration, ACH, Yappy (PA)
- Regulatory: invoice requirements, tax reporting, KYC/AML obligations per country
- Technical: API integration complexity, WooCommerce/Shopify plugins, QR code payments, Lightning Network
- Fees: network fees, gateway fees, FX spreads, settlement timing

Rules:
- Recommend self-custody (BTCPay Server) for privacy-conscious or high-volume merchants
- Flag if country has specific crypto payment restrictions
- Include fee comparison table
- Consider the business's technical capability
- Default language: Spanish

Respond with valid JSON:
{
  "recommended_gateways": [{ "name": string, "fee_pct": number, "settlement": string, "integration_effort": "low"|"medium"|"high", "pros": [string], "cons": [string] }],
  "best_stablecoin_rail": { "token": string, "network": string, "avg_fee_usd": number },
  "regulatory_status": string,
  "tax_notes": string,
  "action_steps": [string],
  "estimated_setup_hours": number
}`;

        const userInput = `Country: ${country}
Business type: ${args.business_type || 'general'}
Monthly volume: $${args.monthly_volume_usd || 'unknown'} USD
Preferred settlement: ${args.preferred_settlement || 'both'}
Current payment methods: ${args.current_payment_methods || 'unknown'}`;

        try {
          const raw = await callLLM(systemPrompt, userInput, { maxTokens: 2048, temperature: 0.3 });
          const match = raw.match(/\{[\s\S]*\}/);
          const parsed = match ? JSON.parse(match[0]) : { error: 'Could not parse advice' };
          log.info('payment_gateway_advice', { country, trace_id: traceId });
          return parsed;
        } catch (err) {
          return { error: `Payment gateway advisor failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
