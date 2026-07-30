/**
 * Parseur du listing des arkhot de שע"ם
 * =====================================================================
 * Écran source : « רשימת התיקים הנכללים באורכות לשנת המס » du portail
 * מייצגים. Le listing est un écran texte à colonnes fixes :
 *
 *   קוד שידור | תאריך ארכה | מועד חוקי/תאריך הגשה | מח | ס'ש | סת | ח | פ.ש | שם משפחה ופרטי | מספר תיק
 *
 * Selon la façon dont l'utilisateur copie l'écran (terminal, PDF,
 * presse-papier), le texte arrive soit dans l'ordre visuel RTL — le
 * numéro de dossier en fin de ligne — soit dans l'ordre logique. Le
 * parseur détecte l'orientation ligne par ligne plutôt que de miser sur
 * des positions de colonnes, ce qui le rend insensible aux variations
 * d'espacement.
 */

import type { TypeClient } from '../rules/arkhot';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export interface LigneArkha {
  /** מספר תיק — conservé en texte, zéros de tête compris. */
  tik: string;
  /** שם משפחה ופרטי, tel qu'affiché par שע"ם (souvent tronqué à 20 caractères). */
  nom: string;
  /** פקיד שומה. */
  pakidShuma: string | null;
  /** סוג תיק. */
  sugTik: string | null;
  /** תאריך ארכה, ISO `YYYY-MM-DD`. */
  arkhaLegale: string | null;
  /** מועד חוקי / תאריך הגשה, ISO. Renseignée si le dossier est déjà déposé. */
  dateDepot: string | null;
  /** קוד שידור, ex. « MK ». */
  codeShidour: string | null;
  /** Type de client déduit du סוג תיק, à défaut du préfixe du תיק. */
  type: TypeClient;
  /** Numéro de la ligne dans le texte collé, pour le rapport d'import. */
  numeroLigne: number;
  /** Ligne d'origine, à des fins de contrôle. */
  source: string;
}

export interface LigneIgnoree {
  numeroLigne: number;
  contenu: string;
  raison: string;
}

export interface ResultatImport {
  lignes: LigneArkha[];
  ignorees: LigneIgnoree[];
  /** תיקים apparaissant plusieurs fois : seule la première occurrence est retenue. */
  doublons: string[];
}

// ---------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------

/** Marques de direction bidi, invisibles mais présentes dans les copier-coller. */
const MARQUES_BIDI = /[‎‏‪-‮⁦-⁩؜]/g;

const RE_DATE = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
const RE_TIK = /^\d{8,9}$/;
const RE_CODE = /^\d{1,3}$/;
const RE_CODE_SHIDOUR = /^[A-Za-z]{1,6}$/;

/** Lignes de mise en page de l'écran שע"ם, sans données. */
const MOTIFS_NON_DONNEES = [
  'רשימת התיקים',
  'שם משפחה',
  'מספר תיק',
  'מסמכים חסרים',
  'לא מבוסס',
  'מייצג',
];

function normaliser(ligne: string): string {
  return ligne.replace(MARQUES_BIDI, '').replace(/\t/g, ' ').replace(/\s+$/, '');
}

