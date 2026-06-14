import type { YearParams } from './params/types';
import type { PensionDeductionResult } from './types';

/**
 * Avantages fiscaux d'un dépôt pension pour un עצמאי.
 *
 * Ordre d'imputation retenu (pratique usuelle עמית מוטב) :
 * 1. Le dépôt est d'abord imputé au ניכוי (§47) : déductible jusqu'à
 *    nikkuyRate (11 %) de la הכנסה מזכה plafonnée.
 * 2. Le solde est imputé au זיכוי (§45א) : crédit de 35 % du dépôt, dans la
 *    limite de zikuyDepositRate (5,5 %, ou 6 % sans assurance אכ"ע) de la
 *    הכנסה מזכה plafonnée.
 */
export function computePensionBenefits(
  deposit: number,
  netProfit: number,
  hasDisabilityInsurance: boolean,
  p: YearParams
): PensionDeductionResult {
  const qualifyingIncome = Math.min(Math.max(0, netProfit), p.pension.qualifyingIncomeCeiling);

  const nikkuyCap = p.pension.nikkuyRate * qualifyingIncome;
  const zikuyDepositRate =
    p.pension.zikuyDepositRate +
    (hasDisabilityInsurance ? 0 : p.pension.zikuyDepositRateExtraNoDisability);
  const zikuyBaseCap = zikuyDepositRate * qualifyingIncome;

  const safeDeposit = Math.max(0, deposit);
  const nikkuy = Math.min(safeDeposit, nikkuyCap);
  const zikuyBase = Math.min(Math.max(safeDeposit - nikkuy, 0), zikuyBaseCap);
  const zikuy = zikuyBase * p.pension.zikuyCreditRate;

  return { deposit: safeDeposit, nikkuy, zikuyBase, zikuy, nikkuyCap, zikuyBaseCap };
}

/** Minimum légal de פנסיית חובה לעצמאים. */
export function mandatoryPensionMinimum(netProfit: number, p: YearParams): number {
  const m = p.pension.mandatory;
  const income = Math.max(0, netProfit);
  const lowerSlice = Math.min(income, m.lowerCeiling);
  const upperSlice = Math.min(Math.max(income - m.lowerCeiling, 0), m.upperCeiling - m.lowerCeiling);
  return lowerSlice * m.lowerRate + upperSlice * m.upperRate;
}

/**
 * Dépôt pension "optimisé" : épuise le plafond du ניכוי (11 %) puis celui du
 * זיכוי (5,5 %/6 %) — au-delà, plus aucun avantage fiscal à l'entrée.
 */
export function optimizedPensionDeposit(
  netProfit: number,
  hasDisabilityInsurance: boolean,
  p: YearParams
): number {
  const qualifyingIncome = Math.min(Math.max(0, netProfit), p.pension.qualifyingIncomeCeiling);
  const zikuyDepositRate =
    p.pension.zikuyDepositRate +
    (hasDisabilityInsurance ? 0 : p.pension.zikuyDepositRateExtraNoDisability);
  return (p.pension.nikkuyRate + zikuyDepositRate) * qualifyingIncome;
}
