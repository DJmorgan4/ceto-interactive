'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Softer mouse parallax (less "stressy" motion)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 12,
        y: (e.clientY / window.innerHeight - 0.5) * 12
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Organic topographic lines animation (subtler + lighter)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setSize();

    const lines: Array<{
      y: number;
      amplitude: number;
      frequency: number;
      speed: number;
      offset: number;
    }> = [];

    const createLines = () => {
      lines.length = 0;
      const count = 7; // slightly fewer lines
      for (let i = 0; i < count; i++) {
        lines.push({
          y: (canvas.height / (count + 2)) * (i + 2),
          amplitude: Math.random() * 10 + 6, // lower amplitude
          frequency: Math.random() * 0.004 + 0.0018,
          speed: Math.random() * 0.22 + 0.08,
          offset: Math.random() * Math.PI * 2
        });
      }
    };

    createLines();

    let time = 0;
    let animationFrameId = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      lines.forEach((line, index) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(74, 90, 74, ${0.06 - index * 0.006})`; // lighter opacity
        ctx.lineWidth = 1.2;

        for (let x = 0; x < canvas.width; x += 4) {
          const wave =
            Math.sin(x * line.frequency + time * line.speed + line.offset) *
            line.amplitude;
          const y = line.y + wave;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      setSize();
      createLines();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e8ebe5]">
      {/* Softer Background Wash */}
      <div
        className="fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 45%, rgba(99, 125, 99, 0.14) 0%, transparent 55%),
                           radial-gradient(circle at 80% 80%, rgba(74, 90, 74, 0.10) 0%, transparent 55%)`
        }}
      />

      {/* Topographic Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Calmer Header (less tall) */}
        <header className="bg-[#f5f7f2]/75 backdrop-blur-xl border-b border-[#c5cabe]/30 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-4">
            <div className="flex justify-between items-center">
              <a href="/" className="text-2xl font-light tracking-wide">
                <span className="text-[#3a4a3a]">Ceto</span>
                <span className="text-[#5a7a5a] font-normal">Interactive</span>
              </a>

              <nav className="hidden md:flex gap-10 items-center">
                <a
                  href="/services"
                  className="text-[#4a5a4a] hover:text-[#5a7a5a] font-light text-base transition-colors duration-300"
                >
                  Services
                </a>

                {/* Change label: Intelligence -> News & Updates
                    Keep href "/envnews" if that route already exists, OR change to "/news" if you prefer. */}
                <a
                  href="/envnews"
                  className="text-[#4a5a4a] hover:text-[#5a7a5a] font-light text-base transition-colors duration-300"
                >
                  News &amp; Updates
                </a>

                <a
                  href="/contact"
                  className="bg-[#5a7a5a] text-white px-6 py-2.5 rounded-full font-light hover:bg-[#4a6a4a] transition-all duration-300"
                >
                  Connect
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero (less tall, less giant text, less margin) */}
        <section className="min-h-[72vh] flex items-center justify-center px-6 lg:px-10 relative">
          <div
            className="max-w-5xl mx-auto text-center transition-transform duration-700 ease-out"
            style={{
              transform: `translate(${mousePosition.x * 0.35}px, ${mousePosition.y * 0.35}px)`
            }}
          >
            <div className="mb-4 text-[#5a7a5a] font-light text-sm md:text-base tracking-[0.22em] uppercase">
              Environmental Intelligence
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light mb-6 leading-[1.02] text-[#2a3a2a] tracking-tight">
              Monitor<br />
              <span className="font-normal text-[#4a6a4a]">Earth</span><br />
              Together
            </h1>

            <p className="text-lg md:text-xl mb-10 text-[#5a6a5a] font-light max-w-3xl mx-auto leading-relaxed">
              Real-time data. Living systems. Smart compliance.
              <br />
              For cities, developers, and conservationists who care.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/services"
                className="group inline-flex items-center justify-center bg-[#4a6a4a] text-white px-9 py-4 rounded-full font-light text-lg hover:bg-[#3a5a3a] transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span>Explore Services</span>
                <svg
                  className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>

              <a
                href="/contact"
                className="group inline-flex items-center justify-center bg-transparent text-[#4a6a4a] px-9 py-4 rounded-full font-light text-lg border border-[#4a6a4a]/70 hover:bg-[#4a6a4a] hover:text-white transition-all duration-300"
              >
                <span>Start Conversation</span>
              </a>
            </div>
          </div>
        </section>

        {/* Services (reduced padding, calmer cards, less “3D”) */}
        <section className="py-20 bg-gradient-to-b from-transparent to-[#f5f7f2]/55">
          <div className="max-w-6xl mx-auto px-6 lg:px-10">
            <div className="text-center mb-14">
              <div className="text-[#5a7a5a] font-light text-sm tracking-[0.22em] uppercase mb-3">
                What We Do
              </div>
              <h2 className="text-4xl md:text-5xl font-light text-[#2a3a2a] mb-4">
                Our Approach
              </h2>
              <p className="text-lg md:text-xl text-[#5a6a5a] font-light max-w-3xl mx-auto leading-relaxed">
                Environmental services that connect construction expertise with living data.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  href: '/services#construction',
                  title: (
                    <>
                      Construction
                      <br />
                      Compliance
                    </>
                  ),
                  desc:
                    'SWPPP development, erosion control, and environmental coordination for active construction sites.',
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  )
                },
                {
                  href: '/services#renewable',
                  title: (
                    <>
                      Renewable
                      <br />
                      Energy
                    </>
                  ),
                  desc:
                    'Environmental screening, permitting, and compliance monitoring for solar and wind projects.',
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  )
                },
                {
                  href: '/services#technology',
                  title: (
                    <>
                      Smart
                      <br />
                      Monitoring
                    </>
                  ),
                  desc:
                    'Custom IoT systems with automated reporting, real-time alerts, and living environmental data.',
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  )
                }
              ].map((card) => (
                <a
                  key={card.href}
                  href={card.href}
                  className="group relative bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-[#c5cabe]/40 hover:border-[#5a7a5a]/60 hover:shadow-xl transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-28 h-28 bg-[#5a7a5a]/5 rounded-full blur-3xl group-hover:bg-[#5a7a5a]/10 transition-all duration-500" />

                  <div className="relative">
                    <div className="w-12 h-12 bg-[#5a7a5a]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#5a7a5a]/15 transition-all duration-300">
                      <svg
                        className="w-6 h-6 text-[#4a6a4a]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {card.icon}
                      </svg>
                    </div>

                    <h3 className="text-2xl font-light text-[#2a3a2a] mb-3 group-hover:text-[#4a6a4a] transition-colors duration-300">
                      {card.title}
                    </h3>

                    <p className="text-[#5a6a5a] text-base font-light leading-relaxed mb-5">
                      {card.desc}
                    </p>

                    <div className="flex items-center text-[#5a7a5a] font-light group-hover:translate-x-1 transition-transform duration-300">
                      <span>Learn More</span>
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Philosophy (tighter) */}
        <section className="py-20 bg-[#f5f7f2]">
          <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
            <h2 className="text-4xl md:text-5xl font-light text-[#2a3a2a] mb-6 leading-tight">
              Beyond Compliance
            </h2>
            <p className="text-lg md:text-xl text-[#5a6a5a] font-light leading-relaxed">
              We partner with cities building healthier communities, developers creating spaces people want
              to be in, and conservationists protecting what matters. Not just paperwork—living data that
              connects construction expertise with environmental intelligence.
            </p>
          </div>
        </section>

        {/* Final CTA (less tall, calmer) */}
        <section className="py-24 bg-gradient-to-br from-[#3a4a3a] via-[#4a5a4a] to-[#5a6a5a] text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.10) 0%, transparent 55%),
                               radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 55%)`
              }}
            />
          </div>

          <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center relative">
            <div className="mb-4 text-[#b5c5b5] font-light text-sm tracking-[0.22em] uppercase">
              Join Us
            </div>
            <h2 className="text-4xl md:text-5xl font-light mb-6 leading-tight">
              Let&apos;s Monitor
              <br />
              Earth Together
            </h2>
            <p className="text-lg md:text-xl mb-10 text-white/80 font-light max-w-3xl mx-auto leading-relaxed">
              Start a conversation about how real-time environmental intelligence can support your project.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-block bg-white text-[#3a4a3a] px-10 py-4 rounded-full font-light text-lg hover:bg-[#e5e7e2] transition-all duration-300 shadow-xl"
              >
                Get in Touch
              </a>
              <a
                href="/services"
                className="inline-block bg-transparent text-white px-10 py-4 rounded-full font-light text-lg border border-white/40 hover:bg-white/10 transition-all duration-300"
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

