import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { getCapacity, getProjectStatuses, getReservationStatRows } from "@/lib/admin/data";
import { PROJECT_STATUS_LABELS, sourceLabel, statutLabel } from "@/lib/admin/labels";
import { StatsView, type Bar } from "@/components/admin/stats-view";
import { FormAlert } from "@/components/ui/form";

export const metadata: Metadata = { title: "Statistiques" };

/** Regroupe et compte, du plus fréquent au moins fréquent. */
function countBy<T>(rows: T[], key: (row: T) => string): Bar[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = key(row);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/** Harmonise les noms d'établissement saisis librement (casse, espaces). */
const cleanName = (value: string) => {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length <= 5
    ? trimmed.toUpperCase()
    : trimmed.replace(/^./, (c) => c.toUpperCase());
};

export default async function AdminStatsPage() {
  await requireAdmin();
  // Requêtes en parallèle, limitées aux colonnes utiles aux statistiques.
  const [reservations, projectStatuses, capacity] = await Promise.all([
    getReservationStatRows(),
    getProjectStatuses(),
    getCapacity(),
  ]);

  if (reservations.error) {
    return (
      <>
        <h1 className="mb-6 text-3xl font-extrabold">Statistiques</h1>
        <FormAlert>{reservations.error}</FormAlert>
      </>
    );
  }

  const confirmed = reservations.rows.filter((r) => r.status === "confirmed");
  const waitlist = reservations.rows.filter((r) => r.status === "waitlist");
  const cancelled = reservations.rows.filter((r) => r.status === "cancelled");
  const present = confirmed.filter((r) => r.checked_in_at);
  const active = [...confirmed, ...waitlist];
  const withSource = active.filter((r) => r.source);
  const fillRate =
    capacity > 0 ? Math.min(100, Math.round((confirmed.length / capacity) * 100)) : 0;
  const presenceRate =
    confirmed.length > 0 ? Math.round((present.length / confirmed.length) * 100) : 0;

  const byEtablissement = countBy(active, (r) => cleanName(r.etablissement));
  const topEtablissements = byEtablissement.slice(0, 10);
  const others = byEtablissement.slice(10).reduce((sum, bar) => sum + bar.value, 0);
  if (others > 0) topEtablissements.push({ label: "Autres établissements", value: others });

  return (
    <>
      <h1 className="text-3xl font-extrabold">Statistiques</h1>
      <p className="mt-1 mb-6 text-muted">Vue d’ensemble des inscriptions et des projets.</p>

      <StatsView
        fillRate={fillRate}
        confirmed={confirmed.length}
        capacity={capacity}
        cards={[
          {
            label: "Réservations confirmées",
            value: confirmed.length,
            detail: `sur ${capacity} places`,
          },
          {
            label: "Taux de remplissage",
            value: `${fillRate} %`,
            detail: `${Math.max(0, capacity - confirmed.length)} place(s) libre(s)`,
          },
          {
            label: "Liste d’attente",
            value: waitlist.length,
            detail: `${cancelled.length} annulation(s)`,
          },
          {
            label: "Présents le jour J",
            value: present.length,
            detail: `${presenceRate} % des confirmés`,
          },
        ]}
        charts={[
          {
            title: "Répartition par statut",
            bars: countBy(active, (r) => statutLabel(r.statut)),
            total: active.length,
          },
          {
            title: "Répartition par établissement",
            bars: topEtablissements,
            total: active.length,
            tone: "mint",
          },
          {
            title: "Comment ont-ils connu le workshop ?",
            bars: countBy(withSource, (r) => sourceLabel(r.source)),
            total: withSource.length,
            tone: "mint",
          },
          {
            title: `Projets déposés (${projectStatuses.length})`,
            bars: countBy(projectStatuses, (status) => PROJECT_STATUS_LABELS[status]),
            total: projectStatuses.length,
          },
        ]}
      />
    </>
  );
}
