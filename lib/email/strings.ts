/**
 * Textes des e-mails (français et arabe).
 * Les variables entre accolades sont remplacées à l'envoi.
 */
export const emailStrings = {
  fr: {
    brand: "Workshop IA & Éducation",
    eventTitle: "L’Intelligence Artificielle au Service de l’Éducation Marocaine",
    tagline: "Ensemble pour une éducation augmentée",
    venue: "ESEF Beni Mellal — École Supérieure d’Éducation et de Formation, Beni Mellal, Maroc",
    labels: { date: "Date", venue: "Lieu", code: "Code de réservation", holder: "Participant·e" },
    footer:
      "Vous recevez cet e-mail car vous vous êtes inscrit·e au workshop organisé par les étudiants du Master « Innovation, Technologies et IA pour l’Ingénierie Pédagogique » — ESEF Beni Mellal.",
    hello: "Bonjour {name},",
    confirmed: {
      subject: "Votre billet — Workshop IA & Éducation ({date})",
      title: "Votre place est réservée",
      intro:
        "Merci pour votre inscription ! Voici votre billet. Présentez ce QR code à l’entrée le jour du workshop, sur votre téléphone ou imprimé.",
      button: "Afficher mon billet",
      calendar: "Le fichier joint « workshop.ics » ajoute l’événement à votre agenda.",
      bring: "Pensez à apporter un ordinateur portable ou un smartphone chargé pour le mini-atelier pratique.",
      cancelIntro: "Un empêchement ? Libérez votre place pour une autre personne :",
      cancelLink: "Annuler ma réservation",
    },
    waitlist: {
      subject: "Liste d’attente — Workshop IA & Éducation",
      title: "Vous êtes sur la liste d’attente",
      intro:
        "Toutes les places sont prises pour le moment. Dès qu’une place se libère, elle vous est attribuée automatiquement selon l’ordre d’inscription, et vous recevez votre billet par e-mail.",
      position: "Votre position : {position}",
      button: "Suivre mon inscription",
      cancelIntro: "Vous ne souhaitez plus participer ?",
      cancelLink: "Me retirer de la liste d’attente",
    },
    promoted: {
      subject: "Bonne nouvelle : une place s’est libérée pour vous !",
      title: "Une place s’est libérée : elle est à vous",
      intro:
        "Vous étiez sur la liste d’attente et une place vient de se libérer. Votre réservation est maintenant confirmée. Voici votre billet :",
    },
    cancelled: {
      subject: "Réservation annulée — Workshop IA & Éducation",
      title: "Votre réservation est annulée",
      intro:
        "Votre réservation {code} a bien été annulée et votre place a été libérée. Merci de nous avoir prévenus. Si vous changez d’avis, vous pouvez réserver à nouveau tant qu’il reste des places.",
      button: "Réserver à nouveau",
    },
    projectReceived: {
      subject: "Projet bien reçu — « {titre} »",
      title: "Nous avons bien reçu votre projet",
      intro:
        "Merci pour votre proposition « {titre} ». Le comité d’organisation l’étudie avec attention et vous informera de sa décision par e-mail.",
      reminder: "En attendant, pensez à réserver votre place pour le workshop.",
      button: "Réserver ma place",
    },
    projectAccepted: {
      subject: "Votre projet est accepté — « {titre} »",
      title: "Félicitations, votre projet est accepté !",
      intro:
        "Bonne nouvelle : votre projet « {titre} » a été retenu par le comité d’organisation. Il sera présenté le jour du workshop et apparaît désormais sur le site.",
      format: "Format retenu : {format}",
      comment: "Message du comité :",
      reminder: "Chaque membre de l’équipe doit réserver sa place individuellement.",
      button: "Voir les projets retenus",
    },
    projectRefused: {
      subject: "Réponse à votre proposition — « {titre} »",
      title: "Votre projet n’a pas été retenu",
      intro:
        "Merci d’avoir proposé « {titre} ». Le nombre de créneaux étant limité, le comité n’a malheureusement pas pu retenir votre projet cette fois-ci. Cela n’enlève rien à sa qualité.",
      comment: "Message du comité :",
      reminder: "Nous serions ravis de vous compter parmi les participants du workshop.",
      button: "Réserver ma place",
    },
    dateChange: {
      subject: "Changement de date — Workshop IA & Éducation : {date}",
      title: "Le workshop change de date",
      intro:
        "Le workshop, initialement prévu le {previous}, est reporté au {date}. Les horaires ({time}) et le lieu restent inchangés.",
      newDate: "Nouvelle date",
      confirmed:
        "Votre réservation reste valable : vous n’avez rien à faire. Votre code de réservation et votre billet avec QR code sont les mêmes.",
      waitlist:
        "Votre inscription sur la liste d’attente reste valable, avec le même code. Dès qu’une place se libère, vous recevez votre billet par e-mail.",
      button: "Afficher mon billet",
      buttonWaitlist: "Suivre mon inscription",
      calendarIntro:
        "Le fichier joint « workshop.ics » met à jour l’événement dans votre agenda. Vous pouvez aussi",
      calendarLink: "le télécharger ici",
      cancelIntro:
        "Cette nouvelle date ne vous convient pas ? Libérez votre place pour une autre personne :",
      cancelLink: "Annuler ma réservation",
      apology:
        "Nous vous prions de nous excuser pour ce changement et vous remercions de votre compréhension.",
    },
    formats: { oral: "Présentation orale (5 min)", poster: "Poster", demo: "Démo" },
  },
  ar: {
    brand: "ورشة الذكاء الاصطناعي والتعليم",
    eventTitle: "الذكاء الاصطناعي في خدمة التعليم المغربي",
    tagline: "معًا من أجل تعليم مُعزَّز",
    venue: "المدرسة العليا للتربية والتكوين، جامعة السلطان مولاي سليمان، بني ملال، المغرب",
    labels: { date: "التاريخ", venue: "المكان", code: "رمز الحجز", holder: "المشارك(ة)" },
    footer:
      "توصلت بهذه الرسالة لأنك سجّلت في الورشة التي ينظمها طلبة ماستر «الابتكار والتكنولوجيات والذكاء الاصطناعي في الهندسة البيداغوجية» — المدرسة العليا للتربية والتكوين بني ملال.",
    hello: "مرحبًا {name}،",
    confirmed: {
      subject: "تذكرتك — ورشة الذكاء الاصطناعي والتعليم ({date})",
      title: "مقعدك محجوز",
      intro:
        "شكرًا على تسجيلك! هذه تذكرتك. قدّم رمز QR عند الدخول يوم الورشة، على هاتفك أو مطبوعًا.",
      button: "عرض تذكرتي",
      calendar: "الملف المرفق «workshop.ics» يضيف الموعد إلى يوميتك.",
      bring: "أحضر معك حاسوبًا محمولًا أو هاتفًا ذكيًا مشحونًا من أجل الورشة التطبيقية.",
      cancelIntro: "تعذّر عليك الحضور؟ حرّر مقعدك لفائدة شخص آخر:",
      cancelLink: "إلغاء الحجز",
    },
    waitlist: {
      subject: "لائحة الانتظار — ورشة الذكاء الاصطناعي والتعليم",
      title: "أنت في لائحة الانتظار",
      intro:
        "جميع المقاعد محجوزة حاليًا. فور شغور مقعد سيُمنح لك تلقائيًا حسب ترتيب التسجيل، وستتوصل بتذكرتك بالبريد الإلكتروني.",
      position: "ترتيبك: {position}",
      button: "متابعة تسجيلي",
      cancelIntro: "لم تعد ترغب في المشاركة؟",
      cancelLink: "الانسحاب من لائحة الانتظار",
    },
    promoted: {
      subject: "خبر سارّ: شغر مقعد لفائدتك!",
      title: "شغر مقعد وهو الآن لك",
      intro: "كنت في لائحة الانتظار وقد شغر مقعد للتوّ. حجزك مؤكَّد الآن. هذه تذكرتك:",
    },
    cancelled: {
      subject: "تم إلغاء الحجز — ورشة الذكاء الاصطناعي والتعليم",
      title: "تم إلغاء حجزك",
      intro:
        "أُلغي حجزك {code} وحُرِّر مقعدك. شكرًا على إخبارنا. إذا غيّرت رأيك يمكنك الحجز من جديد ما دامت المقاعد متاحة.",
      button: "الحجز من جديد",
    },
    projectReceived: {
      subject: "توصلنا بمشروعك — «{titre}»",
      title: "توصلنا بمشروعك",
      intro:
        "شكرًا على مقترحك «{titre}». تدرسه لجنة التنظيم بعناية وستُخبرك بقرارها عبر البريد الإلكتروني.",
      reminder: "في انتظار ذلك، لا تنسَ حجز مقعدك لحضور الورشة.",
      button: "احجز مقعدي",
    },
    projectAccepted: {
      subject: "قُبل مشروعك — «{titre}»",
      title: "تهانينا، قُبل مشروعك!",
      intro:
        "خبر سارّ: اختارت لجنة التنظيم مشروعك «{titre}». سيُعرض يوم الورشة وهو منشور الآن على الموقع.",
      format: "صيغة المشاركة: {format}",
      comment: "رسالة اللجنة:",
      reminder: "على كل عضو في الفريق أن يحجز مقعده بشكل فردي.",
      button: "عرض المشاريع المقبولة",
    },
    projectRefused: {
      subject: "ردّ على مقترحك — «{titre}»",
      title: "لم يُقبل مشروعك",
      intro:
        "شكرًا على اقتراح «{titre}». نظرًا لمحدودية الحصص، لم تتمكن اللجنة للأسف من قبول مشروعك هذه المرة، وهذا لا ينقص من قيمته.",
      comment: "رسالة اللجنة:",
      reminder: "يسعدنا أن تكون من بين المشاركين في الورشة.",
      button: "احجز مقعدي",
    },
    dateChange: {
      subject: "تغيير التاريخ — ورشة الذكاء الاصطناعي والتعليم: {date}",
      title: "تغيير تاريخ الورشة",
      intro:
        "كانت الورشة مبرمجة يوم {previous}، وقد تأجّلت إلى يوم {date}. التوقيت ({time}) والمكان لم يتغيّرا.",
      newDate: "التاريخ الجديد",
      confirmed:
        "حجزك يبقى صالحًا ولا يلزمك أي إجراء. رمز الحجز وتذكرتك برمز QR لم يتغيّرا.",
      waitlist:
        "تسجيلك في لائحة الانتظار يبقى صالحًا بالرمز نفسه. فور شغور مقعد ستتوصل بتذكرتك بالبريد الإلكتروني.",
      button: "عرض تذكرتي",
      buttonWaitlist: "متابعة تسجيلي",
      calendarIntro: "الملف المرفق «workshop.ics» يحدّث الموعد في يوميتك. يمكنك أيضًا",
      calendarLink: "تحميله من هنا",
      cancelIntro: "التاريخ الجديد لا يناسبك؟ حرّر مقعدك لفائدة شخص آخر:",
      cancelLink: "إلغاء الحجز",
      apology: "نعتذر عن هذا التغيير ونشكرك على تفهّمك.",
    },
    formats: { oral: "عرض شفوي (5 دقائق)", poster: "ملصق", demo: "عرض تجريبي" },
  },
} as const;

export type EmailLang = keyof typeof emailStrings;

export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
