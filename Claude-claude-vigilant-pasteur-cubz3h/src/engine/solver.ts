import type { YearParams } from './params/types';
import type { BituachLeumiResult } from './types';
import { computeBituachLeumi } from './bituachLeumi';

/**
 * Solveur de la circularité ביטוח לאומי ↔ revenu imposable.
 *
 * CHOIX D'ASSIETTE DOCUMENTÉ :
 * L'assiette ביטוח לאומי d'un עצמאי est le bénéfice net après les ניכויים
 * pension (§47) et keren hishtalmout, mais SANS la déduction des 52 % de BL
 * elle-même (le ביטוח לאומי réintègre cette déduction dans son assiette).
 * Avec ce choix, le point fixe converge dès la 2e itération ; le solveur
 * générique (point fixe, tolérance 1 ₪, max 20 itérations) reste en place
 * pour couvrir toute variante d'assiette dépendant du BL payé
 * (`baseFromBL`), et sécuriser les évolutions futures des règles.
 */
export interface SolverOutcome {
  bl: BituachLeumiResult;
  iterations: number;
  converged: boolean;
}

export const BL_SOLVER_TOLERANCE = 1; // ₪
export const BL_SOLVER_MAX_ITERATIONS = 20;

export function solveBituachLeumi(
  /** Assiette BTL en fonction du BL total payé à l'itération précédente. */
  baseFromBL: (blTotal: number) => number,
  p: YearParams
): SolverOutcome {
  let blTotal = 0;
  let result = computeBituachLeumi(baseFromBL(0), p);
  let iterations = 0;
  let converged = false;

  while (iterations < BL_SOLVER_MAX_ITERATIONS) {
    iterations++;
    result = computeBituachLeumi(baseFromBL(blTotal), p);
    if (Math.abs(result.total - blTotal) < BL_SOLVER_TOLERANCE) {
      converged = true;
      break;
    }
    blTotal = result.total;
  }

  return { bl: result, iterations, converged };
}
