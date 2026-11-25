import { NextResponse } from "next/server";
import { getSeatStats } from "@/lib/data/public";

export const dynamic = "force-dynamic";

/** Compteur public : capacité et places restantes (aucune donnée personnelle). */
export async function GET() {
  const stats = await getSeatStats();
  return NextResponse.json(
    { capacity: stats.capacity, remaining: stats.remaining },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=20" } },
  );
}
