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

const dateTime = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Africa/Casablanca",
});

const timeOnly = new Intl.DateTimeFormat("fr-FR", {
  timeStyle: "short",
  timeZone: "Africa/Casablanca",
});

export const formatDateTime = (iso: string | null | undefined) =>
  iso ? dateTime.format(new Date(iso)) : "—";

export const formatTime = (iso: string | null | undefined) =>
  iso ? timeOnly.format(new Date(iso)) : "—";
