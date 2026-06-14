import { useState, lazy, Suspense } from 'react';
import type { SalarieResult, SalarieInput } from '../engine/types';

interface Props {
  result: SalarieResult;
  input: SalarieInput;
}

const PDFDownloadLinkLazy = lazy(() =>
  import('@react-pdf/renderer').then(m => ({ default: m.PDFDownloadLink }))
);
const SalarieReportLazy = lazy(() => import('./SalarieReport'));

export default function PdfButton({ result, input }: Props) {
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="px-4 py-2 bg-gold text-navy font-semibold rounded-lg hover:bg-opacity-90 transition-colors text-sm"
      >
        Generer PDF
      </button>
    );
  }

  return (
    <Suspense fallback={<span className="text-sm text-gray-400">Preparation du PDF...</span>}>
      <PDFDownloadLinkLazy
        document={<SalarieReportLazy result={result} input={input} />}
        fileName={`simulation-salariale-${input.fiscalYear}${input.clientName ? `-${input.clientName.replace(/\s+/g, '-')}` : ''}.pdf`}
      >
        {({ loading }) => (
          <button className="px-4 py-2 bg-gold text-navy font-semibold rounded-lg hover:bg-opacity-90 transition-colors text-sm">
            {loading ? 'Generation...' : 'Telecharger PDF'}
          </button>
        )}
      </PDFDownloadLinkLazy>
    </Suspense>
  );
}
