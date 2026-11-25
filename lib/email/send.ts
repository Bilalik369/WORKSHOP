import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
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

export type SendResult = { sent: boolean; error?: string };

/** Nom affiché comme expéditeur : « Workshop IA & Éducation <GMAIL_USER> ». */
const SENDER_NAME = "Workshop IA & Éducation";

/** Les mots de passe d'application Google s'affichent avec des espaces : on les retire. */
function credentials(): { user: string; pass: string } | null {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  return user && pass ? { user, pass } : null;
}

export function isEmailConfigured(): boolean {
  return credentials() !== null;
}

let transporter: Transporter | null = null;
let transporterUser: string | null = null;

/** Connexion SMTP à Gmail (smtp.gmail.com, port 465, TLS), réutilisée entre les envois. */
function getTransporter(auth: { user: string; pass: string }): Transporter {
  if (!transporter || transporterUser !== auth.user) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    });
    transporterUser = auth.user;
  }
  return transporter;
}

/**
 * Envoie un e-mail via Gmail (Nodemailer). Ne lève jamais d'erreur : un
 * e-mail en échec ne doit pas faire échouer une réservation déjà enregistrée.
 * Le résultat indique si l'envoi a réussi.
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const auth = credentials();

  if (!auth) {
    console.info(`[email] Gmail non configuré — « ${message.subject} » non envoyé.`);
    return { sent: false, error: "Gmail n’est pas configuré." };
  }

  const replyTo =
    site.contactEmail.includes("example.com") || site.contactEmail === auth.user
      ? undefined
      : site.contactEmail;

  try {
    const info = await getTransporter(auth).sendMail({
      from: { name: SENDER_NAME, address: auth.user },
      to: message.to,
      replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
        cid: attachment.contentId,
      })),
    });

    const rejected = info.rejected ?? [];
    if (rejected.length > 0) {
      const reason = `Adresse refusée : ${rejected.join(", ")}`;
      console.error(`[email] « ${message.subject} » — ${reason}`);
      return { sent: false, error: reason };
    }
    return { sent: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Erreur inconnue.";
    console.error(`[email] Échec de l'envoi (« ${message.subject} ») : ${reason}`);
    return { sent: false, error: explainSmtpError(reason) };
  }
}

/** Traduit les erreurs Gmail les plus courantes en message utile. */
function explainSmtpError(reason: string): string {
  if (/535|Username and Password not accepted|Invalid login/i.test(reason)) {
    return "Gmail a refusé la connexion : vérifiez GMAIL_USER et GMAIL_APP_PASSWORD (mot de passe d’application à 16 caractères).";
  }
  if (/550 5\.4\.5|Daily user sending (quota|limit)|limit exceeded/i.test(reason)) {
    return "Limite d’envoi quotidienne de Gmail atteinte. Réessayez dans 24 heures.";
  }
  if (/ETIMEDOUT|ECONNRESET|ENOTFOUND|ECONNREFUSED|timeout/i.test(reason)) {
    return "Connexion à Gmail impossible (réseau). Réessayez dans un instant.";
  }
  return reason;
}
