import { useMemo, useState } from 'react';
import {
  autoRepartition,
  LIBELLES_POPULATION,
  projectionMensuelle,
  type MoisProjection,
  type Palier,
  type Population,
} from '../rules/arkhot';
import { COULEUR_PLANNING, ENCRE, ETAT, MARQUE } from '../lib/theme';
import type { Dossier } from '../lib/types';
import { Bouton, Carte } from '../components/ui';

const MOIS_COURTS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

function formatMois(mois: string): string {
  const [a, m] = mois.split('-');
  return `${MOIS_COURTS[Number(m) - 1]} ${a.slice(2)}`;
}

function formatDate(iso: string): string {
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}`;
}

// ---------------------------------------------------------------------
// Graphe : cumul planifié face au minimum exigé
// ---------------------------------------------------------------------

function GrapheProjection({
  projection,
  effectif,
  moisCourant,
}: {
  projection: MoisProjection[];
  effectif: number;
  moisCourant: string;
}) {
  const [survol, setSurvol] = useState<string | null>(null);

  const H = 220;
  const GOUTTIERE = 32; // place des graduations, à gauche du tracé
  const max = Math.max(effectif, ...projection.map((p) => p.objectifCumule)) || 1;

  const largeurColonne = 100 / projection.length;
  const cx = (i: number) => (i + 0.5) * largeurColonne;

  // Le SVG est étiré horizontalement : seuls les tracés y vivent. Les
  // marqueurs sont posés en HTML pour rester ronds.
  const ligne = (cle: 'minimumExige' | 'objectifCumule') =>
    projection.map((p, i) => `${i === 0 ? 'M' : 'L'} ${cx(i)} ${H - (p[cle] / max) * H}`).join(' ');

  const survole = projection.find((p) => p.mois === survol) ?? null;
  const graduations = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative">
      <div className="flex">
        {/* Graduations */}
        <div className="relative flex-shrink-0" style={{ width: GOUTTIERE, height: H }}>
          {graduations.map((f) => (
            <span
              key={f}
              className="absolute right-2 text-[10px] tabular-nums text-[#898781] -translate-y-1/2"
              style={{ top: `${(1 - f) * 100}%` }}
            >
              {Math.round(f * max)}
            </span>
          ))}
        </div>

        <div className="relative flex-1" style={{ height: H }}>
          {/* Grille */}
          {graduations.map((f) => (
            <div
              key={f}
              className="absolute left-0 right-0"
              style={{
                top: `${(1 - f) * 100}%`,
                borderTop: `1px solid ${f === 0 ? ENCRE.ligne : ENCRE.grille}`,
              }}
              aria-hidden="true"
            />
          ))}

          {/* Barres : cumul planifié */}
          <div className="absolute inset-0 flex items-end gap-1">
            {projection.map((p) => (
              <div
                key={p.mois}
                className="flex-1 flex justify-center items-end h-full"
                onMouseEnter={() => setSurvol(p.mois)}
                onMouseLeave={() => setSurvol(null)}
              >
                <div
                  className="w-full max-w-[3.5rem] rounded-t transition-[height] duration-500"
                  style={{
                    height: `${(p.planifieCumule / max) * 100}%`,
                    backgroundColor: COULEUR_PLANNING.planifie,
                    opacity: survol && survol !== p.mois ? 0.5 : 1,
                    minHeight: p.planifieCumule > 0 ? 2 : 0,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Lignes de seuil */}
          <svg
            viewBox={`0 0 100 ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <path
              d={ligne('objectifCumule')}
              fill="none"
              stroke={COULEUR_PLANNING.objectif}
              strokeWidth="2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={ligne('minimumExige')}
              fill="none"
              stroke={COULEUR_PLANNING.minimum}
              strokeWidth="2"
              strokeDasharray="5 3"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Marqueurs de palier — en HTML, donc parfaitement ronds */}
          {projection.map((p, i) =>
            p.palier ? (
              <span
                key={p.mois}
                className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${cx(i)}%`,
                  top: `${(1 - p.minimumExige / max) * 100}%`,
                  backgroundColor: COULEUR_PLANNING.minimum,
                  boxShadow: `0 0 0 2px ${MARQUE.surface}`,
                }}
                aria-hidden="true"
              />
            ) : null,
          )}
        </div>
      </div>

      {/* Axe des mois */}
      <div className="flex mt-1.5" style={{ paddingLeft: GOUTTIERE }}>
        {projection.map((p) => (
          <div
            key={p.mois}
            className="flex-1 text-center"
            onMouseEnter={() => setSurvol(p.mois)}
            onMouseLeave={() => setSurvol(null)}
          >
            <div
              className={`text-[11px] tabular-nums ${
                p.mois === moisCourant ? 'font-semibold text-navy' : 'text-[#898781]'
              }`}
            >
              {formatMois(p.mois)}
            </div>
            {p.palier && (
              <div className="text-[10px] font-medium" style={{ color: COULEUR_PLANNING.minimum }}>
                {p.palier.pourcentage} %
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Infobulle */}
      {survole && (
        <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-navy text-white text-xs rounded-md px-3 py-2 shadow-lg">
            <div className="font-semibold mb-1">{formatMois(survole.mois)}</div>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 tabular-nums">
              <span className="text-white/70">Cumul planifié</span>
              <span className="text-right">{survole.planifieCumule}</span>
              <span className="text-white/70">dont déposés</span>
              <span className="text-right">{survole.deposesCumules}</span>
              <span className="text-white/70">Objectif</span>
              <span className="text-right">{survole.objectifCumule}</span>
              <span className="text-white/70">Minimum légal</span>
              <span className="text-right">{survole.minimumExige}</span>
              {survole.manque > 0 && (
                <>
                  <span className="text-gold">Manque</span>
                  <span className="text-right text-gold">{survole.manque}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-[#52514e]">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: COULEUR_PLANNING.planifie }}
            aria-hidden="true"
          />
          Cumul planifié
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-4 h-0.5"
            style={{ backgroundColor: COULEUR_PLANNING.objectif }}
            aria-hidden="true"
          />
          Objectif (minimum + marge)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-4 h-0.5"
            style={{
              backgroundImage: `repeating-linear-gradient(to right, ${COULEUR_PLANNING.minimum} 0 4px, transparent 4px 7px)`,
            }}
            aria-hidden="true"
          />
          Minimum légal (hesder)
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Bloc par population
// ---------------------------------------------------------------------

function BlocPopulation({
  population,
  dossiers,
  paliers,
  annee,
  aujourdhui,
  margeSecurite,
  onRepartir,
  enCours,
}: {
  population: Population;
  dossiers: Dossier[];
  paliers: Palier[];
  annee: number;
  aujourdhui: string;
  margeSecurite: number;
  onRepartir: (population: Population) => void;
  enCours: boolean;
}) {
  const projection = useMemo(
    () =>
      projectionMensuelle(dossiers, paliers, annee, population, {
        margeSecurite,
        aujourdhui,
      }),
    [dossiers, paliers, annee, population, margeSecurite, aujourdhui],
  );

  const effectif = dossiers.filter(
    (d) => d.population === population && d.statut !== 'hors_perimetre',
  ).length;

  const moisCourant = aujourdhui.slice(0, 7);
  const libelle = LIBELLES_POPULATION[population];
  const totalManque = projection.reduce((n, p) => Math.max(n, p.manque), 0);

  if (projection.length === 0) {
    return (
      <Carte titre={libelle.fr}>
        <p className="text-sm text-[#898781]">
          Aucun palier défini pour cette population en {annee}.
        </p>
      </Carte>
    );
  }

  return (
    <Carte
      titre={libelle.fr}
      soustitre={`${effectif} dossiers · projection ${formatMois(projection[0].mois)} → ${formatMois(
        projection[projection.length - 1].mois,
      )}`}
      actions={
        <Bouton variante="primaire" onClick={() => onRepartir(population)} disabled={enCours}>
          {enCours ? 'Répartition…' : 'Auto-répartir'}
        </Bouton>
      }
    >
      {totalManque > 0 ? (
        <div
          className="mb-4 rounded-md px-3 py-2 text-sm flex items-start gap-2"
          style={{ backgroundColor: `${ETAT.critique}0d`, color: ETAT.critique }}
        >
          <span aria-hidden="true">⚠</span>
          <span>
            Le planning actuel laisse un déficit maximal de <strong>{totalManque}</strong> dossier
            {totalManque > 1 ? 's' : ''} face à l'objectif. L'auto-répartition comble l'écart en
            priorisant les dossiers les plus avancés.
          </span>
        </div>
      ) : (
        <div
          className="mb-4 rounded-md px-3 py-2 text-sm flex items-start gap-2"
          style={{ backgroundColor: `${ETAT.bon}0d`, color: ETAT.bon }}
        >
          <span aria-hidden="true">✓</span>
          <span>Le planning couvre l'objectif sur tous les mois de la campagne.</span>
        </div>
      )}

      <GrapheProjection projection={projection} effectif={effectif} moisCourant={moisCourant} />

      {/* Vue tableau — relief du contraste et lecture chiffrée */}
      <div className="overflow-x-auto mt-6">
        <table className="w-full text-xs min-w-[36rem]">
          <thead>
            <tr className="text-[#52514e] border-b" style={{ borderColor: ENCRE.ligne }}>
              <th className="font-medium py-2 px-2 text-left">Mois</th>
              <th className="font-medium py-2 px-2 text-right">Dépôts du mois</th>
              <th className="font-medium py-2 px-2 text-right">Cumul planifié</th>
              <th className="font-medium py-2 px-2 text-right">Objectif</th>
              <th className="font-medium py-2 px-2 text-right">Minimum légal</th>
              <th className="font-medium py-2 px-2 text-right">Écart</th>
              <th className="font-medium py-2 pl-4 text-left">Palier</th>
            </tr>
          </thead>
          <tbody>
            {projection.map((p) => (
              <tr
                key={p.mois}
                className={`border-b ${p.mois === moisCourant ? 'bg-gold/5' : ''}`}
                style={{ borderColor: ENCRE.grille }}
              >
                <td className="py-1.5 px-2 font-medium text-navy">{formatMois(p.mois)}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{p.planifieDuMois}</td>
                <td className="py-1.5 px-2 text-right tabular-nums font-medium">{p.planifieCumule}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{p.objectifCumule}</td>
                <td className="py-1.5 px-2 text-right tabular-nums text-[#52514e]">{p.minimumExige}</td>
                <td
                  className="py-1.5 px-2 text-right tabular-nums font-medium"
                  style={{ color: p.manque > 0 ? ETAT.critique : ETAT.bon }}
                >
                  {p.manque > 0 ? `−${p.manque}` : '✓'}
                </td>
                <td className="py-1.5 pl-4 text-[#52514e] whitespace-nowrap">
                  {p.palier ? `${p.palier.pourcentage} % au ${formatDate(p.palier.dateLimite)}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Carte>
  );
}

// ---------------------------------------------------------------------
// Écran
// ---------------------------------------------------------------------

export default function Planning({
  dossiers,
  paliers,
  annee,
  aujourdhui,
  onRepartir,
}: {
  dossiers: Dossier[];
  paliers: Palier[];
  annee: number;
  aujourdhui: string;
  onRepartir: (affectations: ReturnType<typeof autoRepartition>) => Promise<void>;
}) {
  const [margeSecurite, setMargeSecurite] = useState(0.1);
  const [enCours, setEnCours] = useState<Population | null>(null);

  async function repartir(population: Population) {
    setEnCours(population);
    try {
      const affectations = autoRepartition(dossiers, paliers, annee, population, {
        margeSecurite,
        aujourdhui,
      });
      await onRepartir(affectations);
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="space-y-6">
      <Carte titre="Paramètres de projection">
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-3">
            <span className="text-sm text-[#52514e] whitespace-nowrap">Marge de sécurité</span>
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.05}
              value={margeSecurite}
              onChange={(e) => setMargeSecurite(Number(e.target.value))}
              className="w-48 accent-[#1A2138]"
            />
            <span className="text-sm font-semibold text-navy tabular-nums w-12">
              {Math.round(margeSecurite * 100)} %
            </span>
          </label>
          <p className="text-xs text-[#52514e] max-w-xl">
            L'objectif mensuel est le minimum légal — interpolé linéairement entre les paliers —
            majoré de cette marge. Elle absorbe les dossiers qui glissent : un dépôt refusé au
            משרד השומה ne compte pas dans la mesure.
          </p>
        </div>
      </Carte>

      <BlocPopulation
        population="yehidim"
        dossiers={dossiers}
        paliers={paliers}
        annee={annee}
        aujourdhui={aujourdhui}
        margeSecurite={margeSecurite}
        onRepartir={repartir}
        enCours={enCours === 'yehidim'}
      />

      <BlocPopulation
        population="haver_bnei_adam"
        dossiers={dossiers}
        paliers={paliers}
        annee={annee}
        aujourdhui={aujourdhui}
        margeSecurite={margeSecurite}
        onRepartir={repartir}
        enCours={enCours === 'haver_bnei_adam'}
      />
    </div>
  );
}
