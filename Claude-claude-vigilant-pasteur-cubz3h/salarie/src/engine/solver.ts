export interface SolverResult {
  brut: number;
  converged: boolean;
  iterations: number;
}

export function grossFromNet(
  targetNet: number,
  computeNet: (brut: number) => number,
  tolerance = 1,
  maxIter = 50
): SolverResult {
  let low = targetNet;
  let high = targetNet * 3;
  let mid = targetNet;

  for (let i = 0; i < maxIter; i++) {
    mid = (low + high) / 2;
    const computed = computeNet(mid);
    if (Math.abs(computed - targetNet) < tolerance) {
      return { brut: mid, converged: true, iterations: i + 1 };
    }
    if (computed < targetNet) low = mid;
    else high = mid;
  }
  return { brut: mid, converged: false, iterations: maxIter };
}
