import type { Customer, LedgerEntry } from "./types";
import { computeTrustScore } from "./storage";

/** Escape a single CSV field per RFC 4180 (quote if it contains , " or newline). */
function csvField(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(fields: Array<string | number | null | undefined>): string {
  return fields.map(csvField).join(",");
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  // YYYY-MM-DD keeps Excel from mis-parsing locale date formats.
  return d.toISOString().slice(0, 10);
}

/**
 * Build a CSV string with two sections:
 *   1. One row per ledger entry (Date, Customer, Item, Type, Amount, Status)
 *   2. One row per customer (Customer, Total Owed, Trust Score)
 */
export function buildLedgerCsv(
  entries: LedgerEntry[],
  customers: Customer[]
): string {
  const lines: string[] = [];

  // ── Section 1: entries ──
  lines.push(csvRow(["Date", "Customer", "Item", "Type", "Amount", "Status"]));

  const sortedEntries = [...entries].sort((a, b) => {
    const ad = a.date ?? a.createdAt;
    const bd = b.date ?? b.createdAt;
    return new Date(ad).getTime() - new Date(bd).getTime();
  });

  for (const e of sortedEntries) {
    lines.push(
      csvRow([
        formatDate(e.date ?? e.createdAt),
        e.customerName,
        e.note ?? "",
        e.type === "debit" ? "Payment" : "Credit",
        e.amount ?? "",
        e.status.charAt(0).toUpperCase() + e.status.slice(1),
      ])
    );
  }

  // Blank spacer row between the two sections.
  lines.push("");

  // ── Section 2: per-customer summary ──
  lines.push(csvRow(["Customer", "Total Owed", "Trust Score"]));

  const sortedCustomers = [...customers].sort(
    (a, b) => b.totalOwed - a.totalOwed
  );

  for (const c of sortedCustomers) {
    const customerEntries = entries.filter((e) => e.customerId === c.id);
    const trust = computeTrustScore(c, customerEntries);
    lines.push(csvRow([c.name, c.totalOwed, trust.label]));
  }

  return lines.join("\r\n");
}

/**
 * Trigger a client-side download of a CSV file. A UTF-8 BOM is prepended so
 * Excel opens non-ASCII (e.g. Urdu) names with the correct encoding.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
