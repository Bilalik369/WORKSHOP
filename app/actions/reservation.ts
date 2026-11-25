"use server";

import { getLocale } from "next-intl/server";
import { contentLang } from "@/i18n/routing";
import { sendEmail } from "@/lib/email/send";
import { notifyCancellation } from "@/lib/email/notify";
import { ticketEmail, waitlistEmail } from "@/lib/email/templates";
import { getDefaultCapacity } from "@/lib/env";
import { isHoneypotFilled, rateLimit } from "@/lib/security";
import type { Reservation } from "@/lib/types";
import { reservationSchema } from "@/lib/validation/reservation";
import { normalizePhone } from "@/lib/validation/shared";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export type ActionError =
  | "formInvalid"
  | "emailTaken"
  | "rateLimit"
  | "notConfigured"
  | "generic";

export type ReservationResult =
  | { ok: true; ticketToken: string }
  | { ok: false; error: ActionError; fieldErrors?: Record<string, string> };

/**
 * Enregistre une réservation. Le contrôle de capacité et l'unicité de
 * l'e-mail sont faits dans la fonction Postgres `reserve_seat`, sous verrou.
 */
export async function createReservation(
  input: unknown,
  honeypot: string,
): Promise<ReservationResult> {
  if (isHoneypotFilled(honeypot)) return { ok: false, error: "generic" };
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "notConfigured" };

  const parsed = reservationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "");
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, error: "formInvalid", fieldErrors };
  }

  // 5 tentatives par visiteur toutes les 10 minutes.
  if (!(await rateLimit("reservation", 5, 600))) {
    return { ok: false, error: "rateLimit" };
  }

  const values = parsed.data;
  const locale = contentLang(await getLocale());

  const { data, error } = await createAdminClient().rpc("reserve_seat", {
    p_nom: values.nom,
    p_prenom: values.prenom,
    p_email: values.email.toLowerCase(),
    p_telephone: normalizePhone(values.telephone),
    p_statut: values.statut,
    p_etablissement: values.etablissement,
    p_filiere: values.filiere,
    p_source: values.source,
    p_locale: locale,
    p_default_capacity: getDefaultCapacity(),
  });

  if (error) {
    // 23505 : contrainte d'unicité (double envoi simultané du même e-mail).
    if (error.code === "23505") return { ok: false, error: "emailTaken" };
    console.error("[reservation] reserve_seat :", error.message);
    return { ok: false, error: "generic" };
  }

  if (!data?.ok) {
    return { ok: false, error: data?.error === "email_taken" ? "emailTaken" : "generic" };
  }

  const reservation = data.reservation as Reservation;

  await sendEmail(
    reservation.status === "confirmed"
      ? await ticketEmail(reservation)
      : waitlistEmail(reservation, data.waitlist_position ?? null),
  );

  return { ok: true, ticketToken: reservation.ticket_token };
}

export type CancelResult = { ok: true } | { ok: false; error: "notFound" | "already" | "generic" };

/** Annule une réservation et prévient les personnes promues depuis la liste d'attente. */
export async function cancelReservation(cancelToken: string): Promise<CancelResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "generic" };
  if (!/^[0-9a-f-]{36}$/i.test(cancelToken)) return { ok: false, error: "notFound" };
  if (!(await rateLimit("cancel", 10, 600))) return { ok: false, error: "generic" };

  const { data, error } = await createAdminClient().rpc("cancel_reservation", {
    p_cancel_token: cancelToken,
    p_default_capacity: getDefaultCapacity(),
  });

  if (error) {
    console.error("[reservation] cancel_reservation :", error.message);
    return { ok: false, error: "generic" };
  }
  if (!data?.ok) {
    return { ok: false, error: data?.error === "already_cancelled" ? "already" : "notFound" };
  }

  await notifyCancellation(data.reservation as Reservation, (data.promoted ?? []) as Reservation[]);
  return { ok: true };
}
