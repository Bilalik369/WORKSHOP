"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarPlus, Download, FileDown, LoaderCircle } from "lucide-react";
import { contentLang } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

type TicketProps = {
  name: string;
  code: string;
  qrDataUrl: string;
  /** Libellés de date fournis par le serveur (data/event.ts). */
  eventDate: string;
  eventTime: string;
};

const WIDTH = 1200;
const HEIGHT = 1600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

/** Découpe un texte en lignes qui tiennent dans la largeur donnée. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Billet d'entrée avec QR code, téléchargeable en PNG ou en PDF. */
export function TicketCard({ name, code, qrDataUrl, eventDate, eventTime }: TicketProps) {
  const t = useTranslations("ticket");
  const tHero = useTranslations("hero");
  const tCommon = useTranslations("common");
  const tMeta = useTranslations("meta");
  const isArabic = contentLang(useLocale()) === "ar";
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);

  /** Dessine le billet sur un canevas (même rendu pour le PNG et le PDF). */
  const renderCanvas = async (): Promise<HTMLCanvasElement> => {
    await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d")!;
    const font = getComputedStyle(document.body).fontFamily;
    ctx.direction = isArabic ? "rtl" : "ltr";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    // Fond dégradé de l'affiche
    const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    background.addColorStop(0, "#f5f7ff");
    background.addColorStop(0.5, "#eef1ff");
    background.addColorStop(1, "#f3eeff");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Carte blanche
    ctx.shadowColor = "rgba(10, 42, 140, 0.18)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = "#ffffff";
    roundedRect(ctx, 80, 80, WIDTH - 160, HEIGHT - 160, 56);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Bandeau bleu marine
    const band = ctx.createLinearGradient(80, 80, WIDTH - 80, 380);
    band.addColorStop(0, "#071d66");
    band.addColorStop(1, "#2447c4");
    ctx.save();
    roundedRect(ctx, 80, 80, WIDTH - 160, HEIGHT - 160, 56);
    ctx.clip();
    ctx.fillStyle = band;
    ctx.fillRect(80, 80, WIDTH - 160, 330);
    ctx.restore();

    ctx.fillStyle = "#3cc6b8";
    ctx.font = `700 30px ${font}`;
    ctx.fillText(t("cardTitle").toUpperCase(), WIDTH / 2, 170);

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 52px ${font}`;
    const titleLines = wrapText(
      ctx,
      `${tHero("titleLine1")} ${tHero("titleLine2")} ${tHero("titleLine3")} ${tHero("titleLine4")} ${tHero("titleLine5")}`,
      WIDTH - 300,
    );
    titleLines.slice(0, 2).forEach((line, index) => {
      ctx.fillText(line, WIDTH / 2, 250 + index * 68);
    });

    // QR code
    const qr = await loadImage(qrDataUrl);
    const qrSize = 520;
    const qrX = (WIDTH - qrSize) / 2;
    const qrY = 470;
    ctx.strokeStyle = "#d5dcf7";
    ctx.lineWidth = 3;
    roundedRect(ctx, qrX - 28, qrY - 28, qrSize + 56, qrSize + 56, 40);
    ctx.stroke();
    ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

    // Code et nom
    ctx.direction = "ltr";
    ctx.fillStyle = "#0a2a8c";
    ctx.font = `800 64px ${font}`;
    ctx.fillText(code, WIDTH / 2, 1120);
    ctx.direction = isArabic ? "rtl" : "ltr";

    ctx.fillStyle = "#55618a";
    ctx.font = `500 28px ${font}`;
    ctx.fillText(t("holder"), WIDTH / 2, 1195);
    ctx.fillStyle = "#0a2a8c";
    ctx.font = `700 46px ${font}`;
    ctx.fillText(name, WIDTH / 2, 1252, WIDTH - 260);

    // Filet
    ctx.strokeStyle = "#e3e8fb";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(150, 1300);
    ctx.lineTo(WIDTH - 150, 1300);
    ctx.stroke();
    ctx.setLineDash([]);

    // Date et lieu
    ctx.fillStyle = "#0a2a8c";
    ctx.font = `700 36px ${font}`;
    ctx.fillText(`${eventDate} · ${eventTime}`, WIDTH / 2, 1365, WIDTH - 260);
    ctx.fillStyle = "#2f3c6b";
    ctx.font = `500 30px ${font}`;
    ctx.fillText(`${tHero("venue")} · ${tHero("venueCity")}`, WIDTH / 2, 1415, WIDTH - 260);

    ctx.fillStyle = "#0b7f6c";
    ctx.font = `700 24px ${font}`;
    ctx.fillText(tCommon("tagline").toUpperCase(), WIDTH / 2, 1478);

    return canvas;
  };

  const download = async (kind: "png" | "pdf") => {
    setBusy(kind);
    try {
      const canvas = await renderCanvas();
      const fileName = `billet-${code}`;
      if (kind === "png") {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${fileName}.png`;
        link.click();
      } else {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imageHeight = (pageWidth * HEIGHT) / WIDTH;
        pdf.setProperties({ title: `${t("cardTitle")} ${code} — ${tMeta("shortTitle")}` });
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 0.92),
          "JPEG",
          0,
          (pageHeight - imageHeight) / 2,
          pageWidth,
          imageHeight,
        );
        pdf.save(`${fileName}.pdf`);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <article className="overflow-hidden rounded-[2rem] bg-white shadow-lift">
        <header className="bg-linear-to-br from-navy-deep via-navy to-royal px-6 py-7 text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-mint-soft uppercase rtl:text-sm rtl:tracking-normal">
            {t("cardTitle")}
          </p>
          <p className="mt-2 text-xl leading-snug font-extrabold text-white">
            {tHero("titleLine1")} {tHero("titleLine2")} {tHero("titleLine3")}{" "}
            {tHero("titleLine4")} {tHero("titleLine5")}
          </p>
        </header>

        <div className="px-6 pt-7 pb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- image générée (data URL) */}
          <img
            src={qrDataUrl}
            alt={t("qrAlt", { code })}
            width={240}
            height={240}
            className="mx-auto rounded-2xl border border-line p-2.5"
          />
          <p className="mt-4 text-xs font-semibold text-muted">{t("code")}</p>
          <p className="text-3xl font-extrabold tracking-[0.12em] text-navy" dir="ltr">
            {code}
          </p>
          <p className="mt-4 text-xs font-semibold text-muted">{t("holder")}</p>
          <p className="text-xl font-bold text-navy" dir="auto">
            {name}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 border-t border-dashed border-line px-6 py-5 text-start">
          <div>
            <dt className="text-xs font-semibold text-muted">{t("date")}</dt>
            <dd className="mt-0.5 text-[0.95rem] leading-snug font-bold text-navy">
              {eventDate}
              <span className="block font-medium text-ink">{eventTime}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted">{t("venue")}</dt>
            <dd className="mt-0.5 text-[0.95rem] leading-snug font-bold text-navy">
              {tHero("venue")}
              <span className="block font-medium text-ink">{tHero("venueCity")}</span>
            </dd>
          </div>
        </dl>
      </article>

      <div className="no-print mt-6 grid gap-3 sm:grid-cols-2">
        <Button type="button" onClick={() => download("png")} disabled={busy !== null}>
          {busy === "png" ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <Download aria-hidden="true" />
          )}
          {t("downloadPng")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => download("pdf")}
          disabled={busy !== null}
        >
          {busy === "pdf" ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <FileDown aria-hidden="true" />
          )}
          {t("downloadPdf")}
        </Button>
        <Button asChild variant="outline" className="sm:col-span-2">
          <a href={`/api/ics?lang=${isArabic ? "ar" : "fr"}`} download="workshop.ics">
            <CalendarPlus aria-hidden="true" />
            {t("addToCalendar")}
          </a>
        </Button>
      </div>
    </div>
  );
}
