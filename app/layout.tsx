import "./globals.css";
import type { Metadata, Viewport } from "next";
import SW from "./sw";

export const metadata: Metadata = {
  title: "FitTakip",
  description: "Çevrimdışı beslenme, antrenman ve gelişim takibi",
  manifest: "./manifest.webmanifest",
  icons: { icon: "./icon.svg", apple: "./icon.svg" },
  appleWebApp: { capable: true, title: "FitTakip", statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0d0f0e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="mx-auto max-w-2xl">
        {children}
        <SW />
      </body>
    </html>
  );
}
