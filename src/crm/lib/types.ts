import type {
  Population,
  Priorite,
  StatutDeclaration,
  TypeClient,
  DossierArkhot,
} from '../rules/arkhot';

export type { Population, Priorite, StatutDeclaration, TypeClient };

// ---------------------------------------------------------------------
// Lignes de la base
// ---------------------------------------------------------------------

export interface ClientRow {
  tik: string;
  nom_he: string;
  nom_fr: string | null;
  type: TypeClient;
  pakid_shuma: string | null;
  sug_tik: string | null;
  email: string | null;
  tel: string | null;
  actif: boolean;
}

export interface DeclarationRow {
  id: string;
  tik: string;
  annee_fiscale: number;
  arkha_legale: string | null;
  statut: StatutDeclaration;
  mois_cible: string | null;
  date_depot: string | null;
  priorite: Priorite;
  notes: string | null;
  updated_at?: string;
}

export interface TacheRow {
  id: string;
  declaration_id: string;
  libelle: string;
  fait: boolean;
  echeance: string | null;
  ordre: number;
}

export interface PalierRow {
  id: string;
  annee: number;
  population: Population;
  date_limite: string;
  pourcentage: number;
  libelle: string | null;
}

// ---------------------------------------------------------------------
// Vue assemblée consommée par les écrans
// ---------------------------------------------------------------------

export interface Dossier extends DossierArkhot {
  id: string;
  anneeFiscale: number;
  notes: string | null;
  client: ClientRow;
  taches: TacheRow[];
  /** Tâches faites / tâches totales. */
  tachesFaites: number;
  tachesTotal: number;
  updatedAt: string | null;
}

// ---------------------------------------------------------------------
// Libellés
// ---------------------------------------------------------------------

export const LIBELLES_STATUT: Record<StatutDeclaration, { fr: string; he: string }> = {
  a_faire: { fr: 'À faire', he: 'לא התחיל' },
  en_cours: { fr: 'En cours', he: 'בטיפול' },
  attente_client: { fr: 'Attente client', he: 'ממתין ללקוח' },
  pret: { fr: 'Prêt à déposer', he: 'מוכן לשידור' },
  depose: { fr: 'Déposé', he: 'הוגש' },
  hors_perimetre: { fr: 'Hors périmètre', he: 'לא נכלל' },
};

export const ORDRE_STATUT: StatutDeclaration[] = [
  'a_faire',
  'en_cours',
  'attente_client',
  'pret',
  'depose',
  'hors_perimetre',
];

export const LIBELLES_TYPE: Record<TypeClient, { fr: string; he: string }> = {
  individu: { fr: 'Individu', he: 'יחיד' },
  societe: { fr: 'Société', he: 'חברה' },
  amouta: { fr: 'Amouta', he: 'מלכ"ר' },
};

export const LIBELLES_PRIORITE: Record<Priorite, string> = {
  haute: 'Haute',
  normale: 'Normale',
  basse: 'Basse',
};
