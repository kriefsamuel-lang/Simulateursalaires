import { describe, expect, it } from 'vitest';
import { getParams } from '../params';
import {
  computePensionBenefits,
  mandatoryPensionMinimum,
  optimizedPensionDeposit,
} from '../pension';
import { kerenNikkuy, optimalKerenDeposit } from '../kerenHishtalmout';

const p = getParams(2026);

describe('plafonds pension', () => {
  it('ניכוי plafonné à 11 % de la הכנסה מזכה', () => {
    const r = computePensionBenefits(100_000, 500_000, true, p);
    expect(r.nikkuy).toBeCloseTo(0.11 * p.pension.qualifyingIncomeCeiling, 2); // 25 608
  });

  it('זיכוי plafonné à 5,5 % → dépôt zikouy max 12 804 ₪', () => {
    const r = computePensionBenefits(100_000, 500_000, true, p);
    expect(r.zikuyBaseCap).toBeCloseTo(0.055 * p.pension.qualifyingIncomeCeiling, 2); // 12 804
    expect(r.zikuy).toBeCloseTo(12_804 * 0.35, 0);
  });

  it('sans assurance אכ"ע : taux zikouy 6 %', () => {
    const r = computePensionBenefits(100_000, 500_000, false, p);
    expect(r.zikuyBaseCap).toBeCloseTo(0.06 * p.pension.qualifyingIncomeCeiling, 2);
  });

  it('dépôt sous le plafond ניכוי : tout en ניכוי, rien en זיכוי', () => {
    const r = computePensionBenefits(10_000, 250_000, true, p);
    expect(r.nikkuy).toBe(10_000);
    expect(r.zikuy).toBe(0);
  });

  it('revenu sous la הכנסה מזכה : plafonds proportionnels au revenu', () => {
    const r = computePensionBenefits(50_000, 100_000, true, p);
    expect(r.nikkuyCap).toBeCloseTo(11_000, 2);
    expect(r.zikuyBaseCap).toBeCloseTo(5_500, 2);
  });

  it('dépôt optimisé = 16,5 % de la הכנסה מזכה plafonnée', () => {
    expect(optimizedPensionDeposit(500_000, true, p)).toBeCloseTo(
      0.165 * p.pension.qualifyingIncomeCeiling,
      2
    );
  });
});

describe('פנסיית חובה — minimum légal', () => {
  it('4,45 % sous la moitié du salaire moyen', () => {
    expect(mandatoryPensionMinimum(60_000, p)).toBeCloseTo(60_000 * 0.0445, 2);
  });

  it('12,55 % sur la tranche supérieure', () => {
    const m = p.pension.mandatory;
    const expected = m.lowerCeiling * m.lowerRate + (120_000 - m.lowerCeiling) * m.upperRate;
    expect(mandatoryPensionMinimum(120_000, p)).toBeCloseTo(expected, 2);
  });

  it('plafonné au-delà du salaire moyen (~14 044 ₪ en 2026)', () => {
    const m = p.pension.mandatory;
    const cap = m.lowerCeiling * m.lowerRate + (m.upperCeiling - m.lowerCeiling) * m.upperRate;
    expect(mandatoryPensionMinimum(1_000_000, p)).toBeCloseTo(cap, 2);
    expect(cap).toBeGreaterThan(14_000);
    expect(cap).toBeLessThan(14_100);
  });
});

describe('plafonds keren hishtalmout', () => {
  it('ניכוי = 4,5 % du bénéfice sous le plafond', () => {
    expect(kerenNikkuy(20_000, 200_000, p)).toBeCloseTo(9_000, 2);
  });

  it('plafond absolu 13 203 ₪ (revenu ≥ 293 397)', () => {
    expect(optimalKerenDeposit(500_000, p)).toBeCloseTo(13_202.865, 2);
    expect(kerenNikkuy(20_000, 500_000, p)).toBeCloseTo(13_202.865, 2);
  });

  it('dépôt inférieur au plafond : déductible en totalité', () => {
    expect(kerenNikkuy(5_000, 200_000, p)).toBe(5_000);
  });
});
