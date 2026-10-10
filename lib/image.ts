"use client";

/**
 * Compress an image file to a max long edge of 1600px, JPEG quality 0.85.
 * Returns a base64 data URL.
 */
export async function compressImage(file: File): Promise<string> {
  const MAX_LONG_EDGE = 1600;
  const QUALITY = 0.85;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { naturalWidth: w, naturalHeight: h } = img;
      const longEdge = Math.max(w, h);

      let targetW = w;
      let targetH = h;

      if (longEdge > MAX_LONG_EDGE) {
        const scale = MAX_LONG_EDGE / longEdge;
        targetW = Math.round(w * scale);
        targetH = Math.round(h * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);
      const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}

/**
 * Extract the raw base64 string (without the data URL prefix) and mime type.
 */
export function splitDataUrl(dataUrl: string): {
  base64: string;
  mimeType: string;
} {
  const [prefix, base64] = dataUrl.split(",");
  const mimeType = prefix?.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
  return { base64: base64 ?? "", mimeType };
}
