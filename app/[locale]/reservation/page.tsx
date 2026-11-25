import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { getEventLabels } from "@/data/event";
import { contentLang } from "@/i18n/routing";
import { getSeatStats } from "@/lib/data/public";
import { ReservationForm } from "@/components/forms/reservation-form";
import { SeatsCounter } from "@/components/landing/seats-counter";
import { PageShell } from "@/components/shared/page-shell";
import { IconCircle, PillBadge } from "@/components/shared/section";

type Props = { params: Promise<{ locale: string }> };

// Le nombre de places doit toujours être à jour sur cette page.
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reservation" });
  return { title: t("metaTitle"), description: t("lead") };
}

export default async function ReservationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tHero, stats] = await Promise.all([
    getTranslations("reservation"),
    getTranslations("hero"),
    getSeatStats(),
  ]);
  const seats = { capacity: stats.capacity, remaining: stats.remaining };
  const when = getEventLabels(contentLang(locale));

  return (
    <PageShell>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <PillBadge icon={Ticket}>{t("eyebrow")}</PillBadge>
          <h1 className="mt-5 text-4xl leading-[1.12] font-extrabold tracking-tight sm:text-5xl rtl:leading-[1.35] rtl:tracking-normal">
            {t("title")}
          </h1>
          <span aria-hidden="true" className="divider-dot mt-5" />
          <p className="mt-5 text-lg leading-relaxed">{t("lead")}</p>

          <SeatsCounter initial={seats} className="mt-6" />

          <ul className="mt-8 flex flex-col gap-4">
            <li className="flex items-center gap-4">
              <IconCircle icon={CalendarDays} shape="square" />
              <p className="flex flex-col">
                <span className="text-lg leading-tight font-bold text-navy">{when.date}</span>
                <span className="text-[0.95rem] text-muted">{when.time}</span>
              </p>
            </li>
            <li className="flex items-center gap-4">
              <IconCircle icon={MapPin} shape="square" />
              <p className="flex flex-col">
                <span className="text-lg leading-tight font-bold text-navy">{tHero("venue")}</span>
                <span className="text-[0.95rem] text-muted">
                  {tHero("venueFull")} · {tHero("venueCity")}
                </span>
              </p>
            </li>
          </ul>
        </div>

        <ReservationForm initialSeats={seats} />
      </div>
    </PageShell>
  );
}
