import React from "react";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, style, className, onClick }: CardProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        border: "1px solid #f0f0f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        overflow: "hidden",
        cursor: onClick ? "pointer" : undefined,
        transition: onClick ? "box-shadow 0.15s" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}