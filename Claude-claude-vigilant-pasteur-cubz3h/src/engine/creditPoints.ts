import type { YearParams, OlehBand } from './params/types';
import type { CreditPointLine, SimulationInput } from './types';

/**
 * Points עולה חדש pour l'année fiscale simulée, au prorata mensuel.
 *
 * Le barème est exprimé en points acquis PAR MOIS depuis l'alyah (mois 1 =
 * mois de l'alyah). On somme les taux des mois du barème qui tombent dans
 * l'année fiscale simulée.
 */
export function computeOlehPoints(
  aliyahDate: string,
  taxYear: number,
  scalePost2022: OlehBand[],
  scalePre2022: OlehBand[]
): number {
  const d = new Date(aliyahDate);
  if (Number.isNaN(d.getTime())) return 0;
  const aliyahYear = d.getFullYear();
  const aliyahMonth = d.getMonth(); // 0..11

  const scale = aliyahYear >= 2022 ? scalePost2022 : scalePre2022;

  let points = 0;
  for (let m = 0; m < 12; m++) {
    // Index du mois calendaire (taxYear, m) depuis l'alyah, base 1.
    const idx = (taxYear - aliyahYear) * 12 + (m - aliyahMonth) + 1;
    const band = scale.find((b) => idx >= b.fromMonth && idx <= b.toMonth);
    if (band) points += band.pointsPerMonth;
  }
  return points;
}

/** Points pour un enfant selon l'âge atteint pendant l'année fiscale. */
export function childPoints(birthYear: number, taxYear: number, p: YearParams): number {
  const age = taxYear - birthYear;
  const c = p.creditPoints.children;
  if (age < 0 || age > 18) return 0;
  if (age === 0) return c.age0;
  if (age === 1) return c.age1;
  if (age === 2) return c.age2;
  if (age === 3) return c.age3;
  if (age <= 5) return c.age4to5;
  if (age <= 17) return c.age6to17;
  return c.age18;
}

/**
 * Détail ligne par ligne des נקודות זיכוי du contribuable.
 * Chaque ligne porte un libellé justificatif affichable au client.
 */
export function computeCreditPoints(input: SimulationInput, p: YearParams): CreditPointLine[] {
  const cp = p.creditPoints;
  const lines: CreditPointLine[] = [];

  lines.push({
    label: `Résident israélien (תושב ישראל${input.sex === 'femme' ? 'ת' : ''})`,
    points: cp.residentBase,
  });
  if (input.sex === 'femme') {
    lines.push({ label: 'Femme (אישה)', points: cp.womanExtra });
  }

  if (input.maritalStatus === 'marie' && input.spouseNoIncome) {
    lines.push({
      label: 'Conjoint sans revenu (זיכוי בעד בן זוג — §37, conditions restrictives)',
      points: cp.spouseNoIncome,
    });
  }

  for (const [i, child] of input.children.entries()) {
    if (child.claimedBy !== 'moi') continue;
    const pts = childPoints(child.birthYear, input.taxYear, p);
    if (pts <= 0) continue;
    const age = input.taxYear - child.birthYear;
    lines.push({
      label: `Enfant ${i + 1} (né en ${child.birthYear}, ${age} an${age > 1 ? 's' : ''} en ${input.taxYear})`,
      points: pts,
    });
  }

  if (input.paysMezonot && input.maritalStatus === 'divorce') {
    lines.push({
      label: 'Pension alimentaire (מזונות — divorcé(e) remarié(e) payant à l’ex-conjoint)',
      points: cp.mezonot,
    });
  }

  if (input.aliyahDate) {
    const pts = computeOlehPoints(
      input.aliyahDate,
      input.taxYear,
      cp.olehScalePost2022,
      cp.olehScalePre2022
    );
    if (pts > 0) {
      lines.push({
        label: `עולה חדש (alyah ${new Date(input.aliyahDate).toLocaleDateString('fr-FR')}, prorata ${input.taxYear})`,
        points: pts,
      });
    }
  }

  if (input.recentAcademicDegree) {
    lines.push({ label: 'Diplôme académique récent (תואר אקדמי)', points: cp.academicDegree });
  }

  if (input.dischargedSoldier) {
    lines.push({ label: 'Soldat libéré (חייל משוחרר, 36 mois suivant la libération)', points: cp.dischargedSoldier });
  }

  return lines;
}

export function totalPoints(lines: CreditPointLine[]): number {
  return lines.reduce((s, l) => s + l.points, 0);
}
