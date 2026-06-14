import type { YearParams } from './params/types';

/**
 * ניכוי keren hishtalmout d'un עצמאי : 4,5 % du bénéfice, plafonné par la
 * תקרת הכנסה קובעת (montant déposé au-delà : non déductible).
 */
export function kerenNikkuy(deposit: number, netProfit: number, p: YearParams): number {
  const cap =
    p.kerenHishtalmut.deductibleRate *
    Math.min(Math.max(0, netProfit), p.kerenHishtalmut.incomeCeiling);
  return Math.min(Math.max(0, deposit), cap);
}

/** Dépôt optimal déductible = min(4,5 % × bénéfice, plafond). */
export function optimalKerenDeposit(netProfit: number, p: YearParams): number {
  return (
    p.kerenHishtalmut.deductibleRate *
    Math.min(Math.max(0, netProfit), p.kerenHishtalmut.incomeCeiling)
  );
}
