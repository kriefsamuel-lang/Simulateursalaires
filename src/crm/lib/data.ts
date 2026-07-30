/**
 * Accès aux données
 * =====================================================================
 * Cette couche ne contient aucune règle de quota : elle lit et écrit, puis
 * projette les lignes de la base dans la forme attendue par `rules/arkhot`.
 */

import { supabase } from './supabase';
import { populationDe } from '../rules/arkhot';
import type { AffectationMois, Palier } from '../rules/arkhot';
import type { LigneArkha } from '../import/parseSheam';
import type {
  ClientRow,
  DeclarationRow,
  Dossier,
  PalierRow,
  Priorite,
  StatutDeclaration,
  TacheRow,
} from './types';

// ---------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------

/** `2026-09-01` → `2026-09`. */
function moisDepuisDate(date: string | null): string | null {
  return date ? date.slice(0, 7) : null;
}

/** `2026-09` → `2026-09-01`, le format `date` attendu par Postgres. */
export function moisVersDate(mois: string | null): string | null {
  return mois ? `${mois}-01` : null;
}

export function palierDepuisLigne(p: PalierRow): Palier {
  return {
    annee: p.annee,
    population: p.population,
    dateLimite: p.date_limite,
    pourcentage: Number(p.pourcentage),
    libelle: p.libelle,
  };
}

function assembler(d: DeclarationRow, client: ClientRow, taches: TacheRow[]): Dossier {
  const faites = taches.filter((t) => t.fait).length;
  return {
    id: d.id,
    tik: d.tik,
    anneeFiscale: d.annee_fiscale,
    population: populationDe(client.type),
    statut: d.statut,
    dateDepot: d.date_depot,
    moisCible: moisDepuisDate(d.mois_cible),
    priorite: d.priorite,
    arkhaLegale: d.arkha_legale,
    avancement: taches.length === 0 ? 0 : faites / taches.length,
    notes: d.notes,
    client,
    taches: [...taches].sort((a, b) => a.ordre - b.ordre),
    tachesFaites: faites,
    tachesTotal: taches.length,
    updatedAt: d.updated_at ?? null,
  };
}

// ---------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------

export async function chargerPaliers(annee: number): Promise<Palier[]> {
  const { data, error } = await supabase
    .from('paliers')
    .select('*')
    .eq('annee', annee)
    .order('date_limite');
  if (error) throw error;
  return (data as PalierRow[]).map(palierDepuisLigne);
}

/** Années pour lesquelles des paliers sont définis, la plus récente d'abord. */
export async function chargerAnnees(): Promise<number[]> {
  const { data, error } = await supabase.from('paliers').select('annee');
  if (error) throw error;
  const annees = [...new Set((data as { annee: number }[]).map((r) => r.annee))];
  return annees.sort((a, b) => b - a);
}

export async function chargerDossiers(annee: number): Promise<Dossier[]> {
  const { data, error } = await supabase
    .from('declarations')
    .select('*, clients!inner(*), taches(*)')
    .eq('annee_fiscale', annee)
    .eq('clients.actif', true);
  if (error) throw error;

  type Jointure = DeclarationRow & { clients: ClientRow; taches: TacheRow[] };
  return (data as Jointure[])
    .map((r) => assembler(r, r.clients, r.taches ?? []))
    .sort((a, b) => a.client.nom_he.localeCompare(b.client.nom_he, 'he'));
}

// ---------------------------------------------------------------------
// Écriture
// ---------------------------------------------------------------------

export interface PatchDeclaration {
  statut?: StatutDeclaration;
  priorite?: Priorite;
  notes?: string | null;
  moisCible?: string | null;
  dateDepot?: string | null;
}

/**
 * Met à jour une déclaration. La base impose qu'un dossier déposé porte une
 * date de dépôt : on la renseigne au jour même si l'utilisateur bascule le
 * statut sans en fournir une, et on l'efface quand il repasse en arrière.
 */
export async function majDeclaration(id: string, patch: PatchDeclaration): Promise<void> {
  const ligne: Record<string, unknown> = {};

  if (patch.statut !== undefined) {
    ligne.statut = patch.statut;
    if (patch.statut === 'depose') {
      ligne.date_depot = patch.dateDepot ?? new Date().toISOString().slice(0, 10);
    } else {
      ligne.date_depot = null;
    }
  } else if (patch.dateDepot !== undefined) {
    ligne.date_depot = patch.dateDepot;
  }

  if (patch.priorite !== undefined) ligne.priorite = patch.priorite;
  if (patch.notes !== undefined) ligne.notes = patch.notes;
  if (patch.moisCible !== undefined) ligne.mois_cible = moisVersDate(patch.moisCible);

  const { error } = await supabase.from('declarations').update(ligne).eq('id', id);
  if (error) throw error;
}

