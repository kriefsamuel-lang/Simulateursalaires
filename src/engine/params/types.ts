export interface TaxBracket {
  upTo: number | null;
  rate: number;
}

export interface OlehBand {
  fromMonth: number;
  toMonth: number;
  pointsPerMonth: number;
}

export interface SalariedYearParams {
  year: number;
  creditPointValue: number;

  incomeTax: {
    brackets: TaxBracket[];
    surtaxThresholdMonthly: number;
    surtaxRate: number;
  };

  bituachLeumi: {
    reducedMonthlyCeiling: number;
    maxMonthlyIncome: number;
    employee: {
      reduced: { leumi: number; health: number };
      full: { leumi: number; health: number };
    };
    employer: {
      reduced: number;
      full: number;
    };
  };

  pension: {
    qualifyingMonthlyCeiling: number;
    employeeZikuyRate: number;
    employeeZikuyContribRate: number;
  };

  kerenHishtalmout: {
    employerExemptMonthlyCeiling: number;
    employerExemptRate: number;
    employeeExemptMonthlyCeiling: number;
    employeeExemptRate: number;
  };

  indirectCosts: {
    havaraValuePerDay: number;
    havaraDays: { upToYears: number | null; days: number }[];
    holidayDays: { upToYears: number | null; days: number }[];
    publicHolidayDays: number;
    workingDaysPerYear: number;
  };

  creditPoints: {
    residentBase: number;
    womanExtra: number;
    spouseNoIncome: number;
    mezonot: number;
    academicDegree: number;
    dischargedSoldier: number;
    children: {
      age0: number;
      age1: number;
      age2: number;
      age3: number;
      age4to5: number;
      age6to17: number;
      age18: number;
    };
    olehScalePost2022: OlehBand[];
    olehScalePre2022: OlehBand[];
  };

  validationNotes: string[];
}
