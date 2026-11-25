import { z } from "zod";
import { AVANCEMENTS, CATEGORIES, FORMATS, MAX_TEAM_MEMBERS } from "@/lib/constants";
import { isMoroccanPhone } from "./shared";

/**
 * Schéma partagé par le formulaire (client) et l'action serveur.
 * Les messages sont des clés de traduction (`errors.*`).
 */
export const projectSchema = z.object({
  porteur_nom: z.string().trim().min(1, "required").max(120, "tooLong"),
  porteur_email: z.string().trim().min(1, "required").max(160, "tooLong").email("email"),
  porteur_telephone: z.string().trim().min(1, "required").refine(isMoroccanPhone, "phone"),
  etablissement: z.string().trim().min(1, "required").max(160, "tooLong"),
  members: z
    .array(z.object({ nom: z.string().trim().max(120, "tooLong") }))
    .max(MAX_TEAM_MEMBERS, "maxMembers"),
  titre: z.string().trim().min(1, "required").min(4, "tooShort").max(140, "tooLong"),
  categorie: z.enum(CATEGORIES, { error: "select" }),
  problematique: z.string().trim().min(1, "required").min(40, "tooShort").max(2000, "tooLong"),
  solution: z.string().trim().min(1, "required").min(40, "tooShort").max(2000, "tooLong"),
  technologies: z.string().trim().min(1, "required").max(300, "tooLong"),
  avancement: z.enum(AVANCEMENTS, { error: "select" }),
  lien: z
    .string()
    .trim()
    .max(300, "tooLong")
    .refine((value) => value === "" || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(value), "url"),
  format: z.enum(FORMATS, { error: "select" }),
  consent: z.boolean().refine((value) => value === true, "consent"),
});

export type ProjectInput = z.infer<typeof projectSchema>;

/** Chemin attendu d'un PDF déposé : uploads/<uuid>.pdf */
export const PDF_PATH_PATTERN =
  /^uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/;
