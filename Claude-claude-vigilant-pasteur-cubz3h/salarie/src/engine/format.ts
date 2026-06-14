const fmt = new Intl.NumberFormat('fr-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return fmt.format(Math.round(amount));
}

export function formatPercent(rate: number, decimals = 1): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}

export function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
