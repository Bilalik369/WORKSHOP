"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { site } from "@/data/site";

const START = new Date(site.eventStart).getTime();
const END = new Date(site.eventEnd).getTime();

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function getParts(now: number): Parts {
  const diff = Math.max(0, START - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const UNITS = ["days", "hours", "minutes", "seconds"] as const;

/** Compte à rebours en direct jusqu'au 2 janvier 2027, 09h30 (heure du Maroc). */
export function Countdown() {
  const t = useTranslations("countdown");
  // null tant que le composant n'est pas monté : évite tout écart serveur/client.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (now !== null && now >= START) {
    return (
      <p className="glass inline-flex rounded-2xl px-5 py-3 font-semibold text-navy">
        {now < END ? t("live") : t("ended")}
      </p>
    );
  }

  const parts = now === null ? null : getParts(now);

  return (
    <div>
      <p className="mb-2.5 text-sm font-semibold text-muted">{t("label")}</p>
      <div
        role="timer"
        aria-live="off"
        className="grid w-full max-w-md grid-cols-4 gap-2.5 sm:gap-3"
      >
        {UNITS.map((unit) => (
          <div
            key={unit}
            className="glass flex flex-col items-center rounded-2xl px-1 py-3 sm:py-3.5"
          >
            <span
              className="text-2xl leading-none font-extrabold text-navy tabular-nums sm:text-3xl"
              suppressHydrationWarning
            >
              {parts ? String(parts[unit]).padStart(2, "0") : "––"}
            </span>
            <span className="mt-1.5 text-[0.7rem] font-medium tracking-wide text-muted uppercase rtl:text-xs rtl:tracking-normal">
              {t(unit)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
