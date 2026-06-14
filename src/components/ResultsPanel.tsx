import type { SalarieResult } from '../engine/types';
import { formatCurrency, formatPercent } from '../engine/format';
import PdfButton from '../pdf/PdfButton';
import type { SalarieInput } from '../engine/types';

interface Props {
  result: SalarieResult | null;
  loading: boolean;
  input: SalarieInput | null;
}

function Row({ label, value, indent = false, bold = false, highlight = false }: {
  label: string;
  value: string;
  indent?: boolean;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${indent ? 'pl-4' : ''} ${highlight ? 'bg-gold bg-opacity-10 rounded px-2' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-navy' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm font-mono ${bold ? 'font-bold text-navy' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-navy border-b border-gold border-opacity-40 pb-1 mb-2 mt-4">{children}</h3>;
}

export default function ResultsPanel({ result, loading, input }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-navy border-t-gold"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-3">ILS</div>
          <p>Entrez un salaire et cliquez sur "Calculer"</p>
        </div>
      </div>
    );
  }

  const { brut, net, bl, ir, pension, keren, creditPointLines, indirect } = result;

  return (
    <div className="space-y-4">
      {!result.solverConverged && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
          Attention: le solver net-&gt;brut n'a pas converge. Verifiez la valeur saisie.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-bold text-navy mb-3">Cote employe</h2>

        <Row label="Salaire brut" value={formatCurrency(brut)} bold />

        <SectionTitle>Bituah Leumi employe</SectionTitle>
        <Row label="BL Leumi" value={`- ${formatCurrency(bl.employeeLeumi)}`} indent />
        <Row label="Assurance maladie (Briut)" value={`- ${formatCurrency(bl.employeeHealth)}`} indent />
        <Row label="Total BL employe" value={`- ${formatCurrency(bl.employeeTotal)}`} bold />

        <SectionTitle>Impot sur le revenu (Mas Hakhnasa)</SectionTitle>
        <Row label="Revenu imposable" value={formatCurrency(ir.taxableIncome)} indent />
        <Row label="IR tranches" value={formatCurrency(ir.bracketTax)} indent />
        {ir.surtax > 0 && <Row label="Mas Yasaf (surtaxe 3%)" value={formatCurrency(ir.surtax)} indent />}
        <Row label={`Points de credit (${ir.creditPoints.toFixed(2)} pts)`} value={`- ${formatCurrency(ir.creditPointsValue)}`} indent />
        {ir.pensionCredit > 0 && <Row label="Zikuy pension" value={`- ${formatCurrency(ir.pensionCredit)}`} indent />}
        <Row label="IR net" value={`- ${formatCurrency(ir.netTax)}`} bold />

        {creditPointLines.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer">Detail points de credit</summary>
            <div className="mt-1 space-y-0.5">
              {creditPointLines.map((l, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-500 pl-2">
                  <span>{l.label}</span><span>{l.points.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </details>
        )}

        <SectionTitle>Pension</SectionTitle>
        <Row label="Tagmoulim employe" value={`- ${formatCurrency(pension.employeeContrib)}`} indent />

        {keren.employeeContrib > 0 && (
          <>
            <SectionTitle>Keren Hishtalmout</SectionTitle>
            <Row label="Keren employe" value={`- ${formatCurrency(keren.employeeContrib)}`} indent />
          </>
        )}

        <div className="mt-4 pt-3 border-t-2 border-gold">
          <Row label="NET A PAYER" value={formatCurrency(net)} bold highlight />
        </div>

        <div className="mt-2 text-xs text-gray-500 text-right">
          Taux de charge salarie: {formatPercent(result.totalEmployeeDeductions / brut)}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-bold text-navy mb-3">Charges employeur directes</h2>

        <Row label="Salaire brut" value={formatCurrency(brut)} />

        <SectionTitle>Bituah Leumi employeur</SectionTitle>
        <Row label="BL employeur" value={formatCurrency(bl.employerBL)} indent />

        <SectionTitle>Pension employeur</SectionTitle>
        <Row label="Tagmoulim employeur" value={formatCurrency(pension.employerTagmoulim)} indent />
        <Row label="Pitsouim (indemnite)" value={formatCurrency(pension.employerPitsouim)} indent />
        <Row label="Total pension employeur" value={formatCurrency(pension.employerTotal)} bold />

        {keren.employerContrib > 0 && (
          <>
            <SectionTitle>Keren Hishtalmout employeur</SectionTitle>
            <Row label="Keren employeur" value={formatCurrency(keren.employerContrib)} indent />
            {keren.employerTaxable > 0 && (
              <Row label="dont taxable (au-dessus plafond)" value={formatCurrency(keren.employerTaxable)} indent />
            )}
          </>
        )}

        <div className="mt-4 pt-3 border-t-2 border-gold">
          <Row label="Cout direct employeur" value={formatCurrency(result.totalEmployerDirectCosts)} bold highlight />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-bold text-navy mb-3">Charges indirectes (provisions)</h2>

        {indirect.havaraMonthly > 0 && (
          <Row label="Havara (mensuel)" value={formatCurrency(indirect.havaraMonthly)} />
        )}
        {indirect.holidaysMonthly > 0 && (
          <Row label="Conges annuels (mensuel)" value={formatCurrency(indirect.holidaysMonthly)} />
        )}
        {indirect.publicHolidaysMonthly > 0 && (
          <Row label="Jours feries (mensuel)" value={formatCurrency(indirect.publicHolidaysMonthly)} />
        )}
        {indirect.totalMonthly === 0 && (
          <p className="text-sm text-gray-400 italic">Aucune charge indirecte selectionnee</p>
        )}

        {indirect.totalMonthly > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <Row label="Total indirectes" value={formatCurrency(indirect.totalMonthly)} bold />
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3 italic">
          Provision estimative — ne constitue pas une obligation legale immediate
        </p>
      </div>

      <div className="bg-navy text-white rounded-lg p-5">
        <h2 className="text-lg font-bold mb-4 text-gold">Synthese — Cout employeur total</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Salaire brut</span>
            <span className="font-mono">{formatCurrency(brut)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Net a payer</span>
            <span className="font-mono">{formatCurrency(net)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-white border-opacity-20 pt-2">
            <span>Charges directes employeur</span>
            <span className="font-mono">{formatCurrency(result.totalEmployerDirectCosts)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Charges indirectes (provisions)</span>
            <span className="font-mono">{formatCurrency(result.totalEmployerIndirect)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold border-t-2 border-gold pt-3 mt-3">
            <span className="text-gold">Cout total employeur</span>
            <span className="text-gold font-mono">{formatCurrency(result.totalEmployerCost)}</span>
          </div>
          <div className="flex justify-between text-sm opacity-75">
            <span>Ratio net / cout total</span>
            <span className="font-mono">{formatPercent(result.netToCostRatio)}</span>
          </div>
        </div>
      </div>

      {input && (
        <div className="flex justify-end">
          <PdfButton result={result} input={input} />
        </div>
      )}
    </div>
  );
}
