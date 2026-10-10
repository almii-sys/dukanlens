import React from "react";

type BadgeVariant = "teal" | "saffron" | "green" | "red" | "amber" | "gray";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  teal: { backgroundColor: "#e0f2f2", color: "var(--color-teal)" },
  saffron: { backgroundColor: "#fef3e0", color: "#c07020" },
  green: { backgroundColor: "#d1fae5", color: "#065f46" },
  red: { backgroundColor: "#fee2e2", color: "#991b1b" },
  amber: { backgroundColor: "#fef3cd", color: "#92400e" },
  gray: { backgroundColor: "#f3f4f6", color: "#374151" },
};

export function Badge({ variant = "gray", children, style }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        ...VARIANT_STYLES[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}