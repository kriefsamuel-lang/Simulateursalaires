import type { ChildInput, SimulationInput } from '../engine/types';
import { AVAILABLE_YEARS } from '../engine/params';

interface Props {
  value: SimulationInput;
  onChange: (next: SimulationInput) => void;
  errors: string[];
}

function num(v: string): number {
  const n = Number(v.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function SimulatorForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof SimulationInput>(key: K, v: SimulationInput[K]) =>
    onChange({ ...value, [key]: v });

  const setChild = (i: number, child: ChildInput) => {
    const children = value.children.slice();
    children[i] = child;
    set('children', children);
  };

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      {/* Année + client */}
      <section>
        <h2 className="section-title">Dossier</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="taxYear">Année fiscale</label>
            <select
              id="taxYear"
              className="input"
              value={value.taxYear}
              onChange={(e) => set('taxYear', Number(e.target.value))}
            >
              {AVAILABLE_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="clientName">Nom du client</label>
            <input
              id="clientName"
              className="input"
              value={value.clientName}
              onChange={(e) => set('clientName', e.target.value)}
              placeholder="M. / Mme…"
            />
          </div>
        </div>
      </section>

      {/* Activité */}
      <section>
        <h2 className="section-title">Activité</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="revenue">Chiffre d’affaires annuel (₪)</label>
            <input
              id="revenue"
              className="input"
              inputMode="numeric"
              value={value.revenue || ''}
              onChange={(e) => set('revenue', num(e.target.value))}
            />
          </div>
          <div>
            <label className="label" htmlFor="netProfit">Bénéfice net annuel (₪)</label>
            <input
              id="netProfit"
              className="input"
              inputMode="numeric"
              value={value.netProfit || ''}
              onChange={(e) => set('netProfit', num(e.target.value))}
            />
            <p className="mt-1 text-xs text-slate-500">Avant déductions sociales</p>
          </div>
        </div>
      </section>

      {/* Situation personnelle */}
      <section>
        <h2 className="section-title">Situation personnelle (נקודות זיכוי)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="birthDate">Date de naissance</label>
            <input
              id="birthDate"
              type="date"
              className="input"
              value={value.birthDate}
              onChange={(e) => set('birthDate', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="sex">Sexe</label>
            <select
              id="sex"
              className="input"
              value={value.sex}
              onChange={(e) => set('sex', e.target.value as SimulationInput['sex'])}
            >
              <option value="homme">Homme (2,25 pts)</option>
              <option value="femme">Femme (2,75 pts)</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="maritalStatus">État civil</label>
            <select
              id="maritalStatus"
              className="input"
              value={value.maritalStatus}
              onChange={(e) => set('maritalStatus', e.target.value as SimulationInput['maritalStatus'])}
            >
              <option value="celibataire">Célibataire</option>
              <option value="marie">Marié(e)</option>
              <option value="divorce">Divorcé(e)</option>
              <option value="veuf">Veuf(ve)</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="aliyahDate">Date d’alyah (optionnel)</label>
            <input
              id="aliyahDate"
              type="date"
              className="input"
              value={value.aliyahDate ?? ''}
              onChange={(e) => set('aliyahDate', e.target.value || null)}
            />
          </div>
        </div>

        <div className="mt-3 space-y-2 text-sm">
          {value.maritalStatus === 'marie' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.spouseNoIncome}
                onChange={(e) => set('spouseNoIncome', e.target.checked)}
              />
              Conjoint sans revenu (זיכוי בעד בן זוג — §37, conditions restrictives à vérifier)
            </label>
          )}
          {value.maritalStatus === 'divorce' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.paysMezonot}
                onChange={(e) => set('paysMezonot', e.target.checked)}
              />
              Paie une pension alimentaire (מזונות) à l’ex-conjoint — divorcé(e) remarié(e)
            </label>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.recentAcademicDegree}
              onChange={(e) => set('recentAcademicDegree', e.target.checked)}
            />
            Diplôme académique récent (תואר אקדמי, 1 pt)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.dischargedSoldier}
              onChange={(e) => set('dischargedSoldier', e.target.checked)}
            />
            Soldat libéré (חייל משוחרר, dans les 36 mois suivant la libération)
          </label>
        </div>

        {/* Enfants */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">Enfants (0–18 ans)</span>
            <button
              type="button"
              className="rounded bg-navy px-3 py-1 text-xs font-medium text-white hover:bg-navy-light"
              onClick={() =>
                set('children', [
                  ...value.children,
                  { birthYear: value.taxYear - 1, claimedBy: 'moi' },
                ])
              }
            >
              + Ajouter un enfant
            </button>
          </div>
          {value.children.length === 0 && (
            <p className="text-xs text-slate-500">Aucun enfant déclaré.</p>
          )}
          <div className="space-y-2">
            {value.children.map((child, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-16 text-xs text-slate-500">Enfant {i + 1}</span>
                <input
                  className="input w-28"
                  inputMode="numeric"
                  aria-label={`Année de naissance enfant ${i + 1}`}
                  value={child.birthYear || ''}
                  onChange={(e) => setChild(i, { ...child, birthYear: num(e.target.value) })}
                />
                <select
                  className="input flex-1"
                  aria-label={`Points réclamés par — enfant ${i + 1}`}
                  value={child.claimedBy}
                  onChange={(e) =>
                    setChild(i, { ...child, claimedBy: e.target.value as ChildInput['claimedBy'] })
                  }
                >
                  <option value="moi">Points réclamés par le client</option>
                  <option value="autre_parent">Points réclamés par l’autre parent</option>
                </select>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => set('children', value.children.filter((_, j) => j !== i))}
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Épargne */}
      <section>
        <h2 className="section-title">Épargne</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="pensionDeposit">Cotisation pension prévue (₪/an)</label>
            <input
              id="pensionDeposit"
              className="input"
              inputMode="numeric"
              value={value.pensionDeposit || ''}
              onChange={(e) => set('pensionDeposit', num(e.target.value))}
            />
          </div>
          <div>
            <label className="label" htmlFor="kerenDeposit">Keren hishtalmout prévue (₪/an)</label>
            <input
              id="kerenDeposit"
              className="input"
              inputMode="numeric"
              value={value.kerenDeposit || ''}
              onChange={(e) => set('kerenDeposit', num(e.target.value))}
            />
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.hasDisabilityInsurance}
            onChange={(e) => set('hasDisabilityInsurance', e.target.checked)}
          />
          Détient une assurance perte d’exploitation (אובדן כושר עבודה)
          <span className="text-xs text-slate-500">(sinon : +0,5 % de zikouy pension)</span>
        </label>
      </section>

      {errors.length > 0 && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          <p className="mb-1 font-semibold">Entrées à corriger :</p>
          <ul className="list-inside list-disc">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
