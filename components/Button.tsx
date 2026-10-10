"use client";

import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--color-teal)",
    color: "white",
    border: "none",
  },
  secondary: {
    backgroundColor: "transparent",
    color: "var(--color-teal)",
    border: "2px solid var(--color-teal)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--color-charcoal)",
    border: "1px solid #e5e7eb",
  },
  danger: {
    backgroundColor: "var(--color-danger)",
    color: "white",
    border: "none",
  },
};

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { padding: "8px 14px", fontSize: "13px", borderRadius: "10px", minHeight: "36px" },
  md: { padding: "11px 20px", fontSize: "15px", borderRadius: "12px", minHeight: "44px" },
  lg: { padding: "14px 24px", fontSize: "16px", borderRadius: "14px", minHeight: "52px" },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      disabled={isDisabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        fontWeight: 600,
        fontFamily: "inherit",
        lineHeight: 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.55 : 1,
        transition: "opacity 0.15s ease, transform 0.1s ease, filter 0.15s ease, box-shadow 0.15s ease",
        width: fullWidth ? "100%" : undefined,
        WebkitTapHighlightColor: "transparent",
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
      }}
      onMouseDown={(e) => {
        if (!isDisabled) e.currentTarget.style.transform = "scale(0.97)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      {...props}
    >
      {loading ? (
        <>
          <span
            style={{
              width: "16px",
              height: "16px",
              border: "2px solid currentColor",
              borderTopColor: "transparent",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin-slow 0.75s linear infinite",
            }}
          />
          <span>Please wait…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
