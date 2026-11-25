"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, Lightbulb, LogOut, Megaphone, ScanLine, Ticket } from "lucide-react";
import { signOut } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/reservations", label: "Réservations", icon: Ticket },
  { href: "/admin/projets", label: "Projets", icon: Lightbulb },
  { href: "/admin/statistiques", label: "Statistiques", icon: ChartColumn },
  { href: "/admin/check-in", label: "Check-in", icon: ScanLine },
  { href: "/admin/annonce", label: "Annonce", icon: Megaphone },
] as const;

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 pt-3 sm:px-6">
        <p className="min-w-0 truncate text-base font-extrabold text-navy sm:text-lg">
          Workshop IA & Éducation
          <span className="ms-2 hidden text-sm font-medium text-muted sm:inline">Administration</span>
        </p>
        <form action={signOut} className="flex shrink-0 items-center gap-3">
          <span className="hidden text-sm text-muted md:inline" dir="ltr">
            {email}
          </span>
          <button
            type="submit"
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-navy/15 bg-white px-3.5 text-sm font-semibold text-navy hover:border-navy/40"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Se déconnecter
          </button>
        </form>
      </div>
      <nav
        aria-label="Sections de l’administration"
        className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden mx-auto w-full max-w-7xl overflow-x-auto px-2 sm:px-4"
      >
        <ul className="flex min-w-max gap-1 pt-2">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  // Précharge l'onglet (données comprises) : le changement est immédiat.
                  prefetch
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 border-b-[3px] px-3.5 py-2.5 text-[0.95rem] font-semibold transition-colors",
                    active
                      ? "border-royal text-navy"
                      : "border-transparent text-muted hover:text-navy",
                  )}
                >
                  <tab.icon aria-hidden="true" className="size-[1.1rem]" />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
