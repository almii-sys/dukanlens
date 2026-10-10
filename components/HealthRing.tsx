import React from "react";
import type { HealthLabel } from "@/lib/health";

interface HealthRingProps {
  score: number; // 0–100
  label: HealthLabel;
  size?: number;
}

function colorFor(label: HealthLabel): string {
  if (label === "Healthy") return "var(--color-teal)";
  if (label === "Needs Attention") return "var(--color-saffron)";
  return "#dc2626";
}

export function HealthRing({ score, label, size = 132 }: HealthRingProps) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dash = (clamped / 100) * circumference;
  const color = colorFor(label);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#eef0f1"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: "34px", fontWeight: 800, color: "var(--color-charcoal)", lineHeight: 1 }}>
          {clamped}
        </span>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", marginTop: "2px" }}>
          / 100
        </span>
      </div>
    </div>
  );
}
