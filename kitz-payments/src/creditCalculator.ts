/**
 * AI Battery credit calculator.
 * $5 = 100 credits, $20 = 500 credits, $60 = 2000 credits.
 */

export interface CreditTier {
  amount: number;
  credits: number;
  currency: string;
}

const USD_TIERS: CreditTier[] = [
  { amount: 5, credits: 100, currency: 'USD' },
  { amount: 20, credits: 500, currency: 'USD' },
  { amount: 60, credits: 2000, currency: 'USD' },
];

/**
 * Calculate credits for a payment amount in USD.
 * Uses the best matching tier. Pro-rates for amounts between tiers.
 */
export function calculateCredits(amount: number): number {
  if (amount <= 0) return 0;

  // Find the best tier (highest value per dollar)
  const sorted = [...USD_TIERS].sort((a, b) => (b.credits / b.amount) - (a.credits / a.amount));

  for (const tier of sorted) {
    if (amount >= tier.amount) {
      const fullTiers = Math.floor(amount / tier.amount);
      const remainder = amount % tier.amount;
      const baseCredits = fullTiers * tier.credits;
      const remainderCredits = remainder > 0
        ? Math.floor((remainder / tier.amount) * tier.credits)
        : 0;
      return baseCredits + remainderCredits;
    }
  }

  // Below minimum tier — pro-rate from $5/100cr
  return Math.floor((amount / 5) * 100);
}
