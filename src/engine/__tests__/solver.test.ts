import { describe, expect, it } from 'vitest';
import { getParams } from '../params';
import { solveBituachLeumi, BL_SOLVER_MAX_ITERATIONS } from '../solver';
import { computeScenario, roundMikdamotRate, simulate } from '../simulate';
import { computeBituachLeumi } from '../bituachLeumi';
import type { SimulationInput } from '../types';

const p = getParams(2026);

function input(overrides: Partial<SimulationInput> = {}): SimulationInput {
  return {
    taxYear: 2026,
    clientName: 'Test',
    revenue: 500_000,
    netProfit: 300_000,
    birthDate: '1980-01-01',
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

describe('solveur circulaire BL/IR', () => {
  it('assiette fixe : converge immédiatement vers le calcul direct', () => {
    const { bl, converged } = solveBituachLeumi(() => 300_000, p);
    expect(converged).toBe(true);
    expect(bl.total).toBeCloseTo(computeBituachLeumi(300_000, p).total, 2);
  });

  it('assiette dépendant du BL : point fixe à 1 ₪ près', () => {
    // Cas général : assiette = 300 000 − BL payé (circularité réelle).
    const { bl, converged, iterations } = solveBituachLeumi(
      (blTotal) => 300_000 - blTotal,
      p
    );
    expect(converged).toBe(true);
    expect(iterations).toBeLessThanOrEqual(BL_SOLVER_MAX_ITERATIONS);
    // Vérifie le point fixe : recalcul sur l'assiette finale ≈ BL trouvé.
    const recomputed = computeBituachLeumi(300_000 - bl.total, p);
    expect(Math.abs(recomputed.total - bl.total)).toBeLessThan(1);
  });

  it('le scénario complet est cohérent : revenu imposable = bénéfice − 52 % BL − ניכויים', () => {
    const s = computeScenario(input({ pensionDeposit: 20_000, kerenDeposit: 10_000 }), p, 20_000, 10_000, 'test');
    const expectedTaxable =
      300_000 - 0.52 * s.bituachLeumi.leumi - s.pension.nikkuy - s.kerenNikkuy;
    expect(s.taxableIncome).toBeCloseTo(expectedTaxable, 2);
  });

  it('seule la part דמי ביטוח לאומי (hors santé) est déduite à 52 %', () => {
    const s = computeScenario(input(), p, 0, 0, 'test');
    expect(s.taxableIncome).toBeCloseTo(300_000 - 0.52 * s.bituachLeumi.leumi, 2);
    expect(s.taxableIncome).toBeGreaterThan(300_000 - 0.52 * s.bituachLeumi.total);
  });
});

describe('simulation complète', () => {
  it('impôt net jamais négatif (petit revenu, beaucoup de points)', () => {
    const r = simulate(
      input({
        revenue: 80_000,
        netProfit: 50_000,
        sex: 'femme',
        maritalStatus: 'marie',
        children: [
          { birthYear: 2024, claimedBy: 'moi' },
          { birthYear: 2022, claimedBy: 'moi' },
        ],
      }),
      p
    );
    expect(r.baseline.netTax).toBe(0);
    expect(r.baseline.mikdamotRate).toBe(0);
  });

  it('l’optimisation réduit l’impôt + BL par rapport au scénario sans dépôts', () => {
    const r = simulate(input(), p);
    expect(r.optimized.netTax + r.optimized.bituachLeumi.total).toBeLessThan(
      r.baseline.netTax + r.baseline.bituachLeumi.total
    );
    expect(r.pensionReco.taxSavingVsCurrent).toBeGreaterThan(0);
    expect(r.kerenReco.taxSavingVsCurrent).toBeGreaterThan(0);
  });

  it('taux de מקדמות arrondi à 0,1 % supérieur', () => {
    expect(roundMikdamotRate(10_000, 500_000)).toBeCloseTo(2.0, 5);
    expect(roundMikdamotRate(10_001, 500_000), '2,0001 % → 2,1 %').toBeCloseTo(2.1, 5);
    expect(roundMikdamotRate(0, 500_000)).toBe(0);
  });
});
