"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, User, Phone, MapPin } from "lucide-react";
import { saveShop, generateId } from "@/lib/storage";
import type { ShopProfile } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    city: "",
    phone: "",
    shopType: "Kiryana" as ShopProfile["shopType"],
    registerLanguage: "Mixed" as ShopProfile["registerLanguage"],
  });
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (!form.shopName.trim()) return;
    setStep(2);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ownerName.trim()) return;
    setSubmitting(true);
    const profile: ShopProfile = {
      id: generateId(),
      shopName: form.shopName.trim(),
      ownerName: form.ownerName.trim(),
      city: form.city.trim(),
      phone: form.phone.trim(),
      shopType: form.shopType,
      registerLanguage: form.registerLanguage,
      createdAt: new Date().toISOString(),
    };
    saveShop(profile);
    router.replace("/");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", border: "1px solid #d1d5db",
    borderRadius: "10px", fontSize: "15px", color: "var(--color-charcoal)",
    backgroundColor: "white", outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "6px", fontSize: "13px",
    fontWeight: 600, color: "var(--color-charcoal)", marginBottom: "8px",
  };

  return (
    <div className="page-enter" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--color-cream)" }}>
      <div style={{ backgroundColor: "var(--color-teal)", padding: "40px 24px 32px", paddingTop: "calc(40px + var(--safe-top))", color: "white", textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Store size={32} color="white" />
        </div>
        <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 700 }}>Nigraan</h1>
        <p style={{ margin: 0, opacity: 0.85, fontSize: "14px" }}>Snap your ledger. Guard your shop.</p>
      </div>
      <div style={{ flex: 1, padding: "32px 24px" }}>
        {step === 1 ? (
          <form onSubmit={handleNext}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px", color: "var(--color-charcoal)" }}>Set up your shop</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 28px" }}>Start by entering your shop name</p>
            <label style={labelStyle}><Store size={16} color="var(--color-teal)" /> Shop name</label>
            <input required autoFocus value={form.shopName} onChange={(e) => update("shopName", e.target.value)} placeholder="e.g. Ali General Store" style={inputStyle} />
            <label style={{ ...labelStyle, marginTop: "20px" }}>Shop Type</label>
            <select value={form.shopType} onChange={(e) => update("shopType", e.target.value as ShopProfile["shopType"])} style={inputStyle}>
              <option value="Kiryana">Kiryana Store</option>
              <option value="General Store">General Store</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Other">Other</option>
            </select>
            <label style={{ ...labelStyle, marginTop: "20px" }}>Register language</label>
            <select value={form.registerLanguage} onChange={(e) => update("registerLanguage", e.target.value as ShopProfile["registerLanguage"])} style={inputStyle}>
              <option value="Mixed">Mixed (Urdu + English)</option>
              <option value="Urdu">Urdu only</option>
              <option value="English">English only</option>
              <option value="Other">Other</option>
            </select>
            <button type="submit" disabled={!form.shopName.trim()} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "14px", backgroundColor: "var(--color-teal)", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700, cursor: form.shopName.trim() ? "pointer" : "not-allowed", opacity: form.shopName.trim() ? 1 : 0.5, marginTop: "32px", boxSizing: "border-box" }}>Continue</button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px", color: "var(--color-charcoal)" }}>About you</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 28px" }}>These details are optional but helpful</p>
            <label style={labelStyle}><User size={16} color="var(--color-teal)" /> Your name (owner)</label>
            <input required autoFocus value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} placeholder="e.g. Muhammad Ali" style={inputStyle} />
            <label style={{ ...labelStyle, marginTop: "20px" }}><MapPin size={16} color="var(--color-teal)" /> City (optional)</label>
            <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="e.g. Karachi" style={inputStyle} />
            <label style={{ ...labelStyle, marginTop: "20px" }}><Phone size={16} color="var(--color-teal)" /> Phone (optional)</label>
            <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="03xx-xxxxxxx" style={inputStyle} />
            <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: "14px", backgroundColor: "transparent", color: "var(--color-teal)", border: "2px solid var(--color-teal)", borderRadius: "12px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>Back</button>
              <button type="submit" disabled={submitting || !form.ownerName.trim()} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", padding: "14px", backgroundColor: "var(--color-teal)", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700, cursor: submitting || !form.ownerName.trim() ? "not-allowed" : "pointer", opacity: !form.ownerName.trim() || submitting ? 0.5 : 1 }}>{submitting ? "Saving..." : "Get started"}</button>
            </div>
          </form>
        )}
      </div>
      <div style={{ padding: "16px 24px", paddingBottom: "calc(32px + var(--safe-bottom))", display: "flex", justifyContent: "center", gap: "8px" }}>
        {[1, 2].map((s) => (<div key={s} style={{ width: s === step ? "24px" : "8px", height: "8px", borderRadius: "4px", backgroundColor: s === step ? "var(--color-teal)" : "#d1d5db", transition: "width 0.2s ease" }} />))}
      </div>
    </div>
  );
}