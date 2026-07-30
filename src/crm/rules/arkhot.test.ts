import { describe, it, expect } from 'vitest';
import {
  populationDe,
  compteDansLaMesure,
  entreDansEffectif,
  quotaRequis,
  paliersDe,
  effectifDe,
  deposesALaDate,
  etatPalier,
  etatPopulation,
  etatCampagne,
  minimumExigeALaDate,
  moisDeCampagne,
  projectionMensuelle,
  ordonnerParAvancement,
  autoRepartition,
  moisDe,
  finDeMois,
  ajouteMois,
  joursEntre,
  listeMois,
  type Palier,
  type DossierArkhot,
  type StatutDeclaration,
} from './arkhot';

// ---------------------------------------------------------------------
// Paliers réels de l'année fiscale 2025 (circulaire du 28/04/2026)
// ---------------------------------------------------------------------
const PALIERS_2025: Palier[] = [
  { annee: 2025, population: 'yehidim', dateLimite: '2026-08-31', pourcentage: 10 },
  { annee: 2025, population: 'yehidim', dateLimite: '2026-11-30', pourcentage: 50 },
  { annee: 2025, population: 'yehidim', dateLimite: '2027-02-28', pourcentage: 100 },
  { annee: 2025, population: 'haver_bnei_adam', dateLimite: '2026-08-31', pourcentage: 10 },
  { annee: 2025, population: 'haver_bnei_adam', dateLimite: '2026-12-31', pourcentage: 40 },
  { annee: 2025, population: 'haver_bnei_adam', dateLimite: '2027-03-31', pourcentage: 100 },
];

function dossier(
  tik: string,
  population: DossierArkhot['population'],
  statut: StatutDeclaration,
  extra: Partial<DossierArkhot> = {},
): DossierArkhot {
  return { tik, population, statut, ...extra };
}

/** n dossiers d'une population, tous « à faire ». */
function nDossiers(n: number, population: DossierArkhot['population']): DossierArkhot[] {
  return Array.from({ length: n }, (_, i) =>
    dossier(`${population}-${String(i).padStart(3, '0')}`, population, 'a_faire'),
  );
}

// =====================================================================
describe('utilitaires de date', () => {
  it('extrait le mois et calcule les fins de mois, y compris février bissextile', () => {
    expect(moisDe('2026-08-31')).toBe('2026-08');
    expect(finDeMois('2026-08')).toBe('2026-08-31');
    expect(finDeMois('2026-11')).toBe('2026-11-30');
    expect(finDeMois('2027-02')).toBe('2027-02-28');
    expect(finDeMois('2028-02')).toBe('2028-02-29');
  });

  it('ajoute des mois en franchissant les années', () => {
    expect(ajouteMois('2026-08', 1)).toBe('2026-09');
    expect(ajouteMois('2026-12', 1)).toBe('2027-01');
    expect(ajouteMois('2027-01', -1)).toBe('2026-12');
    expect(ajouteMois('2026-08', 7)).toBe('2027-03');
  });

  it('compte les jours entre deux dates', () => {
    expect(joursEntre('2026-08-01', '2026-08-31')).toBe(30);
    expect(joursEntre('2026-08-31', '2026-08-01')).toBe(-30);
    expect(joursEntre('2026-12-31', '2027-01-01')).toBe(1);
  });

  it('énumère les mois de la campagne août 2026 → mars 2027', () => {
    expect(listeMois('2026-08', '2027-03')).toEqual([
      '2026-08', '2026-09', '2026-10', '2026-11',
      '2026-12', '2027-01', '2027-02', '2027-03',
    ]);
  });
});

