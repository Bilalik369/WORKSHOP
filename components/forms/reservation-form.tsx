"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { createReservation } from "@/app/actions/reservation";
import { useRouter } from "@/i18n/navigation";
import { SOURCES, STATUTS } from "@/lib/constants";
import { reservationSchema, type ReservationInput } from "@/lib/validation/reservation";
import { Button } from "@/components/ui/button";
import {
  CheckboxField,
  Field,
  FormAlert,
  Honeypot,
  Input,
  Select,
} from "@/components/ui/form";
import { useSeats, type SeatSnapshot } from "@/components/landing/seats-counter";

type FormValues = Omit<ReservationInput, "statut"> & { statut: ReservationInput["statut"] | "" };

export function ReservationForm({ initialSeats }: { initialSeats: SeatSnapshot }) {
  const t = useTranslations("reservation");
  const tOptions = useTranslations("options");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const seats = useSeats(initialSeats);
  const isWaitlist = seats.remaining <= 0;
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(reservationSchema) as never,
    mode: "onTouched",
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      statut: "",
      etablissement: "",
      filiere: "",
      source: "",
      consent: false,
    },
  });

  const errorOf = (field: keyof FormValues) => {
    const message = errors[field]?.message;
    return message ? tErrors(message as "required") : undefined;
  };

  const onSubmit = handleSubmit(async (values, event) => {
    setFormError(null);
    try {
      const result = await createReservation(values, String(new FormData(event?.target as HTMLFormElement).get("website") ?? ""));
      if (result.ok) {
        router.push(`/reservation/billet/${result.ticketToken}`);
        return;
      }
      if (result.error === "emailTaken") {
        setError("email", { message: "emailTaken" });
        setFocus("email");
      }
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof FormValues, { message });
        }
      }
      setFormError(tErrors(result.error));
    } catch {
      setFormError(tErrors("generic"));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="glass relative rounded-3xl p-5 sm:p-8">
      <Honeypot />

      {isWaitlist ? (
        <div className="mb-6">
          <FormAlert tone="info">
            <strong className="block text-base">{t("waitlistTitle")}</strong>
            <span className="font-normal">{t("waitlistLead")}</span>
          </FormAlert>
        </div>
      ) : null}

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-5 text-lg font-bold text-navy sm:col-span-2">
          {t("sectionIdentity")}
        </legend>
        <Field id="prenom" label={t("fields.prenom")} error={errorOf("prenom")}>
          {(a11y) => <Input {...a11y} autoComplete="given-name" {...register("prenom")} />}
        </Field>
        <Field id="nom" label={t("fields.nom")} error={errorOf("nom")}>
          {(a11y) => <Input {...a11y} autoComplete="family-name" {...register("nom")} />}
        </Field>
        <Field
          id="email"
          label={t("fields.email")}
          hint={t("fields.emailHint")}
          error={errorOf("email")}
        >
          {(a11y) => (
            <Input
              {...a11y}
              type="email"
              inputMode="email"
              autoComplete="email"
              dir="ltr"
              {...register("email")}
            />
          )}
        </Field>
        <Field
          id="telephone"
          label={t("fields.telephone")}
          hint={t("fields.telephoneHint")}
          error={errorOf("telephone")}
        >
          {(a11y) => (
            <Input
              {...a11y}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="06 12 34 56 78"
              dir="ltr"
              {...register("telephone")}
            />
          )}
        </Field>
      </fieldset>

      <fieldset className="mt-9 grid gap-5 sm:grid-cols-2">
        <legend className="mb-5 text-lg font-bold text-navy sm:col-span-2">
          {t("sectionProfile")}
        </legend>
        <Field id="statut" label={t("fields.statut")} error={errorOf("statut")}>
          {(a11y) => (
            <Select {...a11y} {...register("statut")}>
              <option value="" disabled>
                {tOptions("placeholder")}
              </option>
              {STATUTS.map((statut) => (
                <option key={statut} value={statut}>
                  {tOptions(`statut.${statut}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="etablissement" label={t("fields.etablissement")} error={errorOf("etablissement")}>
          {(a11y) => (
            <Input
              {...a11y}
              autoComplete="organization"
              placeholder={t("fields.etablissementPlaceholder")}
              {...register("etablissement")}
            />
          )}
        </Field>
        <Field
          id="filiere"
          label={t("fields.filiere")}
          optionalLabel={tCommon("optional")}
          error={errorOf("filiere")}
        >
          {(a11y) => (
            <Input {...a11y} placeholder={t("fields.filierePlaceholder")} {...register("filiere")} />
          )}
        </Field>
        <Field
          id="source"
          label={t("fields.source")}
          optionalLabel={tCommon("optional")}
          error={errorOf("source")}
        >
          {(a11y) => (
            <Select {...a11y} {...register("source")}>
              <option value="">{tOptions("placeholder")}</option>
              {SOURCES.map((source) => (
                <option key={source} value={source}>
                  {tOptions(`source.${source}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </fieldset>

      <div className="mt-8 border-t border-navy/10 pt-6">
        <CheckboxField id="consent" error={errorOf("consent")} {...register("consent")}>
          {t("fields.consent")}
        </CheckboxField>
      </div>

      {formError ? (
        <div className="mt-6">
          <FormAlert>{formError}</FormAlert>
        </div>
      ) : null}

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" size="lg" disabled={isSubmitting} className="group">
          {isSubmitting ? (
            <>
              <LoaderCircle aria-hidden="true" className="animate-spin" />
              {t("submitting")}
            </>
          ) : (
            <>
              {isWaitlist ? t("submitWaitlist") : t("submit")}
              <ArrowRight
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              />
            </>
          )}
        </Button>
        <p className="flex items-start gap-2 text-sm text-muted sm:max-w-xs">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-mint-dark" />
          {t("privacyNote")}
        </p>
      </div>
    </form>
  );
}
