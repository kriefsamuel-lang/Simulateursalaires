import { useState } from 'react';
import type { SalarieInput, PersonalInfo, PensionParams, KerenParams, IndirectCostsParams, ChildEntry } from '../engine/types';

interface Props {
  onSimulate: (input: SalarieInput) => void;
  loading: boolean;
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-left font-medium text-navy hover:bg-gray-100 transition-colors"
      >
        <span>{title}</span>
        <span className="text-gold text-lg">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700">{children}</label>;
}

const defaultPersonal: PersonalInfo = {
  birthYear: 1985,
  gender: 'M',
  maritalStatus: 'single',
  spouseNoIncome: false,
  children: [],
  paysMezonot: false,
  aliyahDate: null,
  hasAcademicDegree: false,
  isDischargedSoldier: false,
};

const defaultPension: PensionParams = {
  productType: 'keren_pensia',
  employeeTagmoulimRate: 0.06,
  employerTagmoulimRate: 0.065,
  employerPitsouimRate: 0.06,
};

const defaultKeren: KerenParams = {
  enabled: false,
  employeeRate: 0.025,
  employerRate: 0.075,
};

const defaultIndirect: IndirectCostsParams = {
  includeHavara: true,
  includeHolidays: true,
  includePublicHolidays: true,
  seniority: 1,
};

