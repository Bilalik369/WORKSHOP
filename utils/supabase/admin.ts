import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

let adminClient: SupabaseClient | null = null;
let publicClient: SupabaseClient | null = null;

/** Vrai si la clé secrète est renseignée (écritures et back-office possibles). */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(supabaseUrl && secretKey);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && publishableKey);
}

/**
 * Client « service » (clé secrète) : contourne la RLS.
 * À n'utiliser que côté serveur, jamais dans un composant client.
 */
export function createAdminClient(): SupabaseClient {
  if (!supabaseUrl || !secretKey) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  adminClient ??= createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

/** Client anonyme sans session : lecture des seules données publiques (RPC). */
export function createPublicClient(): SupabaseClient {
  if (!supabaseUrl || !publishableKey) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  publicClient ??= createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return publicClient;
}
