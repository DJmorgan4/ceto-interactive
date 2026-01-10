'use client';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = Math.min(scrolled / documentHeight, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    // Create sparse particles
    for (let i = 0; i < 15; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.08 + 0.02
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Atmosphere transitions: dawn → day → afternoon → dusk
  const getAtmosphere = (progress: number) => {
    if (progress < 0.3) {
      return { from: '#1e3a8a', via: '#2563eb', to: '#0891b2', opacity: 0.96 };
    } else if (progress < 0.6) {
      return { from: '#0ea5e9', via: '#06b6d4', to: '#14b8a6', opacity: 0.94 };
    } else if (progress < 0.85) {
      return { from: '#0891b2', via: '#0d9488', to: '#059669', opacity: 0.95 };
    } else {
      return { from: '#0f766e', via: '#115e59', to: '#1e40af', opacity: 0.97 };
    }
  };

  const atmosphere = getAtmosphere(scrollProgress);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Living Atmosphere Background */}
      <div 
        className="fixed inset-0 z-0 transition-all duration-[10000ms] ease-out"
        style={{
          background: `linear-gradient(150deg, ${atmosphere.from} 0%, ${atmosphere.via} 50%, ${atmosphere.to} 100%)`,
          opacity: atmosphere.opacity
        }}
      />
      
      {/* Subtle Particles */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ opacity: 0.5 }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Clean Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
            <div className="flex justify-between items-center">
              <a href="/" className="text-3xl font-bold tracking-tight">
                <span className="text-gray-900">Ceto</span>
                <span className="text-teal-600">Interactive</span>
              </a>
              <nav className="hidden md:flex gap-10">
                <a href="/services" className="text-gray-700 hover:text-teal-600 font-medium transition-colors">
                  Services
                </a>
                <a href="/envnews" className="text-gray-700 hover:text-teal-600 font-medium transition-colors">
                  Environmental News
                </a>
                <a href="/contact" className="text-gray-700 hover:text-teal-600 font-medium transition-colors">
                  Contact
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero - Breathing Space */}
        <section className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight text-white drop-shadow-2xl">
              Environmental Solutions<br />for Smart Development
            </h1>
            <p className="text-2xl md:text-3xl mb-12 text-white/90 drop-shadow-lg max-w-4xl mx-auto leading-relaxed">
              Real-time monitoring. Data-driven compliance. Living systems approach.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a 
                href="/services" 
                className="inline-block bg-white text-blue-900 px-10 py-5 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-2xl"
              >
                Explore Services
              </a>
              <a 
                href="/contact" 
                className="inline-block bg-teal-600/20 backdrop-blur-md text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-teal-600/30 transition-all transform hover:scale-105 border-2 border-white/40 shadow-2xl"
              >
                Get Started
              </a>
            </div>
          </div>
        </section>

        {/* Core Services - Clean Grid */}
        <section className="py-32 bg-white/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                What We Do
              </h2>
              <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive environmental services backed by construction expertise and smart technology
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {/* Construction Compliance */}
              <a 
                href="/services#construction" 
                className="group bg-gradient-to-br from-white to-slate-50 rounded-3xl p-10 border border-slate-200 hover:border-teal-400 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-teal-600 transition-colors">
                  Construction<br />Compliance
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  SWPPP development, erosion control monitoring, and environmental coordination for active sites.
                </p>
                <p className="text-teal-600 font-bold group-hover:underline">Learn More →</p>
              </a>

              {/* Renewable Energy */}
              <a 
                href="/services#renewable" 
                className="group bg-gradient-to-br from-white to-slate-50 rounded-3xl p-10 border border-slate-200 hover:border-teal-400 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-teal-600 transition-colors">
                  Renewable<br />Energy
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  Environmental screening, permitting, and compliance for solar and wind projects.
                </p>
                <p className="text-teal-600 font-bold group-hover:underline">Learn More →</p>
              </a>

              {/* Smart Monitoring */}
              <a 
                href="/services#technology" 
                className="group bg-gradient-to-br from-white to-slate-50 rounded-3xl p-10 border border-slate-200 hover:border-teal-400 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-teal-600 transition-colors">
                  Smart<br />Monitoring
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  Custom IoT systems with automated reporting and real-time environmental data.
                </p>
                <p className="text-teal-600 font-bold group-hover:underline">Learn More →</p>
              </a>
            </div>
          </div>
        </section>

        {/* Approach Section */}
        <section className="py-32 bg-slate-50/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              Beyond Compliance
            </h2>
            <p className="text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto">
              We don't just check boxes. We partner with you to collect data, enhance compliance, and work with living systems—not against them. Real-time monitoring meets construction expertise.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 bg-gradient-to-br from-slate-900 via-blue-950 to-teal-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.15),transparent_70%)]" />
          <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center relative">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
              Ready to Work Together?
            </h2>
            <p className="text-2xl mb-12 text-blue-100/90 max-w-3xl mx-auto">
              Let's discuss how we can support your project with smart environmental solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a 
                href="/contact" 
                className="inline-block bg-white text-blue-900 px-12 py-6 rounded-2xl font-bold text-xl hover:bg-blue-50 transition-all transform hover:scale-105 shadow-2xl"
              >
                Get in Touch
              </a>
              <a 
                href="/services" 
                className="inline-block bg-teal-600/30 backdrop-blur-md text-white px-12 py-6 rounded-2xl font-bold text-xl hover:bg-teal-600/40 transition-all transform hover:scale-105 border-2 border-white/30 shadow-2xl"
              >
                View All Services
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
