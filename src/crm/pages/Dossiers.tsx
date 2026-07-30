import { useMemo, useState } from 'react';
import { LIBELLES_POPULATION, populationDe, type Population } from '../rules/arkhot';
import { COULEUR_STATUT, ENCRE, ETAT } from '../lib/theme';
import {
  LIBELLES_PRIORITE,
  LIBELLES_STATUT,
  LIBELLES_TYPE,
  ORDRE_STATUT,
  type Dossier,
  type Priorite,
  type StatutDeclaration,
  type TypeClient,
} from '../lib/types';
import type { PatchDeclaration } from '../lib/data';
import { Bouton, Carte, NomHebreu, PastilleStatut, PastilleType, Vide } from '../components/ui';

type Colonne = 'nom' | 'tik' | 'type' | 'pakid' | 'arkha' | 'statut' | 'avancement' | 'mois';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}`;
}

function formatMois(mois: string | null | undefined): string {
  if (!mois) return '—';
  const [a, m] = mois.split('-');
  const noms = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
  return `${noms[Number(m) - 1]} ${a}`;
}

// ---------------------------------------------------------------------
// Panneau latéral
// ---------------------------------------------------------------------

function PanneauDossier({
  dossier,
  moisPossibles,
  onFermer,
  onPatch,
  onTache,
}: {
  dossier: Dossier;
  moisPossibles: string[];
  onFermer: () => void;
  onPatch: (patch: PatchDeclaration) => void;
  onTache: (id: string, fait: boolean) => void;
}) {
  const [notes, setNotes] = useState(dossier.notes ?? '');
  const notesModifiees = notes !== (dossier.notes ?? '');

  return (
    <aside className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-black/10 shadow-2xl z-30 flex flex-col">
      <header className="px-5 py-4 border-b border-black/10 bg-navy text-white flex items-start justify-between gap-3">
        <div className="min-w-0">
          <NomHebreu nom={dossier.client.nom_he} className="text-base font-semibold" />
          {dossier.client.nom_fr && (
            <p className="text-sm text-gold/90">{dossier.client.nom_fr}</p>
          )}
          <p className="text-xs text-white/60 tabular-nums mt-0.5">
            תיק {dossier.tik} · פ.ש {dossier.client.pakid_shuma ?? '—'} · סוג תיק{' '}
            {dossier.client.sug_tik ?? '—'}
          </p>
        </div>
        <button
          onClick={onFermer}
          className="text-white/70 hover:text-white text-xl leading-none flex-shrink-0"
          aria-label="Fermer le panneau"
        >
          ×
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Statut, priorité, mois cible */}
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-[#52514e] uppercase tracking-wide">Statut</span>
            <select
              value={dossier.statut}
              onChange={(e) => onPatch({ statut: e.target.value as StatutDeclaration })}
              className="mt-1 w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white"
            >
              {ORDRE_STATUT.map((s) => (
                <option key={s} value={s}>
                  {LIBELLES_STATUT[s].fr}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[#52514e] uppercase tracking-wide">
              Priorité
            </span>
            <select
              value={dossier.priorite ?? 'normale'}
              onChange={(e) => onPatch({ priorite: e.target.value as Priorite })}
              className="mt-1 w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white"
            >
              {(['haute', 'normale', 'basse'] as Priorite[]).map((p) => (
                <option key={p} value={p}>
                  {LIBELLES_PRIORITE[p]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[#52514e] uppercase tracking-wide">
              Mois cible
            </span>
            <select
              value={dossier.moisCible ?? ''}
              onChange={(e) => onPatch({ moisCible: e.target.value || null })}
              className="mt-1 w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white"
            >
              <option value="">Non planifié</option>
              {moisPossibles.map((m) => (
                <option key={m} value={m}>
                  {formatMois(m)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[#52514e] uppercase tracking-wide">
              Date de dépôt
            </span>
            <input
              type="date"
              value={dossier.dateDepot ?? ''}
              disabled={dossier.statut !== 'depose'}
              onChange={(e) => onPatch({ dateDepot: e.target.value || null })}
              className="mt-1 w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white disabled:bg-black/5 disabled:text-[#898781]"
            />
          </label>
        </div>

        <dl className="grid grid-cols-2 gap-y-2 text-sm border-y border-black/5 py-3">
          <dt className="text-[#52514e]">תאריך ארכה</dt>
          <dd className="text-right tabular-nums font-medium">{formatDate(dossier.arkhaLegale)}</dd>
          <dt className="text-[#52514e]">Population</dt>
          <dd className="text-right">{LIBELLES_POPULATION[dossier.population].fr}</dd>
          <dt className="text-[#52514e]">Type</dt>
          <dd className="text-right">{LIBELLES_TYPE[dossier.client.type].fr}</dd>
        </dl>

        {/* Checklist */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-xs font-semibold text-navy uppercase tracking-wide">Checklist</h3>
            <span className="text-xs text-[#52514e] tabular-nums">
              {dossier.tachesFaites} / {dossier.tachesTotal}
            </span>
          </div>
          {dossier.taches.length === 0 ? (
            <p className="text-sm text-[#898781]">Aucune tâche pour ce dossier.</p>
          ) : (
            <ul className="space-y-1">
              {dossier.taches.map((t) => (
                <li key={t.id}>
                  <label className="flex items-start gap-2.5 py-1 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={t.fait}
                      onChange={(e) => onTache(t.id, e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-black/25 accent-[#0ca30c] flex-shrink-0"
                    />
                    <span
                      className={`text-sm leading-snug ${
                        t.fait ? 'text-[#898781] line-through' : 'text-[#0b0b0b]'
                      }`}
                    >
                      {t.libelle}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notes */}
        <div>
          <h3 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Pièces manquantes, points d'attention, échanges avec le client…"
            className="w-full rounded-md border border-black/15 px-2.5 py-2 text-sm resize-y"
          />
          {notesModifiees && (
            <div className="mt-2 flex gap-2">
              <Bouton variante="primaire" onClick={() => onPatch({ notes: notes || null })}>
                Enregistrer
              </Bouton>
              <Bouton variante="discret" onClick={() => setNotes(dossier.notes ?? '')}>
                Annuler
              </Bouton>
            </div>
          )}
        </div>

        {/* Historique */}
        <div>
          <h3 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">
            Historique
          </h3>
          <ul className="text-xs text-[#52514e] space-y-1.5">
            {dossier.dateDepot && (
              <li className="flex justify-between gap-3">
                <span>Déposé auprès de רשות המסים</span>
                <span className="tabular-nums">{formatDate(dossier.dateDepot)}</span>
              </li>
            )}
            {dossier.arkhaLegale && (
              <li className="flex justify-between gap-3">
                <span>Arkha accordée</span>
                <span className="tabular-nums">{formatDate(dossier.arkhaLegale)}</span>
              </li>
            )}
            {dossier.moisCible && (
              <li className="flex justify-between gap-3">
                <span>Dépôt planifié</span>
                <span className="tabular-nums">{formatMois(dossier.moisCible)}</span>
              </li>
            )}
            {dossier.updatedAt && (
              <li className="flex justify-between gap-3">
                <span>Dernière modification</span>
                <span className="tabular-nums">{formatDate(dossier.updatedAt.slice(0, 10))}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------
// Écran
// ---------------------------------------------------------------------

export default function Dossiers({
  dossiers,
  moisPossibles,
  onPatch,
  onTache,
}: {
  dossiers: Dossier[];
  moisPossibles: string[];
  onPatch: (id: string, patch: PatchDeclaration) => void;
  onTache: (id: string, fait: boolean) => void;
}) {
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<StatutDeclaration | 'tous'>('tous');
  const [filtreType, setFiltreType] = useState<TypeClient | 'tous'>('tous');
  const [filtrePopulation, setFiltrePopulation] = useState<Population | 'toutes'>('toutes');
  const [filtrePakid, setFiltrePakid] = useState<string>('tous');
  const [tri, setTri] = useState<{ colonne: Colonne; sens: 1 | -1 }>({
    colonne: 'arkha',
    sens: 1,
  });
  const [selection, setSelection] = useState<string | null>(null);

  const pakidShumas = useMemo(
    () =>
      [...new Set(dossiers.map((d) => d.client.pakid_shuma ?? '—'))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [dossiers],
  );

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return dossiers.filter((d) => {
      if (filtreStatut !== 'tous' && d.statut !== filtreStatut) return false;
      if (filtreType !== 'tous' && d.client.type !== filtreType) return false;
      if (filtrePopulation !== 'toutes' && populationDe(d.client.type) !== filtrePopulation)
        return false;
      if (filtrePakid !== 'tous' && (d.client.pakid_shuma ?? '—') !== filtrePakid) return false;
      if (q) {
        const cible = [d.tik, d.client.nom_he, d.client.nom_fr ?? '', d.notes ?? '']
          .join(' ')
          .toLowerCase();
        if (!cible.includes(q)) return false;
      }
      return true;
    });
  }, [dossiers, recherche, filtreStatut, filtreType, filtrePopulation, filtrePakid]);

  const triees = useMemo(() => {
    const cle = (d: Dossier): string | number => {
      switch (tri.colonne) {
        case 'nom': return d.client.nom_he;
        case 'tik': return d.tik;
        case 'type': return d.client.type;
        case 'pakid': return d.client.pakid_shuma ?? '';
        case 'arkha': return d.arkhaLegale ?? '9999-12-31';
        case 'statut': return ORDRE_STATUT.indexOf(d.statut);
        case 'avancement': return d.avancement ?? 0;
        case 'mois': return d.moisCible ?? '9999-99';
      }
    };
    return [...filtres].sort((a, b) => {
      const va = cle(a);
      const vb = cle(b);
      const c =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), 'he');
      return c * tri.sens;
    });
  }, [filtres, tri]);

  const dossierSelectionne = dossiers.find((d) => d.id === selection) ?? null;

  function basculerTri(colonne: Colonne) {
    setTri((t) => (t.colonne === colonne ? { colonne, sens: t.sens === 1 ? -1 : 1 } : { colonne, sens: 1 }));
  }

  function EnTete({ colonne, children, align = 'left' }: { colonne: Colonne; children: React.ReactNode; align?: 'left' | 'right' }) {
    const actif = tri.colonne === colonne;
    return (
      <th className={`font-medium py-2 px-3 ${align === 'right' ? 'text-right' : 'text-left'}`}>
        <button
          onClick={() => basculerTri(colonne)}
          className={`inline-flex items-center gap-1 hover:text-navy ${actif ? 'text-navy font-semibold' : ''}`}
        >
          {children}
          <span aria-hidden="true" className="text-[10px]">
            {actif ? (tri.sens === 1 ? '▲' : '▼') : ''}
          </span>
        </button>
      </th>
    );
  }

  const selectStyle =
    'rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-[#0b0b0b]';

  return (
    <>
      <Carte
        titre="Dossiers"
        soustitre={`${triees.length} sur ${dossiers.length} dossiers`}
        className="mb-6"
      >
        {/* Filtres : une seule rangée au-dessus du tableau */}
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Nom, תיק, notes…"
            className={`${selectStyle} flex-1 min-w-[12rem]`}
          />
          <select
            value={filtrePopulation}
            onChange={(e) => setFiltrePopulation(e.target.value as Population | 'toutes')}
            className={selectStyle}
          >
            <option value="toutes">Toutes populations</option>
            <option value="yehidim">{LIBELLES_POPULATION.yehidim.fr}</option>
            <option value="haver_bnei_adam">{LIBELLES_POPULATION.haver_bnei_adam.fr}</option>
          </select>
          <select
            value={filtreType}
            onChange={(e) => setFiltreType(e.target.value as TypeClient | 'tous')}
            className={selectStyle}
          >
            <option value="tous">Tous types</option>
            {(['individu', 'societe', 'amouta'] as TypeClient[]).map((t) => (
              <option key={t} value={t}>
                {LIBELLES_TYPE[t].fr}
              </option>
            ))}
          </select>
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value as StatutDeclaration | 'tous')}
            className={selectStyle}
          >
            <option value="tous">Tous statuts</option>
            {ORDRE_STATUT.map((s) => (
              <option key={s} value={s}>
                {LIBELLES_STATUT[s].fr}
              </option>
            ))}
          </select>
          <select
            value={filtrePakid}
            onChange={(e) => setFiltrePakid(e.target.value)}
            className={selectStyle}
          >
            <option value="tous">Tous פ.ש</option>
            {pakidShumas.map((p) => (
              <option key={p} value={p}>
                פ.ש {p}
              </option>
            ))}
          </select>
        </div>

        {triees.length === 0 ? (
          <Vide texte="Aucun dossier ne correspond à ces filtres." />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm min-w-[56rem]">
              <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.08)]">
                <tr className="text-[#52514e]">
                  <EnTete colonne="nom">Client</EnTete>
                  <EnTete colonne="tik">תיק</EnTete>
                  <EnTete colonne="type">Type</EnTete>
                  <EnTete colonne="pakid">פ.ש</EnTete>
                  <EnTete colonne="arkha">Arkha</EnTete>
                  <EnTete colonne="mois">Mois cible</EnTete>
                  <EnTete colonne="avancement" align="right">Checklist</EnTete>
                  <EnTete colonne="statut">Statut</EnTete>
                </tr>
              </thead>
              <tbody>
                {triees.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => setSelection(d.id)}
                    className={`border-b cursor-pointer hover:bg-navy/[0.03] ${
                      selection === d.id ? 'bg-gold/10' : ''
                    }`}
                    style={{ borderColor: ENCRE.grille }}
                  >
                    <td className="py-2 px-3 max-w-[16rem]">
                      <NomHebreu nom={d.client.nom_he} className="truncate max-w-full" />
                      {d.client.nom_fr && (
                        <span className="block text-xs text-[#898781] truncate">
                          {d.client.nom_fr}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 tabular-nums text-[#52514e]">{d.tik}</td>
                    <td className="py-2 px-3">
                      <PastilleType type={d.client.type} />
                    </td>
                    <td className="py-2 px-3 tabular-nums text-[#52514e]">
                      {d.client.pakid_shuma ?? '—'}
                    </td>
                    <td className="py-2 px-3 tabular-nums">{formatDate(d.arkhaLegale)}</td>
                    <td className="py-2 px-3 text-[#52514e]">{formatMois(d.moisCible)}</td>
                    <td className="py-2 px-3 text-right">
                      <span className="tabular-nums text-xs text-[#52514e]">
                        {d.tachesFaites}/{d.tachesTotal}
                      </span>
                      <span
                        className="ml-2 inline-block w-10 h-1.5 rounded-full align-middle"
                        style={{ backgroundColor: ENCRE.grille }}
                        aria-hidden="true"
                      >
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${(d.avancement ?? 0) * 100}%`,
                            backgroundColor: ETAT.bon,
                          }}
                        />
                      </span>
                    </td>
                    <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                      {/* Édition du statut en ligne */}
                      <select
                        value={d.statut}
                        onChange={(e) => onPatch(d.id, { statut: e.target.value as StatutDeclaration })}
                        className="rounded border border-transparent hover:border-black/15 bg-transparent px-1 py-0.5 text-xs cursor-pointer"
                        style={{ color: COULEUR_STATUT[d.statut] }}
                        aria-label={`Statut de ${d.client.nom_he}`}
                      >
                        {ORDRE_STATUT.map((s) => (
                          <option key={s} value={s} className="text-[#0b0b0b]">
                            {LIBELLES_STATUT[s].fr}
                          </option>
                        ))}
                      </select>
                      <span className="sr-only">
                        <PastilleStatut statut={d.statut} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>

      {dossierSelectionne && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-20"
            onClick={() => setSelection(null)}
            aria-hidden="true"
          />
          <PanneauDossier
            dossier={dossierSelectionne}
            moisPossibles={moisPossibles}
            onFermer={() => setSelection(null)}
            onPatch={(patch) => onPatch(dossierSelectionne.id, patch)}
            onTache={onTache}
          />
        </>
      )}
    </>
  );
}
