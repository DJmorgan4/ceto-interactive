"use client";

import { useState } from "react";

const T = {
  bg: "#F4F5F7",
  ink: "#0E1C2E",
  inkMid: "rgba(14, 28, 46, 0.65)",
  inkLight: "rgba(14, 28, 46, 0.42)",
  blue: "#2A5480",
  blueDark: "#1C3D5E",
  blueMid: "#4A7AA8",
  blueWash: "rgba(42, 84, 128, 0.07)",
  green: "#3D6B58",
  greenWash: "rgba(61, 107, 88, 0.08)",
  amber: "#B86A2E",
  amberWash: "rgba(184, 106, 46, 0.08)",
  border: "rgba(14, 28, 46, 0.10)",
  borderStrong: "rgba(14, 28, 46, 0.18)",
  surface: "rgba(255,255,255,0.68)",
  surfaceStrong: "rgba(255,255,255,0.88)",
};

const SERVICES = [
  {
    id: "phase1",
    kicker: "Phase I ESA",
    accent: T.blue,
    accentWash: T.blueWash,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="2" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M6 6h4M6 9h4M6 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M13 10l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Phase I Environmental Site Assessment",
    subtitle: "ASTM E1527-21 informed screening with live federal data and the CETO Risk Score — delivered faster than traditional ESA workflows.",
    badge: "CETO Portal",
    cards: [
      {
        title: "Regulatory Database Review",
        tag: "7 live sources",
        summary: "Simultaneous queries across EPA ECHO, RCRA, NPL Superfund, TCEQ STEERS, FEMA, NWI, and SSURGO in real time.",
        bullets: [
          "EPA ECHO — facilities within ASTM E1527-21 search radii",
          "RCRA / NPL Superfund boundary query",
          "TCEQ STEERS coordination + manual search support",
          "FEMA flood zone + USFWS NWI wetlands",
          "USDA SSURGO soils + Macrostrat geology",
        ],
      },
      {
        title: "CETO Environmental Risk Score",
        tag: "Proprietary scoring",
        summary: "Weighted 0–100 risk score with confidence rating, facility-type weighting, distance decay modeling, and data gap separation.",
        bullets: [
          "5-category weighted score (regulatory, wetland, flood, soil, field)",
          "CONFIRMED REC / POTENTIAL REC / PROXIMITY CONCERN tier system",
          "Confidence rating separate from risk score",
          "Hard ceilings for known releases, former dry cleaners, active gas stations",
          "Go / No-Go acquisition dashboard with deal impact analysis",
        ],
      },
      {
        title: "Report Generation",
        tag: "AI-assisted draft",
        summary: "ASTM E1527-21 informed report draft generated from live data — structured, section-complete, and ready for EP review.",
        bullets: [
          "8-section report structure (ASTM E1527-21 aligned)",
          "Preliminary screening disclaimer on all outputs",
          "Nearest facility narrative auto-populated from live data",
          "Data gap impact statements per ASTM requirements",
          "PDF export with Risk Score + Confidence badge",
        ],
      },
      {
        title: "Site Reconnaissance Support",
        tag: "Field checklist",
        summary: "Structured field observation checklist — surface conditions, UST/AST indicators, drainage, vegetation, adjacent land use.",
        bullets: [
          "Desktop-only or physical site visit workflow",
          "Pre-built observation categories (ASTM-aligned)",
          "Photo log support",
          "Field notes feed directly into risk score and report",
        ],
      },
    ],
  },
  {
    id: "site-intelligence",
    kicker: "Site Intelligence",
    accent: T.green,
    accentWash: T.greenWash,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M10 2.5v15M2.5 10h15" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        <path d="M5 5.5C6.5 7 8.5 8 10 8s3.5-1 5-2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        <path d="M5 14.5C6.5 13 8.5 12 10 12s3.5 1 5 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
    ),
    title: "Site Intelligence Reports",
    subtitle: "Terrain, soils, geology, hydrology, and cross-section analysis from USGS 3DEP, Macrostrat, SSURGO, and NHD — delivered as a single geospatial intelligence report.",
    badge: "LithicEarth Engine",
    cards: [
      {
        title: "Terrain & Slope Analysis",
        tag: "USGS 3DEP",
        summary: "1m resolution DEM via USGS 3DEP WCS — hillshade, adaptive slope classification, and terrain statistics.",
        bullets: [
          "Hillshade + elevation colormap",
          "Adaptive slope bins (auto-scaled to actual terrain range)",
          "Mean slope, max slope, % area per class",
          "Dominant slope class identification",
        ],
      },
      {
        title: "Soils & Surface Conditions",
        tag: "SSURGO / SoilGrids",
        summary: "USDA SSURGO primary, SoilGrids supplemental — texture, drainage, shrink-swell, depth to bedrock, and spatial variability.",
        bullets: [
          "Texture composition (clay/sand/silt %)",
          "Drainage class + shrink-swell risk",
          "Depth to restriction / bedrock",
          "Soil spatial variability (Low / Moderate / High)",
          "Engineering implication narrative",
        ],
      },
      {
        title: "Cross-Section & Terrain Metrics",
        tag: "Transect analysis",
        summary: "User-defined transect generates an interpreted elevation profile with derived terrain intelligence.",
        bullets: [
          "Total relief, terrain character (Flat / Rolling / Hilly / Steep)",
          "Steepest segment identification + gradient %",
          "Cut/fill implication (Minimal / Moderate / Significant)",
          "Annotated chart with orange steepest-segment highlight",
        ],
      },
      {
        title: "Geology & Hydrology",
        tag: "Macrostrat + NHD",
        summary: "Macrostrat formation data and USGS NHD flow accumulation combined with drainage network visualization.",
        bullets: [
          "Geologic formation + age + lithology",
          "Flow accumulation drainage map",
          "NHD hydrology overlay",
          "Ponding risk assessment",
        ],
      },
    ],
  },
  {
    id: "construction",
    kicker: "Construction",
    accent: T.blue,
    accentWash: T.blueWash,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 15h14M5 15V9l5-6 5 6v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="8" y="11" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.1"/>
      </svg>
    ),
    title: "Construction Environmental Compliance",
    subtitle: "SWPPP development, erosion control monitoring, and compliance coordination — built to keep your project out of regulatory trouble.",
    badge: "Field-ready",
    cards: [
      {
        title: "SWPPP Development & Management",
        tag: "TPDES / NPDES",
        summary: "Site-specific Stormwater Pollution Prevention Plans with ongoing updates aligned to project phase and permit conditions.",
        bullets: [
          "Site-specific plan + BMP selection",
          "NOI preparation + contractor onboarding",
          "Plan updates as conditions change",
          "NOT/NOT filing coordination",
        ],
      },
      {
        title: "Erosion Control Monitoring",
        tag: "Inspections",
        summary: "Routine inspections with photo documentation, clear action items, and inspector-signed reports.",
        bullets: [
          "Weekly inspections + post-rain event checks",
          "Photo log + GPS-tagged observations",
          "Monthly summary reporting (as needed)",
          "Non-compliance documentation + corrective action tracking",
        ],
      },
      {
        title: "Pre-Construction Environmental Screening",
        tag: "Desktop review",
        summary: "Regulatory + physical setting risk scan before you break ground — fast, practical, and defensible.",
        bullets: [
          "Regulatory database review (EPA / TCEQ)",
          "Wetland and floodplain screening",
          "Historical aerial review",
          "Permit pathway identification",
        ],
      },
      {
        title: "Compliance Coordination",
        tag: "Agency liaison",
        summary: "Support for permitting correspondence, agency submittals, training, and recordkeeping.",
        bullets: [
          "Agency communication support",
          "Submittal tracking + documentation",
          "Field coordination + toolbox talks",
          "Inspection readiness review",
        ],
      },
    ],
  },
  {
    id: "renewable",
    kicker: "Renewables",
    accent: T.green,
    accentWash: T.greenWash,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v2M10 15v2M3 10H1M19 10h-2M5.22 5.22L3.8 3.8M16.2 16.2l-1.42-1.42M5.22 14.78L3.8 16.2M16.2 3.8l-1.42 1.42" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
    title: "Renewable Energy Environmental Services",
    subtitle: "Environmental screening and compliance support for solar, wind, and battery storage projects — from early-stage constraints to construction monitoring.",
    badge: "Solar · Wind · BESS",
    cards: [
      {
        title: "Project Environmental Screening",
        tag: "Constraints analysis",
        summary: "Early-stage constraints review to identify permitting pathways and show-stoppers before you commit capital.",
        bullets: [
          "Habitat and wetland constraints mapping",
          "Cultural resources screening (as applicable)",
          "Preliminary permit pathway identification",
          "Regulatory agency coordination list",
        ],
      },
      {
        title: "Permitting Coordination",
        tag: "Multi-agency",
        summary: "Help navigating USACE, state, and local agency processes — permit tracking, milestone planning, and compliance checklists.",
        bullets: [
          "USACE Section 404 coordination support",
          "State agency consultation support",
          "Permit tracking and milestone planning",
          "Compliance checklists for construction teams",
        ],
      },
      {
        title: "Construction Environmental Monitoring",
        tag: "On-site CEM",
        summary: "On-site compliance checks during construction phases — documented, actionable, permit-condition specific.",
        bullets: [
          "Construction compliance inspections",
          "Permit condition verification",
          "Photo documentation + field reporting",
          "Non-compliance escalation protocol",
        ],
      },
    ],
  },
  {
    id: "technology",
    kicker: "Technology",
    accent: T.amber,
    accentWash: T.amberWash,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="5" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M6 10h2l1.5-2.5L11 12.5 12.5 10H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Environmental Intelligence Technology",
    subtitle: "Sensor monitoring, automated documentation, and geospatial intelligence tools — built for environmental professionals who need real data, not dashboards.",
    badge: "ESP32 · IoT · GIS",
    cards: [
      {
        title: "Environmental Sensor Networks",
        tag: "IoT / ESP32",
        summary: "Real-time environmental monitoring with configurable sensors, automated logging, and threshold alerting.",
        bullets: [
          "Water level, precipitation, and temperature monitoring",
          "Configurable sensor packages (site-specific)",
          "Automated data logging + cloud sync",
          "Threshold alerts + monthly reporting",
        ],
      },
      {
        title: "Wetland & Conservation Monitoring",
        tag: "Mitigation sites",
        summary: "Hydrology and habitat monitoring for mitigation banks, conservation easements, and permit-required monitoring sites.",
        bullets: [
          "Water level and precipitation tracking",
          "Vegetation transect scheduling support",
          "Camera trap integration options",
          "Quarterly / annual reports per permit schedule",
        ],
      },
      {
        title: "Geospatial Intelligence (LithicEarth)",
        tag: "MSIGI platform",
        summary: "Multi-source geospatial intelligence combining terrain, spectral, SAR, and regulatory data into a single scored output.",
        bullets: [
          "USGS 3DEP + Sentinel-2 + SAR fusion",
          "DBSCAN anomaly detection + candidate scoring",
          "Muon flux baseline (Gaisser + NOAA Kp)",
          "Hexagonal grid sampling + composite scoring",
          "Leaflet portal with candidate visualization",
        ],
      },
      {
        title: "Construction Documentation Systems",
        tag: "Photo + records",
        summary: "Automated photo capture, cloud organization, and compliance documentation workflows for active construction sites.",
        bullets: [
          "Scheduled and event-triggered capture",
          "Cloud organization by project and date",
          "Automated inspection summaries",
          "Inspector-ready export formats",
        ],
      },
    ],
  },
];

