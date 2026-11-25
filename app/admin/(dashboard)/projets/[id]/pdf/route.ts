import { NextResponse } from "next/server";
import { getAdminEmail } from "@/lib/admin/auth";
import { PROJECT_BUCKET } from "@/lib/constants";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

/** Ouvre le PDF d'un projet via un lien signé valable 5 minutes (admins seulement). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminEmail())) {
    return new Response("Non autorisé", { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("projects")
    .select("pdf_path")
    .eq("id", id)
    .maybeSingle();

  if (!project?.pdf_path) return new Response("Aucun fichier pour ce projet.", { status: 404 });

  const { data, error } = await supabase.storage
    .from(PROJECT_BUCKET)
    .createSignedUrl(project.pdf_path, 300);

  if (error || !data) return new Response("Fichier introuvable.", { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
