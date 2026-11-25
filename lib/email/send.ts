import "server-only";
import { Resend } from "resend";
import { site } from "@/data/site";

export type EmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  /** Identifiant pour une image intégrée : <img src="cid:..."> */
  contentId?: string;
};

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
};

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * Envoie un e-mail via Resend. Ne lève jamais d'erreur : un e-mail en échec
 * ne doit pas faire échouer une réservation déjà enregistrée.
 */
export async function sendEmail(message: EmailMessage): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.info(`[email] Resend non configuré — « ${message.subject} » non envoyé.`);
    return { sent: false };
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: site.contactEmail.includes("example.com") ? undefined : site.contactEmail,
      attachments: message.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
        contentId: attachment.contentId,
      })),
    });
    if (error) {
      console.error(`[email] Échec de l'envoi (« ${message.subject} ») :`, error.message);
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error(`[email] Échec de l'envoi (« ${message.subject} ») :`, error);
    return { sent: false };
  }
}
