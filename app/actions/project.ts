"use server";

import { randomUUID } from "node:crypto";
import { getLocale } from "next-intl/server";
import { contentLang } from "@/i18n/routing";
import { MAX_PDF_BYTES, PROJECT_BUCKET } from "@/lib/constants";
import { getSubmissionDeadline } from "@/lib/data/public";
import { sendEmail } from "@/lib/email/send";
import { projectReceivedEmail } from "@/lib/email/templates";
import { isHoneypotFilled, rateLimit } from "@/lib/security";
import type { Project } from "@/lib/types";
import { PDF_PATH_PATTERN, projectSchema } from "@/lib/validation/project";
import { normalizePhone } from "@/lib/validation/shared";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

type ProjectError =
  | "formInvalid"
  | "rateLimit"
  | "notConfigured"
  | "deadline"
  | "pdfType"
  | "pdfSize"
  | "upload"
  | "generic";

export type UploadTicket =
  | { ok: true; path: string; token: string }
  | { ok: false; error: ProjectError };

/**
 * Prépare le dépôt d'un PDF : renvoie une URL signée à usage unique.
 * Le fichier part ensuite directement du navigateur vers Supabase Storage
 * (bucket privé, limité à 10 Mo et au format PDF).
 */
export async function createProjectUpload(file: {
  size: number;
  type: string;
}): Promise<UploadTicket> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "notConfigured" };
  if (file.type !== "application/pdf") return { ok: false, error: "pdfType" };
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_PDF_BYTES) {
    return { ok: false, error: "pdfSize" };
  }
  if ((await getSubmissionDeadline()).getTime() < Date.now()) {
    return { ok: false, error: "deadline" };
  }
  if (!(await rateLimit("project-upload", 6, 3600))) return { ok: false, error: "rateLimit" };

  const path = `uploads/${randomUUID()}.pdf`;
  const { data, error } = await createAdminClient()
    .storage.from(PROJECT_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[projet] createSignedUploadUrl :", error?.message);
    return { ok: false, error: "upload" };
  }
  return { ok: true, path, token: data.token };
}

export type ProjectResult =
  | { ok: true }
  | { ok: false; error: ProjectError; fieldErrors?: Record<string, string> };

/** Enregistre une proposition de projet et envoie l'accusé de réception. */
export async function submitProject(
  input: unknown,
  pdfPath: string | null,
  honeypot: string,
): Promise<ProjectResult> {
  if (isHoneypotFilled(honeypot)) return { ok: false, error: "generic" };
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "notConfigured" };

  if ((await getSubmissionDeadline()).getTime() < Date.now()) {
    return { ok: false, error: "deadline" };
  }

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "");
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, error: "formInvalid", fieldErrors };
  }

  if (pdfPath !== null && !PDF_PATH_PATTERN.test(pdfPath)) {
    return { ok: false, error: "upload" };
  }

  // 4 propositions par visiteur et par heure.
  if (!(await rateLimit("project", 4, 3600))) return { ok: false, error: "rateLimit" };

  const supabase = createAdminClient();

  // Vérifie que le fichier annoncé a bien été déposé.
  if (pdfPath) {
    const fileName = pdfPath.split("/")[1];
    const { data: files } = await supabase.storage
      .from(PROJECT_BUCKET)
      .list("uploads", { search: fileName, limit: 1 });
    if (!files?.some((file) => file.name === fileName)) {
      return { ok: false, error: "upload" };
    }
  }

  const values = parsed.data;
  const { data, error } = await supabase.rpc("submit_project", {
    p_project: {
      porteur_nom: values.porteur_nom,
      porteur_email: values.porteur_email.toLowerCase(),
      porteur_telephone: normalizePhone(values.porteur_telephone),
      etablissement: values.etablissement,
      titre: values.titre,
      categorie: values.categorie,
      problematique: values.problematique,
      solution: values.solution,
      technologies: values.technologies,
      avancement: values.avancement,
      lien: values.lien,
      pdf_path: pdfPath ?? "",
      format: values.format,
      locale: contentLang(await getLocale()),
    },
    p_members: values.members.map((member) => member.nom).filter(Boolean),
  });

  if (error || !data) {
    console.error("[projet] submit_project :", error?.message);
    return { ok: false, error: "generic" };
  }

  await sendEmail(projectReceivedEmail(data as Project));
  return { ok: true };
}
