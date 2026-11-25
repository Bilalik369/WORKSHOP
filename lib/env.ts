import "server-only";
import { site } from "@/data/site";

/** URL publique du site, sans barre oblique finale. */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Capacité par défaut (la table `settings` peut la remplacer). */
export function getDefaultCapacity(): number {
  const parsed = Number.parseInt(process.env.EVENT_CAPACITY ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : site.defaultCapacity;
}

/** Date limite de dépôt des projets définie par l'environnement. */
export function getEnvSubmissionDeadline(): Date {
  const fromEnv = new Date(process.env.PROJECT_SUBMISSION_DEADLINE ?? "");
  return Number.isNaN(fromEnv.getTime())
    ? new Date(site.defaultSubmissionDeadline)
    : fromEnv;
}

/** Adresses autorisées à accéder à l'administration. */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email) && getAdminEmails().includes(email!.trim().toLowerCase());
}
