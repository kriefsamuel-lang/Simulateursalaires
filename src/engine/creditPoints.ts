import type { SalariedYearParams } from './params/types';
import type { PersonalInfo, CreditPointLine } from './types';

function getChildAge(birthYear: number, fiscalYear: number): number {
  return fiscalYear - birthYear;
}

function childPoints(age: number, p: SalariedYearParams): number {
  const c = p.creditPoints.children;
  if (age === 0) return c.age0;
  if (age === 1) return c.age1;
  if (age === 2) return c.age2;
  if (age === 3) return c.age3;
  if (age === 4 || age === 5) return c.age4to5;
  if (age >= 6 && age <= 17) return c.age6to17;
  if (age === 18) return c.age18;
  return 0;
}

function computeOlehPoints(aliyahDate: string, fiscalYear: number, p: SalariedYearParams): number {
  const aliyah = new Date(aliyahDate);
  const isPost2022 = aliyah.getFullYear() >= 2022;
  const scale = isPost2022 ? p.creditPoints.olehScalePost2022 : p.creditPoints.olehScalePre2022;

  let totalPoints = 0;
  for (let month = 0; month < 12; month++) {
    const monthDate = new Date(fiscalYear, month, 1);
    if (monthDate < aliyah) continue;
    const monthsElapsed = Math.floor((monthDate.getTime() - aliyah.getTime()) / (1000 * 60 * 60 * 24 * 30.44)) + 1;
    for (const band of scale) {
      if (monthsElapsed >= band.fromMonth && monthsElapsed <= band.toMonth) {
        totalPoints += band.pointsPerMonth;
        break;
      }
    }
  }
  return Math.round(totalPoints * 100) / 100;
}

export function computeCreditPoints(
  personal: PersonalInfo,
  fiscalYear: number,
  p: SalariedYearParams
): CreditPointLine[] {
  const lines: CreditPointLine[] = [];

  const base = personal.gender === 'F'
    ? p.creditPoints.residentBase + p.creditPoints.womanExtra
    : p.creditPoints.residentBase;
  lines.push({
    label: personal.gender === 'F' ? 'Residente (femme)' : 'Resident',
    points: base,
  });

  if (personal.maritalStatus === 'married' && personal.spouseNoIncome) {
    lines.push({ label: 'Conjoint(e) sans revenu', points: p.creditPoints.spouseNoIncome });
  }

  if (personal.paysMezonot) {
    lines.push({ label: 'Mezonot', points: p.creditPoints.mezonot });
  }

  if (personal.hasAcademicDegree) {
    lines.push({ label: 'Diplome academique', points: p.creditPoints.academicDegree });
  }

  if (personal.isDischargedSoldier) {
    lines.push({ label: 'Soldat libere', points: p.creditPoints.dischargedSoldier });
  }

  for (const child of personal.children) {
    if (!child.claiming) continue;
    const age = getChildAge(child.birthYear, fiscalYear);
    const pts = childPoints(age, p);
    if (pts > 0) {
      lines.push({ label: `Enfant ne ${child.birthYear} (${age} ans)`, points: pts });
    }
  }

  if (personal.aliyahDate) {
    const olehPoints = computeOlehPoints(personal.aliyahDate, fiscalYear, p);
    if (olehPoints > 0) {
      lines.push({ label: 'Oleh hadash / Oleh', points: olehPoints });
    }
  }

  return lines;
}
