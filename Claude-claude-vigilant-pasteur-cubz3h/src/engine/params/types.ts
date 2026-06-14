/**
 * Structure des paramètres fiscaux annuels.
 *
 * RÈGLE D'OR : tout chiffre fiscal (taux, plafond, seuil, valeur de point)
 * vit dans un fichier /src/engine/params/<année>.ts conforme à cette
 * interface. Aucun chiffre fiscal en dur ailleurs dans le code.
 */

/** Tranche du barème IR. `upTo` = borne supérieure ANNUELLE en ₪ (null = dernière tranche, sans limite). */
export interface TaxBracket {
  upTo: number | null;
  rate: number; // ex. 0.10 pour 10 %
}

/** Tranche du barème de points עולה חדש : taux de points par mois depuis l'alyah. */
export interface OlehBand {
  /** Premier mois depuis l'alyah inclus (1 = mois de l'alyah). */
  fromMonth: number;
  /** Dernier mois inclus. */
  toMonth: number;
  /** Points de zikouy acquis par mois dans cette bande. */
  pointsPerMonth: number;
}

export interface YearParams {
  year: number;

  /** Valeur ANNUELLE d'une נקודת זיכוי en ₪. */
  creditPointValue: number;

  incomeTax: {
    /** Barème progressif annuel, tranches dans l'ordre croissant. */
    brackets: TaxBracket[];
    /** Seuil annuel du מס יסף (impôt additionnel). */
    surtaxThreshold: number;
    /** Taux du מס יסף. */
    surtaxRate: number;
  };

  bituachLeumi: {
    /** Plafond MENSUEL de la tranche réduite (60 % du salaire moyen). */
    reducedMonthlyCeiling: number;
    /** Revenu MENSUEL maximal assujetti (plafond). */
    maxMonthlyIncome: number;
    /** Taux de la tranche réduite. */
    reduced: { leumi: number; health: number };
    /** Taux de la tranche pleine. */
    full: { leumi: number; health: number };
    /**
     * Part des דמי ביטוח לאומי (hors דמי בריאות) déductible du revenu
     * imposable IR (§47א de la פקודה).
     */
    deductibleShare: number;
  };

  pension: {
    /**
     * Minimum légal פנסיית חובה לעצמאים :
     * lowerRate sur le revenu jusqu'à lowerCeiling (= moitié du salaire
     * moyen annuel), upperRate sur la tranche lowerCeiling → upperCeiling
     * (= salaire moyen annuel).
     */
    mandatory: {
      lowerRate: number;
      lowerCeiling: number;
      upperRate: number;
      upperCeiling: number;
    };
    /** הכנסה מזכה annuelle (plafond de revenu pour ניכוי et זיכוי pension). */
    qualifyingIncomeCeiling: number;
    /** Taux du ניכוי (§47) : part du revenu déductible. */
    nikkuyRate: number;
    /** Taux de base du dépôt ouvrant droit au זיכוי (§45א). */
    zikuyDepositRate: number;
    /** Supplément au taux de dépôt zikouy si PAS d'assurance אובדן כושר עבודה. */
    zikuyDepositRateExtraNoDisability: number;
    /** Taux du crédit d'impôt sur le dépôt zikouy (35 %). */
    zikuyCreditRate: number;
  };

  kerenHishtalmut: {
    /** Plafond de revenu annuel pour la déductibilité (תקרת הכנסה קובעת). */
    incomeCeiling: number;
    /** Taux déductible (ניכוי) : 4,5 % du bénéfice plafonné. */
    deductibleRate: number;
    /**
     * Plafond de dépôt annuel exonéré de מס רווחי הון sur les gains
     * (תקרה מוטבת) — distinct du plafond de déductibilité IR.
     */
    exemptDepositCeiling: number;
  };

  creditPoints: {
    /** Points de base d'un résident israélien (homme). */
    residentBase: number;
    /** Supplément femme. */
    womanExtra: number;
    /** Point pour conjoint sans revenu (§37 — conditions restrictives, voir UI). */
    spouseNoIncome: number;
    /** Point(s) pour paiement de מזונות (divorcé remarié payant pension à l'ex-conjoint). */
    mezonot: number;
    /** Point pour תואר אקדמי (année(s) suivant l'obtention du diplôme). */
    academicDegree: number;
    /** Points חייל משוחרר (service complet, pendant 36 mois après libération). */
    dischargedSoldier: number;
    /**
     * Points par enfant et par parent réclamant, selon l'âge atteint
     * pendant l'année fiscale (âge = année fiscale − année de naissance).
     */
    children: {
      /** Année de naissance (âge 0). */
      age0: number;
      /** Année des 1 an. */
      age1: number;
      /** Année des 2 ans. */
      age2: number;
      /** Année des 3 ans. */
      age3: number;
      /** Années des 4 et 5 ans. */
      age4to5: number;
      /** De 6 à 17 ans. */
      age6to17: number;
      /** Année des 18 ans. */
      age18: number;
    };
    /** Barème עולה חדש pour alyah à partir du 01/01/2022 (54 mois, 8,5 pts au total). */
    olehScalePost2022: OlehBand[];
    /** Ancien barème (alyah avant 2022, 42 mois, 4,5 pts "annualisés" 3/2/1). */
    olehScalePre2022: OlehBand[];
  };

  /** Notes de validation : chiffres à vérifier contre les circulaires officielles. */
  validationNotes: string[];
}
