/**
 * Palette du CRM
 * =====================================================================
 * Charte du cabinet : navy #1A2138, or #C9A24B, fond #F7F5F0.
 *
 * Le navy et l'or habillent le chrome (en-têtes, bordures, texte). Ils ne
 * servent pas de couleurs de série : sur le fond crème, le navy sort de la
 * bande de luminosité et l'or descend sous 3:1. Les séries utilisent des
 * teintes validées, vérifiées avec le validateur de palette contre la
 * surface #F7F5F0 (bande de luminosité, chroma, séparation daltonisme,
 * plancher vision normale). L'or reste employé pour la ligne d'objectif du
 * planning, avec libellé visible et vue tableau en relief du contraste.
 */

import type { StatutDeclaration } from '../rules/arkhot';

export const MARQUE = {
  navy: '#1A2138',
  or: '#C9A24B',
  fond: '#F7F5F0',
  surface: '#FFFFFF',
} as const;

export const ENCRE = {
  primaire: '#0b0b0b',
  secondaire: '#52514e',
  discret: '#898781',
  grille: '#e1e0d9',
  ligne: '#c3c2b7',
} as const;

/** Palette d'état — jamais réutilisée comme couleur de série. */
export const ETAT = {
  bon: '#0ca30c',
  attention: '#fab219',
  serieux: '#ec835a',
  critique: '#d03b3b',
} as const;

/**
 * Couleurs des statuts. Les cinq statuts actifs forment un jeu catégoriel
 * validé ; « hors périmètre » est un gris neutre, au sens de « donnée
 * absente » — ces dossiers ne sont comptés ni au numérateur ni au
 * dénominateur du hesder.
 */
export const COULEUR_STATUT: Record<StatutDeclaration, string> = {
  a_faire: '#2a78d6',
  en_cours: '#1baf7a',
  attente_client: '#eb6834',
  pret: '#4a3aa7',
  depose: '#0ca30c',
  hors_perimetre: '#c3c2b7',
};

/** Séries du planning : cumul planifié, minimum légal, objectif avec marge. */
export const COULEUR_PLANNING = {
  planifie: '#2a78d6',
  minimum: '#d03b3b',
  objectif: '#C9A24B',
} as const;

/** Couleur d'un palier selon qu'il est tenu, menacé ou manqué. */
export function couleurProgression(progression: number, tenu: boolean): string {
  if (tenu) return ETAT.bon;
  if (progression >= 0.75) return ETAT.attention;
  if (progression >= 0.4) return ETAT.serieux;
  return ETAT.critique;
}
