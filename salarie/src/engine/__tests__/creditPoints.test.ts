import { describe, it, expect } from 'vitest';
import { computeCreditPoints } from '../creditPoints';
import { params2026 } from '../params/2026';
import type { PersonalInfo } from '../types';

const p = params2026;
const fiscalYear = 2026;

const basePersonal: PersonalInfo = {
  birthYear: 1985,
  gender: 'M',
  maritalStatus: 'single',
  spouseNoIncome: false,
  children: [],
  paysMezonot: false,
  aliyahDate: null,
  hasAcademicDegree: false,
  isDischargedSoldier: false,
};

describe('computeCreditPoints', () => {
  it('man base: 2.25 points', () => {
    const lines = computeCreditPoints(basePersonal, fiscalYear, p);
    const total = lines.reduce((s, l) => s + l.points, 0);
    expect(total).toBeCloseTo(2.25, 2);
  });

  it('woman base: 2.75 points', () => {
    const lines = computeCreditPoints({ ...basePersonal, gender: 'F' }, fiscalYear, p);
    const total = lines.reduce((s, l) => s + l.points, 0);
    expect(total).toBeCloseTo(2.75, 2);
  });

  it('married woman, no spouse income: 2.75 + 1 = 3.75', () => {
    const lines = computeCreditPoints(
      { ...basePersonal, gender: 'F', maritalStatus: 'married', spouseNoIncome: true },
      fiscalYear,
      p
    );
    const total = lines.reduce((s, l) => s + l.points, 0);
    expect(total).toBeCloseTo(3.75, 2);
  });

  it('child born same year as fiscal year (age 0): 1.5 pts', () => {
    const lines = computeCreditPoints(
      { ...basePersonal, children: [{ birthYear: 2026, claiming: true }] },
      fiscalYear,
      p
    );
    const childLine = lines.find(l => l.label.includes('2026'));
    expect(childLine?.points).toBe(1.5);
  });

  it('child age 2: 4.5 pts', () => {
    const lines = computeCreditPoints(
      { ...basePersonal, children: [{ birthYear: 2024, claiming: true }] },
      fiscalYear,
      p
    );
    const childLine = lines.find(l => l.label.includes('2024'));
    expect(childLine?.points).toBe(4.5);
  });

  it('oleh recent: gets prorata points', () => {
    const lines = computeCreditPoints(
      { ...basePersonal, aliyahDate: `${fiscalYear}-06-01` },
      fiscalYear,
      p
    );
    const olehLine = lines.find(l => l.label.includes('Oleh'));
    expect(olehLine).toBeDefined();
    expect(olehLine!.points).toBeGreaterThan(0);
  });

  it('non-claiming child: 0 pts', () => {
    const lines = computeCreditPoints(
      { ...basePersonal, children: [{ birthYear: 2020, claiming: false }] },
      fiscalYear,
      p
    );
    const total = lines.reduce((s, l) => s + l.points, 0);
    expect(total).toBeCloseTo(2.25, 2);
  });
});
