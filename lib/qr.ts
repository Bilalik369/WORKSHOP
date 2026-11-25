import "server-only";
import QRCode from "qrcode";

const OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 1,
  width: 640,
  color: { dark: "#0a2a8c", light: "#ffffff" },
};

/** QR code du billet : contient uniquement le code de réservation. */
export function qrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(code, OPTIONS);
}

export function qrPngBuffer(code: string): Promise<Buffer> {
  return QRCode.toBuffer(code, { ...OPTIONS, type: "png" });
}
