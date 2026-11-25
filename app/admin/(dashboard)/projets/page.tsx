import type { Metadata } from "next";
import { getAllProjects } from "@/lib/admin/data";
import { ProjectsBoard } from "@/components/admin/projects-board";
import { FormAlert } from "@/components/ui/form";

export const metadata: Metadata = { title: "Projets" };

export default async function AdminProjectsPage() {
  const { rows, error } = await getAllProjects();

  return (
    <>
      <h1 className="text-3xl font-extrabold">Projets</h1>
      <p className="mt-1 mb-6 text-muted">
        Étudiez les propositions, puis acceptez ou refusez. Seuls les projets acceptés
        apparaissent sur le site ; le porteur est prévenu par e-mail à chaque décision.
      </p>
      {error ? <FormAlert>{error}</FormAlert> : <ProjectsBoard projects={rows} />}
    </>
  );
}
