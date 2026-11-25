"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { CircleCheckBig, FlaskConical, LoaderCircle, Megaphone, TriangleAlert, X } from "lucide-react";
import { sendDateChangeNext, sendDateChangeTest } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form";

type Stats = {
  pending: number;
  pendingConfirmed: number;
  pendingWaitlist: number;
  notified: number;
};

type Progress = { sent: number; failed: number; remaining: number; error?: string };

/** Pause entre deux e-mails, pour respecter les limites d'envoi de Gmail. */
const PAUSE_MS = 1000;
/** Après autant d'échecs d'affilée, on s'arrête (identifiants ou quota Gmail en cause). */
const MAX_CONSECUTIVE_FAILURES = 3;
/** Garde-fou : nombre maximal d'e-mails par série. */
const MAX_EMAILS_PER_RUN = 1000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function EmailPreview({ html, subject }: { html: string; subject: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <p className="border-b border-line bg-ice px-4 py-2.5 text-sm break-words">
        <span className="font-semibold text-muted">Objet : </span>
        <span className="font-semibold text-navy">{subject}</span>
      </p>
      {/* Aperçu isolé : aucun script ni lien actif. */}
      <iframe
        title="Aperçu de l’e-mail d’annonce"
        srcDoc={html}
        sandbox=""
        className="h-[26rem] w-full border-0 sm:h-[32rem]"
      />
    </div>
  );
}

