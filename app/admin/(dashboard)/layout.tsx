import { requireAdmin } from "@/lib/admin/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

/** Toutes les pages de ce groupe exigent un administrateur connecté. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();

  return (
    <>
      <AdminNav email={email} />
      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9">{children}</main>
    </>
  );
}
