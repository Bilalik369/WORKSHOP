/**
 * DATE ET HORAIRES DU WORKSHOP — le seul endroit à modifier.
 *
 * Tout le site en dépend : page d'accueil, compte à rebours, billets,
 * e-mails, fichier agenda (.ics), image de partage et référencement.
 *
 * Pour changer la date une prochaine fois :
 *   1. modifiez `start` et `end` ci-dessous (heure du Maroc, UTC+1) ;
 *   2. mettez l'ancienne date dans `dateChange.previousStart` et passez
 *      `dateChange.active` à true pour afficher le bandeau d'annonce ;
 *   3. augmentez `icsSequence` de 1 (les agendas mettent alors à jour
 *      l'événement déjà enregistré au lieu d'en créer un second).
 */
export const event = {
  /** Mardi 19 janvier 2027, 09h30 – 15h30 (heure du Maroc). */
  start: "2027-01-19T09:30:00+01:00",
  end: "2027-01-19T15:30:00+01:00",
  timeZone: "Africa/Casablanca",

  /** Numéro de version de l'événement dans les agendas. */
  icsSequence: 1,

  /** Annonce « changement de date » (bandeau du site et e-mail). */
  dateChange: {
    active: true,
    /** Ancienne date, rappelée dans l'annonce. */
    previousStart: "2027-01-02T09:30:00+01:00",
    /** Changez cet identifiant pour réafficher le bandeau à ceux qui l'ont fermé. */
    id: "2027-01-19",
  },
} as const;

export type EventLang = "fr" | "ar";

export type EventLabels = {
  /** « Mardi 19 janvier 2027 » */
  date: string;
  /** « mardi 19 janvier 2027 » (au milieu d'une phrase) */
  dateInline: string;
  /** « 19 janvier 2027 » */
  dateShort: string;
  /** « 09h30 – 15h30 » */
  time: string;
  /** « 09h30 » et « 15h30 » */
  startTime: string;
  endTime: string;
  /** « Mardi 19 janvier 2027 · 09h30 – 15h30 » */
  dateTime: string;
  /** Ancienne date : « samedi 2 janvier 2027 » */
  previousDateInline: string;
  /** Année de l'événement. */
  year: string;
};

const INTL_LOCALE: Record<EventLang, string> = { fr: "fr-FR", ar: "ar-MA" };

/**
 * Les dates ci-dessus sont écrites en heure du Maroc. On lit donc le jour
 * et l'heure directement dans le texte (« 2027-01-19T09:30 »), sans passer
 * par la base de fuseaux horaires du système : le résultat est identique
 * sur le serveur et dans tous les navigateurs.
 */
function formatDate(iso: string, lang: EventLang, withWeekday: boolean): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat(INTL_LOCALE[lang], {
    weekday: withWeekday ? "long" : undefined,
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(year, month - 1, day, 12)))
    .replace("،", "");
}

function formatTime(iso: string, lang: EventLang): string {
  const hour = iso.slice(11, 13);
  const minute = iso.slice(14, 16);
  return lang === "fr" ? `${hour}h${minute}` : `${hour}:${minute}`;
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * Libellés de date prêts à afficher. À appeler côté serveur, puis à
 * transmettre aux composants client (même texte garanti des deux côtés).
 */
export function getEventLabels(lang: EventLang): EventLabels {
  const dateInline = formatDate(event.start, lang, true);
  const date = capitalize(dateInline);
  const startTime = formatTime(event.start, lang);
  const endTime = formatTime(event.end, lang);
  const time = `${startTime} – ${endTime}`;

  return {
    date,
    dateInline,
    dateShort: formatDate(event.start, lang, false),
    time,
    startTime,
    endTime,
    dateTime: `${date} · ${time}`,
    previousDateInline: formatDate(event.dateChange.previousStart, lang, true),
    year: event.start.slice(0, 4),
  };
}
