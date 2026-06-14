import type { SalarieInput } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateInput(input: SalarieInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (input.salaryInput <= 0) {
    errors.push({ field: 'salaryInput', message: 'Le salaire doit etre superieur a 0' });
  }

  if (input.employmentRate <= 0 || input.employmentRate > 1) {
    errors.push({ field: 'employmentRate', message: 'Le taux d\'emploi doit etre entre 10% et 100%' });
  }

  if (input.personal.birthYear < 1930 || input.personal.birthYear > 2010) {
    errors.push({ field: 'birthYear', message: 'Annee de naissance invalide' });
  }

  if (input.pension.employeeTagmoulimRate < 0 || input.pension.employeeTagmoulimRate > 0.20) {
    errors.push({ field: 'pension.employeeTagmoulimRate', message: 'Taux pension employe invalide' });
  }

  return errors;
}
