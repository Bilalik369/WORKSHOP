import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // « ar-MA » : arabe avec les conventions marocaines (chiffres 0-9, noms des mois).
  locales: ["fr", "ar-MA"],
  defaultLocale: "fr",
  // Le français est servi sans préfixe (/), l'arabe sous /ar.
  localePrefix: {
    mode: "as-needed",
    prefixes: { "ar-MA": "/ar" },
  },
  // Les liens partagés (WhatsApp, Instagram) ouvrent toujours la langue du lien.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

/** Langue du contenu (fichiers de messages et données) : "fr" ou "ar". */
export type ContentLang = "fr" | "ar";

export function contentLang(locale: string): ContentLang {
  return locale.startsWith("ar") ? "ar" : "fr";
}

export function isRtl(locale: string): boolean {
  return locale.startsWith("ar");
}