/** `dd/mm/yyyy` → `yyyy-mm-dd`. Retourne `null` si la date n'existe pas. */
export function versIso(date: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date.trim());
  if (!m) return null;
  const [, j, mo, a] = m;
  const jour = Number(j);
  const mois = Number(mo);
  const annee = Number(a);
  if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return null;
  // Rejette les dates inexistantes (31/02, 31/04…).
  const d = new Date(Date.UTC(annee, mois - 1, jour));
  if (d.getUTCMonth() !== mois - 1 || d.getUTCDate() !== jour) return null;
  return `${a}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
}

/**
 * Type de client déduit du סוג תיק, à défaut du préfixe du numéro de dossier.
 *   - סוג תיק 85 → מלכ"ר (amouta)
 *   - סוג תיק 6x → חברה (société)
 *   - תיק 58xxxxxxx → amouta enregistrée au רשם העמותות
 *   - תיק 5xxxxxxxx → société (ח.פ.)
 *   - sinon → individu (תעודת זהות)
 */
export function typeDepuisCodes(sugTik: string | null, tik: string): TypeClient {
  if (sugTik) {
    const n = Number(sugTik);
    if (n === 85) return 'amouta';
    if (n >= 60 && n <= 69) return 'societe';
    if (n >= 40 && n <= 59) return 'individu';
    if (n >= 90 && n <= 99) return 'individu';
  }
  if (tik.startsWith('58')) return 'amouta';
  if (tik.startsWith('5')) return 'societe';
  return 'individu';
}

// ---------------------------------------------------------------------
// Parseur
// ---------------------------------------------------------------------

interface Jeton {
  pos: number;
  texte: string;
}

function jetons(ligne: string): Jeton[] {
  return [...ligne.matchAll(/\S+/g)].map((m) => ({ pos: m.index!, texte: m[0] }));
}

/**
 * Parse une ligne de listing. Retourne `null` si la ligne ne contient pas
 * de données exploitables (en-tête, filet, pied d'écran).
 */
export function parseLigne(ligneBrute: string, numeroLigne = 0): LigneArkha | null {
  const ligne = normaliser(ligneBrute);
  if (ligne.trim() === '') return null;
  if (MOTIFS_NON_DONNEES.some((m) => ligne.includes(m))) return null;

  const tous = jetons(ligne);
  const dates = tous.filter((t) => RE_DATE.test(t.texte));
  const tiks = tous.filter((t) => RE_TIK.test(t.texte));

  // Une ligne de données porte au moins une date d'arkha et un seul תיק.
  if (dates.length === 0 || tiks.length !== 1) return null;

  const tik = tiks[0];
  const premiereDate = dates[0].pos;
  const derniereDate = dates[dates.length - 1].pos;

  // Orientation : dans l'ordre visuel RTL, le תיק ferme la ligne et les
  // dates l'ouvrent ; dans l'ordre logique, c'est l'inverse.
  const rtl = tik.pos > derniereDate;

  // Zone comprise entre le bloc de dates et le תיק : [codes] puis [nom]
  // en RTL, [nom] puis [codes] en LTR.
  const zone = rtl
    ? tous.filter((t) => t.pos > derniereDate && t.pos < tik.pos)
    : tous.filter((t) => t.pos > tik.pos && t.pos < premiereDate);

  // Les codes forment une suite contiguë de nombres de 1 à 3 chiffres,
  // accolée au bloc de dates. On s'arrête au premier jeton non numérique :
  // un nom peut lui-même être un nombre (ex. la société « 1000 »).
  const sequence = rtl ? zone : [...zone].reverse();
  const codes: string[] = [];
  let i = 0;
  for (; i < sequence.length && RE_CODE.test(sequence[i].texte); i++) {
    codes.push(sequence[i].texte);
  }
  const jetonsNom = sequence.slice(i);

  // Ordonne les colonnes depuis le nom vers l'extérieur :
  // פ.ש, ח, סת, ס'ש, מח.
  const depuisLeNom = codes.reverse();
  const pakidShuma = depuisLeNom[0] ?? null;
  const sugTik = depuisLeNom[2] ?? null;

  // Le nom se lit dans l'ordre des positions croissantes dans les deux cas.
  const nom = (rtl ? jetonsNom : [...jetonsNom].reverse())
    .map((t) => t.texte)
    .join(' ')
    .trim();

  // Colonnes de dates : תאריך ארכה et מועד חוקי/תאריך הגשה sont adjacentes,
  // l'arkha du côté extérieur de la ligne.
  let arkha: string | null;
  let depot: string | null;
  if (dates.length === 1) {
    arkha = versIso(dates[0].texte);
    depot = null;
  } else if (rtl) {
    arkha = versIso(dates[0].texte);
    depot = versIso(dates[1].texte);
  } else {
    arkha = versIso(dates[dates.length - 1].texte);
    depot = versIso(dates[dates.length - 2].texte);
  }

  const codeShidour =
    tous.find((t) => RE_CODE_SHIDOUR.test(t.texte) && (rtl ? t.pos < premiereDate : t.pos > derniereDate))
      ?.texte ?? null;

  return {
    tik: tik.texte,
    nom,
    pakidShuma,
    sugTik,
    arkhaLegale: arkha,
    dateDepot: depot,
    codeShidour,
    type: typeDepuisCodes(sugTik, tik.texte),
    numeroLigne,
    source: ligneBrute,
  };
}

/**
 * Parse un listing complet collé depuis שע"ם.
 * Les lignes non exploitables sont rapportées plutôt que silencieusement
 * perdues : à l'import, le comptable doit pouvoir vérifier que rien
 * n'a été laissé de côté.
 */
export function parseListingSheam(texte: string): ResultatImport {
  const lignes: LigneArkha[] = [];
  const ignorees: LigneIgnoree[] = [];
  const doublons: string[] = [];
  const vus = new Set<string>();

  texte.split(/\r?\n/).forEach((brute, index) => {
    const numeroLigne = index + 1;
    const normalisee = normaliser(brute);
    if (normalisee.trim() === '') return;

    const ligne = parseLigne(brute, numeroLigne);

    if (!ligne) {
      // On ne rapporte que les lignes qui ressemblaient à des données :
      // les en-têtes et filets d'écran sont du bruit attendu.
      const t = jetons(normalisee);
      const ressembleADesDonnees =
        t.some((x) => RE_TIK.test(x.texte)) ||
        (t.some((x) => RE_DATE.test(x.texte)) && t.filter((x) => RE_CODE.test(x.texte)).length >= 2);
      if (ressembleADesDonnees && !MOTIFS_NON_DONNEES.some((m) => normalisee.includes(m))) {
        ignorees.push({
          numeroLigne,
          contenu: normalisee.trim(),
          raison: 'Ni numéro de dossier ni date d’arkha identifiables',
        });
      }
      return;
    }

    if (vus.has(ligne.tik)) {
      doublons.push(ligne.tik);
      ignorees.push({
        numeroLigne,
        contenu: normalisee.trim(),
        raison: `Dossier ${ligne.tik} déjà présent plus haut dans le listing`,
      });
      return;
    }

    vus.add(ligne.tik);
    lignes.push(ligne);
  });

  return { lignes, ignorees, doublons };
}

/** Répartition par type, pour le récapitulatif d'import. */
export function repartitionParType(lignes: LigneArkha[]): Record<TypeClient, number> {
  const out: Record<TypeClient, number> = { individu: 0, societe: 0, amouta: 0 };
  for (const l of lignes) out[l.type]++;
  return out;
}
