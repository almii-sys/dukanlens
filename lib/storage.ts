"use client";

import type {
  ShopProfile,
  Customer,
  LedgerEntry,
  ShelfItem,
  TrustScore,
  TrustLabel,
} from "./types";

// ─── Keys ─────────────────────────────────────────────────────────────────────

const ACTIVE_SHOP_KEY = "dl_active_shop";
const SHOPS_KEY = "dl_shops";

function shopKey(shopId: string, suffix: string) {
  return `dl_${shopId}_${suffix}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked — fail silently
  }
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Shop Profile ─────────────────────────────────────────────────────────────

export function getAllShops(): ShopProfile[] {
  return read<ShopProfile[]>(SHOPS_KEY, []);
}

export function getActiveShopId(): string | null {
  return read<string | null>(ACTIVE_SHOP_KEY, null);
}

export function getActiveShop(): ShopProfile | null {
  const id = getActiveShopId();
  if (!id) return null;
  const shops = getAllShops();
  return shops.find((s) => s.id === id) ?? null;
}

export function saveShop(profile: ShopProfile): void {
  const shops = getAllShops();
  const idx = shops.findIndex((s) => s.id === profile.id);
  if (idx >= 0) {
    shops[idx] = profile;
  } else {
    shops.push(profile);
  }
  write(SHOPS_KEY, shops);
  write(ACTIVE_SHOP_KEY, profile.id);
}

export function setActiveShop(shopId: string): void {
  write(ACTIVE_SHOP_KEY, shopId);
}

export function deleteShop(shopId: string): void {
  const shops = getAllShops().filter((s) => s.id !== shopId);
  write(SHOPS_KEY, shops);
  // Clear all shop-namespaced data
  if (typeof window !== "undefined") {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`dl_${shopId}_`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
  // Switch active shop if needed
  if (getActiveShopId() === shopId) {
    write(ACTIVE_SHOP_KEY, shops[0]?.id ?? null);
  }
}

// ─── Customers ────────────────────────────────────────────────────────────────

export function getCustomers(shopId: string): Customer[] {
  return read<Customer[]>(shopKey(shopId, "customers"), []);
}

export function getCustomer(shopId: string, customerId: string): Customer | null {
  return getCustomers(shopId).find((c) => c.id === customerId) ?? null;
}

export function saveCustomer(customer: Customer): void {
  const customers = getCustomers(customer.shopId);
  const idx = customers.findIndex((c) => c.id === customer.id);
  if (idx >= 0) {
    customers[idx] = customer;
  } else {
    customers.push(customer);
  }
  write(shopKey(customer.shopId, "customers"), customers);
}

export function findOrCreateCustomer(
  shopId: string,
  name: string,
  nameUrdu: string | null
): Customer {
  const customers = getCustomers(shopId);
  const normalised = name.toLowerCase().trim();
  const existing = customers.find(
    (c) => c.name.toLowerCase().trim() === normalised
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const customer: Customer = {
    id: generateId(),
    shopId,
    name,
    nameUrdu,
    phone: null,
    totalOwed: 0,
    lastEntryDate: null,
    remindersSent: 0,
    paymentsMade: 0,
    createdAt: now,
    updatedAt: now,
  };
  saveCustomer(customer);
  return customer;
}

export function updateCustomerPhone(
  shopId: string,
  customerId: string,
  phone: string
): void {
  const customer = getCustomer(shopId, customerId);
  if (!customer) return;
  saveCustomer({
    ...customer,
    phone,
    updatedAt: new Date().toISOString(),
  });
}

export function incrementReminderCount(shopId: string, customerId: string): void {
  const customer = getCustomer(shopId, customerId);
  if (!customer) return;
  saveCustomer({
    ...customer,
    remindersSent: customer.remindersSent + 1,
    updatedAt: new Date().toISOString(),
  });
}

// ─── Ledger Entries ───────────────────────────────────────────────────────────

export function getLedgerEntries(shopId: string): LedgerEntry[] {
  return read<LedgerEntry[]>(shopKey(shopId, "ledger"), []);
}

export function getEntriesForCustomer(
  shopId: string,
  customerId: string
): LedgerEntry[] {
  return getLedgerEntries(shopId)
    .filter((e) => e.customerId === customerId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function saveLedgerEntry(entry: LedgerEntry): void {
  const entries = getLedgerEntries(entry.customerId.split("-")[0] ?? "");
  // We need the shopId — pass it differently
  void entries; // unused here; we re-fetch below
}

// Bulk-save a batch of new entries (from a scan) and update customer totals
export function saveLedgerEntries(
  shopId: string,
  entries: LedgerEntry[]
): void {
  const existing = getLedgerEntries(shopId);
  const combined = [...existing, ...entries];
  write(shopKey(shopId, "ledger"), combined);

  // Recompute customer totals for affected customers
  const affectedIds = [...new Set(entries.map((e) => e.customerId))];
  affectedIds.forEach((cid) => recomputeCustomerTotal(shopId, cid, combined));
}

function recomputeCustomerTotal(
  shopId: string,
  customerId: string,
  allEntries: LedgerEntry[]
): void {
  const customer = getCustomer(shopId, customerId);
  if (!customer) return;

  const customerEntries = allEntries.filter(
    (e) => e.customerId === customerId
  );
  const totalOwed = customerEntries.reduce((sum, e) => {
    if (e.type === "credit" && e.status !== "paid") return sum + e.amount;
    if (e.type === "debit") return sum - e.amount;
    return sum;
  }, 0);

  const lastEntryDate =
    customerEntries
      .filter((e) => e.date)
      .sort((a, b) => (b.date! > a.date! ? 1 : -1))[0]?.date ?? null;

  saveCustomer({
    ...customer,
    totalOwed: Math.max(0, totalOwed),
    lastEntryDate,
    updatedAt: new Date().toISOString(),
  });
}

export function recordPayment(
  shopId: string,
  customerId: string,
  amount: number
): void {
  const now = new Date().toISOString();
  const paymentEntry: LedgerEntry = {
    id: generateId(),
    customerId,
    customerName: getCustomer(shopId, customerId)?.name ?? "",
    nameUrdu: null,
    amount,
    type: "debit",
    date: now.split("T")[0] ?? null,
    note: "Payment received",
    status: "paid",
    confidence: "high",
    rawText: null,
    createdAt: now,
  };

  const entries = getLedgerEntries(shopId);
  entries.push(paymentEntry);
  write(shopKey(shopId, "ledger"), entries);

  // Mark oldest unpaid credit entries as paid
  let remaining = amount;
  const updated = entries.map((e) => {
    if (
      e.customerId !== customerId ||
      e.type !== "credit" ||
      e.status === "paid" ||
      remaining <= 0
    )
      return e;
    if (e.amount <= remaining) {
      remaining -= e.amount;
      return { ...e, status: "paid" as const };
    }
    return e;
  });
  write(shopKey(shopId, "ledger"), updated);
  recomputeCustomerTotal(shopId, customerId, updated);

  // Track payment count
  const customer = getCustomer(shopId, customerId);
  if (customer) {
    saveCustomer({
      ...customer,
      paymentsMade: customer.paymentsMade + 1,
      updatedAt: now,
    });
  }
}

// ─── Trust Score ──────────────────────────────────────────────────────────────

export function computeTrustScore(
  customer: Customer,
  entries: LedgerEntry[]
): TrustScore {
  let score = 100;

  // Amount owed (up to -40 pts)
  const amountPenalty = Math.min(40, Math.floor(customer.totalOwed / 250));
  score -= amountPenalty;

  // Age of oldest unpaid entry (up to -25 pts)
  const unpaidEntries = entries.filter(
    (e) => e.type === "credit" && e.status !== "paid" && e.date
  );
  if (unpaidEntries.length > 0) {
    const oldest = unpaidEntries.sort((a, b) =>
      a.date! < b.date! ? -1 : 1
    )[0];
    const ageMs = Date.now() - new Date(oldest!.date!).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const agePenalty = Math.min(25, Math.floor(ageDays / 10));
    score -= agePenalty;
  }

  // Reminders sent without payment (up to -20 pts)
  const reminderPenalty = Math.min(20, customer.remindersSent * 5);
  score -= reminderPenalty;

  // Payments made (up to +15 pts bonus)
  const paymentBonus = Math.min(15, customer.paymentsMade * 3);
  score += paymentBonus;

  score = Math.max(0, Math.min(100, score));

  let label: TrustLabel;
  let reason: string;

  if (score >= 70) {
    label = "Reliable";
    reason =
      customer.paymentsMade > 0
        ? `Paid ${customer.paymentsMade} time(s) — good track record`
        : "No overdue entries or concerning patterns";
  } else if (score >= 40) {
    label = "Watch";
    reason =
      customer.remindersSent > 0
        ? `${customer.remindersSent} reminder(s) sent — follow up needed`
        : `Rs ${customer.totalOwed.toLocaleString()} outstanding — monitor closely`;
  } else {
    label = "High Risk";
    reason = `Rs ${customer.totalOwed.toLocaleString()} unpaid${
      customer.remindersSent > 0
        ? ` · ${customer.remindersSent} reminders ignored`
        : ""
    }`;
  }

  return { score, label, reason };
}

// ─── Shelf Items ──────────────────────────────────────────────────────────────

export function getShelfItems(shopId: string): ShelfItem[] {
  return read<ShelfItem[]>(shopKey(shopId, "shelf"), []);
}

export function saveShelfItems(shopId: string, items: ShelfItem[]): void {
  const existing = getShelfItems(shopId);
  // Replace by id or append
  const map = new Map(existing.map((i) => [i.id, i]));
  items.forEach((i) => map.set(i.id, i));
  write(shopKey(shopId, "shelf"), [...map.values()]);
}
