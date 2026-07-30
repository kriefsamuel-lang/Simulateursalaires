import type { ReactNode } from 'react';
import { COULEUR_STATUT, ENCRE, MARQUE } from '../lib/theme';
import { LIBELLES_STATUT, LIBELLES_TYPE } from '../lib/types';
import type { StatutDeclaration, TypeClient } from '../lib/types';

// ---------------------------------------------------------------------
// Nom hébreu — le RTL est confiné à la cellule, pas à la page
// ---------------------------------------------------------------------

export function NomHebreu({ nom, className = '' }: { nom: string; className?: string }) {
  return (
    <bdi dir="rtl" lang="he" className={`inline-block text-right ${className}`}>
      {nom}
    </bdi>
  );
}

// ---------------------------------------------------------------------
// Carte
// ---------------------------------------------------------------------

export function Carte({
  titre,
  soustitre,
  actions,
  children,
  className = '',
}: {
  titre?: string;
  soustitre?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-white rounded-lg border border-black/10 shadow-sm ${className}`}
    >
      {(titre || actions) && (
        <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-black/5">
          <div>
            {titre && <h2 className="text-sm font-semibold text-navy tracking-tight">{titre}</h2>}
            {soustitre && <p className="text-xs text-[#52514e] mt-0.5">{soustitre}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------
// Tuile de chiffre clé
// ---------------------------------------------------------------------

export function Tuile({
  libelle,
  valeur,
  detail,
  accent,
}: {
  libelle: string;
  valeur: ReactNode;
  detail?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-black/10 shadow-sm px-5 py-4">
      <div className="text-xs font-medium text-[#52514e] uppercase tracking-wide">{libelle}</div>
      <div
        className="mt-2 text-3xl font-semibold leading-none"
        style={{ color: accent ?? MARQUE.navy }}
      >
        {valeur}
      </div>
      {detail && <div className="mt-2 text-xs text-[#52514e]">{detail}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------
// Pastilles
// ---------------------------------------------------------------------

/** Le statut est porté par le texte ; la couleur ne fait que le renforcer. */
export function PastilleStatut({ statut }: { statut: StatutDeclaration }) {
  const couleur = COULEUR_STATUT[statut];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-[#0b0b0b]">
      <span
        aria-hidden="true"
        className="w-2 h-2 rounded-full flex-shrink-0 ring-2 ring-white"
        style={{ backgroundColor: couleur }}
      />
      {LIBELLES_STATUT[statut].fr}
    </span>
  );
}

export function PastilleType({ type }: { type: TypeClient }) {
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-navy/5 text-navy whitespace-nowrap">
      {LIBELLES_TYPE[type].fr}
    </span>
  );
}

// ---------------------------------------------------------------------
// Barre de progression face à un palier
// ---------------------------------------------------------------------

export function Jauge({
  valeur,
  total,
  couleur,
  hauteur = 10,
}: {
  valeur: number;
  total: number;
  couleur: string;
  hauteur?: number;
}) {
  const ratio = total <= 0 ? 1 : Math.min(1, valeur / total);
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: hauteur, backgroundColor: ENCRE.grille }}
      role="img"
      aria-label={`${valeur} sur ${total}`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${ratio * 100}%`, backgroundColor: couleur }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// Barres horizontales — magnitude, série unique
// ---------------------------------------------------------------------

export function BarresHorizontales({
  donnees,
  couleurParDefaut = MARQUE.navy,
  formatValeur = (n: number) => String(n),
}: {
  donnees: { cle: string; libelle: ReactNode; valeur: number; couleur?: string }[];
  couleurParDefaut?: string;
  formatValeur?: (n: number) => string;
}) {
  const max = Math.max(1, ...donnees.map((d) => d.valeur));
  if (donnees.length === 0) {
    return <p className="text-sm text-[#898781]">Aucune donnée.</p>;
  }
  return (
    <div className="space-y-2.5">
      {donnees.map((d) => (
        <div key={d.cle} className="grid grid-cols-[9rem_1fr_2.5rem] items-center gap-3">
          <div className="text-xs text-[#52514e] truncate" title={typeof d.libelle === 'string' ? d.libelle : undefined}>
            {d.libelle}
          </div>
          <div className="h-5 rounded-r flex items-center">
            <div
              className="h-full rounded-r transition-[width] duration-500"
              style={{
                width: `${(d.valeur / max) * 100}%`,
                backgroundColor: d.couleur ?? couleurParDefaut,
                minWidth: d.valeur > 0 ? 3 : 0,
              }}
            />
          </div>
          <div className="text-xs font-medium text-[#0b0b0b] tabular-nums text-right">
            {formatValeur(d.valeur)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Divers
// ---------------------------------------------------------------------

export function Bouton({
  children,
  onClick,
  variante = 'secondaire',
  disabled,
  type = 'button',
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: 'primaire' | 'secondaire' | 'discret';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  const styles = {
    primaire: 'bg-navy text-white hover:bg-navy/90 border-navy',
    secondaire: 'bg-white text-navy hover:bg-navy/5 border-black/15',
    discret: 'bg-transparent text-[#52514e] hover:bg-black/5 border-transparent',
  }[variante];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Chargement({ texte = 'Chargement…' }: { texte?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-[#898781]">{texte}</div>
  );
}

export function Erreur({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-[#d03b3b]/30 bg-[#d03b3b]/5 px-4 py-3 text-sm text-[#d03b3b]">
      <strong className="font-semibold">Erreur — </strong>
      {message}
    </div>
  );
}

export function Vide({ texte }: { texte: string }) {
  return <div className="py-12 text-center text-sm text-[#898781]">{texte}</div>;
}
