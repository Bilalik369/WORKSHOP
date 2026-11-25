"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, MapPin } from "lucide-react";
import { site } from "@/data/site";
import { Button } from "@/components/ui/button";

/**
 * Carte Google Maps chargée uniquement à la demande : la page reste
 * rapide et aucun cookie tiers n'est déposé sans action du visiteur.
 */
export function MapEmbed() {
  const t = useTranslations("infos");
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="glass relative h-full min-h-[22rem] overflow-hidden rounded-3xl">
      {loaded ? (
        <iframe
          title={t("mapTitle")}
          src={site.venue.mapsEmbedUrl}
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          {/* Fond stylisé évoquant un plan */}
          <svg
            aria-hidden="true"
            className="absolute inset-0 size-full text-azure/25"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern id="map-grid" width="56" height="56" patternUnits="userSpaceOnUse">
                <path d="M56 0H0v56" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#map-grid)" />
            <path
              d="M-20 240C120 180 220 300 380 220S620 120 760 180"
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M120 -20C160 120 90 240 180 420"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
            />
          </svg>
          <span
            aria-hidden="true"
            className="relative grid size-16 place-items-center rounded-full bg-linear-to-br from-navy to-royal text-white shadow-lift"
          >
            <MapPin className="size-7" />
          </span>
          <p className="relative text-lg font-bold text-navy">ESEF — Beni Mellal</p>
          <div className="relative flex flex-col gap-2.5 sm:flex-row">
            <Button type="button" onClick={() => setLoaded(true)}>
              {t("mapShow")}
            </Button>
            <Button asChild variant="outline">
              <a href={site.venue.mapsUrl} target="_blank" rel="noopener noreferrer">
                {t("mapOpen")}
                <ExternalLink aria-hidden="true" />
              </a>
            </Button>
          </div>
          <p className="relative text-xs text-muted">{t("mapNotice")}</p>
        </div>
      )}
    </div>
  );
}
