export { params2025 } from './2025';
export { params2026 } from './2026';
export type { SalariedYearParams, TaxBracket, OlehBand } from './types';

import { params2025 } from './2025';
import { params2026 } from './2026';
import type { SalariedYearParams } from './types';

export function getParams(year: 2025 | 2026): SalariedYearParams {
  if (year === 2025) return params2025;
  return params2026;
}
