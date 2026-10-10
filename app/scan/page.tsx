"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw, PenLine, CheckCircle2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { CameraUpload } from "@/components/CameraUpload";
import { ScanLoader } from "@/components/ScanLoader";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { compressImage, splitDataUrl } from "@/lib/image";
import {
  getActiveShop,
  saveLedgerEntries,
  findOrCreateCustomer,
  generateId,
  getLedgerEntries,
  getCustomers,
} from "@/lib/storage";
import { detectAnomalies, countFlaggedAmong } from "@/lib/anomaly";
import type { ScannedEntry, LedgerEntry, ConfidenceLevel } from "@/lib/types";

type ScanState = "idle" | "scanning" | "done" | "error";

interface EditableEntry extends ScannedEntry {
  _key: string;
  _include: boolean;
}

export default function ScanPage() {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [entries, setEntries] = useState<EditableEntry[]>([]);
  const [pageNotes, setPageNotes] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [flaggedCount, setFlaggedCount] = useState(0);

  const handleFile = useCallback(async (file: File) => {
    setSaved(false);
    setScanState("scanning");
    setErrorMsg("");
    setEntries([]);

    let dataUrl: string;
    try {
      dataUrl = await compressImage(file);
    } catch {
      setErrorMsg("Could not read the image. Please try a different photo.");
      setScanState("error");
      return;
    }

    setPreviewUrl(dataUrl);

    const { base64, mimeType } = splitDataUrl(dataUrl);

    try {
      const res = await fetch("/api/khata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      const json = await res.json() as { entries?: ScannedEntry[]; pageNotes?: string | null; error?: string };

      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Scan failed");
      }

      const editable: EditableEntry[] = (json.entries ?? []).map((e) => ({
        ...e,
        _key: generateId(),
        _include: e.status !== "paid", // default: include unpaid entries
      }));

      setEntries(editable);
      setPageNotes(json.pageNotes ?? null);
      setScanState("done");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "AI scan failed. Please try again."
      );
      setScanState("error");
    }
  }, []);

  function updateEntry(key: string, field: keyof ScannedEntry, value: unknown) {
    setEntries((prev) =>
      prev.map((e) => (e._key === key ? { ...e, [field]: value } : e))
    );
  }

  function toggleInclude(key: string) {
    setEntries((prev) =>
      prev.map((e) => (e._key === key ? { ...e, _include: !e._include } : e))
    );
  }

  function handleRetry() {
    setPreviewUrl(null);
    setScanState("idle");
    setErrorMsg("");
    setEntries([]);
    setFlaggedCount(0);
  }

  async function handleSave() {
    const shop = getActiveShop();
    if (!shop) {
      router.push("/onboarding");
      return;
    }

    const toSave = entries.filter((e) => e._include && (e.amount ?? 0) > 0 && e.customerName.trim());
    if (toSave.length === 0) return;

    setSaving(true);
    const now = new Date().toISOString();

    const ledgerEntries: LedgerEntry[] = toSave.map((e) => {
      const customer = findOrCreateCustomer(shop.id, e.customerName.trim(), e.nameUrdu);
      return {
        id: generateId(),
        customerId: customer.id,
        customerName: e.customerName.trim(),
        nameUrdu: e.nameUrdu,
        amount: e.amount ?? 0,
        type: e.status === "paid" ? "debit" : "credit",
        date: e.date,
        note: e.note,
        status: e.status === "paid" ? "paid" : e.status === "unclear" ? "partial" : "unpaid",
        confidence: e.confidence as ConfidenceLevel,
        rawText: e.rawText,
        createdAt: now,
      };
    });

    saveLedgerEntries(shop.id, ledgerEntries);

    // Run a local anomaly check over the full ledger and count how many of
    // the entries we just added were flagged.
    const allEntries = getLedgerEntries(shop.id);
    const allCustomers = getCustomers(shop.id);
    const flags = detectAnomalies(allEntries, allCustomers);
    setFlaggedCount(countFlaggedAmong(flags, ledgerEntries.map((e) => e.id)));

    setSaving(false);
    setSaved(true);
  }

  const includedCount = entries.filter((e) => e._include).length;

  return (
    <div className="page-content" style={{ backgroundColor: "var(--color-cream)" }}>
      {/* Header */}
      <header style={{ backgroundColor: "var(--color-teal)", padding: "16px 20px", color: "white", display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href="/" style={{ color: "white", display: "flex" }}>
          <ChevronLeft size={24} />
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Smart Ledger Scan</h1>
          <p style={{ margin: 0, fontSize: "12px", opacity: 0.8 }}>Add entries from a ledger photo</p>
        </div>
      </header>

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Camera / Preview */}
        {scanState === "scanning" && previewUrl ? (
          <ScanLoader previewUrl={previewUrl} />
        ) : scanState === "done" && previewUrl ? (
          <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Scanned ledger"
              style={{ width: "100%", maxHeight: "220px", objectFit: "cover", display: "block" }}
            />
            <button
              onClick={handleRetry}
              style={{
                position: "absolute", top: "10px", right: "10px",
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 12px", backgroundColor: "rgba(0,0,0,0.55)",
                color: "white", border: "none", borderRadius: "8px",
                fontSize: "12px", fontWeight: 600, cursor: "pointer",
              }}
            >
              <RefreshCw size={13} /> New Scan
            </button>
          </div>
        ) : (
          <CameraUpload
            onFile={handleFile}
            disabled={scanState === "scanning"}
            previewUrl={scanState === "idle" ? null : previewUrl}
          />
        )}

        {/* Error state */}
        {scanState === "error" && (
          <Card style={{ padding: "20px", border: "1px solid #fca5a5", backgroundColor: "#fff5f5" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "16px" }}>
              <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: "1px" }} />
              <div>
                <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#991b1b", fontSize: "15px" }}>
                  Couldn&apos;t read this page
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#7f1d1d" }}>{errorMsg}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Button variant="primary" size="sm" onClick={handleRetry}>
                <RefreshCw size={15} /> Retry
              </Button>
              <Link href="/ledger">
                <Button variant="ghost" size="sm">
                  <PenLine size={15} /> Enter Manually
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Results table */}
        {scanState === "done" && entries.length === 0 && (
          <Card style={{ padding: "24px", textAlign: "center" }}>
            <p style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--color-charcoal)" }}>
              No entries found
            </p>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6b7280" }}>
              We couldn&apos;t find any ledger entries in this photo. Try again or enter them manually.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <Button variant="secondary" size="sm" onClick={handleRetry}>
                <RefreshCw size={14} /> Retry
              </Button>
              <Link href="/ledger">
                <Button variant="ghost" size="sm">
                  <PenLine size={14} /> Enter Manually
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {scanState === "done" && entries.length > 0 && (
          <>
            {pageNotes && (
              <p style={{ margin: 0, padding: "10px 14px", backgroundColor: "#f0f9ff", borderRadius: "8px", fontSize: "13px", color: "#0369a1", border: "1px solid #bae6fd" }}>
                📝 {pageNotes}
              </p>
            )}

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--color-charcoal)" }}>
                  Scan Results
                </p>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>
                  {includedCount} of {entries.length} selected
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {entries.map((entry) => {
                  const isLow = entry.confidence === "low";
                  const isMedium = entry.confidence === "medium";
                  const rowBg = !entry._include ? "#f9fafb" : isLow ? "#fffbeb" : "white";
                  const rowBorder = isLow ? "1px solid #f59e0b" : "1px solid #f0f0f0";

                  return (
                    <Card
                      key={entry._key}
                      style={{
                        padding: "14px",
                        backgroundColor: rowBg,
                        border: rowBorder,
                        opacity: entry._include ? 1 : 0.55,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={entry._include}
                          onChange={() => toggleInclude(entry._key)}
                          style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "var(--color-teal)", flexShrink: 0, cursor: "pointer" }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Name + confidence */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                            <input
                              value={entry.customerName}
                              onChange={(e) => updateEntry(entry._key, "customerName", e.target.value)}
                              style={{ ...editInputStyle, flex: 1, minWidth: "100px", fontWeight: 600 }}
                              placeholder="Customer name"
                            />
                            <ConfidenceBadge confidence={entry.confidence} />
                          </div>

                          {/* Amount + date */}
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: "80px" }}>
                              <label style={smallLabelStyle}>Amount (Rs)</label>
                              <input
                                type="number"
                                value={entry.amount ?? ""}
                                onChange={(e) => updateEntry(entry._key, "amount", e.target.value ? Number(e.target.value) : null)}
                                style={{
                                  ...editInputStyle,
                                  backgroundColor: (isLow || isMedium) && !entry.amount ? "#fef3cd" : undefined,
                                  borderColor: (isLow || isMedium) && !entry.amount ? "#f59e0b" : undefined,
                                }}
                                placeholder="0"
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: "100px" }}>
                              <label style={smallLabelStyle}>Date</label>
                              <input
                                type="date"
                                value={entry.date ?? ""}
                                onChange={(e) => updateEntry(entry._key, "date", e.target.value || null)}
                                style={editInputStyle}
                              />
                            </div>
                          </div>

                          {/* Note */}
                          {(entry.note || isLow) && (
                            <div style={{ marginTop: "8px" }}>
                              <label style={smallLabelStyle}>Note</label>
                              <input
                                value={entry.note ?? ""}
                                onChange={(e) => updateEntry(entry._key, "note", e.target.value || null)}
                                style={editInputStyle}
                                placeholder="e.g. sugar, flour, milk"
                              />
                            </div>
                          )}

                          {/* Raw text */}
                          {entry.rawText && (
                            <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#9ca3af", fontStyle: "italic" }}>
                              Original: {entry.rawText}
                            </p>
                          )}

                          {/* Status select */}
                          <div style={{ marginTop: "8px" }}>
                            <select
                              value={entry.status}
                              onChange={(e) => updateEntry(entry._key, "status", e.target.value)}
                              style={{ ...editInputStyle, fontSize: "12px", padding: "4px 8px" }}
                            >
                              <option value="unpaid">Unpaid</option>
                              <option value="paid">Paid</option>
                              <option value="unclear">Unclear</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Save / actions */}
            {saved ? (
              <Card style={{ padding: "20px", textAlign: "center", border: "1px solid #6ee7b7", backgroundColor: "#f0fdf4" }}>
                <CheckCircle2 size={32} color="#059669" style={{ margin: "0 auto 8px" }} />
                <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#065f46", fontSize: "16px" }}>Entries saved</p>
                <p style={{ margin: flaggedCount > 0 ? "0 0 12px" : "0 0 16px", fontSize: "13px", color: "#047857" }}>
                  {includedCount} entries added to your ledger.
                </p>
                {flaggedCount > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 16px", padding: "10px 12px", backgroundColor: "#fff3e0", border: "1px solid #f4c27f", borderRadius: "10px", textAlign: "left" }}>
                    <AlertCircle size={16} color="#b45309" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "#8a5a1a", fontWeight: 500 }}>
                      {flaggedCount} item{flaggedCount !== 1 ? "s" : ""} need review. See Alerts on Home.
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <Link href="/ledger">
                    <Button variant="primary" size="sm">View Ledger</Button>
                  </Link>
                  <Button variant="secondary" size="sm" onClick={handleRetry}>
                    Scan Another
                  </Button>
                </div>
              </Card>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={saving}
                  disabled={includedCount === 0}
                  onClick={handleSave}
                >
                  Save to Ledger ({includedCount})
                </Button>
                <Button variant="ghost" size="lg" onClick={handleRetry}>
                  <RefreshCw size={18} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const editInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid #e5e7eb",
  borderRadius: "7px",
  fontSize: "14px",
  color: "var(--color-charcoal)",
  backgroundColor: "white",
  outline: "none",
};

const smallLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  color: "#9ca3af",
  marginBottom: "3px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};