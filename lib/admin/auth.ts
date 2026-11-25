import "server-only";
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

/** Adresse de l'administrateur connecté, ou null. */
export async function getAdminEmail(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email && isAdminEmail(user.email) ? user.email.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** Pour les pages : redirige vers la connexion si l'accès n'est pas autorisé. */
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
