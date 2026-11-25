export type ReservationStatus = "confirmed" | "waitlist" | "cancelled";
export type ProjectStatus = "pending" | "accepted" | "refused";

export type Reservation = {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  statut: string;
  etablissement: string;
  filiere: string | null;
  source: string | null;
  locale: "fr" | "ar";
  status: ReservationStatus;
  ticket_token: string;
  cancel_token: string;
  checked_in_at: string | null;
  promoted_at: string | null;
  cancelled_at: string | null;
  created_at: string;
};

export type TeamMember = { id: string; nom: string; position: number };

export type Project = {
  id: string;
  porteur_nom: string;
  porteur_email: string;
  porteur_telephone: string;
  etablissement: string;
  titre: string;
  categorie: string;
  problematique: string;
  solution: string;
  technologies: string;
  avancement: string;
  lien: string | null;
  pdf_path: string | null;
  format: string;
  locale: "fr" | "ar";
  status: ProjectStatus;
  admin_comment: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  team_members?: TeamMember[];
};
