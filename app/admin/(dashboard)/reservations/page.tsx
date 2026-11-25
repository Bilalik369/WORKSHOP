import type { Metadata } from "next";
import { getAllReservations, getCapacity } from "@/lib/admin/data";
import { ReservationsTable } from "@/components/admin/reservations-table";
import { FormAlert } from "@/components/ui/form";

export const metadata: Metadata = { title: "Réservations" };

export default async function AdminReservationsPage() {
  const [{ rows, error }, capacity] = await Promise.all([getAllReservations(), getCapacity()]);

  return (
    <>
      <h1 className="text-3xl font-extrabold">Réservations</h1>
      <p className="mt-1 mb-6 text-muted">
        Recherchez un participant, pointez sa présence et exportez la liste.
      </p>
      {error ? (
        <FormAlert>{error}</FormAlert>
      ) : (
        <ReservationsTable reservations={rows} capacity={capacity} />
      )}
    </>
  );
}
