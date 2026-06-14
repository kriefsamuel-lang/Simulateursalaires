import { describe, it, expect } from 'vitest';
import { computeBL } from '../bituachLeumi';
import { params2026 } from '../params/2026';

const p = params2026;

describe('computeBL 2026', () => {
  it('5000 ILS -- below reduced ceiling, only reduced rates', () => {
    const result = computeBL(5_000, p);
    expect(result.grossSalary).toBe(5_000);
    const expectedLeumi = Math.round(5_000 * p.bituachLeumi.employee.reduced.leumi * 100) / 100;
    const expectedHealth = Math.round(5_000 * p.bituachLeumi.employee.reduced.health * 100) / 100;
    expect(result.employeeLeumi).toBeCloseTo(expectedLeumi, 1);
    expect(result.employeeHealth).toBeCloseTo(expectedHealth, 1);
    expect(result.employeeTotal).toBeCloseTo(result.employeeLeumi + result.employeeHealth, 1);
  });

  it('7703 ILS -- at reduced ceiling boundary', () => {
    const result = computeBL(7_703, p);
    expect(result.employeeTotal).toBeGreaterThan(0);
    const expectedLeumi = Math.round(7_703 * p.bituachLeumi.employee.reduced.leumi * 100) / 100;
    expect(result.employeeLeumi).toBeCloseTo(expectedLeumi, 0);
  });

  it('10000 ILS -- above reduced ceiling, below max', () => {
    const result = computeBL(10_000, p);
    const reducedPart = p.bituachLeumi.reducedMonthlyCeiling;
    const fullPart = 10_000 - reducedPart;
    const expectedLeumi = reducedPart * p.bituachLeumi.employee.reduced.leumi + fullPart * p.bituachLeumi.employee.full.leumi;
    expect(result.employeeLeumi).toBeCloseTo(expectedLeumi, 0);
    expect(result.employerBL).toBeGreaterThan(0);
  });

  it('51910 ILS -- at max income', () => {
    const result = computeBL(51_910, p);
    expect(result.grossSalary).toBe(51_910);
    expect(result.employeeTotal).toBeGreaterThan(0);
  });

  it('60000 ILS -- above max, should be capped at 51910', () => {
    const resultAt60k = computeBL(60_000, p);
    const resultAtMax = computeBL(51_910, p);
    expect(resultAt60k.employeeTotal).toBeCloseTo(resultAtMax.employeeTotal, 0);
    expect(resultAt60k.employerBL).toBeCloseTo(resultAtMax.employerBL, 0);
  });

  it('employee total = leumi + health', () => {
    const result = computeBL(20_000, p);
    expect(result.employeeTotal).toBeCloseTo(result.employeeLeumi + result.employeeHealth, 1);
  });
});
