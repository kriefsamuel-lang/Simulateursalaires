import { computeBL } from './bituachLeumi';
import { computeIR } from './incomeTax';
import { computePension, emptyPension } from './pension';
import { computeKeren, emptyKeren } from './kerenHishtalmout';
import { computeIndirectCosts } from './indirectCosts';
import { computeCreditPoints } from './creditPoints';
import { grossFromNet } from './solver';
import { round2 } from './format';
import type { SalariedYearParams } from './params/types';
import type { SalarieInput, SalarieResult } from './types';

function computeNetFromBrut(brut: number, input: SalarieInput, p: SalariedYearParams): number {
  const bl = computeBL(brut, p);
  const pension = computePension(
    brut,
    input.pension.employeeTagmoulimRate,
    input.pension.employerTagmoulimRate,
    input.pension.employerPitsouimRate,
    p
  );
  const kerenResult = input.keren.enabled
    ? computeKeren(brut, input.keren.employeeRate, input.keren.employerRate, p)
    : emptyKeren();
  const creditPointLines = computeCreditPoints(input.personal, input.fiscalYear, p);
  const totalCreditPoints = creditPointLines.reduce((s, l) => s + l.points, 0);
  const ir = computeIR(brut, pension.employeeContrib, pension.employeeZikuy, totalCreditPoints, p);
  return brut - bl.employeeTotal - ir.netTax - pension.employeeContrib - kerenResult.employeeContrib;
}

export function simulate(input: SalarieInput, p: SalariedYearParams): SalarieResult {
  let brut: number;
  let solverConverged = true;
  let solverIterations = 0;

  if (input.mode === 'brut') {
    brut = input.salaryInput;
  } else {
    const result = grossFromNet(input.salaryInput, (b) => computeNetFromBrut(b, input, p));
    brut = result.brut;
    solverConverged = result.converged;
    solverIterations = result.iterations;
  }

  const bl = computeBL(brut, p);
  const pension = computePension(
    brut,
    input.pension.employeeTagmoulimRate,
    input.pension.employerTagmoulimRate,
    input.pension.employerPitsouimRate,
    p
  );
  const kerenResult = input.keren.enabled
    ? computeKeren(brut, input.keren.employeeRate, input.keren.employerRate, p)
    : emptyKeren();
  const creditPointLines = computeCreditPoints(input.personal, input.fiscalYear, p);
  const totalCreditPoints = creditPointLines.reduce((s, l) => s + l.points, 0);
  const ir = computeIR(brut, pension.employeeContrib, pension.employeeZikuy, totalCreditPoints, p);
  const indirect = computeIndirectCosts(
    brut,
    input.indirectCosts.seniority,
    input.employmentRate,
    input.indirectCosts,
    p
  );

  const net = round2(brut - bl.employeeTotal - ir.netTax - pension.employeeContrib - kerenResult.employeeContrib);
  const totalEmployeeDeductions = round2(bl.employeeTotal + ir.netTax + pension.employeeContrib + kerenResult.employeeContrib);
  const totalEmployerDirectCosts = round2(brut + bl.employerBL + pension.employerTotal + kerenResult.employerContrib);
  const totalEmployerIndirect = indirect.totalMonthly;
  const totalEmployerCost = round2(totalEmployerDirectCosts + totalEmployerIndirect);

  return {
    brut: round2(brut),
    net,
    bl,
    ir,
    pension,
    keren: kerenResult,
    creditPointLines,
    indirect,
    totalEmployeeDeductions,
    totalEmployerDirectCosts,
    totalEmployerIndirect,
    totalEmployerCost,
    netToCostRatio: net / totalEmployerCost,
    solverConverged,
    solverIterations,
  };
}
