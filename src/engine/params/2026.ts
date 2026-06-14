import type { SalariedYearParams } from './types';

export const params2026: SalariedYearParams = {
  year: 2026,
  creditPointValue: 2904,

  incomeTax: {
    brackets: [
      { upTo: 7_010,  rate: 0.10 },
      { upTo: 10_060, rate: 0.14 },
      { upTo: 19_000, rate: 0.20 },
      { upTo: 25_100, rate: 0.31 },
      { upTo: 46_690, rate: 0.35 },
      { upTo: null,   rate: 0.47 },
    ],
    surtaxThresholdMonthly: 60_130,
    surtaxRate: 0.03,
  },

  bituachLeumi: {
    reducedMonthlyCeiling: 7_703,
    maxMonthlyIncome: 51_910,
    employee: {
      reduced: { leumi: 0.0104, health: 0.0323 },
      full:    { leumi: 0.0700, health: 0.0517 },
    },
    employer: {
      reduced: 0.0451,
      full:    0.0760,
    },
  },

  pension: {
    qualifyingMonthlyCeiling: 9_400,
    employeeZikuyRate: 0.35,
    employeeZikuyContribRate: 0.07,
  },

  kerenHishtalmout: {
    employerExemptMonthlyCeiling: 15_712,
    employerExemptRate: 0.075,
    employeeExemptMonthlyCeiling: 15_712,
    employeeExemptRate: 0.025,
  },

  indirectCosts: {
    havaraValuePerDay: 484,
    havaraDays: [
      { upToYears: 5,    days: 10 },
      { upToYears: 10,   days: 11 },
      { upToYears: null, days: 12 },
    ],
    holidayDays: [
      { upToYears: 4,    days: 12 },
      { upToYears: 8,    days: 14 },
      { upToYears: null, days: 20 },
    ],
    publicHolidayDays: 9,
    workingDaysPerYear: 250,
  },

  creditPoints: {
    residentBase: 2.25,
    womanExtra: 0.5,
    spouseNoIncome: 1,
    mezonot: 1,
    academicDegree: 1,
    dischargedSoldier: 2,
    children: {
      age0: 1.5,
      age1: 1.5,
      age2: 4.5,
      age3: 4.5,
      age4to5: 2.5,
      age6to17: 2.0,
      age18: 1.0,
    },
    olehScalePost2022: [
      { fromMonth: 1,   toMonth: 12,  pointsPerMonth: 3 / 12 },
      { fromMonth: 13,  toMonth: 24,  pointsPerMonth: 2 / 12 },
      { fromMonth: 25,  toMonth: 36,  pointsPerMonth: 1 / 12 },
      { fromMonth: 37,  toMonth: 48,  pointsPerMonth: 0.5 / 12 },
    ],
    olehScalePre2022: [
      { fromMonth: 1,   toMonth: 18,  pointsPerMonth: 3 / 12 },
      { fromMonth: 19,  toMonth: 30,  pointsPerMonth: 2 / 12 },
      { fromMonth: 31,  toMonth: 42,  pointsPerMonth: 1 / 12 },
    ],
  },

  validationNotes: [
    'BL 2026: taux employee reduit (leumi 1.04%, sante 3.23%) — A VALIDER circulaire BL 2026',
    'BL 2026: taux employee plein (leumi 7.00%, sante 5.17%) — A VALIDER',
    'BL 2026: taux employeur reduit 4.51%, plein 7.60% — A VALIDER',
    'BL 2026: plafond reduit 7,703 ILS/mois — A VALIDER',
    'BL 2026: plafond max 51,910 ILS/mois — A VALIDER',
    'Pension: hakhnasa mezaka plafond 9,400 ILS/mois — A VALIDER',
    'Keren Hishtalmout: plafond exoneration 15,712 ILS/mois — A VALIDER',
    'Surtax: seuil mensuel 60,130 ILS — A VALIDER',
    'Havara: 484 ILS/jour secteur prive 2026 — A VALIDER',
  ],
};
