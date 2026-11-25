import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Languages, ShieldCheck } from "lucide-react";
import ar from "@/messages/ar.json";
import fr from "@/messages/fr.json";
import { getAdminEmail, getAdminSetup } from "@/lib/admin/auth";
import { LoginForm } from "@/components/admin/login-form";
import { ZelligePattern } from "@/components/shared/decor";
import { Logo } from "@/components/shared/logo";
import { PillBadge } from "@/components/shared/section";
import { FormAlert } from "@/components/ui/form";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

/**
 * Connexion des organisateurs, en français ou en arabe (?lang=ar).
 * Il n'existe aucune page d'inscription : les comptes sont créés à la main
 * dans Supabase (Authentication → Users), voir le README.
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  if (await getAdminEmail()) redirect("/admin/reservations");

  const { lang } = await searchParams;
  const isArabic = lang === "ar";
  const t = (isArabic ? ar : fr).adminLogin;
  const logoAlt = (isArabic ? ar : fr).common.logoAlt;
  const setup = getAdminSetup();

  return (
    <main
      lang={isArabic ? "ar" : "fr"}
      dir={isArabic ? "rtl" : "ltr"}
      className={`relative grid min-h-dvh place-items-center overflow-hidden px-5 py-12 ${
        isArabic ? "font-[family-name:var(--font-arabic)]" : ""
      }`}
    >
      <ZelligePattern className="-top-10 -right-24 opacity-[0.16]" />
      <ZelligePattern className="-bottom-40 -left-40 rotate-180 opacity-[0.13]" />

      <div className="glass relative w-full max-w-md rounded-3xl p-7 sm:p-9">
        <div className="flex items-start justify-between gap-4">
          <Logo alt={logoAlt} className="h-16" priority />
          <Link
            href={isArabic ? "/admin/login" : "/admin/login?lang=ar"}
            hrefLang={isArabic ? "fr" : "ar"}
            lang={isArabic ? "fr" : "ar"}
            aria-label={t.switchLabel}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-navy/15 bg-white/60 px-3.5 text-sm font-semibold text-navy transition-colors hover:border-navy/40 hover:bg-white"
          >
            <Languages aria-hidden="true" className="size-4 text-royal" />
            {t.switchTo}
          </Link>
        </div>

        <div className="mt-6">
          <PillBadge icon={ShieldCheck}>{t.badge}</PillBadge>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold">{t.title}</h1>
        <p className="mt-2 mb-7 leading-relaxed">{t.lead}</p>

        {!setup.supabase || !setup.admins ? (
          <FormAlert>
            <strong className="block">{t.setupTitle}</strong>
            <ul className="mt-1.5 list-disc ps-5 font-normal">
              {!setup.supabase ? <li>{t.setupSecret}</li> : null}
              {!setup.admins ? <li>{t.setupAdmins}</li> : null}
            </ul>
            <span className="mt-1.5 block font-normal">{t.setupRestart}</span>
          </FormAlert>
        ) : (
          <LoginForm
            labels={{
              email: t.email,
              password: t.password,
              showPassword: t.showPassword,
              hidePassword: t.hidePassword,
              submit: t.submit,
              submitting: t.submitting,
              errors: t.errors,
            }}
          />
        )}

        <p className="mt-6 text-sm leading-relaxed text-muted">{t.noSignup}</p>
        <p className="mt-4 text-sm">
          <a
            href={isArabic ? "/ar" : "/"}
            className="font-semibold text-navy underline underline-offset-4"
          >
            {t.back}
          </a>
        </p>
      </div>
    </main>
  );
}
