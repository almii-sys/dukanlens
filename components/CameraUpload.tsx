"use client";

import React, { useRef } from "react";
import { Camera, Upload, Image as ImageIcon } from "lucide-react";

interface CameraUploadProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  previewUrl?: string | null;
}

export function CameraUpload({ onFile, disabled, previewUrl }: CameraUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = "";
  }

  if (previewUrl) {
    return (
      <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="Ledger register preview" style={{ width: "100%", maxHeight: "320px", objectFit: "cover", display: "block" }} />
      </div>
    );
  }

  return (
    <div style={{ border: "2px dashed #d1d5db", borderRadius: "12px", padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", backgroundColor: "#fafafa" }}>
      <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#e0f2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ImageIcon size={28} color="var(--color-teal)" />
      </div>
      <p style={{ margin: 0, color: "#6b7280", fontSize: "14px", textAlign: "center" }}>Take a photo of your ledger register or upload from gallery</p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button disabled={disabled} onClick={() => cameraRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "var(--color-teal)", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>
          <Camera size={18} /> Take Photo
        </button>
        <button disabled={disabled} onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "transparent", color: "var(--color-teal)", border: "2px solid var(--color-teal)", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>
          <Upload size={18} /> Upload
        </button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleChange} />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleChange} />
    </div>
  );
}
