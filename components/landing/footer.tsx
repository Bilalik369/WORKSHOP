import { getTranslations } from "next-intl/server";
import { site } from "@/data/site";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";
import { SocialIcon } from "@/components/shared/social-icon";

const NAV = [
  { key: "programme", href: "/#programme" },
  { key: "intervenants", href: "/#intervenants" },
  { key: "projets", href: "/#projets" },
  { key: "infos", href: "/#infos" },
] as const;

export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tHero = await getTranslations("hero");
  const tCommon = await getTranslations("common");

  return (
    <footer className="no-print relative mt-10 border-t border-white/80 bg-white/55 backdrop-blur">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo alt={tCommon("logoAlt")} className="h-20" />
          <p className="mt-5 text-sm font-bold tracking-[0.16em] text-navy uppercase rtl:text-base rtl:tracking-normal">
            {tCommon("tagline")}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink">{t("organizedBy")}</p>
          <p className="mt-1 text-sm font-semibold text-navy">{t("host")}</p>
        </div>

        <nav aria-label={t("navTitle")}>
          <h2 className="text-sm font-bold tracking-wide text-navy uppercase rtl:tracking-normal">
            {t("navTitle")}
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-[0.95rem]">
            {NAV.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="text-ink hover:text-navy hover:underline">
                  {tNav(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("participateTitle")}>
          <h2 className="text-sm font-bold tracking-wide text-navy uppercase rtl:tracking-normal">
            {t("participateTitle")}
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-[0.95rem]">
            <li>
              <Link href="/reservation" className="text-ink hover:text-navy hover:underline">
                {tHero("ctaReserve")}
              </Link>
            </li>
            <li>
              <Link href="/projets/soumettre" className="text-ink hover:text-navy hover:underline">
                {tHero("ctaProject")}
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${site.contactEmail}`}
                className="break-all text-ink hover:text-navy hover:underline"
                dir="ltr"
              >
                {site.contactEmail}
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-bold tracking-wide text-navy uppercase rtl:tracking-normal">
            {t("followTitle")}
          </h2>
          <ul className="mt-4 flex gap-2.5">
            {site.socials.map((social) => (
              <li key={social.id}>
                <a
                  href={social.href}
                  aria-label={t(`socials.${social.id}`)}
                  className="grid size-11 place-items-center rounded-full border-[1.5px] border-azure/40 bg-white/70 text-navy transition-all duration-300 hover:-translate-y-0.5 hover:border-navy hover:bg-white"
                  {...(social.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <SocialIcon id={social.id} className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-navy/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-2 px-5 py-5 text-sm text-muted sm:flex-row sm:items-center sm:px-8">
          <p>{t("rights")}</p>
          <a href="/admin" className="hover:text-navy hover:underline">
            {t("admin")}
          </a>
        </div>
      </div>
    </footer>
  );
}
