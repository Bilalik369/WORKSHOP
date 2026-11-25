import "server-only";
import { getDefaultCapacity } from "@/lib/env";
import type { Project, Reservation } from "@/lib/types";
import { createAdminClient } from "@/utils/supabase/admin";

export type AdminData<T> = { rows: T[]; error: string | null };

/** Message lisible quand la base n'est pas encore prête (migration non exécutée…). */
function explain(message: string): string {
  if (/does not exist|schema cache|Could not find/i.test(message)) {
    return "Les tables sont introuvables : exécutez le fichier supabase/setup.sql dans l’éditeur SQL de Supabase.";
  }
  return `Erreur de base de données : ${message}`;
}

export async function getAllReservations(): Promise<AdminData<Reservation>> {
  const { data, error } = await createAdminClient()
    .from("reservations")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(5000);
  return error
    ? { rows: [], error: explain(error.message) }
    : { rows: (data ?? []) as Reservation[], error: null };
}

export async function getAllProjects(): Promise<AdminData<Project>> {
  const { data, error } = await createAdminClient()
    .from("projects")
    .select("*, team_members(id, nom, position)")
    .order("created_at", { ascending: false })
    .limit(1000);
  return error
    ? { rows: [], error: explain(error.message) }
    : { rows: (data ?? []) as Project[], error: null };
}

/** Capacité effective (table settings, sinon variable d'environnement). */
export async function getCapacity(): Promise<number> {
  const fallback = getDefaultCapacity();
  const { data, error } = await createAdminClient().rpc("get_seat_stats", {
    p_default_capacity: fallback,
  });
  return error || !data ? fallback : Number(data.capacity);
}