// =====================================================================
describe('règles élémentaires', () => {
  it('classe les מלכ"רים avec les sociétés sous חבר בני אדם', () => {
    expect(populationDe('individu')).toBe('yehidim');
    expect(populationDe('societe')).toBe('haver_bnei_adam');
    expect(populationDe('amouta')).toBe('haver_bnei_adam');
  });

  it('ne compte que le statut « Déposé » dans la mesure', () => {
    const statuts: StatutDeclaration[] = [
      'a_faire', 'en_cours', 'attente_client', 'pret', 'depose', 'hors_perimetre',
    ];
    expect(statuts.filter(compteDansLaMesure)).toEqual(['depose']);
  });

  it('exclut les dossiers hors périmètre de l’effectif', () => {
    expect(entreDansEffectif('hors_perimetre')).toBe(false);
    expect(entreDansEffectif('a_faire')).toBe(true);
    expect(entreDansEffectif('depose')).toBe(true);
  });

  it('arrondit le quota au supérieur', () => {
    expect(quotaRequis(100, 10)).toBe(10);
    expect(quotaRequis(101, 10)).toBe(11); // 10,1 → 11
    expect(quotaRequis(47, 10)).toBe(5);   // 4,7  → 5
    expect(quotaRequis(47, 50)).toBe(24);  // 23,5 → 24
    expect(quotaRequis(47, 100)).toBe(47);
    expect(quotaRequis(1, 10)).toBe(1);    // un seul dossier : il faut le déposer
    expect(quotaRequis(0, 100)).toBe(0);
  });

  it('trie les paliers d’une population par date limite', () => {
    const p = paliersDe(PALIERS_2025, 2025, 'haver_bnei_adam');
    expect(p.map((x) => x.dateLimite)).toEqual(['2026-08-31', '2026-12-31', '2027-03-31']);
    expect(p.map((x) => x.pourcentage)).toEqual([10, 40, 100]);
  });

  it('ne retourne rien pour une année sans paliers', () => {
    expect(paliersDe(PALIERS_2025, 2024, 'yehidim')).toEqual([]);
  });
});

// =====================================================================
describe('effectif et dépôts', () => {
  const dossiers: DossierArkhot[] = [
    dossier('1', 'yehidim', 'depose', { dateDepot: '2026-06-29' }),
    dossier('2', 'yehidim', 'a_faire'),
    dossier('3', 'yehidim', 'hors_perimetre'),
    dossier('4', 'haver_bnei_adam', 'depose', { dateDepot: '2026-09-15' }),
  ];

  it('exclut les hors-périmètre et filtre par population', () => {
    expect(effectifDe(dossiers, 'yehidim').map((d) => d.tik)).toEqual(['1', '2']);
    expect(effectifDe(dossiers, 'haver_bnei_adam').map((d) => d.tik)).toEqual(['4']);
  });

  it('comptabilise un dépôt à sa date, pas avant', () => {
    expect(deposesALaDate(dossiers, '2026-06-28')).toBe(0);
    expect(deposesALaDate(dossiers, '2026-06-29')).toBe(1);
    expect(deposesALaDate(dossiers, '2026-09-30')).toBe(2);
  });

  it('compte un dossier déposé sans date connue comme déposé de longue date', () => {
    const sansDate = [dossier('x', 'yehidim', 'depose', { dateDepot: null })];
    expect(deposesALaDate(sansDate, '2026-01-01')).toBe(1);
  });
});

