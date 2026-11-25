import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Pages personnelles (billets, annulation) et administration.
      disallow: ["/admin", "/api", "/reservation/billet", "/reservation/annuler", "/ar/reservation/billet", "/ar/reservation/annuler"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
