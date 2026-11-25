import { z } from "zod";
import { SOURCES, STATUTS } from "@/lib/constants";
import { isMoroccanPhone } from "./shared";

/**
 * Schéma partagé par le formulaire (client) et l'action serveur.
 * Les messages sont des clés de traduction (`errors.*`).
 */
export const reservationSchema = z.object({
  nom: z.string().trim().min(1, "required").max(80, "tooLong"),
  prenom: z.string().trim().min(1, "required").max(80, "tooLong"),
  email: z.string().trim().min(1, "required").max(160, "tooLong").email("email"),
  telephone: z.string().trim().min(1, "required").refine(isMoroccanPhone, "phone"),
  statut: z.enum(STATUTS, { error: "select" }),
  etablissement: z.string().trim().min(1, "required").max(160, "tooLong"),
  filiere: z.string().trim().max(160, "tooLong"),
  source: z.union([z.enum(SOURCES), z.literal("")]),
  consent: z.boolean().refine((value) => value === true, "consent"),
});

export type ReservationInput = z.infer<typeof reservationSchema>;
