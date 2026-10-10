# Nigraan

**Snap your ledger. Guard your shop.**

🔗 **Live demo:** [nigraan-zeta.vercel.app](https://nigraan-zeta.vercel.app)

---

## The problem

Small kiryana and general stores run on paper registers and memory. Credit (udhaar) given to customers is written in a handwritten register and often forgotten or never collected. Fraud and double-entries slip through unnoticed, and shopkeepers have no clear picture of their own financial health. Existing apps demand that every entry be typed in — so busy shopkeepers never adopt them and stay on paper.

## The solution

Nigraan is a camera-first assistant for shopkeepers. Instead of typing, the shopkeeper photographs the register they already keep, and AI turns it into a digital ledger — then layers on fraud detection, collection reminders, and a credit-health profile. Zero typing to get started, and every AI-read value stays editable.

## Features

- **Smart Ledger Scan** — Photograph a handwritten register page and Gemini Vision reads each entry (customer name, amount, date, item note, paid/unpaid mark), handling Urdu, Roman Urdu, English or mixed scripts. Low-confidence cells are highlighted for a quick review before saving.
- **Fraud & Anomaly Alerts** — Local checks flag duplicate entries, sudden spikes above a customer's usual credit, unusually large entries, missing amounts, and payments larger than what's owed — each with a severity and a one-line reason.
- **Shop Health Score** — A single 0–100 score (Healthy / Needs Attention / At Risk) built from credit recovered, overdue balances, high-risk customers, and open fraud flags, with a one-line tip to raise it. A credit profile for future loans.
- **Customer Trust Score** — Every customer gets a Reliable / Watch / High Risk rating based on amount owed, age of the oldest unpaid entry, reminders sent, and payment history.
- **WhatsApp Reminders** — Send polite payment reminders in English or Urdu through a `wa.me` link; the customer's number is asked once and remembered.
- **Shareable Statements** — Generate a clean account statement image on-device and share it via the Web Share API on mobile, or download it as a PNG on desktop.

## Tech stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS — one app, mobile-first, installable as a PWA
- **Google Gemini** (via the official `@google/genai` SDK) for handwriting recognition, called only in server route handlers with structured JSON output
- **Vercel** for hosting and deployment
- **localStorage** for all data, namespaced per shop — customer credit stays on the device

## Built with Kiro

Nigraan was built end-to-end with Kiro, using its workflow features to stay fast and consistent:

- **Steering files** — `.kiro/steering/product.md`, `tech.md`, and `design.md` captured the product vision, tech stack rules, and design system up front, so every generated screen followed the same colors, components, and conventions.
- **Quick Spec** — Features were scoped and built from short specs that turned high-level intent (app shell, onboarding, ledger scan, FYP features) into concrete, buildable tasks.
- **API safety hook** — An agent hook guards the Gemini integration, keeping API keys server-side only, enforcing friendly error handling and key fallback, and verifying the structured response schema on the `/api/khata` route.

## Roadmap

- **Voice entry** — "Ali ko 500 ka udhaar, cheeni" → an entry, hands-free
- **Cash-flow forecasting** — project collections and shortfalls from ledger history
- **Shelf Scan** — photograph a shelf to detect low/empty stock and draft a restock order
- **Cloud sync** — accounts and multi-device sync (today data lives on the device)
- **Lending partners** — turn the Shop Health Score into a credit profile that unlocks working-capital loans
