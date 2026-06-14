import type { YearParams } from './types';

/**
 * Paramètres fiscaux 2025 — שנת המס 2025
 *
 * Sources principales :
 * - ביטוח לאומי : תיקון 252 לחוק (14/01/2025) — relèvement des taux réduits
 *   עצמאי de 2,87 % → 4,47 % (BL) et 3,10 % → 3,235 % (santé), applicable
 *   à compter de février 2025. Le simulateur applique les taux post-תיקון
 *   sur l'année entière (simplification documentée — l'écart de janvier
 *   est marginal pour des מקדמות).
 * - Barème IR 2025 : paliers gelés au niveau 2024 (avant l'élargissement 2026).
 */
const params2025: YearParams = {
  year: 2025,

  // 242 ₪/mois × 12.
  creditPointValue: 2904,

  incomeTax: {
    brackets: [
      { upTo: 84_120, rate: 0.10 },   // jusqu'à 7 010 ₪/mois
      { upTo: 120_720, rate: 0.14 },  // jusqu'à 10 060 ₪/mois
      { upTo: 193_800, rate: 0.20 },  // jusqu'à 16 150 ₪/mois
      { upTo: 269_280, rate: 0.31 },  // jusqu'à 22 440 ₪/mois
      { upTo: 560_280, rate: 0.35 },
      { upTo: null, rate: 0.47 },
    ],
    surtaxThreshold: 721_560, // מס יסף
    surtaxRate: 0.03,
  },

  bituachLeumi: {
    // À VALIDER contre le חוזר ביטוח לאומי officiel 2025 (post-תיקון 252).
    reducedMonthlyCeiling: 7_522,  // 60 % du salaire moyen 2025
    maxMonthlyIncome: 50_695,      // plafond mensuel assujetti 2025
    reduced: { leumi: 0.0447, health: 0.03235 },
    full: { leumi: 0.1283, health: 0.05165 },
    deductibleShare: 0.52,
  },

  pension: {
    mandatory: {
      // Moitié du salaire moyen annuel 2025 — À VALIDER.
      lowerRate: 0.0445,
      lowerCeiling: 79_896,
      upperRate: 0.1255,
      upperCeiling: 159_792,
    },
    qualifyingIncomeCeiling: 232_800, // הכנסה מזכה 2025
    nikkuyRate: 0.11,
    zikuyDepositRate: 0.055,
    zikuyDepositRateExtraNoDisability: 0.005,
    zikuyCreditRate: 0.35,
  },

  kerenHishtalmut: {
    incomeCeiling: 293_397,        // → ניכוי max 13 203 ₪
    deductibleRate: 0.045,
    exemptDepositCeiling: 20_520,  // תקרה מוטבת 2025 — À VALIDER
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
      age1: 4.5,
      age2: 4.5,
      age3: 3.5,
      age4to5: 2.5,
      age6to17: 1,
      age18: 0.5, // À VALIDER
    },
    olehScalePost2022: [
      { fromMonth: 1, toMonth: 12, pointsPerMonth: 1 / 12 },
      { fromMonth: 13, toMonth: 30, pointsPerMonth: 1 / 4 },
      { fromMonth: 31, toMonth: 42, pointsPerMonth: 1 / 6 },
      { fromMonth: 43, toMonth: 54, pointsPerMonth: 1 / 12 },
    ],
    olehScalePre2022: [
      { fromMonth: 1, toMonth: 18, pointsPerMonth: 1 / 4 },
      { fromMonth: 19, toMonth: 30, pointsPerMonth: 1 / 6 },
      { fromMonth: 31, toMonth: 42, pointsPerMonth: 1 / 12 },
    ],
  },

  validationNotes: [
    'Taux ביטוח לאומי 2025 appliqués sur 12 mois alors que le תיקון 252 prend effet en février 2025 (janvier aux anciens taux) — simplification volontaire.',
    'Moitié du salaire moyen annuel pour פנסיית חובה (79 896 ₪) : à valider.',
    'תקרה מוטבת keren 20 520 ₪ : à valider.',
  ],
};

export default params2025;
