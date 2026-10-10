"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ScanLine,
  Package,
  BookOpen,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Lightbulb,
  Send,
  Wallet,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { PageLoader } from "@/components/PageLoader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { HealthRing } from "@/components/HealthRing";
import {
  getActiveShop,
  getCustomers,
  getLedgerEntries,
  getEntriesForCustomer,
  incrementReminderCount,
} from "@/lib/storage";
import { detectAnomalies, type AnomalyFlag } from "@/lib/anomaly";
import { computeHealthScore, type HealthScore } from "@/lib/health";
import type { ShopProfile, Customer, LedgerEntry } from "@/lib/types";

const actions = [
  { href: "/scan", icon: ScanLine, title: "Scan Ledger", sub: "Turn a register photo into a digital ledger", color: "var(--color-teal)", bg: "#e0f2f2" },
  { href: "/stock", icon: Package, title: "Scan Shelf", sub: "Turn a shelf photo into a restock order", color: "var(--color-saffron)", bg: "#fef3e0" },
  { href: "/ledger", icon: BookOpen, title: "View Ledger", sub: "Customers, credit and reminders", color: "var(--color-charcoal)", bg: "#eef0f1" },
];

interface Stats {
  totalOutstanding: number;
  customersOwing: number;
  collectedThisMonth: number;
}

interface CollectRow {
  customer: Customer;
  oldestDate: string | null;
}

function severityVariant(severity: AnomalyFlag["severity"]) {
  if (severity === "High") return "red" as const;
  if (severity === "Medium") return "amber" as const;
  return "gray" as const;
}

