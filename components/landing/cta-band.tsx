import { getTranslations } from "next-intl/server";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ZelligePattern } from "@/components/shared/decor";
import { Reveal } from "@/components/shared/motion";
import { Section } from "@/components/shared/section";
import { SeatsCounter, type SeatSnapshot } from "./seats-counter";

export async function CtaBand({ seats }: { seats: SeatSnapshot }) {
  const t = await getTranslations("cta");
  const tHero = await getTranslations("hero");

  return (
    <Section labelledBy="cta-title" className="py-10 sm:py-14">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-navy-deep via-navy to-royal px-6 py-12 text-center shadow-lift sm:px-12 sm:py-16">
          <ZelligePattern className="-top-16 -end-20 text-white opacity-20" />
          <ZelligePattern className="-bottom-40 -start-40 rotate-180 text-white opacity-15" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 start-1/2 size-80 -translate-x-1/2 rounded-full bg-mint/30 blur-3xl"
          />
          <div className="relative flex flex-col items-center">
            <h2
              id="cta-title"
              className="max-w-2xl text-3xl leading-tight font-extrabold text-white sm:text-4xl rtl:leading-snug"
            >
              {t("title")}
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/85">{t("text")}</p>
            <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="lg" variant="mint" className="group">
                <Link href="/reservation">
                  {tHero("ctaReserve")}
                  <ArrowRight
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                  />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:border-white hover:bg-white/20"
              >
                <Link href="/projets/soumettre">
                  <Lightbulb aria-hidden="true" />
                  {tHero("ctaProject")}
                </Link>
              </Button>
            </div>
            <SeatsCounter initial={seats} className="mt-7" />
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
