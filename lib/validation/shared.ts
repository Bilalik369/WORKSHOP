/**
 * Numéro marocain : +212, 00212 ou 0, suivi de 5, 6 ou 7 puis 8 chiffres.
 * Espaces, points et tirets sont tolérés (06 12 34 56 78, +212 6-12-34-56-78…).
 */
const MOROCCAN_PHONE = /^(?:\+212|00212|0)[\s.-]*[5-7](?:[\s.-]*\d){8}$/;

export function isMoroccanPhone(value: string): boolean {
  return MOROCCAN_PHONE.test(value.trim());
}

/** Format international compact : +2126XXXXXXXX. */
export function normalizePhone(value: string): string {
  const digits = value
    .replace(/\D/g, "")
    .replace(/^00212/, "")
    .replace(/^212/, "")
    .replace(/^0/, "");
  return `+212${digits}`;
}

/** Affichage lisible : +212 6 12 34 56 78. */
export function formatPhone(value: string): string {
  const match = /^\+212(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(value);
  return match
    ? `+212 ${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`
    : value;
}
