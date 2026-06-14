import type { YearParams } from './types';
import params2025 from './2025';
import params2026 from './2026';

/**
 * Registre des années disponibles. Pour ajouter une année :
 * 1. copier 2026.ts → 2027.ts, mettre à jour chaque montant/taux,
 * 2. l'importer ici et l'ajouter au registre.
 * Rien d'autre à toucher : l'UI et le moteur lisent ce registre.
 */
export const PARAMS_BY_YEAR: Record<number, YearParams> = {
  2025: params2025,
  2026: params2026,
};

export const AVAILABLE_YEARS = Object.keys(PARAMS_BY_YEAR)
  .map(Number)
  .sort((a, b) => b - a);

export function getParams(year: number): YearParams {
  const p = PARAMS_BY_YEAR[year];
  if (!p) throw new Error(`Paramètres fiscaux indisponibles pour l'année ${year}`);
  return p;
}
