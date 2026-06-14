import { useMemo, useState } from 'react';
import Header from './components/Header';
import SimulatorForm from './components/SimulatorForm';
import ResultsPanel from './components/ResultsPanel';
import PdfButton from './pdf/PdfButton';
import { getParams } from './engine/params';
import { simulate } from './engine/simulate';
import { validateInput } from './engine/validate';
import type { SimulationInput } from './engine/types';

const DEFAULT_INPUT: SimulationInput = {
  taxYear: 2026,
  clientName: '',
  revenue: 0,
  netProfit: 0,
  birthDate: '',
  sex: 'homme',
  maritalStatus: 'celibataire',
  spouseNoIncome: false,
  children: [],
  paysMezonot: false,
  aliyahDate: null,
  recentAcademicDegree: false,
  dischargedSoldier: false,
  pensionDeposit: 0,
  kerenDeposit: 0,
  hasDisabilityInsurance: false,
};

export default function App() {
  const [input, setInput] = useState<SimulationInput>(DEFAULT_INPUT);

  const errors = useMemo(() => validateInput(input), [input]);

  const result = useMemo(() => {
    if (errors.length > 0) return null;
    try {
      return simulate(input, getParams(input.taxYear));
    } catch {
      return null;
    }
  }, [input, errors]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[5fr_6fr]">
        <div className="self-start rounded-lg bg-white p-5 shadow lg:sticky lg:top-6">
          <SimulatorForm value={input} onChange={setInput} errors={errors} />
        </div>
        <div>
          {result ? (
            <div className="space-y-6">
              <ResultsPanel result={result} />
              <PdfButton result={result} />
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">
              Renseignez le formulaire (CA, bénéfice, date de naissance) pour lancer la
              simulation.
            </div>
          )}
        </div>
      </main>
      <footer className="pb-8 text-center text-xs text-slate-400">
        Simulation indicative — ne constitue pas une déclaration fiscale. © Krief Expertise,
        Jérusalem.
      </footer>
    </div>
  );
}
