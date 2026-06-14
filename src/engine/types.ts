export type InputMode = 'brut' | 'net';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

export interface ChildEntry {
  birthYear: number;
  claiming: boolean;
}

export interface PersonalInfo {
  birthYear: number;
  gender: 'M' | 'F';
  maritalStatus: MaritalStatus;
  spouseNoIncome: boolean;
  children: ChildEntry[];
  paysMezonot: boolean;
  aliyahDate: string | null;
  hasAcademicDegree: boolean;
  isDischargedSoldier: boolean;
}

export interface PensionParams {
  productType: 'keren_pensia' | 'bituach_menahalim';
  employeeTagmoulimRate: number;
  employerTagmoulimRate: number;
  employerPitsouimRate: number;
}

export interface KerenParams {
  enabled: boolean;
  employeeRate: number;
  employerRate: number;
}

export interface IndirectCostsParams {
  includeHavara: boolean;
  includeHolidays: boolean;
  includePublicHolidays: boolean;
  seniority: number;
}

export interface SalarieInput {
  mode: InputMode;
  salaryInput: number;
  fiscalYear: 2025 | 2026;
  employmentRate: number;
  personal: PersonalInfo;
  pension: PensionParams;
  keren: KerenParams;
  indirectCosts: IndirectCostsParams;
  clientName: string;
}

export interface BLResult {
  grossSalary: number;
  employeeLeumi: number;
  employeeHealth: number;
  employeeTotal: number;
  employerBL: number;
}

export interface IRResult {
  taxableIncome: number;
  bracketTax: number;
  surtax: number;
  creditPoints: number;
  creditPointsValue: number;
  pensionCredit: number;
  netTax: number;
}

export interface PensionResult {
  employeeContrib: number;
  employerTagmoulim: number;
  employerPitsouim: number;
  employerTotal: number;
  employeeZikuy: number;
}

export interface KerenResult {
  employeeContrib: number;
  employerContrib: number;
  employerExempt: number;
  employerTaxable: number;
}

export interface IndirectCostsResult {
  havaraMonthly: number;
  holidaysMonthly: number;
  publicHolidaysMonthly: number;
  totalMonthly: number;
}

export interface CreditPointLine {
  label: string;
  points: number;
}

export interface SalarieResult {
  brut: number;
  net: number;
  bl: BLResult;
  ir: IRResult;
  pension: PensionResult;
  keren: KerenResult;
  creditPointLines: CreditPointLine[];
  indirect: IndirectCostsResult;
  totalEmployeeDeductions: number;
  totalEmployerDirectCosts: number;
  totalEmployerIndirect: number;
  totalEmployerCost: number;
  netToCostRatio: number;
  solverConverged: boolean;
  solverIterations: number;
}
