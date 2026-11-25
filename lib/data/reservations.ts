import "server-only";
import type { Reservation } from "@/lib/types";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function findBy(
  column: "ticket_token" | "cancel_token",
  token: string,
): Promise<Reservation | null> {
  if (!UUID.test(token) || !isSupabaseAdminConfigured()) return null;
  const { data, error } = await createAdminClient()
    .from("reservations")
    .select("*")
    .eq(column, token)
    .maybeSingle();
  if (error) return null;
  return (data as Reservation | null) ?? null;
}

/** Réservation correspondant au lien secret du billet. */
export const getReservationByTicketToken = (token: string) => findBy("ticket_token", token);

/** Réservation correspondant au lien secret d'annulation. */
export const getReservationByCancelToken = (token: string) => findBy("cancel_token", token);

/** Rang dans la liste d'attente (1 = prochaine personne servie). */
export async function getWaitlistPosition(reservation: Reservation): Promise<number | null> {
  if (reservation.status !== "waitlist") return null;
  const { count, error } = await createAdminClient()
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("status", "waitlist")
    .lte("created_at", reservation.created_at);
  return error ? null : (count ?? null);
}
