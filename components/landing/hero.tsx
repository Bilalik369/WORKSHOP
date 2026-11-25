import { getTranslations } from "next-intl/server";
import { ArrowRight, CalendarDays, GraduationCap, Lightbulb, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ZelligePattern } from "@/components/shared/decor";
import { IconCircle, PillBadge } from "@/components/shared/section";
import { Countdown } from "./countdown";
import { HeroVisual } from "./hero-visual";
import { SeatsCounter, type SeatSnapshot } from "./seats-counter";

export async function Hero({ seats }: { seats: SeatSnapshot }) {
  const t = await getTranslations("hero");

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden pt-28 pb-12 sm:pt-32 sm:pb-16"
    >
      {/* Décor : zellige dans les angles et voile lumineux, comme sur l'affiche */}
      <ZelligePattern className="-top-10 -end-24 opacity-[0.16] rtl:-scale-x-100" />
      <ZelligePattern className="-bottom-40 -start-40 rotate-180 opacity-[0.13] rtl:-scale-x-100" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -start-40 size-[30rem] rounded-full bg-white/80 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute end-0 bottom-0 size-[26rem] rounded-full bg-lavender/20 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-x-8 gap-y-6 px-5 sm:px-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="flex flex-col items-start">
          <div className="animate-rise">
            <PillBadge icon={GraduationCap} className="px-5 py-2 text-[0.82rem]">
              {t("badge")}
            </PillBadge>
          </div>

          <h1
            id="hero-title"
            className="mt-6 animate-rise text-[2.7rem] leading-[1.04] tracking-[-0.02em] [animation-delay:60ms] sm:text-6xl lg:text-[4.4rem] rtl:leading-[1.3] rtl:tracking-normal"
          >
            <span className="block font-extrabold text-navy">
              {t("titleLine1")} <span className="sm:block rtl:sm:inline">{t("titleLine2")}</span>
            </span>
            <span className="mt-1 block text-[0.78em] font-light text-navy sm:mt-2">
              {t("titleLine3")}
            </span>
            <span className="text-gradient-mint block pb-[0.12em] font-medium">
              {t("titleLine4")} <span className="sm:block rtl:sm:inline">{t("titleLine5")}</span>
            </span>
          </h1>

          <span aria-hidden="true" className="divider-dot mt-6" />

          <ul className="mt-6 flex animate-rise flex-col gap-3.5 [animation-delay:120ms]">
            <li className="flex items-center gap-4">
              <IconCircle icon={CalendarDays} shape="square" />
              <p className="flex flex-col">
                <span className="text-xl leading-tight font-bold text-navy sm:text-2xl">
                  {t("date")}
                </span>
                <span className="text-[0.95rem] font-medium text-muted">{t("time")}</span>
              </p>
            </li>
            <li className="flex items-center gap-4">
              <IconCircle icon={MapPin} shape="square" />
              <p className="flex flex-col">
                <span className="text-lg leading-tight font-bold text-navy sm:text-xl">
                  {t("venue")}
                </span>
                <span className="text-[0.95rem] text-muted">
                  {t("venueFull")} · {t("venueCity")}
                </span>
              </p>
            </li>
          </ul>

          <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="group">
              <Link href="/reservation">
                {t("ctaReserve")}
                <ArrowRight
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/projets/soumettre">
                <Lightbulb aria-hidden="true" />
                {t("ctaProject")}
              </Link>
            </Button>
          </div>

          <div className="mt-5 flex flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:gap-4">
            <SeatsCounter initial={seats} />
            <p className="text-sm font-medium text-muted">{t("free")}</p>
          </div>

          <div className="mt-8 w-full">
            <Countdown />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[25rem] lg:max-w-none">
          <HeroVisual
            label={t("visualAlt")}
            className="h-auto w-full drop-shadow-[0_30px_50px_rgb(91_141_239/0.22)] rtl:-scale-x-100"
          />
        </div>
      </div>
    </section>
  );
}
