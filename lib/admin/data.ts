import "server-only";
import { getDefaultCapacity } from "@/lib/env";
import type { Project, ProjectStatus, Reservation } from "@/lib/types";
import { createAdminClient } from "@/utils/supabase/admin";

export type AdminData<T> = { rows: T[]; error: string | null };

/** Colonnes utiles au tableau et à l'export : aucun jeton secret n'est envoyé au navigateur. */
const RESERVATION_COLUMNS =
  "id, code, nom, prenom, email, telephone, statut, etablissement, filiere, source, locale, status, checked_in_at, cancelled_at, created_at";

export type AdminReservation = Pick<
  Reservation,
  | "id"
  | "code"
  | "nom"
  | "prenom"
  | "email"
  | "telephone"
  | "statut"
  | "etablissement"
  | "filiere"
  | "source"
  | "locale"
  | "status"
  | "checked_in_at"
  | "cancelled_at"
  | "created_at"
>;

/** Colonnes nécessaires aux statistiques uniquement. */
export type ReservationStatRow = Pick<
  Reservation,
  "status" | "statut" | "etablissement" | "source" | "checked_in_at"
>;

/** Message lisible quand la base n'est pas encore prête (script SQL non exécuté…). */
function explain(message: string): string {
  if (/does not exist|schema cache|Could not find/i.test(message)) {
    return "Les tables sont introuvables : exécutez le fichier supabase/setup.sql dans l’éditeur SQL de Supabase.";
  }
  return `Erreur de base de données : ${message}`;
}

export async function getAllReservations(): Promise<AdminData<AdminReservation>> {
  const { data, error } = await createAdminClient()
    .from("reservations")
    .select(RESERVATION_COLUMNS)
    .order("created_at", { ascending: true })
    .limit(5000);
  return error
    ? { rows: [], error: explain(error.message) }
    : { rows: (data ?? []) as AdminReservation[], error: null };
}

export async function getReservationStatRows(): Promise<AdminData<ReservationStatRow>> {
  const { data, error } = await createAdminClient()
    .from("reservations")
    .select("status, statut, etablissement, source, checked_in_at")
    .limit(5000);
  return error
    ? { rows: [], error: explain(error.message) }
    : { rows: (data ?? []) as ReservationStatRow[], error: null };
}

export async function getAllProjects(): Promise<AdminData<Project>> {
  const { data, error } = await createAdminClient()
    .from("projects")
    .select(
      "id, porteur_nom, porteur_email, porteur_telephone, etablissement, titre, categorie, problematique, solution, technologies, avancement, lien, pdf_path, format, locale, status, admin_comment, reviewed_at, reviewed_by, created_at, team_members(id, nom, position)",
    )
    .order("created_at", { ascending: false })
    .limit(1000);
  return error
    ? { rows: [], error: explain(error.message) }
    : { rows: (data ?? []) as Project[], error: null };
}

/** Statut de chaque projet, pour les statistiques. */
export async function getProjectStatuses(): Promise<ProjectStatus[]> {
  const { data, error } = await createAdminClient().from("projects").select("status").limit(1000);
  return error ? [] : (data ?? []).map((row) => row.status as ProjectStatus);
}

/** Capacité effective (table settings, sinon variable d'environnement). */
export async function getCapacity(): Promise<number> {
  const fallback = getDefaultCapacity();
  const { data, error } = await createAdminClient().rpc("get_seat_stats", {
    p_default_capacity: fallback,
  });
  return error || !data ? fallback : Number(data.capacity);
}
