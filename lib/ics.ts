import { site } from "@/data/site";

const toIcsDate = (iso: string) =>
  new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const escapeText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** Fichier .ics (« Ajouter à mon agenda ») pour le workshop. */
export function buildIcs(options: {
  title: string;
  description: string;
  location: string;
  url: string;
}): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ESEF Beni Mellal//Workshop IA Education//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:workshop-ia-education-2027@esef-beni-mellal",
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(site.eventStart)}`,
    `DTEND:${toIcsDate(site.eventEnd)}`,
    `SUMMARY:${escapeText(options.title)}`,
    `DESCRIPTION:${escapeText(options.description)}`,
    `LOCATION:${escapeText(options.location)}`,
    `URL:${options.url}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(options.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
