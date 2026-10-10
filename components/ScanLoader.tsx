"use client";
import React from "react";
import { Loader2 } from "lucide-react";
interface ScanLoaderProps { previewUrl: string; }
export function ScanLoader({ previewUrl }: ScanLoaderProps) {
  return (
    <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={previewUrl} alt="Scanning..." style={{ width: "100%", maxHeight: "320px", objectFit: "cover", display: "block" }} />
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(13,115,119,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
        <div className="scan-line" style={{ position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent 0%, rgba(244,162,97,0.9) 50%, transparent 100%)" }} />
        <Loader2 size={40} color="white" style={{ animation: "spin-slow 1s linear infinite" }} />
        <p style={{ color: "white", fontWeight: 600, fontSize: "15px", margin: 0 }}>Reading your khata...</p>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: 0 }}>Powered by AI - this may take a moment</p>
      </div>
    </div>
  );
}
