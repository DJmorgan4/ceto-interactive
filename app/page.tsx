'use client';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = Math.min(scrolled / documentHeight, 1);
      setScrollProgress(progress);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Organic topographic lines animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const lines: Array<{
      y: number;
      amplitude: number;
      frequency: number;
      speed: number;
      offset: number;
    }> = [];

    // Create organic contour lines
    for (let i = 0; i < 8; i++) {
      lines.push({
        y: (canvas.height / 9) * (i + 1),
        amplitude: Math.random() * 15 + 10,
        frequency: Math.random() * 0.005 + 0.002,
        speed: Math.random() * 0.3 + 0.1,
        offset: Math.random() * Math.PI * 2
      });
    }

    let time = 0;
    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      time += 0.01;

      lines.forEach((line, index) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(74, 90, 74, ${0.08 - index * 0.008})`;
        ctx.lineWidth = 1.5;

        for (let x = 0; x < canvas.width; x += 3) {
          const wave = Math.sin(x * line.frequency + time * line.speed + line.offset) * line.amplitude;
          const y = line.y + wave;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e8ebe5]">
      {/* Organic Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-40" 
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(99, 125, 99, 0.15) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(74, 90, 74, 0.12) 0%, transparent 50%)`
        }}
      />
      
      {/* Topographic Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Minimal Header */}
        <header className="bg-[#f5f7f2]/80 backdrop-blur-xl border-b border-[#c5cabe]/30 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-8 lg:px-12 py-6">
            <div className="flex justify-between items-center">
              <a href="/" className="text-3xl font-light tracking-wide">
                <span className="text-[#3a4a3a]">Ceto</span>
                <span className="text-[#5a7a5a] font-normal">Interactive</span>
              </a>
              <nav className="hidden md:flex gap-12 items-center">
                <a href="/services" className="text-[#4a5a4a] hover:text-[#5a7a5a] font-light text-lg transition-colors duration-300">
                  Services
                </a>
                <a href="/envnews" className="text-[#4a5a4a] hover:text-[#5a7a5a] font-light text-lg transition-colors duration-300">
                  Intelligence
                </a>
                <a href="/contact" className="bg-[#5a7a5a] text-white px-8 py-3 rounded-full font-light hover:bg-[#4a6a4a] transition-all duration-300">
                  Connect
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="min-h-[90vh] flex items-center justify-center px-8 relative">
          <div 
            className="max-w-6xl mx-auto text-center transition-transform duration-700 ease-out"
            style={{
              transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`
            }}
          >
            <div className="mb-6 text-[#5a7a5a] font-light text-xl tracking-widest uppercase">
              Environmental Intelligence
            </div>
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-light mb-10 leading-[0.95] text-[#2a3a2a] tracking-tight">
              Monitor<br />
              <span className="font-normal text-[#4a6a4a]">Earth</span><br />
              Together
            </h1>
            <p className="text-2xl md:text-3xl mb-16 text-[#5a6a5a] font-light max-w-4xl mx-auto leading-relaxed">
              Real-time data. Living systems. Smart compliance.<br />
              For cities, developers, and conservationists who care.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a 
                href="/services" 
                className="group inline-flex items-center justify-center bg-[#4a6a4a] text-white px-12 py-5 rounded-full font-light text-xl hover:bg-[#3a5a3a] transition-all duration-500 shadow-lg hover:shadow-2xl transform hover:scale-105"
              >
                <span>Explore Services</span>
                <svg className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a 
                href="/contact" 
                className="group inline-flex items-center justify-center bg-transparent text-[#4a6a4a] px-12 py-5 rounded-full font-light text-xl border-2 border-[#4a6a4a] hover:bg-[#4a6a4a] hover:text-white transition-all duration-500 transform hover:scale-105"
              >
                <span>Start Conversation</span>
              </a>
            </div>
          </div>
        </section>

        {/* Core Services - Organic Cards */}
        <section className="py-32 bg-gradient-to-b from-transparent to-[#f5f7f2]/50">
          <div className="max-w-7xl mx-auto px-8 lg:px-12">
            <div className="text-center mb-24">
              <div className="text-[#5a7a5a] font-light text-lg tracking-widest uppercase mb-4">
                What We Do
              </div>
              <h2 className="text-6xl md:text-7xl font-light text-[#2a3a2a] mb-8">
                Our Approach
              </h2>
              <p className="text-2xl text-[#5a6a5a] font-light max-w-3xl mx-auto leading-relaxed">
                Comprehensive environmental services that connect<br />construction expertise with living data.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Construction Compliance Card */}
              <a 
                href="/services#construction" 
                className="group relative bg-white/60 backdrop-blur-sm rounded-3xl p-10 border border-[#c5cabe]/40 hover:border-[#5a7a5a]/60 hover:shadow-2xl transition-all duration-700 overflow-hidden"
                style={{
                  transform: 'perspective(1000px) rotateX(0deg)',
                  transition: 'all 0.7s cubic-bezier(0.23, 1, 0.32, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateX(2deg) translateY(-8px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) translateY(0px)';
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5a7a5a]/5 rounded-full blur-3xl group-hover:bg-[#5a7a5a]/10 transition-all duration-700" />
                
                <div className="relative">
                  <div className="w-14 h-14 bg-[#5a7a5a]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#5a7a5a] group-hover:rotate-3 transition-all duration-500">
                    <svg className="w-7 h-7 text-[#4a6a4a] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-light text-[#2a3a2a] mb-4 group-hover:text-[#4a6a4a] transition-colors duration-300">
                    Construction<br />Compliance
                  </h3>
                  <p className="text-[#5a6a5a] text-lg font-light leading-relaxed mb-6">
                    SWPPP development, erosion control, and environmental coordination for active construction sites.
                  </p>
                  <div className="flex items-center text-[#5a7a5a] font-light group-hover:translate-x-2 transition-transform duration-300">
                    <span>Learn More</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>

              {/* Renewable Energy Card */}
              <a 
                href="/services#renewable" 
                className="group relative bg-white/60 backdrop-blur-sm rounded-3xl p-10 border border-[#c5cabe]/40 hover:border-[#5a7a5a]/60 hover:shadow-2xl transition-all duration-700 overflow-hidden"
                style={{
                  transform: 'perspective(1000px) rotateX(0deg)',
                  transition: 'all 0.7s cubic-bezier(0.23, 1, 0.32, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateX(2deg) translateY(-8px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) translateY(0px)';
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5a7a5a]/5 rounded-full blur-3xl group-hover:bg-[#5a7a5a]/10 transition-all duration-700" />
                
                <div className="relative">
                  <div className="w-14 h-14 bg-[#5a7a5a]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#5a7a5a] group-hover:rotate-3 transition-all duration-500">
                    <svg className="w-7 h-7 text-[#4a6a4a] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-light text-[#2a3a2a] mb-4 group-hover:text-[#4a6a4a] transition-colors duration-300">
                    Renewable<br />Energy
                  </h3>
                  <p className="text-[#5a6a5a] text-lg font-light leading-relaxed mb-6">
                    Environmental screening, permitting, and compliance monitoring for solar and wind projects.
                  </p>
                  <div className="flex items-center text-[#5a7a5a] font-light group-hover:translate-x-2 transition-transform duration-300">
                    <span>Learn More</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>

              {/* Smart Monitoring Card */}
              <a 
                href="/services#technology" 
                className="group relative bg-white/60 backdrop-blur-sm rounded-3xl p-10 border border-[#c5cabe]/40 hover:border-[#5a7a5a]/60 hover:shadow-2xl transition-all duration-700 overflow-hidden"
                style={{
                  transform: 'perspective(1000px) rotateX(0deg)',
                  transition: 'all 0.7s cubic-bezier(0.23, 1, 0.32, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateX(2deg) translateY(-8px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) translateY(0px)';
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5a7a5a]/5 rounded-full blur-3xl group-hover:bg-[#5a7a5a]/10 transition-all duration-700" />
                
                <div className="relative">
                  <div className="w-14 h-14 bg-[#5a7a5a]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#5a7a5a] group-hover:rotate-3 transition-all duration-500">
                    <svg className="w-7 h-7 text-[#4a6a4a] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-light text-[#2a3a2a] mb-4 group-hover:text-[#4a6a4a] transition-colors duration-300">
                    Smart<br />Monitoring
                  </h3>
                  <p className="text-[#5a6a5a] text-lg font-light leading-relaxed mb-6">
                    Custom IoT systems with automated reporting, real-time alerts, and living environmental data.
                  </p>
                  <div className="flex items-center text-[#5a7a5a] font-light group-hover:translate-x-2 transition-transform duration-300">
                    <span>Learn More</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="py-32 bg-[#f5f7f2]">
          <div className="max-w-5xl mx-auto px-8 lg:px-12 text-center">
            <h2 className="text-6xl md:text-7xl font-light text-[#2a3a2a] mb-10 leading-tight">
              Beyond Compliance
            </h2>
            <p className="text-2xl text-[#5a6a5a] font-light leading-relaxed">
              We partner with cities building healthier communities, developers creating spaces people want to be in, and conservationists protecting what matters. Not just paperwork—living data that connects construction expertise with environmental intelligence.
            </p>
          </div>
        </section>

        {/* Final CTA - "Let's Monitor Earth Together" */}
        <section className="py-40 bg-gradient-to-br from-[#3a4a3a] via-[#4a5a4a] to-[#5a6a5a] text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                               radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%)`
            }} />
          </div>
          
          <div className="max-w-5xl mx-auto px-8 lg:px-12 text-center relative">
            <div className="mb-8 text-[#b5c5b5] font-light text-lg tracking-widest uppercase">
              Join Us
            </div>
            <h2 className="text-6xl md:text-7xl font-light mb-12 leading-tight">
              Let's Monitor<br />Earth Together
            </h2>
            <p className="text-2xl mb-16 text-white/80 font-light max-w-3xl mx-auto leading-relaxed">
              Start a conversation about how real-time environmental intelligence can support your project.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a 
                href="/contact" 
                className="inline-block bg-white text-[#3a4a3a] px-14 py-6 rounded-full font-light text-xl hover:bg-[#e5e7e2] transition-all duration-500 shadow-2xl transform hover:scale-105"
              >
                Get in Touch
              </a>
              <a 
                href="/services" 
                className="inline-block bg-transparent text-white px-14 py-6 rounded-full font-light text-xl border-2 border-white/40 hover:bg-white/10 transition-all duration-500 transform hover:scale-105"
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

