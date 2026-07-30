import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigure } from './lib/supabase';
import {
  appliquerRepartition,
  chargerAnnees,
  chargerDossiers,
  chargerPaliers,
  majDeclaration,
  majTache,
  type PatchDeclaration,
} from './lib/data';
import { moisDeCampagne, type AffectationMois, type Palier } from './rules/arkhot';
import type { Dossier } from './lib/types';
import { Bouton, Carte, Chargement, Erreur } from './components/ui';
import Dashboard from './pages/Dashboard';
import DossiersEcran from './pages/Dossiers';
import Planning from './pages/Planning';
import Import from './pages/Import';

type Onglet = 'tableau-de-bord' | 'dossiers' | 'planning' | 'import';

const ONGLETS: { cle: Onglet; libelle: string }[] = [
  { cle: 'tableau-de-bord', libelle: 'Tableau de bord' },
  { cle: 'dossiers', libelle: 'Dossiers' },
  { cle: 'planning', libelle: 'Planning' },
  { cle: 'import', libelle: 'Import' },
];

// ---------------------------------------------------------------------
// Monogramme
// ---------------------------------------------------------------------

function Monogramme({ taille = 40 }: { taille?: number }) {
  return (
    <div
      className="rounded-full bg-gold flex items-center justify-center flex-shrink-0"
      style={{ width: taille, height: taille }}
      aria-hidden="true"
    >
      <span className="text-navy font-bold" style={{ fontSize: taille * 0.38 }}>
        KE
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------
// Connexion
// ---------------------------------------------------------------------

function Connexion() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function connecter(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    if (error) setErreur(error.message);
    setEnCours(false);
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Monogramme taille={56} />
          <h1 className="mt-4 text-xl font-semibold text-navy">Krief Expertise</h1>
          <p className="text-sm text-[#52514e]">CRM interne · Jérusalem</p>
        </div>

        <form onSubmit={connecter} className="bg-white rounded-lg border border-black/10 shadow-sm p-6 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-[#52514e] uppercase tracking-wide">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#52514e] uppercase tracking-wide">
              Mot de passe
            </span>
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </label>
          {erreur && <Erreur message={erreur} />}
          <Bouton variante="primaire" type="submit" disabled={enCours} className="w-full justify-center">
            {enCours ? 'Connexion…' : 'Se connecter'}
          </Bouton>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Écran de configuration manquante
// ---------------------------------------------------------------------

function ConfigurationManquante() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-lg">
        <Carte titre="Base de données non configurée">
          <p className="text-sm text-[#52514e] mb-3">
            Le CRM a besoin d'une base Supabase. Renseignez les deux variables d'environnement
            suivantes, puis relancez le build :
          </p>
          <pre className="bg-navy text-white text-xs rounded-md p-3 overflow-x-auto">
{`VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi…`}
          </pre>
          <p className="text-xs text-[#898781] mt-3">
            Les migrations se trouvent dans <code>supabase/migrations/</code>.
          </p>
        </Carte>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------

export default function CrmApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChargee, setSessionChargee] = useState(false);

  const [onglet, setOnglet] = useState<Onglet>('tableau-de-bord');
  const [annee, setAnnee] = useState(2025);
  const [annees, setAnnees] = useState<number[]>([2025]);
  const [paliers, setPaliers] = useState<Palier[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const aujourdhui = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (!supabaseConfigure) {
      setSessionChargee(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionChargee(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const recharger = useCallback(async () => {
    setErreur(null);
    try {
      const [p, d] = await Promise.all([chargerPaliers(annee), chargerDossiers(annee)]);
      setPaliers(p);
      setDossiers(d);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setChargement(false);
    }
  }, [annee]);

  useEffect(() => {
    if (!session) return;
    setChargement(true);
    chargerAnnees()
      .then((a) => {
        if (a.length > 0) setAnnees(a);
      })
      .catch(() => undefined);
    void recharger();
  }, [session, recharger]);

  // Mise à jour optimiste : l'écran répond tout de suite, la base suit.
  const patcher = useCallback(
    async (id: string, patch: PatchDeclaration) => {
      const avant = dossiers;
      setDossiers((ds) =>
        ds.map((d) => {
          if (d.id !== id) return d;
          const suivant = { ...d };
          if (patch.statut !== undefined) {
            suivant.statut = patch.statut;
            suivant.dateDepot =
              patch.statut === 'depose' ? (patch.dateDepot ?? d.dateDepot ?? aujourdhui) : null;
          }
          if (patch.dateDepot !== undefined && patch.statut === undefined) {
            suivant.dateDepot = patch.dateDepot;
          }
          if (patch.priorite !== undefined) suivant.priorite = patch.priorite;
          if (patch.notes !== undefined) suivant.notes = patch.notes;
          if (patch.moisCible !== undefined) suivant.moisCible = patch.moisCible;
          return suivant;
        }),
      );
      try {
        await majDeclaration(id, patch);
      } catch (e) {
        setDossiers(avant);
        setErreur(e instanceof Error ? e.message : String(e));
      }
    },
    [dossiers, aujourdhui],
  );

  const basculerTache = useCallback(
    async (tacheId: string, fait: boolean) => {
      const avant = dossiers;
      setDossiers((ds) =>
        ds.map((d) => {
          if (!d.taches.some((t) => t.id === tacheId)) return d;
          const taches = d.taches.map((t) => (t.id === tacheId ? { ...t, fait } : t));
          const faites = taches.filter((t) => t.fait).length;
          return {
            ...d,
            taches,
            tachesFaites: faites,
            avancement: taches.length === 0 ? 0 : faites / taches.length,
          };
        }),
      );
      try {
        await majTache(tacheId, fait);
      } catch (e) {
        setDossiers(avant);
        setErreur(e instanceof Error ? e.message : String(e));
      }
    },
    [dossiers],
  );

  const repartir = useCallback(
    async (affectations: AffectationMois[]) => {
      try {
        await appliquerRepartition(dossiers, affectations);
        await recharger();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : String(e));
      }
    },
    [dossiers, recharger],
  );

  const moisPossibles = useMemo(() => {
    const tous = new Set<string>();
    for (const p of ['yehidim', 'haver_bnei_adam'] as const) {
      for (const m of moisDeCampagne(paliers, annee, p)) tous.add(m);
    }
    return [...tous].sort();
  }, [paliers, annee]);

  if (!supabaseConfigure) return <ConfigurationManquante />;
  if (!sessionChargee) return <Chargement texte="Ouverture de la session…" />;
  if (!session) return <Connexion />;

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 py-3">
            <Monogramme />
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold tracking-tight">Krief Expertise · CRM</h1>
              <p className="text-xs text-gold/90">
                Campagne {annee} · hesder arkhot <span dir="rtl" lang="he">הסדר האורכות</span>
              </p>
            </div>

            <select
              value={annee}
              onChange={(e) => setAnnee(Number(e.target.value))}
              className="rounded-md bg-white/10 border border-white/20 px-2 py-1 text-sm text-white"
              aria-label="Année fiscale"
            >
              {annees.map((a) => (
                <option key={a} value={a} className="text-[#0b0b0b]">
                  {a}
                </option>
              ))}
            </select>

            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-white/70 hover:text-white whitespace-nowrap"
            >
              Déconnexion
            </button>
          </div>

          <nav className="flex gap-1 -mb-px">
            {ONGLETS.map((o) => (
              <button
                key={o.cle}
                onClick={() => setOnglet(o.cle)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  onglet === o.cle
                    ? 'border-gold text-white'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                {o.libelle}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {erreur && (
          <div className="mb-4">
            <Erreur message={erreur} />
          </div>
        )}

        {chargement ? (
          <Chargement />
        ) : (
          <>
            {onglet === 'tableau-de-bord' && (
              <Dashboard
                dossiers={dossiers}
                paliers={paliers}
                annee={annee}
                aujourdhui={aujourdhui}
              />
            )}
            {onglet === 'dossiers' && (
              <DossiersEcran
                dossiers={dossiers}
                moisPossibles={moisPossibles}
                onPatch={patcher}
                onTache={basculerTache}
              />
            )}
            {onglet === 'planning' && (
              <Planning
                dossiers={dossiers}
                paliers={paliers}
                annee={annee}
                aujourdhui={aujourdhui}
                onRepartir={repartir}
              />
            )}
            {onglet === 'import' && <Import annee={annee} onImporte={recharger} />}
          </>
        )}
      </main>
    </div>
  );
}
