import { notFound } from "next/navigation";

/** Toute adresse inconnue affiche la page « introuvable » traduite. */
export default function CatchAllPage() {
  notFound();
}
