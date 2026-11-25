import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const controlClass =
  "w-full rounded-2xl border-[1.5px] border-line bg-white/85 px-4 text-base text-navy-deep placeholder:text-muted/70 transition-colors duration-200 hover:border-azure/70 focus:border-royal focus:outline-none focus:ring-4 focus:ring-azure/20 aria-invalid:border-rose-600 aria-invalid:focus:ring-rose-500/20 disabled:opacity-60";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input" className={cn(controlClass, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(controlClass, "min-h-32 py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

/** Liste déroulante native : la plus fiable et accessible sur mobile. */
export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(controlClass, "h-12 cursor-pointer appearance-none pe-11", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute end-3.5 top-1/2 size-5 -translate-y-1/2 text-navy"
      />
    </div>
  );
}

export function Label({
  className,
  children,
  optionalLabel,
  ...props
}: React.ComponentProps<"label"> & { optionalLabel?: string }) {
  return (
    <label
      data-slot="label"
      className={cn("mb-1.5 block text-[0.95rem] font-semibold text-navy", className)}
      {...props}
    >
      {children}
      {optionalLabel ? (
        <span className="ms-1.5 text-sm font-normal text-muted">({optionalLabel})</span>
      ) : null}
    </label>
  );
}

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optionalLabel?: string;
  className?: string;
  /** Reçoit les attributs d'accessibilité à poser sur le champ. */
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
};

/** Champ complet : libellé, aide, contrôle et message d'erreur reliés (aria). */
export function Field({ id, label, hint, error, optionalLabel, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <Label htmlFor={id} optionalLabel={optionalLabel}>
        {label}
      </Label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Case à cocher avec son texte (consentement). */
export function CheckboxField({
  id,
  error,
  children,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & { id: string; error?: string }) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className="mt-1 size-5 shrink-0 cursor-pointer rounded-md border-[1.5px] border-line accent-navy"
          {...props}
        />
        <label htmlFor={id} className="cursor-pointer text-[0.95rem] leading-relaxed text-ink">
          {children}
        </label>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Bandeau d'erreur ou d'information en tête de formulaire. */
export function FormAlert({
  children,
  tone = "error",
}: {
  children: React.ReactNode;
  tone?: "error" | "info";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl border px-4 py-3 text-[0.95rem] font-medium",
        tone === "error"
          ? "border-rose-300 bg-rose-50 text-rose-800"
          : "border-azure/40 bg-azure/10 text-navy",
      )}
    >
      {children}
    </div>
  );
}

/** Champ piège anti-robots : invisible pour les humains et les lecteurs d'écran. */
export function Honeypot(props: React.ComponentProps<"input">) {
  return (
    <div aria-hidden="true" className="absolute -start-[9999px] top-auto size-px overflow-hidden">
      <label>
        Site web (ne pas remplir)
        <input type="text" name="website" tabIndex={-1} autoComplete="off" {...props} />
      </label>
    </div>
  );
}
