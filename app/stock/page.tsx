"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { getActiveShop } from "@/lib/storage";
import type { ShopProfile } from "@/lib/types";

export default function StockPage() {
  const [shop, setShop] = useState<ShopProfile | null>(null);
  useEffect(() => {
    setShop(getActiveShop());
  }, []);

  return (
    <div className="page-content" style={{ backgroundColor: "var(--color-cream)" }}>
      <PageHeader title="Stock Scanner" shopName={shop?.shopName} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", textAlign: "center", gap: "16px" }}>
        <div style={{ width: "72px", height: "72px", borderRadius: "20px", backgroundColor: "#fef3e0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Package size={36} color="var(--color-saffron)" />
        </div>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--color-charcoal)" }}>Coming Soon</h2>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px", maxWidth: "240px" }}>
          Track your stock automatically from a shelf photo - this feature is coming soon!
        </p>
      </div>
      <BottomNav />
    </div>
  );
}