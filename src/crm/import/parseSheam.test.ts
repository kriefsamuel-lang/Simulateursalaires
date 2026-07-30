import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseLigne,
  parseListingSheam,
  versIso,
  typeDepuisCodes,
  repartitionParType,
} from './parseSheam';

const ici = dirname(fileURLToPath(import.meta.url));
const LISTING_REEL = readFileSync(join(ici, '__fixtures__', 'listing-sheam.txt'), 'utf-8');

// Extraits réels du listing « רשימת התיקים הנכללים באורכות לשנת המס 2025 ».
const IND_SIMPLE = '       31/08/2026                     52 02 43 בנינגה נח ראובן  011152709  ';
const IND_DEPOSE = '  MK   31/08/2026  29/06/2026      00 42 80 41 אילוז רות ו/או מיכאל  015285455  ';
const IND_PALIER2 = '  13   30/11/2026                     93 03 26 טמסוט ציליה סולטנה ו  068273754  ';
const SOCIETE = '       31/08/2026                     62 04 41 עונג בית וגן בע"מ  514938976  ';
const AMOUTA = '       31/08/2026                     85 13 43 רצון השם - ירושלים  580766319  ';
const NOM_NUMERIQUE = '       31/08/2026                     62 04 43 1000  515203099  ';

// =====================================================================
describe('versIso', () => {
  it('convertit une date שע"ם en ISO', () => {
    expect(versIso('31/08/2026')).toBe('2026-08-31');
    expect(versIso('29/06/2026')).toBe('2026-06-29');
    expect(versIso('1/3/2027')).toBe('2027-03-01');
  });

  it('rejette les dates impossibles ou mal formées', () => {
    expect(versIso('31/02/2026')).toBeNull();
    expect(versIso('31/04/2026')).toBeNull();
    expect(versIso('00/08/2026')).toBeNull();
    expect(versIso('31/13/2026')).toBeNull();
    expect(versIso('2026-08-31')).toBeNull();
    expect(versIso('')).toBeNull();
  });

  it('accepte le 29 février d’une année bissextile', () => {
    expect(versIso('29/02/2028')).toBe('2028-02-29');
    expect(versIso('29/02/2027')).toBeNull();
  });
});

// =====================================================================
describe('typeDepuisCodes', () => {
  it('reconnaît les סוגי תיק', () => {
    expect(typeDepuisCodes('62', '514938976')).toBe('societe');
    expect(typeDepuisCodes('85', '580766319')).toBe('amouta');
    expect(typeDepuisCodes('42', '015285455')).toBe('individu');
    expect(typeDepuisCodes('44', '347000000')).toBe('individu'); // בעל עסק זעיר
    expect(typeDepuisCodes('93', '012540357')).toBe('individu');
  });

  it('retombe sur le préfixe du תיק quand le סוג תיק manque', () => {
    expect(typeDepuisCodes(null, '580766319')).toBe('amouta');
    expect(typeDepuisCodes(null, '514938976')).toBe('societe');
    expect(typeDepuisCodes(null, '011152709')).toBe('individu');
  });
});

// =====================================================================
describe('parseLigne — ordre visuel RTL', () => {
  it('lit un individu sans dépôt', () => {
    expect(parseLigne(IND_SIMPLE)).toMatchObject({
      tik: '011152709',
      nom: 'בנינגה נח ראובן',
      pakidShuma: '43',
      sugTik: '52',
      arkhaLegale: '2026-08-31',
      dateDepot: null,
      codeShidour: null,
      type: 'individu',
    });
  });

  it('lit un individu déjà déposé, avec code שידור et colonne מח', () => {
    expect(parseLigne(IND_DEPOSE)).toMatchObject({
      tik: '015285455',
      nom: 'אילוז רות ו/או מיכאל',
      pakidShuma: '41',
      sugTik: '42',
      arkhaLegale: '2026-08-31',
      dateDepot: '2026-06-29',
      codeShidour: 'MK',
      type: 'individu',
    });
  });

  it('lit une arkha au palier de novembre', () => {
    expect(parseLigne(IND_PALIER2)).toMatchObject({
      tik: '068273754',
      arkhaLegale: '2026-11-30',
      dateDepot: null,
      pakidShuma: '26',
      sugTik: '93',
      type: 'individu',
    });
  });

  it('lit une société', () => {
    expect(parseLigne(SOCIETE)).toMatchObject({
      tik: '514938976',
      nom: 'עונג בית וגן בע"מ',
      pakidShuma: '41',
      sugTik: '62',
      type: 'societe',
    });
  });

  it('lit une עמותה', () => {
    expect(parseLigne(AMOUTA)).toMatchObject({
      tik: '580766319',
      nom: 'רצון השם - ירושלים',
      pakidShuma: '43',
      sugTik: '85',
      type: 'amouta',
    });
  });

  it('ne confond pas un nom numérique avec un code de colonne', () => {
    expect(parseLigne(NOM_NUMERIQUE)).toMatchObject({
      tik: '515203099',
      nom: '1000',
      pakidShuma: '43',
      sugTik: '62',
      type: 'societe',
    });
  });

  it('conserve les zéros de tête du תיק', () => {
    expect(parseLigne(IND_SIMPLE)!.tik).toBe('011152709');
  });
});

