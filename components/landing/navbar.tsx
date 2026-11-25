"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Languages, Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { contentLang } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const ANCHORS = [
  { key: "programme", href: "/#programme" },
  { key: "intervenants", href: "/#intervenants" },
  { key: "projets", href: "/#projets" },
  { key: "infos", href: "/#infos" },
] as const;

function LanguageToggle({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const target = contentLang(locale) === "fr" ? "ar-MA" : "fr";

  return (
    <Link
      href={pathname}
      locale={target}
      hrefLang={contentLang(target)}
      lang={contentLang(target)}
      aria-label={t("switchLabel")}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-navy/15 bg-white/60 px-3.5 text-sm font-semibold text-navy transition-colors hover:border-navy/40 hover:bg-white",
        className,
      )}
    >
      <Languages aria-hidden="true" className="size-4 text-royal" />
      {t("switchTo")}
    </Link>
  );
}

export function Navbar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="no-print fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={cn(
          "mx-auto max-w-6xl rounded-[1.75rem] border transition-all duration-300",
          scrolled || open
            ? "border-white/90 bg-white/85 shadow-soft backdrop-blur-xl"
            : "border-transparent bg-transparent shadow-none",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-3 ps-4 pe-2.5 transition-[height] duration-300 sm:ps-5 sm:pe-3",
            scrolled || open ? "h-16" : "h-20",
          )}
        >
          <Link
            href="/"
            className="flex shrink-0 items-center rounded-xl"
            aria-label={tCommon("backHome")}
            onClick={() => setOpen(false)}
          >
            <Logo
              alt={tCommon("logoAlt")}
              priority
              className={cn(
                "transition-[height] duration-300",
                scrolled || open ? "h-12" : "h-16 sm:h-[4.5rem]",
              )}
            />
          </Link>

          <nav aria-label={t("label")} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {ANCHORS.map((anchor) => (
                <li key={anchor.key}>
                  <Link
                    href={anchor.href}
                    className="rounded-full px-4 py-2 text-[0.95rem] font-semibold text-navy/85 transition-colors hover:bg-navy/5 hover:text-navy"
                  >
                    {t(anchor.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageToggle className="hidden sm:inline-flex" />
            <Button asChild size="md" className="h-10 px-4 text-sm sm:px-5">
              <Link href="/reservation">{t("reserve")}</Link>
            </Button>
            <button
              type="button"
              className="grid size-10 cursor-pointer place-items-center rounded-full border border-navy/15 bg-white/60 text-navy lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t("closeMenu") : t("openMenu")}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
            </button>
          </div>
        </div>

        <div id="mobile-menu" hidden={!open} className="lg:hidden">
          <nav aria-label={t("label")} className="border-t border-navy/10 px-3 pt-2 pb-4">
            <ul className="flex flex-col">
              {ANCHORS.map((anchor) => (
                <li key={anchor.key}>
                  <Link
                    href={anchor.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-3 text-base font-semibold text-navy hover:bg-navy/5"
                  >
                    {t(anchor.key)}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2 px-3 sm:hidden">
              <LanguageToggle />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
