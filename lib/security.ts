import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";

/** Identifiant anonymisé du visiteur (empreinte de son adresse IP). */
async function getClientKey(): Promise<string> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  return createHash("sha256")
    .update(`${ip}:${process.env.SUPABASE_SECRET_KEY ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Limitation de débit par visiteur et par action (compteur en base, donc
 * valable sur tous les serveurs Vercel). Renvoie true si l'appel est autorisé.
 * En cas de panne du compteur, on laisse passer plutôt que de bloquer.
 */
export async function rateLimit(
  action: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const key = `${action}:${await getClientKey()}`;
    const { data, error } = await createAdminClient().rpc("check_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}

/** Champ piège : rempli uniquement par les robots. */
export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
