import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getAdminEmail, getAdminSetup } from "@/lib/admin/auth";
import { LoginForm } from "@/components/admin/login-form";
import { ZelligePattern } from "@/components/shared/decor";
import { Logo } from "@/components/shared/logo";
import { PillBadge } from "@/components/shared/section";
import { FormAlert } from "@/components/ui/form";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  if (await getAdminEmail()) redirect("/admin/reservations");

  const { erreur } = await searchParams;
  const setup = getAdminSetup();

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-12">
      <ZelligePattern className="-top-10 -right-24 opacity-[0.16]" />
      <ZelligePattern className="-bottom-40 -left-40 rotate-180 opacity-[0.13]" />

      <div className="glass relative w-full max-w-md rounded-3xl p-7 sm:p-9">
        <Logo
          alt="Université Sultan Moulay Slimane — École Supérieure d’Éducation et de Formation"
          className="h-16"
          priority
        />
        <div className="mt-6">
          <PillBadge icon={ShieldCheck}>Espace organisateurs</PillBadge>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold">Connexion</h1>
        <p className="mt-2 mb-7 leading-relaxed">
          Recevez un lien de connexion par e-mail. Aucun mot de passe à retenir.
        </p>

        {!setup.supabase || !setup.admins ? (
          <FormAlert>
            <strong className="block">Configuration incomplète</strong>
            <ul className="mt-1.5 list-disc ps-5 font-normal">
              {!setup.supabase ? (
                <li>
                  Renseignez <code>SUPABASE_SECRET_KEY</code> dans <code>.env.local</code>.
                </li>
              ) : null}
              {!setup.admins ? (
                <li>
                  Ajoutez au moins une adresse dans <code>ADMIN_EMAILS</code>.
                </li>
              ) : null}
            </ul>
            <span className="mt-1.5 block font-normal">Redémarrez ensuite le serveur.</span>
          </FormAlert>
        ) : (
          <LoginForm linkError={erreur === "lien"} />
        )}

        <p className="mt-7 text-sm">
          <a href="/" className="font-semibold text-navy underline underline-offset-4">
            ← Retour au site
          </a>
        </p>
      </div>
    </main>
  );
}
