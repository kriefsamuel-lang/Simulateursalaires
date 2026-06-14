import type { YearParams } from './params/types';
import type { BituachLeumiResult } from './types';

/**
 * Cotisations ביטוח לאומי d'un עצמאי sur une assiette annuelle.
 *
 * Le calcul est mensuel (medragot mensuelles) : assiette annuelle ÷ 12,
 * tranche réduite jusqu'au plafond réduit, tranche pleine jusqu'au plafond
 * maximal, puis ré-annualisation.
 */
export function computeBituachLeumi(annualBase: number, p: YearParams): BituachLeumiResult {
  const bl = p.bituachLeumi;
  const monthlyBase = Math.max(0, annualBase) / 12;

  const reducedPart = Math.min(monthlyBase, bl.reducedMonthlyCeiling);
  const fullPart = Math.min(
    Math.max(monthlyBase - bl.reducedMonthlyCeiling, 0),
    bl.maxMonthlyIncome - bl.reducedMonthlyCeiling
  );

  const leumi = 12 * (reducedPart * bl.reduced.leumi + fullPart * bl.full.leumi);
  const health = 12 * (reducedPart * bl.reduced.health + fullPart * bl.full.health);
  const total = leumi + health;

  return {
    base: Math.max(0, annualBase),
    leumi,
    health,
    total,
    monthlyAdvance: Math.round(total / 12),
  };
}
