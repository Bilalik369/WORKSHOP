import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getAdminEmails, isAdminEmail } from "@/lib/env";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export type AdminSetup = {
  /** Clés Supabase (publique + secrète) présentes. */
  supabase: boolean;
  /** Au moins une adresse dans ADMIN_EMAILS. */
  admins: boolean;
};

export function getAdminSetup(): AdminSetup {
  return {
    supabase: isSupabaseConfigured() && isSupabaseAdminConfigured(),
    admins: getAdminEmails().length > 0,
  };
}

/**
 * Adresse de l'administrateur connecté, ou null.
 *
 * - `cache` : une seule vérification par requête, même si le gabarit, la
 *   page et plusieurs composants la demandent.
 * - `getClaims` vérifie la signature du jeton ; avec les clés de signature
 *   asymétriques de Supabase, cela se fait sans aller-retour réseau.
 */
export const getAdminEmail = cache(async (): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
    if (error || !email) return null;
    return isAdminEmail(email) ? email.toLowerCase() : null;
  } catch {
    return null;
  }
});

/**
 * Pour les pages : redirige vers la connexion si l'accès n'est pas autorisé.
 * À appeler dans CHAQUE page de l'administration : lors d'un changement
 * d'onglet, Next.js ne ré-exécute pas le gabarit commun.
 */
export async function requireAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) redirect("/admin/login");
  return email;
}

/** Pour les actions serveur et les routes : lève une erreur si non autorisé. */
export async function assertAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) throw new Error("UNAUTHORIZED");
  return email;
}