// =====================================================================
describe('parseLigne — ordre logique LTR', () => {
  // Même contenu, colonnes dans l'ordre logique : תיק, שם, codes, dates.
  const LOGIQUE = '  015285455  אילוז רות ו/או מיכאל  41 80 42 00  29/06/2026  31/08/2026  MK';
  const LOGIQUE_SIMPLE = '  011152709  בנינגה נח ראובן  43 02 52  31/08/2026';

  it('lit les mêmes champs quel que soit le sens de la ligne', () => {
    expect(parseLigne(LOGIQUE)).toMatchObject({
      tik: '015285455',
      nom: 'אילוז רות ו/או מיכאל',
      pakidShuma: '41',
      sugTik: '42',
      arkhaLegale: '2026-08-31',
      dateDepot: '2026-06-29',
      codeShidour: 'MK',
      type: 'individu',
    });
  });

  it('lit une ligne logique sans dépôt', () => {
    expect(parseLigne(LOGIQUE_SIMPLE)).toMatchObject({
      tik: '011152709',
      nom: 'בנינגה נח ראובן',
      pakidShuma: '43',
      sugTik: '52',
      arkhaLegale: '2026-08-31',
      dateDepot: null,
    });
  });
});

// =====================================================================
describe('parseLigne — robustesse', () => {
  it('ignore les marques bidi invisibles du presse-papier', () => {
    const avecBidi = '‫       31/08/2026                     62 04 41 ‏עונג בית וגן בע"מ‎  514938976  ‬';
    expect(parseLigne(avecBidi)).toMatchObject({ tik: '514938976', nom: 'עונג בית וגן בע"מ' });
  });

  it('tolère les tabulations et les espaces multiples', () => {
    const avecTabs = '\t31/08/2026\t\t62 04 41\tעונג בית וגן בע"מ\t514938976';
    expect(parseLigne(avecTabs)).toMatchObject({
      tik: '514938976',
      pakidShuma: '41',
      sugTik: '62',
      arkhaLegale: '2026-08-31',
    });
  });

  it('rejette les lignes de mise en page', () => {
    expect(parseLigne('')).toBeNull();
    expect(parseLigne('   ')).toBeNull();
    expect(parseLigne('  ---------  -------------------  --- - -- ---  -- ---------- ----------- ------')).toBeNull();
    expect(parseLigne('  1         דף 2025 רשימת התיקים הנכללים באורכות לשנת המס   336466248  מייצג ')).toBeNull();
    expect(parseLigne('  מספר תיק    שם משפחה ופרטי      פ.ש ח סת ס\'ש  מח   הגשה     תאריך ארכה  שידור ')).toBeNull();
    expect(parseLigne('  מח-מסמכים חסרים ENTER  ')).toBeNull();
    expect(parseLigne("    *-דוח לא מבוסס                    PF7  ")).toBeNull();
  });

  it('rejette l’en-tête de page, qui porte une date mais aucun dossier', () => {
    expect(parseLigne("30/07/2026 MZR@       קריאף שמואל שלום              ע'י: IDOM   שע'ם/מ'ה-שומה")).toBeNull();
  });

  it('rejette une ligne sans date d’arkha', () => {
    expect(parseLigne('       62 04 41 עונג בית וגן בע"מ  514938976')).toBeNull();
  });
});

