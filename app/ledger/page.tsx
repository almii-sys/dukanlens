"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScanLine, ChevronRight, Users, AlertCircle } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { getActiveShop, getCustomers, getLedgerEntries, computeTrustScore } from "@/lib/storage";
import type { Customer, ShopProfile } from "@/lib/types";

interface CustomerWithScore extends Customer {
  trustLabel: "Reliable" | "Watch" | "High Risk";
}

export default function LedgerPage() {
  const router = useRouter();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [customers, setCustomers] = useState<CustomerWithScore[]>([]);
  const [totalOwed, setTotalOwed] = useState(0);
  const [ready, setReady] = useState(false);

  const load = useCallback(() => {
    const profile = getActiveShop();
    if (!profile) {
      router.replace("/onboarding");
      return;
    }
    setShop(profile);
    const all = getCustomers(profile.id);
    const entries = getLedgerEntries(profile.id);
    const withScores: CustomerWithScore[] = all
      .filter((c) => c.totalOwed > 0 || c.lastEntryDate)
      .map((c) => {
        const ce = entries.filter((e) => e.customerId === c.id);
        const trust = computeTrustScore(c, ce);
        return { ...c, trustLabel: trust.label };
      })
      .sort((a, b) => b.totalOwed - a.totalOwed);
    setCustomers(withScores);
    setTotalOwed(withScores.reduce((s, c) => s + c.totalOwed, 0));
    setReady(true);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (!ready) return null;

  const trustBadgeVariant = (label: CustomerWithScore["trustLabel"]) => {
    if (label === "Reliable") return "green" as const;
    if (label === "Watch") return "amber" as const;
    return "red" as const;
  };

  return (
    <div className="page-content" style={{ backgroundColor: "var(--color-cream)" }}>
      <PageHeader
        title="Khata / Ledger"
        shopName={shop?.shopName}
        action={
          <Link href="/scan" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(255,255,255,0.2)", padding: "8px 14px", borderRadius: "10px" }}>
              <ScanLine size={16} color="white" />
              <span style={{ color: "white", fontSize: "13px", fontWeight: 600 }}>Scan</span>
            </div>
          </Link>
        }
      />
      <div style={{ padding: "16px 16px 8px" }}>
        <Card style={{ padding: "16px 20px", background: "linear-gradient(135deg, var(--color-teal) 0%, var(--color-teal-light) 100%)", border: "none" }}>
          <p style={{ margin: "0 0 4px", fontSize: "12px", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
            Total Outstanding
          </p>
          <p style={{ margin: "0 0 4px", fontSize: "28px", fontWeight: 700, color: "white" }}>
            Rs {totalOwed.toLocaleString()}
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
            {customers.length} customer{customers.length !== 1 ? "s" : ""} with pending balance
          </p>
        </Card>
      </div>
      <div style={{ padding: "8px 16px" }}>
        {customers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <Users size={48} color="#d1d5db" style={{ margin: "0 auto 16px" }} />
            <p style={{ margin: "0 0 8px", fontSize: "17px", fontWeight: 600, color: "var(--color-charcoal)" }}>
              Abhi koi entry nahi hai
            </p>
            <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#6b7280" }}>
              Khata photo scan karein ya manually entry karein
            </p>
            <Link href="/scan">
              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  backgroundColor: "var(--color-teal)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <ScanLine size={18} /> Scan Karein
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {customers.map((customer) => (
              <Link key={customer.id} href={"/ledger/" + customer.id} style={{ textDecoration: "none" }}>
                <Card style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      backgroundColor: "#e0f2f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--color-teal)",
                    }}
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--color-charcoal)",
                          fontSize: "15px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {customer.name}
                      </span>
                      {customer.trustLabel !== "Reliable" && (
                        <Badge variant={trustBadgeVariant(customer.trustLabel)} style={{ fontSize: "10px", padding: "2px 7px" }}>
                          {customer.trustLabel}
                        </Badge>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "13px", color: "#6b7280" }}>
                        {customer.lastEntryDate
                          ? new Date(customer.lastEntryDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })
                          : "No date"}
                      </span>
                      {customer.remindersSent > 0 && (
                        <span style={{ fontSize: "11px", color: "#f59e0b", display: "flex", alignItems: "center", gap: "3px" }}>
                          <AlertCircle size={11} /> {customer.remindersSent} reminder{customer.remindersSent !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "16px", color: "var(--color-teal)" }}>
                      Rs {customer.totalOwed.toLocaleString()}
                    </p>
                    <ChevronRight size={16} color="#9ca3af" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}