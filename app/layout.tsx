import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nigraan — Snap your ledger. Guard your shop.",
  description: "Smart ledger and stock management for shop owners",
  applicationName: "Nigraan",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Nigraan",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0D7377",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
