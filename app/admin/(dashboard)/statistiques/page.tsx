import type { Metadata } from "next";
import { getAllProjects, getAllReservations, getCapacity } from "@/lib/admin/data";
import { PROJECT_STATUS_LABELS, sourceLabel, statutLabel } from "@/lib/admin/labels";
import { FormAlert } from "@/components/ui/form";

export const metadata: Metadata = { title: "Statistiques" };

type Bar = { label: string; value: number };

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
  return trimmed.length <= 5 ? trimmed.toUpperCase() : trimmed.replace(/^./, (c) => c.toUpperCase());
};

function BarChart({ title, bars, total, tone = "navy" }: { title: string; bars: Bar[]; total: number; tone?: "navy" | "mint" }) {
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  return (
    <section className="glass rounded-3xl p-5 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {bars.length === 0 ? (
        <p className="mt-4 text-muted">Pas encore de données.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {bars.map((bar) => (
            <li key={bar.label}>
              <p className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-semibold text-ink">{bar.label}</span>
                <span className="shrink-0 text-muted tabular-nums">
                  <strong className="text-navy">{bar.value}</strong>
                  {total > 0 ? ` · ${Math.round((bar.value / total) * 100)} %` : ""}
                </span>
              </p>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-navy/8" aria-hidden="true">
                <div
                  className={
                    tone === "navy"
                      ? "h-full rounded-full bg-linear-to-r from-navy to-azure"
                      : "h-full rounded-full bg-linear-to-r from-mint-dark to-mint-soft"
                  }
                  style={{ width: `${Math.max(2, (bar.value / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AdminStatsPage() {
  const [reservations, projects, capacity] = await Promise.all([
    getAllReservations(),
    getAllProjects(),
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
  const fillRate = capacity > 0 ? Math.min(100, Math.round((confirmed.length / capacity) * 100)) : 0;
  const presenceRate = confirmed.length > 0 ? Math.round((present.length / confirmed.length) * 100) : 0;

  const byEtablissement = countBy(active, (r) => cleanName(r.etablissement));
  const topEtablissements = byEtablissement.slice(0, 10);
  const others = byEtablissement.slice(10).reduce((sum, bar) => sum + bar.value, 0);
  if (others > 0) topEtablissements.push({ label: "Autres établissements", value: others });

  const cards = [
    { label: "Réservations confirmées", value: confirmed.length, detail: `sur ${capacity} places` },
    { label: "Taux de remplissage", value: `${fillRate} %`, detail: `${Math.max(0, capacity - confirmed.length)} place(s) libre(s)` },
    { label: "Liste d’attente", value: waitlist.length, detail: `${cancelled.length} annulation(s)` },
    { label: "Présents le jour J", value: present.length, detail: `${presenceRate} % des confirmés` },
  ];

  return (
    <>
      <h1 className="text-3xl font-extrabold">Statistiques</h1>
      <p className="mt-1 mb-6 text-muted">Vue d’ensemble des inscriptions et des projets.</p>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <li key={card.label} className="glass rounded-2xl px-4 py-4">
            <p className="text-sm font-medium text-muted">{card.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-navy tabular-nums">{card.value}</p>
            <p className="mt-0.5 text-sm text-muted">{card.detail}</p>
          </li>
        ))}
      </ul>

      <section className="glass mt-5 rounded-3xl p-5 sm:p-6" aria-label="Taux de remplissage">
        <p className="flex items-baseline justify-between font-semibold text-navy">
          <span>Remplissage de la salle</span>
          <span className="tabular-nums">
            {confirmed.length} / {capacity}
          </span>
        </p>
        <div
          role="progressbar"
          aria-valuenow={fillRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Taux de remplissage"
          className="mt-3 h-4 overflow-hidden rounded-full bg-navy/8"
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-mint-dark via-mint to-mint-soft"
            style={{ width: `${fillRate}%` }}
          />
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <BarChart
          title="Répartition par statut"
          bars={countBy(active, (r) => statutLabel(r.statut))}
          total={active.length}
        />
        <BarChart title="Répartition par établissement" bars={topEtablissements} total={active.length} tone="mint" />
        <BarChart
          title="Comment ont-ils connu le workshop ?"
          bars={countBy(
            active.filter((r) => r.source),
            (r) => sourceLabel(r.source),
          )}
          total={active.filter((r) => r.source).length}
          tone="mint"
        />
        <BarChart
          title={`Projets déposés (${projects.rows.length})`}
          bars={countBy(projects.rows, (p) => PROJECT_STATUS_LABELS[p.status])}
          total={projects.rows.length}
        />
      </div>
    </>
  );
}
