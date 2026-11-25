"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/admin/auth";
import { notifyCancellation, notifyPromoted } from "@/lib/email/notify";
import { sendEmail } from "@/lib/email/send";
import { projectDecisionEmail } from "@/lib/email/templates";
import { getDefaultCapacity, getSiteUrl, isAdminEmail } from "@/lib/env";
import { rateLimit } from "@/lib/security";
import type { Project, Reservation } from "@/lib/types";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

/* ------------------------------------------------------------------ */
/* Connexion                                                           */
/* ------------------------------------------------------------------ */

export type LoginState = { step: "email" | "code"; email?: string; error?: string };

/**
 * Envoie un lien magique + un code à 6 chiffres. La réponse est identique
 * que l'adresse soit autorisée ou non (on ne révèle pas la liste des admins).
 */
export async function requestLogin(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { step: "email", error: "Saisissez une adresse e-mail valide." };
  }
  if (!(await rateLimit("admin-login", 5, 900))) {
    return { step: "email", error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  if (isAdminEmail(email)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${getSiteUrl()}/admin/auth/callback`,
      },
    });
    if (error) {
      console.error("[admin] signInWithOtp :", error.message);
      return {
        step: "email",
        error: "L’e-mail de connexion n’a pas pu être envoyé. Réessayez dans une minute.",
      };
    }
  }
  return { step: "code", email };
}

export async function verifyLoginCode(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("code") ?? "").replace(/\s/g, "");
  const invalid: LoginState = { step: "code", email, error: "Code invalide ou expiré." };

  if (!isAdminEmail(email) || !/^\d{6,8}$/.test(token)) return invalid;
  if (!(await rateLimit("admin-code", 8, 900))) {
    return { step: "code", email, error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return invalid;

  redirect("/admin/reservations");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ */
/* Réservations                                                        */
/* ------------------------------------------------------------------ */

type Result = { ok: true } | { ok: false; error: string };

/** Marque (ou retire) la présence d'un participant. */
export async function setPresence(id: string, present: boolean): Promise<Result> {
  await assertAdmin();
  const { error } = await createAdminClient()
    .from("reservations")
    .update({ checked_in_at: present ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("status", "confirmed");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Annule une réservation depuis l'administration (libère la place). */
export async function adminCancelReservation(cancelToken: string): Promise<Result> {
  await assertAdmin();
  const { data, error } = await createAdminClient().rpc("cancel_reservation", {
    p_cancel_token: cancelToken,
    p_default_capacity: getDefaultCapacity(),
  });
  if (error || !data?.ok) return { ok: false, error: error?.message ?? "Réservation introuvable." };
  await notifyCancellation(data.reservation as Reservation, (data.promoted ?? []) as Reservation[]);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Attribue les places libres aux premières personnes de la liste d'attente. */
export async function promoteWaitlist(): Promise<{ ok: boolean; promoted: number }> {
  await assertAdmin();
  const { data, error } = await createAdminClient().rpc("promote_waitlist", {
    p_default_capacity: getDefaultCapacity(),
  });
  if (error) return { ok: false, promoted: 0 };
  const promoted = (data ?? []) as Reservation[];
  await notifyPromoted(promoted);
  revalidatePath("/admin", "layout");
  return { ok: true, promoted: promoted.length };
}

/* ------------------------------------------------------------------ */
/* Pointage (check-in)                                                 */
/* ------------------------------------------------------------------ */

export type CheckInResult = {
  result: "ok" | "already" | "waitlist" | "cancelled" | "not_found" | "error";
  name?: string;
  code?: string;
  statut?: string;
  etablissement?: string;
  checkedInAt?: string | null;
};

export async function checkIn(rawCode: string): Promise<CheckInResult> {
  await assertAdmin();
  const code = rawCode.trim().toUpperCase();
  if (!/^IAE-[A-Z0-9]{6}$/.test(code)) return { result: "not_found", code };

  const { data, error } = await createAdminClient().rpc("check_in", { p_code: code });
  if (error || !data) return { result: "error", code };

  const reservation = data.reservation as Reservation | undefined;
  revalidatePath("/admin", "layout");
  return {
    result: data.result,
    code,
    name: reservation ? `${reservation.prenom} ${reservation.nom}` : undefined,
    statut: reservation?.statut,
    etablissement: reservation?.etablissement,
    checkedInAt: reservation?.checked_in_at,
  };
}

/* ------------------------------------------------------------------ */
/* Projets                                                             */
/* ------------------------------------------------------------------ */

/** Accepte ou refuse un projet, avec un commentaire facultatif, et prévient le porteur. */
export async function decideProject(
  id: string,
  decision: "accepted" | "refused",
  comment: string,
): Promise<Result> {
  const admin = await assertAdmin();
  if (decision !== "accepted" && decision !== "refused") {
    return { ok: false, error: "Décision invalide." };
  }

  const { data, error } = await createAdminClient()
    .from("projects")
    .update({
      status: decision,
      admin_comment: comment.trim().slice(0, 2000) || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Projet introuvable." };

  await sendEmail(projectDecisionEmail(data as Project));
  revalidatePath("/admin", "layout");
  revalidatePath("/[locale]", "page");
  return { ok: true };
}
