import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { SiteShell } from "./SiteShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Serif display face for headlines — the "world class" typography move.
// Source Serif 4 is screen-optimized with low stroke contrast — reads sober next to Inter.
const serif = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cetointeractive.com"),
  title: {
    default: "Ceto Interactive | Phase I ESAs Powered by Live Federal Data",
    template: "%s | Ceto Interactive",
  },
  description:
    "ASTM E1527-21 informed Phase I ESA screening with live federal data, the CETO Risk Score, geospatial site intelligence, and construction compliance — EP-reviewed, built in Texas.",
  openGraph: {
    title: "Ceto Interactive | Environmental Intelligence",
    description:
      "Phase I ESAs powered by live federal data. Seven regulatory databases queried in real time, risk scored 0–100, EP-reviewed.",
    url: "https://www.cetointeractive.com",
    siteName: "Ceto Interactive",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body style={{ fontFamily: "var(--font-inter), Inter, Arial, sans-serif" }}>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
