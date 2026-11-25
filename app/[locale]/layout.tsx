import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getEventLabels } from "@/data/event";
import { contentLang, isRtl, routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/env";
import { jakarta, plexArabic } from "@/lib/fonts";
import { MotionProvider } from "@/components/shared/motion";
import "../globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#f5f7ff",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = getSiteUrl();
  const description = t("description", {
    date: getEventLabels(contentLang(locale)).dateInline,
  });
  const path = contentLang(locale) === "ar" ? "/ar" : "/";

  return {
    metadataBase: new URL(siteUrl),
    title: { default: t("title"), template: `%s · ${t("shortTitle")}` },
    description,
    applicationName: t("shortTitle"),
    alternates: {
      canonical: path,
      languages: { fr: "/", ar: "/ar", "x-default": "/" },
    },
    openGraph: {
      type: "website",
      url: path,
      siteName: t("shortTitle"),
      title: t("title"),
      description,
      locale: contentLang(locale) === "ar" ? "ar_MA" : "fr_MA",
      alternateLocale: contentLang(locale) === "ar" ? "fr_MA" : "ar_MA",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description,
    },
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("common");

  return (
    <html
      lang={contentLang(locale)}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className={`${jakarta.variable} ${plexArabic.variable} antialiased`}
    >
      <body className="font-sans">
        <a
          href="#contenu"
          className="sr-only z-[100] rounded-full bg-navy px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <MotionProvider>{children}</MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
