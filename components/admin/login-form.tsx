"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import { login, type LoginError, type LoginState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/form";

export type LoginLabels = {
  email: string;
  password: string;
  showPassword: string;
  hidePassword: string;
  submit: string;
  submitting: string;
  errors: Record<LoginError, string>;
};

/** Connexion des organisateurs : e-mail + mot de passe (aucun e-mail envoyé). */
export function LoginForm({ labels }: { labels: LoginLabels }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [visible, setVisible] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.error ? <FormAlert>{labels.errors[state.error]}</FormAlert> : null}

      <Field id="email" label={labels.email}>
        {(a11y) => (
          <Input
            {...a11y}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            defaultValue={state.email ?? ""}
            required
            autoFocus
            dir="ltr"
          />
        )}
      </Field>

      <Field id="password" label={labels.password}>
        {(a11y) => (
          <div className="relative">
            <Input
              {...a11y}
              name="password"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              required
              dir="ltr"
              className="pe-13"
            />
            <button
              type="button"
              onClick={() => setVisible((value) => !value)}
              aria-label={visible ? labels.hidePassword : labels.showPassword}
              aria-pressed={visible}
              className="absolute end-1.5 top-1/2 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted hover:bg-navy/5 hover:text-navy"
            >
              {visible ? (
                <EyeOff aria-hidden="true" className="size-5" />
              ) : (
                <Eye aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>
        )}
      </Field>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            {labels.submitting}
          </>
        ) : (
          <>
            <LogIn aria-hidden="true" className="rtl:-scale-x-100" />
            {labels.submit}
          </>
        )}
      </Button>
    </form>
  );
}
