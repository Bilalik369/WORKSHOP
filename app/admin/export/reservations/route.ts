import ExcelJS from "exceljs";
import { getAdminEmail } from "@/lib/admin/auth";
import { getAllReservations } from "@/lib/admin/data";
import {
  RESERVATION_STATUS_LABELS,
  formatDateTime,
  sourceLabel,
  statutLabel,
} from "@/lib/admin/labels";
import type { Reservation } from "@/lib/types";
import { formatPhone } from "@/lib/validation/shared";

export const dynamic = "force-dynamic";

const COLUMNS: { header: string; width: number; value: (r: Reservation) => string }[] = [
  { header: "Code", width: 14, value: (r) => r.code },
  { header: "Nom", width: 20, value: (r) => r.nom },
  { header: "Prénom", width: 20, value: (r) => r.prenom },
  { header: "E-mail", width: 32, value: (r) => r.email },
  { header: "Téléphone", width: 20, value: (r) => formatPhone(r.telephone) },
  { header: "Statut", width: 30, value: (r) => statutLabel(r.statut) },
  { header: "Établissement", width: 32, value: (r) => r.etablissement },
  { header: "Filière / niveau", width: 26, value: (r) => r.filiere ?? "" },
  { header: "Source", width: 24, value: (r) => (r.source ? sourceLabel(r.source) : "") },
  { header: "Réservation", width: 16, value: (r) => RESERVATION_STATUS_LABELS[r.status] },
  { header: "Présent", width: 10, value: (r) => (r.checked_in_at ? "Oui" : "Non") },
  { header: "Heure d’arrivée", width: 18, value: (r) => (r.checked_in_at ? formatDateTime(r.checked_in_at) : "") },
  { header: "Inscrit le", width: 18, value: (r) => formatDateTime(r.created_at) },
  { header: "Langue", width: 9, value: (r) => r.locale },
];

/** Protège les cellules contre l'injection de formules (=, +, -, @). */
const safe = (value: string) => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value);

/** Export des réservations, réservé aux administrateurs. */
export async function GET(request: Request) {
  if (!(await getAdminEmail())) {
    return new Response("Non autorisé", { status: 401 });
  }

  const format = new URL(request.url).searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const { rows, error } = await getAllReservations();
  if (error) return new Response(error, { status: 500 });

  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `reservations-workshop-${stamp}.${format}`;

  if (format === "csv") {
    const escape = (value: string) => `"${safe(value).replace(/"/g, '""')}"`;
    const lines = [
      COLUMNS.map((column) => escape(column.header)).join(";"),
      ...rows.map((row) => COLUMNS.map((column) => escape(column.value(row))).join(";")),
    ];
    // BOM + point-virgule : s'ouvre correctement dans Excel en français.
    return new Response(`﻿${lines.join("\r\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Réservations", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = COLUMNS.map((column) => ({ header: column.header, width: column.width }));
  rows.forEach((row) => sheet.addRow(COLUMNS.map((column) => safe(column.value(row)))));

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A2A8C" } };
  header.alignment = { vertical: "middle" };
  header.height = 22;
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
