import { getLocale, getTranslations } from "next-intl/server";
import { Award, Backpack, CalendarDays, Check, Mail, MapPin } from "lucide-react";
import { getEventLabels } from "@/data/event";
import { site } from "@/data/site";
import { contentLang } from "@/i18n/routing";
import { BRING_ITEMS } from "@/lib/constants";
import { Reveal } from "@/components/shared/motion";
import { IconCircle, Section, SectionHeading } from "@/components/shared/section";
import { MapEmbed } from "./map-embed";

export async function Infos() {
  const t = await getTranslations("infos");
  const when = getEventLabels(contentLang(await getLocale()));

  return (
    <Section id="infos" labelledBy="infos-title">
      <SectionHeading id="infos-title" eyebrow={t("eyebrow")} title={t("title")} />

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <div className="grid gap-5 sm:grid-cols-2">
          <Reveal className="h-full">
            <article className="glass h-full rounded-3xl p-6">
              <IconCircle icon={CalendarDays} />
              <h3 className="mt-4 text-lg font-bold">{t("whenTitle")}</h3>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed">{t("whenText", { date: when.date, start: when.startTime, end: when.endTime })}</p>
            </article>
          </Reveal>
          <Reveal delay={0.06} className="h-full">
            <article className="glass h-full rounded-3xl p-6">
              <IconCircle icon={MapPin} />
              <h3 className="mt-4 text-lg font-bold">{t("whereTitle")}</h3>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed">{t("whereText")}</p>
            </article>
          </Reveal>
          <Reveal delay={0.1} className="h-full sm:col-span-2">
            <article className="glass h-full rounded-3xl p-6">
              <div className="flex items-center gap-4">
                <IconCircle icon={Backpack} tone="mint" />
                <h3 className="text-lg font-bold">{t("bringTitle")}</h3>
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {BRING_ITEMS.map((item) => (
                  <li key={item} className="flex gap-3 text-[0.95rem] leading-relaxed">
                    <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-mint-dark" />
                    {t(`bring.${item}`)}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
          <Reveal delay={0.14} className="h-full">
            <article className="glass h-full rounded-3xl p-6">
              <IconCircle icon={Award} />
              <h3 className="mt-4 text-lg font-bold">{t("certificateTitle")}</h3>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed">{t("certificateText")}</p>
            </article>
          </Reveal>
          <Reveal delay={0.18} className="h-full">
            <article className="glass h-full rounded-3xl p-6">
              <IconCircle icon={Mail} />
              <h3 className="mt-4 text-lg font-bold">{t("contactTitle")}</h3>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed">{t("contactText")}</p>
              <a
                href={`mailto:${site.contactEmail}`}
                className="mt-1 inline-block font-semibold break-all text-navy underline decoration-azure/60 underline-offset-4 hover:decoration-navy"
                dir="ltr"
              >
                {site.contactEmail}
              </a>
            </article>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="h-full">
          <MapEmbed />
        </Reveal>
      </div>
    </Section>
  );
}
