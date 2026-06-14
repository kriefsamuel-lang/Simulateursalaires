# Simulateur Salarial Israélien — Krief Expertise

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
| Vitest | Tests unitaires |
| Netlify | Hébergement |

## Installation et développement

```bash
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173/salarie/`.

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
