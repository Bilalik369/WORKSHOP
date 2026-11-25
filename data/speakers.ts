import type { Localized } from "./programme";

/**
 * INTERVENANTS — fichier à modifier.
 *
 * - `id`    : identifiant utilisé dans `data/programme.ts`
 * - `photo` : chemin d'une image placée dans `public/speakers/`
 *             (ex. "/speakers/hiba-benttani.jpg"). Sans photo, un avatar
 *             avec les initiales est affiché.
 * - `featured: false` masque la personne de la section « Intervenants »
 *   tout en la gardant disponible pour le programme.
 */
export type Speaker = {
  id: string;
  name: string;
  role: Localized;
  topic?: Localized;
  photo?: string;
  featured?: boolean;
};

export const speakers: Speaker[] = [
  {
    id: "a-lasbahani",
    name: "Pr. A. Lasbahani",
    role: { fr: "Professeur encadrant", ar: "الأستاذ المؤطّر" },
    topic: { fr: "Mot d’ouverture", ar: "الكلمة الافتتاحية" },
  },
  {
    id: "younesse-el-bassiri",
    name: "Younesse El Bassiri",
    role: { fr: "Co-founder · Intervenant externe", ar: "شريك مؤسّس · متدخّل خارجي" },
    topic: { fr: "De l’idée au produit", ar: "من الفكرة إلى المنتَج" },
  },
  {
    id: "hiba-benttani",
    name: "Hiba Benttani",
    role: { fr: "Étudiante du Master", ar: "طالبة بسلك الماستر" },
    topic: { fr: "Introduction à l’IA", ar: "مدخل إلى الذكاء الاصطناعي" },
  },
  {
    id: "ayoub-el-erqyq",
    name: "Ayoub El-Erqyq",
    role: { fr: "Porteur de projet", ar: "حامل مشروع" },
    topic: { fr: "Prédiction de l’échec scolaire", ar: "التنبّؤ بالتعثّر الدراسي" },
  },
  {
    id: "bilal-iken",
    name: "Bilal Iken",
    role: { fr: "Étudiant du Master", ar: "طالب بسلك الماستر" },
    topic: { fr: "Solutions techniques", ar: "حلول تقنية" },
  },
  {
    id: "chaima-kharrou",
    name: "Chaima Kharrou",
    role: { fr: "Narratrice de l’événement", ar: "مقدّمة الحفل" },
    topic: { fr: "Ouverture & Accueil", ar: "الافتتاح والاستقبال" },
  },
];

export function getSpeaker(id: string | undefined): Speaker | undefined {
  return id ? speakers.find((speaker) => speaker.id === id) : undefined;
}

/** Initiales pour l'avatar (ignore les titres comme « Pr. »). */
export function getInitials(name: string): string {
  const parts = name
    .replace(/^(Pr|Dr|M|Mme)\.\s*/i, "")
    .split(/[\s-]+/)
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
