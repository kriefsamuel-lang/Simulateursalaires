# Base Supabase — CRM Krief Expertise

## Appliquer les migrations

Via l'interface Supabase : **SQL Editor** → coller le contenu des fichiers dans
l'ordre, puis exécuter.

```
supabase/migrations/0001_init.sql   -- tables, contraintes, triggers, RLS
supabase/migrations/0002_seed.sql   -- paliers 2025 + checklists types
```

Via la CLI :

```bash
supabase link --project-ref <ref-du-projet>
supabase db push
```

## Modèle

| Table | Rôle |
|---|---|
| `clients` | un dossier fiscal (תיק) du cabinet, clé primaire `tik` en texte |
| `declarations` | une déclaration annuelle par client et par année fiscale |
| `taches` | checklist concrète rattachée à une déclaration |
| `modeles_taches` | checklist type par type de client |
| `paliers` | échéances du hesder arkhot, par année et par population |

### Pourquoi `paliers` est une table

Le hesder arkhot est renégocié chaque année entre רשות המסים et les lechakot
professionnelles : les dates et les pourcentages changent. Ils ne sont donc
jamais codés en dur dans l'application — `src/crm/rules/arkhot.ts` les reçoit
en paramètre. Pour ouvrir l'année suivante, il suffit d'insérer six lignes :

```sql
insert into paliers (annee, population, date_limite, pourcentage, libelle) values
  (2026, 'yehidim',         '2027-08-31', 10,  'שלב א'),
  (2026, 'yehidim',         '2027-11-30', 50,  'שלב ב'),
  (2026, 'yehidim',         '2028-02-29', 100, 'שלב ג'),
  (2026, 'haver_bnei_adam', '2027-08-31', 10,  'שלב א'),
  (2026, 'haver_bnei_adam', '2027-12-31', 40,  'שלב ב'),
  (2026, 'haver_bnei_adam', '2028-03-31', 100, 'שלב ג');
```

### Génération automatique des checklists

Un trigger `after insert` sur `declarations` copie les `modeles_taches` du type
du client dans `taches`. Créer une déclaration suffit donc à obtenir sa
checklist — l'import שע"ם en bénéficie sans code supplémentaire.

### Cohérence des dépôts

Une contrainte impose que `statut = 'depose'` équivaille à `date_depot is not
null` : un dossier ne peut pas être compté dans un quota sans date de dépôt
mesurable.

## RLS

Toutes les tables ont RLS activé. Le CRM est interne : tout utilisateur
**authentifié** lit et écrit ; les visiteurs anonymes n'ont aucun accès. La
table `paliers` est en lecture seule pour les utilisateurs — elle reflète une
décision de רשות המסים, pas une donnée du cabinet, et se modifie par migration.

Créez les comptes des collaborateurs dans **Authentication → Users**.
