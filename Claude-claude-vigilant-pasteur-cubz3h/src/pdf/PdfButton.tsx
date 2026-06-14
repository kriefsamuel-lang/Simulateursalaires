import { useState } from 'react';
import type { SimulationResult } from '../engine/types';

export default function PdfButton({ result }: { result: SimulationResult }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      // Chargés à la demande : @react-pdf pèse lourd, inutile au premier rendu.
      const [{ pdf }, { default: ClientReport }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ClientReport'),
      ]);
      const blob = await pdf(<ClientReport result={result} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const name = result.input.clientName.trim().replace(/\s+/g, '_') || 'client';
      a.download = `simulation_${result.year}_${name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(`Échec de la génération du PDF : ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={generate}
        disabled={busy}
        className="w-full rounded bg-gold px-4 py-3 font-bold text-navy shadow transition hover:bg-gold-light disabled:opacity-50"
      >
        {busy ? 'Génération en cours…' : 'Générer le PDF client'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
