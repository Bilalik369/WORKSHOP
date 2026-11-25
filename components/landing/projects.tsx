import { getFormatter, getTranslations } from "next-intl/server";
import { CalendarClock, Lightbulb, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PublicProject } from "@/lib/data/public";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/motion";
import { Section, SectionHeading } from "@/components/shared/section";

export async function Projects({
  projects,
  deadline,
  isOpen,
}: {
  projects: PublicProject[];
  deadline: Date;
  isOpen: boolean;
}) {
  const t = await getTranslations("projects");
  const tOptions = await getTranslations("options");
  const format = await getFormatter();
  const deadlineLabel = format.dateTime(deadline, { dateStyle: "long" });

  return (
    <Section id="projets" labelledBy="projects-title">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          id="projects-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
        />
        <Reveal delay={0.1} className="flex flex-col items-start gap-3 lg:items-end">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-muted">
            <CalendarClock aria-hidden="true" className="size-4 text-royal" />
            {isOpen ? t("deadline", { date: deadlineLabel }) : t("closed")}
          </p>
          {isOpen && projects.length > 0 ? (
            <Button asChild variant="outline">
              <Link href="/projets/soumettre">
                <Lightbulb aria-hidden="true" />
                {t("cta")}
              </Link>
            </Button>
          ) : null}
        </Reveal>
      </div>

      {projects.length === 0 ? (
        <Reveal delay={0.1}>
          <div className="glass relative mt-10 overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-16">
            <span
              aria-hidden="true"
              className="mx-auto grid size-16 place-items-center rounded-full border-[1.5px] border-mint/50 bg-white text-mint-dark"
            >
              <Lightbulb className="size-7" strokeWidth={1.6} />
            </span>
            <h3 className="mx-auto mt-6 max-w-xl text-2xl font-bold">{t("emptyTitle")}</h3>
            <p className="mx-auto mt-3 max-w-xl leading-relaxed">{t("emptyText")}</p>
            {isOpen ? (
              <Button asChild size="lg" className="mt-7">
                <Link href="/projets/soumettre">{t("cta")}</Link>
              </Button>
            ) : null}
          </div>
        </Reveal>
      ) : (
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <li key={project.id}>
              <Reveal delay={(index % 3) * 0.08} className="h-full">
                <article className="glass flex h-full flex-col rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
                  <p className="flex flex-wrap gap-2 text-xs font-semibold rtl:text-sm">
                    <span className="rounded-full bg-mint/12 px-3 py-1 text-mint-dark">
                      {tOptions(`categorie.${project.categorie}`)}
                    </span>
                    <span className="rounded-full bg-azure/12 px-3 py-1 text-navy">
                      {tOptions(`avancement.${project.avancement}`)}
                    </span>
                  </p>
                  <h3 className="mt-4 text-xl leading-snug font-bold" dir="auto">
                    {project.titre}
                  </h3>
                  <p className="mt-2 line-clamp-5 flex-1 text-[0.95rem] leading-relaxed" dir="auto">
                    {project.solution}
                  </p>
                  <div className="mt-5 border-t border-navy/10 pt-4 text-sm">
                    <p className="font-semibold text-navy" dir="auto">
                      {t("by", { name: project.porteur_nom })}
                    </p>
                    {project.members.length > 0 ? (
                      <p className="mt-1 flex items-start gap-2 text-muted">
                        <Users aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        <span>
                          <span className="sr-only">{t("team")} : </span>
                          <span dir="auto">{project.members.join(" · ")}</span>
                        </span>
                      </p>
                    ) : null}
                    <p className="mt-1 text-muted" dir="auto">
                      {project.etablissement}
                    </p>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
