import "server-only";
import { Resend } from "resend";
import { site } from "@/data/site";
import type { Reservation } from "@/lib/types";
import { createAdminClient } from "@/utils/supabase/admin";
import { isEmailConfigured } from "./send";
import { dateChangeEmail } from "./templates";

/** Taille d'un lot : un appel à l'API « batch » de Resend (100 e-mails au maximum). */
export const ANNOUNCEMENT_BATCH_SIZE = 50;

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

export type BatchResult = { sent: number; failed: number; remaining: number; error?: string };

/**
 * Envoie UN lot de l'annonce.
 *
 * Pour qu'une personne ne reçoive jamais l'e-mail deux fois (double clic,
 * deux organisateurs en même temps), les lignes sont d'abord « réservées »
 * en base (date_change_notified_at renseignée), puis l'envoi a lieu. Si
 * l'envoi échoue, la réservation des lignes est annulée pour pouvoir
 * réessayer.
 */
export async function sendAnnouncementBatch(): Promise<BatchResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { sent: 0, failed: 0, remaining: 0, error: "Resend n’est pas configuré." };
  }

  const supabase = createAdminClient();

  // 1. Prochaines personnes à prévenir (les plus anciennes inscriptions d'abord).
  const { data: candidates, error: selectError } = await supabase
    .from("reservations")
    .select("id")
    .in("status", ["confirmed", "waitlist"])
    .is("date_change_notified_at", null)
    .order("created_at", { ascending: true })
    .limit(ANNOUNCEMENT_BATCH_SIZE);

  if (selectError) return { sent: 0, failed: 0, remaining: 0, error: selectError.message };
  if (!candidates || candidates.length === 0) return { sent: 0, failed: 0, remaining: 0 };

  // 2. Réservation atomique des lignes : seules celles encore « non prévenues » sont prises.
  const { data: claimed, error: claimError } = await supabase
    .from("reservations")
    .update({ date_change_notified_at: new Date().toISOString() })
    .in(
      "id",
      candidates.map((row) => row.id),
    )
    .in("status", ["confirmed", "waitlist"])
    .is("date_change_notified_at", null)
    .select("*");

  if (claimError) return { sent: 0, failed: 0, remaining: 0, error: claimError.message };
  const recipients = (claimed ?? []) as Reservation[];

  let sent = 0;
  let failed = 0;
  let errorMessage: string | undefined;

  if (recipients.length > 0) {
    const replyTo = site.contactEmail.includes("example.com") ? undefined : site.contactEmail;
    const payload = recipients.map((reservation) => {
      const message = dateChangeEmail(reservation);
      return {
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo,
      };
    });

    let failedIds: string[] = [];
    try {
      const { data, error } = await new Resend(apiKey).batch.send(payload);
      if (error || !data) {
        // Mode strict : tout le lot est refusé.
        failedIds = recipients.map((reservation) => reservation.id);
        errorMessage = error?.message ?? "Envoi refusé par Resend.";
      } else {
        sent = recipients.length;
      }
    } catch (error) {
      failedIds = recipients.map((reservation) => reservation.id);
      errorMessage = error instanceof Error ? error.message : "Erreur réseau.";
    }

    // 3. Échec : on libère les lignes pour un nouvel essai.
    if (failedIds.length > 0) {
      failed = failedIds.length;
      await supabase
        .from("reservations")
        .update({ date_change_notified_at: null })
        .in("id", failedIds);
    }
  }

  const { count } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: false })
    .in("status", ["confirmed", "waitlist"])
    .is("date_change_notified_at", null)
    .limit(1);

  return { sent, failed, remaining: count ?? 0, error: errorMessage };
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
