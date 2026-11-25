import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

/** Carte centrée pour les états simples : succès, erreur, lien invalide… */
export function StatusPanel({
  icon: Icon,
  tone = "navy",
  title,
  children,
  actions,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: "navy" | "mint" | "amber" | "rose";
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="glass mx-auto flex max-w-xl flex-col items-center rounded-3xl px-6 py-12 text-center sm:px-10">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-16 place-items-center rounded-full border-[1.5px] bg-white",
          tone === "navy" && "border-azure/50 text-navy",
          tone === "mint" && "border-mint/50 text-mint-dark",
          tone === "amber" && "border-amber-400/60 text-amber-700",
          tone === "rose" && "border-rose-300 text-rose-700",
        )}
      >
        <Icon className="size-7" strokeWidth={1.6} />
      </span>
      <h1 className="mt-6 text-2xl leading-snug font-extrabold sm:text-3xl">{title}</h1>
      {children ? <div className="mt-3 text-lg leading-relaxed">{children}</div> : null}
      {actions ? (
        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