export default function SalarieForm({ onSimulate, loading }: Props) {
  const [mode, setMode] = useState<'brut' | 'net'>('brut');
  const [salaryInput, setSalaryInput] = useState(15_000);
  const [fiscalYear, setFiscalYear] = useState<2025 | 2026>(2026);
  const [employmentRate, setEmploymentRate] = useState(1);
  const [personal, setPersonal] = useState<PersonalInfo>(defaultPersonal);
  const [pension, setPension] = useState<PensionParams>(defaultPension);
  const [keren, setKeren] = useState<KerenParams>(defaultKeren);
  const [indirect, setIndirect] = useState<IndirectCostsParams>(defaultIndirect);
  const [clientName, setClientName] = useState('');

  function addChild() {
    setPersonal(p => ({ ...p, children: [...p.children, { birthYear: 2020, claiming: true }] }));
  }

  function removeChild(idx: number) {
    setPersonal(p => ({ ...p, children: p.children.filter((_, i) => i !== idx) }));
  }

  function updateChild(idx: number, field: keyof ChildEntry, value: unknown) {
    setPersonal(p => ({
      ...p,
      children: p.children.map((c, i) => i === idx ? { ...c, [field]: value } : c),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSimulate({ mode, salaryInput, fiscalYear, employmentRate, personal, pension, keren, indirectCosts: indirect, clientName });
  }

  const inputClass = "mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent";
  const radioClass = "mr-2 accent-navy";

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <Label>Mode de saisie</Label>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center cursor-pointer">
            <input type="radio" className={radioClass} name="mode" value="brut" checked={mode === 'brut'} onChange={() => setMode('brut')} />
            <span className="text-sm font-medium">BRUT</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input type="radio" className={radioClass} name="mode" value="net" checked={mode === 'net'} onChange={() => setMode('net')} />
            <span className="text-sm font-medium">NET</span>
          </label>
        </div>
      </div>

      <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
        <div>
          <Label>{mode === 'brut' ? 'Salaire brut mensuel (ILS)' : 'Salaire net mensuel souhaite (ILS)'}</Label>
          <input
            type="number"
            min={1}
            step={100}
            value={salaryInput}
            onChange={e => setSalaryInput(Number(e.target.value))}
            className={inputClass}
            required
          />
        </div>
        <div>
          <Label>Annee fiscale</Label>
          <select value={fiscalYear} onChange={e => setFiscalYear(Number(e.target.value) as 2025 | 2026)} className={inputClass}>
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
        <div>
          <Label>Taux d'emploi: {Math.round(employmentRate * 100)}%</Label>
          <input
            type="range"
            min={10}
            max={100}
            step={10}
            value={Math.round(employmentRate * 100)}
            onChange={e => setEmploymentRate(Number(e.target.value) / 100)}
            className="mt-1 w-full accent-navy"
          />
        </div>
      </div>

      <Section title="Situation personnelle" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Annee de naissance</Label>
            <input
              type="number"
              min={1940}
              max={2005}
              value={personal.birthYear}
              onChange={e => setPersonal(p => ({ ...p, birthYear: Number(e.target.value) }))}
              className={inputClass}
            />
          </div>
          <div>
            <Label>Sexe</Label>
            <select value={personal.gender} onChange={e => setPersonal(p => ({ ...p, gender: e.target.value as 'M' | 'F' }))} className={inputClass}>
              <option value="M">Homme</option>
              <option value="F">Femme</option>
            </select>
          </div>
        </div>
        <div>
          <Label>Situation maritale</Label>
          <select value={personal.maritalStatus} onChange={e => setPersonal(p => ({ ...p, maritalStatus: e.target.value as PersonalInfo['maritalStatus'] }))} className={inputClass}>
            <option value="single">Celibataire</option>
            <option value="married">Marie(e)</option>
            <option value="divorced">Divorce(e)</option>
            <option value="widowed">Veuf/Veuve</option>
          </select>
        </div>
        {personal.maritalStatus === 'married' && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={personal.spouseNoIncome} onChange={e => setPersonal(p => ({ ...p, spouseNoIncome: e.target.checked }))} className="accent-navy" />
            <span className="text-sm">Conjoint(e) sans revenu</span>
          </label>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Enfants</Label>
            <button type="button" onClick={addChild} className="text-xs bg-navy text-white px-2 py-1 rounded hover:bg-opacity-80">+ Ajouter</button>
          </div>
          {personal.children.map((child, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <input
                type="number"
                min={2000}
                max={2026}
                value={child.birthYear}
                onChange={e => updateChild(idx, 'birthYear', Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
                placeholder="Annee"
              />
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={child.claiming} onChange={e => updateChild(idx, 'claiming', e.target.checked)} className="accent-navy" />
                Reclamant
              </label>
              <button type="button" onClick={() => removeChild(idx)} className="text-red-400 text-xs hover:text-red-600">x</button>
            </div>
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={personal.paysMezonot} onChange={e => setPersonal(p => ({ ...p, paysMezonot: e.target.checked }))} className="accent-navy" />
          <span className="text-sm">Paie mezonot (pension alimentaire)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={personal.hasAcademicDegree} onChange={e => setPersonal(p => ({ ...p, hasAcademicDegree: e.target.checked }))} className="accent-navy" />
          <span className="text-sm">Diplome academique (universitaire)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={personal.isDischargedSoldier} onChange={e => setPersonal(p => ({ ...p, isDischargedSoldier: e.target.checked }))} className="accent-navy" />
          <span className="text-sm">Soldat libere (hayal meshouhar)</span>
        </label>
        <div>
          <Label>Date d'alyah (optionnel)</Label>
          <input
            type="date"
            value={personal.aliyahDate ?? ''}
            onChange={e => setPersonal(p => ({ ...p, aliyahDate: e.target.value || null }))}
            className={inputClass}
          />
        </div>
      </Section>

      <Section title="Pension / Epargne retraite">
        <div>
          <Label>Type de produit</Label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" className={radioClass} name="productType" value="keren_pensia" checked={pension.productType === 'keren_pensia'} onChange={() => setPension(p => ({ ...p, productType: 'keren_pensia' }))} />
              Keren Pensia
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" className={radioClass} name="productType" value="bituach_menahalim" checked={pension.productType === 'bituach_menahalim'} onChange={() => setPension(p => ({ ...p, productType: 'bituach_menahalim' }))} />
              Bituah Menahalim
            </label>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Employe tagmoulim %</Label>
            <input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={(pension.employeeTagmoulimRate * 100).toFixed(1)}
              onChange={e => setPension(p => ({ ...p, employeeTagmoulimRate: Number(e.target.value) / 100 }))}
              className={inputClass}
            />
          </div>
          <div>
            <Label>Employeur tagmoulim %</Label>
            <input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={(pension.employerTagmoulimRate * 100).toFixed(1)}
              onChange={e => setPension(p => ({ ...p, employerTagmoulimRate: Number(e.target.value) / 100 }))}
              className={inputClass}
            />
          </div>
          <div>
            <Label>Employeur pitsouim %</Label>
            <input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={(pension.employerPitsouimRate * 100).toFixed(1)}
              onChange={e => setPension(p => ({ ...p, employerPitsouimRate: Number(e.target.value) / 100 }))}
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">6% ou 8.33% (indemnite de licenciement)</p>
          </div>
        </div>

        <div className="border-t pt-3 mt-2">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
            <input type="checkbox" checked={keren.enabled} onChange={e => setKeren(k => ({ ...k, enabled: e.target.checked }))} className="accent-navy" />
            Keren Hishtalmout (Fonds de perfectionnement)
          </label>
          {keren.enabled && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <Label>Employe %</Label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={(keren.employeeRate * 100).toFixed(1)}
                  onChange={e => setKeren(k => ({ ...k, employeeRate: Number(e.target.value) / 100 }))}
                  className={inputClass}
                />
              </div>
              <div>
                <Label>Employeur %</Label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  step={0.5}
                  value={(keren.employerRate * 100).toFixed(1)}
                  onChange={e => setKeren(k => ({ ...k, employerRate: Number(e.target.value) / 100 }))}
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title="Charges indirectes (provisions)">
        <div>
          <Label>Anciennete (annees)</Label>
          <input
            type="number"
            min={0}
            max={50}
            value={indirect.seniority}
            onChange={e => setIndirect(i => ({ ...i, seniority: Number(e.target.value) }))}
            className={inputClass}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={indirect.includeHavara} onChange={e => setIndirect(i => ({ ...i, includeHavara: e.target.checked }))} className="accent-navy" />
          Dme havara (indemnite de convalescence)
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={indirect.includeHolidays} onChange={e => setIndirect(i => ({ ...i, includeHolidays: e.target.checked }))} className="accent-navy" />
          Conges annuels (houfsha shnatit)
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={indirect.includePublicHolidays} onChange={e => setIndirect(i => ({ ...i, includePublicHolidays: e.target.checked }))} className="accent-navy" />
          Jours feries legaux (hagim)
        </label>
      </Section>

      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <Label>Nom du client / salarie (pour PDF)</Label>
        <input
          type="text"
          value={clientName}
          onChange={e => setClientName(e.target.value)}
          placeholder="Ex: David Cohen"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-navy text-white font-semibold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 border-2 border-gold"
      >
        {loading ? 'Calcul en cours...' : 'Calculer'}
      </button>
    </form>
  );
}
