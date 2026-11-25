import type { Metadata } from "next";
import { getEventLabels } from "@/data/event";
import { requireAdmin } from "@/lib/admin/auth";
import { getAnnouncementStats, sampleReservation } from "@/lib/email/announcement";
import { dateChangeEmail } from "@/lib/email/templates";
import { AnnouncementPanel } from "@/components/admin/announcement-panel";
import { FormAlert } from "@/components/ui/form";

export const metadata: Metadata = { title: "Annonce" };

/**
 * Annonce du changement de date. Rien n'est jamais envoyé automatiquement :
 * l'envoi part uniquement du bouton de cette page, après confirmation.
 */
export default async function AdminAnnouncementPage() {
  const adminEmail = await requireAdmin();
  const stats = await getAnnouncementStats();
  const when = getEventLabels("fr");
  const preview = dateChangeEmail(sampleReservation(adminEmail, "confirmed"));

  return (
    <>
      <h1 className="text-3xl font-extrabold break-words">Annonce : changement de date</h1>
      <p className="mt-1 mb-6 text-muted">
        Prévenez les inscrits que le workshop est reporté au {when.dateInline} ({when.time}).
      </p>

      {!stats.ready ? (
        <FormAlert>
          <strong className="block">Une étape reste à faire dans Supabase</strong>
          <span className="font-normal">
            La colonne <code>date_change_notified_at</code> n’existe pas encore. Exécutez le
            fichier <code>supabase/migrations/0002_date_change_notification.sql</code> dans
            l’éditeur SQL de Supabase, puis rechargez cette page.
          </span>
        </FormAlert>
      ) : (
        <AnnouncementPanel
          stats={{
            pending: stats.pending,
            pendingConfirmed: stats.pendingConfirmed,
            pendingWaitlist: stats.pendingWaitlist,
            notified: stats.notified,
          }}
          emailConfigured={stats.emailConfigured}
          adminEmail={adminEmail}
          previewHtml={preview.html}
          previewSubject={preview.subject}
        />
      )}
    </>
  );
}
