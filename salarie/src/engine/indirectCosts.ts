import { round2 } from './format';
import type { SalariedYearParams } from './params/types';
import type { IndirectCostsParams, IndirectCostsResult } from './types';

export function getHavaraDays(seniority: number, p: SalariedYearParams): number {
  for (const band of p.indirectCosts.havaraDays) {
    if (band.upToYears === null || seniority <= band.upToYears) return band.days;
  }
  return p.indirectCosts.havaraDays[p.indirectCosts.havaraDays.length - 1].days;
}

export function getHolidayDays(seniority: number, p: SalariedYearParams): number {
  for (const band of p.indirectCosts.holidayDays) {
    if (band.upToYears === null || seniority <= band.upToYears) return band.days;
  }
  return p.indirectCosts.holidayDays[p.indirectCosts.holidayDays.length - 1].days;
}

export function computeIndirectCosts(
  monthlySalary: number,
  seniority: number,
  employmentRate: number,
  options: IndirectCostsParams,
  p: SalariedYearParams
): IndirectCostsResult {
  const havaraMonthly = options.includeHavara
    ? round2((getHavaraDays(seniority, p) * p.indirectCosts.havaraValuePerDay * employmentRate) / 12)
    : 0;

  const holidayDays = getHolidayDays(seniority, p);
  const holidaysMonthly = options.includeHolidays
    ? round2((holidayDays / p.indirectCosts.workingDaysPerYear) * monthlySalary)
    : 0;

  const publicHolidaysMonthly = options.includePublicHolidays
    ? round2((p.indirectCosts.publicHolidayDays / p.indirectCosts.workingDaysPerYear) * monthlySalary)
    : 0;

  const totalMonthly = round2(havaraMonthly + holidaysMonthly + publicHolidaysMonthly);
  return { havaraMonthly, holidaysMonthly, publicHolidaysMonthly, totalMonthly };
}