// =====================================================================
describe('etatPalier', () => {
  it('mesure le palier 10 % des individus sur 47 dossiers', () => {
    const dossiers = [
      ...nDossiers(44, 'yehidim'),
      dossier('d1', 'yehidim', 'depose', { dateDepot: '2026-06-29' }),
      dossier('d2', 'yehidim', 'depose', { dateDepot: '2026-07-02' }),
      dossier('d3', 'yehidim', 'depose', { dateDepot: '2026-07-14' }),
    ];
    const e = etatPalier(dossiers, PALIERS_2025[0], '2026-07-30');

    expect(e.effectif).toBe(47);
    expect(e.quotaRequis).toBe(5); // ceil(4,7)
    expect(e.deposes).toBe(3);
    expect(e.ecart).toBe(2);
    expect(e.tenu).toBe(false);
    expect(e.echu).toBe(false);
    expect(e.progression).toBeCloseTo(3 / 5);
  });

  it('marque le palier comme tenu et borne la progression à 1', () => {
    const dossiers = [
      ...nDossiers(8, 'yehidim'),
      dossier('d1', 'yehidim', 'depose', { dateDepot: '2026-08-01' }),
      dossier('d2', 'yehidim', 'depose', { dateDepot: '2026-08-02' }),
    ];
    const e = etatPalier(dossiers, PALIERS_2025[0], '2026-08-15');
    expect(e.quotaRequis).toBe(1); // ceil(10 × 0,10)
    expect(e.deposes).toBe(2);
    expect(e.tenu).toBe(true);
    expect(e.ecart).toBe(0);
    expect(e.progression).toBe(1);
  });

  it('fige la mesure à la date limite une fois le palier échu', () => {
    const dossiers = [
      ...nDossiers(9, 'yehidim'),
      // Déposé après l'échéance : ne rattrape pas le palier de août.
      dossier('tardif', 'yehidim', 'depose', { dateDepot: '2026-09-05' }),
    ];
    const e = etatPalier(dossiers, PALIERS_2025[0], '2026-09-30');
    expect(e.echu).toBe(true);
    expect(e.deposes).toBe(0);
    expect(e.ecart).toBe(1);
    expect(e.tenu).toBe(false);
  });

  it('considère un effectif nul comme conforme', () => {
    const e = etatPalier([], PALIERS_2025[0], '2026-08-31');
    expect(e.effectif).toBe(0);
    expect(e.quotaRequis).toBe(0);
    expect(e.tenu).toBe(true);
    expect(e.progression).toBe(1);
  });
});

// =====================================================================
describe('etatPopulation', () => {
  it('identifie le prochain palier et l’écart à combler', () => {
    const dossiers = [
      ...nDossiers(30, 'haver_bnei_adam'),
      dossier('a', 'haver_bnei_adam', 'depose', { dateDepot: '2026-07-01' }),
    ];
    const e = etatPopulation(dossiers, PALIERS_2025, 2025, 'haver_bnei_adam', '2026-07-30');

    expect(e.effectif).toBe(31);
    expect(e.deposes).toBe(1);
    expect(e.paliers).toHaveLength(3);
    expect(e.prochainPalier?.palier.dateLimite).toBe('2026-08-31');
    expect(e.prochainPalier?.quotaRequis).toBe(4); // ceil(3,1)
    expect(e.ecartProchainPalier).toBe(3);
    expect(e.joursRestants).toBe(32);
  });

  it('passe au palier suivant quand le premier est échu', () => {
    const dossiers = nDossiers(10, 'yehidim');
    const e = etatPopulation(dossiers, PALIERS_2025, 2025, 'yehidim', '2026-09-15');
    expect(e.prochainPalier?.palier.pourcentage).toBe(50);
    expect(e.prochainPalier?.quotaRequis).toBe(5);
    expect(e.joursRestants).toBe(76);
  });

  it('n’a plus de prochain palier une fois la campagne terminée', () => {
    const e = etatPopulation(nDossiers(10, 'yehidim'), PALIERS_2025, 2025, 'yehidim', '2027-06-01');
    expect(e.prochainPalier).toBeNull();
    expect(e.ecartProchainPalier).toBe(0);
    expect(e.joursRestants).toBeNull();
  });

  it('mesure les deux populations séparément', () => {
    const dossiers = [...nDossiers(20, 'yehidim'), ...nDossiers(10, 'haver_bnei_adam')];
    const [ind, hba] = etatCampagne(dossiers, PALIERS_2025, 2025, '2026-07-30');

    expect(ind.population).toBe('yehidim');
    expect(ind.effectif).toBe(20);
    expect(hba.population).toBe('haver_bnei_adam');
    expect(hba.effectif).toBe(10);
    // Les échéances intermédiaires diffèrent entre les deux populations.
    expect(ind.paliers[1].palier.dateLimite).toBe('2026-11-30');
    expect(hba.paliers[1].palier.dateLimite).toBe('2026-12-31');
  });
});

