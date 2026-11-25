"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CircleCheckBig, LoaderCircle, TicketX } from "lucide-react";
import { cancelReservation } from "@/app/actions/reservation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form";
import { StatusPanel } from "@/components/shared/status-panel";

/**
 * Confirmation d'annulation. L'annulation n'est déclenchée que par un clic
 * explicite : ouvrir le lien reçu par e-mail ne suffit pas (les antivirus
 * et messageries ouvrent parfois les liens automatiquement).
 */
export function CancelForm({
  cancelToken,
  ticketToken,
  code,
  name,
}: {
  cancelToken: string;
  ticketToken: string;
  code: string;
  name: string;
}) {
  const t = useTranslations("cancel");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  if (done) {
    return (
      <StatusPanel
        icon={CircleCheckBig}
        tone="mint"
        title={t("doneTitle")}
        actions={
          <Button asChild>
            <Link href="/">{tCommon("backHome")}</Link>
          </Button>
        }
      >
        {t("doneLead")}
      </StatusPanel>
    );
  }

  const onConfirm = () => {
    setError(false);
    startTransition(async () => {
      try {
        const result = await cancelReservation(cancelToken);
        if (result.ok || result.error === "already") setDone(true);
        else setError(true);
      } catch {
        setError(true);
      }
    });
  };

  return (
    <StatusPanel
      icon={TicketX}
      tone="amber"
      title={t("title")}
      actions={
        <>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={pending}>
            {pending ? (
              <>
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                {t("pending")}
              </>
            ) : (
              t("confirm")
            )}
          </Button>
          <Button asChild variant="outline">
            <Link href={`/reservation/billet/${ticketToken}`}>{t("keep")}</Link>
          </Button>
        </>
      }
    >
      <p>{t("lead", { code, name })}</p>
      {error ? (
        <div className="mt-5 text-start">
          <FormAlert>{tErrors("generic")}</FormAlert>
        </div>
      ) : null}
    </StatusPanel>
  );
}
