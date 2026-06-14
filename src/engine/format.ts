/** Formatage des montants et pourcentages — locale fr-IL (séparateurs français, shekel). */

const nisFormatter = new Intl.NumberFormat('fr-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('fr-IL', { maximumFractionDigits: 2 });

/**
 * Remplace les espaces fines insécables (U+202F/U+00A0) produites par la
 * locale française par des espaces normales : certaines polices PDF n'ont
 * pas de glyphe pour U+202F.
 */
function normalizeSpaces(s: string): string {
  return s.replace(/[  ]/g, ' ');
}

export function fmtNIS(amount: number): string {
  return normalizeSpaces(nisFormatter.format(Math.round(amount)));
}

export function fmtNumber(n: number): string {
  return normalizeSpaces(numberFormatter.format(n));
}

export function fmtPercent(p: number, decimals = 1): string {
  return `${p.toFixed(decimals).replace('.', ',')} %`;
}

export function fmtPoints(points: number): string {
  return normalizeSpaces(numberFormatter.format(Math.round(points * 100) / 100));
}
