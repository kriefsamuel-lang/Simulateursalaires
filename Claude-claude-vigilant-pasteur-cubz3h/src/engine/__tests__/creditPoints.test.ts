import { describe, expect, it } from 'vitest';
import { computeCreditPoints, computeOlehPoints, childPoints, totalPoints } from '../creditPoints';
import { getParams } from '../params';
import type { SimulationInput } from '../types';

const p = getParams(2026);

function baseInput(overrides: Partial<SimulationInput> = {}): SimulationInput {
  return {
    taxYear: 2026,
    clientName: 'Test',
    revenue: 400_000,
    netProfit: 250_000,
    birthDate: '1985-05-10',
    sex: 'homme',
    maritalStatus: 'celibataire',
    spouseNoIncome: false,
    children: [],
    paysMezonot: false,
    aliyahDate: null,
    recentAcademicDegree: false,
    dischargedSoldier: false,
    pensionDeposit: 0,
    kerenDeposit: 0,
    hasDisabilityInsurance: true,
    ...overrides,
  };
}

describe('points de base', () => {
  it('homme résident : 2,25 pts', () => {
    expect(totalPoints(computeCreditPoints(baseInput(), p))).toBeCloseTo(2.25, 5);
  });

  it('femme résidente : 2,75 pts', () => {
    expect(totalPoints(computeCreditPoints(baseInput({ sex: 'femme' }), p))).toBeCloseTo(2.75, 5);
  });
});

describe('cas marié + 3 enfants (réclamés par le contribuable)', () => {
  it('détaille les points par enfant selon l’âge', () => {
    const input = baseInput({
      maritalStatus: 'marie',
      children: [
        { birthYear: 2020, claimedBy: 'moi' }, // 6 ans → 1 pt
        { birthYear: 2023, claimedBy: 'moi' }, // 3 ans → 3,5 pts
        { birthYear: 2025, claimedBy: 'moi' }, // 1 an → 4,5 pts
      ],
    });
    const lines = computeCreditPoints(input, p);
    // 2,25 (base) + 1 + 3,5 + 4,5 = 11,25
    expect(totalPoints(lines)).toBeCloseTo(11.25, 5);
    expect(lines.filter((l) => l.label.startsWith('Enfant'))).toHaveLength(3);
  });

  it('un enfant réclamé par l’autre parent ne compte pas', () => {
    const input = baseInput({
      maritalStatus: 'marie',
      children: [
        { birthYear: 2023, claimedBy: 'autre_parent' },
        { birthYear: 2025, claimedBy: 'moi' },
      ],
    });
    expect(totalPoints(computeCreditPoints(input, p))).toBeCloseTo(2.25 + 4.5, 5);
  });

  it('conjoint sans revenu : +1 pt si marié', () => {
    const input = baseInput({ maritalStatus: 'marie', spouseNoIncome: true });
    expect(totalPoints(computeCreditPoints(input, p))).toBeCloseTo(3.25, 5);
  });

  it('barème enfant : bornes d’âge', () => {
    expect(childPoints(2026, 2026, p)).toBe(1.5); // année de naissance
    expect(childPoints(2024, 2026, p)).toBe(4.5); // 2 ans
    expect(childPoints(2021, 2026, p)).toBe(2.5); // 5 ans
    expect(childPoints(2009, 2026, p)).toBe(1);   // 17 ans
    expect(childPoints(2008, 2026, p)).toBe(0.5); // 18 ans
    expect(childPoints(2007, 2026, p)).toBe(0);   // 19 ans → rien
  });
});

describe('oleh hadash — prorata mensuel', () => {
  const post = p.creditPoints.olehScalePost2022;
  const pre = p.creditPoints.olehScalePre2022;

  it('année entière dans la bande 1/4 (alyah juillet 2024, année 2026)', () => {
    // Mois 19 à 30 depuis l'alyah → 12 × 1/4 = 3 pts
    expect(computeOlehPoints('2024-07-01', 2026, post, pre)).toBeCloseTo(3, 5);
  });

  it('à cheval sur deux bandes (alyah octobre 2023, année 2026)', () => {
    // Mois 28–30 à 1/4 (0,75) + mois 31–39 à 1/6 (1,5) = 2,25 pts
    expect(computeOlehPoints('2023-10-01', 2026, post, pre)).toBeCloseTo(2.25, 5);
  });

  it('première année d’alyah : 1/12 par mois', () => {
    // Alyah mars 2026 → mois 1 à 10 dans l'année 2026 → 10/12
    expect(computeOlehPoints('2026-03-15', 2026, post, pre)).toBeCloseTo(10 / 12, 5);
  });

  it('barème épuisé après 54 mois', () => {
    expect(computeOlehPoints('2021-01-01', 2026, post, pre)).toBe(0);
  });
});

describe('divorcé avec mezonot', () => {
  it('+1 pt pour le divorcé payant מזונות', () => {
    const input = baseInput({ maritalStatus: 'divorce', paysMezonot: true });
    expect(totalPoints(computeCreditPoints(input, p))).toBeCloseTo(3.25, 5);
  });

  it('pas de point mezonot si non divorcé', () => {
    const input = baseInput({ maritalStatus: 'marie', paysMezonot: true });
    expect(totalPoints(computeCreditPoints(input, p))).toBeCloseTo(2.25, 5);
  });
});
