import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Le CRM est-il relié à une base ? Sinon les écrans affichent la marche à suivre. */
export const supabaseConfigure = Boolean(url && cle);

export const supabase: SupabaseClient = createClient(
  url ?? 'http://localhost:54321',
  cle ?? 'cle-absente',
  { auth: { persistSession: true, autoRefreshToken: true } },
);
