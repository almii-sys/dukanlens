---
inclusion: always
---

# Design system — DukaanLens
Goal: looks like a polished, real fintech/retail app, not a hackathon page. Never use unstyled HTML elements.

## Look & feel
- Warm, trustworthy, practical. Deep green brand + saffron accent. White cards on a soft warm background.
- App is a 480px-max column centered on desktop with soft background + shadow (phone look on projector).

## Colors
- Brand green #0B3D2E (header, primary buttons) · Brand tint #E6F0EC
- Accent saffron #E8A317 (key numbers/highlights only)
- Background #F7F7F2 · Surface #FFFFFF · Border #E5E5DF · Text #1A1F1C · Muted #5A635E
- Status: Empty/Overdue/High Risk red #C2410C (tint #FDEDE5) · Low/Watch amber #B45309 (tint #FEF3E2) ·
  OK/Paid/Reliable green #15803D (tint #E8F5EC). Status colors only for status.

## Typography
- "Plus Jakarta Sans" 400–800; Urdu "Noto Nastaliq Urdu", line-height 2.0+
- Screen title 26/800 · section 18/700 · body 16–17/500 · caption 13–14/500
- Money: tabular numbers, "Rs 12,450", big stats 32–40/800

## Components (components/ui/)
- AppHeader (logo + shop name, back button on inner screens)
- Button (primary green / secondary outline / ghost), 52–56px tall, radius 14px, icon + label, loading spinner
- Card (radius 18px, border, soft shadow), StatCard (big number + label + hint)
- CameraUpload: large dashed zone, camera icon, "Take or upload a photo", preview with retake
- ScanLoader: animated scan line over the uploaded photo + step text ("Reading handwriting…",
  "Building your ledger…") — the signature moment, make it look great
- EditableTable rows, low-confidence cells amber-outlined
- StatusChip, TrustBadge, CustomerRow (initial avatar, name, amount, oldest date, reminder button)
- BottomSheet, Toast, BottomNav (Home, Ledger, Stock, Settings, lucide icons). NO emoji.

## Screens (200ms transitions)
1. Onboarding: "Set up your shop" form, clean and welcoming
2. Home/Dashboard: greeting, 3 StatCards, "Collect Today" top-3, two big action cards (Scan Ledger / Scan Shelf)
3. Smart Ledger Scan: CameraUpload → ScanLoader → editable table → "Save to Ledger"
4. Ledger list: search, customers sorted by amount, total outstanding header, TrustBadge per row
5. Customer detail: total, entries timeline, Trust Score with reason, "Record Payment", "Send Reminder" →
   preview bottom sheet → WhatsApp
6. Shelf Intelligence: CameraUpload → ScanLoader → Empty / Low / OK groups with qty steppers
7. Restock order preview → "Send via WhatsApp"
8. Settings: shop profile, supplier, add/switch shop, about
Every screen: empty state, loading state, friendly error with Retry + Enter Manually.

## Quality rules
- 8px spacing scale, 20px side padding, tap targets ≥ 48px, visible focus rings
- Real button/label/input elements; respect prefers-reduced-motion
- No lorem ipsum, no fake stats. Check at 390px and desktop-centered.