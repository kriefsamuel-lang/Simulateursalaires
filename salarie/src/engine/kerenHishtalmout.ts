import { round2 } from './format';
import type { SalariedYearParams } from './params/types';
import type { KerenResult } from './types';

export function computeKeren(
  monthlySalary: number,
  employeeRate: number,
  employerRate: number,
  p: SalariedYearParams
): KerenResult {
  const employeeContrib = round2(monthlySalary * employeeRate);
  const employerContrib = round2(monthlySalary * employerRate);

  const exemptBase = Math.min(monthlySalary, p.kerenHishtalmout.employerExemptMonthlyCeiling);
  const employerExempt = round2(Math.min(employerContrib, exemptBase * p.kerenHishtalmout.employerExemptRate));
  const employerTaxable = Math.max(0, round2(employerContrib - employerExempt));

  return { employeeContrib, employerContrib, employerExempt, employerTaxable };
}

export function emptyKeren(): KerenResult {
  return { employeeContrib: 0, employerContrib: 0, employerExempt: 0, employerTaxable: 0 };
}
