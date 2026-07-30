-- =====================================================================
-- CRM Krief Expertise — schéma initial
-- Pilotage des déclarations annuelles et du hesder arkhot (הסדר אורכות)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------
create type type_client as enum ('individu', 'societe', 'amouta');

-- Les deux populations du hesder arkhot de רשות המסים.
-- Les sociétés et les מלכ"רים sont mesurés ensemble sous « חבר בני אדם ».
create type population_arkhot as enum ('yehidim', 'haver_bnei_adam');

create type statut_declaration as enum (
  'a_faire',        -- לא התחיל
  'en_cours',       -- בטיפול
  'attente_client', -- ממתין למסמכי הלקוח
  'pret',           -- מוכן לשידור
  'depose',         -- הוגש  ← seul statut qui compte dans la mesure du quota
  'hors_perimetre'  -- לא נכלל בהסדר
);

create type priorite_declaration as enum ('basse', 'normale', 'haute');

-- ---------------------------------------------------------------------
-- clients — un dossier fiscal (תיק) du cabinet
-- ---------------------------------------------------------------------
create table clients (
  tik          text primary key,
  nom_he       text not null,
  nom_fr       text,
  type         type_client not null,
  pakid_shuma  text,
  sug_tik      text,
  email        text,
  tel          text,
  actif        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on column clients.tik is 'מספר תיק — numéro de dossier, 9 chiffres, conservé en texte (zéros de tête significatifs)';
comment on column clients.pakid_shuma is 'פקיד שומה — code du bureau de taxation';
comment on column clients.sug_tik is 'סוג תיק — 4x/5x/9x individus, 62 société, 85 מלכ"ר';

create index clients_type_idx on clients (type) where actif;
create index clients_pakid_shuma_idx on clients (pakid_shuma);

-- ---------------------------------------------------------------------
-- paliers — les échéances du hesder arkhot, par année et par population
-- Stockés en base : ils sont renégociés chaque année avec les lechakot.
-- ---------------------------------------------------------------------
create table paliers (
  id          uuid primary key default gen_random_uuid(),
  annee       integer not null,
  population  population_arkhot not null,
  date_limite date not null,
  pourcentage numeric(5,2) not null check (pourcentage > 0 and pourcentage <= 100),
  libelle     text,
  created_at  timestamptz not null default now(),
  unique (annee, population, pourcentage)
);

comment on table paliers is 'Paliers du hesder arkhot. Jamais codés en dur côté application : rules/arkhot.ts les reçoit en paramètre.';

create index paliers_annee_population_idx on paliers (annee, population, date_limite);

-- ---------------------------------------------------------------------
-- declarations — une déclaration annuelle pour un dossier
-- ---------------------------------------------------------------------
create table declarations (
  id            uuid primary key default gen_random_uuid(),
  tik           text not null references clients (tik) on delete cascade,
  annee_fiscale integer not null,
  arkha_legale  date,
  statut        statut_declaration not null default 'a_faire',
  mois_cible    date,
  date_depot    date,
  priorite      priorite_declaration not null default 'normale',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tik, annee_fiscale)
);

comment on column declarations.arkha_legale is 'תאריך ארכה tel que reçu de שע"ם';
comment on column declarations.mois_cible is 'Mois de dépôt planifié, normalisé au 1er du mois';
comment on column declarations.date_depot is 'Date de dépôt effective — renseignée quand statut = depose';

create index declarations_annee_idx on declarations (annee_fiscale);
create index declarations_statut_idx on declarations (annee_fiscale, statut);
create index declarations_mois_cible_idx on declarations (annee_fiscale, mois_cible);
create index declarations_tik_idx on declarations (tik);

-- Cohérence : une déclaration déposée porte une date de dépôt, et inversement.
alter table declarations add constraint declarations_depot_coherent
  check ((statut = 'depose') = (date_depot is not null));

-- ---------------------------------------------------------------------
-- modeles_taches — checklist type, par type de client
-- ---------------------------------------------------------------------
create table modeles_taches (
  id          uuid primary key default gen_random_uuid(),
  type_client type_client not null,
  libelle     text not null,
  ordre       integer not null default 0,
  actif       boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (type_client, libelle)
);

create index modeles_taches_type_idx on modeles_taches (type_client, ordre) where actif;

-- ---------------------------------------------------------------------
-- taches — checklist concrète attachée à une déclaration
-- ---------------------------------------------------------------------
create table taches (
  id             uuid primary key default gen_random_uuid(),
  declaration_id uuid not null references declarations (id) on delete cascade,
  libelle        text not null,
  fait           boolean not null default false,
  echeance       date,
  ordre          integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index taches_declaration_idx on taches (declaration_id, ordre);

-- ---------------------------------------------------------------------
-- updated_at automatique
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clients_set_updated_at
  before update on clients
  for each row execute function set_updated_at();

create trigger declarations_set_updated_at
  before update on declarations
  for each row execute function set_updated_at();

create trigger taches_set_updated_at
  before update on taches
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Génération automatique de la checklist à la création d'une déclaration
-- ---------------------------------------------------------------------
create or replace function generer_taches_declaration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into taches (declaration_id, libelle, ordre)
  select new.id, m.libelle, m.ordre
  from modeles_taches m
  join clients c on c.tik = new.tik
  where m.type_client = c.type
    and m.actif;
  return new;
end;
$$;

create trigger declarations_generer_taches
  after insert on declarations
  for each row execute function generer_taches_declaration();

-- ---------------------------------------------------------------------
-- RLS — CRM interne : tout utilisateur authentifié du cabinet a accès.
-- Les visiteurs anonymes n'ont aucun accès.
-- ---------------------------------------------------------------------
alter table clients        enable row level security;
alter table declarations   enable row level security;
alter table taches         enable row level security;
alter table modeles_taches enable row level security;
alter table paliers        enable row level security;

create policy "cabinet lecture clients"   on clients        for select to authenticated using (true);
create policy "cabinet ecriture clients"  on clients        for all    to authenticated using (true) with check (true);

create policy "cabinet lecture decl"      on declarations   for select to authenticated using (true);
create policy "cabinet ecriture decl"     on declarations   for all    to authenticated using (true) with check (true);

create policy "cabinet lecture taches"    on taches         for select to authenticated using (true);
create policy "cabinet ecriture taches"   on taches         for all    to authenticated using (true) with check (true);

create policy "cabinet lecture modeles"   on modeles_taches for select to authenticated using (true);
create policy "cabinet ecriture modeles"  on modeles_taches for all    to authenticated using (true) with check (true);

-- Les paliers sont fixés par רשות המסים : lecture pour tous les authentifiés,
-- écriture réservée au service_role (migrations / back-office).
create policy "cabinet lecture paliers"   on paliers        for select to authenticated using (true);
