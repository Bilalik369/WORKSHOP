import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarClock, CalendarX, Lightbulb, Mic, Presentation, StickyNote } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FORMATS } from "@/lib/constants";
import { getSubmissionWindow } from "@/lib/data/public";
import { ProjectForm } from "@/components/forms/project-form";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";
import { PillBadge } from "@/components/shared/section";
import { StatusPanel } from "@/components/shared/status-panel";

type Props = { params: Promise<{ locale: string }> };

// La date limite est vérifiée à chaque visite.
export const dynamic = "force-dynamic";
const FORMAT_ICONS = { oral: Mic, poster: StickyNote, demo: Presentation } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "project" });
  return { title: t("metaTitle"), description: t("lead") };
}

export default async function SubmitProjectPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tOptions, tHero, format, submission] = await Promise.all([
    getTranslations("project"),
    getTranslations("options"),
    getTranslations("hero"),
    getFormatter(),
    getSubmissionWindow(),
  ]);
  const { deadline, isOpen } = submission;
  const deadlineLabel = format.dateTime(deadline, { dateStyle: "long" });

  if (!isOpen) {
    return (
      <PageShell>
        <StatusPanel
          icon={CalendarX}
          tone="amber"
          title={t("closedTitle")}
          actions={
            <Button asChild>
              <Link href="/reservation">{tHero("ctaReserve")}</Link>
            </Button>
          }
        >
          {t("closedLead", { date: deadlineLabel })}
        </StatusPanel>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <PillBadge icon={Lightbulb}>{t("eyebrow")}</PillBadge>
          <h1 className="mt-5 text-4xl leading-[1.12] font-extrabold tracking-tight sm:text-5xl rtl:leading-[1.35] rtl:tracking-normal">
            {t("title")}
          </h1>
          <span aria-hidden="true" className="divider-dot mt-5" />
          <p className="mt-5 text-lg leading-relaxed">{t("lead")}</p>

          <p className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-amber-400/50 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
            <CalendarClock aria-hidden="true" className="size-4 shrink-0" />
            {t("deadline", { date: deadlineLabel })}
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {FORMATS.map((value) => {
              const Icon = FORMAT_ICONS[value];
              return (
                <li key={value} className="flex items-center gap-3.5 font-semibold text-navy">
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-azure/45 bg-white/70"
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  {tOptions(`format.${value}`)}
                </li>
              );
            })}
          </ul>
        </div>

        <ProjectForm />
      </div>
    </PageShell>
  );
}
