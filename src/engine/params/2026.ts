import type { YearParams } from './types';

/**
 * Paramètres fiscaux 2026 — שנת המס 2026
 *
 * Sources principales :
 * - ביטוח לאומי : חוזר "שינוי בתשלום דמי ביטוח לאומי ודמי ביטוח בריאות לשנת 2026"
 *   (btl.gov.il) — taux עצמאי : réduit 4,47 % BL + 3,23 % santé jusqu'à
 *   7 703 ₪/mois ; plein 12,83 % BL + 5,17 % santé jusqu'à 51 910 ₪/mois.
 *   NB : les taux réduits 2,87 %/3,10 % d'avant 2025 ne sont PLUS en vigueur
 *   (relèvement par le תיקון 252, janvier 2025).
 * - Barème IR : לוח עזר לחישוב מס הכנסה ינואר 2026 (רשות המסים / gov.il) —
 *   élargissement des paliers 20 % (jusqu'à 19 000 ₪/mois) et 31 %
 *   (jusqu'à ~25 100 ₪/mois).
 *
 * ⚠️ Tout montant marqué "À VALIDER" doit être contrôlé contre le חוזר
 * officiel avant usage en production (voir validationNotes).
 */
const params2026: YearParams = {
  year: 2026,

  // 242 ₪/mois × 12 — valeur confirmée 2026.
  creditPointValue: 2904,

  incomeTax: {
    brackets: [
      { upTo: 84_120, rate: 0.10 },   // jusqu'à 7 010 ₪/mois
      { upTo: 120_720, rate: 0.14 },  // jusqu'à 10 060 ₪/mois
      { upTo: 228_000, rate: 0.20 },  // jusqu'à 19 000 ₪/mois (palier élargi 2026)
      { upTo: 301_200, rate: 0.31 },  // jusqu'à ~25 100 ₪/mois — À VALIDER (לוח עזר 2026)
      { upTo: 560_280, rate: 0.35 },  // À VALIDER contre le לוח עזר 2026
      { upTo: null, rate: 0.47 },
    ],
    surtaxThreshold: 721_560, // מס יסף — À VALIDER (indexation 2026)
    surtaxRate: 0.03,
  },

  bituachLeumi: {
    // À VALIDER contre le חוזר ביטוח לאומי officiel 2026.
    reducedMonthlyCeiling: 7_703,  // 60 % du salaire moyen
    maxMonthlyIncome: 51_910,      // plafond mensuel assujetti
    reduced: { leumi: 0.0447, health: 0.0323 }, // taux 2026 post-תיקון 252
    full: { leumi: 0.1283, health: 0.0517 },
    deductibleShare: 0.52, // §47א — 52 % des דמי ביטוח לאומי (hors santé) déductibles
  },

  pension: {
    mandatory: {
      // פנסיית חובה לעצמאים : 4,45 % jusqu'à la moitié du salaire moyen
      // annuel, 12,55 % entre la moitié et le salaire moyen annuel.
      // Minimum plafonné ≈ 14 044 ₪/an. À VALIDER (salaire moyen 2026).
      lowerRate: 0.0445,
      lowerCeiling: 82_614,
      upperRate: 0.1255,
      upperCeiling: 165_228,
    },
    qualifyingIncomeCeiling: 232_800, // הכנסה מזכה — À VALIDER (indexation 2026)
    nikkuyRate: 0.11,
    zikuyDepositRate: 0.055,                 // → plafond dépôt zikouy 12 804 ₪
    zikuyDepositRateExtraNoDisability: 0.005, // +0,5 % sans assurance אכ"ע
    zikuyCreditRate: 0.35,
  },

  kerenHishtalmut: {
    incomeCeiling: 293_397,        // → ניכוי max 13 203 ₪ — À VALIDER (indexation 2026)
    deductibleRate: 0.045,
    exemptDepositCeiling: 20_566,  // תקרה מוטבת (exonération רווחי הון) — À VALIDER
  },

  creditPoints: {
    residentBase: 2.25, // 2 pts résident + 0,25 נסיעות
    womanExtra: 0.5,    // femme : 2,75 au total
    spouseNoIncome: 1,
    mezonot: 1,
    academicDegree: 1,
    dischargedSoldier: 2, // service complet — 1 pt si service partiel (À VALIDER selon dossier)
    children: {
      // Barème par parent réclamant, post-réforme 2022/2024.
      // Les suppléments "petite enfance" (1–3 ans) sont issus des lois
      // 2023–2025 — À VALIDER leur reconduction en 2026.
      age0: 1.5,
      age1: 4.5,
      age2: 4.5,
      age3: 3.5,
      age4to5: 2.5,
      age6to17: 1,
      age18: 0.5, // demi-point l'année des 18 ans — À VALIDER
    },
    // Alyah ≥ 01/01/2022 : 54 mois, total 8,5 points.
    olehScalePost2022: [
      { fromMonth: 1, toMonth: 12, pointsPerMonth: 1 / 12 },  // 1 pt la 1re année
      { fromMonth: 13, toMonth: 30, pointsPerMonth: 1 / 4 },  // 3 pts/an pendant 18 mois
      { fromMonth: 31, toMonth: 42, pointsPerMonth: 1 / 6 },  // 2 pts/an pendant 12 mois
      { fromMonth: 43, toMonth: 54, pointsPerMonth: 1 / 12 }, // 1 pt/an pendant 12 mois
    ],
    // Alyah < 2022 : 42 mois (3/2/1 points "annualisés").
    olehScalePre2022: [
      { fromMonth: 1, toMonth: 18, pointsPerMonth: 1 / 4 },
      { fromMonth: 19, toMonth: 30, pointsPerMonth: 1 / 6 },
      { fromMonth: 31, toMonth: 42, pointsPerMonth: 1 / 12 },
    ],
  },

  validationNotes: [
    'Taux ביטוח לאומי 2026 (4,47 %/3,23 % réduit ; 12,83 %/5,17 % plein) : à valider contre le חוזר ביטוח לאומי 2026.',
    'Borne du palier 31 % (301 200 ₪/an ≈ 25 100 ₪/mois) et palier 35 % (560 280 ₪) : à valider contre le לוח עזר ינואר 2026 de la רשות המסים.',
    'Seuil מס יסף 721 560 ₪ : à valider (indexation 2026).',
    'הכנסה מזכה pension 232 800 ₪ et plafonds keren (293 397 ₪ / 20 566 ₪) : à valider (indexation 2026).',
    'Points enfants 1–3 ans (4,5/3,5) : reconduction des suppléments temporaires à valider pour 2026.',
    'Salaire moyen pour פנסיית חובה (165 228 ₪/an) : à valider.',
  ],
};

export default params2026;