// =====================================================================
describe('minimumExigeALaDate — rampe linéaire', () => {
  const yehidim = paliersDe(PALIERS_2025, 2025, 'yehidim');

  it('rend exactement le quota légal aux dates de palier', () => {
    expect(minimumExigeALaDate(100, yehidim, '2026-08-31')).toBe(10);
    expect(minimumExigeALaDate(100, yehidim, '2026-11-30')).toBe(50);
    expect(minimumExigeALaDate(100, yehidim, '2027-02-28')).toBe(100);
  });

  it('interpole entre deux paliers', () => {
    // 91 jours du 31/08 au 30/11, 40 dossiers à absorber.
    // Au 15/10 : 45 jours écoulés → 10 + 40 × 45/91 ≈ 29,8 → 30.
    expect(minimumExigeALaDate(100, yehidim, '2026-10-15')).toBe(30);
  });

  it('n’exige rien avant le début de la campagne et plafonne après le dernier palier', () => {
    expect(minimumExigeALaDate(100, yehidim, '2026-08-01')).toBe(0);
    expect(minimumExigeALaDate(100, yehidim, '2026-07-01')).toBe(0);
    expect(minimumExigeALaDate(100, yehidim, '2027-12-31')).toBe(100);
  });

  it('ne dépasse jamais le quota du palier visé', () => {
    for (const d of ['2026-09-01', '2026-10-01', '2026-11-29', '2026-11-30']) {
      expect(minimumExigeALaDate(100, yehidim, d)).toBeLessThanOrEqual(50);
    }
  });

  it('reste à zéro pour un effectif nul ou sans paliers', () => {
    expect(minimumExigeALaDate(0, yehidim, '2026-11-30')).toBe(0);
    expect(minimumExigeALaDate(100, [], '2026-11-30')).toBe(0);
  });
});

// =====================================================================
describe('projectionMensuelle', () => {
  it('couvre août 2026 → février 2027 pour les individus', () => {
    const p = projectionMensuelle(nDossiers(50, 'yehidim'), PALIERS_2025, 2025, 'yehidim');
    expect(p.map((m) => m.mois)).toEqual([
      '2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02',
    ]);
  });

  it('couvre août 2026 → mars 2027 pour חבר בני אדם', () => {
    const p = projectionMensuelle(nDossiers(50, 'haver_bnei_adam'), PALIERS_2025, 2025, 'haver_bnei_adam');
    expect(p.map((m) => m.mois)).toEqual([
      '2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03',
    ]);
    expect(moisDeCampagne(PALIERS_2025, 2025, 'haver_bnei_adam')).toHaveLength(8);
  });

  it('rattache chaque palier à son mois et rend le minimum légal', () => {
    const p = projectionMensuelle(nDossiers(100, 'yehidim'), PALIERS_2025, 2025, 'yehidim');
    const aout = p.find((m) => m.mois === '2026-08')!;
    const nov = p.find((m) => m.mois === '2026-11')!;
    const fev = p.find((m) => m.mois === '2027-02')!;

    expect(aout.palier?.pourcentage).toBe(10);
    expect(aout.minimumExige).toBe(10);
    expect(nov.palier?.pourcentage).toBe(50);
    expect(nov.minimumExige).toBe(50);
    expect(fev.palier?.pourcentage).toBe(100);
    expect(fev.minimumExige).toBe(100);
    expect(p.find((m) => m.mois === '2026-09')!.palier).toBeNull();
  });

  it('applique la marge de sécurité sans dépasser l’effectif', () => {
    const p = projectionMensuelle(nDossiers(100, 'yehidim'), PALIERS_2025, 2025, 'yehidim', {
      margeSecurite: 0.2,
    });
    expect(p.find((m) => m.mois === '2026-08')!.objectifCumule).toBe(12); // 10 × 1,2
    expect(p.find((m) => m.mois === '2026-11')!.objectifCumule).toBe(60); // 50 × 1,2
    expect(p.find((m) => m.mois === '2027-02')!.objectifCumule).toBe(100); // borné
  });

  it('cumule dépôts réalisés et dépôts planifiés', () => {
    const dossiers: DossierArkhot[] = [
      ...nDossiers(7, 'yehidim'),
      dossier('a', 'yehidim', 'depose', { dateDepot: '2026-08-10' }),
      dossier('b', 'yehidim', 'pret', { moisCible: '2026-09' }),
      dossier('c', 'yehidim', 'en_cours', { moisCible: '2026-11' }),
    ];
    const p = projectionMensuelle(dossiers, PALIERS_2025, 2025, 'yehidim');

    const aout = p.find((m) => m.mois === '2026-08')!;
    const sept = p.find((m) => m.mois === '2026-09')!;
    const nov = p.find((m) => m.mois === '2026-11')!;

    expect(aout.deposesCumules).toBe(1);
    expect(aout.planifieCumule).toBe(1);
    expect(aout.planifieDuMois).toBe(1);

    expect(sept.deposesCumules).toBe(1);
    expect(sept.planifieCumule).toBe(2); // le dépôt d'août + le planifié de septembre
    expect(sept.planifieDuMois).toBe(1);

    expect(nov.planifieCumule).toBe(3);
    expect(nov.minimumExige).toBe(5); // ceil(10 × 0,5)
    expect(nov.manque).toBe(2);
  });

  it('ne signale aucun manque quand le planning couvre l’objectif', () => {
    const dossiers: DossierArkhot[] = [
      ...Array.from({ length: 10 }, (_, i) =>
        dossier(`p${i}`, 'yehidim', 'pret', { moisCible: '2026-08' }),
      ),
    ];
    const p = projectionMensuelle(dossiers, PALIERS_2025, 2025, 'yehidim');
    expect(p.every((m) => m.manque === 0)).toBe(true);
  });
});

