import { round2 } from './format';
import type { SalariedYearParams } from './params/types';
import type { PensionResult } from './types';

export function computePension(
  monthlySalary: number,
  employeeRate: number,
  employerTagmoulimRate: number,
  employerPitsouimRate: number,
  p: SalariedYearParams
): PensionResult {
  const employeeContrib = round2(monthlySalary * employeeRate);
  const employerTagmoulim = round2(monthlySalary * employerTagmoulimRate);
  const employerPitsouim = round2(monthlySalary * employerPitsouimRate);

  const qualifyingBase = Math.min(monthlySalary, p.pension.qualifyingMonthlyCeiling);
  const zikuyBase = Math.min(employeeContrib, qualifyingBase * p.pension.employeeZikuyContribRate);
  const employeeZikuy = round2(zikuyBase * p.pension.employeeZikuyRate);

  return {
    employeeContrib,
    employerTagmoulim,
    employerPitsouim,
    employerTotal: round2(employerTagmoulim + employerPitsouim),
    employeeZikuy,
  };
}

export function emptyPension(): PensionResult {
  return {
    employeeContrib: 0,
    employerTagmoulim: 0,
    employerPitsouim: 0,
    employerTotal: 0,
    employeeZikuy: 0,
  };
}
