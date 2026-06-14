# Simulateur fiscal עצמאים — Krief Expertise

Application web de simulation fiscale pour indépendants israéliens (עצמאים), à usage
professionnel interne du cabinet Krief Expertise (Jérusalem). Interface en français,
termes fiscaux hébreux conservés (ביטוח לאומי, נקודות זיכוי, מקדמות, קרן השתלמות).

**Stack** : React + Vite + Tailwind CSS, PDF client via `@react-pdf/renderer`.
Build 100 % statique, déployable sur Netlify sans backend.

## Démarrage

```bash
npm install
npm run dev        # serveur de développement
npm test           # tests unitaires (Vitest)
npm run build      # build de production → dist/
```

Déploiement Netlify : le `netlify.toml` est fourni (commande `npm run build`,
publication de `dist/`).

## Architecture

```
src/
├── engine/                 # Moteur de calcul — fonctions pures, testées, sans UI
│   ├── params/
│   │   ├── types.ts        # Structure des paramètres annuels
│   │   ├── 2025.ts         # TOUS les paramètres fiscaux 2025
│   │   ├── 2026.ts         # TOUS les paramètres fiscaux 2026
│   │   └── index.ts        # Registre des années disponibles
│   ├── bituachLeumi.ts     # Cotisations עצמאי (deux medragot mensuelles)
│   ├── incomeTax.ts        # Barème progressif + מס יסף + taux marginal
│   ├── creditPoints.ts     # נקודות זיכוי ligne par ligne (enfants, oleh, מזונות…)
│   ├── pension.ts          # ניכוי §47, זיכוי §45א, פנסיית חובה, dépôt optimisé
│   ├── kerenHishtalmout.ts # ניכוי 4,5 % et plafonds
│   ├── solver.ts           # Point fixe BL ↔ IR (tolérance 1 ₪, max 20 itérations)
│   ├── simulate.ts         # Orchestration + comparatif sans/avec optimisation
│   ├── validate.ts         # Validation des entrées
│   └── format.ts           # Formatage ₪ locale fr-IL
├── components/             # Formulaire et résultats (React + Tailwind)
└── pdf/                    # Rapport client PDF (@react-pdf/renderer, police Rubik)
```

## Mise à jour annuelle des paramètres (≈ 15 minutes)

**Aucun chiffre fiscal n'existe en dehors de `src/engine/params/`.** Pour ajouter
l'année N :

1. Copier `src/engine/params/2026.ts` → `src/engine/params/<N>.ts`.
2. Mettre à jour chaque valeur depuis les sources officielles :
   - **Barème IR + מס יסף** : לוח עזר לחישוב מס הכנסה (רשות המסים, gov.il) ;
   - **Valeur de la נקודת זיכוי** : même לוח עזר ;
   - **Taux et plafonds ביטוח לאומי** : חוזר "שינוי בתשלום דמי ביטוח" (btl.gov.il) —
     les 4 taux (réduit/plein × BL/santé) et les 2 seuils mensuels ;
   - **Plafonds pension** (הכנסה מזכה) **et keren** (תקרה קובעת, תקרה מוטבת) :
     publications רשות המסים ;
   - **פנסיית חובה** : moitié/totalité du salaire moyen annuel (kolzchut / btl) ;
   - **Points enfants / oleh / soldat** : vérifier les reconductions législatives.
3. Mettre à jour `validationNotes` (chaque chiffre incertain doit y figurer).
4. Enregistrer l'année dans `src/engine/params/index.ts` (import + entrée du registre).
5. `npm test` — adapter les tests bornés à une année si besoin, puis valider
   quelques dossiers réels contre le simulateur de la רשות המסים.

Le sélecteur d'année du formulaire liste automatiquement les années du registre.

## Hypothèses de calcul (documentées dans le code)

- **Ordre des déductions** : ניכוי pension (11 %) et keren (4,5 %) déduits du
  bénéfice → assiette ביטוח לאומי ; puis revenu imposable IR = bénéfice − 52 % des
  דמי ביטוח לאומי (hors דמי בריאות) − ניכויים.
- **Assiette BTL** : après ניכויים pension/keren, sans réintégration de la déduction
  52 % (choix documenté dans `solver.ts`). Le solveur point fixe générique couvre
  toute variante d'assiette dépendant du BL payé.
- **Imputation pension** : le dépôt nourrit d'abord le ניכוי (11 % plafonné), le
  solde le זיכוי (35 % de 5,5 %, ou 6 % sans assurance אובדן כושר עבודה).
- **2025** : taux ביטוח לאומי post-תיקון 252 appliqués sur 12 mois (l'amendement
  prend effet en février — écart de janvier négligé, documenté dans `2025.ts`).
- Impôt net plancher 0 ; taux de מקדמות = impôt net ÷ CA arrondi à 0,1 % supérieur.

## Avertissements

- Les montants marqués **À VALIDER** dans les fichiers params (et listés dans
  l'encadré ambre de l'UI) doivent être contrôlés contre les circulaires
  officielles avant tout usage client.
- Simulation indicative — ne constitue pas une déclaration fiscale.
