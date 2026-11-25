import { getTranslations, setRequestLocale } from "next-intl/server";
import { getEventLabels } from "@/data/event";
import { site } from "@/data/site";
import { contentLang } from "@/i18n/routing";
import { getAcceptedProjects, getSeatStats, getSubmissionWindow } from "@/lib/data/public";
import { getSiteUrl } from "@/lib/env";
import { About } from "@/components/landing/about";
import { CtaBand } from "@/components/landing/cta-band";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Infos } from "@/components/landing/infos";
import { Navbar } from "@/components/landing/navbar";
import { Pillars } from "@/components/landing/pillars";
import { Programme } from "@/components/landing/programme";
import { Projects } from "@/components/landing/projects";
import { Speakers } from "@/components/landing/speakers";

// Page statique, régénérée au plus toutes les 60 s (projets acceptés, places).
export const revalidate = 60;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [stats, projects, submission, tMeta, tHero] = await Promise.all([
    getSeatStats(),
    getAcceptedProjects(),
    getSubmissionWindow(),
    getTranslations("meta"),
    getTranslations("hero"),
  ]);
  const seats = { capacity: stats.capacity, remaining: stats.remaining };
  const siteUrl = getSiteUrl();

  // Données structurées : aide Google à afficher l'événement.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationEvent",
    name: tMeta("title"),
    description: tMeta("description", {
      date: getEventLabels(contentLang(locale)).dateInline,
    }),
    startDate: site.eventStart,
    endDate: site.eventEnd,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    isAccessibleForFree: true,
    inLanguage: ["fr", "ar"],
    url: siteUrl,
    image: `${siteUrl}/opengraph-image`,
    location: {
      "@type": "Place",
      name: `${tHero("venueFull")} (ESEF)`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Beni Mellal",
        addressCountry: "MA",
      },
    },
    organizer: {
      "@type": "CollegeOrUniversity",
      name: "ESEF Beni Mellal — Université Sultan Moulay Slimane",
      url: site.links.usms,
    },
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "MAD",
      availability:
        stats.remaining > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: `${siteUrl}/reservation`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Navbar />
      <main id="contenu">
        <Hero seats={seats} />
        <Pillars />
        <About />
        <Programme />
        <Speakers />
        <Projects
          projects={projects}
          deadline={submission.deadline}
          isOpen={submission.isOpen}
        />
        <Infos />
        <Faq />
        <CtaBand seats={seats} />
      </main>
      <Footer />
    </>
  );
}