function ServiceCard({
  card,
  accent,
}: {
  card: (typeof SERVICES)[0]["cards"][0];
  accent: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200"
      style={{
        border: `1px solid ${T.border}`,
        backgroundColor: T.surfaceStrong,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-medium leading-snug" style={{ color: T.ink }}>
              {card.title}
            </h3>
            <span
              className="text-[10px] tracking-[0.14em] uppercase px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${accent}15`, color: accent }}
            >
              {card.tag}
            </span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed font-light" style={{ color: T.inkMid }}>
            {card.summary}
          </p>
        </div>
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="mt-3 flex items-center gap-1.5 text-[12px] font-medium transition-colors"
        style={{ color: accent }}
      >
        <span>{open ? "Hide details" : "What's included"}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
          <ul className="space-y-2">
            {card.bullets.map((b) => (
              <li key={b} className="flex gap-2.5 text-[13px]" style={{ color: "rgba(14, 28, 46, 0.82)" }}>
                <span
                  className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: accent }}
                />
                <span className="font-light leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <a
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-medium tracking-wide transition-all"
              style={{ backgroundColor: accent, color: "white" }}
            >
              Request Quote
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceSection({ svc }: { svc: (typeof SERVICES)[0] }) {
  return (
    <section
      id={svc.id}
      className="rounded-3xl overflow-hidden"
      style={{
        backgroundColor: T.surface,
        border: `1px solid ${T.border}`,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Section header */}
      <div
        className="px-7 py-6 flex items-start justify-between gap-4"
        style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: svc.accentWash }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${svc.accent}18`, color: svc.accent }}
            >
              {svc.icon}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] tracking-[0.24em] uppercase font-semibold"
                style={{ color: svc.accent }}
              >
                {svc.kicker}
              </span>
              <span
                className="text-[10px] tracking-[0.12em] uppercase px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${svc.accent}12`, color: svc.accent, border: `1px solid ${svc.accent}22` }}
              >
                {svc.badge}
              </span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-light leading-snug" style={{ color: T.ink }}>
            {svc.title}
          </h2>
          <p className="mt-1.5 text-[13px] sm:text-sm font-light leading-relaxed max-w-2xl" style={{ color: T.inkMid }}>
            {svc.subtitle}
          </p>
        </div>
        <a
          href={`/contact?service=${svc.id}`}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[12px] font-medium transition-all shrink-0"
          style={{ backgroundColor: svc.accent, color: "white" }}
        >
          Get Started
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {/* Cards grid */}
      <div className="p-6 sm:p-7">
        <div className="grid sm:grid-cols-2 gap-4">
          {svc.cards.map((card) => (
            <ServiceCard key={card.title} card={card} accent={svc.accent} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Services() {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: T.bg }}>

      {/* Background atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            radial-gradient(ellipse 900px 600px at 15% 35%, rgba(42, 84, 128, 0.09) 0%, transparent 65%),
            radial-gradient(ellipse 700px 500px at 85% 70%, rgba(61, 107, 88, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 600px 400px at 60% 10%, rgba(184, 106, 46, 0.05) 0%, transparent 55%)
          `
        }} />
        {/* Topo lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => {
            const y = 80 + i * 68;
            const opacity = Math.max(0.018, 0.055 - i * 0.004);
            return (
              <path
                key={i}
                d={`M-50 ${y} C200 ${y - 22}, 420 ${y + 16}, 680 ${y - 10} C960 ${y - 26}, 1180 ${y + 14}, 1490 ${y - 8}`}
                fill="none"
                stroke={`rgba(14, 28, 46, ${opacity})`}
                strokeWidth="1.2"
              />
            );
          })}
        </svg>
      </div>

      <div className="relative z-10">
        {/* ── HERO ── */}
        <section className="px-5 sm:px-8 lg:px-12 pt-10 pb-6">
          <div className="max-w-7xl mx-auto">
            <div
              className="rounded-3xl px-8 sm:px-12 py-10 sm:py-12"
              style={{
                backgroundColor: T.surfaceStrong,
                border: `1px solid ${T.border}`,
                backdropFilter: "blur(14px)",
              }}
            >
              <div className="max-w-4xl">
                <p className="text-[10px] tracking-[0.32em] uppercase font-semibold mb-3" style={{ color: `${T.blue}cc` }}>
                  Ceto Interactive · Services
                </p>

                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-light leading-[1.08] tracking-tight"
                  style={{ color: T.ink }}
                >
                  Environmental intelligence,
                  <br />
                  <span style={{ color: T.blue }}>built for the field.</span>
                </h1>

                <p className="mt-5 text-base sm:text-lg font-light leading-relaxed max-w-2xl" style={{ color: T.inkMid }}>
                  Phase I ESA screening with live federal data. Terrain and geospatial intelligence. Construction compliance and monitoring systems. Built by an EP and deployed at scale.
                </p>

                {/* Stat pills */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {[
                    { label: "7 federal databases", sub: "queried simultaneously" },
                    { label: "CETO Risk Score", sub: "0–100 with confidence rating" },
                    { label: "ASTM E1527-21", sub: "informed screening workflow" },
                    { label: "1m DEM resolution", sub: "USGS 3DEP terrain analysis" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl px-4 py-2.5"
                      style={{ backgroundColor: T.blueWash, border: `1px solid rgba(42, 84, 128, 0.12)` }}
                    >
                      <div className="text-[12px] font-semibold" style={{ color: T.blue }}>
                        {stat.label}
                      </div>
                      <div className="text-[11px] font-light" style={{ color: T.inkMid }}>
                        {stat.sub}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Nav anchors */}
                <div className="mt-7 flex flex-wrap gap-2">
                  {SERVICES.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-medium transition-all"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.72)",
                        border: `1px solid ${T.border}`,
                        color: T.ink,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = s.accentWash;
                        e.currentTarget.style.borderColor = `${s.accent}30`;
                        e.currentTarget.style.color = s.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.72)";
                        e.currentTarget.style.borderColor = T.border;
                        e.currentTarget.style.color = T.ink;
                      }}
                    >
                      <span style={{ color: "inherit" }}>{s.kicker}</span>
                    </a>
                  ))}
                  <a
                    href="/contact"
                    className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[12px] font-medium transition-all"
                    style={{ backgroundColor: T.ink, color: "white" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#000")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = T.ink)}
                  >
                    Request a Quote
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SERVICES LAYOUT ── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-10">
          <div className="grid lg:grid-cols-12 gap-6">

            {/* Sticky sidebar */}
            <aside className="lg:col-span-3">
              <div
                className="sticky top-6 rounded-3xl p-5"
                style={{
                  backgroundColor: T.surface,
                  border: `1px solid ${T.border}`,
                  backdropFilter: "blur(12px)",
                }}
              >
                <p className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-3" style={{ color: T.inkLight }}>
                  Jump to
                </p>
                <nav className="space-y-0.5">
                  {SERVICES.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-light transition-all group"
                      style={{ color: T.ink }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = s.accentWash;
                        e.currentTarget.style.color = s.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = T.ink;
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 transition-all"
                        style={{ backgroundColor: s.accent, opacity: 0.5 }}
                      />
                      {s.title.split(" ").slice(0, 3).join(" ")}…
                    </a>
                  ))}
                </nav>

                <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                  <p className="text-[11px] font-light mb-3" style={{ color: T.inkLight }}>
                    Ready to get started?
                  </p>
                  <a
                    href="/contact"
                    className="flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12px] font-medium transition-all w-full"
                    style={{ backgroundColor: T.blue, color: "white" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.blueDark)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = T.blue)}
                  >
                    Schedule a Call
                  </a>
                  <a
                    href="mailto:dj@cetointeractive.com"
                    className="flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12px] font-light transition-all w-full mt-2"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.60)",
                      border: `1px solid ${T.border}`,
                      color: T.ink,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.90)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.60)")}
                  >
                    Email DJ Morgan
                  </a>
                  <p className="mt-4 text-[11px] font-light leading-relaxed" style={{ color: T.inkLight }}>
                    EP-TX-2025-0814 · McKinney, Texas
                    <br />
                    Pricing varies by scope + location.
                    <br />
                    We quote quickly with the basics.
                  </p>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <div className="lg:col-span-9 space-y-6">
              {SERVICES.map((svc) => (
                <ServiceSection key={svc.id} svc={svc} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FOOTER ── */}
        <section style={{ borderTop: `1px solid ${T.border}`, backgroundColor: "rgba(255,255,255,0.35)" }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-14">
            <div
              className="rounded-3xl p-8 sm:p-12 relative overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(135deg, ${T.blueDark} 0%, ${T.blue} 50%, rgba(61, 107, 88, 0.22) 100%)`,
                border: `1px solid rgba(255,255,255,0.08)`,
              }}
            >
              {/* Topo accent */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl" aria-hidden>
                <svg className="absolute -bottom-10 -right-10 w-64 h-64 opacity-10" viewBox="0 0 256 256">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <circle key={i} cx="128" cy="128" r={40 + i * 24} fill="none" stroke="white" strokeWidth="1" />
                  ))}
                </svg>
              </div>

              <div className="relative max-w-2xl">
                <p className="text-[10px] tracking-[0.28em] uppercase font-semibold text-white/50 mb-3">
                  Get a quote
                </p>
                <h2 className="text-2xl sm:text-4xl font-light text-white leading-snug">
                  Tell us what you're building.
                  <br />
                  <span className="text-white/70">We'll respond with a clean plan.</span>
                </h2>
                <p className="mt-4 text-white/65 font-light leading-relaxed text-sm sm:text-base">
                  Send us your location, schedule, and project type. We'll reply with scope options and pricing — no lengthy intake forms.
                </p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-medium transition-all shadow-sm"
                    style={{ backgroundColor: "rgba(255,255,255,0.95)", color: T.blueDark }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "white")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.95)")}
                  >
                    Schedule a Consultation
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M6.5 3L9 6l-2.5 3" stroke={T.blueDark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                  <a
                    href="mailto:dj@cetointeractive.com"
                    className="inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-light transition-all"
                    style={{ border: "1px solid rgba(255,255,255,0.30)", backgroundColor: "rgba(255,255,255,0.08)", color: "white" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.14)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
                  >
                    Email DJ Morgan
                  </a>
                </div>
                <p className="mt-5 text-white/40 text-[11px] font-light">
                  DJ Morgan · EP-TX-2025-0814 · Ceto Interactive Environmental Consulting · McKinney, Texas
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
