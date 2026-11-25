/**
 * PROGRAMME DU WORKSHOP — fichier unique à modifier.
 *
 * Pour changer un horaire, un titre ou un intervenant, modifiez simplement
 * la ligne correspondante. Chaque séance se termine au début de la suivante ;
 * la dernière se termine à `PROGRAMME_END`.
 *
 * - `period`  : "matin" ou "apres-midi" (sert au filtre)
 * - `type`    : détermine l'icône et la couleur
 * - `speaker` : identifiant d'un intervenant de `data/speakers.ts` (optionnel)
 * - `note`    : précision affichée après le nom (optionnel)
 * - `tbc`     : true = affiche le badge « À confirmer »
 */

export type Localized = { fr: string; ar: string };

export type SessionType =
  | "ceremonie"
  | "conference"
  | "projet"
  | "pause"
  | "echange"
  | "atelier"
  | "cloture";

export type Period = "matin" | "apres-midi";

export type Session = {
  time: string;
  period: Period;
  type: SessionType;
  title: Localized;
  speaker?: string;
  note?: Localized;
  tbc?: boolean;
};

export const PROGRAMME_END = "15:30";

export const programme: Session[] = [
  {
    time: "09:30",
    period: "matin",
    type: "ceremonie",
    title: { fr: "Ouverture & Accueil", ar: "الافتتاح والاستقبال" },
    speaker: "chaima-kharrou",
    note: { fr: "narratrice", ar: "مقدّمة الحفل" },
  },
  {
    time: "09:40",
    period: "matin",
    type: "ceremonie",
    title: { fr: "Récitation du Saint Coran", ar: "تلاوة آيات من القرآن الكريم" },
  },
  {
    time: "09:45",
    period: "matin",
    type: "ceremonie",
    title: { fr: "Mot du Professeur Encadrant", ar: "كلمة الأستاذ المؤطّر" },
    speaker: "a-lasbahani",
  },
  {
    time: "10:00",
    period: "matin",
    type: "conference",
    title: { fr: "Introduction à l’IA", ar: "مدخل إلى الذكاء الاصطناعي" },
    speaker: "hiba-benttani",
  },
  {
    time: "10:20",
    period: "matin",
    type: "conference",
    title: {
      fr: "Intervention externe : de l’idée au produit",
      ar: "مداخلة خارجية: من الفكرة إلى المنتَج",
    },
    speaker: "younesse-el-bassiri",
    note: { fr: "Co-founder", ar: "شريك مؤسّس" },
  },
  {
    time: "10:45",
    period: "matin",
    type: "pause",
    title: { fr: "Pause café", ar: "استراحة قهوة" },
  },
  {
    time: "11:00",
    period: "matin",
    type: "projet",
    title: {
      fr: "Projet : Prédiction de l’échec scolaire",
      ar: "مشروع: التنبّؤ بالتعثّر الدراسي",
    },
    speaker: "ayoub-el-erqyq",
  },
  {
    time: "11:25",
    period: "matin",
    type: "projet",
    title: { fr: "Projet étudiant", ar: "مشروع طلابي" },
    tbc: true,
  },
  {
    time: "11:50",
    period: "matin",
    type: "conference",
    title: { fr: "Présentation", ar: "عرض" },
    tbc: true,
  },
  {
    time: "12:30",
    period: "apres-midi",
    type: "pause",
    title: { fr: "Pause déjeuner", ar: "استراحة الغداء" },
  },
  {
    time: "13:30",
    period: "apres-midi",
    type: "echange",
    title: {
      fr: "Podcast / Table ronde : les défis des étudiants",
      ar: "بودكاست / مائدة مستديرة: تحدّيات الطلبة",
    },
  },
  {
    time: "13:50",
    period: "apres-midi",
    type: "conference",
    title: { fr: "Solutions techniques", ar: "حلول تقنية" },
    speaker: "bilal-iken",
  },
  {
    time: "14:05",
    period: "apres-midi",
    type: "atelier",
    title: { fr: "Mini-atelier pratique IA", ar: "ورشة تطبيقية مصغّرة في الذكاء الاصطناعي" },
  },
  {
    time: "14:35",
    period: "apres-midi",
    type: "echange",
    title: { fr: "Giveaway", ar: "سحب على جوائز" },
  },
  {
    time: "14:50",
    period: "apres-midi",
    type: "cloture",
    title: { fr: "Remise des certificats", ar: "توزيع الشهادات" },
  },
  {
    time: "15:10",
    period: "apres-midi",
    type: "cloture",
    title: { fr: "Remerciements", ar: "كلمة شكر" },
    speaker: "bilal-iken",
  },
  {
    time: "15:20",
    period: "apres-midi",
    type: "cloture",
    title: { fr: "Clôture & photo de groupe", ar: "الاختتام وصورة جماعية" },
  },
];
