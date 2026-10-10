---
inclusion: always
---

# Product: Nigraan — camera-first assistant for kiryana shops
Tagline: "Snap your ledger. Guard your shop."
Track: Retail & Commerce.

## The problem
Small kiryana/general stores run on paper registers and memory. Udhaar (credit) given to customers is
written in a handwritten register and often forgotten or never collected. Stock runs out without anyone
noticing, and the shopkeeper loses sales. Existing apps require typing every entry, which busy,
low-literacy shopkeepers don't do — so they stay on paper.

## The idea
Zero typing. The shopkeeper photographs what already exists — the paper register and the shelf —
and AI turns it into a digital ledger, payment reminders, and restock orders.

## Target user
- Kiryana / general store owner, uses a phone, comfortable with WhatsApp and the camera,
  writes the register in Urdu or Roman Urdu, not comfortable typing in apps

## Features (build in this order)

### 0. Shop Profile (onboarding) — build first, with the app shell
- First launch: "Set up your shop" → shop name, owner name, city, phone number, shop type
  (Kiryana / General Store / Pharmacy / Other), register language (Urdu / English / Mixed / Other)
- Saved on the device (localStorage, key dl_shop). Ledger, customers, stock scans and supplier are
  stored under this shop's id, so each shop's data is organized separately
- Header shows the shop name; Settings lets the owner edit the profile; "Add another shop" with a shop switcher
- No real login today (no backend). Cloud accounts + sync is the next step.
- The register can be in any language or script (Urdu, Hindi, English, Bahasa, etc.)

### 1. Smart Ledger Scan — priority 1
- Upload/take a photo of a handwritten udhaar register page
- AI reads each entry: customer name, amount, date (if written), item note (if written), paid/unpaid mark
- Editable table (fix any misread value), then "Save to Ledger"
- Ledger list: per-customer total udhaar, oldest due date, total outstanding for the shop
- Per customer: "Send Reminder" → polite reminder in Roman Urdu (and Urdu script) → opens WhatsApp
  (wa.me link); customer phone added once and remembered
- "Record Payment" (full/partial) → totals update

### 2. Shelf Intelligence — priority 2
- Upload/take a photo of a shelf
- AI identifies products (brand + type where visible, e.g. "Surf Excel 500g", "Tapal Danedar")
  and estimates stock level: full / low / empty
- Items grouped: Empty (red), Low (amber), OK (green); reorder quantity editable
- "Create Restock Order" → Roman Urdu order message with items + quantities → "Send via WhatsApp" to supplier

### 3. Store Dashboard (Home) — priority 3
- Big numbers: total udhaar outstanding, customers owing, items to reorder
- "Collect Today": top 3 customers (largest/oldest dues) with Send Reminder buttons
- Recent scans list

### 4. Customer Trust Score — build with feature 1, computed locally, no API
- Score 0–100 and label: Reliable (green) / Watch (amber) / High Risk (red)
- Based on: amount owed, age of oldest unpaid entry, reminders sent without payment, payment history
- Shown on customer row and detail screen with a one-line reason
- Adding new udhaar for a High Risk customer shows a gentle warning with the amount already due

### 5. Voice Entry — stretch only
- Hold mic, say "Ali ko 500 ka udhaar, cheeni" → entry created

### 6. Weekly Business Report — stretch only
- One tap: AI writes a short summary: total udhaar, collected this week, risky customers, items that ran out

## Principles
- Camera-first: every flow starts with a photo; max 3 taps to a result
- Professional English UI with short Urdu subtitles on key headings; big numbers, simple words
- Customer-facing messages (reminders, orders) in polite Roman Urdu + Urdu
- Every AI-read value is editable; manual entry always available
- Data stays on the phone (localStorage) — privacy for customers' udhaar
- Button names: Scan Ledger, Scan Shelf, Save to Ledger, Send Reminder, Record Payment,
  Create Restock Order, Send via WhatsApp, Retry, Enter Manually