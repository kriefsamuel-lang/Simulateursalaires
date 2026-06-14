import { describe, it, expect } from 'vitest';
import { computeIR, computeBracketTax } from '../incomeTax';
import { params2026 } from '../params/2026';

const p = params2026;

describe('computeBracketTax 2026 monthly', () => {
  it('7010 ILS -- only 10% bracket', () => {
    const tax = computeBracketTax(7_010, p);
    expect(tax).toBeCloseTo(7_010 * 0.10, 0);
  });

  it('10060 ILS -- 10% + 14% brackets', () => {
    const tax = computeBracketTax(10_060, p);
    const expected = 7_010 * 0.10 + (10_060 - 7_010) * 0.14;
    expect(tax).toBeCloseTo(expected, 0);
  });

  it('19000 ILS -- through 20% bracket', () => {
    const tax = computeBracketTax(19_000, p);
    const expected = 7_010 * 0.10 + (10_060 - 7_010) * 0.14 + (19_000 - 10_060) * 0.20;
    expect(tax).toBeCloseTo(expected, 0);
  });

  it('25100 ILS -- through 31% bracket', () => {
    const tax = computeBracketTax(25_100, p);
    expect(tax).toBeGreaterThan(computeBracketTax(19_000, p));
  });

  it('46690 ILS -- through 35% bracket', () => {
    const tax = computeBracketTax(46_690, p);
    expect(tax).toBeGreaterThan(computeBracketTax(25_100, p));
  });
});

describe('computeIR', () => {
  it('above surtax threshold (65000 ILS) -- includes surtax', () => {
    // Seuil mensuel 2026 = 60 130 ₪ ; 60 000 < seuil donc pas de surtax
    const result = computeIR(65_000, 0, 0, 0, p);
    expect(result.surtax).toBeGreaterThan(0);
  });

  it('credit points reduce tax', () => {
    const without = computeIR(15_000, 0, 0, 0, p);
    const with2pts = computeIR(15_000, 0, 0, 2, p);
    expect(with2pts.netTax).toBeLessThan(without.netTax);
  });

  it('netTax >= 0', () => {
    const result = computeIR(5_000, 300, 100, 10, p);
    expect(result.netTax).toBeGreaterThanOrEqual(0);
  });

  it('pension credit reduces tax', () => {
    const without = computeIR(15_000, 0, 0, 0, p);
    const withCredit = computeIR(15_000, 0, 200, 0, p);
    expect(withCredit.netTax).toBeLessThan(without.netTax);
  });
});
