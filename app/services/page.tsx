"use client";

import { SiteShell } from "../SiteShell";

export default function Services() {
  return (
    <SiteShell>
      <div className="min-h-screen text-[#0f172a]">
        {/* Hero */}
        <section className="relative overflow-hidden px-5 sm:px-6 lg:px-8 pt-12 pb-8">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgba(43,95,184,0.10), transparent 55%), radial-gradient(circle at 80% 30%, rgba(28,140,114,0.08), transparent 55%), radial-gradient(circle at 55% 85%, rgba(217,119,6,0.08), transparent 60%)",
            }}
          />
          <div className="relative max-w-7xl mx-auto py-6 sm:py-10">
            <div className="max-w-3xl">
              <p className="text-xs tracking-[0.28em] uppercase text-[#2b5fb8]/80">Services</p>
              <h1 className="mt-3 text-4xl sm:text-5xl font-light leading-tight text-[#0b1220]">
                Environmental work that’s calm, clear, and field-ready.
              </h1>
              <p className="mt-4 text-base sm:text-lg text-[#475569] leading-relaxed">
                Compliance support, permitting coordination, and monitoring systems—built to reduce risk, prevent surprises,
                and keep projects moving.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <a
                  href="#construction"
                  className="inline-flex items-center justify-center rounded-full bg-[#0b1220] text-white px-6 py-3 text-sm hover:bg-black transition shadow-sm"
                >
                  Construction Compliance
                </a>
                <a
                  href="#renewable"
                  className="inline-flex items-center justify-center rounded-full bg-white/70 border border-[#e6e9f2] text-[#0b1220] px-6 py-3 text-sm hover:bg-white transition"
                >
                  Renewable Energy
                </a>
                <a
                  href="#technology"
                  className="inline-flex items-center justify-center rounded-full bg-white/70 border border-[#e6e9f2] text-[#0b1220] px-6 py-3 text-sm hover:bg-white transition"
                >
                  Smart Monitoring
                </a>
              </div>

              <p className="mt-5 text-xs text-[#64748b]">
                Pricing varies by scope, duration, and location. We’ll quote quickly with the basics.
              </p>
            </div>
          </div>
        </section>

        {/* Quick finder */}
        <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pb-8">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left: quick nav */}
            <aside className="lg:col-span-4">
              <div className="bg-white/80 rounded-2xl border border-[#e6e9f2] p-5 shadow-sm backdrop-blur">
                <h2 className="text-sm font-medium text-[#0b1220]">Find what you need</h2>
                <p className="mt-1 text-sm text-[#64748b]">
                  Jump to a section, then expand only the details you care about.
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <a className="block rounded-xl px-3 py-2 hover:bg-[#f3f6ff] text-[#0b1220]" href="#construction">
                    Construction Environmental Compliance
                  </a>
                  <a className="block rounded-xl px-3 py-2 hover:bg-[#f3f6ff] text-[#0b1220]" href="#renewable">
                    Renewable Energy Services
                  </a>
                  <a className="block rounded-xl px-3 py-2 hover:bg-[#f3f6ff] text-[#0b1220]" href="#technology">
                    Smart Monitoring Technology
                  </a>
                  <a className="block rounded-xl px-3 py-2 hover:bg-[#fff7ed] text-[#0b1220]" href="#research">
                    Environmental Research Support
                  </a>
                </div>

                <div className="mt-5 flex gap-3">
                  <a
                    href="/contact"
                    className="flex-1 text-center rounded-full bg-[#2b5fb8] text-white px-4 py-2 text-sm hover:bg-[#234f98] transition"
                  >
                    Request a Quote
                  </a>
                  <a
                    href="mailto:dj@cetointeractive.com"
                    className="flex-1 text-center rounded-full bg-white border border-[#e6e9f2] px-4 py-2 text-sm hover:bg-[#f8fafc] transition"
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
        <section className="border-t border-[#e6e9f2] bg-white/60">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12">
            <div className="rounded-3xl border border-[#e6e9f2] bg-[#0b1220] text-white p-8 sm:p-10 relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at 25% 30%, rgba(43,95,184,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(28,140,114,0.25), transparent 55%), radial-gradient(circle at 50% 95%, rgba(217,119,6,0.22), transparent 60%)",
                }}
              />
              <div className="relative max-w-2xl">
                <h2 className="text-2xl sm:text-3xl font-light">Want a quote without the back-and-forth?</h2>
                <p className="mt-3 text-white/80 leading-relaxed">
                  Send location + rough schedule + what you’re building. We’ll reply with a clean plan and options.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full bg-white text-[#0b1220] px-6 py-3 text-sm hover:bg-[#f1f5f9] transition"
                  >
                    Schedule a Consultation
                  </a>
                  <a
                    href="mailto:dj@cetointeractive.com"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 text-white px-6 py-3 text-sm hover:bg-white/15 transition"
                  >
                    Email DJ Morgan
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
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
    <section id={id} className="bg-white/80 rounded-3xl border border-[#e6e9f2] shadow-sm backdrop-blur">
      <div className="p-6 sm:p-8">
        <p className="text-xs tracking-[0.25em] uppercase text-[#2b5fb8]/80">{kicker}</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-light text-[#0b1220]">{title}</h2>
        <p className="mt-2 text-sm sm:text-base text-[#64748b] leading-relaxed">{subtitle}</p>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {cards.map((c) => (
            <div key={c.title} className="rounded-2xl border border-[#e6e9f2] bg-[#fafbff] p-5">
              <h3 className="text-base font-medium text-[#0b1220]">{c.title}</h3>
              <p className="mt-1 text-sm text-[#475569] leading-relaxed">{c.summary}</p>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-[#2b5fb8] hover:text-[#234f98] select-none">
                  What’s included
                </summary>
                <ul className="mt-3 space-y-2 text-sm text-[#334155]">
                  {c.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-[#1c8c72]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full bg-[#2b5fb8] text-white px-4 py-2 text-xs hover:bg-[#234f98] transition"
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

