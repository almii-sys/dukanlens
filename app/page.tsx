"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScanLine, Package, BookOpen, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { getActiveShop } from "@/lib/storage";
import type { ShopProfile } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getActiveShop();
    if (!s) {
      router.replace("/onboarding");
      return;
    }
    setShop(s);
    setReady(true);
  }, [router]);

  if (!ready) return null;

  const actions = [
    { href: "/scan", icon: ScanLine, title: "Scan Ledger", sub: "Turn a register photo into a digital ledger", color: "var(--color-teal)", bg: "#e0f2f2" },
    { href: "/stock", icon: Package, title: "Scan Shelf", sub: "Turn a shelf photo into a restock order", color: "var(--color-saffron)", bg: "#fef3e0" },
    { href: "/ledger", icon: BookOpen, title: "View Ledger", sub: "Customers, credit and reminders", color: "var(--color-charcoal)", bg: "#eef0f1" },
  ];

  return (
    <div className="page-content" style={{ backgroundColor: "var(--color-cream)" }}>
      <PageHeader title="Nigraan" shopName={shop?.shopName} />
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "14px", color: "#6b7280" }}>Welcome back{shop?.ownerName ? ", " + shop.ownerName : ""}</p>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "var(--color-charcoal)" }}>Snap your ledger. Guard your shop.</h1>
        </div>
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