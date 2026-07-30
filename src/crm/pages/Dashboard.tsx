import { useMemo } from 'react';
import {
  etatCampagne,
  LIBELLES_POPULATION,
  type EtatPopulation,
  type Palier,
} from '../rules/arkhot';
import { COULEUR_STATUT, couleurProgression, ENCRE, ETAT, MARQUE } from '../lib/theme';
import { LIBELLES_STATUT, ORDRE_STATUT, type Dossier } from '../lib/types';
import { BarresHorizontales, Carte, Jauge, Tuile, Vide } from '../components/ui';

function formatDate(iso: string): string {
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}`;
}

// ---------------------------------------------------------------------
// Progression d'une population face à ses trois paliers
// ---------------------------------------------------------------------

function CartePopulation({ etat }: { etat: EtatPopulation }) {
  const libelle = LIBELLES_POPULATION[etat.population];
  const prochain = etat.prochainPalier;

  return (
    <Carte
      titre={libelle.fr}
      soustitre={`${etat.effectif} dossiers mesurés · ${etat.deposes} déposés`}
      actions={
        <span dir="rtl" lang="he" className="text-sm text-[#52514e]">
          {libelle.he}
        </span>
      }
    >
      <div className="space-y-5">
        {etat.paliers.map((p) => {
          const couleur = couleurProgression(p.progression, p.tenu);
          return (
            <div key={p.palier.dateLimite}>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-navy tabular-nums">
                    {p.palier.pourcentage} %
                  </span>
                  <span className="text-xs text-[#52514e] tabular-nums">
                    {formatDate(p.palier.dateLimite)}
                  </span>
                  {p.echu && (
                    <span className="text-[11px] text-[#898781] uppercase tracking-wide">échu</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums text-[#0b0b0b]">
                    {p.deposes} / {p.quotaRequis}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: couleur }}
                    aria-hidden="true"
                  >
                    {p.tenu ? '✓' : `−${p.ecart}`}
                  </span>
                </div>
              </div>
              <Jauge valeur={p.deposes} total={p.quotaRequis} couleur={couleur} />
              <p className="mt-1 text-xs text-[#52514e]">
                {p.tenu
                  ? 'Quota atteint'
                  : `${p.ecart} dossier${p.ecart > 1 ? 's' : ''} à déposer pour tenir ce palier`}
              </p>
            </div>
          );
        })}

        <div className="pt-3 border-t border-black/5 text-sm">
          {prochain ? (
            <p className="text-[#52514e]">
              Prochain palier{' '}
              <strong className="text-navy">
                {prochain.palier.pourcentage} % le {formatDate(prochain.palier.dateLimite)}
              </strong>{' '}
              — dans {etat.joursRestants} jours,{' '}
              {prochain.tenu ? (
                <span style={{ color: ETAT.bon }} className="font-medium">
                  déjà tenu
                </span>
              ) : (
                <span
                  style={{ color: couleurProgression(prochain.progression, false) }}
                  className="font-medium"
                >
                  {prochain.ecart} dossier{prochain.ecart > 1 ? 's' : ''} manquant
                  {prochain.ecart > 1 ? 's' : ''}
                </span>
              )}
              .
            </p>
          ) : (
            <p className="text-[#52514e]">Campagne terminée pour cette population.</p>
          )}
        </div>
      </div>
    </Carte>
  );
}

// ---------------------------------------------------------------------
// Écran
// ---------------------------------------------------------------------

export default function Dashboard({
  dossiers,
  paliers,
  annee,
  aujourdhui,
}: {
  dossiers: Dossier[];
  paliers: Palier[];
  annee: number;
  aujourdhui: string;
}) {
  const etats = useMemo(
    () => etatCampagne(dossiers, paliers, annee, aujourdhui),
    [dossiers, paliers, annee, aujourdhui],
  );

  const parStatut = useMemo(
    () =>
      ORDRE_STATUT.map((s) => ({
        cle: s,
        libelle: LIBELLES_STATUT[s].fr,
        valeur: dossiers.filter((d) => d.statut === s).length,
        couleur: COULEUR_STATUT[s],
      })).filter((d) => d.valeur > 0),
    [dossiers],
  );

  const parPakidShuma = useMemo(() => {
    const compte = new Map<string, { total: number; deposes: number }>();
    for (const d of dossiers) {
      const ps = d.client.pakid_shuma ?? '—';
      const c = compte.get(ps) ?? { total: 0, deposes: 0 };
      c.total++;
      if (d.statut === 'depose') c.deposes++;
      compte.set(ps, c);
    }
    return [...compte.entries()]
      .map(([ps, c]) => ({
        cle: ps,
        libelle: `פ.ש ${ps}`,
        valeur: c.total,
        deposes: c.deposes,
      }))
      .sort((a, b) => b.valeur - a.valeur);
  }, [dossiers]);

  const maxParPakid = Math.max(1, ...parPakidShuma.map((p) => p.valeur));

  const total = dossiers.length;
  const deposes = dossiers.filter((d) => d.statut === 'depose').length;
  const enRetard = etats.reduce((n, e) => n + e.ecartProchainPalier, 0);
  const sansPlanning = dossiers.filter(
    (d) => d.statut !== 'depose' && d.statut !== 'hors_perimetre' && !d.moisCible,
  ).length;

  const prochaineEcheance = etats
    .map((e) => e.prochainPalier)
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => a.palier.dateLimite.localeCompare(b.palier.dateLimite))[0];

  if (total === 0) {
    return (
      <Carte titre={`Campagne ${annee}`}>
        <Vide texte='Aucun dossier pour cette année fiscale. Commencez par importer le listing des arkhot depuis שע"ם.' />
      </Carte>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tuile
          libelle="Dossiers suivis"
          valeur={total}
          detail={`${dossiers.filter((d) => d.statut === 'hors_perimetre').length} hors périmètre`}
        />
        <Tuile
          libelle="Déposés"
          valeur={deposes}
          accent={ETAT.bon}
          detail={`${total > 0 ? Math.round((deposes / total) * 100) : 0} % du portefeuille`}
        />
        <Tuile
          libelle="Écart aux prochains paliers"
          valeur={enRetard}
          accent={enRetard > 0 ? ETAT.critique : ETAT.bon}
          detail={
            enRetard > 0
              ? 'dossiers à déposer, toutes populations'
              : 'les deux populations sont à jour'
          }
        />
        <Tuile
          libelle="Prochaine échéance"
          valeur={
            prochaineEcheance ? (
              <span className="text-2xl">{formatDate(prochaineEcheance.palier.dateLimite)}</span>
            ) : (
              '—'
            )
          }
          detail={
            prochaineEcheance
              ? `${LIBELLES_POPULATION[prochaineEcheance.palier.population].fr} · ${prochaineEcheance.palier.pourcentage} %`
              : 'campagne terminée'
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {etats.map((e) => (
          <CartePopulation key={e.population} etat={e} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Carte
          titre="Répartition par statut"
          soustitre={`${sansPlanning} dossier${sansPlanning > 1 ? 's' : ''} actif${sansPlanning > 1 ? 's' : ''} sans mois cible`}
        >
          <BarresHorizontales donnees={parStatut} />
        </Carte>

        <Carte
          titre="Dossiers par פקיד שומה"
          soustitre={`Portefeuille réparti sur ${parPakidShuma.length} bureaux de taxation`}
        >
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#898781] text-left border-b" style={{ borderColor: ENCRE.ligne }}>
                <th className="font-medium py-1.5 w-20">
                  <bdi dir="rtl" lang="he">פקיד שומה</bdi>
                </th>
                <th className="font-medium py-1.5">Dossiers</th>
                <th className="font-medium py-1.5 text-right w-16">Total</th>
                <th className="font-medium py-1.5 text-right w-16">Déposés</th>
              </tr>
            </thead>
            <tbody>
              {parPakidShuma.map((p) => (
                <tr key={p.cle} className="border-b" style={{ borderColor: ENCRE.grille }}>
                  <td className="py-1.5 tabular-nums text-[#52514e]">{p.cle}</td>
                  <td className="py-1.5 pr-3">
                    <span
                      className="block h-3 rounded-r"
                      style={{
                        width: `${(p.valeur / maxParPakid) * 100}%`,
                        backgroundColor: MARQUE.navy,
                        minWidth: 2,
                      }}
                      aria-hidden="true"
                    />
                  </td>
                  <td className="py-1.5 text-right tabular-nums font-medium">{p.valeur}</td>
                  <td className="py-1.5 text-right tabular-nums" style={{ color: p.deposes > 0 ? ETAT.bon : undefined }}>
                    {p.deposes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Carte>
      </div>
    </div>
  );
}
