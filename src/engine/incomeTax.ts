import type { YearParams } from './params/types';

/** Impôt brut au barème progressif annuel (hors מס יסף). */
export function computeBracketTax(taxableIncome: number, p: YearParams): number {
  let tax = 0;
  let lower = 0;
  const income = Math.max(0, taxableIncome);

  for (const bracket of p.incomeTax.brackets) {
    const upper = bracket.upTo ?? Infinity;
    if (income <= lower) break;
    const slice = Math.min(income, upper) - lower;
    tax += slice * bracket.rate;
    lower = upper;
  }
  return tax;
}

/** מס יסף : surtaxe au-delà du seuil annuel. */
export function computeSurtax(taxableIncome: number, p: YearParams): number {
  const excess = Math.max(0, taxableIncome - p.incomeTax.surtaxThreshold);
  return excess * p.incomeTax.surtaxRate;
}

/** Impôt brut total = barème + מס יסף. */
export function computeGrossTax(taxableIncome: number, p: YearParams): number {
  return computeBracketTax(taxableIncome, p) + computeSurtax(taxableIncome, p);
}

/** Taux marginal (barème + מס יסף le cas échéant) au niveau de revenu donné. */
export function marginalRate(taxableIncome: number, p: YearParams): number {
  const income = Math.max(0, taxableIncome);
  let lower = 0;
  let rate = 0;
  for (const bracket of p.incomeTax.brackets) {
    const upper = bracket.upTo ?? Infinity;
    if (income > lower || lower === 0) rate = bracket.rate;
    if (income <= upper) break;
    lower = upper;
  }
  if (income > p.incomeTax.surtaxThreshold) rate += p.incomeTax.surtaxRate;
  return rate;
}
