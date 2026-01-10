export default function Services() {
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
              <a href="/services" className="text-teal-600 font-medium">Services</a>
              <a href="/envnews" className="text-gray-700 hover:text-teal-600 font-medium">Environmental News</a>
              <a href="/contact" className="text-gray-700 hover:text-teal-600 font-medium">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 to-teal-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Comprehensive environmental solutions tailored to your project. Contact us for a custom quote based on scope, duration, and location.
          </p>
        </div>
      </section>

      {/* Construction Services */}
      <section id="construction" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Construction Environmental Compliance</h2>
            <p className="text-xl text-gray-600">Professional compliance services for active construction projects</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* SWPPP */}
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">SWPPP Development & Management</h3>
              <p className="text-gray-600 mb-6">
                Complete Stormwater Pollution Prevention Plans for construction sites over 1 acre. EPA CGP and TCEQ compliant.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Site-specific SWPPP document (25-40 pages)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">BMP specifications and drainage maps</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">NOI assistance and contractor training</span>
                </li>
              </ul>
              <a href="/contact" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Request Quote
              </a>
            </div>

            {/* Erosion Control Monitoring */}
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Erosion Control Monitoring</h3>
              <p className="text-gray-600 mb-6">
                Weekly site inspections with photo documentation and compliance reporting.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Weekly inspections + post-rain event checks</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Comprehensive photo documentation</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Monthly compliance reports</span>
                </li>
              </ul>
              <a href="/contact" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Request Quote
              </a>
            </div>

            {/* Pre-Construction Screening */}
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Pre-Construction Environmental Screening</h3>
              <p className="text-gray-600 mb-6">
                Desktop environmental risk assessment before you break ground.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Regulatory database review (TCEQ, EPA)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Wetland and floodplain screening</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Historical aerial photo analysis</span>
                </li>
              </ul>
              <a href="/contact" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Request Quote
              </a>
            </div>

            {/* Environmental Coordination */}
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Environmental Compliance Coordination</h3>
              <p className="text-gray-600 mb-6">
                Ongoing environmental support for active projects (hourly consulting).
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Permitting application coordination</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Agency correspondence and submittal tracking</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Contractor environmental training</span>
                </li>
              </ul>
              <a href="/contact" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Request Quote
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Renewable Energy Services */}
      <section id="renewable" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Renewable Energy Services</h2>
            <p className="text-xl text-gray-600">Environmental support for solar and wind projects</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Solar/Wind Screening */}
            <div className="bg-white rounded-xl p-8 border border-slate-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Solar/Wind Project Environmental Screening</h3>
              <p className="text-gray-600 mb-6">
                Desktop environmental constraints analysis for renewable energy projects.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Species habitat and wetland review</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Cultural resources screening</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Preliminary permitting pathway assessment</span>
                </li>
              </ul>
              <a href="/contact" className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition">
                Request Quote
              </a>
            </div>

            {/* Permitting Coordination */}
            <div className="bg-white rounded-xl p-8 border border-slate-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Environmental Permitting Coordination</h3>
              <p className="text-gray-600 mb-6">
                Agency coordination and permit application support (hourly consulting).
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">USACE wetland permit support</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">TPWD and USFWS consultation coordination</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Permit tracking and compliance monitoring</span>
                </li>
              </ul>
              <a href="/contact" className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition">
                Request Quote
              </a>
            </div>

            {/* Construction Monitoring */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 md:col-span-2">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Construction Environmental Monitoring (Solar/Wind)</h3>
              <p className="text-gray-600 mb-6">
                On-site compliance monitoring during solar and wind construction phases.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Weekly construction compliance inspections</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Environmental permit condition verification</span>
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Photo documentation and monthly reporting</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Contractor environmental training</span>
                  </li>
                </ul>
              </div>
              <a href="/contact" className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition">
                Request Quote
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Technology Services */}
      <section id="technology" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Smart Monitoring Technology</h2>
            <p className="text-xl text-gray-600">Custom IoT environmental monitoring systems</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Smart Construction Monitoring */}
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Construction Monitoring System</h3>
              <p className="text-gray-600 mb-6">
                Automated photo capture and compliance documentation system.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">ESP32-CAM automated daily photo capture</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Weather-triggered event documentation</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Cloud storage and web dashboard access</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Weekly automated compliance reports</span>
                </li>
              </ul>
              <a href="/contact" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Request Quote
              </a>
            </div>

            {/* Environmental Sensor Monitoring */}
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Environmental Sensor Monitoring</h3>
              <p className="text-gray-600 mb-6">
                Real-time water quality monitoring with automated alerts.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Multi-sensor system (pH, turbidity, temperature)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Automated data logging and cloud upload</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Threshold exceedance alerts (text/email)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Monthly analytical reports</span>
                </li>
              </ul>
              <a href="/contact" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Request Quote
              </a>
            </div>

            {/* Wetland Monitoring */}
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 md:col-span-2">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Wetland/Conservation Area Monitoring</h3>
              <p className="text-gray-600 mb-6">
                Hydrology and wildlife monitoring for mitigation and conservation sites.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Automated water level and precipitation tracking</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Wildlife camera integration (optional)</span>
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Quarterly compliance reports per permit schedule</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-teal-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Multi-year data archive and analysis</span>
                  </li>
                </ul>
              </div>
              <a href="/contact" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Request Quote
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Environmental Research Services */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Environmental Research & Support Services</h2>
            <p className="text-xl text-gray-600">Professional research services for consulting firms and property transactions</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Database Screening */}
            <div className="bg-white rounded-xl p-8 border border-slate-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Regulatory Database Screening</h3>
              <p className="text-gray-600 mb-6">
                Complete ASTM Table 1 database searches for Phase I ESA support.
              </p>
              <a href="/contact" className="text-blue-600 font-semibold hover:underline">Contact for Quote →</a>
            </div>

            {/* Historical Research */}
            <div className="bg-white rounded-xl p-8 border border-slate-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Historical Research & Aerials</h3>
              <p className="text-gray-600 mb-6">
                Aerial photos, Sanborn maps, and historical land use analysis.
              </p>
              <a href="/contact" className="text-blue-600 font-semibold hover:underline">Contact for Quote →</a>
            </div>

            {/* Site Reconnaissance */}
            <div className="bg-white rounded-xl p-8 border border-slate-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Site Reconnaissance</h3>
              <p className="text-gray-600 mb-6">
                Field observations and photo documentation for Phase I ESAs.
              </p>
              <a href="/contact" className="text-blue-600 font-semibold hover:underline">Contact for Quote →</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Discuss Your Project?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Contact us for a custom quote based on your project scope, duration, and location.
          </p>
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
