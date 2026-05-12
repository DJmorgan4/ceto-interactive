import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteShell } from "./SiteShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ceto Interactive | Environmental Intelligence",
  description:
    "ASTM E1527-21 compliant Phase I ESA screening, geospatial risk intelligence, and construction compliance — built for developers, municipalities, and infrastructure teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: "var(--font-inter), Inter, Arial, sans-serif" }}>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
