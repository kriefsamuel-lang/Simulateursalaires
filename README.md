# Krief Expertise — outils du cabinet

Deux applications dans un même build Vite :

| Route | Application |
|---|---|
| `/` | **Simulateur salarial** — brut/net et coût employeur |
| `/crm` | **CRM interne** — campagne de déclarations et hesder arkhot |

---

# CRM interne (`/crm`)

Pilotage de la campagne de déclarations annuelles et du respect du
**hesder arkhot** (הסדר האורכות) de רשות המסים.

## Écrans

1. **Tableau de bord** — chiffres clés, progression de chaque population face à
   ses trois paliers, écart au prochain palier, portefeuille par פקיד שומה,
   répartition par statut.
2. **Dossiers** — table filtrable et triable, édition du statut en ligne,
   panneau latéral (checklist, priorité, notes, date de dépôt, historique).
3. **Planning** — projection mensuelle août 2026 → mars 2027, cumul planifié
   face au minimum exigé (rampe linéaire entre paliers + marge de sécurité
   paramétrable), auto-répartition priorisant les dossiers les plus avancés.
4. **Import** — collage du listing des arkhot depuis שע"ם, aperçu contrôlable
   avant écriture.

## Règles métier — un seul module

Toute la logique de quota vit dans **`src/crm/rules/arkhot.ts`** et nulle part
ailleurs. Les écrans ne font qu'afficher ce que ce module retourne.

