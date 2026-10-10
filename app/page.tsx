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
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { HealthRing } from "@/components/HealthRing";
import { getActiveShop, getCustomers, getLedgerEntries } from "@/lib/storage";
import { detectAnomalies, type AnomalyFlag } from "@/lib/anomaly";
import { computeHealthScore, type HealthScore } from "@/lib/health";
import type { ShopProfile } from "@/lib/types";

const actions = [
  { href: "/scan", icon: ScanLine, title: "Scan Ledger", sub: "Turn a register photo into a digital ledger", color: "var(--color-teal)", bg: "#e0f2f2" },
  { href: "/stock", icon: Package, title: "Scan Shelf", sub: "Turn a shelf photo into a restock order", color: "var(--color-saffron)", bg: "#fef3e0" },
  { href: "/ledger", icon: BookOpen, title: "View Ledger", sub: "Customers, credit and reminders", color: "var(--color-charcoal)", bg: "#eef0f1" },
];

function severityVariant(severity: AnomalyFlag["severity"]) {
  if (severity === "High") return "red" as const;
  if (severity === "Medium") return "amber" as const;
  return "gray" as const;
}

export default function HomePage() {
  const router = useRouter();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [flags, setFlags] = useState<AnomalyFlag[]>([]);
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
    setReady(true);
  }, [router]);

  if (!ready) return null;

  const barColor = (v: number) =>
    v >= 75 ? "var(--color-teal)" : v >= 50 ? "var(--color-saffron)" : "#dc2626";

  return (
    <div className="page-content" style={{ backgroundColor: "var(--color-cream)" }}>
      <PageHeader title="Nigraan" shopName={shop?.shopName} />
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "14px", color: "#6b7280" }}>Welcome back{shop?.ownerName ? ", " + shop.ownerName : ""}</p>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "var(--color-charcoal)" }}>Snap your ledger. Guard your shop.</h1>
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
