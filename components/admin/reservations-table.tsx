"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Download, FileSpreadsheet, Search, UserRoundX, UsersRound } from "lucide-react";
import { adminCancelReservation, promoteWaitlist, setPresence } from "@/app/admin/actions";
import {
  RESERVATION_STATUS_LABELS,
  formatDateTime,
  formatTime,
  statutLabel,
} from "@/lib/admin/labels";
import { STATUTS } from "@/lib/constants";
import type { Reservation, ReservationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/validation/shared";
import { Button } from "@/components/ui/button";
import { FormAlert, Input, Select } from "@/components/ui/form";

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
  reservations: Reservation[];
  capacity: number;
}) {
  const router = useRouter();
  const [view, setView] = useState<ReservationStatus>("confirmed");
  const [query, setQuery] = useState("");
  const [statut, setStatut] = useState("");
  const [presence, setPresenceFilter] = useState("");
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

  const onCancel = (reservation: Reservation) => {
    const name = `${reservation.prenom} ${reservation.nom}`;
    if (
      !window.confirm(
        `Annuler la réservation de ${name} ?\n\nLa place sera libérée et proposée à la liste d’attente. La personne sera prévenue par e-mail.`,
      )
    ) {
      return;
    }
    run(reservation.id, () => adminCancelReservation(reservation.cancel_token));
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
    <div>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Confirmées", value: `${counts.confirmed} / ${capacity}` },
          { label: "Places libres", value: freeSeats },
          { label: "Liste d’attente", value: counts.waitlist },
          { label: "Présents", value: `${counts.present} / ${counts.confirmed}` },
        ].map((item) => (
          <li key={item.label} className="glass rounded-2xl px-4 py-3.5">
            <p className="text-sm font-medium text-muted">{item.label}</p>
            <p className="mt-0.5 text-2xl font-extrabold text-navy tabular-nums">{item.value}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Type de réservation" className="glass inline-flex self-start rounded-full p-1.5">
          {VIEWS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={view === item.value}
              onClick={() => setView(item.value)}
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

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute start-4 top-1/2 size-[1.1rem] -translate-y-1/2 text-muted"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher : nom, e-mail, code, établissement…"
            aria-label="Rechercher une réservation"
            className="ps-11"
          />
        </div>
        <Select
          value={statut}
          onChange={(event) => setStatut(event.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map((value) => (
            <option key={value} value={value}>
              {statutLabel(value)}
            </option>
          ))}
        </Select>
        {view === "confirmed" ? (
          <Select
            value={presence}
            onChange={(event) => setPresenceFilter(event.target.value)}
            aria-label="Filtrer par présence"
          >
            <option value="">Présents et absents</option>
            <option value="present">Présents</option>
            <option value="absent">Non pointés</option>
          </Select>
        ) : null}
      </div>

      {notice ? (
        <div className="mt-4">
          <FormAlert tone={notice.tone}>{notice.text}</FormAlert>
        </div>
      ) : null}

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {rows.length} résultat(s)
      </p>

      <div className="glass mt-2 overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[56rem] text-start text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-xs tracking-wide text-muted uppercase">
              <th scope="col" className="px-4 py-3 text-start font-semibold">
                {view === "waitlist" ? "Rang · Participant" : "Participant"}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-semibold">Contact</th>
              <th scope="col" className="px-4 py-3 text-start font-semibold">Statut · Établissement</th>
              <th scope="col" className="px-4 py-3 text-start font-semibold">Code · Inscription</th>
              <th scope="col" className="px-4 py-3 text-end font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  Aucune réservation ne correspond.
                </td>
              </tr>
            ) : (
              rows.map((r, index) => {
                const busy = pendingId === r.id;
                return (
                  <tr key={r.id} className="border-b border-navy/5 align-top last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-bold text-navy">
                        {view === "waitlist" ? (
                          <span className="me-2 inline-grid size-6 place-items-center rounded-full bg-amber-100 text-xs text-amber-900">
                            {index + 1}
                          </span>
                        ) : null}
                        {r.prenom} {r.nom}
                      </p>
                      {r.filiere ? <p className="text-muted">{r.filiere}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${r.email}`} className="block text-navy hover:underline">
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
                        {r.status === "confirmed" ? (
                          <button
                            type="button"
                            disabled={busy}
                            aria-pressed={Boolean(r.checked_in_at)}
                            onClick={() => run(r.id, () => setPresence(r.id, !r.checked_in_at))}
                            className={cn(
                              "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-60",
                              r.checked_in_at
                                ? "border-mint/50 bg-mint/15 text-mint-dark"
                                : "border-navy/20 bg-white text-navy hover:border-navy/50",
                            )}
                          >
                            <CircleCheck aria-hidden="true" className="size-4" />
                            {r.checked_in_at
                              ? `Présent · ${formatTime(r.checked_in_at)}`
                              : "Marquer présent"}
                          </button>
                        ) : (
                          <span className="rounded-full bg-navy/5 px-3 py-1.5 text-xs font-semibold text-muted">
                            {RESERVATION_STATUS_LABELS[r.status]}
                            {r.cancelled_at ? ` · ${formatDateTime(r.cancelled_at)}` : ""}
                          </span>
                        )}
                        {r.status !== "cancelled" ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onCancel(r)}
                            aria-label={`Annuler la réservation de ${r.prenom} ${r.nom}`}
                            title="Annuler la réservation"
                            className="grid size-9 cursor-pointer place-items-center rounded-full border border-navy/15 bg-white text-muted transition-colors hover:border-rose-300 hover:text-rose-700 disabled:opacity-60"
                          >
                            <UserRoundX aria-hidden="true" className="size-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
