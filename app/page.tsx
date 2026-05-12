'use client';

const THEME = {
  bg: '#F6F7F8',
  surface: 'rgba(255,255,255,0.62)',
  surfaceStrong: 'rgba(255,255,255,0.75)',
  border: 'rgba(20, 35, 55, 0.14)',
  ink: '#142337',
  leviBlue: '#2F5D8C',
  leviBlueDark: '#234B74',
  washedBlue: '#6E93B5',
  washedGreen: '#4F7A6A',
  washedGreenDark: '#3E6357',
  sunset: '#E07A5F'
};

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: THEME.bg }}>

      {/* Background atmosphere */}
      <div
        className="fixed inset-0 z-0"
        style={{
          opacity: 0.55,
          backgroundImage: `
            radial-gradient(circle at 18% 40%, rgba(47, 93, 140, 0.14) 0%, transparent 58%),
            radial-gradient(circle at 82% 78%, rgba(79, 122, 106, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 55% 18%, rgba(224, 122, 95, 0.06) 0%, transparent 55%)
          `
        }}
      />

      {/* Topo lines */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.35 }}>
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => {
            const y = 120 + i * 70;
            const o = 0.08 - i * 0.007;
            return (
              <path
                key={i}
                d={`M0 ${y} C 200 ${y - 18}, 360 ${y + 12}, 520 ${y - 8} C 700 ${y - 22}, 900 ${y + 18}, 1200 ${y - 6}`}
                fill="none"
                stroke={`rgba(20, 35, 55, ${Math.max(o, 0.02)})`}
                strokeWidth="1.15"
              />
            );
          })}
        </svg>
      </div>

      <div className="relative z-10">

        {/* ── HERO ── */}
        <section className="pt-14 pb-10 px-6 lg:px-10">
          <div className="max-w-5xl mx-auto text-center">
            <div
              className="mb-4 font-light text-xs md:text-sm tracking-[0.28em] uppercase"
              style={{ color: 'rgba(47, 93, 140, 0.75)' }}
            >
              Environmental Intelligence · McKinney, Texas
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-[1.02] tracking-tight" style={{ color: THEME.ink }}>
              Know the land{' '}
              <span className="font-normal" style={{ color: THEME.leviBlue }}>
                before you build.
              </span>
            </h1>

            <p className="mt-5 text-lg md:text-xl font-light max-w-3xl mx-auto leading-relaxed" style={{ color: 'rgba(20, 35, 55, 0.70)' }}>
              Phase I ESA screening with live federal data. Geospatial risk intelligence.
              Construction compliance built for Texas infrastructure and development.
            </p>

            {/* Credential pills */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {[
                'EP-TX Credentialed',
                'ASTM E1527-21 Compliant',
                '7 Federal Databases',
                'CETO Score™ 0–100',
              ].map((pill) => (
                <span
                  key={pill}
                  className="text-xs px-3 py-1.5 rounded-full font-light tracking-wide"
                  style={{
                    backgroundColor: 'rgba(47, 93, 140, 0.09)',
                    color: THEME.leviBlue,
                    border: '1px solid rgba(47, 93, 140, 0.18)'
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              
                href="/portal/login"
                className="inline-flex items-center justify-center text-white px-8 py-3.5 rounded-full font-light text-lg transition-colors duration-200 shadow-lg"
                style={{ backgroundColor: THEME.leviBlue }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = THEME.leviBlueDark; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = THEME.leviBlue; }}
              >
                Run a Site Screening
                <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>

              
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-light text-lg border transition-colors duration-200"
                style={{
                  color: THEME.leviBlue,
                  borderColor: 'rgba(47, 93, 140, 0.45)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(47, 93, 140, 0.10)';
                  e.currentTarget.style.borderColor = 'rgba(47, 93, 140, 0.60)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(47, 93, 140, 0.45)';
                }}
              >
                Talk to DJ Morgan
              </a>
            </div>
          </div>
        </section>

        {/* ── BRIDGE ── */}
        <section className="px-6 lg:px-10 pb-8">
          <div className="max-w-5xl mx-auto">
            <div
              className="rounded-3xl p-6 md:p-8"
              style={{
                backgroundColor: THEME.surface,
                border: `1px solid ${THEME.border}`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <p className="font-light text-base md:text-lg leading-relaxed" style={{ color: 'rgba(20, 35, 55, 0.72)' }}>
                Ceto Interactive combines field-verified environmental expertise with a proprietary screening platform — so developers,
                engineers, and municipalities can move faster, reduce acquisition risk, and make smarter land-use decisions.
              </p>
            </div>
          </div>
        </section>

        {/* ── CETO SCORE CTA ── */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-6 lg:px-10">
            <div
              className="rounded-3xl p-8 md:p-12 text-center"
              style={{
                backgroundColor: THEME.surfaceStrong,
                border: `1px solid ${THEME.border}`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-light tracking-[0.18em] uppercase"
                style={{ backgroundColor: 'rgba(47, 93, 140, 0.09)', color: THEME.leviBlue, border: '1px solid rgba(47, 93, 140, 0.18)' }}
              >
                CETO Score™ — Proprietary Risk Intelligence
              </div>

              <h2 className="text-4xl md:text-5xl font-light mb-4" style={{ color: THEME.ink }}>
                See a site&apos;s environmental risk<br />before you commit capital.
              </h2>

              <p className="text-lg font-light mb-6 max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(20, 35, 55, 0.70)' }}>
                Enter any address. Get a 0–100 weighted risk score drawn from EPA ECHO, FEMA, NWI, RCRA, SSURGO,
                and more — in minutes, not weeks.
              </p>

              {/* Score range visual */}
              <div className="flex justify-center gap-6 mb-8 flex-wrap">
                {[
                  { label: 'LOW RISK', range: '75–100', color: '#4F7A6A' },
                  { label: 'MODERATE', range: '40–74', color: '#B86A2E' },
                  { label: 'HIGH RISK', range: '0–39', color: '#C0392B' },
                ].map((tier) => (
                  <div key={tier.label} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                    <span className="text-xs font-light tracking-wide" style={{ color: 'rgba(20, 35, 55, 0.65)' }}>
                      {tier.label} <span className="font-medium" style={{ color: THEME.ink }}>{tier.range}</span>
                    </span>
                  </div>
                ))}
              </div>

              
                href="/portal/login"
                className="inline-flex items-center justify-center text-white px-8 py-3.5 rounded-full font-light text-lg transition-colors duration-200 shadow-lg"
                style={{ backgroundColor: THEME.leviBlue }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = THEME.leviBlueDark; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = THEME.leviBlue; }}
              >
                Run a Free Site Screening
                <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <p className="mt-3 text-xs font-light" style={{ color: 'rgba(20, 35, 55, 0.45)' }}>
                Preliminary desktop screening — EP-reviewed reports available on request
              </p>
            </div>
          </div>
        </section>

        {/* ── SERVICES ── */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-10">
            <div className="text-center mb-10">
              <div className="font-light text-xs tracking-[0.28em] uppercase mb-3" style={{ color: 'rgba(79, 122, 106, 0.80)' }}>
                What We Do
              </div>
              <h2 className="text-4xl md:text-5xl font-light" style={{ color: THEME.ink }}>
                Core Services
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <ServiceCard
                href="/services#phase1"
                title="Phase I ESA"
                desc="ASTM E1527-21 informed screening with live regulatory databases and the CETO Risk Score — faster than traditional workflows."
                icon="doc"
                accent={THEME.leviBlue}
              />
              <ServiceCard
                href="/services#site-intelligence"
                title="Site Intelligence"
                desc="Terrain, soils, geology, and hydrology analysis from USGS 3DEP, SSURGO, Macrostrat, and NHD — single geospatial report."
                icon="globe"
                accent={THEME.washedGreen}
              />
              <ServiceCard
                href="/services#construction"
                title="Construction Compliance"
                desc="SWPPP development, erosion control monitoring, and TPDES compliance coordination for active construction sites."
                icon="bolt"
                accent={THEME.leviBlue}
              />
            </div>

            <div className="mt-5 text-center">
              
                href="/services"
                className="inline-flex items-center font-light text-sm transition-colors"
                style={{ color: THEME.leviBlue }}
                onMouseEnter={(e) => { e.currentTarget.style.color = THEME.leviBlueDark; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = THEME.leviBlue; }}
              >
                View all services
                <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ── WHY CETO ── */}
        <section className="py-16" style={{ backgroundColor: 'rgba(255,255,255,0.40)' }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-10">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-light" style={{ color: THEME.ink }}>
                Built different.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Field credibility',
                  body: 'EP-TX credentialed with 8+ years across utility-scale infrastructure, energy, and commercial development in Texas.'
                },
                {
                  title: 'Live data, not stale PDFs',
                  body: 'Seven federal databases queried simultaneously — EPA ECHO, FEMA, NWI, RCRA, SSURGO, TCEQ, and Macrostrat — every time.'
                },
                {
                  title: 'Intelligence, not just reports',
                  body: 'The CETO Score™ converts complex environmental data into a single defensible number with confidence rating and deal-impact analysis.'
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl p-6"
                  style={{
                    backgroundColor: THEME.surface,
                    border: `1px solid ${THEME.border}`,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <h3 className="text-lg font-light mb-2" style={{ color: THEME.leviBlue }}>{item.title}</h3>
                  <p className="text-sm font-light leading-relaxed" style={{ color: 'rgba(20, 35, 55, 0.70)' }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section
          className="text-white relative overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(135deg, ${THEME.leviBlueDark} 0%, ${THEME.leviBlue} 55%, rgba(224, 122, 95, 0.18) 120%)`
          }}
        >
          <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center relative py-16">
            <div className="mb-3 font-light text-xs tracking-[0.28em] uppercase" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Get Started
            </div>
            <h2 className="text-4xl md:text-5xl font-light mb-5 leading-tight">
              Tell us what you&apos;re building.
            </h2>
            <p className="text-lg md:text-xl mb-9 text-white/80 font-light leading-relaxed">
              Send your location, schedule, and project type. We respond with scope and pricing — no lengthy intake forms.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              
                href="/contact"
                className="inline-block px-9 py-3.5 rounded-full font-light text-lg transition-colors duration-200 shadow-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: THEME.leviBlueDark }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.98)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.92)'; }}
              >
                Schedule a Consultation
              </a>

              
                href="/portal/login"
                className="inline-block px-9 py-3.5 rounded-full font-light text-lg border transition-colors duration-200"
                style={{ borderColor: 'rgba(255,255,255,0.45)', color: 'rgba(255,255,255,0.95)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.10)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Run a Site Screening
              </a>
            </div>
            <p className="mt-6 text-white/40 text-xs font-light">
              DJ Morgan · EP-TX-2025-0814 · Ceto Interactive · McKinney, Texas · 325-244-4350
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}

function ServiceCard({
  href,
  title,
  desc,
  icon,
  accent,
}: {
  href: string;
  title: string;
  desc: string;
  icon: 'doc' | 'bolt' | 'globe';
  accent: string;
}) {
  return (
    
      href={href}
      className="group rounded-3xl p-7 transition-all duration-300 hover:shadow-lg block"
      style={{
        backgroundColor: THEME.surface,
        border: `1px solid ${THEME.border}`,
        backdropFilter: 'blur(10px)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = `${accent}44`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.borderColor = THEME.border;
      }}
    >
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: `${accent}15` }}>
        <svg className="w-6 h-6" style={{ color: accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon === 'doc' && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          )}
          {icon === 'bolt' && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          )}
          {icon === 'globe' && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          )}
        </svg>
      </div>

      <h3 className="text-2xl font-light mb-2" style={{ color: THEME.ink }}>
        {title}
      </h3>

      <p className="text-base font-light leading-relaxed mb-4" style={{ color: 'rgba(20, 35, 55, 0.70)' }}>
        {desc}
      </p>

      <div className="flex items-center font-light text-sm" style={{ color: accent }}>
        <span>Learn More</span>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  );
}
