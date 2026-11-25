"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, FileText, LoaderCircle, X } from "lucide-react";
import { decideProject } from "@/app/admin/actions";
import {
  PROJECT_STATUS_LABELS,
  avancementLabel,
  categorieLabel,
  formatDateTime,
  formatLabel,
} from "@/lib/admin/labels";
import type { Project, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/validation/shared";
import { Button } from "@/components/ui/button";
import { FormAlert, Label, Textarea } from "@/components/ui/form";

const FILTERS: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "accepted", label: "Acceptés" },
  { value: "refused", label: "Refusés" },
  { value: "all", label: "Tous" },
];

const STATUS_STYLES: Record<ProjectStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  accepted: "bg-mint/15 text-mint-dark",
  refused: "bg-rose-100 text-rose-800",
};

function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const [comment, setComment] = useState(project.admin_comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const members = [...(project.team_members ?? [])].sort((a, b) => a.position - b.position);
  const commentId = `comment-${project.id}`;

  const decide = (decision: "accepted" | "refused") => {
    const verb = decision === "accepted" ? "Accepter" : "Refuser";
    if (
      !window.confirm(
        `${verb} le projet « ${project.titre} » ?\n\nLe porteur sera prévenu par e-mail${comment.trim() ? ", avec votre commentaire" : ""}.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await decideProject(project.id, decision, comment);
        if (!result.ok) setError(result.error);
        router.refresh();
      } catch {
        setError("Action impossible. Rechargez la page et réessayez.");
      }
    });
  };

  return (
    <li className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className={cn("rounded-full px-3 py-1", STATUS_STYLES[project.status])}>
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
            <span className="rounded-full bg-azure/12 px-3 py-1 text-navy">
              {categorieLabel(project.categorie)}
            </span>
            <span className="rounded-full bg-navy/5 px-3 py-1 text-ink">
              {avancementLabel(project.avancement)}
            </span>
            <span className="rounded-full bg-navy/5 px-3 py-1 text-ink">
              {formatLabel(project.format)}
            </span>
          </p>
          <h2 className="mt-3 text-xl leading-snug font-bold" dir="auto">
            {project.titre}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Déposé le {formatDateTime(project.created_at)}
            {project.reviewed_at
              ? ` · Décision le ${formatDateTime(project.reviewed_at)}${project.reviewed_by ? ` par ${project.reviewed_by}` : ""}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.pdf_path ? (
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/projets/${project.id}/pdf`} target="_blank" rel="noopener noreferrer">
                <FileText aria-hidden="true" />
                PDF
              </a>
            </Button>
          ) : null}
          {project.lien ? (
            <Button asChild variant="outline" size="sm">
              <a href={project.lien} target="_blank" rel="noopener noreferrer nofollow">
                <ExternalLink aria-hidden="true" />
                Démo
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <dl className="mt-5 grid gap-x-8 gap-y-4 text-[0.95rem] md:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Porteur</dt>
          <dd className="mt-1">
            <span className="font-bold text-navy">{project.porteur_nom}</span> ·{" "}
            {project.etablissement}
            <br />
            <a href={`mailto:${project.porteur_email}`} className="text-navy hover:underline">
              {project.porteur_email}
            </a>{" "}
            ·{" "}
            <a href={`tel:${project.porteur_telephone}`} className="hover:underline">
              {formatPhone(project.porteur_telephone)}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
            Équipe ({members.length})
          </dt>
          <dd className="mt-1">
            {members.length > 0 ? members.map((member) => member.nom).join(" · ") : "Aucun autre membre"}
          </dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Technologies</dt>
          <dd className="mt-1" dir="auto">
            {project.technologies}
          </dd>
        </div>
      </dl>

      <details className="group mt-4 rounded-2xl border border-navy/10 bg-white/60 open:pb-4">
        <summary className="cursor-pointer rounded-2xl px-4 py-3 font-semibold text-navy">
          Problématique et solution
        </summary>
        <div className="grid gap-4 px-4 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">Problématique</h3>
            <p className="mt-1 leading-relaxed whitespace-pre-line" dir="auto">
              {project.problematique}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">Solution proposée</h3>
            <p className="mt-1 leading-relaxed whitespace-pre-line" dir="auto">
              {project.solution}
            </p>
          </div>
        </div>
      </details>

      <div className="mt-5 border-t border-navy/10 pt-5">
        <Label htmlFor={commentId} optionalLabel="facultatif, envoyé au porteur">
          Commentaire du comité
        </Label>
        <Textarea
          id={commentId}
          rows={2}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={2000}
          className="min-h-20"
        />
        {error ? (
          <div className="mt-3">
            <FormAlert>{error}</FormAlert>
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2.5">
          <Button
            type="button"
            variant="mint"
            disabled={pending || project.status === "accepted"}
            onClick={() => decide("accepted")}
          >
            {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Check aria-hidden="true" />}
            {project.status === "accepted" ? "Accepté" : "Accepter"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || project.status === "refused"}
            onClick={() => decide("refused")}
            className="hover:border-rose-400 hover:text-rose-700"
          >
            <X aria-hidden="true" />
            {project.status === "refused" ? "Refusé" : "Refuser"}
          </Button>
        </div>
      </div>
    </li>
  );
}

export function ProjectsBoard({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<ProjectStatus | "all">("pending");

  const counts = useMemo(
    () => ({
      all: projects.length,
      pending: projects.filter((p) => p.status === "pending").length,
      accepted: projects.filter((p) => p.status === "accepted").length,
      refused: projects.filter((p) => p.status === "refused").length,
    }),
    [projects],
  );
  const visible = projects.filter((p) => filter === "all" || p.status === filter);

  return (
    <div>
      <div role="group" aria-label="Filtrer les projets" className="glass inline-flex max-w-full flex-wrap gap-1 rounded-3xl p-1.5">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
              filter === item.value
                ? "bg-linear-to-r from-navy to-royal text-white"
                : "text-navy hover:bg-navy/5",
            )}
          >
            {item.label} <span className="tabular-nums opacity-80">({counts[item.value]})</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="glass mt-5 rounded-3xl px-6 py-12 text-center text-muted">
          Aucun projet dans cette catégorie.
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-5">
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </ul>
      )}
    </div>
  );
}
