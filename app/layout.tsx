import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DukaanLens — Aapki dukaan, aapki nazar",
  description: "Smart khata aur stock management for Pakistani shop owners",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ur" dir="ltr">
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
