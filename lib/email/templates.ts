import "server-only";
import { getEventLabels } from "@/data/event";
import { buildIcs } from "@/lib/ics";
import { getSiteUrl } from "@/lib/env";
import { qrPngBuffer } from "@/lib/qr";
import type { Project, Reservation } from "@/lib/types";
import type { EmailMessage } from "./send";
import { emailStrings, fill, type EmailLang } from "./strings";

const NAVY = "#0a2a8c";
const INK = "#2f3c6b";
const MUTED = "#55618a";
const MINT = "#0b7f6c";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const langOf = (locale: string | null | undefined): EmailLang => (locale === "ar" ? "ar" : "fr");

function localizedUrl(lang: EmailLang, path: string): string {
  return `${getSiteUrl()}${lang === "ar" ? "/ar" : ""}${path}`;
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td style="border-radius:999px;background:${NAVY};background-image:linear-gradient(90deg,#0a2a8c,#2447c4);">
<a href="${href}" style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
</td></tr></table>`;
}

function paragraph(text: string, color = INK): string {
  return `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:${color};">${text}</p>`;
}

function infoRows(rows: [string, string][]): string {
  const cells = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:10px 0;border-top:1px solid #e3e8fb;font-size:13px;color:${MUTED};width:38%;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:10px 0;border-top:1px solid #e3e8fb;font-size:15px;font-weight:700;color:${NAVY};vertical-align:top;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 6px;">${cells}</table>`;
}

