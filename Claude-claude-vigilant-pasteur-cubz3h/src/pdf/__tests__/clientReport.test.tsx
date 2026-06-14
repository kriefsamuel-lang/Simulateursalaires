import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { getParams } from '../../engine/params';
import { simulate } from '../../engine/simulate';
import type { SimulationInput } from '../../engine/types';

// En test Node, les polices sont lues depuis /public au lieu des URLs servies.
vi.mock('../fonts', () => ({
  rubikRegular: path.resolve(process.cwd(), 'public/fonts/Rubik-Regular.ttf'),
  rubikBold: path.resolve(process.cwd(), 'public/fonts/Rubik-Bold.ttf'),
}));

const input: SimulationInput = {
  taxYear: 2026,
  clientName: 'Client Test',
  revenue: 600_000,
  netProfit: 350_000,
  birthDate: '1986-03-12',
  sex: 'femme',
  maritalStatus: 'marie',
  spouseNoIncome: false,
  children: [
    { birthYear: 2019, claimedBy: 'moi' },
    { birthYear: 2023, claimedBy: 'moi' },
  ],
  paysMezonot: false,
  aliyahDate: '2023-09-01',
  recentAcademicDegree: false,
  dischargedSoldier: false,
  pensionDeposit: 12_000,
  kerenDeposit: 5_000,
  hasDisabilityInsurance: true,
};

describe('PDF client (smoke test)', () => {
  it('génère un PDF valide avec textes hébreux et français', async () => {
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { default: ClientReport } = await import('../ClientReport');

    const result = simulate(input, getParams(2026));
    const buffer = await renderToBuffer(<ClientReport result={result} />);

    expect(buffer.length).toBeGreaterThan(10_000);
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  }, 30_000);
});
