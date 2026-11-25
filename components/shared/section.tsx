import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./motion";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

/** Badge en pilule avec contour, comme « 🎓 | WORKSHOP » sur l'affiche. */
export function PillBadge({
  icon: Icon,
  children,
  className,
}: {
  icon?: IconType;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 rounded-full border-[1.5px] border-azure/50 bg-white/60 px-4 py-1.5 text-[0.78rem] font-bold tracking-[0.18em] text-navy uppercase backdrop-blur rtl:tracking-normal rtl:text-sm",
        className,
      )}
    >
      {Icon ? (
        <>
          <Icon aria-hidden="true" className="size-[1.15rem] text-royal" />
          <span aria-hidden="true" className="h-4 w-px bg-azure/50" />
        </>
      ) : null}
      {children}
    </span>
  );
}

/** Conteneur d'icône circulaire avec contour. */
export function IconCircle({
  icon: Icon,
  className,
  tone = "navy",
  shape = "circle",
}: {
  icon: IconType;
  className?: string;
  tone?: "navy" | "mint";
  shape?: "circle" | "square";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-12 shrink-0 place-items-center border-[1.5px] bg-white/70",
        shape === "circle" ? "rounded-full" : "rounded-2xl",
        tone === "navy" ? "border-azure/45 text-navy" : "border-mint/45 text-mint-dark",
        className,
      )}
    >
      <Icon className="size-[1.35rem]" strokeWidth={1.75} />
    </span>
  );
}

/** En-tête de section : sur-titre, titre, filet à point et chapeau. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "start",
  id,
  className,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  align?: "start" | "center";
  id?: string;
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "flex max-w-2xl flex-col items-start gap-4",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      <PillBadge>{eyebrow}</PillBadge>
      <h2
        id={id}
        className="text-3xl leading-[1.15] font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] rtl:leading-[1.4] rtl:tracking-normal"
      >
        {title}
      </h2>
      <span aria-hidden="true" className="divider-dot" />
      {lead ? <p className="text-lg leading-relaxed text-ink">{lead}</p> : null}
    </Reveal>
  );
}

export function Section({
  id,
  labelledBy,
  children,
  className,
}: {
  id?: string;
  labelledBy?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("relative py-16 sm:py-24", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">{children}</div>
    </section>
  );
}
