"use client";

import { useSyncExternalStore } from "react";
import { CalendarClock, X } from "lucide-react";

const EVENT_NAME = "date-change-banner";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT_NAME, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT_NAME, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readDismissed(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/**
 * Bandeau « changement de date », refermable. Le choix est mémorisé sur
 * l'appareil ; changer `dateChange.id` dans data/event.ts le réaffiche.
 */
export function DateChangeBanner({
  id,
  label,
  title,
  text,
  dismissLabel,
}: {
  id: string;
  label: string;
  title: string;
  text: string;
  dismissLabel: string;
}) {
  const storageKey = `date-change-dismissed:${id}`;
  const dismissed = useSyncExternalStore(
    subscribe,
    () => readDismissed(storageKey),
    () => false,
  );

  if (dismissed) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // Stockage indisponible (navigation privée) : on masque quand même.
    }
    window.dispatchEvent(new Event(EVENT_NAME));
  };

  return (
    <aside
      aria-label={label}
      className="relative mb-6 w-full rounded-2xl border-[1.5px] border-amber-400/70 bg-amber-50/95 p-4 pe-12 shadow-soft sm:p-5 sm:pe-14"
    >
      <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-amber-900 uppercase rtl:text-sm rtl:tracking-normal">
        <CalendarClock aria-hidden="true" className="size-4 shrink-0" />
        {label}
      </p>
      <p className="mt-1.5 text-lg leading-snug font-extrabold text-navy">{title}</p>
      <p className="mt-1 text-[0.95rem] leading-relaxed text-ink">{text}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label={dismissLabel}
        className="absolute end-2 top-2 grid size-10 cursor-pointer place-items-center rounded-full text-amber-900 transition-colors hover:bg-amber-200/60"
      >
        <X aria-hidden="true" className="size-5" />
      </button>
    </aside>
  );
}
