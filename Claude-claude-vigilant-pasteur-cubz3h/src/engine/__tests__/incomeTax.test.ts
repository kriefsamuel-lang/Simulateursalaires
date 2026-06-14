import { describe, expect, it } from 'vitest';
import { computeBracketTax, computeGrossTax, computeSurtax, marginalRate } from '../incomeTax';
import { getParams } from '../params';

const p26 = getParams(2026);
const p25 = getParams(2025);

describe('barème IR 2026 — chaque tranche', () => {
  it('tranche 10 % : revenu entièrement dans la première tranche', () => {
    expect(computeBracketTax(50_000, p26)).toBeCloseTo(5_000, 2);
  });

  it('borne exacte de la tranche 10 % (84 120)', () => {
    expect(computeBracketTax(84_120, p26)).toBeCloseTo(8_412, 2);
  });

  it('tranche 14 % : 100 000 ₪', () => {
    // 84 120×10 % + 15 880×14 %
    expect(computeBracketTax(100_000, p26)).toBeCloseTo(8_412 + 15_880 * 0.14, 2);
  });

  it('tranche 20 % élargie 2026 : 228 000 ₪', () => {
    const expected = 84_120 * 0.1 + (120_720 - 84_120) * 0.14 + (228_000 - 120_720) * 0.2;
    expect(computeBracketTax(228_000, p26)).toBeCloseTo(expected, 2);
  });

  it('tranche 31 % : 301 200 ₪', () => {
    const at228k = computeBracketTax(228_000, p26);
    expect(computeBracketTax(301_200, p26)).toBeCloseTo(at228k + (301_200 - 228_000) * 0.31, 2);
  });

  it('tranche 35 % : 560 280 ₪', () => {
    const at301k = computeBracketTax(301_200, p26);
    expect(computeBracketTax(560_280, p26)).toBeCloseTo(at301k + (560_280 - 301_200) * 0.35, 2);
  });

  it('tranche 47 % : au-delà de 560 280 ₪', () => {
    const at560k = computeBracketTax(560_280, p26);
    expect(computeBracketTax(660_280, p26)).toBeCloseTo(at560k + 100_000 * 0.47, 2);
  });

  it('revenu nul ou négatif → impôt 0', () => {
    expect(computeBracketTax(0, p26)).toBe(0);
    expect(computeBracketTax(-10_000, p26)).toBe(0);
  });
});

describe('מס יסף', () => {
  it('pas de surtaxe sous le seuil', () => {
    expect(computeSurtax(721_560, p26)).toBe(0);
  });

  it('3 % au-delà de 721 560 ₪', () => {
    expect(computeSurtax(821_560, p26)).toBeCloseTo(3_000, 2);
    expect(computeGrossTax(821_560, p26)).toBeCloseTo(
      computeBracketTax(821_560, p26) + 3_000,
      2
    );
  });
});

describe('barème 2025 vs 2026 (élargissement des paliers)', () => {
  it('à 250 000 ₪, l’impôt 2026 est inférieur à 2025', () => {
    expect(computeBracketTax(250_000, p26)).toBeLessThan(computeBracketTax(250_000, p25));
  });

  it('2025 : tranche 20 % se termine à 193 800', () => {
    const expected = 84_120 * 0.1 + (120_720 - 84_120) * 0.14 + (193_800 - 120_720) * 0.2;
    expect(computeBracketTax(193_800, p25)).toBeCloseTo(expected, 2);
  });
});

describe('taux marginal', () => {
  it('détecte la bonne tranche', () => {
    expect(marginalRate(50_000, p26)).toBe(0.10);
    expect(marginalRate(100_000, p26)).toBe(0.14);
    expect(marginalRate(200_000, p26)).toBe(0.20);
    expect(marginalRate(250_000, p26)).toBe(0.31);
    expect(marginalRate(400_000, p26)).toBe(0.35);
    expect(marginalRate(600_000, p26)).toBe(0.47);
  });

  it('inclut le מס יסף au-delà du seuil', () => {
    expect(marginalRate(800_000, p26)).toBeCloseTo(0.5, 5);
  });
});
