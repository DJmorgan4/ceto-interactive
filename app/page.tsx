export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header with Logo */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">
              <span className="text-gray-900">Ceto</span>
              <span className="text-teal-600">Interactive</span>
            </div>
            <nav className="hidden md:flex gap-8">
              <a href="/services" className="text-gray-700 hover:text-teal-600 font-medium">Services</a>
              <a href="/intelligence" className="text-gray-700 hover:text-teal-600 font-medium">Environmental Intelligence</a>
              <a href="/contact" className="text-gray-700 hover:text-teal-600 font-medium">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Shorter & Punchier */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-teal-300 font-semibold mb-4">DJ Morgan | Environmental Consultant</p>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Environmental Solutions for Smart Development
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Professional compliance and monitoring services for construction, development, and renewable energy across North Texas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="/contact" 
                className="inline-block bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition text-center"
              >
                Schedule Consultation
              </a>
              <a 
                href="/services" 
                className="inline-block bg-teal-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-teal-700 transition text-center"
              >
                View Services
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials Bar */}
      <section className="bg-slate-50 py-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-900">6+</p>
              <p className="text-gray-600">Years Construction Experience</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-900">BS</p>
              <p className="text-gray-600">Wind & Renewable Energy, Texas Tech</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-900">IoT</p>
              <p className="text-gray-600">Custom Monitoring Technology</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services - Clickable Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Core Services</h2>
            <p className="text-xl text-gray-600">Backed by construction expertise and smart technology</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Service Card 1 - Clickable */}
            <a href="/services#construction" className="group bg-white rounded-xl p-8 border-2 border-slate-200 hover:border-blue-600 hover:shadow-xl transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 transition">
                <svg className="w-6 h-6 text-blue-700 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition">
                Construction Compliance
              </h3>
              <p className="text-gray-600 mb-4">
                SWPPP development, erosion control monitoring, and environmental coordination.
              </p>
              <p className="text-blue-600 font-semibold group-hover:underline">Learn More →</p>
            </a>

            {/* Service Card 2 - Clickable */}
            <a href="/services#renewable" className="group bg-white rounded-xl p-8 border-2 border-slate-200 hover:border-teal-600 hover:shadow-xl transition">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-teal-600 transition">
                <svg className="w-6 h-6 text-teal-700 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-teal-600 transition">
                Renewable Energy
              </h3>
              <p className="text-gray-600 mb-4">
                Environmental screening, permitting, and compliance for solar and wind projects.
              </p>
              <p className="text-teal-600 font-semibold group-hover:underline">Learn More →</p>
            </a>

            {/* Service Card 3 - Clickable */}
            <a href="/services#technology" className="group bg-white rounded-xl p-8 border-2 border-slate-200 hover:border-blue-600 hover:shadow-xl transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 transition">
                <svg className="w-6 h-6 text-blue-700 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition">
                Smart Monitoring
              </h3>
              <p className="text-gray-600 mb-4">
                Custom IoT monitoring systems with automated reporting and real-time alerts.
              </p>
              <p className="text-blue-600 font-semibold group-hover:underline">Learn More →</p>
            </a>
          </div>

          <div className="text-center mt-12">
            <a 
              href="/services" 
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
            >
              View All Services
            </a>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Shorter */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Why Ceto Interactive</h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Construction Expert</h3>
              <p className="text-gray-600">Parkway Construction, Ashton Commercial, Kiewit</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Renewable Energy</h3>
              <p className="text-gray-600">Texas Tech graduate, EDP Renewables trained</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Technology Edge</h3>
              <p className="text-gray-600">Custom IoT systems, real-time data, automation</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100">Schedule a free consultation to discuss your project</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact" 
              className="inline-block bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition"
            >
              Schedule Consultation
            </a>
            <a 
              href="mailto:dj@cetointeractive.com" 
              className="inline-block bg-teal-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-teal-700 transition border-2 border-white"
            >
              Email DJ Morgan
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
