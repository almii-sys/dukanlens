import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nigraan — Snap your ledger. Guard your shop.",
  description: "Smart ledger and stock management for shop owners",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0D7377" />
      </head>
      <body>
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
