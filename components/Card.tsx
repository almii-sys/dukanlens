"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, style, className, onClick }: CardProps) {
  const interactive = Boolean(onClick);
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        backgroundColor: "white",
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
        cursor: interactive ? "pointer" : undefined,
        transition: "box-shadow 0.18s ease, transform 0.18s ease",
        ...style,
      }}
      onMouseEnter={
        interactive
          ? (e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-card-hover)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          : undefined
      }
      onMouseLeave={
        interactive
          ? (e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-card)";
              e.currentTarget.style.transform = "translateY(0)";
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
