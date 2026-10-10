import type { Customer, LedgerEntry, ShopProfile } from "./types";

// Brand colors (kept in sync with the app design system).
const TEAL = "#0D7377";
const SAFFRON = "#F4A261";
const CREAM = "#FEF9F0";
const CHARCOAL = "#2D3436";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

function money(n: number): string {
  return "Rs " + Math.round(n).toLocaleString();
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Draw a clean account statement onto a canvas and return it.
 * Width is fixed; height grows with the number of entries.
 */
export function renderStatementCanvas(
  shop: ShopProfile,
  customer: Customer,
  entries: LedgerEntry[]
): HTMLCanvasElement {
  const scale = 2; // render at 2x for crisp output
  const W = 720;
  const padX = 48;

  const headerH = 150;
  const infoH = 92;
  const tableHeadH = 44;
  const rowH = 52;
  const totalH = 90;
  const footerH = 70;

  const rows = entries.length > 0 ? entries : [];
  const bodyH = Math.max(rowH, rows.length * rowH);
  const H = headerH + infoH + tableHeadH + bodyH + totalH + footerH;

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, W, H);

  // ── Header band ──
  ctx.fillStyle = TEAL;
  ctx.fillRect(0, 0, W, headerH);
  ctx.fillStyle = SAFFRON;
  ctx.fillRect(0, headerH - 6, W, 6);

  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";
  ctx.font = "800 34px Inter, Arial, sans-serif";
  ctx.fillText(shop.shopName, padX, 62);

  ctx.font = "500 16px Inter, Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  const sub = [shop.city, shop.phone].filter(Boolean).join("  ·  ");
  if (sub) ctx.fillText(sub, padX, 90);

  ctx.font = "700 18px Inter, Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.textAlign = "right";
  ctx.fillText("ACCOUNT STATEMENT", W - padX, 62);
  ctx.font = "500 14px Inter, Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(fmtDate(new Date().toISOString()), W - padX, 88);
  ctx.textAlign = "left";

  // ── Customer info ──
  let y = headerH + 36;
  ctx.fillStyle = MUTED;
  ctx.font = "600 12px Inter, Arial, sans-serif";
  ctx.fillText("BILL TO", padX, y);
  y += 24;
  ctx.fillStyle = CHARCOAL;
  ctx.font = "700 22px Inter, Arial, sans-serif";
  ctx.fillText(customer.name, padX, y);
  if (customer.phone) {
    ctx.font = "500 15px Inter, Arial, sans-serif";
    ctx.fillStyle = MUTED;
    ctx.textAlign = "right";
    ctx.fillText(customer.phone, W - padX, y);
    ctx.textAlign = "left";
  }

  // ── Table header ──
  let ty = headerH + infoH;
  ctx.fillStyle = "#eef0f1";
  ctx.fillRect(padX, ty, W - padX * 2, tableHeadH);
  ctx.fillStyle = MUTED;
  ctx.font = "700 13px Inter, Arial, sans-serif";
  const colDate = padX + 16;
  const colItem = padX + 150;
  const colAmt = W - padX - 16;
  const headY = ty + 28;
  ctx.fillText("DATE", colDate, headY);
  ctx.fillText("ITEM", colItem, headY);
  ctx.textAlign = "right";
  ctx.fillText("AMOUNT", colAmt, headY);
  ctx.textAlign = "left";

  // ── Rows ──
  ty += tableHeadH;
  if (rows.length === 0) {
    ctx.fillStyle = MUTED;
    ctx.font = "500 15px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No entries recorded", W / 2, ty + rowH / 2 + 5);
    ctx.textAlign = "left";
  } else {
    rows.forEach((e, i) => {
      const rowY = ty + i * rowH;
      if (i % 2 === 1) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(padX, rowY, W - padX * 2, rowH);
      }
      const textY = rowY + rowH / 2 + 5;

      ctx.fillStyle = CHARCOAL;
      ctx.font = "500 15px Inter, Arial, sans-serif";
      ctx.fillText(fmtDate(e.date), colDate, textY);

      const isPayment = e.type === "debit";
      const label =
        e.note ?? (isPayment ? "Payment received" : "Credit given");
      ctx.fillStyle = CHARCOAL;
      ctx.font = "500 15px Inter, Arial, sans-serif";
      ctx.fillText(truncate(ctx, label, colAmt - 120 - colItem), colItem, textY);

      ctx.textAlign = "right";
      ctx.font = "700 15px Inter, Arial, sans-serif";
      ctx.fillStyle = isPayment ? "#059669" : "#d97706";
      ctx.fillText((isPayment ? "- " : "+ ") + money(e.amount), colAmt, textY);
      ctx.textAlign = "left";

      // row divider
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, rowY + rowH);
      ctx.lineTo(W - padX, rowY + rowH);
      ctx.stroke();
    });
  }

  // ── Total due ──
  let gy = ty + bodyH + 24;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, padX, gy, W - padX * 2, 58, 12);
  ctx.fill();
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 2;
  roundRect(ctx, padX, gy, W - padX * 2, 58, 12);
  ctx.stroke();

  ctx.fillStyle = CHARCOAL;
  ctx.font = "700 17px Inter, Arial, sans-serif";
  ctx.fillText("Total Due", padX + 20, gy + 37);
  ctx.textAlign = "right";
  ctx.font = "800 26px Inter, Arial, sans-serif";
  ctx.fillStyle = TEAL;
  ctx.fillText(money(customer.totalOwed), W - padX - 20, gy + 39);
  ctx.textAlign = "left";

  // ── Footer ──
  gy += 58 + 30;
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, gy - 16);
  ctx.lineTo(W - padX, gy - 16);
  ctx.stroke();

  ctx.fillStyle = MUTED;
  ctx.font = "500 13px Inter, Arial, sans-serif";
  ctx.fillText("Generated by Nigraan", padX, gy + 6);
  ctx.textAlign = "right";
  ctx.fillText("Snap your ledger. Guard your shop.", W - padX, gy + 6);
  ctx.textAlign = "left";

  return canvas;
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create image from statement"));
    }, "image/png");
  });
}

/**
 * Share the statement via the Web Share API (with the image file) when
 * available on mobile, otherwise fall back to downloading a PNG.
 */
export async function shareStatement(
  shop: ShopProfile,
  customer: Customer,
  entries: LedgerEntry[]
): Promise<"shared" | "downloaded"> {
  const canvas = renderStatementCanvas(shop, customer, entries);
  const blob = await canvasToBlob(canvas);
  const fileName = `${customer.name.replace(/[^a-z0-9]+/gi, "-")}-statement.png`;
  const file = new File([blob], fileName, { type: "image/png" });

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  // Prefer native share with the file (mobile).
  if (
    typeof nav.share === "function" &&
    typeof nav.canShare === "function" &&
    nav.canShare({ files: [file] })
  ) {
    try {
      await nav.share({
        files: [file],
        title: `Statement for ${customer.name}`,
        text: `${shop.shopName} — statement for ${customer.name}`,
      });
      return "shared";
    } catch (err) {
      // User cancelled or share failed; fall through to download.
      if (err instanceof DOMException && err.name === "AbortError") {
        return "shared";
      }
    }
  }

  // Desktop fallback: download the PNG.
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return "downloaded";
}
