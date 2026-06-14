import { describe, it, expect } from 'vitest';
import { grossFromNet } from '../solver';
import { simulate } from '../simulate';
import { params2026 } from '../params/2026';
import type { SalarieInput } from '../types';

const p = params2026;

const defaultInput: SalarieInput = {
  mode: 'brut',
  salaryInput: 10_000,
  fiscalYear: 2026,
  employmentRate: 1,
  personal: {
    birthYear: 1985,
    gender: 'M',
    maritalStatus: 'single',
    spouseNoIncome: false,
    children: [],
    paysMezonot: false,
    aliyahDate: null,
    hasAcademicDegree: false,
    isDischargedSoldier: false,
  },
  pension: {
    productType: 'keren_pensia',
    employeeTagmoulimRate: 0.06,
    employerTagmoulimRate: 0.065,
    employerPitsouimRate: 0.06,
  },
  keren: { enabled: false, employeeRate: 0.025, employerRate: 0.075 },
  indirectCosts: { includeHavara: false, includeHolidays: false, includePublicHolidays: false, seniority: 1 },
  clientName: 'Test',
};

function computeNetFromBrut(brut: number): number {
  const result = simulate({ ...defaultInput, mode: 'brut', salaryInput: brut }, p);
  return result.net;
}

describe('solver', () => {
  it('grossFromNet(computeNetFromBrut(10000)) approx 10000', () => {
    const targetNet = computeNetFromBrut(10_000);
    const result = grossFromNet(targetNet, computeNetFromBrut);
    expect(Math.abs(result.brut - 10_000)).toBeLessThan(2);
    expect(result.converged).toBe(true);
    expect(result.iterations).toBeLessThan(30);
  });

  it('grossFromNet(computeNetFromBrut(20000)) approx 20000', () => {
    const targetNet = computeNetFromBrut(20_000);
    const result = grossFromNet(targetNet, computeNetFromBrut);
    expect(Math.abs(result.brut - 20_000)).toBeLessThan(2);
    expect(result.converged).toBe(true);
    expect(result.iterations).toBeLessThan(30);
  });

  it('grossFromNet(computeNetFromBrut(50000)) approx 50000', () => {
    const targetNet = computeNetFromBrut(50_000);
    const result = grossFromNet(targetNet, computeNetFromBrut);
    expect(Math.abs(result.brut - 50_000)).toBeLessThan(2);
    expect(result.converged).toBe(true);
    expect(result.iterations).toBeLessThan(30);
  });
});
