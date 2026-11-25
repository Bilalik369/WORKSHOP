/**
 * Valeurs techniques stockées en base. Les libellés affichés se trouvent
 * dans `messages/fr.json` et `messages/ar.json` (clé `options`).
 */
export const STATUTS = [
  "etudiant_esef",
  "etudiant_autre",
  "enseignant",
  "inspecteur",
  "professionnel",
  "autre",
] as const;

export const SOURCES = [
  "whatsapp",
  "instagram",
  "facebook",
  "affiche",
  "enseignant",
  "bouche_a_oreille",
  "autre",
] as const;

export const CATEGORIES = [
  "apprentissage_personnalise",
  "evaluation_feedback",
  "accessibilite_inclusion",
  "gestion_orientation",
  "ressources_numeriques",
  "autre",
] as const;

export const AVANCEMENTS = ["idee", "prototype", "finalise"] as const;

export const FORMATS = ["oral", "poster", "demo"] as const;

export const MAX_TEAM_MEMBERS = 5;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const PROJECT_BUCKET = "project-files";

export const PILLARS = ["education", "ia", "impact"] as const;
export const AUDIENCES = [
  "etudiants",
  "enseignants",
  "inspecteurs",
  "professionnels",
] as const;
export const OBJECTIVES = ["comprendre", "decouvrir", "pratiquer", "connecter"] as const;
export const FAQ_ITEMS = ["gratuit", "public", "attestation", "projet", "annulation"] as const;
export const BRING_ITEMS = ["appareil", "billet", "curiosite"] as const;

export type Statut = (typeof STATUTS)[number];
export type Source = (typeof SOURCES)[number];
export type Categorie = (typeof CATEGORIES)[number];
export type Avancement = (typeof AVANCEMENTS)[number];
export type Format = (typeof FORMATS)[number];