- Deux populations mesurées séparément : **יחידים** et **חבר בני אדם**
  (sociétés et מלכ"רים comptés ensemble).
- Quota requis à une échéance = `ceil(effectif × pourcentage)`.
- Seul le statut **« Déposé »** entre au numérateur ; les dossiers
  « hors périmètre » sortent du numérateur et du dénominateur.
- Une fois un palier échu, sa mesure est figée à sa date limite : un dépôt
  tardif ne rattrape pas un palier manqué.

Paliers de l'année fiscale 2025 (circulaire du 28/04/2026) :

| Population | שלב א | שלב ב | שלב ג |
|---|---|---|---|
| יחידים | 10 % au 31/08/2026 | 50 % au 30/11/2026 | 100 % au 28/02/2027 |
| חבר בני אדם | 10 % au 31/08/2026 | 40 % au 31/12/2026 | 100 % au 31/03/2027 |

Ces paliers sont **stockés en base** (table `paliers`), pas codés en dur : ils
changent chaque année. Voir `supabase/README.md`.

## Parser d'import שע"ם

`src/crm/import/parseSheam.ts` lit l'écran
*רשימת התיקים הנכללים באורכות לשנת המס* et en extrait, par ligne :
מספר תיק, nom, פ.ש, סוג תיק, תאריך ארכה et date de dépôt.

Le listing est un écran à colonnes fixes qui, selon la façon dont il est copié,
arrive dans l'ordre visuel RTL ou dans l'ordre logique. Le parser **détecte
l'orientation ligne par ligne** au lieu de se fier à des positions de colonnes,
ce qui le rend insensible aux variations d'espacement, aux tabulations et aux
marques bidi invisibles. Les en-têtes d'écran, filets et pieds de page sont
ignorés ; les lignes non exploitables et les doublons sont rapportés plutôt que
silencieusement perdus.

Le type de client est déduit du סוג תיק (62 → société, 85 → מלכ"ר, 4x/5x/9x →
individu), avec repli sur le préfixe du תיק.

Les tests s'exécutent contre un listing réel de 93 dossiers
(`src/crm/import/__fixtures__/listing-sheam.txt`).

## Configuration

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

Appliquez ensuite les migrations (`supabase/README.md`) et créez les comptes des
collaborateurs dans Supabase → Authentication. Sans ces variables, `/crm`
affiche la marche à suivre au lieu de planter.

## Structure

```
src/crm/
├── rules/arkhot.ts            # module de règles UNIQUE (quotas, rampe, répartition)
├── rules/arkhot.test.ts
├── import/parseSheam.ts       # parseur du listing שע"ם
├── import/parseSheam.test.ts
├── import/__fixtures__/       # listing réel de contrôle
├── lib/                       # client Supabase, types, accès données, palette
├── components/ui.tsx          # briques d'interface partagées
├── pages/                     # Dashboard, Dossiers, Planning, Import
└── CrmApp.tsx                 # coquille, authentification, navigation
supabase/migrations/           # schéma et données de référence
```

## Interface

Charte navy `#1A2138`, or `#C9A24B`, fond `#F7F5F0`, monogramme KE. Interface en
français, noms de clients en hébreu : le RTL est confiné à la cellule via
`<bdi dir="rtl">`, jamais appliqué à la page.

Les couleurs de graphique ne sont pas celles de la charte : sur le fond crème, le
navy sort de la bande de luminosité et l'or descend sous 3:1. Le navy et l'or
habillent donc le chrome, et les séries utilisent des teintes validées
(bande de luminosité, chroma, séparation daltonisme, plancher vision normale)
contre la surface `#F7F5F0`.

---

# Simulateur salarial (`/`)

Simulateur de salaire brut/net pour salariés en Israël, avec calcul des coûts employeur directs et indirects.

## Fonctionnalités

- **Mode brut → net** ou **net → brut** (solveur itératif)
- **Bituach Leumi** (cotisations salarié et employeur)
- **Impôt sur le revenu** avec barème progressif, surtaxe et points de crédit
- **Pension** (קרן פנסיה ou ביטוח מנהלים) : tagmoulim + pitsouim
- **Keren Hishtalmout** (optionnel)
- **Points de crédit** automatiques selon situation personnelle (état civil, enfants, âge, olé hadash, diplôme, soldat libéré…)
- **Coûts indirects employeur** : havara, jours fériés, congés annuels
- **Export PDF** du récapitulatif
- Paramètres fiscaux **2025 et 2026**

## Stack technique

| Outil | Rôle |
|-------|------|
| React 18 + TypeScript | UI |
| Vite | Build |
| Tailwind CSS | Styles |
| @react-pdf/renderer | Export PDF |
| React Router | Routage `/` et `/crm` |
| Supabase | Base Postgres + Auth du CRM |
| Vitest | Tests unitaires |
| Netlify | Hébergement |

## Installation et développement

```bash
npm install
npm run dev
```

Le simulateur est accessible sur `http://localhost:5173/`, le CRM sur
`http://localhost:5173/crm`.

## Tests

```bash
npm test
```

## Build et déploiement

```bash
npm run build
```

Le build produit un dossier `dist/` déployé automatiquement sur Netlify à chaque push sur `main`.

La base URL est `/salarie/` (configurée dans `vite.config.ts`).

## Structure du projet

```
src/
├── components/
│   ├── Header.tsx
│   ├── SalarieForm.tsx      # Formulaire de saisie
│   └── ResultsPanel.tsx     # Affichage des résultats
├── engine/
│   ├── types.ts             # Types TypeScript
│   ├── simulate.ts          # Orchestrateur de calcul
│   ├── bituachLeumi.ts      # Cotisations sociales
│   ├── incomeTax.ts         # Impôt sur le revenu
│   ├── creditPoints.ts      # Points de crédit fiscaux
│   ├── pension.ts           # Calcul pension
│   ├── kerenHishtalmout.ts  # Keren Hishtalmout
│   ├── indirectCosts.ts     # Coûts indirects
│   ├── solver.ts            # Solveur net → brut
│   ├── validate.ts          # Validation des entrées
│   ├── format.ts            # Formatage des nombres
│   └── params/
│       ├── 2025.ts          # Paramètres fiscaux 2025
│       ├── 2026.ts          # Paramètres fiscaux 2026
│       ├── index.ts
│       └── types.ts
└── pdf/
    ├── PdfButton.tsx        # Bouton de téléchargement
    ├── SalarieReport.tsx    # Template du rapport PDF
    └── fonts.ts             # Polices pour le PDF
```
