import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

const PAGES = ["", "/reservation", "/projets/soumettre"];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  return PAGES.map((page) => ({
    url: `${siteUrl}${page || "/"}`,
    changeFrequency: "weekly",
    priority: page === "" ? 1 : 0.8,
    alternates: {
      languages: {
        fr: `${siteUrl}${page || "/"}`,
        ar: `${siteUrl}/ar${page}`,
      },
    },
  }));
}
