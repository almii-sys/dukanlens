// ─── Shop Profile ────────────────────────────────────────────────────────────

export interface ShopProfile {
  id: string; // uuid generated on creation
  shopName: string;
  ownerName: string;
  city: string;
  phone: string; // 03xx format, stored as-is
  shopType: "Kiryana" | "General Store" | "Pharmacy" | "Other";
  registerLanguage: "Urdu" | "English" | "Mixed" | "Other";
  createdAt: string; // ISO date
}

// ─── Ledger ───────────────────────────────────────────────────────────────────

export type EntryStatus = "unpaid" | "paid" | "partial";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface LedgerEntry {
  id: string;
  customerId: string;
  customerName: string;
  nameUrdu: string | null;
  amount: number;
  type: "credit" | "debit"; // credit = udhaar given, debit = payment received
  date: string | null; // ISO date string
  note: string | null;
  status: EntryStatus;
  confidence: ConfidenceLevel;
  rawText: string | null; // original text from scan
  createdAt: string;
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export type TrustLabel = "Reliable" | "Watch" | "High Risk";

export interface TrustScore {
  score: number; // 0–100
  label: TrustLabel;
  reason: string;
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  nameUrdu: string | null;
  phone: string | null; // WhatsApp number, 92xx format
  totalOwed: number; // computed from entries
  lastEntryDate: string | null;
  remindersSent: number;
  paymentsMade: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Scan Result (from Gemini API) ───────────────────────────────────────────

export interface ScannedEntry {
  customerName: string;
  nameUrdu: string | null;
  amount: number | null;
  date: string | null;
  note: string | null;
  status: "unpaid" | "paid" | "unclear";
  confidence: ConfidenceLevel;
  rawText: string | null;
}

export interface KhataApiResponse {
  entries: ScannedEntry[];
  pageNotes: string | null;
}

// ─── Shelf / Stock ────────────────────────────────────────────────────────────

export type StockLevel = "full" | "low" | "empty";

export interface ShelfItem {
  id: string;
  shopId: string;
  name: string;
  brand: string | null;
  size: string | null;
  stockLevel: StockLevel;
  reorderQty: number;
  confidence: ConfidenceLevel;
  scannedAt: string;
}
