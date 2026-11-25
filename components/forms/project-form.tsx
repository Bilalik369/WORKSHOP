"use client";

import { useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  CircleCheckBig,
  FileText,
  LoaderCircle,
  Plus,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { createProjectUpload, submitProject } from "@/app/actions/project";
import { Link } from "@/i18n/navigation";
import {
  AVANCEMENTS,
  CATEGORIES,
  FORMATS,
  MAX_PDF_BYTES,
  MAX_TEAM_MEMBERS,
  PROJECT_BUCKET,
} from "@/lib/constants";
import { projectSchema, type ProjectInput } from "@/lib/validation/project";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  CheckboxField,
  Field,
  FormAlert,
  Honeypot,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/form";
import { StatusPanel } from "@/components/shared/status-panel";

type FormValues = Omit<ProjectInput, "categorie" | "avancement" | "format"> & {
  categorie: ProjectInput["categorie"] | "";
  avancement: ProjectInput["avancement"] | "";
  format: ProjectInput["format"] | "";
};

const DEFAULTS: FormValues = {
  porteur_nom: "",
  porteur_email: "",
  porteur_telephone: "",
  etablissement: "",
  members: [],
  titre: "",
  categorie: "",
  problematique: "",
  solution: "",
  technologies: "",
  avancement: "",
  lien: "",
  format: "",
  consent: false,
};

const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;

export function ProjectForm() {
  const t = useTranslations("project");
  const tOptions = useTranslations("options");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");
  const tHero = useTranslations("hero");
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "uploading" | "saving">("idle");
  const [success, setSuccess] = useState<{ name: string; titre: string } | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(projectSchema) as never,
    mode: "onTouched",
    defaultValues: DEFAULTS,
  });
  const members = useFieldArray({ control, name: "members" });

  const errorOf = (field: keyof FormValues) => {
    const message = errors[field]?.message;
    return typeof message === "string" ? tErrors(message as "required") : undefined;
  };

  const onFileChange = (selected: File | null) => {
    setFileError(null);
    if (!selected) return setFile(null);
    const isPdf =
      selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFile(null);
      return setFileError(tErrors("pdfType"));
    }
    if (selected.size > MAX_PDF_BYTES) {
      setFile(null);
      return setFileError(tErrors("pdfSize"));
    }
    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    setFileError(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const onSubmit = handleSubmit(async (values, event) => {
    const honeypot = String(new FormData(event?.target as HTMLFormElement).get("website") ?? "");
    setFormError(null);
    try {
      let pdfPath: string | null = null;

      if (file) {
        setStep("uploading");
        const ticket = await createProjectUpload({ size: file.size, type: "application/pdf" });
        if (!ticket.ok) {
          setFormError(tErrors(ticket.error));
          return;
        }
        const { error } = await createClient()
          .storage.from(PROJECT_BUCKET)
          .uploadToSignedUrl(ticket.path, ticket.token, file, {
            contentType: "application/pdf",
          });
        if (error) {
          setFormError(tErrors("upload"));
          return;
        }
        pdfPath = ticket.path;
      }

      setStep("saving");
      const result = await submitProject(values, pdfPath, honeypot);
      if (result.ok) {
        setSuccess({ name: values.porteur_nom, titre: values.titre });
        window.scrollTo({ top: 0 });
        return;
      }
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof FormValues, { message });
        }
      }
      setFormError(tErrors(result.error));
    } catch {
      setFormError(tErrors("generic"));
    } finally {
      setStep("idle");
    }
  });

  if (success) {
    return (
      <StatusPanel
        icon={CircleCheckBig}
        tone="mint"
        title={t("successTitle")}
        actions={
          <>
            <Button asChild>
              <Link href="/reservation">{tHero("ctaReserve")}</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset(DEFAULTS);
                clearFile();
                setSuccess(null);
              }}
            >
              {t("another")}
            </Button>
          </>
        }
      >
        <p>{t("successLead", success)}</p>
        <p className="mt-3 text-base text-muted">{t("successReserve")}</p>
      </StatusPanel>
    );
  }

  const busy = step !== "idle";
  const legend = "mb-5 text-lg font-bold text-navy sm:col-span-2";

  return (
    <form onSubmit={onSubmit} noValidate className="glass relative rounded-3xl p-5 sm:p-8">
      <Honeypot />

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className={legend}>{t("sections.porteur")}</legend>
        <Field id="porteur_nom" label={t("fields.porteur_nom")} error={errorOf("porteur_nom")}>
          {(a11y) => <Input {...a11y} autoComplete="name" {...register("porteur_nom")} />}
        </Field>
        <Field id="etablissement" label={t("fields.etablissement")} error={errorOf("etablissement")}>
          {(a11y) => (
            <Input {...a11y} autoComplete="organization" {...register("etablissement")} />
          )}
        </Field>
        <Field
          id="porteur_email"
          label={t("fields.porteur_email")}
          hint={t("fields.porteur_emailHint")}
          error={errorOf("porteur_email")}
        >
          {(a11y) => (
            <Input
              {...a11y}
              type="email"
              inputMode="email"
              autoComplete="email"
              dir="ltr"
              {...register("porteur_email")}
            />
          )}
        </Field>
        <Field
          id="porteur_telephone"
          label={t("fields.porteur_telephone")}
          error={errorOf("porteur_telephone")}
        >
          {(a11y) => (
            <Input
              {...a11y}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="06 12 34 56 78"
              dir="ltr"
              {...register("porteur_telephone")}
            />
          )}
        </Field>
      </fieldset>

      <fieldset className="mt-9">
        <legend className="text-lg font-bold text-navy">{t("sections.equipe")}</legend>
        <p className="mt-1 mb-4 text-sm text-muted">
          {t("fields.membersHint", { max: MAX_TEAM_MEMBERS })}
        </p>
        <ul className="flex flex-col gap-3">
          {members.fields.map((member, index) => {
            const id = `member-${index}`;
            const message = errors.members?.[index]?.nom?.message;
            return (
              <li key={member.id}>
                <Label htmlFor={id} className="sr-only">
                  {t("fields.memberLabel", { index: index + 1 })}
                </Label>
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-azure/12 text-sm font-bold text-navy"
                  >
                    {index + 1}
                  </span>
                  <Input
                    id={id}
                    placeholder={t("fields.memberPlaceholder")}
                    aria-invalid={Boolean(message)}
                    autoComplete="off"
                    {...register(`members.${index}.nom`)}
                  />
                  <button
                    type="button"
                    onClick={() => members.remove(index)}
                    aria-label={t("fields.removeMember", { index: index + 1 })}
                    className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-line bg-white/70 text-muted transition-colors hover:border-rose-300 hover:text-rose-700"
                  >
                    <Trash2 aria-hidden="true" className="size-[1.1rem]" />
                  </button>
                </div>
                {message ? (
                  <p role="alert" className="mt-1.5 ms-11 text-sm font-medium text-rose-700">
                    {tErrors(message as "tooLong")}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
        {members.fields.length < MAX_TEAM_MEMBERS ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => members.append({ nom: "" })}
          >
            <Plus aria-hidden="true" />
            {t("fields.addMember")}
          </Button>
        ) : null}
      </fieldset>

      <fieldset className="mt-9 grid gap-5 sm:grid-cols-2">
        <legend className={legend}>{t("sections.projet")}</legend>
        <Field
          id="titre"
          label={t("fields.titre")}
          error={errorOf("titre")}
          className="sm:col-span-2"
        >
          {(a11y) => <Input {...a11y} {...register("titre")} />}
        </Field>
        <Field id="categorie" label={t("fields.categorie")} error={errorOf("categorie")}>
          {(a11y) => (
            <Select {...a11y} {...register("categorie")}>
              <option value="" disabled>
                {tOptions("placeholder")}
              </option>
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {tOptions(`categorie.${value}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="avancement" label={t("fields.avancement")} error={errorOf("avancement")}>
          {(a11y) => (
            <Select {...a11y} {...register("avancement")}>
              <option value="" disabled>
                {tOptions("placeholder")}
              </option>
              {AVANCEMENTS.map((value) => (
                <option key={value} value={value}>
                  {tOptions(`avancement.${value}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field
          id="problematique"
          label={t("fields.problematique")}
          hint={t("fields.problematiqueHint")}
          error={errorOf("problematique")}
          className="sm:col-span-2"
        >
          {(a11y) => <Textarea {...a11y} rows={5} {...register("problematique")} />}
        </Field>
        <Field
          id="solution"
          label={t("fields.solution")}
          hint={t("fields.solutionHint")}
          error={errorOf("solution")}
          className="sm:col-span-2"
        >
          {(a11y) => <Textarea {...a11y} rows={5} {...register("solution")} />}
        </Field>
        <Field id="technologies" label={t("fields.technologies")} error={errorOf("technologies")}>
          {(a11y) => (
            <Input
              {...a11y}
              placeholder={t("fields.technologiesPlaceholder")}
              {...register("technologies")}
            />
          )}
        </Field>
        <Field
          id="lien"
          label={t("fields.lien")}
          optionalLabel={tCommon("optional")}
          error={errorOf("lien")}
        >
          {(a11y) => (
            <Input
              {...a11y}
              type="url"
              inputMode="url"
              dir="ltr"
              placeholder={t("fields.lienPlaceholder")}
              {...register("lien")}
            />
          )}
        </Field>
      </fieldset>

      <fieldset className="mt-9 grid gap-5 sm:grid-cols-2">
        <legend className={legend}>{t("sections.presentation")}</legend>
        <Field id="format" label={t("fields.format")} error={errorOf("format")}>
          {(a11y) => (
            <Select {...a11y} {...register("format")}>
              <option value="" disabled>
                {tOptions("placeholder")}
              </option>
              {FORMATS.map((value) => (
                <option key={value} value={value}>
                  {tOptions(`format.${value}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <div>
          <Label htmlFor="pdf" optionalLabel={tCommon("optional")}>
            {t("fields.pdf")}
          </Label>
          <input
            ref={fileInput}
            id="pdf"
            type="file"
            accept="application/pdf,.pdf"
            aria-describedby="pdf-hint"
            aria-invalid={Boolean(fileError)}
            className="sr-only"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-mint/50 bg-mint/8 px-4 py-2.5">
              <FileText aria-hidden="true" className="size-5 shrink-0 text-mint-dark" />
              <p className="min-w-0 flex-1 text-sm">
                <span className="block truncate font-semibold text-navy" dir="auto">
                  {file.name}
                </span>
                <span className="text-muted">{formatSize(file.size)}</span>
              </p>
              <button
                type="button"
                onClick={clearFile}
                aria-label={t("fields.pdfRemove")}
                className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-white hover:text-rose-700"
              >
                <Trash2 aria-hidden="true" className="size-[1.1rem]" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="pdf"
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-azure/60 bg-white/70 px-4 text-[0.95rem] font-semibold text-navy transition-colors hover:border-royal hover:bg-white"
            >
              <Upload aria-hidden="true" className="size-[1.1rem]" />
              {t("fields.pdfChoose")}
            </label>
          )}
          {fileError ? (
            <p role="alert" className="mt-1.5 text-sm font-medium text-rose-700">
              {fileError}
            </p>
          ) : null}
          <p id="pdf-hint" className="mt-1.5 text-sm text-muted">
            {t("fields.pdfHint")}
          </p>
        </div>
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

      <Button type="submit" size="lg" disabled={busy} className="mt-7">
        {busy ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            {step === "uploading" ? t("uploading") : t("submitting")}
          </>
        ) : (
          <>
            {t("submit")}
            <Send aria-hidden="true" className="rtl:-scale-x-100" />
          </>
        )}
      </Button>
    </form>
  );
}
