import { event } from "./event";

/**
 * Informations générales : lieu, contact, liens.
 * La DATE se modifie dans `data/event.ts` (un seul endroit pour tout le site).
 */
export const site = {
  /** Début et fin : repris de data/event.ts. */
  eventStart: event.start,
  eventEnd: event.end,
  timeZone: event.timeZone,

  /** Valeurs par défaut si les variables d'environnement sont absentes. */
  defaultCapacity: 150,
  defaultSubmissionDeadline: "2026-12-20T23:59:59+01:00",

  /** Lieu. */
  venue: {
    mapsEmbedUrl:
      "https://www.google.com/maps?q=%C3%89cole+Sup%C3%A9rieure+d%27%C3%89ducation+et+de+Formation+Beni+Mellal&output=embed",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=%C3%89cole+Sup%C3%A9rieure+d%27%C3%89ducation+et+de+Formation+Beni+Mellal",
  },

  /** Contact (remplacé par NEXT_PUBLIC_CONTACT_EMAIL si défini). */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@example.com",

  /** Réseaux sociaux : remplacez les « # » par les vrais liens. */
  socials: [
    { id: "instagram", href: "#" },
    { id: "facebook", href: "#" },
    { id: "linkedin", href: "#" },
    { id: "whatsapp", href: "#" },
  ],

  /** Sites institutionnels. */
  links: {
    usms: "https://www.usms.ac.ma",
  },
} as const;

export type SocialId = (typeof site.socials)[number]["id"];
