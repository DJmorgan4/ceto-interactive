export default function EnvironmentalNews() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header with Logo */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <a href="/" className="text-2xl font-bold">
              <span className="text-gray-900">Ceto</span>
              <span className="text-teal-600">Interactive</span>
            </a>
            <nav className="hidden md:flex gap-8">
              <a href="/" className="text-gray-700 hover:text-teal-600 font-medium">Home</a>
              <a href="/services" className="text-gray-700 hover:text-teal-600 font-medium">Services</a>
              <a href="/envnews" className="text-teal-600 font-medium">Environmental News</a>
              <a href="/contact" className="text-gray-700 hover:text-teal-600 font-medium">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 to-teal-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Environmental Intelligence</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Stay informed on Texas environmental regulations, federal updates, new legislation, and compliance requirements affecting construction and development.
          </p>
        </div>
      </section>

      {/* Coming Soon Notice */}
      <section className="py-12 bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-8 border-2 border-blue-200 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Real-Time News Feed Coming Soon</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              We're building an automated system to aggregate and display the latest environmental news, regulatory updates, and compliance changes from official Texas and federal sources.
            </p>
            <a href="/contact" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              Get Notified When Live
            </a>
          </div>
        </div>
      </section>

      {/* Featured Topics - Static for now */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">What We'll Cover</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Topic 1 */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Texas Regulations</h3>
              <p className="text-gray-600">
                TCEQ rule changes, permit requirements, and state environmental policy updates
              </p>
            </div>

            {/* Topic 2 */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Federal Updates</h3>
              <p className="text-gray-600">
                EPA regulations, Clean Water Act changes, and federal compliance requirements
              </p>
            </div>

            {/* Topic 3 */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Construction Compliance</h3>
              <p className="text-gray-600">
                SWPPP requirements, erosion control updates, and construction-specific regulations
              </p>
            </div>

            {/* Topic 4 */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Renewable Energy</h3>
              <p className="text-gray-600">
                Solar and wind permitting updates, environmental review requirements, and policy changes
              </p>
            </div>

            {/* Topic 5 */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Conservation & Parks</h3>
              <p className="text-gray-600">
                New state parks, conservation initiatives, wetland mitigation requirements
              </p>
            </div>

            {/* Topic 6 */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Legislative Updates</h3>
              <p className="text-gray-600">
                New Texas bills, environmental legislation, and regulatory framework changes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample News Structure - Placeholder */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Latest Updates</h2>
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">
                All
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">
                Texas
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">
                Federal
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">
                Local
              </button>
            </div>
          </div>

          {/* Placeholder News Cards */}
          <div className="space-y-6">
            {/* Example News Item 1 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                    TCEQ Update
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Example: TCEQ Updates Construction Stormwater Permit Requirements
                  </h3>
                  <p className="text-gray-500 text-sm">January 10, 2026 • Texas Commission on Environmental Quality</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Placeholder for actual news content. When live, this will automatically pull from official TCEQ announcements, press releases, and regulatory updates affecting construction projects across Texas.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>📍 Statewide</span>
                <span>•</span>
                <span>🏗️ Construction</span>
              </div>
            </div>

            {/* Example News Item 2 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                    EPA Federal
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Example: New Clean Water Act Guidance Released
                  </h3>
                  <p className="text-gray-500 text-sm">January 8, 2026 • Environmental Protection Agency</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Placeholder for federal regulatory updates. Live system will aggregate EPA announcements, rule changes, and compliance deadlines relevant to Texas developers and contractors.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>📍 Federal</span>
                <span>•</span>
                <span>💧 Water Quality</span>
              </div>
            </div>

            {/* Example News Item 3 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                    State Parks
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Example: Texas Parks & Wildlife Announces New Conservation Area
                  </h3>
                  <p className="text-gray-500 text-sm">January 5, 2026 • Texas Parks & Wildlife Department</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Placeholder for conservation and parks updates. Live feed will include TPWD announcements, new protected areas, and habitat conservation requirements affecting development.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>📍 North Texas</span>
                <span>•</span>
                <span>🌳 Conservation</span>
              </div>
            </div>
          </div>

          {/* Pagination Placeholder */}
          <div className="mt-12 flex justify-center gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">1</button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">2</button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">3</button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">Next →</button>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Stay Informed</h2>
          <p className="text-xl text-gray-600 mb-8">
            Get weekly updates on Texas environmental regulations delivered to your inbox
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input 
              type="email" 
              placeholder="your@email.com" 
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
            />
            <button 
              type="submit"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Subscribe
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-4">
            No spam. Unsubscribe anytime. Curated by DJ Morgan.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Need Help Navigating Regulations?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Let us handle environmental compliance so you can focus on building.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact" 
              className="inline-block bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition"
            >
              Schedule Consultation
            </a>
            <a 
              href="/services" 
              className="inline-block bg-teal-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-teal-700 transition border-2 border-white"
            >
              View Services
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