/** Gabarit commun : en-tête aux couleurs de l'affiche, carte blanche, pied de page. */
function layout(lang: EmailLang, title: string, body: string): string {
  const s = emailStrings[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const align = lang === "ar" ? "right" : "left";
  const font =
    lang === "ar"
      ? "'Segoe UI',Tahoma,Arial,sans-serif"
      : "'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif";

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#eef1ff;font-family:${font};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1ff;background-image:linear-gradient(160deg,#f5f7ff,#eef1ff 50%,#f3eeff);">
<tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td dir="${dir}" style="padding:6px 8px 20px;text-align:${align};">
<span style="display:inline-block;border:1.5px solid #9db9f5;border-radius:999px;padding:6px 16px;font-size:11px;font-weight:700;letter-spacing:${lang === "ar" ? "0" : "3px"};color:${NAVY};background:#ffffff;">WORKSHOP</span>
<div style="margin-top:14px;font-size:22px;line-height:1.25;font-weight:800;color:${NAVY};">${escapeHtml(s.eventTitle)}</div>
</td></tr>
<tr><td dir="${dir}" style="background:#ffffff;border-radius:24px;padding:32px 28px;text-align:${align};box-shadow:0 10px 40px -12px rgba(10,42,140,0.16);">
<h1 style="margin:0 0 6px;font-size:24px;line-height:1.3;font-weight:800;color:${NAVY};">${escapeHtml(title)}</h1>
<div style="width:90px;height:3px;border-radius:3px;background:linear-gradient(90deg,#5b8def,#a99bf0);margin:0 0 22px;${lang === "ar" ? "margin-right:0;" : ""}"></div>
${body}
</td></tr>
<tr><td dir="${dir}" style="padding:22px 12px 6px;text-align:center;">
<div style="font-size:12px;font-weight:700;letter-spacing:${lang === "ar" ? "0" : "2px"};color:${NAVY};text-transform:uppercase;">${escapeHtml(s.tagline)}</div>
<p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:${MUTED};">${escapeHtml(s.footer)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function fullName(reservation: Reservation): string {
  return `${reservation.prenom} ${reservation.nom}`.trim();
}

function icsAttachment(lang: EmailLang) {
  const s = emailStrings[lang];
  return {
    filename: "workshop.ics",
    content: Buffer.from(
      buildIcs({
        title: s.eventTitle,
        description: s.tagline,
        location: s.venue,
        url: localizedUrl(lang, "/"),
      }),
      "utf-8",
    ),
    contentType: "text/calendar; charset=utf-8; method=PUBLISH",
  };
}

/** Billet : réservation confirmée (ou promue depuis la liste d'attente). */
export async function ticketEmail(
  reservation: Reservation,
  options: { promoted?: boolean } = {},
): Promise<EmailMessage> {
  const lang = langOf(reservation.locale);
  const s = emailStrings[lang];
  const when = getEventLabels(lang);
  const base = options.promoted ? { ...s.confirmed, ...s.promoted } : s.confirmed;
  const copy = { ...base, subject: fill(base.subject, { date: when.dateShort }) };
  const ticketUrl = localizedUrl(lang, `/reservation/billet/${reservation.ticket_token}`);
  const cancelUrl = localizedUrl(lang, `/reservation/annuler/${reservation.cancel_token}`);
  const name = fullName(reservation);

  const body = [
    paragraph(escapeHtml(fill(s.hello, { name: reservation.prenom }))),
    paragraph(escapeHtml(copy.intro)),
    `<div style="text-align:center;margin:22px 0 4px;"><img src="cid:ticket-qr" width="220" height="220" alt="QR ${escapeHtml(reservation.code)}" style="display:inline-block;border:1px solid #d5dcf7;border-radius:18px;padding:10px;background:#ffffff;"></div>`,
    `<div style="text-align:center;font-size:24px;font-weight:800;letter-spacing:3px;color:${NAVY};margin:8px 0 4px;" dir="ltr">${escapeHtml(reservation.code)}</div>`,
    infoRows([
      [s.labels.holder, name],
      [s.labels.date, when.dateTime],
      [s.labels.venue, s.venue],
    ]),
    button(s.confirmed.button, ticketUrl),
    paragraph(escapeHtml(s.confirmed.calendar), MUTED),
    paragraph(escapeHtml(s.confirmed.bring), MUTED),
    `<p style="margin:22px 0 0;padding-top:18px;border-top:1px solid #e3e8fb;font-size:14px;line-height:1.6;color:${MUTED};">${escapeHtml(s.confirmed.cancelIntro)} <a href="${cancelUrl}" style="color:${NAVY};font-weight:700;">${escapeHtml(s.confirmed.cancelLink)}</a></p>`,
  ].join("\n");

  return {
    to: reservation.email,
    subject: copy.subject,
    html: layout(lang, copy.title, body),
    text: [
      fill(s.hello, { name: reservation.prenom }),
      copy.intro,
      `${s.labels.code} : ${reservation.code}`,
      `${s.labels.date} : ${when.dateTime}`,
      `${s.labels.venue} : ${s.venue}`,
      `${s.confirmed.button} : ${ticketUrl}`,
      `${s.confirmed.cancelLink} : ${cancelUrl}`,
    ].join("\n\n"),
    attachments: [
      {
        filename: `billet-${reservation.code}.png`,
        content: await qrPngBuffer(reservation.code),
        contentType: "image/png",
        contentId: "ticket-qr",
      },
      icsAttachment(lang),
    ],
  };
}

export function waitlistEmail(reservation: Reservation, position: number | null): EmailMessage {
  const lang = langOf(reservation.locale);
  const s = emailStrings[lang];
  const when = getEventLabels(lang);
  const ticketUrl = localizedUrl(lang, `/reservation/billet/${reservation.ticket_token}`);
  const cancelUrl = localizedUrl(lang, `/reservation/annuler/${reservation.cancel_token}`);

  const body = [
    paragraph(escapeHtml(fill(s.hello, { name: reservation.prenom }))),
    paragraph(escapeHtml(s.waitlist.intro)),
    position
      ? `<p style="margin:0 0 14px;font-size:18px;font-weight:800;color:${MINT};">${escapeHtml(fill(s.waitlist.position, { position }))}</p>`
      : "",
    infoRows([
      [s.labels.code, reservation.code],
      [s.labels.date, when.dateTime],
      [s.labels.venue, s.venue],
    ]),
    button(s.waitlist.button, ticketUrl),
    `<p style="margin:22px 0 0;padding-top:18px;border-top:1px solid #e3e8fb;font-size:14px;line-height:1.6;color:${MUTED};">${escapeHtml(s.waitlist.cancelIntro)} <a href="${cancelUrl}" style="color:${NAVY};font-weight:700;">${escapeHtml(s.waitlist.cancelLink)}</a></p>`,
  ].join("\n");

  return {
    to: reservation.email,
    subject: s.waitlist.subject,
    html: layout(lang, s.waitlist.title, body),
    text: [
      fill(s.hello, { name: reservation.prenom }),
      s.waitlist.intro,
      position ? fill(s.waitlist.position, { position }) : "",
      `${s.waitlist.button} : ${ticketUrl}`,
      `${s.waitlist.cancelLink} : ${cancelUrl}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

export function cancelledEmail(reservation: Reservation): EmailMessage {
  const lang = langOf(reservation.locale);
  const s = emailStrings[lang];
  const reserveUrl = localizedUrl(lang, "/reservation");
  const intro = fill(s.cancelled.intro, { code: reservation.code });

  return {
    to: reservation.email,
    subject: s.cancelled.subject,
    html: layout(
      lang,
      s.cancelled.title,
      [
        paragraph(escapeHtml(fill(s.hello, { name: reservation.prenom }))),
        paragraph(escapeHtml(intro)),
        button(s.cancelled.button, reserveUrl),
      ].join("\n"),
    ),
    text: [fill(s.hello, { name: reservation.prenom }), intro, reserveUrl].join("\n\n"),
  };
}

export function projectReceivedEmail(project: Project): EmailMessage {
  const lang = langOf(project.locale);
  const s = emailStrings[lang];
  const values = { titre: project.titre, name: project.porteur_nom };
  const reserveUrl = localizedUrl(lang, "/reservation");

  return {
    to: project.porteur_email,
    subject: fill(s.projectReceived.subject, values),
    html: layout(
      lang,
      s.projectReceived.title,
      [
        paragraph(escapeHtml(fill(s.hello, values))),
        paragraph(escapeHtml(fill(s.projectReceived.intro, values))),
        paragraph(escapeHtml(s.projectReceived.reminder), MUTED),
        button(s.projectReceived.button, reserveUrl),
      ].join("\n"),
    ),
    text: [
      fill(s.hello, values),
      fill(s.projectReceived.intro, values),
      s.projectReceived.reminder,
      reserveUrl,
    ].join("\n\n"),
  };
}

export function projectDecisionEmail(project: Project): EmailMessage {
  const lang = langOf(project.locale);
  const s = emailStrings[lang];
  const accepted = project.status === "accepted";
  const copy = accepted ? s.projectAccepted : s.projectRefused;
  const values = { titre: project.titre, name: project.porteur_nom };
  const url = accepted ? localizedUrl(lang, "/#projets") : localizedUrl(lang, "/reservation");
  const formatLabel = s.formats[project.format as keyof typeof s.formats] ?? project.format;
  const comment = project.admin_comment?.trim();

  const commentBlock = comment
    ? `<div style="margin:6px 0 16px;padding:16px 18px;border-radius:16px;background:#f5f7ff;border:1px solid #e3e8fb;"><div style="font-size:13px;font-weight:700;color:${MUTED};margin-bottom:6px;">${escapeHtml(copy.comment)}</div><div style="font-size:15px;line-height:1.6;color:${INK};white-space:pre-line;">${escapeHtml(comment)}</div></div>`
    : "";

  return {
    to: project.porteur_email,
    subject: fill(copy.subject, values),
    html: layout(
      lang,
      copy.title,
      [
        paragraph(escapeHtml(fill(s.hello, values))),
        paragraph(escapeHtml(fill(copy.intro, values))),
        accepted
          ? `<p style="margin:0 0 14px;font-size:16px;font-weight:700;color:${MINT};">${escapeHtml(fill(s.projectAccepted.format, { format: formatLabel }))}</p>`
          : "",
        commentBlock,
        paragraph(escapeHtml(copy.reminder), MUTED),
        button(copy.button, url),
      ].join("\n"),
    ),
    text: [
      fill(s.hello, values),
      fill(copy.intro, values),
      accepted ? fill(s.projectAccepted.format, { format: formatLabel }) : "",
      comment ? `${copy.comment}\n${comment}` : "",
      copy.reminder,
      url,
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

/**
 * Annonce du changement de date, pour les réservations confirmées et la
 * liste d'attente. Le fichier agenda mis à jour (.ics) est joint à
 * l'e-mail, et proposé aussi par un lien de secours.
 */
export function dateChangeEmail(reservation: Reservation): EmailMessage {
  const lang = langOf(reservation.locale);
  const s = emailStrings[lang];
  const copy = s.dateChange;
  const when = getEventLabels(lang);
  const isWaitlist = reservation.status === "waitlist";
  const values = {
    date: when.dateInline,
    previous: when.previousDateInline,
    time: when.time,
  };
  const ticketUrl = localizedUrl(lang, `/reservation/billet/${reservation.ticket_token}`);
  const cancelUrl = localizedUrl(lang, `/reservation/annuler/${reservation.cancel_token}`);
  const icsUrl = `${getSiteUrl()}/api/ics?lang=${lang}`;
  const status = isWaitlist ? copy.waitlist : copy.confirmed;
  const buttonLabel = isWaitlist ? copy.buttonWaitlist : copy.button;

  const body = [
    paragraph(escapeHtml(fill(s.hello, { name: reservation.prenom }))),
    paragraph(escapeHtml(fill(copy.intro, values))),
    `<div style="margin:18px 0;padding:18px 20px;border-radius:18px;background:#f5f7ff;border:1px solid #d5dcf7;text-align:center;"><div style="font-size:12px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:${lang === "ar" ? "0" : "2px"};">${escapeHtml(copy.newDate)}</div><div style="margin-top:6px;font-size:24px;line-height:1.3;font-weight:800;color:${NAVY};">${escapeHtml(when.date)}</div><div style="margin-top:2px;font-size:17px;font-weight:700;color:${MINT};">${escapeHtml(when.time)}</div></div>`,
    paragraph(escapeHtml(status)),
    infoRows([
      [s.labels.code, reservation.code],
      [s.labels.holder, fullName(reservation)],
      [s.labels.venue, s.venue],
    ]),
    button(buttonLabel, ticketUrl),
    `<p style="margin:14px 0;font-size:15px;line-height:1.6;color:${INK};">${escapeHtml(copy.calendarIntro)} <a href="${icsUrl}" style="color:${NAVY};font-weight:700;">${escapeHtml(copy.calendarLink)}</a></p>`,
    paragraph(escapeHtml(copy.apology), MUTED),
    `<p style="margin:22px 0 0;padding-top:18px;border-top:1px solid #e3e8fb;font-size:14px;line-height:1.6;color:${MUTED};">${escapeHtml(copy.cancelIntro)} <a href="${cancelUrl}" style="color:${NAVY};font-weight:700;">${escapeHtml(copy.cancelLink)}</a></p>`,
  ].join("\n");

  return {
    to: reservation.email,
    subject: fill(copy.subject, values),
    html: layout(lang, copy.title, body),
    text: [
      fill(s.hello, { name: reservation.prenom }),
      fill(copy.intro, values),
      `${copy.newDate} : ${when.dateTime}`,
      status,
      `${s.labels.code} : ${reservation.code}`,
      `${buttonLabel} : ${ticketUrl}`,
      `${copy.calendarIntro} ${icsUrl}`,
      copy.apology,
      `${copy.cancelLink} : ${cancelUrl}`,
    ].join("\n\n"),
    attachments: [icsAttachment(lang)],
  };
}
