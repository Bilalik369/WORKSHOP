export type Bar = { label: string; value: number };

export type StatCard = { label: string; value: string | number; detail: string };

export type StatChart = { title: string; bars: Bar[]; total: number; tone?: "navy" | "mint" };

function BarChart({ title, bars, total, tone = "navy" }: StatChart) {
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  return (
    <section className="glass min-w-0 rounded-3xl p-5 sm:p-6">
      <h2 className="text-lg font-bold break-words">{title}</h2>
      {bars.length === 0 ? (
        <p className="mt-4 text-muted">Pas encore de données.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {bars.map((bar) => (
            <li key={bar.label} className="min-w-0">
              <p className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-ink">{bar.label}</span>
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

/** Statistiques : cartes de synthèse, jauge de remplissage et graphiques en barres (CSS pur). */
export function StatsView({
  cards,
  fillRate,
  confirmed,
  capacity,
  charts,
}: {
  cards: StatCard[];
  fillRate: number;
  confirmed: number;
  capacity: number;
  charts: StatChart[];
}) {
  return (
    <div className="min-w-0">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <li key={card.label} className="glass min-w-0 rounded-2xl px-4 py-4">
            <p className="text-sm font-medium break-words text-muted">{card.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-navy tabular-nums sm:text-3xl">
              {card.value}
            </p>
            <p className="mt-0.5 text-sm text-muted">{card.detail}</p>
          </li>
        ))}
      </ul>

      <section className="glass mt-5 rounded-3xl p-5 sm:p-6" aria-label="Taux de remplissage">
        <p className="flex items-baseline justify-between gap-3 font-semibold text-navy">
          <span>Remplissage de la salle</span>
          <span className="shrink-0 tabular-nums">
            {confirmed} / {capacity}
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
        {charts.map((chart) => (
          <BarChart key={chart.title} {...chart} />
        ))}
      </div>
    </div>
  );
}
