"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Store, Trash2, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { PageLoader } from "@/components/PageLoader";
import { Card } from "@/components/Card";
import { getActiveShop, deleteShop } from "@/lib/storage";
import type { ShopProfile } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setShop(getActiveShop());
    setReady(true);
  }, []);

  function handleReset() {
    if (!shop) return;
    if (window.confirm("All data for " + shop.shopName + " will be deleted. Are you sure?")) {
      deleteShop(shop.id);
      router.replace("/onboarding");
    }
  }

  if (!ready) return <PageLoader />;

  return (
    <div className="page-content page-enter" style={{ backgroundColor: "var(--color-cream)" }}>
      <PageHeader title="Settings" shopName={shop?.shopName} />
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {shop && (
          <Card style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "#e0f2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Store size={22} color="var(--color-teal)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "16px", color: "var(--color-charcoal)" }}>{shop.shopName}</p>
                <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>{shop.ownerName} - {shop.city || "City not set"}</p>
              </div>
              <ChevronRight size={18} color="#9ca3af" />
            </div>
          </Card>
        )}
        <Card style={{ padding: "16px 20px" }}>
          <p style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>About</p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Settings size={18} color="#6b7280" />
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "var(--color-charcoal)" }}>Nigraan v0.1</p>
              <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>Snap your ledger. Guard your shop.</p>
            </div>
          </div>
        </Card>
        <Card onClick={handleReset} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", border: "1px solid #fca5a5", backgroundColor: "#fff5f5" }}>
          <Trash2 size={18} color="#dc2626" />
          <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#dc2626" }}>Delete shop data</p>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}