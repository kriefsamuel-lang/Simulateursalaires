/**
 * hesder arkhot — הסדר האורכות למייצגים
 * =====================================================================
 * Module de règles UNIQUE du CRM.
 *
 * Toute la logique de quota, de mesure et de projection vit ici et nulle
 * part ailleurs : les écrans ne font qu'afficher ce que ces fonctions
 * retournent. Aucun palier n'est codé en dur — ils proviennent de la
 * table `paliers` et sont passés en paramètre, parce que רשות המסים les
 * renégocie chaque année avec les lechakot professionnelles.
 *
 * Règles de fond (circulaire du 28/04/2026, année fiscale 2025) :
 *   - Deux populations mesurées séparément : יחידים et חבר בני אדם
 *     (les sociétés et les מלכ"רים sont comptés ensemble).
 *   - Le quota requis à une échéance est ceil(effectif × pourcentage).
 *   - Seul un dossier au statut « Déposé » entre au numérateur.
 */

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export type TypeClient = 'individu' | 'societe' | 'amouta';

export type Population = 'yehidim' | 'haver_bnei_adam';

export type StatutDeclaration =
  | 'a_faire'
  | 'en_cours'
  | 'attente_client'
  | 'pret'
  | 'depose'
  | 'hors_perimetre';

export type Priorite = 'basse' | 'normale' | 'haute';

/** Un palier du hesder, tel que stocké en base. */
export interface Palier {
  annee: number;
  population: Population;
  /** Date limite au format ISO `YYYY-MM-DD`. */
  dateLimite: string;
  /** Pourcentage cumulé de l'effectif à avoir déposé, de 0 à 100. */
  pourcentage: number;
  libelle?: string | null;
}

/** Vue minimale d'une déclaration, telle que consommée par les règles. */
export interface DossierArkhot {
  tik: string;
  population: Population;
  statut: StatutDeclaration;
  /** ISO `YYYY-MM-DD`, renseignée si et seulement si le statut est « depose ». */
  dateDepot?: string | null;
  /** Mois de dépôt planifié, format `YYYY-MM`. */
  moisCible?: string | null;
  priorite?: Priorite;
  /** Avancement de la checklist, de 0 à 1. */
  avancement?: number;
  arkhaLegale?: string | null;
}

/** État mesuré d'une population face à un palier donné. */
export interface EtatPalier {
  palier: Palier;
  /** Effectif de la population (dénominateur). */
  effectif: number;
  /** ceil(effectif × pourcentage / 100). */
  quotaRequis: number;
  /** Dossiers déposés comptabilisés à la date limite du palier. */
  deposes: number;
  /** Dossiers manquants pour tenir le palier (0 si le palier est tenu). */
  ecart: number;
  /** Ratio deposes / quotaRequis, borné à 1. */
  progression: number;
  tenu: boolean;
  /** Le palier est-il déjà échu à la date d'évaluation ? */
  echu: boolean;
}

/** Synthèse d'une population : effectif, paliers, prochaine échéance. */
export interface EtatPopulation {
  population: Population;
  effectif: number;
  /** Dossiers déposés à ce jour. */
  deposes: number;
  paliers: EtatPalier[];
  /** Premier palier non échu, ou `null` si la campagne est terminée. */
  prochainPalier: EtatPalier | null;
  /** Dossiers à déposer pour tenir le prochain palier (0 si déjà tenu). */
  ecartProchainPalier: number;
  /** Jours restants avant le prochain palier (négatif si échu). */
  joursRestants: number | null;
}

