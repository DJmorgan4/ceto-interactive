"use client";

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

export default function Services() {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: THEME.bg }}>
      {/* Calm background wash (blue + green, very light) */}
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

      {/* Topographic lines (subtle) */}
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
        {/* Hero */}
        <section className="px-6 lg:px-10 pt-12 pb-8">
          <div className="max-w-7xl mx-auto">
            <div
              className="rounded-3xl p-8 sm:p-10"
              style={{
                backgroundColor: THEME.surface,
                border: `1px solid ${THEME.border}`,
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="max-w-3xl">
                <p className="text-xs tracking-[0.28em] uppercase" style={{ color: "rgba(47, 93, 140, 0.80)" }}>
                  Services
                </p>

                <h1 className="mt-3 text-4xl sm:text-5xl font-light leading-tight" style={{ color: THEME.ink }}>
                  Environmental work that’s calm, clear, and field-ready.
                </h1>

                <p
                  className="mt-4 text-base sm:text-lg font-light leading-relaxed"
                  style={{ color: "rgba(20, 35, 55, 0.70)" }}
                >
                  Compliance support, permitting coordination, and monitoring systems—built to reduce risk, prevent
                  surprises, and keep projects moving.
                </p>

                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <a
                    href="#construction"
                    className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-light transition shadow-sm"
                    style={{ backgroundColor: THEME.ink, color: "white" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "black")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = THEME.ink)}
                  >
                    Construction Compliance
                  </a>

                  <a
                    href="#renewable"
                    className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-light transition"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.70)",
                      border: `1px solid ${THEME.border}`,
                      color: THEME.ink,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.92)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.70)")}
                  >
                    Renewable Energy
                  </a>

                  <a
                    href="#technology"
                    className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-light transition"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.70)",
                      border: `1px solid ${THEME.border}`,
                      color: THEME.ink,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.92)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.70)")}
                  >
                    Smart Monitoring
                  </a>
                </div>

                <p className="mt-5 text-xs font-light" style={{ color: "rgba(20, 35, 55, 0.60)" }}>
                  Pricing varies by scope, duration, and location. We’ll quote quickly with the basics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick finder */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-10">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left: quick nav */}
            <aside className="lg:col-span-4">
              <div
                className="rounded-3xl p-6"
                style={{
                  backgroundColor: THEME.surface,
                  border: `1px solid ${THEME.border}`,
                  backdropFilter: "blur(10px)",
                }}
              >
                <h2 className="text-sm font-medium" style={{ color: THEME.ink }}>
                  Find what you need
                </h2>
                <p className="mt-1 text-sm font-light" style={{ color: "rgba(20, 35, 55, 0.65)" }}>
                  Jump to a section, then expand only the details you care about.
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <a
                    className="block rounded-2xl px-3 py-2 transition"
                    style={{ color: THEME.ink }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(47, 93, 140, 0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    href="#construction"
                  >
                    Construction Environmental Compliance
                  </a>
                  <a
                    className="block rounded-2xl px-3 py-2 transition"
                    style={{ color: THEME.ink }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(47, 93, 140, 0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    href="#renewable"
                  >
                    Renewable Energy Services
                  </a>
                  <a
                    className="block rounded-2xl px-3 py-2 transition"
                    style={{ color: THEME.ink }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(47, 93, 140, 0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    href="#technology"
                  >
                    Smart Monitoring Technology
                  </a>
                  <a
                    className="block rounded-2xl px-3 py-2 transition"
                    style={{ color: THEME.ink }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(224, 122, 95, 0.10)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    href="#research"
                  >
                    Environmental Research Support
                  </a>
                </div>

                <div className="mt-5 flex gap-3">
                  <a
                    href="/contact"
                    className="flex-1 text-center rounded-full px-4 py-2 text-sm font-light transition"
                    style={{ backgroundColor: THEME.leviBlue, color: "white" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = THEME.leviBlueDark)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = THEME.leviBlue)}
                  >
                    Request a Quote
                  </a>
                  <a
                    href="mailto:dj@cetointeractive.com"
                    className="flex-1 text-center rounded-full px-4 py-2 text-sm font-light transition"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.70)",
                      border: `1px solid ${THEME.border}`,
                      color: THEME.ink,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.92)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.70)")}
                  >
                    Email
                  </a>
                </div>
              </div>
            </aside>

            {/* Right: sections */}
            <div className="lg:col-span-8 space-y-6">
              <Section
                id="construction"
                kicker="Construction"
                title="Construction Environmental Compliance"
                subtitle="Reduce stormwater risk and keep documentation clean."
                cards={[
                  {
                    title: "SWPPP Development & Management",
                    summary: "Site-specific SWPPP documents and ongoing updates aligned to your project phase.",
                    bullets: ["Site-specific plan + BMP selection", "NOI support + contractor onboarding", "Plan maintenance as conditions change"],
                  },
                  {
                    title: "Erosion Control Monitoring",
                    summary: "Routine inspections with photo documentation and clear action items.",
                    bullets: ["Weekly inspections + post-rain checks", "Photo documentation and logs", "Monthly summary reporting (as needed)"],
                  },
                  {
                    title: "Pre-Construction Environmental Screening",
                    summary: "Desktop risk scan before you break ground (fast + practical).",
                    bullets: ["Regulatory database review (EPA/TCEQ)", "Wetland/floodplain screening", "Historical aerial review"],
                  },
                  {
                    title: "Compliance Coordination",
                    summary: "Support for permitting, correspondence, training, and recordkeeping.",
                    bullets: ["Agency communication support", "Submittal tracking + documentation", "Field coordination + toolbox talks"],
                  },
                ]}
              />

              <Section
                id="renewable"
                kicker="Renewables"
                title="Renewable Energy Services"
                subtitle="Environmental screening and compliance support for solar and wind."
                cards={[
                  {
                    title: "Project Environmental Screening",
                    summary: "Constraints analysis to identify permitting pathways early.",
                    bullets: ["Habitat/wetland constraints review", "Cultural resources screening (as applicable)", "Preliminary permit pathway mapping"],
                  },
                  {
                    title: "Permitting Coordination",
                    summary: "Help with agency coordination and permit tracking.",
                    bullets: ["USACE / consultation coordination support", "Permit tracking and milestone planning", "Compliance checklists for field teams"],
                  },
                  {
                    title: "Construction Environmental Monitoring",
                    summary: "On-site checks during construction phases—tight, documented, actionable.",
                    bullets: ["Construction compliance inspections", "Permit condition verification", "Photo documentation + reporting"],
                  },
                ]}
              />

              <Section
                id="technology"
                kicker="Technology"
                title="Smart Monitoring Technology"
                subtitle="Simple, dependable systems that produce usable records."
                cards={[
                  {
                    title: "Smart Construction Photo Monitoring",
                    summary: "Automated photo capture and organized documentation for compliance workflows.",
                    bullets: ["Scheduled captures + event capture options", "Cloud organization (project-based)", "Automated summaries (optional)"],
                  },
                  {
                    title: "Environmental Sensor Monitoring",
                    summary: "Real-time logging + threshold alerts where it matters.",
                    bullets: ["Configurable sensors (as needed)", "Automated data logging", "Alerting + monthly reporting"],
                  },
                  {
                    title: "Wetland / Conservation Area Monitoring",
                    summary: "Hydrology and habitat monitoring for mitigation + conservation sites.",
                    bullets: ["Water level / precipitation tracking (as applicable)", "Camera integration options", "Quarterly/annual reports per permit schedule"],
                  },
                ]}
              />

              <Section
                id="research"
                kicker="Research"
                title="Environmental Research & Support"
                subtitle="Fast, clean deliverables for consulting teams and transactions."
                cards={[
                  {
                    title: "Regulatory Database Screening",
                    summary: "Support for Phase I ESA / due diligence research workflows.",
                    bullets: ["Database compilation", "Clear summary tables", "Source documentation"],
                  },
                  {
                    title: "Historical Research & Aerials",
                    summary: "Aerial review and land-use history summaries.",
                    bullets: ["Aerial timelines", "Map compilation", "Land-use narrative"],
                  },
                  {
                    title: "Site Reconnaissance",
                    summary: "Field observations with photo documentation (as requested).",
                    bullets: ["Photo log", "Observations summary", "Client-ready export"],
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t" style={{ borderColor: THEME.border, backgroundColor: "rgba(255,255,255,0.40)" }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
            <div
              className="rounded-3xl text-white p-8 sm:p-10 relative overflow-hidden"
              style={{
                border: `1px solid ${THEME.border}`,
                backgroundImage: `linear-gradient(135deg, ${THEME.leviBlueDark} 0%, ${THEME.leviBlue} 55%, rgba(224, 122, 95, 0.18) 120%)`,
              }}
            >
              <div className="relative max-w-2xl">
                <h2 className="text-2xl sm:text-3xl font-light">Want a quote without the back-and-forth?</h2>
                <p className="mt-3 text-white/80 leading-relaxed font-light">
                  Send location + rough schedule + what you’re building. We’ll reply with a clean plan and options.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-light transition shadow-sm"
                    style={{ backgroundColor: "rgba(255,255,255,0.92)", color: THEME.leviBlueDark }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.98)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.92)")}
                  >
                    Schedule a Consultation
                  </a>
                  <a
                    href="mailto:dj@cetointeractive.com"
                    className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-light transition"
                    style={{ border: "1px solid rgba(255,255,255,0.35)", backgroundColor: "rgba(255,255,255,0.10)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.10)")}
                  >
                    Email DJ Morgan
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Section({
  id,
  kicker,
  title,
  subtitle,
  cards,
}: {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  cards: Array<{ title: string; summary: string; bullets: string[] }>;
}) {
  return (
    <section
      id={id}
      className="rounded-3xl shadow-sm"
      style={{
        backgroundColor: THEME.surface,
        border: `1px solid ${THEME.border}`,
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="p-6 sm:p-8">
        <p className="text-xs tracking-[0.25em] uppercase" style={{ color: "rgba(47, 93, 140, 0.80)" }}>
          {kicker}
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-light" style={{ color: THEME.ink }}>
          {title}
        </h2>
        <p className="mt-2 text-sm sm:text-base font-light leading-relaxed" style={{ color: "rgba(20, 35, 55, 0.65)" }}>
          {subtitle}
        </p>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {cards.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl p-5"
              style={{
                border: `1px solid ${THEME.border}`,
                backgroundColor: "rgba(255,255,255,0.72)",
              }}
            >
              <h3 className="text-base font-medium" style={{ color: THEME.ink }}>
                {c.title}
              </h3>
              <p className="mt-1 text-sm font-light leading-relaxed" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
                {c.summary}
              </p>

              <details className="mt-3">
                <summary
                  className="cursor-pointer text-sm select-none"
                  style={{ color: THEME.leviBlue }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = THEME.leviBlueDark)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = THEME.leviBlue)}
                >
                  What’s included
                </summary>

                <ul className="mt-3 space-y-2 text-sm" style={{ color: "rgba(20, 35, 55, 0.85)" }}>
                  {c.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full" style={{ backgroundColor: THEME.washedGreen }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4">
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-light transition"
                    style={{ backgroundColor: THEME.leviBlue, color: "white" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = THEME.leviBlueDark)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = THEME.leviBlue)}
                  >
                    Request Quote
                  </a>
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

