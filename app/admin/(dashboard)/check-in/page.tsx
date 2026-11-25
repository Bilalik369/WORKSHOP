import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { LazyScanner } from "@/components/admin/lazy-scanner";

export const metadata: Metadata = { title: "Check-in" };

export default async function AdminCheckInPage() {
  await requireAdmin();

  return (
    <>
      <div className="mx-auto mb-6 max-w-lg text-center">
        <h1 className="text-3xl font-extrabold">Check-in</h1>
        <p className="mt-1 text-muted">
          Scannez le QR code du billet de chaque participant à l’entrée. La présence sert à
          délivrer les attestations.
        </p>
      </div>
      <LazyScanner />
    </>
  );
}