export interface MoisProjection {
  /** `YYYY-MM`. */
  mois: string;
  /** Dernier jour du mois, ISO. */
  finDeMois: string;
  /** Minimum légal cumulé exigé à la fin du mois (rampe linéaire). */
  minimumExige: number;
  /** Minimum majoré de la marge de sécurité, borné à l'effectif. */
  objectifCumule: number;
  /** Dépôts déjà réalisés, cumulés à la fin du mois. */
  deposesCumules: number;
  /** Dépôts réalisés + dépôts planifiés, cumulés à la fin du mois. */
  planifieCumule: number;
  /** Dépôts planifiés sur ce mois seul. */
  planifieDuMois: number;
  /** objectifCumule − planifieCumule, borné à 0. */
  manque: number;
  /** Un palier tombe-t-il dans ce mois ? */
  palier: Palier | null;
}

export interface OptionsProjection {
  /** Marge de sécurité, en fraction (0.1 = viser 10 % au-dessus du minimum). */
  margeSecurite?: number;
  /** Date d'évaluation, ISO. Par défaut : aujourd'hui. */
  aujourdhui?: string;
  /** Premier mois de la campagne, `YYYY-MM`. Par défaut : mois du 1er palier. */
  moisDebut?: string;
}

// ---------------------------------------------------------------------
// Utilitaires de date — arithmétique en UTC pur, sans dépendance
// ---------------------------------------------------------------------

const JOUR_MS = 86_400_000;

function versDate(iso: string): Date {
  const [a, m, j] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, j));
}

function versIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** `YYYY-MM-DD` → `YYYY-MM`. */
export function moisDe(iso: string): string {
  return iso.slice(0, 7);
}

/** Dernier jour du mois `YYYY-MM`, en ISO. */
export function finDeMois(mois: string): string {
  const [a, m] = mois.split('-').map(Number);
  return versIso(new Date(Date.UTC(a, m, 0)));
}

/** Premier jour du mois `YYYY-MM`, en ISO. */
export function debutDeMois(mois: string): string {
  return `${mois}-01`;
}

