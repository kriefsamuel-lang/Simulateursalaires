/** Types des entrées et sorties du moteur de simulation. */

export type Sex = 'homme' | 'femme';
export type MaritalStatus = 'celibataire' | 'marie' | 'divorce' | 'veuf';
export type ClaimingParent = 'moi' | 'autre_parent';

export interface ChildInput {
  birthYear: number;
  /** Qui réclame les points pour cet enfant dans cette simulation. */
  claimedBy: ClaimingParent;
}

export interface SimulationInput {
  taxYear: number;
  clientName: string;

  /** Chiffre d'affaires annuel estimé (₪). */
  revenue: number;
  /** Bénéfice net annuel estimé (₪), avant déductions sociales. */
  netProfit: number;

  // --- Situation personnelle (נקודות זיכוי) ---
  birthDate: string; // ISO yyyy-mm-dd
  sex: Sex;
  maritalStatus: MaritalStatus;
  spouseNoIncome: boolean;
  children: ChildInput[];
  /** Paie une pension alimentaire (מזונות) à l'ex-conjoint — règle du divorcé remarié. */
  paysMezonot: boolean;
  /** Date d'alyah (ISO) ou null si non concerné. */
  aliyahDate: string | null;
  recentAcademicDegree: boolean;
  dischargedSoldier: boolean;

  // --- Épargne ---
  /** Cotisation pension annuelle déjà prévue (₪). */
  pensionDeposit: number;
  /** Cotisation keren hishtalmout annuelle déjà prévue (₪). */
  kerenDeposit: number;
  /** Détient une assurance perte d'exploitation (אובדן כושר עבודה). */
  hasDisabilityInsurance: boolean;
}

export interface CreditPointLine {
  label: string;
  points: number;
}

export interface BituachLeumiResult {
  /** Assiette annuelle retenue. */
  base: number;
  leumi: number;
  health: number;
  total: number;
  /** מקדמה mensuelle (total ÷ 12, arrondi). */
  monthlyAdvance: number;
}

export interface PensionDeductionResult {
  deposit: number;
  /** ניכוי §47 effectivement utilisé. */
  nikkuy: number;
  /** Dépôt pris en compte pour le זיכוי §45א. */
  zikuyBase: number;
  /** Crédit d'impôt (35 % du zikuyBase). */
  zikuy: number;
  /** Plafonds applicables (pour affichage). */
  nikkuyCap: number;
  zikuyBaseCap: number;
}

export interface ScenarioResult {
  label: string;
  pensionDeposit: number;
  kerenDeposit: number;
  kerenNikkuy: number;
  pension: PensionDeductionResult;
  bituachLeumi: BituachLeumiResult;
  /** Revenu imposable après toutes déductions. */
  taxableIncome: number;
  /** Impôt brut (barème + מס יסף), avant crédits. */
  grossTax: number;
  surtax: number;
  creditPointLines: CreditPointLine[];
  totalPoints: number;
  pointsCredit: number;
  pensionZikuy: number;
  /** Impôt net (plancher 0). */
  netTax: number;
  /** Taux de מקדמות IR : impôt net ÷ CA, arrondi à 0,1 % supérieur. */
  mikdamotRate: number;
  /** Taux marginal IR du client. */
  marginalRate: number;
  /** Revenu net disponible = bénéfice − IR − BL − dépôts. */
  netDisposable: number;
  /** Nombre d'itérations du solveur. */
  solverIterations: number;
}

export interface PensionRecommendation {
  mandatoryMinimum: number;
  optimizedDeposit: number;
  /** Gain d'impôt annuel si l'on passe du dépôt actuel au dépôt optimisé. */
  taxSavingVsCurrent: number;
}

export interface KerenRecommendation {
  optimalDeductibleDeposit: number;
  taxSavingVsCurrent: number;
  exemptDepositCeiling: number;
}

export interface SimulationResult {
  input: SimulationInput;
  year: number;
  baseline: ScenarioResult;
  optimized: ScenarioResult;
  pensionReco: PensionRecommendation;
  kerenReco: KerenRecommendation;
  validationNotes: string[];
}