function computeStats(entries: LedgerEntry[], customers: Customer[]): Stats {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const collectedThisMonth = entries
    .filter((e) => {
      if (e.type !== "debit" || e.amount == null) return false;
      const d = new Date(e.createdAt);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((s, e) => s + e.amount, 0);

  const owing = customers.filter((c) => c.totalOwed > 0);
  return {
    totalOutstanding: owing.reduce((s, c) => s + c.totalOwed, 0),
    customersOwing: owing.length,
    collectedThisMonth,
  };
}

/** Top 3 customers by amount owed, with their oldest unpaid entry date. */
function collectToday(shopId: string, customers: Customer[]): CollectRow[] {
  return customers
    .filter((c) => c.totalOwed > 0)
    .sort((a, b) => {
      if (b.totalOwed !== a.totalOwed) return b.totalOwed - a.totalOwed;
      const ad = a.lastEntryDate ? new Date(a.lastEntryDate).getTime() : Infinity;
      const bd = b.lastEntryDate ? new Date(b.lastEntryDate).getTime() : Infinity;
      return ad - bd; // older first as a tiebreaker
    })
    .slice(0, 3)
    .map((c) => {
      const ce = getEntriesForCustomer(shopId, c.id);
      const unpaidDates = ce
        .filter((e) => e.type === "credit" && e.status !== "paid" && e.date)
        .map((e) => e.date!)
        .sort();
      return { customer: c, oldestDate: unpaidDates[0] ?? c.lastEntryDate ?? null };
    });
}

export default function HomePage() {
  const router = useRouter();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [flags, setFlags] = useState<AnomalyFlag[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [collect, setCollect] = useState<CollectRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getActiveShop();
    if (!s) {
      router.replace("/onboarding");
      return;
    }
    setShop(s);
    const entries = getLedgerEntries(s.id);
    const customers = getCustomers(s.id);
    const detected = detectAnomalies(entries, customers);
    setFlags(detected);
    setHealth(computeHealthScore(entries, customers, detected));
    setStats(computeStats(entries, customers));
    setCollect(collectToday(s.id, customers));
    setReady(true);
  }, [router]);

  if (!ready) return <PageLoader />;

  const barColor = (v: number) =>
    v >= 75 ? "var(--color-teal)" : v >= 50 ? "var(--color-saffron)" : "#dc2626";

  function handleReminder(e: React.MouseEvent, row: CollectRow) {
    e.preventDefault();
    e.stopPropagation();
    if (!shop) return;
    const c = row.customer;
    // With a saved phone we can open WhatsApp straight away; otherwise send
    // the user to the customer screen where the number is collected.
    if (c.phone) {
      const text = `Hello ${c.name},\n\nThis is a friendly reminder from ${shop.shopName}: your outstanding balance is Rs ${c.totalOwed.toLocaleString()}.\n\nPlease arrange the payment at your earliest convenience. Thank you!`;
      const phone = c.phone.replace(/\D/g, "").replace(/^0/, "92");
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
      incrementReminderCount(shop.id, c.id);
    } else {
      router.push("/ledger/" + c.id);
    }
  }

  const statCards = stats
    ? [
        { label: "Total Outstanding", value: "Rs " + stats.totalOutstanding.toLocaleString(), accent: "var(--color-teal)" },
        { label: "Customers Owing", value: String(stats.customersOwing), accent: "var(--color-charcoal)" },
        { label: "Collected This Month", value: "Rs " + stats.collectedThisMonth.toLocaleString(), accent: "#059669" },
      ]
    : [];

  return (
    <div className="page-content page-enter" style={{ backgroundColor: "var(--color-cream)" }}>
      <PageHeader title="Nigraan" shopName={shop?.shopName} />
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "14px", color: "#6b7280" }}>Welcome back{shop?.ownerName ? ", " + shop.ownerName : ""}</p>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "var(--color-charcoal)" }}>Snap your ledger. Guard your shop.</h1>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          {statCards.map((s) => (
            <Card key={s.label} style={{ padding: "12px 10px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 800, color: s.accent, lineHeight: 1.1 }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: "10.5px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.03em", lineHeight: 1.3 }}>{s.label}</p>
            </Card>
          ))}
        </div>

        {/* ── Shop Health Score ── */}
        {health && (
          <Card style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "16px", color: "var(--color-charcoal)" }}>Shop Health Score</p>
              <Badge
                variant={
                  health.label === "Healthy" ? "green" : health.label === "Needs Attention" ? "amber" : "red"
                }
              >
                {health.label}
              </Badge>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#9ca3af" }}>{health.subtitle}</p>

            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <HealthRing score={health.score} label={health.label} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                {health.factors.map((f) => (
                  <div key={f.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-charcoal)" }}>{f.label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: barColor(f.value) }}>{f.value}</span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "3px", backgroundColor: "#eef0f1", overflow: "hidden" }}>
                      <div style={{ width: `${f.value}%`, height: "100%", backgroundColor: barColor(f.value), borderRadius: "3px", transition: "width 0.6s ease" }} />
                    </div>
                    <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#9ca3af" }}>{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "16px", padding: "10px 12px", backgroundColor: "#fef3e0", borderRadius: "10px" }}>
              <Lightbulb size={16} color="var(--color-saffron)" style={{ flexShrink: 0, marginTop: "1px" }} />
              <p style={{ margin: 0, fontSize: "13px", color: "#8a5a1a", fontWeight: 500 }}>{health.tip}</p>
            </div>
          </Card>
        )}

        {/* ── Alerts ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <ShieldAlert size={16} color="var(--color-charcoal)" />
            <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "var(--color-charcoal)" }}>Alerts</p>
            {flags.length > 0 && (
              <Badge variant="red" style={{ marginLeft: "auto" }}>{flags.length}</Badge>
            )}
          </div>

          {flags.length === 0 ? (
            <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <ShieldCheck size={22} color="var(--color-teal)" />
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>No unusual activity</p>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {flags.map((flag) => {
                const body = (
                  <Card style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ paddingTop: "1px" }}>
                      <Badge variant={severityVariant(flag.severity)} style={{ fontSize: "10px" }}>{flag.severity}</Badge>
                    </div>
                    <p style={{ margin: 0, flex: 1, fontSize: "13px", color: "var(--color-charcoal)", lineHeight: 1.45 }}>{flag.reason}</p>
                    {flag.customerId && <ChevronRight size={16} color="#9ca3af" style={{ flexShrink: 0, marginTop: "2px" }} />}
                  </Card>
                );
                return flag.customerId ? (
                  <Link key={flag.id} href={"/ledger/" + flag.customerId} style={{ textDecoration: "none" }}>
                    {body}
                  </Link>
                ) : (
                  <div key={flag.id}>{body}</div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Collect Today ── */}
        {collect.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Wallet size={16} color="var(--color-charcoal)" />
              <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "var(--color-charcoal)" }}>Collect Today</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {collect.map((row) => (
                <Card key={row.customer.id} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <Link
                    href={"/ledger/" + row.customer.id}
                    style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0, textDecoration: "none" }}
                  >
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#e0f2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "15px", fontWeight: 700, color: "var(--color-teal)" }}>
                      {row.customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: "14px", color: "var(--color-charcoal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.customer.name}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
                        Rs {row.customer.totalOwed.toLocaleString()}
                        {row.oldestDate ? " · since " + new Date(row.oldestDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" }) : ""}
                      </p>
                    </div>
                  </Link>
                  <Button variant="secondary" size="sm" onClick={(e) => handleReminder(e, row)} style={{ flexShrink: 0 }}>
                    <Send size={14} /> Remind
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick actions ── */}
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.href} href={a.href} style={{ textDecoration: "none" }}>
              <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", backgroundColor: a.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={24} color={a.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "16px", color: "var(--color-charcoal)" }}>{a.title}</p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>{a.sub}</p>
                </div>
                <ChevronRight size={18} color="#9ca3af" />
              </Card>
            </Link>
          );
        })}
      </div>
      <BottomNav />
    </div>
  );
}