// =====================================================================
describe('ordonnerParAvancement', () => {
  it('classe par statut, puis avancement, puis priorité, puis arkha', () => {
    const d: DossierArkhot[] = [
      dossier('afaire', 'yehidim', 'a_faire', { avancement: 0.9 }),
      dossier('pret', 'yehidim', 'pret', { avancement: 0 }),
      dossier('encours-bas', 'yehidim', 'en_cours', { avancement: 0.5 }),
      dossier('encours-haut', 'yehidim', 'en_cours', { avancement: 0.8 }),
      dossier('attente', 'yehidim', 'attente_client', { avancement: 1 }),
    ];
    expect(ordonnerParAvancement(d).map((x) => x.tik)).toEqual([
      'pret', 'encours-haut', 'encours-bas', 'attente', 'afaire',
    ]);
  });

  it('départage à avancement égal par la priorité puis par l’arkha', () => {
    const d: DossierArkhot[] = [
      dossier('normale', 'yehidim', 'en_cours', { avancement: 0.5, priorite: 'normale' }),
      dossier('haute', 'yehidim', 'en_cours', { avancement: 0.5, priorite: 'haute' }),
      dossier('basse', 'yehidim', 'en_cours', { avancement: 0.5, priorite: 'basse' }),
    ];
    expect(ordonnerParAvancement(d).map((x) => x.tik)).toEqual(['haute', 'normale', 'basse']);

    const e: DossierArkhot[] = [
      dossier('tard', 'yehidim', 'en_cours', { arkhaLegale: '2027-02-28' }),
      dossier('tot', 'yehidim', 'en_cours', { arkhaLegale: '2026-08-31' }),
    ];
    expect(ordonnerParAvancement(e).map((x) => x.tik)).toEqual(['tot', 'tard']);
  });

  it('ne modifie pas le tableau d’entrée', () => {
    const d = [
      dossier('a', 'yehidim', 'a_faire'),
      dossier('b', 'yehidim', 'pret'),
    ];
    ordonnerParAvancement(d);
    expect(d.map((x) => x.tik)).toEqual(['a', 'b']);
  });
});

