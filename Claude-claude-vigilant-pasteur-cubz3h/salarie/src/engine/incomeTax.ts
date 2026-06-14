import { round2 } from './format';
import type { SalariedYearParams } from './params/types';
import type { IRResult } from './types';

export function computeBracketTax(taxable: number, p: SalariedYearParams): number {
  let tax = 0;
  let prev = 0;
  for (const bracket of p.incomeTax.brackets) {
    const ceiling = bracket.upTo ?? Infinity;
    if (taxable <= prev) break;
    const slice = Math.min(taxable, ceiling) - prev;
    tax += slice * bracket.rate;
    prev = ceiling;
    if (bracket.upTo === null) break;
  }
  return round2(tax);
}

export function computeIR(
  monthlyGross: number,
  pensionEmployeeContrib: number,
  pensionCredit: number,
  creditPointsTotal: number,
  p: SalariedYearParams
): IRResult {
  const taxable = Math.max(0, monthlyGross - pensionEmployeeContrib);
  const bracketTax = computeBracketTax(taxable, p);
  const surtax =
    taxable > p.incomeTax.surtaxThresholdMonthly
      ? round2((taxable - p.incomeTax.surtaxThresholdMonthly) * p.incomeTax.surtaxRate)
      : 0;
  const creditPointsValue = round2((creditPointsTotal * p.creditPointValue) / 12);
  const netTax = Math.max(0, round2(bracketTax + surtax - creditPointsValue - pensionCredit));
  return {
    taxableIncome: taxable,
    bracketTax,
    surtax,
    creditPoints: creditPointsTotal,
    creditPointsValue,
    pensionCredit,
    netTax,
  };
}
