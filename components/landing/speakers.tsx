import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { getInitials, speakers } from "@/data/speakers";
import { contentLang } from "@/i18n/routing";
import { Reveal } from "@/components/shared/motion";
import { Section, SectionHeading } from "@/components/shared/section";

const AVATAR_TONES = [
  "from-azure to-royal",
  "from-mint to-azure",
  "from-lavender to-azure",
  "from-royal to-lavender",
  "from-mint-soft to-royal",
  "from-azure to-lavender",
];

export async function Speakers() {
  const t = await getTranslations("speakers");
  const lang = contentLang(await getLocale());
  const featured = speakers.filter((speaker) => speaker.featured !== false);

  return (
    <Section id="intervenants" labelledBy="speakers-title">
      <SectionHeading
        id="speakers-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        lead={t("lead")}
        align="center"
      />

      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((speaker, index) => (
          <li key={speaker.id}>
            <Reveal delay={(index % 3) * 0.08} className="h-full">
              <article className="glass group flex h-full items-center gap-5 rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift sm:p-6">
                <div className="relative shrink-0">
                  <span
                    aria-hidden="true"
                    className="absolute -inset-1 rounded-full border border-dashed border-azure/50 transition-transform duration-700 group-hover:rotate-45"
                  />
                  {speaker.photo ? (
                    <Image
                      src={speaker.photo}
                      alt=""
                      width={80}
                      height={80}
                      className="relative size-20 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`relative grid size-20 place-items-center rounded-full bg-linear-to-br text-2xl font-bold text-white ${AVATAR_TONES[index % AVATAR_TONES.length]}`}
                    >
                      {getInitials(speaker.name)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg leading-tight font-bold" dir="auto">
                    {speaker.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-muted">{speaker.role[lang]}</p>
                  {speaker.topic ? (
                    <p className="mt-2.5 inline-block rounded-full bg-mint/12 px-3 py-1 text-xs font-semibold text-mint-dark rtl:text-sm">
                      {speaker.topic[lang]}
                    </p>
                  ) : null}
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
