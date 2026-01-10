'use client';

const THEME = {
  // White-wash base + ink
  bg: '#F6F7F8',
  surface: 'rgba(255,255,255,0.62)',
  surfaceStrong: 'rgba(255,255,255,0.75)',
  border: 'rgba(20, 35, 55, 0.14)',
  ink: '#142337', // deep ink/denim

  // Levi tones
  leviBlue: '#2F5D8C',
  leviBlueDark: '#234B74',
  washedBlue: '#6E93B5',

  // Washed earth green (secondary)
  washedGreen: '#4F7A6A',
  washedGreenDark: '#3E6357',

  // Sunset accent (sparingly)
  sunset: '#E07A5F'
};

export default function Home() {
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
          `
        }}
      />

      {/* Static “topographic” lines (denim ink, subtle) */}
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
        {/* Header */}
        <header
          className="sticky top-0 z-50"
          style={{
            backgroundColor: THEME.surfaceStrong,
            borderBottom: `1px solid ${THEME.border}`
          }}
        >
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-4">
            <div className="flex justify-between items-center">
              <a href="/" className="text-2xl font-light tracking-wide" style={{ color: THEME.ink }}>
                <span style={{ color: THEME.ink }}>Ceto</span>
                <span style={{ color: THEME.leviBlue, fontWeight: 400 }}>Interactive</span>
              </a>

              <nav className="hidden md:flex gap-10 items-center">
                <a
                  href="/services"
                  className="font-light text-base transition-colors duration-200"
                  style={{ color: 'rgba(20, 35, 55, 0.78)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = THEME.leviBlue)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(20, 35, 55, 0.78)')}
                >
                  Services
                </a>

                <a
                  href="/envnews"
                  className="font-light text-base transition-colors duration-200"
                  style={{ color: 'rgba(20, 35, 55, 0.78)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = THEME.leviBlue)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(20, 35, 55, 0.78)')}
                >
                  News &amp; Updates
                </a>

                <a
                  href="/contact"
                  className="text-white px-6 py-2.5 rounded-full font-light transition-colors duration-200 shadow-sm"
                  style={{ backgroundColor: THEME.leviBlue }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = THEME.leviBlueDark)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = THEME.leviBlue)}
                >
                  Connect
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="pt-14 pb-10 px-6 lg:px-10">
          <div className="max-w-5xl mx-auto text-center">
            <div
              className="mb-4 font-light text-xs md:text-sm tracking-[0.28em] uppercase"
              style={{ color: 'rgba(47, 93, 140, 0.75)' }}
            >
              Environmental Intelligence
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-[1.02] tracking-tight" style={{ color: THEME.ink }}>
              Monitor{' '}
              <span className="font-normal" style={{ color: THEME.leviBlue }}>
                Earth
              </span>{' '}
              Together
            </h1>

            <p className="mt-5 text-lg md:text-xl font-light max-w-3xl mx-auto leading-relaxed" style={{ color: 'rgba(20, 35, 55, 0.70)' }}>
              Real-time data. Living systems. Smart compliance.
              <br />
              For cities, developers, and conservationists who care.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/services"
                className="inline-flex items-center justify-center text-white px-8 py-3.5 rounded-full font-light text-lg transition-colors duration-200 shadow-lg"
                style={{ backgroundColor: THEME.leviBlue }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = THEME.leviBlueDark)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = THEME.leviBlue)}
              >
                Explore Services
                <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>

              <a
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
                Start Conversation
              </a>
            </div>

            {/* Scroll cue (tiny sunset accent) */}
            <div className="mt-10 flex flex-col items-center" style={{ color: 'rgba(20, 35, 55, 0.58)' }}>
              <span className="text-xs tracking-[0.22em] uppercase">Scroll</span>
              <div
                className="mt-2 h-10 w-[2px] rounded-full relative overflow-hidden"
                style={{ backgroundColor: 'rgba(20, 35, 55, 0.18)' }}
              >
                <div
                  className="absolute top-2 left-0 right-0 h-3 rounded-full animate-[pulse_1.6s_ease-in-out_infinite]"
                  style={{ backgroundColor: 'rgba(224, 122, 95, 0.55)' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Bridge */}
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
                We combine field expertise with living data—so projects stay compliant, ecosystems stay protected,
                and decisions feel grounded in what’s happening right now.
              </p>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-10">
            <div className="text-center mb-10">
              <div className="font-light text-xs tracking-[0.28em] uppercase mb-3" style={{ color: 'rgba(79, 122, 106, 0.80)' }}>
                What We Do
              </div>
              <h2 className="text-4xl md:text-5xl font-light" style={{ color: THEME.ink }}>
                Our Approach
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <ServiceCard
                href="/services#construction"
                title="Construction Compliance"
                desc="SWPPP development, erosion control, and environmental coordination for active construction sites."
                icon="doc"
              />
              <ServiceCard
                href="/services#renewable"
                title="Renewable Energy"
                desc="Environmental screening, permitting, and compliance monitoring for solar and wind projects."
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

        {/* Philosophy */}
        <section className="py-16" style={{ backgroundColor: 'rgba(255,255,255,0.40)' }}>
          <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
            <h2 className="text-4xl md:text-5xl font-light mb-5" style={{ color: THEME.ink }}>
              Beyond Compliance
            </h2>
            <p className="text-lg md:text-xl font-light leading-relaxed" style={{ color: 'rgba(20, 35, 55, 0.70)' }}>
              Not just paperwork—living data that connects construction expertise with environmental intelligence.
            </p>
          </div>
        </section>

        {/* Final CTA (levi blue + whisper of sunset) */}
        <section
          className="text-white relative overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(135deg, ${THEME.leviBlueDark} 0%, ${THEME.leviBlue} 55%, rgba(224, 122, 95, 0.18) 120%)`
          }}
        >
          <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center relative py-16">
            <div className="mb-3 font-light text-xs tracking-[0.28em] uppercase" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Join Us
            </div>
            <h2 className="text-4xl md:text-5xl font-light mb-5 leading-tight">
              Let&apos;s Monitor Earth Together
            </h2>
            <p className="text-lg md:text-xl mb-9 text-white/80 font-light leading-relaxed">
              Start a conversation about how real-time environmental intelligence can support your project.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/contact"
                className="inline-block px-9 py-3.5 rounded-full font-light text-lg transition-colors duration-200 shadow-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: THEME.leviBlueDark }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.98)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.92)')}
              >
                Get in Touch
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
      </div>
    </main>
  );
}

function ServiceCard({
  href,
  title,
  desc,
  icon
}: {
  href: string;
  title: string;
  desc: string;
  icon: 'doc' | 'bolt' | 'screen';
}) {
  return (
    <a
      href={href}
      className="group rounded-3xl p-7 transition-all duration-300 hover:shadow-lg"
      style={{
        backgroundColor: THEME.surface,
        border: `1px solid ${THEME.border}`,
        backdropFilter: 'blur(10px)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(47, 93, 140, 0.28)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.borderColor = THEME.border;
      }}
    >
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(47, 93, 140, 0.10)' }}>
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
        </svg>
      </div>

      <h3 className="text-2xl font-light mb-2" style={{ color: THEME.ink }}>
        {title}
      </h3>

      <p className="text-base font-light leading-relaxed mb-4" style={{ color: 'rgba(20, 35, 55, 0.70)' }}>
        {desc}
      </p>

      <div className="flex items-center font-light" style={{ color: 'rgba(47, 93, 140, 0.95)' }}>
        <span>Learn More</span>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  );
}

