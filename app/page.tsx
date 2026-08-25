'use client';

import { useEffect, useRef, useState } from 'react';

const THEME = {
  bg: '#F6F7F8',
  surface: 'rgba(255,255,255,0.62)',
  surfaceStrong: 'rgba(255,255,255,0.78)',
  border: 'rgba(20, 35, 55, 0.14)',
  ink: '#142337',

  leviBlue: '#2F5D8C',
  leviBlueDark: '#234B74',
  washedBlue: '#6E93B5',

  washedGreen: '#4F7A6A',
  washedGreenDark: '#3E6357',

  sunset: '#E07A5F',
};

// ── Site facts — edit these in ONE place ───────────────────────────────
// Set TURNAROUND_DAYS to your honest number. Drop a sanitized sample PDF
// at /public/ceto-sample-phase1.pdf (or change SAMPLE_REPORT_URL).
const TURNAROUND_DAYS = 5;
const SAMPLE_REPORT_URL = '/ceto-sample-phase1.pdf';

const DATABASES = [
  'EPA ECHO',
  'RCRA',
  'NPL Superfund',
  'TCEQ STEERS',
  'FEMA NFHL',
  'NWI Wetlands',
  'SSURGO Soils',
];

const DEMO_SCORE = 73;

// ── Animated CETO Score card ───────────────────────────────────────────
// Databases resolve one by one, then the score counts up and the bar
// fills. Respects prefers-reduced-motion (jumps straight to final state).
function CetoScoreCard() {
  const [checked, setChecked] = useState(0);
  const [score, setScore] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setChecked(DATABASES.length);
      setScore(DEMO_SCORE);
      return;
    }

    let i = 0;
    const checkTimer = setInterval(() => {
      i += 1;
      setChecked(i);
      if (i >= DATABASES.length) {
        clearInterval(checkTimer);
        // Count the score up after the last database resolves
        const t0 = performance.now();
        const duration = 900;
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setScore(Math.round(eased * DEMO_SCORE));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, 240);

    return () => clearInterval(checkTimer);
  }, []);

  const allDone = checked >= DATABASES.length;

  return (
    <div
      className="rounded-3xl p-6 md:p-7 w-full"
      style={{
        backgroundColor: THEME.surfaceStrong,
        border: `1px solid ${THEME.border}`,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 18px 50px -24px rgba(20,35,55,0.25)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className="font-light text-[11px] tracking-[0.22em] uppercase"
          style={{ color: 'rgba(20,35,55,0.55)' }}
        >
          CETO Risk Score
        </span>
        <span
          className="text-[11px] font-light px-3 py-1 rounded-full"
          style={{
            color: THEME.leviBlue,
            backgroundColor: 'rgba(47,93,140,0.10)',
          }}
        >
          {allDone ? 'Query complete' : 'Querying live…'}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span
          className="text-5xl font-light tabular-nums"
          style={{ color: allDone ? THEME.sunset : 'rgba(20,35,55,0.35)' }}
        >
          {score}
        </span>
        <span className="text-sm font-light" style={{ color: 'rgba(20,35,55,0.55)' }}>
          / 100 · moderate · 91% confidence
        </span>
      </div>

      <div
        className="h-1.5 rounded-full overflow-hidden mb-5"
        style={{ backgroundColor: 'rgba(20,35,55,0.08)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            backgroundColor: THEME.sunset,
            transition: 'width 120ms linear',
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
        {DATABASES.map((db, i) => {
          const done = i < checked;
          return (
            <div key={db} className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0 transition-colors duration-300"
                style={{
                  backgroundColor: done ? 'rgba(79,122,106,0.15)' : 'rgba(20,35,55,0.06)',
                }}
              >
                {done ? (
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke={THEME.washedGreenDark} strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: 'rgba(20,35,55,0.25)' }}
                  />
                )}
              </span>
              <span
                className="text-[12.5px] font-light transition-colors duration-300"
                style={{ color: done ? 'rgba(20,35,55,0.78)' : 'rgba(20,35,55,0.40)' }}
              >
                {db}
              </span>
            </div>
          );
        })}
        <span className="text-[12.5px] font-light" style={{ color: 'rgba(20,35,55,0.45)' }}>
          {checked} of {DATABASES.length} sources returned
        </span>
      </div>

      <div
        className="mt-5 pt-4 text-[11px] font-light"
        style={{ borderTop: `1px solid ${THEME.border}`, color: 'rgba(20,35,55,0.45)' }}
      >
        Representative site · every report includes full source citations
      </div>
    </div>
  );
}

// ── Site map illustration (placeholder for real field photo) ──────────
// When you have a drone/field shot, swap this SVG for the photo and keep
// the dashed polygon + label chips as an absolutely-positioned overlay —
// that "traced boundary on a real site" image is the Ceto signature.
function FieldDataMap() {
  return (
    <svg
      viewBox="0 0 520 300"
      className="w-full rounded-3xl"
      style={{ border: `1px solid ${THEME.border}` }}
      role="img"
      aria-label="Site map with traced wetland boundary and floodplain limit"
    >
      <rect width="520" height="300" rx="24" fill="rgba(79,122,106,0.10)" />
      {Array.from({ length: 7 }).map((_, i) => {
        const y = 40 + i * 38;
        return (
          <path
            key={i}
            d={`M0 ${y} C 130 ${y - 14}, 240 ${y + 10}, 350 ${y - 6} C 430 ${y - 16}, 480 ${y + 8}, 520 ${y - 2}`}
            fill="none"
            stroke="rgba(79,122,106,0.35)"
            strokeWidth="1.2"
          />
        );
      })}
      <polygon
        points="180,80 300,62 375,120 330,195 210,185 150,130"
        fill="rgba(79,122,106,0.22)"
        stroke={THEME.washedGreenDark}
        strokeWidth="2.5"
        strokeDasharray="8 5"
      />
      <path
        d="M40 250 C 160 232, 330 262, 500 240"
        fill="none"
        stroke={THEME.leviBlue}
        strokeWidth="2"
        strokeDasharray="4 5"
      />
      <circle cx="262" cy="128" r="6" fill={THEME.ink} />
      <circle cx="262" cy="128" r="12" fill="none" stroke={THEME.ink} strokeWidth="1.2" opacity="0.35" />

      <g>
        <rect x="290" y="96" width="168" height="26" rx="13" fill={THEME.ink} />
        <text x="306" y="113" fontSize="12.5" fill="#F6F7F8" fontWeight="300">
          NWI wetland boundary
        </text>
      </g>
      <g>
        <rect x="42" y="256" width="126" height="26" rx="13" fill={THEME.leviBlueDark} />
        <text x="58" y="273" fontSize="12.5" fill="#F6F7F8" fontWeight="300">
          Zone AE limit
        </text>
      </g>
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="pt-14 md:pt-20 pb-12 px-6 lg:px-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          <div>
            <div
              className="mb-5 font-light text-xs md:text-sm tracking-[0.28em] uppercase"
              style={{ color: 'rgba(47, 93, 140, 0.75)' }}
            >
              ASTM E1527-21 · EP-Licensed · Texas
            </div>

            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-light leading-[1.06] tracking-tight"
              style={{ color: THEME.ink, fontFamily: 'var(--font-inter), Inter, sans-serif' }}
            >
              Phase I ESAs powered by{' '}
              <span style={{ color: THEME.leviBlue }}>live federal data.</span>
            </h1>

            <p
              className="mt-6 text-lg md:text-xl font-light max-w-xl leading-relaxed"
              style={{ color: 'rgba(20, 35, 55, 0.70)' }}
            >
              Seven regulatory databases queried in real time. Site risk scored
              0–100 with confidence. EP-reviewed and delivered in days, not weeks.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="/contact?service=phase1"
                className="inline-flex items-center justify-center text-white px-8 py-3.5 rounded-full font-light text-lg transition-colors duration-200 shadow-lg"
                style={{ backgroundColor: THEME.leviBlue }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = THEME.leviBlueDark)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = THEME.leviBlue)}
              >
                Get a Quote in 24 Hours
                <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>

              <a
                href={SAMPLE_REPORT_URL}
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-light text-lg border transition-colors duration-200"
                style={{
                  color: THEME.leviBlue,
                  borderColor: 'rgba(47, 93, 140, 0.45)',
                  backgroundColor: 'transparent',
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
                See a Sample Report
              </a>
            </div>
          </div>

          <CetoScoreCard />
        </div>
      </section>

      {/* Proof strip */}
      <section className="px-6 lg:px-10 pb-14">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { stat: '7', label: 'federal databases, queried live' },
            { stat: '0–100', label: 'CETO Score with confidence rating' },
            { stat: 'E1527-21', label: 'ASTM-informed workflow' },
            { stat: '1m', label: 'DEM terrain resolution · USGS 3DEP' },
          ].map((s) => (
            <div
              key={s.stat}
              className="rounded-3xl p-5 md:p-6"
              style={{
                backgroundColor: THEME.surface,
                border: `1px solid ${THEME.border}`,
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="text-2xl md:text-3xl font-light" style={{ color: THEME.ink }}>
                {s.stat}
              </div>
              <div className="mt-1 text-sm font-light leading-snug" style={{ color: 'rgba(20,35,55,0.62)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-10">
            <div
              className="font-light text-xs tracking-[0.28em] uppercase mb-3"
              style={{ color: 'rgba(79, 122, 106, 0.80)' }}
            >
              Environmental Intelligence Services
            </div>
            <h2
              className="text-4xl md:text-5xl font-light"
              style={{ color: THEME.ink, fontFamily: 'var(--font-inter), Inter, sans-serif' }}
            >
              What Ceto Does
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <ServiceCard
              href="/services#phase1"
              title="Phase I ESA"
              desc="ASTM E1527-21 informed screening with live federal data and the CETO Risk Score."
              icon="shield"
              featured
            />
            <ServiceCard
              href="/services#construction"
              title="Construction Compliance"
              desc="SWPPP development, erosion control, and environmental coordination for active sites."
              icon="doc"
            />
            <ServiceCard
              href="/services#renewable"
              title="Renewable Energy"
              desc="Environmental screening, permitting, and compliance monitoring for solar and wind."
              icon="bolt"
            />
            <ServiceCard
              href="/services#technology"
              title="Smart Monitoring"
              desc="Custom IoT systems with reporting, real-time alerts, and living environmental data."
              icon="screen"
            />
          </div>
        </div>
      </section>

      {/* Field + data signature */}
      <section className="py-14" style={{ backgroundColor: 'rgba(255,255,255,0.40)' }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-10 grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
          <div>
            <div
              className="font-light text-xs tracking-[0.28em] uppercase mb-3"
              style={{ color: 'rgba(47, 93, 140, 0.75)' }}
            >
              Field + Data
            </div>
            <h2
              className="text-3xl md:text-4xl font-light mb-4"
              style={{ color: THEME.ink, fontFamily: 'var(--font-inter), Inter, sans-serif' }}
            >
              Every site, seen twice.
            </h2>
            <p className="text-lg font-light leading-relaxed" style={{ color: 'rgba(20, 35, 55, 0.70)' }}>
              Desktop intelligence from federal sources, verified on the ground
              by a licensed EP. Wetland boundaries, floodplain limits, and
              terrain — traced on the real site, cited in the report.
            </p>
          </div>
          <FieldDataMap />
        </div>
      </section>

      {/* How it works */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <div
            className="font-light text-xs tracking-[0.28em] uppercase mb-8 text-center"
            style={{ color: 'rgba(47, 93, 140, 0.75)' }}
          >
            How It Works
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: '01', title: 'Send site details', desc: 'Location, project type, and timeline. No lengthy intake forms.' },
              { n: '02', title: 'Quote in 24 hours', desc: 'Scope options and pricing, in plain English.' },
              { n: '03', title: 'Screening + recon', desc: 'Live database queries plus structured field reconnaissance.' },
              { n: '04', title: 'EP-reviewed report', desc: `Delivered in ${TURNAROUND_DAYS} business days, sources cited.`, featured: true },
            ].map((step) => (
              <div
                key={step.n}
                className="rounded-3xl p-6"
                style={{
                  backgroundColor: THEME.surface,
                  border: step.featured
                    ? `1.5px solid rgba(47,93,140,0.45)`
                    : `1px solid ${THEME.border}`,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="text-sm font-light mb-3" style={{ color: THEME.leviBlue }}>
                  {step.n}
                </div>
                <div className="text-lg font-normal mb-1.5" style={{ color: THEME.ink }}>
                  {step.title}
                </div>
                <div className="text-sm font-light leading-relaxed" style={{ color: 'rgba(20,35,55,0.62)' }}>
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data sources band */}
      <section className="py-10" style={{ borderTop: `1px solid ${THEME.border}`, borderBottom: `1px solid ${THEME.border}` }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          <span className="text-sm font-light" style={{ color: 'rgba(20,35,55,0.50)' }}>
            Queried live. Cited in every report.
          </span>
          {['EPA', 'TCEQ', 'USGS', 'FEMA', 'USFWS', 'USDA'].map((src) => (
            <span
              key={src}
              className="text-base font-normal tracking-wide"
              style={{ color: 'rgba(20,35,55,0.62)' }}
            >
              {src}
            </span>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="text-white relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, ${THEME.leviBlueDark} 0%, ${THEME.leviBlue} 55%, rgba(224, 122, 95, 0.18) 120%)`,
        }}
      >
        <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center relative py-16">
          <div className="mb-3 font-light text-xs tracking-[0.28em] uppercase" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Get Started
          </div>
          <h2
            className="text-4xl md:text-5xl font-light mb-5 leading-tight"
            style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}
          >
            Tell us what you&apos;re building.
          </h2>
          <p className="text-lg md:text-xl mb-9 text-white/80 font-light leading-relaxed">
            Send your location, schedule, and project type. We&apos;ll reply with
            scope and pricing within 24 hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/contact"
              className="inline-block px-9 py-3.5 rounded-full font-light text-lg transition-colors duration-200 shadow-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: THEME.leviBlueDark }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.98)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.92)')}
            >
              Get a Quote in 24 Hours
            </a>

            <a
              href="/services"
              className="inline-block px-9 py-3.5 rounded-full font-light text-lg border transition-colors duration-200"
              style={{ borderColor: 'rgba(255,255,255,0.45)', color: 'rgba(255,255,255,0.95)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.10)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              View Services
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function ServiceCard({
  href,
  title,
  desc,
  icon,
  featured,
}: {
  href: string;
  title: string;
  desc: string;
  icon: 'doc' | 'bolt' | 'screen' | 'shield';
  featured?: boolean;
}) {
  return (
    <a
      href={href}
      className="group rounded-3xl p-7 transition-all duration-300 hover:shadow-lg block"
      style={{
        backgroundColor: THEME.surface,
        border: featured ? `1.5px solid rgba(47,93,140,0.45)` : `1px solid ${THEME.border}`,
        backdropFilter: 'blur(10px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(47, 93, 140, 0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.borderColor = featured ? 'rgba(47,93,140,0.45)' : THEME.border;
      }}
    >
      {featured && (
        <div
          className="inline-block text-[11px] font-light px-3 py-1 rounded-full mb-4"
          style={{ color: THEME.leviBlue, backgroundColor: 'rgba(47,93,140,0.10)' }}
        >
          Flagship
        </div>
      )}
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
        style={{ backgroundColor: 'rgba(47, 93, 140, 0.10)' }}
      >
        <svg className="w-6 h-6" style={{ color: THEME.leviBlue }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon === 'doc' && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          )}
          {icon === 'bolt' && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          )}
          {icon === 'screen' && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          )}
          {icon === 'shield' && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          )}
        </svg>
      </div>

      <h3 className="text-xl font-light mb-2" style={{ color: THEME.ink }}>
        {title}
      </h3>

      <p className="text-sm font-light leading-relaxed mb-4" style={{ color: 'rgba(20, 35, 55, 0.70)' }}>
        {desc}
      </p>

      <div className="flex items-center text-sm font-light" style={{ color: 'rgba(47, 93, 140, 0.95)' }}>
        <span>Learn More</span>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  );
}
