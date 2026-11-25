import fr from "@/messages/fr.json";

/** Libellés français des valeurs stockées en base (repris de messages/fr.json). */
const options = fr.options as Record<string, Record<string, string> | string>;

function lookup(group: string, value: string | null | undefined): string {
  if (!value) return "—";
  const labels = options[group];
  return (typeof labels === "object" && labels[value]) || value;
}

export const statutLabel = (value: string | null | undefined) => lookup("statut", value);
export const sourceLabel = (value: string | null | undefined) => lookup("source", value);
export const categorieLabel = (value: string | null | undefined) => lookup("categorie", value);
export const avancementLabel = (value: string | null | undefined) => lookup("avancement", value);
export const formatLabel = (value: string | null | undefined) => lookup("format", value);

export const RESERVATION_STATUS_LABELS = {
  confirmed: "Confirmée",
  waitlist: "Liste d’attente",
  cancelled: "Annulée",
} as const;

export const PROJECT_STATUS_LABELS = {
  pending: "En attente",
  accepted: "Accepté",
  refused: "Refusé",
} as const;

/**
 * Heure du Maroc (UTC+1), calculée sans la base de fuseaux du système :
 * le serveur et le navigateur n'ont pas toujours la même version de cette
 * base, ce qui donnait des heures différentes (et un nouveau rendu complet
 * de la page). Le calcul fixe garantit le même texte des deux côtés.
 */
const MOROCCO_OFFSET_MS = 60 * 60 * 1000;
const pad = (value: number) => String(value).padStart(2, "0");

function moroccoParts(iso: string) {
  const date = new Date(new Date(iso).getTime() + MOROCCO_OFFSET_MS);
  return {
    day: pad(date.getUTCDate()),
    month: pad(date.getUTCMonth() + 1),
    year: date.getUTCFullYear(),
    time: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`,
  };
}

/** « 20/11/2026 11:00 » */
export const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const parts = moroccoParts(iso);
  return `${parts.day}/${parts.month}/${parts.year} ${parts.time}`;
};

/** « 11:00 » */
export const formatTime = (iso: string | null | undefined) =>
  iso ? moroccoParts(iso).time : "—";
