import type { SimulationInput } from './types';

/** Validation des entrées — renvoie la liste des erreurs (vide si OK). */
export function validateInput(input: SimulationInput): string[] {
  const errors: string[] = [];

  if (!(input.revenue > 0)) {
    errors.push('Le chiffre d’affaires annuel doit être supérieur à 0.');
  }
  if (input.netProfit < 0) {
    errors.push('Le bénéfice net ne peut pas être négatif.');
  }
  if (input.netProfit > input.revenue) {
    errors.push('Le bénéfice net ne peut pas dépasser le chiffre d’affaires.');
  }

  const birth = new Date(input.birthDate);
  if (!input.birthDate || Number.isNaN(birth.getTime())) {
    errors.push('Date de naissance invalide.');
  } else {
    const birthYear = birth.getFullYear();
    if (birthYear > input.taxYear - 16) {
      errors.push('Le contribuable doit avoir au moins 16 ans pendant l’année fiscale.');
    }
    if (birthYear < 1900) {
      errors.push('Date de naissance incohérente.');
    }
  }

  if (input.aliyahDate) {
    const aliyah = new Date(input.aliyahDate);
    if (Number.isNaN(aliyah.getTime())) {
      errors.push('Date d’alyah invalide.');
    } else {
      if (!Number.isNaN(birth.getTime()) && aliyah < birth) {
        errors.push('La date d’alyah ne peut pas précéder la date de naissance.');
      }
      if (aliyah.getFullYear() > input.taxYear) {
        errors.push(`La date d’alyah est postérieure à l’année fiscale ${input.taxYear}.`);
      }
    }
  }

  for (const [i, child] of input.children.entries()) {
    if (!Number.isInteger(child.birthYear) || child.birthYear < 1980 || child.birthYear > input.taxYear) {
      errors.push(`Enfant ${i + 1} : année de naissance invalide (entre 1980 et ${input.taxYear}).`);
    }
  }

  if (input.pensionDeposit < 0) errors.push('La cotisation pension ne peut pas être négative.');
  if (input.kerenDeposit < 0) errors.push('La cotisation keren hishtalmout ne peut pas être négative.');

  return errors;
}
