import { useMemo, useState } from 'react';
import {
  parseListingSheam,
  repartitionParType,
  type ResultatImport,
} from '../import/parseSheam';
import { importerListing, type ResultatEcriture } from '../lib/data';
import { ENCRE, ETAT } from '../lib/theme';
import { LIBELLES_TYPE } from '../lib/types';
import { Bouton, Carte, Erreur, NomHebreu, PastilleType, Tuile } from '../components/ui';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}`;
}

const EXEMPLE = `  ---------  -------------------  --- - -- ---  -- ---------- ----------- ------
       31/08/2026                     52 02 43 בנינגה נח ראובן  011152709
  MK   31/08/2026  29/06/2026      00 42 80 41 אילוז רות ו/או מיכאל  015285455
       31/08/2026                     62 04 41 עונג בית וגן בע"מ  514938976`;

export default function Import({
  annee,
  onImporte,
}: {
  annee: number;
  onImporte: () => Promise<void>;
}) {
  const [texte, setTexte] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ecriture, setEcriture] = useState<ResultatEcriture | null>(null);

  const resultat: ResultatImport = useMemo(() => parseListingSheam(texte), [texte]);
  const repartition = useMemo(() => repartitionParType(resultat.lignes), [resultat.lignes]);
  const deposes = resultat.lignes.filter((l) => l.dateDepot !== null).length;

  async function importer() {
    setEnCours(true);
    setErreur(null);
    setEcriture(null);
    try {
      const r = await importerListing(resultat.lignes, annee);
      setEcriture(r);
      await onImporte();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="space-y-6">
      <Carte
        titre="Import du listing des arkhot"
        soustitre={`שע"ם · רשימת התיקים הנכללים באורכות · année fiscale ${annee}`}
      >
        <p className="text-sm text-[#52514e] mb-3">
          Collez ici l'écran <span dir="rtl" lang="he">רשימת התיקים הנכללים באורכות לשנת המס</span>{' '}
          du portail מייצגים, page par page ou d'un seul bloc. Les en-têtes d'écran, filets et
          pieds de page sont ignorés automatiquement ; le sens de lecture des colonnes est détecté
          ligne par ligne.
        </p>

        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          rows={12}
          spellCheck={false}
          placeholder={EXEMPLE}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-xs font-mono leading-relaxed resize-y whitespace-pre overflow-x-auto"
          style={{ direction: 'ltr' }}
        />

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <Bouton
            variante="primaire"
            onClick={importer}
            disabled={resultat.lignes.length === 0 || enCours}
          >
            {enCours
              ? 'Import en cours…'
              : `Importer ${resultat.lignes.length} dossier${resultat.lignes.length > 1 ? 's' : ''}`}
          </Bouton>
          <Bouton variante="discret" onClick={() => { setTexte(''); setEcriture(null); setErreur(null); }}>
            Effacer
          </Bouton>
          <span className="text-xs text-[#898781]">
            Les statuts, priorités, notes et checklists déjà saisis au cabinet ne sont jamais
            écrasés.
          </span>
        </div>
      </Carte>

      {erreur && <Erreur message={erreur} />}

      {ecriture && (
        <div
          className="rounded-md px-4 py-3 text-sm"
          style={{ backgroundColor: `${ETAT.bon}0d`, color: ETAT.bon }}
        >
          <strong className="font-semibold">Import terminé — </strong>
          {ecriture.clientsCrees} client{ecriture.clientsCrees > 1 ? 's' : ''} créé
          {ecriture.clientsCrees > 1 ? 's' : ''}, {ecriture.clientsMisAJour} mis à jour ·{' '}
          {ecriture.declarationsCreees} déclaration{ecriture.declarationsCreees > 1 ? 's' : ''} créée
          {ecriture.declarationsCreees > 1 ? 's' : ''} avec leur checklist,{' '}
          {ecriture.declarationsMisesAJour} actualisée{ecriture.declarationsMisesAJour > 1 ? 's' : ''}.
        </div>
      )}

      {texte.trim() !== '' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Tuile libelle="Dossiers lus" valeur={resultat.lignes.length} />
            <Tuile
              libelle="Déjà déposés"
              valeur={deposes}
              accent={ETAT.bon}
              detail="dépôt constaté chez שע״ם"
            />
            <Tuile
              libelle="Répartition"
              valeur={
                <span className="text-xl">
                  {repartition.individu} / {repartition.societe} / {repartition.amouta}
                </span>
              }
              detail="individus / sociétés / amoutot"
            />
            <Tuile
              libelle="Lignes ignorées"
              valeur={resultat.ignorees.length}
              accent={resultat.ignorees.length > 0 ? ETAT.critique : undefined}
              detail={resultat.doublons.length > 0 ? `dont ${resultat.doublons.length} doublon(s)` : undefined}
            />
          </div>

          {resultat.ignorees.length > 0 && (
            <Carte titre="Lignes non reconnues" soustitre="À vérifier avant de valider l'import">
              <ul className="space-y-2 text-xs">
                {resultat.ignorees.map((i) => (
                  <li key={i.numeroLigne} className="border-l-2 pl-3" style={{ borderColor: ETAT.critique }}>
                    <div className="text-[#52514e]">
                      Ligne {i.numeroLigne} — {i.raison}
                    </div>
                    <code className="block mt-0.5 font-mono text-[#898781] whitespace-pre-wrap break-all">
                      {i.contenu}
                    </code>
                  </li>
                ))}
              </ul>
            </Carte>
          )}

          {resultat.lignes.length > 0 && (
            <Carte
              titre="Aperçu"
              soustitre="Contrôlez les colonnes avant d'écrire en base"
            >
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-sm min-w-[48rem]">
                  <thead>
                    <tr className="text-[#52514e] border-b text-left" style={{ borderColor: ENCRE.ligne }}>
                      <th className="font-medium py-2 px-3">תיק</th>
                      <th className="font-medium py-2 px-3">Nom</th>
                      <th className="font-medium py-2 px-3">Type</th>
                      <th className="font-medium py-2 px-3">פ.ש</th>
                      <th className="font-medium py-2 px-3">סוג תיק</th>
                      <th className="font-medium py-2 px-3">Arkha</th>
                      <th className="font-medium py-2 px-3">Dépôt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultat.lignes.map((l) => (
                      <tr key={l.tik} className="border-b" style={{ borderColor: ENCRE.grille }}>
                        <td className="py-1.5 px-3 tabular-nums text-[#52514e]">{l.tik}</td>
                        <td className="py-1.5 px-3 max-w-[16rem]">
                          <NomHebreu nom={l.nom} className="truncate max-w-full" />
                        </td>
                        <td className="py-1.5 px-3">
                          <PastilleType type={l.type} />
                        </td>
                        <td className="py-1.5 px-3 tabular-nums">{l.pakidShuma ?? '—'}</td>
                        <td className="py-1.5 px-3 tabular-nums">{l.sugTik ?? '—'}</td>
                        <td className="py-1.5 px-3 tabular-nums">{formatDate(l.arkhaLegale)}</td>
                        <td
                          className="py-1.5 px-3 tabular-nums"
                          style={{ color: l.dateDepot ? ETAT.bon : undefined }}
                        >
                          {formatDate(l.dateDepot)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-xs text-[#898781]">
                Types déduits du סוג תיק :{' '}
                {(['individu', 'societe', 'amouta'] as const)
                  .map((t) => `${LIBELLES_TYPE[t].fr} ${repartition[t]}`)
                  .join(' · ')}
                . Les מלכ״רים sont mesurés avec les sociétés sous חבר בני אדם.
              </p>
            </Carte>
          )}
        </>
      )}
    </div>
  );
}
