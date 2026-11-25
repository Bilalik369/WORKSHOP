import "server-only";
import { getDefaultCapacity, getEnvSubmissionDeadline } from "@/lib/env";
import {
  createAdminClient,
  createPublicClient,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/utils/supabase/admin";

export type SeatStats = {
  capacity: number;
  confirmed: number;
  waitlist: number;
  remaining: number;
  /** false si la base n'a pas pu être interrogée (valeurs par défaut). */
  live: boolean;
};

/** Places restantes. Ne lève jamais d'erreur : repli sur la capacité par défaut. */
export async function getSeatStats(): Promise<SeatStats> {
  const capacity = getDefaultCapacity();
  const fallback: SeatStats = {
    capacity,
    confirmed: 0,
    waitlist: 0,
    remaining: capacity,
    live: false,
  };

  if (!isSupabaseConfigured()) return fallback;

  try {
    const { data, error } = await createPublicClient()
      .rpc("get_seat_stats", { p_default_capacity: capacity })
      .abortSignal(AbortSignal.timeout(4000));
    if (error || !data) return fallback;
    return {
      capacity: Number(data.capacity),
      confirmed: Number(data.confirmed),
      waitlist: Number(data.waitlist),
      remaining: Number(data.remaining),
      live: true,
    };
  } catch {
    return fallback;
  }
}

export type PublicProject = {
  id: string;
  titre: string;
  categorie: string;
  solution: string;
  porteur_nom: string;
  etablissement: string;
  avancement: string;
  format: string;
  members: string[];
};

/** Projets ACCEPTÉS uniquement, sans aucune coordonnée personnelle. */
export async function getAcceptedProjects(): Promise<PublicProject[]> {
  if (!isSupabaseAdminConfigured()) return [];

  try {
    const { data, error } = await createAdminClient()
      .from("projects")
      .select(
        "id, titre, categorie, solution, porteur_nom, etablissement, avancement, format, team_members(nom, position)",
      )
      .eq("status", "accepted")
      .order("reviewed_at", { ascending: true })
      .abortSignal(AbortSignal.timeout(4000));

    if (error || !data) return [];

    return data.map((project) => ({
      id: project.id,
      titre: project.titre,
      categorie: project.categorie,
      solution: project.solution,
      porteur_nom: project.porteur_nom,
      etablissement: project.etablissement,
      avancement: project.avancement,
      format: project.format,
      members: [...(project.team_members ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((member) => member.nom),
    }));
  } catch {
    return [];
  }
}

/** Date limite et état (ouvert ou clos) du dépôt des projets. */
export async function getSubmissionWindow(): Promise<{ deadline: Date; isOpen: boolean }> {
  const deadline = await getSubmissionDeadline();
  return { deadline, isOpen: deadline.getTime() > Date.now() };
}

/** Date limite de dépôt : table `settings`, sinon variable d'environnement. */
export async function getSubmissionDeadline(): Promise<Date> {
  const fromEnv = getEnvSubmissionDeadline();
  if (!isSupabaseAdminConfigured()) return fromEnv;

  try {
    const { data } = await createAdminClient()
      .from("settings")
      .select("value")
      .eq("key", "submission_deadline")
      .abortSignal(AbortSignal.timeout(4000))
      .maybeSingle();
    const override = new Date(data?.value ?? "");
    return Number.isNaN(override.getTime()) ? fromEnv : override;
  } catch {
    return fromEnv;
  }
}
