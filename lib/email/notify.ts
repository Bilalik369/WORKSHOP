import "server-only";
import type { Reservation } from "@/lib/types";
import { sendEmail } from "./send";
import { cancelledEmail, ticketEmail } from "./templates";

/** E-mails qui suivent une annulation : confirmation, puis billets des personnes promues. */
export async function notifyCancellation(
  cancelled: Reservation | null,
  promoted: Reservation[],
): Promise<void> {
  if (cancelled) await sendEmail(cancelledEmail(cancelled));
  await notifyPromoted(promoted);
}

/** Envoie leur billet aux personnes passées de la liste d'attente à « confirmé ». */
export async function notifyPromoted(promoted: Reservation[]): Promise<void> {
  for (const reservation of promoted) {
    await sendEmail(await ticketEmail(reservation, { promoted: true }));
  }
}
