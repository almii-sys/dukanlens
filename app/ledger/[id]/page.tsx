"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Phone, MessageCircle, CreditCard,
  ShieldCheck, AlertTriangle, ShieldAlert,
  History, Send, X, CheckCircle2
} from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import {
  getActiveShop, getCustomer, getEntriesForCustomer,
  computeTrustScore, recordPayment, updateCustomerPhone,
  incrementReminderCount,
} from "@/lib/storage";
import type { Customer, LedgerEntry, TrustScore, ShopProfile } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

function buildWhatsAppMessage(customer: Customer, shopName: string) {
  const roman = `Assalam o Alaikum ${customer.name} bhai,\n\nUmeed hai aap theek honge. ${shopName} ki taraf se aapka Rs ${customer.totalOwed.toLocaleString()} ka balance pending hai.\n\nKripaya jaldi payment ka intazam karein. Shukriya! 🙏`;
  const urdu = `السلام علیکم ${customer.name}،\n\n${shopName} کی طرف سے آپ کا Rs ${customer.totalOwed.toLocaleString()} باقی ہے۔ براہ کرم جلد ادائیگی کریں۔ شکریہ`;
  return { roman, urdu };
}

export default function CustomerDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [trust, setTrust] = useState<TrustScore | null>(null);
  const [ready, setReady] = useState(false);

  // Modals
  const [showPayment, setShowPayment] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDone, setPaymentDone] = useState(false);

  // Reminder
  const [reminderPhone, setReminderPhone] = useState("");
  const [reminderMsg, setReminderMsg] = useState<{ roman: string; urdu: string } | null>(null);
  const [activeMsg, setActiveMsg] = useState<"roman" | "urdu">("roman");

  function reload() {
    const profile = getActiveShop();
    if (!profile) { router.replace("/onboarding"); return; }
    setShop(profile);
    const c = getCustomer(profile.id, id);
    if (!c) { router.replace("/ledger"); return; }
    setCustomer(c);
    const e = getEntriesForCustomer(profile.id, id);
    setEntries(e);
    setTrust(computeTrustScore(c, e));
    if (c.phone) setReminderPhone(c.phone);
    setReady(true);
  }

  useEffect(() => { reload(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || !customer || !shop) return null;

  function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;
    recordPayment(shop!.id, customer!.id, amount);
    setPaymentDone(true);
    setPaymentAmount("");
    reload();
    setTimeout(() => { setPaymentDone(false); setShowPayment(false); }, 1800);
  }

  function handleSendReminder() {
    if (!reminderPhone.trim()) {
      setShowPhonePrompt(true);
      return;
    }
    if (!customer || !shop) return;
    const msgs = buildWhatsAppMessage(customer, shop.shopName);
    setReminderMsg(msgs);

    // Save phone if changed
    if (reminderPhone !== customer.phone) {
      updateCustomerPhone(shop.id, customer.id, reminderPhone);
    }
    setShowReminder(true);
  }

  function handleSavePhoneAndProceed() {
    if (!reminderPhone.trim() || !shop || !customer) return;
    updateCustomerPhone(shop.id, customer.id, reminderPhone);
    const msgs = buildWhatsAppMessage(customer, shop.shopName);
    setReminderMsg(msgs);
    setShowPhonePrompt(false);
    setShowReminder(true);
  }

  function openWhatsApp() {
    if (!reminderMsg || !shop || !customer) return;
    const text = activeMsg === "roman" ? reminderMsg.roman : reminderMsg.urdu;
    const phone = reminderPhone.replace(/\D/g, "").replace(/^0/, "92");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    incrementReminderCount(shop.id, customer.id);
    reload();
    setShowReminder(false);
  }

  const trustIcon = trust?.label === "Reliable"
    ? <ShieldCheck size={18} color="#059669" />
    : trust?.label === "Watch"
    ? <AlertTriangle size={18} color="#d97706" />
    : <ShieldAlert size={18} color="#dc2626" />;

  const trustBg = trust?.label === "Reliable" ? "#f0fdf4" : trust?.label === "Watch" ? "#fffbeb" : "#fff5f5";
  const trustBorder = trust?.label === "Reliable" ? "#6ee7b7" : trust?.label === "Watch" ? "#fcd34d" : "#fca5a5";
  const trustColor = trust?.label === "Reliable" ? "#065f46" : trust?.label === "Watch" ? "#92400e" : "#991b1b";

  return (
    <div className="page-content" style={{ backgroundColor: "var(--color-cream)" }}>
      {/* Header */}
      <header style={{ backgroundColor: "var(--color-teal)", padding: "16px 20px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <Link href="/ledger" style={{ color: "white", display: "flex" }}>
            <ChevronLeft size={24} />
          </Link>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.8 }}>{shop.shopName}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 700, flexShrink: 0 }}>
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: "0 0 2px", fontSize: "20px", fontWeight: 700 }}>{customer.name}</h1>
            {customer.nameUrdu && (
              <p className="font-urdu" style={{ margin: "0 0 4px", fontSize: "15px", opacity: 0.9, direction: "rtl" }}>
                {customer.nameUrdu}
              </p>
            )}
            {customer.phone && (
              <p style={{ margin: 0, fontSize: "13px", opacity: 0.8, display: "flex", alignItems: "center", gap: "4px" }}>
                <Phone size={12} /> {customer.phone}
              </p>
            )}
          </div>
        </div>
      </header>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* Balance card */}
        <Card style={{ padding: "20px" }}>
          <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
            Outstanding Balance
          </p>
          <p style={{ margin: "0 0 16px", fontSize: "32px", fontWeight: 700, color: customer.totalOwed > 0 ? "var(--color-teal)" : "#059669" }}>
            Rs {customer.totalOwed.toLocaleString()}
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button variant="primary" size="md" style={{ flex: 1 }} onClick={() => setShowPayment(true)}>
              <CreditCard size={16} /> Record Payment
            </Button>
            <Button variant="secondary" size="md" style={{ flex: 1 }} onClick={handleSendReminder}>
              <Send size={16} /> Send Reminder
            </Button>
          </div>
        </Card>

        {/* Trust Score */}
        {trust && (
          <Card style={{ padding: "16px", backgroundColor: trustBg, border: `1px solid ${trustBorder}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {trustIcon}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 700, color: trustColor, fontSize: "15px" }}>
                    {trust.label}
                  </span>
                  <Badge variant={trust.label === "Reliable" ? "green" : trust.label === "Watch" ? "amber" : "red"} style={{ fontSize: "10px" }}>
                    Score: {trust.score}/100
                  </Badge>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: trustColor }}>{trust.reason}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          {[
            { label: "Entries", value: entries.length },
            { label: "Payments", value: customer.paymentsMade },
            { label: "Reminders", value: customer.remindersSent },
          ].map((s) => (
            <Card key={s.label} style={{ padding: "12px", textAlign: "center" }}>
              <p style={{ margin: "0 0 2px", fontSize: "20px", fontWeight: 700, color: "var(--color-charcoal)" }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Entry history */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <History size={16} color="#6b7280" />
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--color-charcoal)" }}>
              Transaction History
            </p>
          </div>
          {entries.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: "14px", textAlign: "center", padding: "20px" }}>No entries yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {entries.map((entry) => (
                <Card key={entry.id} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                    backgroundColor: entry.type === "credit" ? "#f59e0b" : "#10b981",
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 500, color: "var(--color-charcoal)" }}>
                      {entry.note ?? (entry.type === "credit" ? "Udhaar" : "Payment received")}
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
                      {entry.date ? new Date(entry.date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "No date"}
                      {" · "}
                      <span style={{ textTransform: "capitalize" }}>{entry.status}</span>
                    </p>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "15px", color: entry.type === "credit" ? "#d97706" : "#059669", flexShrink: 0 }}>
                    {entry.type === "credit" ? "+" : "-"}Rs {entry.amount.toLocaleString()}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment Modal ── */}
      {showPayment && (
        <ModalOverlay onClose={() => setShowPayment(false)}>
          <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 700 }}>Record Payment</h2>
          <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#6b7280" }}>
            {customer.name} — Rs {customer.totalOwed.toLocaleString()} pending
          </p>
          {paymentDone ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <CheckCircle2 size={40} color="#059669" style={{ margin: "0 auto 8px" }} />
              <p style={{ fontWeight: 600, color: "#065f46" }}>Payment recorded!</p>
            </div>
          ) : (
            <form onSubmit={handlePayment}>
              <label style={modalLabelStyle}>Amount (Rs)</label>
              <input
                type="number"
                autoFocus
                required
                min="1"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                style={modalInputStyle}
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <Button variant="ghost" size="md" style={{ flex: 1 }} type="button" onClick={() => setShowPayment(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" style={{ flex: 2 }} type="submit" disabled={!paymentAmount}>
                  Save Payment
                </Button>
              </div>
            </form>
          )}
        </ModalOverlay>
      )}

      {/* ── Phone prompt ── */}
      {showPhonePrompt && (
        <ModalOverlay onClose={() => setShowPhonePrompt(false)}>
          <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 700 }}>Phone number?</h2>
          <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#6b7280" }}>
            {customer.name} ka WhatsApp number daalen — hum yaad rakh lenge.
          </p>
          <label style={modalLabelStyle}>WhatsApp Number</label>
          <input
            type="tel"
            autoFocus
            value={reminderPhone}
            onChange={(e) => setReminderPhone(e.target.value)}
            placeholder="03xx-xxxxxxx"
            style={modalInputStyle}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <Button variant="ghost" size="md" style={{ flex: 1 }} onClick={() => setShowPhonePrompt(false)}>Cancel</Button>
            <Button variant="primary" size="md" style={{ flex: 2 }} disabled={!reminderPhone.trim()} onClick={handleSavePhoneAndProceed}>
              <MessageCircle size={16} /> Continue
            </Button>
          </div>
        </ModalOverlay>
      )}

      {/* ── Reminder preview modal ── */}
      {showReminder && reminderMsg && (
        <ModalOverlay onClose={() => setShowReminder(false)}>
          <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 700 }}>Send Reminder</h2>
          <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#6b7280" }}>
            WhatsApp par yeh message jayega:
          </p>

          {/* Tab toggle */}
          <div style={{ display: "flex", gap: "0", marginBottom: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
            {(["roman", "urdu"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveMsg(tab)}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: activeMsg === tab ? "var(--color-teal)" : "white",
                  color: activeMsg === tab ? "white" : "#6b7280",
                  transition: "background 0.15s",
                }}
              >
                {tab === "roman" ? "Roman Urdu" : "اردو"}
              </button>
            ))}
          </div>

          <div style={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "14px",
            fontSize: "14px",
            lineHeight: "1.6",
            color: "var(--color-charcoal)",
            direction: activeMsg === "urdu" ? "rtl" : "ltr",
            fontFamily: activeMsg === "urdu" ? "var(--font-urdu)" : undefined,
            whiteSpace: "pre-wrap",
            marginBottom: "16px",
            maxHeight: "160px",
            overflowY: "auto",
          }}>
            {activeMsg === "roman" ? reminderMsg.roman : reminderMsg.urdu}
          </div>

          <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#9ca3af" }}>
            To: {reminderPhone}
          </p>

          <div style={{ display: "flex", gap: "10px" }}>
            <Button variant="ghost" size="md" style={{ flex: 1 }} onClick={() => setShowReminder(false)}>Cancel</Button>
            <Button variant="primary" size="md" style={{ flex: 2 }} onClick={openWhatsApp}>
              <MessageCircle size={16} /> Open WhatsApp
            </Button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 100,
        maxWidth: "480px",
        margin: "0 auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          backgroundColor: "white",
          borderRadius: "20px 20px 0 0",
          padding: "24px 20px 32px",
          maxHeight: "90dvh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
            <X size={20} color="#9ca3af" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const modalLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--color-charcoal)",
  marginBottom: "8px",
};

const modalInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  fontSize: "16px",
  color: "var(--color-charcoal)",
  backgroundColor: "white",
  outline: "none",
};