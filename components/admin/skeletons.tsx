import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-navy/10", className)} />;
}

/** Squelette affiché immédiatement pendant le chargement d'un onglet. */
export function PageSkeleton({
  title,
  variant,
}: {
  title: string;
  variant: "table" | "cards" | "stats" | "scanner";
}) {
  return (
    <div role="status" aria-label={`Chargement : ${title}`} className="min-w-0">
      <h1 className={cn("text-3xl font-extrabold", variant === "scanner" && "text-center")}>
        {title}
      </h1>
      <Bone className={cn("mt-3 mb-6 h-4 w-64 max-w-full", variant === "scanner" && "mx-auto")} />

      {variant === "table" || variant === "stats" ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Bone key={item} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {variant === "table" ? (
        <>
          <Bone className="mt-6 h-12 w-72 max-w-full rounded-full" />
          <Bone className="mt-4 h-12 rounded-2xl" />
          <div className="mt-6 flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((item) => (
              <Bone key={item} className="h-24 rounded-2xl md:h-14" />
            ))}
          </div>
        </>
      ) : null}

      {variant === "cards" ? (
        <>
          <Bone className="h-12 w-80 max-w-full rounded-full" />
          <div className="mt-5 flex flex-col gap-5">
            {[0, 1].map((item) => (
              <Bone key={item} className="h-64 rounded-3xl" />
            ))}
          </div>
        </>
      ) : null}

      {variant === "stats" ? (
        <>
          <Bone className="mt-5 h-24 rounded-3xl" />
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <Bone key={item} className="h-56 rounded-3xl" />
            ))}
          </div>
        </>
      ) : null}

      {variant === "scanner" ? (
        <Bone className="mx-auto aspect-square w-full max-w-lg rounded-3xl" />
      ) : null}

      <span className="sr-only">Chargement…</span>
    </div>
  );
}
