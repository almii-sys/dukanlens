---
inclusion: always
---

# Tech stack and rules

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS. One app, no separate server.
- AI: Google Gemini via the official @google/genai SDK, ONLY in server route handlers
- Env vars: GEMINI_API_KEY, GEMINI_API_KEY_2 (backup), GEMINI_MODEL
- Icons: lucide-react. Urdu font: Noto Nastaliq Urdu (next/font/google), Urdu text dir="rtl"
- Storage: localStorage only, all data namespaced under the active shop id, wrapped in try/catch
- Deploy: Vercel

## Structure
- app/page.tsx — app shell with bottom nav: Home, Ledger, Stock, Settings
- lib/gemini.ts — callGemini({ parts, schema }) with key fallback (KEY → KEY_2), 20s timeout
- lib/prompts.ts — all prompt text
- lib/storage.ts — load/save helpers per shop
- lib/types.ts — Shop, LedgerEntry, Customer, ShelfItem types
- lib/image.ts — client-side compress (max 1600px long edge, JPEG 0.85) before upload

## API routes (structured output: responseMimeType application/json + responseSchema)
- POST /api/khata — input: register photo (base64 + mimeType)
  Output: { entries: [{ customerName, nameUrdu: string|null, amount: number|null, date: string|null,
            note: string|null, status: "unpaid"|"paid"|"unclear", confidence: "high"|"medium"|"low" }],
            pageNotes: string|null }
  Prompt: handwriting may be Urdu script, Roman Urdu, English or mixed; Urdu/English numerals; amounts in Rs;
  if a name is in Urdu script, return a Roman Urdu customerName plus the original in nameUrdu.
- POST /api/shelf — input: shelf photo
  Output: { items: [{ name, brand: string|null, size: string|null, stockLevel: "full"|"low"|"empty",
            suggestedReorderQty: number, confidence }] }
  Prompt: Pakistani retail products; mark visible gaps as empty when the label is nearby; never invent items.

## Fallback chain
1. Gemini with GEMINI_API_KEY → 2. retry with GEMINI_API_KEY_2 → 3. friendly error card with
"Retry" AND "Enter Manually", so the flow never dead-ends. Low-confidence values highlighted amber.

## WhatsApp
- https://wa.me/92XXXXXXXXXX?text=<encodeURIComponent(message)>; convert 03xx to 923xx.
- If no number is saved, ask in a small bottom sheet and remember it.

## Installable app (PWA)
- app/manifest.ts: name "DukaanLens", display "standalone", theme_color "#0B3D2E",
  background_color "#F7F7F2", icons 192/512 + maskable (green rounded square with a white glyph via app/icon.tsx)
- layout metadata: appleWebApp capable, themeColor; safe-area padding. No service worker.
## Environment
- Windows + Windows PowerShell 5.1. Never use bash syntax, `&&`, `?.`, or PowerShell 7 features in commands.
- Create and edit files with the file tools, not with shell commands.
## Rules
- Never expose API keys to the client
- Every API call: loading state, friendly error, retry
- Mobile-first, test at 390px; on desktop center the app in a 480px column
- Simple working code over abstraction; one-day hackathon build