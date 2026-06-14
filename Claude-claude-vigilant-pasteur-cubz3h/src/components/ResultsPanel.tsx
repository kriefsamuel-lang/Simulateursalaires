import type { SimulationResult, ScenarioResult } from '../engine/types';
import { fmtNIS, fmtPercent, fmtPoints } from '../engine/format';

function Row({ label, value, strong, indent }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean; indent?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-1.5 ${strong ? 'font-bold text-navy' : ''} ${indent ? 'pl-4 text-sm text-slate-600' : ''}`}
    >
      <span>{label}</span>
      <span className="whitespace-nowrap tabular-nums">{value}</span>
    </div>
  );
}

function ScenarioColumn({ s }: { s: ScenarioResult }) {
  return (
    <div className="space-y-0.5 tabular-nums">
      <Row label="Dépôt pension" value={fmtNIS(s.pensionDeposit)} />
      <Row label="Dépôt keren hishtalmout" value={fmtNIS(s.kerenDeposit)} />
      <Row label="Revenu imposable" value={fmtNIS(s.taxableIncome)} />
      <Row label="Impôt net" value={fmtNIS(s.netTax)} />
      <Row label="ביטוח לאומי annuel" value={fmtNIS(s.bituachLeumi.total)} />
      <Row label="Charge totale" value={fmtNIS(s.netTax + s.bituachLeumi.total)} strong />
      <Row label="Revenu net disponible" value={fmtNIS(s.netDisposable)} strong />
    </div>
  );
}

export default function ResultsPanel({ result }: { result: SimulationResult }) {
  const b = result.baseline;
  const o = result.optimized;

  return (
    <div className="space-y-6">
      {/* Synthèse impôt */}
      <section className="rounded-lg bg-white p-5 shadow">
        <h2 className="section-title">Impôt sur le revenu {result.year} — scénario actuel</h2>
        <Row label="Revenu imposable (après ניכויים et 52 % BL)" value={fmtNIS(b.taxableIncome)} />
        <Row
          label={<>Impôt brut au barème{b.surtax > 0 ? ' (dont מס יסף)' : ''}</>}
          value={b.surtax > 0 ? `${fmtNIS(b.grossTax)} (${fmtNIS(b.surtax)})` : fmtNIS(b.grossTax)}
        />
        <div className="my-2 border-t border-slate-200" />
        <p className="mb-1 text-sm font-semibold text-navy">
          נקודות זיכוי — {fmtPoints(b.totalPoints)} points ×{' '}
          {fmtNIS(b.totalPoints > 0 ? b.pointsCredit / b.totalPoints : 0)} :
        </p>
        {b.creditPointLines.map((l, i) => (
          <Row key={i} indent label={l.label} value={`${fmtPoints(l.points)} pts`} />
        ))}
        <Row label="Crédit נקודות זיכוי" value={`− ${fmtNIS(b.pointsCredit)}`} />
        <Row label="Zikouy pension (35 %)" value={`− ${fmtNIS(b.pensionZikuy)}`} />
        <div className="my-2 border-t border-slate-200" />
        <Row strong label="Impôt net annuel" value={fmtNIS(b.netTax)} />
        <Row
          label="Taux de מקדמות IR (impôt ÷ CA, arrondi à 0,1 % sup.)"
          value={
            <span>
              <span className="font-bold text-navy">{fmtPercent(b.mikdamotRate)}</span>{' '}
              <span className="text-xs text-slate-500">à reporter sur le דוח מקדמות</span>
            </span>
          }
        />
        <Row label="Taux marginal IR" value={fmtPercent(b.marginalRate * 100, 0)} />
      </section>

      {/* Bituach Leumi */}
      <section className="rounded-lg bg-white p-5 shadow">
        <h2 className="section-title">ביטוח לאומי (עצמאי)</h2>
        <Row label="Assiette annuelle (après ניכויים pension/keren)" value={fmtNIS(b.bituachLeumi.base)} />
        <Row indent label="דמי ביטוח לאומי" value={fmtNIS(b.bituachLeumi.leumi)} />
        <Row indent label="דמי ביטוח בריאות" value={fmtNIS(b.bituachLeumi.health)} />
        <Row strong label="Total annuel" value={fmtNIS(b.bituachLeumi.total)} />
        <Row strong label="מקדמה mensuelle" value={fmtNIS(b.bituachLeumi.monthlyAdvance)} />
      </section>

      {/* Recommandations */}
      <section className="rounded-lg border-l-4 border-gold bg-white p-5 shadow">
        <h2 className="section-title">Recommandations épargne</h2>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-navy">Pension (פנסיית חובה)</p>
          <Row indent label="Minimum légal obligatoire" value={fmtNIS(result.pensionReco.mandatoryMinimum)} />
          <Row indent label="Dépôt optimisé (ניכוי 11 % + זיכוי plafonnés)" value={fmtNIS(result.pensionReco.optimizedDeposit)} />
          <Row
            indent
            label="Gain d’impôt + cotisations vs dépôt actuel"
            value={<span className="font-semibold text-green-700">{fmtNIS(result.pensionReco.taxSavingVsCurrent)}</span>}
          />
          <p className="mt-3 text-sm font-semibold text-navy">Keren hishtalmout (קרן השתלמות)</p>
          <Row indent label="Dépôt optimal déductible (4,5 %, max plafond)" value={fmtNIS(result.kerenReco.optimalDeductibleDeposit)} />
          <Row
            indent
            label="Gain d’impôt + cotisations vs dépôt actuel"
            value={<span className="font-semibold text-green-700">{fmtNIS(result.kerenReco.taxSavingVsCurrent)}</span>}
          />
          <Row
            indent
            label="Plafond de dépôt exonéré de מס רווחי הון (תקרה מוטבת)"
            value={fmtNIS(result.kerenReco.exemptDepositCeiling)}
          />
          <p className="mt-2 text-xs text-slate-500">
            Deux plafonds distincts : le plafond de <strong>déductibilité IR</strong> (4,5 % du
            bénéfice, plafonné) réduit le revenu imposable ; le plafond{' '}
            <strong>תקרה מוטבת</strong> ({fmtNIS(result.kerenReco.exemptDepositCeiling)}) est le
            dépôt annuel maximal dont les gains restent exonérés de מס רווחי הון, même si la part
            au-delà de 4,5 % n’est pas déductible.
          </p>
        </div>
      </section>

      {/* Comparatif */}
      <section className="rounded-lg bg-white p-5 shadow">
        <h2 className="section-title">Comparatif sans / avec optimisation</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-500">Sans optimisation</h3>
            <ScenarioColumn s={b} />
          </div>
          <div className="rounded bg-gold/10 p-3 -m-3 md:m-0 md:p-0 md:bg-transparent">
            <h3 className="mb-2 text-sm font-bold text-gold-dark">Avec optimisation</h3>
            <ScenarioColumn s={o} />
          </div>
        </div>
        <div className="mt-4 rounded bg-navy p-3 text-center text-white">
          Économie totale (IR + ביטוח לאומי) :{' '}
          <span className="font-bold text-gold">
            {fmtNIS(b.netTax + b.bituachLeumi.total - o.netTax - o.bituachLeumi.total)}
          </span>{' '}
          / an
        </div>
      </section>

      {/* Notes de validation */}
      <section className="rounded border border-amber-300 bg-amber-50 p-4 text-xs text-amber-800">
        <p className="mb-1 font-semibold">Paramètres à valider (usage interne cabinet) :</p>
        <ul className="list-inside list-disc space-y-0.5">
          {result.validationNotes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
