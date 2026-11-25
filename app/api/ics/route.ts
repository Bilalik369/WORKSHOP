import { emailStrings } from "@/lib/email/strings";
import { getSiteUrl } from "@/lib/env";
import { buildIcs } from "@/lib/ics";

/** Fichier d'agenda du workshop (« Ajouter à mon agenda »). */
export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang") === "ar" ? "ar" : "fr";
  const strings = emailStrings[lang];

  const ics = buildIcs({
    title: strings.eventTitle,
    description: strings.tagline,
    location: strings.venue,
    url: `${getSiteUrl()}${lang === "ar" ? "/ar" : ""}`,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="workshop.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
