'use client';

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e8ebe5]">
      {/* Calm background wash */}
      <div
        className="fixed inset-0 z-0 opacity-35"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 45%, rgba(99, 125, 99, 0.14) 0%, transparent 58%),
                           radial-gradient(circle at 80% 80%, rgba(74, 90, 74, 0.10) 0%, transparent 58%)`
        }}
      />

      {/* Static “topographic” lines (no animation = comfy) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <svg
          className="w-full h-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
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
                stroke={`rgba(74, 90, 74, ${Math.max(o, 0.02)})`}
                strokeWidth="1.2"
              />
            );
          })}
        </svg>
      </div>

      <div className="relative z-10">
        {/* Header (slightly less “glassy”) */}
        <header className="bg-[#f5f7f2]/85 border-b border-[#c5cabe]/30 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-4">
            <div className="flex justify-between items-center">
              <a href="/" className="text-2xl font-light tracking-wide">
                <span className="text-[#3a4a3a]">Ceto</span>
                <span className="text-[#5a7a5a] font-normal">Interactive</span>
              </a>

              <nav className="hidden md:flex gap-10 items-center">
                <a
                  href="/services"
                  className="text-[#4a5a4a] hover:text-[#5a7a5a] font-light text-base transition-colors duration-200"
                >
                  Services
                </a>
                <a
                  href="/envnews"
                  className="text-[#4a5a4a] hover:text-[#5a7a5a] font-light text-base transition-colors duration-200"
                >
                  News &amp; Updates
                </a>
                <a
                  href="/contact"
                  className="bg-[#5a7a5a] text-white px-6 py-2.5 rounded-full font-light hover:bg-[#4a6a4a] transition-colors duration-200"
                >
                  Connect
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero: calmer, shorter, less “poster” */}
        <section className="pt-14 pb-10 px-6 lg:px-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-4 text-[#5a7a5a] font-light text-xs md:text-sm tracking-[0.28em] uppercase">
              Environmental Intelligence
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-[1.02] text-[#2a3a2a] tracking-tight">
              Monitor <span className="font-normal text-[#4a6a4a]">Earth</span> Together
            </h1>

            <p className="mt-5 text-lg md:text-xl text-[#5a6a5a] font-light max-w-3xl mx-auto leading-relaxed">
              Real-time data. Living systems. Smart compliance.
              <br />
              For cities, developers, and conservationists who care.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/services"
                className="inline-flex items-center justify-center bg-[#4a6a4a] text-white px-8 py-3.5 rounded-full font-light text-lg hover:bg-[#3a5a3a] transition-colors duration-200 shadow-lg"
              >
                Explore Services
                <svg
                  className="w-5 h-5 ml-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center bg-transparent text-[#4a6a4a] px-8 py-3.5 rounded-full font-light text-lg border border-[#4a6a4a]/60 hover:bg-[#4a6a4a] hover:text-white transition-colors duration-200"
              >
                Start Conversation
              </a>
            </div>

            {/* Scroll cue = “makes me want to scroll” */}
            <div className="mt-10 flex flex-col items-center text-[#5a7a5a]/80">
              <span className="text-xs tracking-[0.22em] uppercase">Scroll</span>
              <div className="mt-2 h-10 w-[2px] bg-[#5a7a5a]/30 rounded-full relative overflow-hidden">
                <div className="absolute top-2 left-0 right-0 h-3 bg-[#5a7a5a]/55 rounded-full animate-[pulse_1.6s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        </section>

        {/* A gentle “bridge” section (helps flow into cards) */}
        <section className="px-6 lg:px-10 pb-8">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/55 border border-[#c5cabe]/35 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
              <p className="text-[#4f5f4f] font-light text-base md:text-lg leading-relaxed">
                We combine field expertise with living data—so projects stay compliant, ecosystems stay protected,
                and decisions feel grounded in what’s happening right now.
              </p>
            </div>
          </div>
        </section>

        {/* Services section: calmer hover, less “card theater” */}
        <section className="py-16 bg-gradient-to-b from-transparent to-[#f5f7f2]/60">
          <div className="max-w-6xl mx-auto px-6 lg:px-10">
            <div className="text-center mb-10">
              <div className="text-[#5a7a5a] font-light text-xs tracking-[0.28em] uppercase mb-3">
                What We Do
              </div>
              <h2 className="text-4xl md:text-5xl font-light text-[#2a3a2a]">
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

        {/* Philosophy: shorter */}
        <section className="py-16 bg-[#f5f7f2]">
          <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
            <h2 className="text-4xl md:text-5xl font-light text-[#2a3a2a] mb-5">
              Beyond Compliance
            </h2>
            <p className="text-lg md:text-xl text-[#5a6a5a] font-light leading-relaxed">
              Not just paperwork—living data that connects construction expertise with environmental intelligence.
            </p>
          </div>
        </section>

        {/* Final CTA: less tall, less dramatic */}
        <section className="py-18 md:py-20 bg-gradient-to-br from-[#3a4a3a] via-[#4a5a4a] to-[#5a6a5a] text-white relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center relative py-16">
            <div className="mb-3 text-[#b5c5b5] font-light text-xs tracking-[0.28em] uppercase">
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
                className="inline-block bg-white text-[#3a4a3a] px-9 py-3.5 rounded-full font-light text-lg hover:bg-[#e5e7e2] transition-colors duration-200 shadow-xl"
              >
                Get in Touch
              </a>
              <a
                href="/services"
                className="inline-block bg-transparent text-white px-9 py-3.5 rounded-full font-light text-lg border border-white/40 hover:bg-white/10 transition-colors duration-200"
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
      className="group bg-white/60 backdrop-blur-sm rounded-3xl p-7 border border-[#c5cabe]/40 hover:border-[#5a7a5a]/55 hover:shadow-lg transition-all duration-300"
    >
      <div className="w-11 h-11 bg-[#5a7a5a]/10 rounded-2xl flex items-center justify-center mb-5">
        <svg className="w-6 h-6 text-[#4a6a4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <h3 className="text-2xl font-light text-[#2a3a2a] mb-2 group-hover:text-[#4a6a4a] transition-colors duration-200">
        {title}
      </h3>

      <p className="text-[#5a6a5a] text-base font-light leading-relaxed mb-4">
        {desc}
      </p>

      <div className="flex items-center text-[#5a7a5a] font-light">
        <span>Learn More</span>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  );
}

