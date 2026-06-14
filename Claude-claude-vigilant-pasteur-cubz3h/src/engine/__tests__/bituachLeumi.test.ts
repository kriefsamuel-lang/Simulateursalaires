import { describe, expect, it } from 'vitest';
import { computeBituachLeumi } from '../bituachLeumi';
import { getParams } from '../params';

const p = getParams(2026);
const bl = p.bituachLeumi;

describe('ביטוח לאומי עצמאי 2026', () => {
  it('revenu entièrement dans la tranche réduite', () => {
    const annual = 60_000; // 5 000 ₪/mois < 7 703
    const r = computeBituachLeumi(annual, p);
    expect(r.leumi).toBeCloseTo(annual * bl.reduced.leumi, 2);
    expect(r.health).toBeCloseTo(annual * bl.reduced.health, 2);
  });

  it('revenu sur les deux medragot', () => {
    const annual = 240_000; // 20 000 ₪/mois
    const r = computeBituachLeumi(annual, p);
    const reducedAnnual = bl.reducedMonthlyCeiling * 12;
    const fullAnnual = annual - reducedAnnual;
    expect(r.leumi).toBeCloseTo(
      reducedAnnual * bl.reduced.leumi + fullAnnual * bl.full.leumi,
      2
    );
    expect(r.health).toBeCloseTo(
      reducedAnnual * bl.reduced.health + fullAnnual * bl.full.health,
      2
    );
  });

  it('plafonnement au revenu maximal assujetti', () => {
    const atCap = computeBituachLeumi(bl.maxMonthlyIncome * 12, p);
    const aboveCap = computeBituachLeumi(bl.maxMonthlyIncome * 12 + 500_000, p);
    expect(aboveCap.total).toBeCloseTo(atCap.total, 2);
  });

  it('mikdama mensuelle = total ÷ 12 arrondi', () => {
    const r = computeBituachLeumi(240_000, p);
    expect(r.monthlyAdvance).toBe(Math.round(r.total / 12));
  });

  it('assiette négative → 0', () => {
    expect(computeBituachLeumi(-50_000, p).total).toBe(0);
  });
});
