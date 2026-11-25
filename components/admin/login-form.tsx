"use client";

import { useActionState } from "react";
import { KeyRound, LoaderCircle, Mail } from "lucide-react";
import { requestLogin, verifyLoginCode, type LoginState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/form";

export function LoginForm({ linkError }: { linkError: boolean }) {
  const [request, requestAction, requesting] = useActionState<LoginState, FormData>(
    requestLogin,
    { step: "email" },
  );
  const [verify, verifyAction, verifying] = useActionState<LoginState, FormData>(
    verifyLoginCode,
    { step: "code" },
  );

  if (request.step === "code" && request.email) {
    return (
      <form action={verifyAction} className="flex flex-col gap-5">
        <FormAlert tone="info">
          Si <strong dir="ltr">{request.email}</strong> est une adresse autorisée, un e-mail vient
          d’être envoyé. Cliquez sur le lien qu’il contient <em>dans ce même navigateur</em>, ou
          saisissez ci-dessous le code reçu.
        </FormAlert>
        <input type="hidden" name="email" value={request.email} />
        <Field id="code" label="Code de connexion" error={verify.error}>
          {(a11y) => (
            <Input
              {...a11y}
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={10}
              required
              autoFocus
              dir="ltr"
              className="text-center text-2xl font-bold tracking-[0.3em]"
            />
          )}
        </Field>
        <Button type="submit" size="lg" disabled={verifying}>
          {verifying ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <KeyRound aria-hidden="true" />
          )}
          Se connecter
        </Button>
      </form>
    );
  }

  return (
    <form action={requestAction} className="flex flex-col gap-5">
      {linkError ? (
        <FormAlert>
          Ce lien de connexion est invalide, expiré, ou a été ouvert dans un autre navigateur.
          Demandez-en un nouveau.
        </FormAlert>
      ) : null}
      <Field
        id="email"
        label="Adresse e-mail"
        hint="Seules les adresses des organisateurs sont autorisées."
        error={request.error}
      >
        {(a11y) => (
          <Input
            {...a11y}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            autoFocus
            dir="ltr"
          />
        )}
      </Field>
      <Button type="submit" size="lg" disabled={requesting}>
        {requesting ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        ) : (
          <Mail aria-hidden="true" />
        )}
        Recevoir mon lien de connexion
      </Button>
    </form>
  );
}
