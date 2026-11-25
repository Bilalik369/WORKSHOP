import type { Metadata } from "next";
import { jakarta, plexArabic } from "@/lib/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Administration du workshop" },
  robots: { index: false, follow: false },
};

/** L'administration est en français uniquement et n'est jamais indexée. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr" className={`${jakarta.variable} ${plexArabic.variable} antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
