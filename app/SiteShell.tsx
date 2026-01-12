"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

const THEME = {
  bg: "#F6F7F8",
  surface: "rgba(255,255,255,0.62)",
  surfaceStrong: "rgba(255,255,255,0.75)",
  border: "rgba(20, 35, 55, 0.14)",
  ink: "#142337",

  leviBlue: "#2F5D8C",
  leviBlueDark: "#234B74",
  washedBlue: "#6E93B5",

  washedGreen: "#4F7A6A",
  washedGreenDark: "#3E6357",

  sunset: "#E07A5F",
};

// NOTE: Contact is handled as a button (so we do not include it here to avoid duplicates)
const NAV = [
  { href: "/services", label: "Services" },
  { href: "/envnews", label: "News" },
  { href: "/about", label: "About" },
] as const;

const CONTACT = { href: "/contact", label: "Contact" } as const;

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: THEME.bg }}>
      {/* Calm background wash */}
      <div
        className="fixed inset-0 z-0"
        style={{
          opacity: 0.55,
          backgroundImage: `
            radial-gradient(circle at 18% 40%, rgba(47, 93, 140, 0.14) 0%, transparent 58%),
            radial-gradient(circle at 82% 78%, rgba(79, 122, 106, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 55% 18%, rgba(224, 122, 95, 0.06) 0%, transparent 55%)
          `,
        }}
      />

      {/* Topographic lines */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.35 }}>
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => {
            const y = 120 + i * 70;
            const o = 0.08 - i * 0.007;
            return (
              <path
                key={i}
                d={`M0 ${y}
                    C 200 ${y - 18}, 360 ${y + 12}, 520 ${y - 8}
                    C 700 ${y - 22}, 900 ${y + 18}, 1200 ${y - 6}`}
                fill="none"
                stroke={`rgba(20, 35, 55, ${Math.max(o, 0.02)})`}
                strokeWidth="1.15"
              />
            );
          })}
        </svg>
      </div>

      <div className="relative z-10">
        <Header />
        {children}
        <Footer />
      </div>
    </main>
  );
}

function Header() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        backgroundColor: THEME.surfaceStrong,
        borderBottom: `1px solid ${THEME.border}`,
      }}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Brand / logo */}
          <a href="/" className="flex items-center gap-3">
            {/* If you have /public/logo.png, this will show. If not, remove the img. */}
            <img src="/logo.png" alt="Ceto Interactive" className="h-8 w-auto" />
            <div className="text-xl md:text-2xl font-light tracking-wide" style={{ color: THEME.ink }}>
              <span style={{ color: THEME.ink }}>Ceto</span>
              <span style={{ color: THEME.leviBlue, fontWeight: 400 }}>Interactive</span>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-10">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="font-light text-base transition-colors duration-200"
                style={{
                  color: isActive(item.href) ? THEME.leviBlue : "rgba(20, 35, 55, 0.78)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = THEME.leviBlue)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = isActive(item.href) ? THEME.leviBlue : "rgba(20, 35, 55, 0.78)")
                }
              >
                {item.label}
              </a>
            ))}

            {/* Contact button */}
            <a
              href={CONTACT.href}
              className="text-white px-6 py-2.5 rounded-full font-light transition-colors duration-200 shadow-sm"
              style={{ backgroundColor: THEME.leviBlue }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = THEME.leviBlueDark)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = THEME.leviBlue)}
            >
              {CONTACT.label}
            </a>
          </nav>
        </div>

        {/* Mobile nav row: ALWAYS show all links */}
        <div className="md:hidden mt-3 flex items-center justify-between gap-2">
          {[...NAV, CONTACT].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex-1 text-center text-[12px] py-2 rounded-full border"
              style={{
                borderColor: "rgba(20, 35, 55, 0.18)",
                color: isActive(item.href) ? THEME.leviBlue : "rgba(20, 35, 55, 0.78)",
                backgroundColor: "rgba(255,255,255,0.55)",
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16" style={{ borderTop: `1px solid ${THEME.border}` }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
        <div
          className="rounded-3xl p-8 md:p-10"
          style={{
            backgroundColor: THEME.surface,
            border: `1px solid ${THEME.border}`,
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Ceto Interactive" className="h-7 w-auto" />
                <div className="text-2xl font-light tracking-wide" style={{ color: THEME.ink }}>
                  <span style={{ color: THEME.ink }}>Ceto</span>
                  <span style={{ color: THEME.leviBlue, fontWeight: 400 }}>Interactive</span>
                </div>
              </div>
              <div className="mt-2 text-sm font-light" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
                Environmental Technology &amp; Consulting • Intelligence • Compliance • Monitoring
              </div>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {[...NAV, CONTACT].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="font-light transition-colors duration-200"
                  style={{ color: "rgba(20, 35, 55, 0.78)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = THEME.leviBlue)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(20, 35, 55, 0.78)")}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs font-light">
            <div style={{ color: "rgba(20, 35, 55, 0.60)" }}>
              © {new Date().getFullYear()} Ceto Interactive. All rights reserved.
            </div>
            <div style={{ color: "rgba(20, 35, 55, 0.60)" }}>
              Built for clarity: data, permits, habitats, and real-world decisions.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

