"use client";
import { useState } from "react";

const T = {
  bg: "#F4F5F7",
  ink: "#0E1C2E",
  inkMid: "rgba(14, 28, 46, 0.65)",
  inkLight: "rgba(14, 28, 46, 0.42)",
  blue: "#2A5480",
  blueDark: "#1C3D5E",
  blueWash: "rgba(42, 84, 128, 0.07)",
  green: "#3D6B58",
  greenWash: "rgba(61, 107, 88, 0.08)",
  amber: "#B86A2E",
  amberWash: "rgba(184, 106, 46, 0.08)",
  border: "rgba(14, 28, 46, 0.10)",
  surface: "rgba(255,255,255,0.68)",
  surfaceStrong: "rgba(255,255,255,0.88)",
};

const TABS = ["CETO Score™", "Who We Serve", "Capabilities"];

export default function CetoPage() {
  const [active, setActive] = useState(0);

  return (
    <main className="relative min-h-screen" style={{ backgroundColor: T.bg }}>
      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-16">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="text-xs tracking-[0.28em] uppercase font-light mb-3" style={{ color: T.blue }}>
            Environmental Intelligence Platform
          </div>
          <h1 className="text-4xl md:text-5xl font-light mb-4" style={{ color: T.ink }}>
            What is <span style={{ color: T.blue, fontWeight: 400 }}>Ceto Interactive</span>
          </h1>
          <p className="text-lg font-light max-w-2xl mx-auto leading-relaxed" style={{ color: T.inkMid }}>
            Ceto Interactive combines field-verified environmental expertise with a proprietary screening platform
            to deliver faster, more defensible environmental intelligence for land, infrastructure, and development decisions.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap justify-center">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActive(i)}
              className="px-6 py-2.5 rounded-full text-sm font-light transition-all"
              style={{
                backgroundColor: active === i ? T.blue : "rgba(255,255,255,0.72)",
                color: active === i ? "white" : T.ink,
                border: active === i ? "1px solid transparent" : `1px solid ${T.border}`,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: CETO Score */}
        {active === 0 && (
          <div className="space-y-6">
            <div className="rounded-3xl p-8 md:p-12" style={{ backgroundColor: T.surfaceStrong, border: `1px solid ${T.border}` }}>
              <div className="text-xs tracking-[0.22em] uppercase font-semibold mb-3" style={{ color: T.blue }}>Proprietary Risk Intelligence</div>
              <h2 className="text-3xl font-light mb-4" style={{ color: T.ink }}>The CETO Score™</h2>
              <p className="text-base font-light leading-relaxed mb-6" style={{ color: T.inkMid }}>
                The CETO Score™ is a proprietary environmental integrity index that synthesizes regulatory exposure,
                hydrology, geology, historical land use, and environmental constraints into a single weighted risk model.
                Scores range from 0 to 100 and are designed to convert environmental uncertainty into decision-ready intelligence.
              </p>
              <p className="text-base font-light leading-relaxed" style={{ color: T.inkMid }}>
                Traditional environmental assessments produce reports. Ceto produces a score — backed by live federal data,
                confidence ratings, and a deal-impact framework that tells you not just what was found, but what it means.
              </p>
            </div>

            {/* Score tiers */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: "LOW RISK", range: "75 – 100", color: "#3D6B58", desc: "Decision ready. Minimal environmental constraints identified. Proceed with standard diligence." },
                { label: "MODERATE RISK", range: "40 – 74", color: "#B86A2E", desc: "Elevated constraints present. Review findings before committing capital. Phase II may be warranted." },
                { label: "HIGH RISK", range: "0 – 39", color: "#A63228", desc: "Significant RECs or red flags identified. Recommend EP review and Phase II ESA before proceeding." },
              ].map((tier) => (
                <div key={tier.label} className="rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
                  <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: tier.color }} />
                  <div className="text-xs tracking-[0.18em] uppercase font-semibold mb-1" style={{ color: tier.color }}>{tier.label}</div>
                  <div className="text-2xl font-light mb-3" style={{ color: T.ink }}>{tier.range}</div>
                  <p className="text-sm font-light leading-relaxed" style={{ color: T.inkMid }}>{tier.desc}</p>
                </div>
              ))}
            </div>

            {/* Scoring factors */}
            <div className="rounded-3xl p-8" style={{ backgroundColor: T.surfaceStrong, border: `1px solid ${T.border}` }}>
              <h3 className="text-lg font-light mb-6" style={{ color: T.ink }}>Scoring Factors</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { factor: "Regulatory Proximity", desc: "EPA ECHO, RCRA, NPL Superfund, TCEQ STEERS — facilities weighted by type, distance, and release status" },
                  { factor: "Hydrology & Floodplain Risk", desc: "FEMA flood zone classification, NWI wetlands, drainage patterns, and ponding risk" },
                  { factor: "Soil & Geological Constraints", desc: "USDA SSURGO texture, drainage class, shrink-swell risk, and Macrostrat formation data" },
                  { factor: "Historical Land Use", desc: "Aerial photo review, Sanborn maps, EDR historical research for prior industrial or commercial activity" },
                  { factor: "Facility Type Exposure", desc: "Hard ceilings applied for known releases, dry cleaners, active gas stations, and UST sites" },
                  { factor: "Environmental Red Flag Indicators", desc: "Surface staining, stressed vegetation, distressed soil patterns, and adjacent land use observations" },
                ].map((f) => (
                  <div key={f.factor} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: T.blue }} />
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: T.ink }}>{f.factor}</div>
                      <div className="text-xs font-light leading-relaxed" style={{ color: T.inkMid }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <a href="/portal/login" className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium text-white transition-all" style={{ backgroundColor: T.blue }}>
                Run a Site Screening
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M6.5 3L9 6l-2.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {/* Tab: Who We Serve */}
        {active === 1 && (
          <div className="space-y-5">
            {[
              {
                type: "Real Estate Developers & Investors",
                accent: T.blue,
                problem: "Need to know environmental risk before committing capital to a site acquisition.",
                solution: "Phase I ESA screening with CETO Score delivers a defensible risk number in hours, not weeks. Identifies RECs, floodplain exposure, and regulatory proximity before you sign.",
                services: ["Phase I ESA", "CETO Score™", "Regulatory Risk Evaluation", "Environmental Due Diligence Bundle"],
              },
              {
                type: "Civil & Infrastructure Engineers",
                accent: T.green,
                problem: "Need environmental clearances, wetland determinations, and SWPPP compliance to keep projects on schedule.",
                solution: "Field-ready SWPPP development, erosion control monitoring, wetland delineation, and Section 404 coordination. Built to integrate with your construction timeline.",
                services: ["SWPPP / TPDES Compliance", "Wetland Delineation", "Section 404 Support", "Construction Monitoring"],
              },
              {
                type: "Real Estate Attorneys",
                accent: T.amber,
                problem: "Need a fast, credible environmental flag check before recommending Phase I to a client.",
                solution: "Desktop screening report with CETO Score delivered in 24 hours. Gives you a defensible preliminary assessment to present before committing to full Phase I scope.",
                services: ["Desktop Screening", "CETO Score™", "Regulatory Database Review"],
              },
              {
                type: "Municipal Planners & Government Agencies",
                accent: T.blue,
                problem: "Need environmental constraint analysis, SWPPP compliance, and permitting support for public infrastructure projects.",
                solution: "ASTM-compliant Phase I ESA, TPDES permitting, NEPA documentation support, and geospatial constraint mapping for public-sector timelines and budgets.",
                services: ["Phase I ESA", "NEPA Documentation", "SWPPP Compliance", "GIS Constraint Mapping"],
              },
              {
                type: "Energy & Renewable Developers",
                accent: T.green,
                problem: "Need early-stage environmental screening to identify permitting constraints and show-stoppers before committing to a site.",
                solution: "Desktop habitat review, wetland and floodplain screening, siting and routing analysis, and construction-phase environmental monitoring for solar, wind, and pipeline corridors.",
                services: ["Environmental Screening", "Siting & Routing Analysis", "Wetland Screening", "Construction CEM"],
              },
            ].map((buyer) => (
              <div key={buyer.type} className="rounded-3xl p-8" style={{ backgroundColor: T.surfaceStrong, border: `1px solid ${T.border}` }}>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-[10px] tracking-[0.22em] uppercase font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: `${buyer.accent}15`, color: buyer.accent, border: `1px solid ${buyer.accent}25` }}>
                    {buyer.type}
                  </span>
                </div>
                <div className="mb-2 text-sm font-medium" style={{ color: T.ink }}>The Problem</div>
                <p className="text-sm font-light leading-relaxed mb-4" style={{ color: T.inkMid }}>{buyer.problem}</p>
                <div className="mb-2 text-sm font-medium" style={{ color: T.ink }}>How Ceto Helps</div>
                <p className="text-sm font-light leading-relaxed mb-4" style={{ color: T.inkMid }}>{buyer.solution}</p>
                <div className="flex flex-wrap gap-2">
                  {buyer.services.map((s) => (
                    <span key={s} className="text-[11px] font-light px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(14,28,46,0.06)", color: "rgba(14,28,46,0.65)", border: "1px solid rgba(14,28,46,0.10)" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Capabilities */}
        {active === 2 && (
          <div className="space-y-6">

            {/* Company info */}
            <div className="rounded-3xl p-8" style={{ backgroundColor: T.surfaceStrong, border: `1px solid ${T.border}` }}>
              <h3 className="text-lg font-light mb-6" style={{ color: T.ink }}>Company Information</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Entity", value: "The Blue Duck LLC (Texas)" },
                  { label: "UEI", value: "LG15KPRZFQE3" },
                  { label: "CAGE", value: "14V05" },
                  { label: "SAM.gov", value: "Active — Federal Contracting" },
                  { label: "NAICS 541620", value: "Environmental Consulting" },
                  { label: "NAICS 562910", value: "Remediation Services" },
                  { label: "NAICS 541370", value: "Surveying & Mapping" },
                  { label: "NAICS 541690", value: "Other Scientific & Technical Consulting" },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <span className="font-medium shrink-0" style={{ color: T.blue, minWidth: "120px" }}>{item.label}</span>
                    <span className="font-light" style={{ color: T.inkMid }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="rounded-3xl p-8" style={{ backgroundColor: T.surfaceStrong, border: `1px solid ${T.border}` }}>
              <h3 className="text-lg font-light mb-6" style={{ color: T.ink }}>Certifications & Registrations</h3>
              <div className="space-y-3">
                {[
                  "Environmental Professional (EP-TX) — EP-TX-2025-0814",
                  "ASTM E1527-21 Compliant Practice",
                  "SAM.gov Active Registration",
                  "UEI: LG15KPRZFQE3",
                  "CAGE: 14V05",
                ].map((cert) => (
                  <div key={cert} className="flex items-center gap-3 text-sm">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6.5" stroke={T.green} strokeWidth="1" />
                      <path d="M4.5 7l2 2 3-3" stroke={T.green} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="font-light" style={{ color: T.inkMid }}>{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TxDOT pre-certs */}
            <div className="rounded-3xl p-8" style={{ backgroundColor: T.surfaceStrong, border: `1px solid ${T.border}` }}>
              <h3 className="text-lg font-light mb-2" style={{ color: T.ink }}>TxDOT Pre-Certifications</h3>
              <p className="text-xs font-light mb-6" style={{ color: T.inkLight }}>Pre-certified vendor for Texas Department of Transportation environmental services</p>
              <div className="space-y-3">
                {[
                  { code: "2.3.1", desc: "Wetland Delineation" },
                  { code: "2.4.1", desc: "Nationwide Permitting" },
                  { code: "2.5.1", desc: "Water Pollution Abatement Plans" },
                  { code: "2.6.1", desc: "Protected Species Habitat Determinations" },
                  { code: "2.6.2", desc: "Impact Evaluation Assessments" },
                  { code: "2.6.3", desc: "Biological Surveys" },
                  { code: "2.13.1", desc: "Hazardous Materials Initial Site Assessment" },
                ].map((item) => (
                  <div key={item.code} className="flex items-center gap-4 text-sm">
                    <span className="font-semibold shrink-0 w-12" style={{ color: T.blue }}>{item.code}</span>
                    <span className="font-light" style={{ color: T.inkMid }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Typical sectors */}
            <div className="rounded-3xl p-8" style={{ backgroundColor: T.surfaceStrong, border: `1px solid ${T.border}` }}>
              <h3 className="text-lg font-light mb-6" style={{ color: T.ink }}>Typical Project Sectors</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Transportation & Infrastructure",
                  "Energy & Pipeline Projects",
                  "Municipal Infrastructure Projects",
                  "Commercial & Industrial Development",
                  "Engineering & Development Firms",
                  "Real Estate Due Diligence",
                ].map((sector) => (
                  <span key={sector} className="text-[12px] font-light px-4 py-2 rounded-full" style={{ backgroundColor: T.blueWash, color: T.blue, border: `1px solid rgba(42,84,128,0.15)` }}>
                    {sector}
                  </span>
                ))}
              </div>
            </div>

            {/* Download capability statement */}
            <div className="rounded-3xl p-8 text-center" style={{ backgroundImage: `linear-gradient(135deg, ${T.blueDark} 0%, ${T.blue} 100%)` }}>
              <h3 className="text-xl font-light text-white mb-2">Capability Statement</h3>
              <p className="text-white/70 font-light text-sm mb-6">Full capability statement for procurement officers and teaming partners</p>
              <a
                href="/Ceto_Interactive_Capability_Statement.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-medium transition-all"
                style={{ backgroundColor: "rgba(255,255,255,0.92)", color: T.blueDark }}
              >
                Download PDF
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2v6M3 6l3 3 3-3M2 10h8" stroke={T.blueDark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
