import type { YearParams } from './params/types';
import type {
  ScenarioResult,
  SimulationInput,
  SimulationResult,
} from './types';
import { computeCreditPoints, totalPoints } from './creditPoints';
import { computeBracketTax, computeSurtax, marginalRate } from './incomeTax';
import { kerenNikkuy, optimalKerenDeposit } from './kerenHishtalmout';
import {
  computePensionBenefits,
  mandatoryPensionMinimum,
  optimizedPensionDeposit,
} from './pension';
import { solveBituachLeumi } from './solver';

/** Arrondi du taux de מקדמות au 0,1 % supérieur. */
export function roundMikdamotRate(netTax: number, revenue: number): number {
  if (revenue <= 0 || netTax <= 0) return 0;
  return Math.ceil((netTax / revenue) * 1000) / 10; // en %
}

/**
 * Calcule un scénario complet pour des dépôts pension/keren donnés.
 *
 * Ordre des déductions (documenté) :
 * 1. ניכוי pension (§47) et keren — déduits du bénéfice → assiette ביטוח לאומי ;
 * 2. ביטוח לאומי via le solveur point fixe (voir solver.ts) ;
 * 3. revenu imposable IR = bénéfice − part déductible des דמי ביטוח לאומי
 *    (52 %, hors דמי בריאות) − ניכוי pension − ניכוי keren ;
 * 4. impôt brut (barème + מס יסף) ;
 * 5. crédits : נקודות זיכוי × valeur du point + זיכוי pension (35 %),
 *    avec plancher à 0 (pas d'impôt négatif).
 */
export function computeScenario(
  input: SimulationInput,
  p: YearParams,
  pensionDeposit: number,
  kerenDeposit: number,
  label: string
): ScenarioResult {
  const pension = computePensionBenefits(
    pensionDeposit,
    input.netProfit,
    input.hasDisabilityInsurance,
    p
  );
  const kNikkuy = kerenNikkuy(kerenDeposit, input.netProfit, p);

  // Assiette BTL : bénéfice − ניכויים pension/keren. Elle ne dépend pas du BL
  // payé, mais le solveur générique gère le cas général (cf. solver.ts).
  const { bl, iterations } = solveBituachLeumi(
    () => input.netProfit - pension.nikkuy - kNikkuy,
    p
  );

  const taxableIncome = Math.max(
    0,
    input.netProfit - p.bituachLeumi.deductibleShare * bl.leumi - pension.nikkuy - kNikkuy
  );

  const bracketTax = computeBracketTax(taxableIncome, p);
  const surtax = computeSurtax(taxableIncome, p);
  const grossTax = bracketTax + surtax;

  const creditPointLines = computeCreditPoints(input, p);
  const points = totalPoints(creditPointLines);
  const pointsCredit = points * p.creditPointValue;

  const netTax = Math.max(0, grossTax - pointsCredit - pension.zikuy);
  // Le zikouy effectivement imputé (peut être tronqué par le plancher 0).
  const pensionZikuy = Math.min(pension.zikuy, Math.max(0, grossTax - pointsCredit));

  return {
    label,
    pensionDeposit: pension.deposit,
    kerenDeposit: Math.max(0, kerenDeposit),
    kerenNikkuy: kNikkuy,
    pension,
    bituachLeumi: bl,
    taxableIncome,
    grossTax,
    surtax,
    creditPointLines,
    totalPoints: points,
    pointsCredit,
    pensionZikuy,
    netTax,
    mikdamotRate: roundMikdamotRate(netTax, input.revenue),
    marginalRate: marginalRate(taxableIncome, p),
    netDisposable:
      input.netProfit - netTax - bl.total - pension.deposit - Math.max(0, kerenDeposit),
    solverIterations: iterations,
  };
}

/** Charge totale (IR + ביטוח לאומי) d'un scénario — base des comparatifs. */
function totalLevies(s: ScenarioResult): number {
  return s.netTax + s.bituachLeumi.total;
}

export function simulate(input: SimulationInput, p: YearParams): SimulationResult {
  const baseline = computeScenario(
    input,
    p,
    input.pensionDeposit,
    input.kerenDeposit,
    'Sans optimisation (dépôts actuels)'
  );

  const optPension = optimizedPensionDeposit(input.netProfit, input.hasDisabilityInsurance, p);
  const optKeren = optimalKerenDeposit(input.netProfit, p);

  const optimized = computeScenario(input, p, optPension, optKeren, 'Avec optimisation');

  // Gains isolés : on n'optimise qu'un levier à la fois pour chiffrer chacun.
  const pensionOnly = computeScenario(input, p, optPension, input.kerenDeposit, 'pension seule');
  const kerenOnly = computeScenario(input, p, input.pensionDeposit, optKeren, 'keren seule');

  return {
    input,
    year: p.year,
    baseline,
    optimized,
    pensionReco: {
      mandatoryMinimum: mandatoryPensionMinimum(input.netProfit, p),
      optimizedDeposit: optPension,
      taxSavingVsCurrent: Math.max(0, totalLevies(baseline) - totalLevies(pensionOnly)),
    },
    kerenReco: {
      optimalDeductibleDeposit: optKeren,
      taxSavingVsCurrent: Math.max(0, totalLevies(baseline) - totalLevies(kerenOnly)),
      exemptDepositCeiling: p.kerenHishtalmut.exemptDepositCeiling,
    },
    validationNotes: p.validationNotes,
  };
}
