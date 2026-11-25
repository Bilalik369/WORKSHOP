import { getTranslations } from "next-intl/server";
import { BrainCircuit, GraduationCap, Users } from "lucide-react";
import { PILLARS } from "@/lib/constants";
import { Reveal } from "@/components/shared/motion";
import { Section } from "@/components/shared/section";

const ICONS = {
  education: GraduationCap,
  ia: BrainCircuit,
  impact: Users,
} as const;

export async function Pillars() {
  const t = await getTranslations("pillars");
  const tCommon = await getTranslations("common");

  return (
    <Section labelledBy="pillars-title" className="py-10 sm:py-14">
      <h2 id="pillars-title" className="sr-only">
        {t("eyebrow")}
      </h2>
      <ul className="grid gap-5 md:grid-cols-3">
        {PILLARS.map((pillar, index) => {
          const Icon = ICONS[pillar];
          return (
            <li key={pillar}>
              <Reveal delay={index * 0.08} className="h-full">
                <article className="glass group h-full rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift sm:p-7">
                  <div className="flex items-center gap-4">
                    <span
                      aria-hidden="true"
                      className="grid size-16 shrink-0 place-items-center rounded-full border-[1.5px] border-azure/40 bg-white text-navy transition-colors duration-300 group-hover:border-mint group-hover:text-mint-dark"
                    >
                      <Icon className="size-7" strokeWidth={1.6} />
                    </span>
                    <h3 className="text-[0.95rem] leading-snug font-bold tracking-[0.12em] text-navy uppercase rtl:text-lg rtl:tracking-normal">
                      {t(`items.${pillar}.title`)}
                    </h3>
                  </div>
                  <p className="mt-5 leading-relaxed text-ink">{t(`items.${pillar}.description`)}</p>
                </article>
              </Reveal>
            </li>
          );
        })}
      </ul>

      {/* Signature de l'affiche */}
      <Reveal delay={0.2}>
        <p className="mt-10 flex items-center justify-center gap-4 text-center text-xs font-semibold tracking-[0.2em] text-navy uppercase sm:gap-5 sm:text-sm rtl:text-base rtl:tracking-normal">
          <span aria-hidden="true" className="h-px w-8 bg-azure/60 sm:w-24" />
          {tCommon("tagline")}
          <span aria-hidden="true" className="h-px w-8 bg-azure/60 sm:w-24" />
        </p>
        <span
          aria-hidden="true"
          className="mx-auto mt-4 block size-2.5 rotate-45 rounded-[2px] bg-azure/70"
        />
      </Reveal>
    </Section>
  );
}
