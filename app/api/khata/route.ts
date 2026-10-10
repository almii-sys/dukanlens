import { callGemini } from "@/lib/gemini";

const PROMPT = `You are reading a photo of a handwritten shop credit register (khata) from a small shop.
Handwriting may be English, Roman Urdu, Urdu script, or mixed. Numbers may be English or Urdu numerals. Amounts are in Rupees.
Extract EVERY entry line. Return ONLY JSON in exactly this shape:
{"entries":[{"customerName":string,"nameUrdu":string|null,"amount":number|null,"date":string|null,"note":string|null,"status":"unpaid"|"paid"|"unclear","confidence":"high"|"medium"|"low"}],"pageNotes":string|null}
Rules:
- customerName: in English letters (transliterate Urdu names, e.g. نسرین -> "Nasreen"); put the original Urdu in nameUrdu.
- note: item written (e.g. doodh -> "milk (doodh)", آٹا -> "flour (atta)", cheeni -> "sugar (cheeni)").
- status "paid" if marked paid / tick mark, otherwise "unpaid".
- date as written (e.g. "8/10").
- Never invent entries that are not on the page.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { imageBase64?: string; mimeType?: string };
    if (!body.imageBase64 || !body.mimeType) {
      return Response.json({ error: "imageBase64 and mimeType are required" }, { status: 400 });
    }
    const base64 = body.imageBase64.includes(",") ? body.imageBase64.split(",")[1] : body.imageBase64;

    const result = (await callGemini({
      parts: [{ text: PROMPT }, { inlineData: { mimeType: body.mimeType, data: base64 } }],
    })) as { entries?: unknown[]; pageNotes?: string | null };

    return Response.json({ entries: result.entries ?? [], pageNotes: result.pageNotes ?? null });
  } catch (err) {
    console.error("[/api/khata]", err);
    const msg = err instanceof Error && err.message.includes("No Gemini API key")
      ? "AI service is not configured."
      : "Could not read the register photo. Please try again or enter manually.";
    return Response.json({ error: msg }, { status: 500 });
  }
}