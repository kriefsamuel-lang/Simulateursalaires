import { round2 } from './format';
import type { SalariedYearParams } from './params/types';
import type { BLResult } from './types';

export function computeBL(monthlySalary: number, p: SalariedYearParams): BLResult {
  const capped = Math.min(monthlySalary, p.bituachLeumi.maxMonthlyIncome);
  const reducedPart = Math.min(capped, p.bituachLeumi.reducedMonthlyCeiling);
  const fullPart = Math.max(0, capped - p.bituachLeumi.reducedMonthlyCeiling);

  const employeeLeumi =
    reducedPart * p.bituachLeumi.employee.reduced.leumi +
    fullPart * p.bituachLeumi.employee.full.leumi;
  const employeeHealth =
    reducedPart * p.bituachLeumi.employee.reduced.health +
    fullPart * p.bituachLeumi.employee.full.health;
  const employerBL =
    reducedPart * p.bituachLeumi.employer.reduced +
    fullPart * p.bituachLeumi.employer.full;

  return {
    grossSalary: monthlySalary,
    employeeLeumi: round2(employeeLeumi),
    employeeHealth: round2(employeeHealth),
    employeeTotal: round2(employeeLeumi + employeeHealth),
    employerBL: round2(employerBL),
  };
}
