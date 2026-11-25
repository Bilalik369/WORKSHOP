import { getLocale, getTranslations } from "next-intl/server";
import { PROGRAMME_END, programme } from "@/data/programme";
import { getSpeaker } from "@/data/speakers";
import { contentLang } from "@/i18n/routing";
import { Reveal } from "@/components/shared/motion";
import { Section, SectionHeading } from "@/components/shared/section";
import { ProgrammeTimeline, type TimelineItem } from "./programme-timeline";

export async function Programme() {
  const t = await getTranslations("programme");
  const lang = contentLang(await getLocale());

  const items: TimelineItem[] = programme.map((session, index) => ({
    time: session.time,
    end: programme[index + 1]?.time ?? PROGRAMME_END,
    period: session.period,
    type: session.type,
    title: session.title[lang],
    speaker: getSpeaker(session.speaker)?.name,
    note: session.note?.[lang],
    tbc: session.tbc,
  }));

  return (
    <Section id="programme" labelledBy="programme-title">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            id="programme-title"
            eyebrow={t("eyebrow")}
            title={t("title")}
            lead={t("lead")}
          />
        </div>
        <Reveal delay={0.1}>
          <ProgrammeTimeline items={items} />
        </Reveal>
      </div>
    </Section>
  );
}
