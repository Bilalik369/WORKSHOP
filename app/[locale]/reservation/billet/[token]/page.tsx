import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Ban, CircleCheckBig, Hourglass, SearchX } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getReservationByTicketToken, getWaitlistPosition } from "@/lib/data/reservations";
import { qrDataUrl } from "@/lib/qr";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";
import { PillBadge } from "@/components/shared/section";
import { StatusPanel } from "@/components/shared/status-panel";
import { TicketCard } from "@/components/ticket/ticket-card";

type Props = { params: Promise<{ locale: string; token: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ticket" });
  // Page personnelle : jamais indexée.
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

export default async function TicketPage({ params }: Props) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("ticket");
  const tCommon = await getTranslations("common");
  const reservation = await getReservationByTicketToken(token);

  if (!reservation) {
    return (
      <PageShell>
        <StatusPanel
          icon={SearchX}
          tone="rose"
          title={t("notFoundTitle")}
          actions={
            <Button asChild>
              <Link href="/reservation">{t("newReservation")}</Link>
            </Button>
          }
        >
          {t("notFoundLead")}
        </StatusPanel>
      </PageShell>
    );
  }

  if (reservation.status === "cancelled") {
    return (
      <PageShell>
        <StatusPanel
          icon={Ban}
          tone="amber"
          title={t("cancelledTitle")}
          actions={
            <Button asChild>
              <Link href="/reservation">{t("newReservation")}</Link>
            </Button>
          }
        >
          {t("cancelledLead")}
        </StatusPanel>
      </PageShell>
    );
  }

  const cancelHref = `/reservation/annuler/${reservation.cancel_token}`;

  if (reservation.status === "waitlist") {
    const position = await getWaitlistPosition(reservation);
    return (
      <PageShell>
        <StatusPanel
          icon={Hourglass}
          tone="amber"
          title={t("waitlistTitle", { prenom: reservation.prenom })}
          actions={
            <>
              <Button asChild>
                <Link href="/">{tCommon("backHome")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={cancelHref}>{t("cancelLink")}</Link>
              </Button>
            </>
          }
        >
          <p>{t("waitlistLead")}</p>
          {position ? (
            <p className="mt-4 text-xl font-extrabold text-mint-dark">
              {t("waitlistPosition", { position })}
            </p>
          ) : null}
          <p className="mt-4 text-base text-muted" dir="ltr">
            {reservation.code}
          </p>
        </StatusPanel>
      </PageShell>
    );
  }

  const qr = await qrDataUrl(reservation.code);

  return (
    <PageShell>
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <PillBadge icon={CircleCheckBig}>{t("confirmedEyebrow")}</PillBadge>
          <h1 className="mt-5 text-3xl leading-[1.15] font-extrabold tracking-tight sm:text-[2.6rem] rtl:leading-[1.4] rtl:tracking-normal">
            {t("confirmedTitle", { prenom: reservation.prenom })}
          </h1>
          <span aria-hidden="true" className="divider-dot mt-5" />
          <p className="mt-5 text-lg leading-relaxed">{t("confirmedLead")}</p>
          <p className="mt-4 leading-relaxed text-muted">{t("emailNotice")}</p>
          <p className="no-print mt-8">
            <Link
              href={cancelHref}
              className="text-sm font-semibold text-muted underline underline-offset-4 hover:text-navy"
            >
              {t("cancelLink")}
            </Link>
          </p>
        </div>

        <TicketCard
          name={`${reservation.prenom} ${reservation.nom}`}
          code={reservation.code}
          qrDataUrl={qr}
        />
      </div>
    </PageShell>
  );
}