export async function majTache(id: string, fait: boolean): Promise<void> {
  const { error } = await supabase.from('taches').update({ fait }).eq('id', id);
  if (error) throw error;
}

export async function ajouterTache(
  declarationId: string,
  libelle: string,
  ordre: number,
): Promise<void> {
  const { error } = await supabase
    .from('taches')
    .insert({ declaration_id: declarationId, libelle, ordre });
  if (error) throw error;
}

export async function supprimerTache(id: string): Promise<void> {
  const { error } = await supabase.from('taches').delete().eq('id', id);
  if (error) throw error;
}

/** Applique en base le planning calculé par `autoRepartition`. */
export async function appliquerRepartition(
  dossiers: Dossier[],
  affectations: AffectationMois[],
): Promise<number> {
  const parTik = new Map(dossiers.map((d) => [d.tik, d]));
  const aEcrire = affectations
    .map((a) => ({ dossier: parTik.get(a.tik), moisCible: a.moisCible }))
    .filter((x): x is { dossier: Dossier; moisCible: string } => x.dossier !== undefined)
    .filter((x) => x.dossier.moisCible !== x.moisCible);

  for (const { dossier, moisCible } of aEcrire) {
    const { error } = await supabase
      .from('declarations')
      .update({ mois_cible: moisVersDate(moisCible) })
      .eq('id', dossier.id);
    if (error) throw error;
  }
  return aEcrire.length;
}

// ---------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------

export interface ResultatEcriture {
  clientsCrees: number;
  clientsMisAJour: number;
  declarationsCreees: number;
  declarationsMisesAJour: number;
}

/**
 * Écrit un listing שע"ם en base.
 *
 * Les données de שע"ם font autorité sur l'état civil du dossier (nom, פ.ש,
 * סוג תיק) et sur l'arkha. En revanche le travail du cabinet — statut,
 * priorité, notes, mois cible, checklist — n'est jamais écrasé : un dépôt
 * constaté chez שע"ם fait avancer un dossier, jamais reculer.
 */
export async function importerListing(
  lignes: LigneArkha[],
  annee: number,
): Promise<ResultatEcriture> {
  if (lignes.length === 0) {
    return { clientsCrees: 0, clientsMisAJour: 0, declarationsCreees: 0, declarationsMisesAJour: 0 };
  }

  const tiks = lignes.map((l) => l.tik);

  const { data: clientsExistants, error: eClients } = await supabase
    .from('clients')
    .select('tik')
    .in('tik', tiks);
  if (eClients) throw eClients;
  const dejaClient = new Set((clientsExistants as { tik: string }[]).map((c) => c.tik));

  const { error: eUpsert } = await supabase.from('clients').upsert(
    lignes.map((l) => ({
      tik: l.tik,
      nom_he: l.nom,
      type: l.type,
      pakid_shuma: l.pakidShuma,
      sug_tik: l.sugTik,
      actif: true,
    })),
    { onConflict: 'tik' },
  );
  if (eUpsert) throw eUpsert;

  const { data: declsExistantes, error: eDecls } = await supabase
    .from('declarations')
    .select('id, tik, statut, date_depot')
    .eq('annee_fiscale', annee)
    .in('tik', tiks);
  if (eDecls) throw eDecls;

  const parTik = new Map(
    (declsExistantes as Pick<DeclarationRow, 'id' | 'tik' | 'statut' | 'date_depot'>[]).map((d) => [
      d.tik,
      d,
    ]),
  );

  const aCreer = lignes.filter((l) => !parTik.has(l.tik));
  if (aCreer.length > 0) {
    const { error } = await supabase.from('declarations').insert(
      aCreer.map((l) => ({
        tik: l.tik,
        annee_fiscale: annee,
        arkha_legale: l.arkhaLegale,
        statut: l.dateDepot ? 'depose' : 'a_faire',
        date_depot: l.dateDepot,
      })),
    );
    if (error) throw error;
  }

  let misesAJour = 0;
  for (const l of lignes) {
    const existante = parTik.get(l.tik);
    if (!existante) continue;

    const patch: Record<string, unknown> = { arkha_legale: l.arkhaLegale };
    // שע"ם constate un dépôt que le cabinet n'avait pas encore enregistré.
    if (l.dateDepot && existante.statut !== 'depose') {
      patch.statut = 'depose';
      patch.date_depot = l.dateDepot;
    } else if (l.dateDepot && existante.date_depot !== l.dateDepot) {
      patch.date_depot = l.dateDepot;
    }

    const { error } = await supabase.from('declarations').update(patch).eq('id', existante.id);
    if (error) throw error;
    misesAJour++;
  }

  return {
    clientsCrees: lignes.filter((l) => !dejaClient.has(l.tik)).length,
    clientsMisAJour: lignes.filter((l) => dejaClient.has(l.tik)).length,
    declarationsCreees: aCreer.length,
    declarationsMisesAJour: misesAJour,
  };
}
