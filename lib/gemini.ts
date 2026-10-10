import { GoogleGenAI } from "@google/genai";

export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

const MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
].filter((m, i, a) => m && a.indexOf(m) === i) as string[];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.search(/[\[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  return JSON.parse(cleaned.slice(start, end + 1));
}

function isBusy(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err);
  return msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand") || msg.includes("429");
}

async function callWithKey(apiKey: string, parts: GeminiPart[]): Promise<unknown> {
  const ai = new GoogleGenAI({ apiKey });
  let lastErr: unknown;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts }],
          config: { responseMimeType: "application/json" },
        });
        const text = (response as unknown as { text?: string }).text;
        if (!text) throw new Error("Empty response from Gemini");
        return extractJson(text);
      } catch (err) {
        lastErr = err;
        console.warn(`[gemini] ${model} attempt ${attempt + 1} failed:`, (err as Error)?.message?.slice(0, 160));
        if (isBusy(err) && attempt === 0) {
          await sleep(1500);
          continue;
        }
        break;
      }
    }
  }
  throw lastErr;
}

export async function callGemini({ parts }: { parts: GeminiPart[]; schema?: object }): Promise<unknown> {
  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean) as string[];
  if (keys.length === 0) throw new Error("No Gemini API key configured. Set GEMINI_API_KEY in .env.local.");
  let lastErr: unknown;
  for (const key of keys) {
    try {
      return await callWithKey(key, parts);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}