// =====================================================================
describe('parseListingSheam — listing réel de שע"ם', () => {
  const resultat = parseListingSheam(LISTING_REEL);

  it('extrait les 93 dossiers des deux listings sans rien ignorer', () => {
    expect(resultat.lignes).toHaveLength(93);
    expect(resultat.ignorees).toEqual([]);
    expect(resultat.doublons).toEqual([]);
  });

  it('répartit les dossiers entre individus, sociétés et עמותות', () => {
    expect(repartitionParType(resultat.lignes)).toEqual({
      individu: 71,
      societe: 19,
      amouta: 3,
    });
  });

  it('donne un תיק de 8 ou 9 chiffres et un nom non vide à chaque ligne', () => {
    for (const l of resultat.lignes) {
      expect(l.tik).toMatch(/^\d{8,9}$/);
      expect(l.nom.length).toBeGreaterThan(0);
      expect(l.arkhaLegale).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('n’attribue que des dates d’arkha figurant au hesder 2025', () => {
    const attendues = new Set(['2026-08-31', '2026-11-30', '2026-12-31', '2027-02-28', '2027-03-31']);
    for (const l of resultat.lignes) {
      expect(attendues).toContain(l.arkhaLegale);
    }
  });

  it('place chaque dépôt avant son arkha et avant la date d’édition du listing', () => {
    const deposes = resultat.lignes.filter((l) => l.dateDepot !== null);
    expect(deposes.length).toBeGreaterThan(0);
    for (const l of deposes) {
      expect(l.dateDepot! <= l.arkhaLegale!).toBe(true);
      expect(l.dateDepot! <= '2026-07-30').toBe(true);
    }
  });

  it('associe le code שידור MK aux dossiers déposés', () => {
    for (const l of resultat.lignes) {
      if (l.codeShidour === 'MK') expect(l.dateDepot).not.toBeNull();
    }
  });

  it('classe toutes les עמותות sur des תיקים 58x avec סוג תיק 85', () => {
    const amoutot = resultat.lignes.filter((l) => l.type === 'amouta');
    expect(amoutot).toHaveLength(3);
    for (const a of amoutot) {
      expect(a.tik.startsWith('580')).toBe(true);
      expect(a.sugTik).toBe('85');
    }
  });

  it('classe toutes les sociétés sur des תיקים 51x avec סוג תיק 62', () => {
    const societes = resultat.lignes.filter((l) => l.type === 'societe');
    expect(societes).toHaveLength(19);
    for (const s of societes) {
      expect(s.tik.startsWith('51')).toBe(true);
      expect(s.sugTik).toBe('62');
    }
  });

  it('ne retient aucun תיק en double', () => {
    const tiks = resultat.lignes.map((l) => l.tik);
    expect(new Set(tiks).size).toBe(tiks.length);
  });

  it('numérote les lignes pour permettre le contrôle du rapport d’import', () => {
    expect(resultat.lignes.every((l) => l.numeroLigne > 0)).toBe(true);
  });
});

// =====================================================================
describe('parseListingSheam — rapport d’import', () => {
  it('signale les doublons et ne garde que la première occurrence', () => {
    const r = parseListingSheam([SOCIETE, IND_SIMPLE, SOCIETE].join('\n'));
    expect(r.lignes).toHaveLength(2);
    expect(r.doublons).toEqual(['514938976']);
    expect(r.ignorees).toHaveLength(1);
    expect(r.ignorees[0].numeroLigne).toBe(3);
  });

  it('rapporte une ligne de données inexploitable', () => {
    // תיק présent mais aucune date d'arkha lisible.
    const r = parseListingSheam('       62 04 41 עונג בית וגן בע"מ  514938976');
    expect(r.lignes).toHaveLength(0);
    expect(r.ignorees).toHaveLength(1);
    expect(r.ignorees[0].raison).toMatch(/arkha/);
  });

  it('reste silencieux sur les lignes de mise en page', () => {
    const r = parseListingSheam(
      [
        "30/07/2026 MZR@       קריאף שמואל שלום              ע'י: IDOM   שע'ם/מ'ה-שומה",
        '  1         דף 2025 רשימת התיקים הנכללים באורכות לשנת המס   336466248  מייצג ',
        '  ---------  -------------------  --- - -- ---  -- ---------- ----------- ------',
        SOCIETE,
        '  מח-מסמכים חסרים ENTER  ',
      ].join('\n'),
    );
    expect(r.lignes).toHaveLength(1);
    expect(r.ignorees).toEqual([]);
  });

  it('accepte un texte vide', () => {
    expect(parseListingSheam('')).toEqual({ lignes: [], ignorees: [], doublons: [] });
  });
});
