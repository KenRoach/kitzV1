import { describe, it, expect } from 'vitest';
import { calculateCredits } from './creditCalculator.js';

describe('calculateCredits', () => {
  it('returns 100 credits for $5', () => {
    expect(calculateCredits(5)).toBe(100);
  });

  it('returns 500 credits for $20', () => {
    expect(calculateCredits(20)).toBe(500);
  });

  it('returns 2000 credits for $60', () => {
    expect(calculateCredits(60)).toBe(2000);
  });

  it('pro-rates for amounts between tiers', () => {
    const credits = calculateCredits(10);
    // Between $5 (100cr) and $20 (500cr), should be pro-rated
    expect(credits).toBeGreaterThan(100);
    expect(credits).toBeLessThan(500);
  });

  it('pro-rates for amounts above $60', () => {
    const credits = calculateCredits(120);
    // Above $60 tier, uses $60 rate (2000/60 ≈ 33.33 per dollar)
    expect(credits).toBeGreaterThan(2000);
  });

  it('returns 0 for $0', () => {
    expect(calculateCredits(0)).toBe(0);
  });

  it('returns 0 for negative amounts', () => {
    expect(calculateCredits(-10)).toBe(0);
  });

  it('handles small amounts below $5', () => {
    const credits = calculateCredits(1);
    // Below $5 tier, uses $5 rate (100/5 = 20 per dollar)
    expect(credits).toBe(20);
  });
});
