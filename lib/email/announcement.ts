import "server-only";
import type { Reservation } from "@/lib/types";
import { createAdminClient } from "@/utils/supabase/admin";
import { isEmailConfigured, sendEmail } from "./send";
import { dateChangeEmail } from "./templates";

export type AnnouncementStats = {
  /** La colonne date_change_notified_at existe-t-elle ? */
  ready: boolean;
  /** Confirmés + liste d'attente, pas encore prévenus. */
  pending: number;
  pendingConfirmed: number;
  pendingWaitlist: number;
  /** Déjà prévenus. */
  notified: number;
  emailConfigured: boolean;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Compte les destinataires (jamais les réservations annulées). */
export async function getAnnouncementStats(): Promise<AnnouncementStats> {
  const supabase = createAdminClient();
  const base: AnnouncementStats = {
    ready: false,
    pending: 0,
    pendingConfirmed: 0,
    pendingWaitlist: 0,
    notified: 0,
    emailConfigured: isEmailConfigured(),
  };

  const count = (status: "confirmed" | "waitlist", notified: boolean) => {
    const query = supabase
      .from("reservations")
      .select("id", { count: "exact", head: false })
      .eq("status", status);
    return (
      notified
        ? query.not("date_change_notified_at", "is", null)
        : query.is("date_change_notified_at", null)
    ).limit(1);
  };

  const [confirmed, waitlist, doneConfirmed, doneWaitlist] = await Promise.all([
    count("confirmed", false),
    count("waitlist", false),
    count("confirmed", true),
    count("waitlist", true),
  ]);

  // Colonne absente : la migration 0002 n'a pas encore été exécutée.
  if (confirmed.error || waitlist.error || doneConfirmed.error || doneWaitlist.error) {
    return base;
  }

  const pendingConfirmed = confirmed.count ?? 0;
  const pendingWaitlist = waitlist.count ?? 0;
  return {
    ...base,
    ready: true,
    pendingConfirmed,
    pendingWaitlist,
    pending: pendingConfirmed + pendingWaitlist,
    notified: (doneConfirmed.count ?? 0) + (doneWaitlist.count ?? 0),
  };
}

export type AnnouncementStep = {
  /** "sent" : envoyé et marqué · "failed" : échec, non marqué · "done" : plus personne à prévenir. */
  outcome: "sent" | "failed" | "done";
  /** Réservation traitée (pour l'ignorer jusqu'à la fin de cette série en cas d'échec). */
  id?: string;
  /** Destinataires restant à prévenir après cette étape (hors échecs de la série). */
  remaining: number;
  error?: string;
};

/**
 * Envoie l'annonce à UNE personne : la plus ancienne inscription pas encore
 * prévenue (confirmée ou en liste d'attente, jamais annulée).
 *
 * La date `date_change_notified_at` n'est enregistrée QU'APRÈS un envoi
 * réussi : un échec laisse la personne « à prévenir » et peut être rejoué
 * sans risque de doublon.
 *
 * `skipIds` : réservations déjà en échec pendant cette série, à ne pas
 * retenter tout de suite (sinon la série resterait bloquée sur elles).
 */
export async function sendNextAnnouncement(skipIds: string[]): Promise<AnnouncementStep> {
  if (!isEmailConfigured()) {
    return { outcome: "failed", remaining: 0, error: "Gmail n’est pas configuré." };
  }

  const supabase = createAdminClient();
  const skip = skipIds.filter((id) => UUID.test(id)).slice(0, 500);

  const pendingQuery = () => {
    const query = supabase
      .from("reservations")
      .select("*", { count: "exact" })
      .in("status", ["confirmed", "waitlist"])
      .is("date_change_notified_at", null);
    return skip.length > 0 ? query.not("id", "in", `(${skip.join(",")})`) : query;
  };

  const { data, count, error } = await pendingQuery()
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) return { outcome: "failed", remaining: 0, error: error.message };

  const reservation = (data?.[0] ?? null) as Reservation | null;
  if (!reservation) return { outcome: "done", remaining: 0 };

  const total = count ?? 1;
  const result = await sendEmail(dateChangeEmail(reservation));

  if (!result.sent) {
    // Non marquée : elle sera proposée de nouveau au prochain envoi.
    return {
      outcome: "failed",
      id: reservation.id,
      remaining: Math.max(0, total - 1),
      error: result.error,
    };
  }

  // Envoi réussi : on enregistre la date. La condition « is null » évite
  // d'écraser une date posée entre-temps par un autre organisateur.
  const { error: markError } = await supabase
    .from("reservations")
    .update({ date_change_notified_at: new Date().toISOString() })
    .eq("id", reservation.id)
    .is("date_change_notified_at", null);

  if (markError) {
    // L'e-mail est parti mais n'a pas pu être noté : on l'ignore pour cette
    // série afin de ne pas le renvoyer en boucle, et on le signale.
    return {
      outcome: "failed",
      id: reservation.id,
      remaining: Math.max(0, total - 1),
      error: `E-mail envoyé à ${reservation.email}, mais non enregistré en base (${markError.message}). Ne relancez pas avant d’avoir vérifié.`,
    };
  }

  return { outcome: "sent", id: reservation.id, remaining: Math.max(0, total - 1) };
}

/** Réservation fictive pour l'aperçu et l'e-mail de test. */
export function sampleReservation(email: string, status: "confirmed" | "waitlist"): Reservation {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    code: "IAE-TEST42",
    nom: "Exemple",
    prenom: "Prénom",
    email,
    telephone: "+212600000000",
    statut: "autre",
    etablissement: "ESEF Beni Mellal",
    filiere: null,
    source: null,
    locale: "fr",
    status,
    ticket_token: "00000000-0000-0000-0000-000000000000",
    cancel_token: "00000000-0000-0000-0000-000000000000",
    checked_in_at: null,
    promoted_at: null,
    cancelled_at: null,
    date_change_notified_at: null,
    created_at: new Date().toISOString(),
  };
}
