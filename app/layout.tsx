import "./globals.css";
export const metadata = { title: "FitTakip", description: "Beslenme ve kalori takibi" };
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="tr"><body className="mx-auto max-w-2xl">{children}</body></html>);
}