export function AnnouncementPanel({
  stats,
  emailConfigured,
  adminEmail,
  previewHtml,
  previewSubject,
}: {
  stats: Stats;
  emailConfigured: boolean;
  adminEmail: string;
  previewHtml: string;
  previewSubject: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  const sendTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await sendDateChangeTest();
      setTestResult(
        result.ok
          ? { ok: true, text: `E-mail de test envoyé à ${adminEmail}.` }
          : { ok: false, text: result.error },
      );
    } catch {
      setTestResult({ ok: false, text: "L’envoi du test a échoué." });
    } finally {
      setTesting(false);
    }
  };

  /**
   * Envoie les e-mails un par un, avec une pause entre chacun. Une personne
   * n'est marquée « prévenue » qu'après un envoi réussi ; les échecs sont mis
   * de côté pour cette série et pourront être relancés.
   */
  const sendAll = async () => {
    setSending(true);
    const total: Progress = { sent: 0, failed: 0, remaining: stats.pending };
    const failedIds: string[] = [];
    let consecutiveFailures = 0;
    setProgress(total);
    try {
      for (let index = 0; index < MAX_EMAILS_PER_RUN; index += 1) {
        const step = await sendDateChangeNext(failedIds);
        if (step.outcome === "done") {
          total.remaining = failedIds.length;
          setProgress({ ...total });
          break;
        }
        if (step.outcome === "sent") {
          total.sent += 1;
          consecutiveFailures = 0;
        } else {
          total.failed += 1;
          total.error = step.error;
          consecutiveFailures += 1;
          if (step.id) failedIds.push(step.id);
        }
        total.remaining = step.remaining + failedIds.length;
        setProgress({ ...total });
        // Sans identifiant, l'échec est général (configuration) : inutile d'insister.
        if (step.outcome === "failed" && !step.id) break;
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) break;
        if (step.remaining === 0) break;
        await wait(PAUSE_MS);
      }
    } catch {
      total.error =
        "Connexion interrompue. Relancez l’envoi : les personnes déjà prévenues seront ignorées.";
      setProgress({ ...total });
    } finally {
      setSending(false);
      setOpen(false);
      router.refresh();
    }
  };

  const canSend = emailConfigured && stats.pending > 0 && !sending;

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="min-w-0">
        <ul className="grid grid-cols-2 gap-3">
          <li className="glass min-w-0 rounded-2xl px-4 py-3.5">
            <p className="text-sm font-medium text-muted">À prévenir</p>
            <p className="mt-0.5 text-2xl font-extrabold text-navy tabular-nums">{stats.pending}</p>
            <p className="text-sm text-muted">
              {stats.pendingConfirmed} confirmée(s) · {stats.pendingWaitlist} en attente
            </p>
          </li>
          <li className="glass min-w-0 rounded-2xl px-4 py-3.5">
            <p className="text-sm font-medium text-muted">Déjà prévenues</p>
            <p className="mt-0.5 text-2xl font-extrabold text-mint-dark tabular-nums">
              {stats.notified}
            </p>
            <p className="text-sm text-muted">ne recevront rien de plus</p>
          </li>
        </ul>

        {!emailConfigured ? (
          <div className="mt-4">
            <FormAlert>
              Les e-mails ne sont pas configurés : renseignez <code>GMAIL_USER</code> et{" "}
              <code>GMAIL_APP_PASSWORD</code>, puis redéployez.
            </FormAlert>
          </div>
        ) : null}

        <section className="glass mt-4 rounded-3xl p-5">
          <h2 className="text-lg font-bold">1. Tester</h2>
          <p className="mt-1 text-[0.95rem] leading-relaxed">
            Envoie l’e-mail uniquement à <strong className="break-all">{adminEmail}</strong>, avec
            des données d’exemple. Personne d’autre ne le reçoit.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={sendTest}
            disabled={testing || !emailConfigured}
          >
            {testing ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <FlaskConical aria-hidden="true" />
            )}
            M’envoyer un test
          </Button>
          {testResult ? (
            <div className="mt-3">
              <FormAlert tone={testResult.ok ? "info" : "error"}>{testResult.text}</FormAlert>
            </div>
          ) : null}
        </section>

        <section className="glass mt-4 rounded-3xl p-5">
          <h2 className="text-lg font-bold">2. Envoyer à tous les inscrits</h2>
          <p className="mt-1 text-[0.95rem] leading-relaxed">
            Réservations confirmées et liste d’attente uniquement. Les réservations annulées et
            les personnes déjà prévenues sont ignorées. Les e-mails partent un par un (environ
            une seconde entre deux envois) : gardez cette page ouverte jusqu’à la fin.
          </p>

          <Dialog.Root open={open} onOpenChange={(next) => !sending && setOpen(next)}>
            <Dialog.Trigger asChild>
              <Button type="button" className="mt-4 h-auto min-h-11 py-2.5 whitespace-normal" disabled={!canSend}>
                <Megaphone aria-hidden="true" />
                Envoyer l’annonce du changement de date
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-deep/50" />
              <Dialog.Content className="fixed inset-x-3 top-1/2 z-50 mx-auto flex max-h-[92dvh] w-auto max-w-2xl -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-lift">
                <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
                  <div className="min-w-0">
                    <Dialog.Title className="text-xl font-extrabold text-navy">
                      Envoyer l’annonce à {stats.pending} personne(s) ?
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-[0.95rem] text-ink">
                      {stats.pendingConfirmed} réservation(s) confirmée(s) et {stats.pendingWaitlist}{" "}
                      en liste d’attente recevront l’e-mail ci-dessous. Cette action ne peut pas
                      être annulée.
                    </Dialog.Description>
                  </div>
                  <Dialog.Close
                    aria-label="Fermer"
                    disabled={sending}
                    className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-navy/5"
                  >
                    <X aria-hidden="true" className="size-5" />
                  </Dialog.Close>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                  <EmailPreview html={previewHtml} subject={previewSubject} />
                  <p className="mt-3 text-sm text-muted">
                    Aperçu avec des données d’exemple. Chaque personne reçoit son propre code,
                    son lien de billet et son lien d’annulation, en français ou en arabe selon la
                    langue de sa réservation.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-2.5 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline" disabled={sending}>
                      Annuler
                    </Button>
                  </Dialog.Close>
                  <Button type="button" onClick={sendAll} disabled={sending}>
                    {sending ? (
                      <>
                        <LoaderCircle aria-hidden="true" className="animate-spin" />
                        Envoi… {progress ? `${progress.sent} / ${stats.pending}` : ""}
                      </>
                    ) : (
                      <>
                        <Megaphone aria-hidden="true" />
                        Oui, envoyer à {stats.pending} personne(s)
                      </>
                    )}
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {stats.pending === 0 && stats.notified > 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-mint-dark">
              <CircleCheckBig aria-hidden="true" className="size-4 shrink-0" />
              Tout le monde a été prévenu.
            </p>
          ) : null}

          {progress && !sending ? (
            <div
              role="status"
              className="mt-4 rounded-2xl border border-line bg-white/80 p-4 text-[0.95rem]"
            >
              <p className="font-bold text-navy">Résultat de l’envoi</p>
              <ul className="mt-2 flex flex-col gap-1">
                <li className="flex items-center gap-2 font-semibold text-mint-dark">
                  <CircleCheckBig aria-hidden="true" className="size-4 shrink-0" />
                  {progress.sent} envoyé(s)
                </li>
                <li
                  className={
                    progress.failed > 0
                      ? "flex items-center gap-2 font-semibold text-rose-700"
                      : "flex items-center gap-2 text-muted"
                  }
                >
                  <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
                  {progress.failed} en échec
                </li>
                <li className="text-muted">{progress.remaining} restant(s) à prévenir</li>
              </ul>
              {progress.error ? (
                <p className="mt-2 text-sm break-words text-rose-700">
                  Dernière erreur : {progress.error} Vous pouvez relancer l’envoi : seules les
                  personnes non prévenues seront concernées.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      <section className="min-w-0" aria-label="Aperçu de l’e-mail">
        <h2 className="mb-3 text-lg font-bold">Aperçu de l’e-mail</h2>
        <EmailPreview html={previewHtml} subject={previewSubject} />
      </section>
    </div>
  );
}
