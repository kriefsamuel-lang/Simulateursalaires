import { describe, it, expect } from 'vitest';
import { computeIndirectCosts, getHavaraDays, getHolidayDays } from '../indirectCosts';
import { params2026 } from '../params/2026';
import type { IndirectCostsParams } from '../types';

const p = params2026;

const allEnabled: IndirectCostsParams = {
  includeHavara: true,
  includeHolidays: true,
  includePublicHolidays: true,
  seniority: 1,
};

describe('getHavaraDays', () => {
  it('1 year seniority: 10 days', () => {
    expect(getHavaraDays(1, p)).toBe(10);
  });

  it('6 years seniority: 11 days', () => {
    expect(getHavaraDays(6, p)).toBe(11);
  });

  it('11 years seniority: 12 days', () => {
    expect(getHavaraDays(11, p)).toBe(12);
  });
});

describe('getHolidayDays', () => {
  it('0 years seniority: 12 days', () => {
    expect(getHolidayDays(0, p)).toBe(12);
  });

  it('5 years: 14 days', () => {
    expect(getHolidayDays(5, p)).toBe(14);
  });

  it('9 years: 20 days', () => {
    expect(getHolidayDays(9, p)).toBe(20);
  });
});

describe('computeIndirectCosts', () => {
  it('havara monthly = days x 484 / 12 (full time)', () => {
    const result = computeIndirectCosts(10_000, 1, 1, allEnabled, p);
    const expected = Math.round((10 * p.indirectCosts.havaraValuePerDay / 12) * 100) / 100;
    expect(result.havaraMonthly).toBeCloseTo(expected, 1);
  });

  it('conges 0 years seniority: 12 days / 250 x salary', () => {
    const salary = 10_000;
    const result = computeIndirectCosts(salary, 0, 1, allEnabled, p);
    const expected = (12 / 250) * salary;
    expect(result.holidaysMonthly).toBeCloseTo(expected, 0);
  });

  it('disabled options -> 0', () => {
    const noneEnabled: IndirectCostsParams = { includeHavara: false, includeHolidays: false, includePublicHolidays: false, seniority: 5 };
    const result = computeIndirectCosts(10_000, 5, 1, noneEnabled, p);
    expect(result.totalMonthly).toBe(0);
  });

  it('public holidays = 9/250 x salary', () => {
    const salary = 10_000;
    const result = computeIndirectCosts(salary, 1, 1, { ...allEnabled, includeHavara: false, includeHolidays: false }, p);
    const expected = (9 / 250) * salary;
    expect(result.publicHolidaysMonthly).toBeCloseTo(expected, 0);
  });
});