// =====================================================================
describe('autoRepartition', () => {
  it('affecte tous les dossiers non déposés et aucun dossier déposé', () => {
    const dossiers: DossierArkhot[] = [
      ...nDossiers(20, 'yehidim'),
      dossier('deja', 'yehidim', 'depose', { dateDepot: '2026-08-05' }),
      dossier('hors', 'yehidim', 'hors_perimetre'),
    ];
    const a = autoRepartition(dossiers, PALIERS_2025, 2025, 'yehidim', { aujourdhui: '2026-08-01' });

    expect(a).toHaveLength(20);
    expect(a.map((x) => x.tik)).not.toContain('deja');
    expect(a.map((x) => x.tik)).not.toContain('hors');
  });

  it('produit un planning qui couvre chaque palier', () => {
    const dossiers = nDossiers(100, 'yehidim');
    const a = autoRepartition(dossiers, PALIERS_2025, 2025, 'yehidim', { aujourdhui: '2026-08-01' });

    const avecCible = dossiers.map((d) => ({
      ...d,
      moisCible: a.find((x) => x.tik === d.tik)?.moisCible ?? null,
    }));
    const p = projectionMensuelle(avecCible, PALIERS_2025, 2025, 'yehidim');

    expect(p.every((m) => m.planifieCumule >= m.minimumExige)).toBe(true);
    expect(p[p.length - 1].planifieCumule).toBe(100);
  });

  it('respecte la marge de sécurité dans le planning produit', () => {
    const dossiers = nDossiers(100, 'yehidim');
    const options = { aujourdhui: '2026-08-01', margeSecurite: 0.15 };
    const a = autoRepartition(dossiers, PALIERS_2025, 2025, 'yehidim', options);

    const avecCible = dossiers.map((d) => ({
      ...d,
      moisCible: a.find((x) => x.tik === d.tik)?.moisCible ?? null,
    }));
    const p = projectionMensuelle(avecCible, PALIERS_2025, 2025, 'yehidim', options);

    expect(p.every((m) => m.manque === 0)).toBe(true);
  });

  it('sert d’abord les dossiers les plus avancés', () => {
    const dossiers: DossierArkhot[] = [
      ...nDossiers(18, 'yehidim'),
      dossier('pret-1', 'yehidim', 'pret', { avancement: 1 }),
      dossier('pret-2', 'yehidim', 'pret', { avancement: 0.9 }),
    ];
    const a = autoRepartition(dossiers, PALIERS_2025, 2025, 'yehidim', { aujourdhui: '2026-08-01' });
    const aout = a.filter((x) => x.moisCible === '2026-08').map((x) => x.tik);

    // Quota d'août : ceil(20 × 0,10) = 2, servi par les deux dossiers prêts.
    expect(aout).toEqual(['pret-1', 'pret-2']);
  });

  it('ne planifie jamais dans un mois déjà écoulé', () => {
    const a = autoRepartition(nDossiers(30, 'yehidim'), PALIERS_2025, 2025, 'yehidim', {
      aujourdhui: '2026-11-15',
    });
    expect(a.every((x) => x.moisCible >= '2026-11')).toBe(true);
  });

  it('bascule tout sur le dernier mois quand la campagne est échue', () => {
    const a = autoRepartition(nDossiers(5, 'yehidim'), PALIERS_2025, 2025, 'yehidim', {
      aujourdhui: '2027-08-01',
    });
    expect(a).toHaveLength(5);
    expect(a.every((x) => x.moisCible === '2027-02')).toBe(true);
  });

  it('tient compte des dépôts déjà réalisés pour ne pas surcharger le mois', () => {
    const dossiers: DossierArkhot[] = [
      ...nDossiers(90, 'yehidim'),
      ...Array.from({ length: 10 }, (_, i) =>
        dossier(`d${i}`, 'yehidim', 'depose', { dateDepot: '2026-08-01' }),
      ),
    ];
    const a = autoRepartition(dossiers, PALIERS_2025, 2025, 'yehidim', { aujourdhui: '2026-08-02' });
    // Le palier d'août (10 sur 100) est déjà couvert : rien à planifier en août.
    expect(a.filter((x) => x.moisCible === '2026-08')).toHaveLength(0);
    expect(a).toHaveLength(90);
  });

  it('retourne un planning vide sans paliers', () => {
    expect(autoRepartition(nDossiers(5, 'yehidim'), [], 2025, 'yehidim')).toEqual([]);
  });
});
