"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Download,
  FileSpreadsheet,
  Search,
  UserRoundX,
  UsersRound,
} from "lucide-react";
import { adminCancelReservation, promoteWaitlist, setPresence } from "@/app/admin/actions";
import type { AdminReservation } from "@/lib/admin/data";
import {
  RESERVATION_STATUS_LABELS,
  formatDateTime,
  formatTime,
  statutLabel,
} from "@/lib/admin/labels";
import { STATUTS } from "@/lib/constants";
import type { ReservationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/validation/shared";
import { Button } from "@/components/ui/button";
import { FormAlert, Input, Select } from "@/components/ui/form";

const PAGE_SIZE = 50;

const VIEWS: { value: ReservationStatus; label: string }[] = [
  { value: "confirmed", label: "Confirmées" },
  { value: "waitlist", label: "Liste d’attente" },
  { value: "cancelled", label: "Annulées" },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function ReservationsTable({
  reservations,
  capacity,
}: {
  reservations: AdminReservation[];
  capacity: number;
}) {
  const router = useRouter();
  const [view, setView] = useState<ReservationStatus>("confirmed");
  const [query, setQuery] = useState("");
  const [statut, setStatut] = useState("");
  const [presence, setPresenceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [, startTransition] = useTransition();

  const counts = useMemo(
    () => ({
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      waitlist: reservations.filter((r) => r.status === "waitlist").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
      present: reservations.filter((r) => r.status === "confirmed" && r.checked_in_at).length,
    }),
    [reservations],
  );

  const rows = useMemo(() => {
    const needle = normalize(query.trim());
    return reservations.filter((r) => {
      if (r.status !== view) return false;
      if (statut && r.statut !== statut) return false;
      if (presence === "present" && !r.checked_in_at) return false;
      if (presence === "absent" && r.checked_in_at) return false;
      if (!needle) return true;
      return normalize(
        `${r.prenom} ${r.nom} ${r.nom} ${r.prenom} ${r.email} ${r.code} ${r.etablissement} ${r.telephone}`,
      ).includes(needle);
    });
  }, [reservations, view, query, statut, presence]);

  // Pagination : 50 lignes affichées à la fois (la recherche porte sur toute la liste).
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(firstIndex, firstIndex + PAGE_SIZE);

  /** Tout changement de filtre ramène à la première page. */
  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };
  const changeView = withReset(setView);
  const changeQuery = withReset(setQuery);
  const changeStatut = withReset(setStatut);
  const changePresence = withReset(setPresenceFilter);

  const run = (id: string, task: () => Promise<{ ok: boolean; error?: string }>) => {
    setPendingId(id);
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await task();
        if (!result.ok) setNotice({ tone: "error", text: result.error ?? "Action impossible." });
        router.refresh();
      } catch {
        setNotice({ tone: "error", text: "Action impossible. Rechargez la page et réessayez." });
      } finally {
        setPendingId(null);
      }
    });
  };

  const onCancel = (reservation: AdminReservation) => {
    const name = `${reservation.prenom} ${reservation.nom}`;
    if (
      !window.confirm(
        `Annuler la réservation de ${name} ?\n\nLa place sera libérée et proposée à la liste d’attente. La personne sera prévenue par e-mail.`,
      )
    ) {
      return;
    }
    run(reservation.id, () => adminCancelReservation(reservation.id));
  };

  const onPromote = () => {
    setPendingId("promote");
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await promoteWaitlist();
        setNotice(
          result.ok
            ? {
                tone: "info",
                text:
                  result.promoted > 0
                    ? `${result.promoted} personne(s) promue(s) et prévenue(s) par e-mail.`
                    : "Aucune place libre à attribuer pour le moment.",
              }
            : { tone: "error", text: "La promotion a échoué." },
        );
        router.refresh();
      } finally {
        setPendingId(null);
      }
    });
  };

  const freeSeats = Math.max(0, capacity - counts.confirmed);

  return (
    <div className="min-w-0">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Confirmées", value: `${counts.confirmed} / ${capacity}` },
          { label: "Places libres", value: freeSeats },
          { label: "Liste d’attente", value: counts.waitlist },
          { label: "Présents", value: `${counts.present} / ${counts.confirmed}` },
        ].map((item) => (
          <li key={item.label} className="glass min-w-0 rounded-2xl px-4 py-3.5">
            <p className="truncate text-sm font-medium text-muted">{item.label}</p>
            <p className="mt-0.5 text-xl font-extrabold text-navy tabular-nums sm:text-2xl">
              {item.value}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Défile horizontalement dans son propre cadre sur petit écran. */}
        <div className="glass [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-full self-start overflow-x-auto rounded-full p-1.5">
          <div role="group" aria-label="Type de réservation" className="flex w-max gap-1">
            {VIEWS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={view === item.value}
                onClick={() => changeView(item.value)}
                className={cn(
                  "cursor-pointer rounded-full px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
                  view === item.value
                    ? "bg-linear-to-r from-navy to-royal text-white"
                    : "text-navy hover:bg-navy/5",
                )}
              >
                {item.label} <span className="tabular-nums opacity-80">({counts[item.value]})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/admin/export/reservations?format=csv">
              <Download aria-hidden="true" />
              CSV
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/admin/export/reservations?format=xlsx">
              <FileSpreadsheet aria-hidden="true" />
              Excel
            </a>
          </Button>
          {counts.waitlist > 0 && freeSeats > 0 ? (
            <Button type="button" size="sm" onClick={onPromote} disabled={pendingId === "promote"}>
              <UsersRound aria-hidden="true" />
              Attribuer les places libres
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative min-w-0">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute start-4 top-1/2 size-[1.1rem] -translate-y-1/2 text-muted"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            placeholder="Nom, e-mail, code…"
            aria-label="Rechercher une réservation"
            className="ps-11"
          />
        </div>
        <div className="min-w-0">
          <Select
            value={statut}
            onChange={(event) => changeStatut(event.target.value)}
            aria-label="Filtrer par statut"
            className="min-w-0 truncate"
          >
            <option value="">Tous les statuts</option>
            {STATUTS.map((value) => (
              <option key={value} value={value}>
                {statutLabel(value)}
              </option>
            ))}
          </Select>
        </div>
        {view === "confirmed" ? (
          <div className="min-w-0">
            <Select
              value={presence}
              onChange={(event) => changePresence(event.target.value)}
              aria-label="Filtrer par présence"
              className="min-w-0 truncate"
            >
              <option value="">Présents et absents</option>
              <option value="present">Présents</option>
              <option value="absent">Non pointés</option>
            </Select>
          </div>
        ) : null}
      </div>

      {notice ? (
        <div className="mt-4">
          <FormAlert tone={notice.tone}>{notice.text}</FormAlert>
        </div>
      ) : null}

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {rows.length === 0
          ? "Aucun résultat"
          : `${firstIndex + 1}–${firstIndex + pageRows.length} sur ${rows.length} résultat(s)`}
      </p>

      {/* Mobile : une carte par personne (aucun défilement horizontal). */}
      <ul className="mt-2 flex flex-col gap-3 md:hidden">
        {pageRows.length === 0 ? (
          <li className="glass rounded-2xl px-4 py-10 text-center text-muted">
            Aucune réservation ne correspond.
          </li>
        ) : (
          pageRows.map((r, index) => (
            <li key={r.id} className="glass min-w-0 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 font-bold break-words text-navy">
                  {view === "waitlist" ? (
                    <span className="me-2 inline-grid size-6 place-items-center rounded-full bg-amber-100 text-xs text-amber-900">
                      {firstIndex + index + 1}
                    </span>
                  ) : null}
                  {r.prenom} {r.nom}
                </p>
                <span className="shrink-0 font-mono text-sm font-bold text-navy">{r.code}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-ink">{statutLabel(r.statut)}</p>
              <p className="text-sm break-words text-muted">
                {r.etablissement}
                {r.filiere ? ` · ${r.filiere}` : ""}
              </p>
              <p className="mt-2 text-sm">
                <a href={`mailto:${r.email}`} className="break-all text-navy hover:underline">
                  {r.email}
                </a>
              </p>
              <p className="text-sm">
                <a href={`tel:${r.telephone}`} className="text-muted hover:underline">
                  {formatPhone(r.telephone)}
                </a>
                <span className="text-muted"> · {formatDateTime(r.created_at)}</span>
              </p>
              <div className="mt-3 flex items-center gap-2">
                <RowActions
                  reservation={r}
                  busy={pendingId === r.id}
                  onToggle={() => run(r.id, () => setPresence(r.id, !r.checked_in_at))}
                  onCancel={() => onCancel(r)}
                  stretch
                />
              </div>
            </li>
          ))
        )}
      </ul>

      {/* Tablette et ordinateur : tableau, défilable dans son propre cadre. */}
      <div className="glass mt-2 hidden max-w-full overflow-x-auto rounded-2xl md:block">
        <table className="w-full min-w-[52rem] text-start text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-xs tracking-wide text-muted uppercase">
              <th scope="col" className="px-4 py-3 text-start font-semibold">
                {view === "waitlist" ? "Rang · Participant" : "Participant"}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-semibold">
                Contact
              </th>
              <th scope="col" className="px-4 py-3 text-start font-semibold">
                Statut · Établissement
              </th>
              <th scope="col" className="px-4 py-3 text-start font-semibold">
                Code · Inscription
              </th>
              <th scope="col" className="px-4 py-3 text-end font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  Aucune réservation ne correspond.
                </td>
              </tr>
            ) : (
              pageRows.map((r, index) => (
                <tr key={r.id} className="border-b border-navy/5 align-top last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-bold text-navy">
                      {view === "waitlist" ? (
                        <span className="me-2 inline-grid size-6 place-items-center rounded-full bg-amber-100 text-xs text-amber-900">
                          {firstIndex + index + 1}
                        </span>
                      ) : null}
                      {r.prenom} {r.nom}
                    </p>
                    {r.filiere ? <p className="text-muted">{r.filiere}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${r.email}`} className="block break-all text-navy hover:underline">
                      {r.email}
                    </a>
                    <a href={`tel:${r.telephone}`} className="text-muted hover:underline">
                      {formatPhone(r.telephone)}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{statutLabel(r.statut)}</p>
                    <p className="text-muted">{r.etablissement}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono font-bold text-navy">{r.code}</p>
                    <p className="text-muted">{formatDateTime(r.created_at)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <RowActions
                        reservation={r}
                        busy={pendingId === r.id}
                        onToggle={() => run(r.id, () => setPresence(r.id, !r.checked_in_at))}
                        onCancel={() => onCancel(r)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft aria-hidden="true" />
            Précédent
          </Button>
          <p className="text-sm font-semibold text-navy tabular-nums">
            Page {currentPage} / {pageCount}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Suivant
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}

function RowActions({
  reservation: r,
  busy,
  onToggle,
  onCancel,
  stretch = false,
}: {
  reservation: AdminReservation;
  busy: boolean;
  onToggle: () => void;
  onCancel: () => void;
  stretch?: boolean;
}) {
  return (
    <>
      {r.status === "confirmed" ? (
        <button
          type="button"
          disabled={busy}
          aria-pressed={Boolean(r.checked_in_at)}
          onClick={onToggle}
          className={cn(
            "inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-60",
            stretch && "flex-1",
            r.checked_in_at
              ? "border-mint/50 bg-mint/15 text-mint-dark"
              : "border-navy/20 bg-white text-navy hover:border-navy/50",
          )}
        >
          <CircleCheck aria-hidden="true" className="size-4" />
          {r.checked_in_at ? `Présent · ${formatTime(r.checked_in_at)}` : "Marquer présent"}
        </button>
      ) : (
        <span
          className={cn(
            "rounded-full bg-navy/5 px-3 py-1.5 text-xs font-semibold text-muted",
            stretch && "flex-1",
          )}
        >
          {RESERVATION_STATUS_LABELS[r.status]}
          {r.cancelled_at ? ` · ${formatDateTime(r.cancelled_at)}` : ""}
        </span>
      )}
      {r.status !== "cancelled" ? (
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          aria-label={`Annuler la réservation de ${r.prenom} ${r.nom}`}
          title="Annuler la réservation"
          className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-navy/15 bg-white text-muted transition-colors hover:border-rose-300 hover:text-rose-700 disabled:opacity-60"
        >
          <UserRoundX aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </>
  );
}
