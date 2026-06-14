import { useState } from 'react';
import Header from './components/Header';
import SalarieForm from './components/SalarieForm';
import ResultsPanel from './components/ResultsPanel';
import { simulate } from './engine/simulate';
import { getParams } from './engine/params';
import type { SalarieInput, SalarieResult } from './engine/types';

export default function App() {
  const [result, setResult] = useState<SalarieResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastInput, setLastInput] = useState<SalarieInput | null>(null);

  async function handleSimulate(input: SalarieInput) {
    setLoading(true);
    setLastInput(input);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const p = getParams(input.fiscalYear);
      const r = simulate(input, p);
      setResult(r);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <SalarieForm onSimulate={handleSimulate} loading={loading} />
          </div>
          <div>
            <ResultsPanel result={result} loading={loading} input={lastInput} />
          </div>
        </div>
      </main>
    </div>
  );
}