/** Ajoute `n` mois à un mois `YYYY-MM`. */
export function ajouteMois(mois: string, n: number): string {
  const [a, m] = mois.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Nombre de jours entiers de `depuis` à `jusqua` (négatif si passé). */
export function joursEntre(depuis: string, jusqua: string): number {
  return Math.round((versDate(jusqua).getTime() - versDate(depuis).getTime()) / JOUR_MS);
}

/** Liste inclusive des mois de `debut` à `fin`. */
export function listeMois(debut: string, fin: string): string[] {
  const out: string[] = [];
  let m = debut;
  // Garde-fou : une campagne d'arkhot ne dépasse jamais quelques années.
  for (let i = 0; i < 240 && m <= fin; i++) {
    out.push(m);
    m = ajouteMois(m, 1);
  }
  return out;
}

function aujourdhuiIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------
// Règles élémentaires
// ---------------------------------------------------------------------

/**
 * Population du hesder à laquelle appartient un type de client.
 * Les מלכ"רים sont mesurés avec les sociétés sous « חבר בני אדם ».
 */
export function populationDe(type: TypeClient): Population {
  return type === 'individu' ? 'yehidim' : 'haver_bnei_adam';
}

export const LIBELLES_POPULATION: Record<Population, { fr: string; he: string }> = {
  yehidim: { fr: 'Individus', he: 'יחידים' },
  haver_bnei_adam: { fr: 'Sociétés et amoutot', he: 'חבר בני אדם' },
};

/** Seul le statut « Déposé » entre dans la mesure du quota. */
export function compteDansLaMesure(statut: StatutDeclaration): boolean {
  return statut === 'depose';
}

/** Un dossier hors périmètre ne compte ni au numérateur ni au dénominateur. */
export function entreDansEffectif(statut: StatutDeclaration): boolean {
  return statut !== 'hors_perimetre';
}

/** Quota requis à une échéance : `ceil(effectif × pourcentage / 100)`. */
export function quotaRequis(effectif: number, pourcentage: number): number {
  if (effectif <= 0) return 0;
  return Math.ceil((effectif * pourcentage) / 100);
}

/** Paliers d'une année et d'une population, triés par date limite croissante. */
export function paliersDe(paliers: Palier[], annee: number, population: Population): Palier[] {
  return paliers
    .filter((p) => p.annee === annee && p.population === population)
    .sort((a, b) => a.dateLimite.localeCompare(b.dateLimite));
}

/**
 * Date à laquelle un dossier est comptabilisé comme déposé.
 * Un dossier déposé sans date connue est réputé déposé de longue date, afin
 * de ne jamais le faire disparaître des compteurs.
 */
function dateComptabilisation(d: DossierArkhot): string {
  if (!compteDansLaMesure(d.statut)) return '';
  return d.dateDepot ?? '0000-01-01';
}

// ---------------------------------------------------------------------
// Mesure
// ---------------------------------------------------------------------

/** Dossiers d'une population entrant dans l'effectif mesuré. */
export function effectifDe(dossiers: DossierArkhot[], population: Population): DossierArkhot[] {
  return dossiers.filter((d) => d.population === population && entreDansEffectif(d.statut));
}

/** Nombre de dossiers déposés à la date `aLaDate` (incluse). */
export function deposesALaDate(dossiers: DossierArkhot[], aLaDate: string): number {
  return dossiers.filter((d) => {
    const date = dateComptabilisation(d);
    return date !== '' && date <= aLaDate;
  }).length;
}

/** État d'une population face à un palier. */
export function etatPalier(
  dossiers: DossierArkhot[],
  palier: Palier,
  aujourdhui: string = aujourdhuiIso(),
): EtatPalier {
  const effectifs = effectifDe(dossiers, palier.population);
  const effectif = effectifs.length;
  const quota = quotaRequis(effectif, palier.pourcentage);

  // À une date encore future, on mesure ce qui est déposé aujourd'hui ;
  // une fois le palier échu, on fige la mesure à sa date limite.
  const dateMesure = aujourdhui < palier.dateLimite ? aujourdhui : palier.dateLimite;
  const deposes = deposesALaDate(effectifs, dateMesure);

  return {
    palier,
    effectif,
    quotaRequis: quota,
    deposes,
    ecart: Math.max(0, quota - deposes),
    progression: quota === 0 ? 1 : Math.min(1, deposes / quota),
    tenu: deposes >= quota,
    echu: aujourdhui > palier.dateLimite,
  };
}

/** Synthèse complète d'une population : le cœur du tableau de bord. */
export function etatPopulation(
  dossiers: DossierArkhot[],
  paliers: Palier[],
  annee: number,
  population: Population,
  aujourdhui: string = aujourdhuiIso(),
): EtatPopulation {
  const mesPaliers = paliersDe(paliers, annee, population);
  const effectifs = effectifDe(dossiers, population);
  const etats = mesPaliers.map((p) => etatPalier(dossiers, p, aujourdhui));
  const prochain = etats.find((e) => !e.echu) ?? null;

  return {
    population,
    effectif: effectifs.length,
    deposes: deposesALaDate(effectifs, aujourdhui),
    paliers: etats,
    prochainPalier: prochain,
    ecartProchainPalier: prochain ? prochain.ecart : 0,
    joursRestants: prochain ? joursEntre(aujourdhui, prochain.palier.dateLimite) : null,
  };
}

/** Synthèse des deux populations. */
export function etatCampagne(
  dossiers: DossierArkhot[],
  paliers: Palier[],
  annee: number,
  aujourdhui: string = aujourdhuiIso(),
): EtatPopulation[] {
  return (['yehidim', 'haver_bnei_adam'] as Population[]).map((p) =>
    etatPopulation(dossiers, paliers, annee, p, aujourdhui),
  );
}

// ---------------------------------------------------------------------
// Rampe et projection
// ---------------------------------------------------------------------

/**
 * Minimum cumulé exigé à une date donnée, par interpolation linéaire entre
 * les paliers. Avant le premier palier, la rampe part de zéro au premier
 * jour du mois du palier ; au-delà du dernier palier, le minimum est le
 * quota final. Aux dates de palier exactes, la rampe rend le quota légal.
 */
export function minimumExigeALaDate(
  effectif: number,
  paliers: Palier[],
  date: string,
  moisDebut?: string,
): number {
  if (paliers.length === 0 || effectif <= 0) return 0;

  const tries = [...paliers].sort((a, b) => a.dateLimite.localeCompare(b.dateLimite));
  const quotas = tries.map((p) => quotaRequis(effectif, p.pourcentage));

  const premier = tries[0];
  const depart = moisDebut ? debutDeMois(moisDebut) : debutDeMois(moisDe(premier.dateLimite));

  if (date >= tries[tries.length - 1].dateLimite) return quotas[quotas.length - 1];
  if (date <= depart) return 0;

  // Segment [precedent, suivant] encadrant la date.
  let dDebut = depart;
  let qDebut = 0;
  for (let i = 0; i < tries.length; i++) {
    const dFin = tries[i].dateLimite;
    const qFin = quotas[i];
    if (date <= dFin) {
      const total = joursEntre(dDebut, dFin);
      if (total <= 0) return qFin;
      const ecoule = joursEntre(dDebut, date);
      const valeur = qDebut + ((qFin - qDebut) * ecoule) / total;
      // On ne peut déposer qu'un nombre entier de dossiers : on arrondit au
      // supérieur pour rester du côté sûr de l'échéance.
      return Math.min(qFin, Math.ceil(valeur));
    }
    dDebut = dFin;
    qDebut = qFin;
  }
  return quotas[quotas.length - 1];
}

/** Mois couverts par la campagne d'une population. */
export function moisDeCampagne(
  paliers: Palier[],
  annee: number,
  population: Population,
  moisDebut?: string,
): string[] {
  const mes = paliersDe(paliers, annee, population);
  if (mes.length === 0) return [];
  const debut = moisDebut ?? moisDe(mes[0].dateLimite);
  const fin = moisDe(mes[mes.length - 1].dateLimite);
  return listeMois(debut, fin);
}

/**
 * Projection mensuelle d'une population : cumul planifié face au minimum
 * exigé, mois par mois, sur toute la durée de la campagne.
 */
export function projectionMensuelle(
  dossiers: DossierArkhot[],
  paliers: Palier[],
  annee: number,
  population: Population,
  options: OptionsProjection = {},
): MoisProjection[] {
  const { margeSecurite = 0, moisDebut } = options;

  const mesPaliers = paliersDe(paliers, annee, population);
  const effectifs = effectifDe(dossiers, population);
  const effectif = effectifs.length;
  const mois = moisDeCampagne(paliers, annee, population, moisDebut);
  const premierMois = mois[0];

  return mois.map((m) => {
    const fin = finDeMois(m);

    const deposesCumules = deposesALaDate(effectifs, fin);

    const planifieCumule = effectifs.filter((d) => {
      if (compteDansLaMesure(d.statut)) return dateComptabilisation(d) <= fin;
      return d.moisCible != null && d.moisCible <= m;
    }).length;

    const planifieDuMois = effectifs.filter((d) => {
      if (compteDansLaMesure(d.statut)) return moisDe(dateComptabilisation(d)) === m;
      return d.moisCible === m;
    }).length;

    const minimum = minimumExigeALaDate(effectif, mesPaliers, fin, premierMois);
    const objectif = Math.min(effectif, Math.ceil(minimum * (1 + margeSecurite)));

    return {
      mois: m,
      finDeMois: fin,
      minimumExige: minimum,
      objectifCumule: objectif,
      deposesCumules,
      planifieCumule,
      planifieDuMois,
      manque: Math.max(0, objectif - planifieCumule),
      palier: mesPaliers.find((p) => moisDe(p.dateLimite) === m) ?? null,
    };
  });
}

// ---------------------------------------------------------------------
// Auto-répartition
// ---------------------------------------------------------------------

const RANG_STATUT: Record<StatutDeclaration, number> = {
  pret: 0,
  en_cours: 1,
  attente_client: 2,
  a_faire: 3,
  depose: 4,
  hors_perimetre: 5,
};

const RANG_PRIORITE: Record<Priorite, number> = { haute: 0, normale: 1, basse: 2 };

/**
 * Ordre de traitement : les dossiers les plus avancés d'abord — statut,
 * puis avancement de la checklist, puis priorité, puis arkha la plus proche.
 */
export function ordonnerParAvancement(dossiers: DossierArkhot[]): DossierArkhot[] {
  return [...dossiers].sort((a, b) => {
    const rs = RANG_STATUT[a.statut] - RANG_STATUT[b.statut];
    if (rs !== 0) return rs;

    const av = (b.avancement ?? 0) - (a.avancement ?? 0);
    if (Math.abs(av) > 1e-9) return av;

    const rp = RANG_PRIORITE[a.priorite ?? 'normale'] - RANG_PRIORITE[b.priorite ?? 'normale'];
    if (rp !== 0) return rp;

    const aa = a.arkhaLegale ?? '9999-12-31';
    const ba = b.arkhaLegale ?? '9999-12-31';
    if (aa !== ba) return aa.localeCompare(ba);

    return a.tik.localeCompare(b.tik);
  });
}

export interface AffectationMois {
  tik: string;
  moisCible: string;
}

/**
 * Répartit les dossiers non déposés sur les mois de la campagne de façon à
 * couvrir, chaque mois, l'objectif (minimum légal + marge de sécurité), en
 * servant d'abord les dossiers les plus avancés.
 *
 * Le reliquat qui n'est appelé par aucun palier intermédiaire est étalé sur
 * le dernier mois, où le quota est de 100 %.
 */
export function autoRepartition(
  dossiers: DossierArkhot[],
  paliers: Palier[],
  annee: number,
  population: Population,
  options: OptionsProjection = {},
): AffectationMois[] {
  const { margeSecurite = 0, aujourdhui = aujourdhuiIso(), moisDebut } = options;

  const mesPaliers = paliersDe(paliers, annee, population);
  const effectifs = effectifDe(dossiers, population);
  const effectif = effectifs.length;
  const mois = moisDeCampagne(paliers, annee, population, moisDebut);
  if (mois.length === 0) return [];

  const premierMois = mois[0];
  const moisCourant = moisDe(aujourdhui);

  // On ne planifie jamais dans le passé : les mois échus basculent sur le
  // premier mois encore ouvert.
  const moisOuverts = mois.filter((m) => m >= moisCourant);
  const cible = moisOuverts.length > 0 ? moisOuverts : [mois[mois.length - 1]];

  const aPlanifier = ordonnerParAvancement(effectifs.filter((d) => !compteDansLaMesure(d.statut)));

  const affectations: AffectationMois[] = [];
  let curseur = 0;

  for (const m of cible) {
    const fin = finDeMois(m);
    const minimum = minimumExigeALaDate(effectif, mesPaliers, fin, premierMois);
    const objectif = Math.min(effectif, Math.ceil(minimum * (1 + margeSecurite)));

    // Déjà acquis à la fin de ce mois : les dépôts réels et ce qu'on vient
    // d'affecter aux mois précédents de cette même passe.
    const acquis = deposesALaDate(effectifs, fin) + affectations.length;
    const besoin = Math.max(0, objectif - acquis);

    for (let i = 0; i < besoin && curseur < aPlanifier.length; i++, curseur++) {
      affectations.push({ tik: aPlanifier[curseur].tik, moisCible: m });
    }
  }

  // Reliquat éventuel : dernier mois de la campagne.
  const dernier = cible[cible.length - 1];
  for (; curseur < aPlanifier.length; curseur++) {
    affectations.push({ tik: aPlanifier[curseur].tik, moisCible: dernier });
  }

  return affectations;
}
