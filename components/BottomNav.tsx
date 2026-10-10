"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Package, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/ledger", label: "Ledger", icon: BookOpen },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "480px",
        backgroundColor: "white",
        borderTop: "1px solid var(--border-subtle)",
        minHeight: "64px",
        paddingBottom: "var(--safe-bottom)",
        display: "flex",
        alignItems: "stretch",
        zIndex: 50,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
      }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              paddingTop: "8px",
              paddingBottom: "8px",
              color: isActive ? "var(--color-teal)" : "#9ca3af",
              textDecoration: "none",
              fontSize: "11px",
              fontWeight: isActive ? 600 : 400,
              transition: "color 0.15s ease",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
