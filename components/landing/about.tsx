import { getTranslations } from "next-intl/server";
import {
  BookOpenCheck,
  ClipboardCheck,
  Compass,
  GraduationCap,
  Handshake,
  Presentation,
  Rocket,
  Wrench,
} from "lucide-react";
import { AUDIENCES, OBJECTIVES } from "@/lib/constants";
import { Reveal } from "@/components/shared/motion";
import { IconCircle, Section, SectionHeading } from "@/components/shared/section";

const OBJECTIVE_ICONS = {
  comprendre: BookOpenCheck,
  decouvrir: Compass,
  pratiquer: Wrench,
  connecter: Handshake,
} as const;

const AUDIENCE_ICONS = {
  etudiants: GraduationCap,
  enseignants: Presentation,
  inspecteurs: ClipboardCheck,
  professionnels: Rocket,
} as const;

export async function About() {
  const t = await getTranslations("about");

  return (
    <Section id="a-propos" labelledBy="about-title">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div>
          <SectionHeading
            id="about-title"
            eyebrow={t("eyebrow")}
            title={t("title")}
            lead={t("lead")}
          />

          <Reveal delay={0.1}>
            <h3 className="mt-10 text-lg font-bold">{t("objectivesTitle")}</h3>
            <ul className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {OBJECTIVES.map((objective) => (
                <li key={objective} className="flex gap-3.5">
                  <IconCircle icon={OBJECTIVE_ICONS[objective]} tone="mint" className="size-11" />
                  <p className="text-[0.95rem] leading-relaxed">
                    <strong className="block font-bold text-navy">
                      {t(`objectives.${objective}.title`)}
                    </strong>
                    {t(`objectives.${objective}.text`)}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div>
          <Reveal>
            <h3 className="text-xl font-bold sm:text-2xl">{t("audienceTitle")}</h3>
          </Reveal>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {AUDIENCES.map((audience, index) => (
              <li key={audience}>
                <Reveal delay={index * 0.07} className="h-full">
                  <article className="glass h-full rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                    <IconCircle icon={AUDIENCE_ICONS[audience]} />
                    <h4 className="mt-4 text-lg font-bold">{t(`audiences.${audience}.title`)}</h4>
                    <p className="mt-1.5 text-[0.95rem] leading-relaxed">
                      {t(`audiences.${audience}.text`)}
                    </p>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
