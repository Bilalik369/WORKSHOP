import type { ReactNode } from "react";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { ZelligePattern } from "@/components/shared/decor";
import { cn } from "@/lib/utils";

/** Gabarit des pages secondaires : navigation, décor de l'affiche, pied de page. */
export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <>
      <Navbar />
      <main id="contenu" className="relative overflow-hidden">
        <ZelligePattern className="-top-10 -end-24 opacity-[0.16] rtl:-scale-x-100" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -start-40 size-[30rem] rounded-full bg-white/80 blur-3xl"
        />
        <div
          className={cn(
            "relative mx-auto w-full max-w-6xl px-5 pt-32 pb-16 sm:px-8 sm:pt-36 sm:pb-24",
            className,
          )}
        >
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
