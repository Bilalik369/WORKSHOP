"use client";

import dynamic from "next/dynamic";

/**
 * Le scanner (et sa bibliothèque de lecture de QR codes) n'est téléchargé
 * que sur la page Check-in, pas sur les autres onglets.
 */
export const LazyScanner = dynamic(
  () => import("./scanner").then((module) => module.Scanner),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Chargement du scanner"
        className="mx-auto aspect-square w-full max-w-lg animate-pulse rounded-3xl bg-navy/10"
      />
    ),
  },
);
