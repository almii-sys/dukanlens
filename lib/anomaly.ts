import type { Customer, LedgerEntry } from "./types";

// ─── Types ──────────────────────────────────────────────────────────────────

export type FlagSeverity = "High" | "Medium" | "Low";

export type FlagKind =
  | "duplicate"
  | "spike"
  | "large-entry"
  | "missing-amount"
  | "overpayment";

export interface AnomalyFlag {
  id: string; // stable id derived from kind + entry id(s)
  kind: FlagKind;
  severity: FlagSeverity;
  reason: string; // one-line plain-English explanation
  customerId: string | null; // link target, null if not tied to a customer
  customerName: string;
  entryIds: string[]; // ledger entries involved
}

// ─── Tuning constants ─────────────────────────────────────────────────────────

const SPIKE_MULTIPLE = 3; // new credit > 3x the customer's average
const SPIKE_MIN_HISTORY = 2; // need at least this many prior credits to judge
const LARGE_ENTRY_MULTIPLE = 4; // single entry > 4x the shop's typical entry
const LARGE_ENTRY_FLOOR = 2000; // ignore "large" flags below this amount (Rs)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function creditEntries(entries: LedgerEntry[]): LedgerEntry[] {
  return entries.filter((e) => e.type === "credit");
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/**
 * Median is more robust than the mean for the shop-wide "typical entry",
 * so one huge entry doesn't drag the baseline up and hide others.
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

// ─── Individual checks ──────────────────────────────────────────────────────

/** Same customer + same amount + same calendar date = likely a double entry. */
function findDuplicates(entries: LedgerEntry[]): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  const groups = new Map<string, LedgerEntry[]>();

  for (const e of creditEntries(entries)) {
    if (e.amount == null || !e.date) continue;
    const key = `${e.customerId}|${e.amount}|${e.date}`;
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }

  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const first = list[0]!;
    flags.push({
      id: `duplicate-${list.map((e) => e.id).join("-")}`,
      kind: "duplicate",
      severity: "High",
      reason: `${list.length} identical entries for ${first.customerName}: Rs ${first.amount.toLocaleString()} on the same date`,
      customerId: first.customerId,
      customerName: first.customerName,
      entryIds: list.map((e) => e.id),
    });
  }

  return flags;
}

/** A customer's new credit far above their own usual amount. */
function findSpikes(
  entries: LedgerEntry[],
  customers: Customer[]
): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  const byCustomer = new Map<string, LedgerEntry[]>();

  for (const e of creditEntries(entries)) {
    if (e.amount == null) continue;
    const list = byCustomer.get(e.customerId) ?? [];
    list.push(e);
    byCustomer.set(e.customerId, list);
  }

  for (const [customerId, list] of byCustomer.entries()) {
    if (list.length < SPIKE_MIN_HISTORY + 1) continue;

    // Sort oldest-first; judge the most recent entry against the prior ones.
    const sorted = [...list].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const latest = sorted[sorted.length - 1]!;
    const prior = sorted.slice(0, -1);
    const avgPrior = average(prior.map((e) => e.amount));
    if (avgPrior <= 0) continue;

    if (latest.amount > avgPrior * SPIKE_MULTIPLE) {
      const name =
        customers.find((c) => c.id === customerId)?.name ?? latest.customerName;
      flags.push({
        id: `spike-${latest.id}`,
        kind: "spike",
        severity: "Medium",
        reason: `New credit of Rs ${latest.amount.toLocaleString()} for ${name} is well above their usual Rs ${Math.round(avgPrior).toLocaleString()}`,
        customerId,
        customerName: name,
        entryIds: [latest.id],
      });
    }
  }

  return flags;
}

/** A single entry far larger than the shop's typical entry. */
function findLargeEntries(entries: LedgerEntry[]): AnomalyFlag[] {
  const credits = creditEntries(entries).filter((e) => e.amount != null);
  if (credits.length < 4) return []; // not enough data for a baseline

  const typical = median(credits.map((e) => e.amount));
  if (typical <= 0) return [];

  const threshold = Math.max(typical * LARGE_ENTRY_MULTIPLE, LARGE_ENTRY_FLOOR);

  return credits
    .filter((e) => e.amount > threshold)
    .map((e) => ({
      id: `large-${e.id}`,
      kind: "large-entry" as const,
      severity: "Low" as const,
      reason: `Rs ${e.amount.toLocaleString()} for ${e.customerName} is much larger than your typical entry (around Rs ${Math.round(typical).toLocaleString()})`,
      customerId: e.customerId,
      customerName: e.customerName,
      entryIds: [e.id],
    }));
}

/** Credit entries saved without a usable amount. */
function findMissingAmounts(entries: LedgerEntry[]): AnomalyFlag[] {
  return creditEntries(entries)
    .filter((e) => e.amount == null || e.amount <= 0)
    .map((e) => ({
      id: `missing-${e.id}`,
      kind: "missing-amount" as const,
      severity: "Medium" as const,
      reason: `Entry for ${e.customerName} has no readable amount — please add it`,
      customerId: e.customerId,
      customerName: e.customerName,
      entryIds: [e.id],
    }));
}

/**
 * A recorded payment (debit) larger than what the customer currently owes.
 * Compares each customer's total debits against their total credits.
 */
function findOverpayments(
  entries: LedgerEntry[],
  customers: Customer[]
): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  const byCustomer = new Map<string, LedgerEntry[]>();

  for (const e of entries) {
    const list = byCustomer.get(e.customerId) ?? [];
    list.push(e);
    byCustomer.set(e.customerId, list);
  }

  for (const [customerId, list] of byCustomer.entries()) {
    const totalCredit = list
      .filter((e) => e.type === "credit" && e.amount != null)
      .reduce((s, e) => s + e.amount, 0);
    const debits = list.filter((e) => e.type === "debit" && e.amount != null);
    const totalDebit = debits.reduce((s, e) => s + e.amount, 0);

    if (totalDebit > totalCredit && totalDebit > 0) {
      const name =
        customers.find((c) => c.id === customerId)?.name ??
        list[0]?.customerName ??
        "this customer";
      const over = totalDebit - totalCredit;
      flags.push({
        id: `overpayment-${customerId}`,
        kind: "overpayment",
        severity: "High",
        reason: `Payments recorded for ${name} exceed what they owed by Rs ${over.toLocaleString()}`,
        customerId,
        customerName: name,
        entryIds: debits.map((e) => e.id),
      });
    }
  }

  return flags;
}

// ─── Public API ─────────────────────────────────────────────────────────────

const SEVERITY_RANK: Record<FlagSeverity, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

/**
 * Run every anomaly check over the full ledger and return the flags,
 * most severe first. Pure and local — no network, no mutation.
 */
export function detectAnomalies(
  entries: LedgerEntry[],
  customers: Customer[]
): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [
    ...findDuplicates(entries),
    ...findSpikes(entries, customers),
    ...findLargeEntries(entries),
    ...findMissingAmounts(entries),
    ...findOverpayments(entries, customers),
  ];

  return flags.sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  );
}

/**
 * After a scan is saved, count how many of the newly added entries are
 * involved in any flag. Used for the "N items need review" card.
 */
export function countFlaggedAmong(
  flags: AnomalyFlag[],
  newEntryIds: string[]
): number {
  const newSet = new Set(newEntryIds);
  const touched = new Set<string>();
  for (const flag of flags) {
    for (const eid of flag.entryIds) {
      if (newSet.has(eid)) touched.add(flag.id);
    }
  }
  return touched.size;
}
