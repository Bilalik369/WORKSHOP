import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Ban, SearchX } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getReservationByCancelToken } from "@/lib/data/reservations";
import { CancelForm } from "@/components/forms/cancel-form";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";
import { StatusPanel } from "@/components/shared/status-panel";

type Props = { params: Promise<{ locale: string; token: string }> };

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cancel" });
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

export default async function CancelPage({ params }: Props) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("cancel");
  const tCommon = await getTranslations("common");
  const reservation = await getReservationByCancelToken(token);

  const home = (
    <Button asChild>
      <Link href="/">{tCommon("backHome")}</Link>
    </Button>
  );

  if (!reservation) {
    return (
      <PageShell>
        <StatusPanel icon={SearchX} tone="rose" title={t("notFoundTitle")} actions={home}>
          {t("notFoundLead")}
        </StatusPanel>
      </PageShell>
    );
  }

  if (reservation.status === "cancelled") {
    return (
      <PageShell>
        <StatusPanel icon={Ban} tone="amber" title={t("alreadyTitle")} actions={home}>
          {t("alreadyLead")}
        </StatusPanel>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <CancelForm
        cancelToken={reservation.cancel_token}
        ticketToken={reservation.ticket_token}
        code={reservation.code}
        name={`${reservation.prenom} ${reservation.nom}`}
      />
    </PageShell>
  );
}
