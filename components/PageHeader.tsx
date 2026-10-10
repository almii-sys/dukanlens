import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  shopName?: string;
}

export function PageHeader({ title, subtitle, action, shopName }: PageHeaderProps) {
  return (
    <header
      style={{
        backgroundColor: "var(--color-teal)",
        color: "white",
        padding: "16px 20px",
        paddingTop: "calc(16px + var(--safe-top))",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {shopName && (
          <p
            style={{
              fontSize: "11px",
              opacity: 0.75,
              margin: "0 0 2px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {shopName}
          </p>
        )}
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 700,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: "13px", opacity: 0.8, margin: "2px 0 0" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </header>
  );
}
