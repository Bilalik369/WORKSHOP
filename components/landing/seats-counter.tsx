"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type SeatSnapshot = { capacity: number; remaining: number };

const REFRESH_MS = 20_000;

/** Suit le nombre de places restantes (rafraîchi toutes les 20 secondes). */
export function useSeats(initial: SeatSnapshot): SeatSnapshot {
  const [seats, setSeats] = useState(initial);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/seats", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as SeatSnapshot;
        if (!cancelled && typeof data.remaining === "number") {
          setSeats({ capacity: data.capacity, remaining: data.remaining });
        }
      } catch {
        // Hors ligne : on garde la dernière valeur connue.
      }
    };

    refresh();
    const timer = window.setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return seats;
}

/** Pastille « X places restantes », mise à jour en direct. */
export function SeatsCounter({
  initial,
  className,
}: {
  initial: SeatSnapshot;
  className?: string;
}) {
  const t = useTranslations("seats");
  const seats = useSeats(initial);
  const full = seats.remaining <= 0;

  return (
    <p
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border bg-white/70 py-1.5 ps-3 pe-4 text-sm font-semibold backdrop-blur",
        full ? "border-amber-500/40 text-amber-900" : "border-mint/40 text-navy",
        className,
      )}
    >
      <span aria-hidden="true" className="relative grid size-2.5 place-items-center">
        <span
          className={cn(
            "absolute size-full animate-ping rounded-full opacity-70 motion-reduce:hidden",
            full ? "bg-amber-500" : "bg-mint",
          )}
        />
        <span className={cn("size-2.5 rounded-full", full ? "bg-amber-500" : "bg-mint")} />
      </span>
      {full ? (
        t("full")
      ) : (
        <span>
          {t("remaining", { count: seats.remaining })}{" "}
          <span className="font-medium text-muted">{t("capacity", { capacity: seats.capacity })}</span>
        </span>
      )}
    </p>
  );
}
