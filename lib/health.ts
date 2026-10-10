import type { Customer, LedgerEntry } from "./types";
import { computeTrustScore } from "./storage";
import type { AnomalyFlag } from "./anomaly";

// ─── Types ──────────────────────────────────────────────────────────────────

export type HealthLabel = "Healthy" | "Needs Attention" | "At Risk";

export interface HealthFactor {
  key: "recovery" | "overdue" | "risk";
  label: string;
  /** 0–100, where 100 is the healthiest state for this factor. */
  value: number;
  /** Short human-readable detail, e.g. "68% of credit recovered". */
  detail: string;
}

export interface HealthScore {
  score: number; // 0–100
  label: HealthLabel;
  factors: HealthFactor[];
  tip: string; // one-line, plain English
  subtitle: string;
}

// ─── Weights (sum to 100) ─────────────────────────────────────────────────────

const W_RECOVERY = 40; // share of credit recovered
const W_OVERDUE = 25; // amount overdue > 14 days
const W_RISK = 20; // High Risk customers
const W_FRAUD = 15; // open fraud flags

const OVERDUE_DAYS = 14;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return 0;
  return (Date.now() - then) / (1000 * 60 * 60 * 24);
}

// ─── Factor computations ──────────────────────────────────────────────────────

/** Recovered share = total payments / total credit ever given. */
function recoveryHealth(entries: LedgerEntry[]): {
  value: number;
  detail: string;
} {
  const totalCredit = entries
    .filter((e) => e.type === "credit" && e.amount != null)
    .reduce((s, e) => s + e.amount, 0);
  const totalRecovered = entries
    .filter((e) => e.type === "debit" && e.amount != null)
    .reduce((s, e) => s + e.amount, 0);

  if (totalCredit <= 0) {
    return { value: 100, detail: "No credit given yet" };
  }

  const share = clamp((totalRecovered / totalCredit) * 100);
  return {
    value: share,
    detail: `${Math.round(share)}% of credit recovered`,
  };
}

/** Health falls as a larger share of outstanding money ages past 14 days. */
function overdueHealth(
  entries: LedgerEntry[],
  customers: Customer[]
): { value: number; detail: string; overdueAmount: number } {
  const totalOwed = customers.reduce((s, c) => s + c.totalOwed, 0);

  const overdueAmount = entries
    .filter(
      (e) =>
        e.type === "credit" &&
        e.status !== "paid" &&
        e.amount != null &&
        e.date != null &&
        daysSince(e.date) > OVERDUE_DAYS
    )
    .reduce((s, e) => s + e.amount, 0);

  if (totalOwed <= 0) {
    return { value: 100, detail: "Nothing overdue", overdueAmount: 0 };
  }

  const overdueShare = clamp((overdueAmount / totalOwed) * 100);
  const value = clamp(100 - overdueShare);
  return {
    value,
    detail:
      overdueAmount > 0
        ? `Rs ${Math.round(overdueAmount).toLocaleString()} overdue 14+ days`
        : "Nothing overdue 14+ days",
    overdueAmount,
  };
}

/** Health falls with each High Risk customer. */
function riskHealth(
  customers: Customer[],
  entries: LedgerEntry[]
): { value: number; detail: string; highRisk: number } {
  const withBalance = customers.filter((c) => c.totalOwed > 0);
  if (withBalance.length === 0) {
    return { value: 100, detail: "No customers owing", highRisk: 0 };
  }

  let highRisk = 0;
  for (const c of withBalance) {
    const ce = entries.filter((e) => e.customerId === c.id);
    if (computeTrustScore(c, ce).label === "High Risk") highRisk++;
  }

  const share = clamp((highRisk / withBalance.length) * 100);
  const value = clamp(100 - share);
  return {
    value,
    detail:
      highRisk === 0
        ? "No high-risk customers"
        : `${highRisk} high-risk customer${highRisk !== 1 ? "s" : ""}`,
    highRisk,
  };
}

/** Open fraud flags pull the fraud sub-score down; weighted by severity. */
function fraudHealth(flags: AnomalyFlag[]): number {
  if (flags.length === 0) return 100;
  const penalty = flags.reduce((s, f) => {
    if (f.severity === "High") return s + 25;
    if (f.severity === "Medium") return s + 15;
    return s + 7;
  }, 0);
  return clamp(100 - penalty);
}

// ─── Tip ────────────────────────────────────────────────────────────────────

/**
 * Suggest the single most impactful action. Prefers collecting from the
 * largest-owing customer, since recovery carries the most weight.
 */
function buildTip(
  customers: Customer[],
  entries: LedgerEntry[],
  flags: AnomalyFlag[],
  score: number
): string {
  if (flags.length > 0) {
    const high = flags.find((f) => f.severity === "High") ?? flags[0]!;
    return `Review the alert for ${high.customerName} to protect your score`;
  }

  const totalCredit = entries
    .filter((e) => e.type === "credit" && e.amount != null)
    .reduce((s, e) => s + e.amount, 0);

  const topDebtor = [...customers]
    .filter((c) => c.totalOwed > 0)
    .sort((a, b) => b.totalOwed - a.totalOwed)[0];

  if (topDebtor && totalCredit > 0) {
    // Estimate the recovery-driven score lift from collecting this balance.
    const lift = Math.round(
      ((topDebtor.totalOwed / totalCredit) * W_RECOVERY)
    );
    const bounded = clamp(lift, 1, 100 - score || 1);
    return `Collect from ${topDebtor.name} to raise your score by ${bounded} point${bounded !== 1 ? "s" : ""}`;
  }

  if (score >= 85) return "Great work — your shop's credit is healthy";
  return "Keep recording payments to improve your score";
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function computeHealthScore(
  entries: LedgerEntry[],
  customers: Customer[],
  flags: AnomalyFlag[]
): HealthScore {
  const recovery = recoveryHealth(entries);
  const overdue = overdueHealth(entries, customers);
  const risk = riskHealth(customers, entries);
  const fraud = fraudHealth(flags);

  const score = Math.round(
    clamp(
      (recovery.value * W_RECOVERY +
        overdue.value * W_OVERDUE +
        risk.value * W_RISK +
        fraud * W_FRAUD) /
        100
    )
  );

  const label: HealthLabel =
    score >= 75 ? "Healthy" : score >= 50 ? "Needs Attention" : "At Risk";

  const factors: HealthFactor[] = [
    {
      key: "recovery",
      label: "Credit recovered",
      value: Math.round(recovery.value),
      detail: recovery.detail,
    },
    {
      key: "overdue",
      label: "On-time payments",
      value: Math.round(overdue.value),
      detail: overdue.detail,
    },
    {
      key: "risk",
      label: "Customer reliability",
      value: Math.round(risk.value),
      detail: risk.detail,
    },
  ];

  return {
    score,
    label,
    factors,
    tip: buildTip(customers, entries, flags, score),
    subtitle: "Your shop's financial health — a credit profile for future loans.",
  };
}
