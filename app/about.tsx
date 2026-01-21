import { SiteShell } from "./SiteShell";

export default function AboutPage() {
  return (
    <SiteShell>
      <main className="min-h-screen bg-[#F8F9FA]">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1929] via-[#142B3F] to-[#0D2135] text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
          
          <div className="relative max-w-4xl mx-auto px-6 py-20 lg:py-28">
            <h1 className="text-5xl lg:text-7xl font-light tracking-tight mb-6" style={{
              fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
            }}>
              About Ceto Interactive
            </h1>
            <p className="text-xl lg:text-2xl font-light text-white/80 leading-relaxed">
              Environmental consulting grounded in science, integrity, and a deep respect for the land.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
          <div className="prose prose-lg max-w-none">
            {/* Who We Are */}
            <div className="mb-16">
              <h2 className="text-3xl font-light mb-6" style={{
                fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
                color: "#0A1929"
              }}>
                Who We Are
              </h2>
              <p className="text-lg leading-relaxed text-gray-700 mb-4">
                Ceto Interactive is an environmental consulting firm based in McKinney, Texas. We specialize in Phase I Environmental Site Assessments, wetland monitoring, and regulatory compliance for development projects across the state.
              </p>
              <p className="text-lg leading-relaxed text-gray-700">
                Our work sits at the intersection of development and conservation—helping clients navigate environmental requirements while protecting the natural systems that matter.
              </p>
            </div>

            {/* What We Do */}
            <div className="mb-16">
              <h2 className="text-3xl font-light mb-6" style={{
                fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
                color: "#0A1929"
              }}>
                What We Do
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">Phase I ESAs</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Comprehensive environmental site assessments that identify potential contamination and regulatory risks before property transactions.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">Wetland Monitoring</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Delineation, permitting, and long-term monitoring of wetland systems to ensure regulatory compliance and ecological integrity.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">Environmental Compliance</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Navigating TCEQ, EPA, and federal permitting requirements for development projects across Texas.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">Conservation Planning</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Strategic planning for habitat protection, public land access, and sustainable land management.
                  </p>
                </div>
              </div>
            </div>

            {/* Our Values */}
            <div className="mb-16">
              <h2 className="text-3xl font-light mb-8" style={{
                fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
                color: "#0A1929"
              }}>
                Our Values
              </h2>
              
              <div className="space-y-8">
                <div className="border-l-4 border-[#2E5C42] pl-6">
                  <h3 className="text-2xl font-semibold mb-3 text-gray-900">Honesty</h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    We tell clients what they need to hear, not what they want to hear. Environmental assessments require accuracy, not optimism.
                  </p>
                </div>

                <div className="border-l-4 border-[#2E5C42] pl-6">
                  <h3 className="text-2xl font-semibold mb-3 text-gray-900">Integrity</h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Our reports stand on their own merit. We don't cut corners, and we don't compromise on standards to meet deadlines or budgets.
                  </p>
                </div>

                <div className="border-l-4 border-[#2E5C42] pl-6">
                  <h3 className="text-2xl font-semibold mb-3 text-gray-900">Conservation</h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Development and conservation aren't mutually exclusive. Good environmental consulting finds the balance between economic growth and ecological protection.
                  </p>
                </div>

                <div className="border-l-4 border-[#2E5C42] pl-6">
                  <h3 className="text-2xl font-semibold mb-3 text-gray-900">Fieldwork</h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Real environmental work happens in the field, not behind a desk. We conduct thorough on-site assessments because there's no substitute for boots on the ground.
                  </p>
                </div>

                <div className="border-l-4 border-[#2E5C42] pl-6">
                  <h3 className="text-2xl font-semibold mb-3 text-gray-900">Texas Heritage</h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    We understand Texas—its ecology, its regulations, and its people. From Gulf Coast wetlands to Hill Country watersheds, we know the landscape.
                  </p>
                </div>
              </div>
            </div>

            {/* Approach */}
            <div className="mb-16 bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border border-gray-200">
              <h2 className="text-3xl font-light mb-6" style={{
                fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
                color: "#0A1929"
              }}>
                Our Approach
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                We don't treat environmental consulting as a checkbox exercise. Every site has unique characteristics, every project has specific requirements, and every report we deliver reflects that reality.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Whether you're a developer navigating wetland permits, a landowner planning conservation easements, or an investor conducting due diligence, we provide clear, actionable environmental intelligence.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                No corporate jargon. No unnecessary complexity. Just honest assessments backed by thorough fieldwork and regulatory expertise.
              </p>
            </div>

            {/* Location */}
            <div>
              <h2 className="text-3xl font-light mb-6" style={{
                fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
                color: "#0A1929"
              }}>
                Based in McKinney, Texas
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                We're headquartered in McKinney but work throughout Texas. Our projects span from North Dallas development sites to coastal wetlands along the Gulf, from Hill Country watersheds to East Texas bottomlands.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                If your project involves Texas land, Texas regulations, or Texas ecology, we can help.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-[#0A1929] to-[#142B3F] text-white py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl lg:text-4xl font-light mb-6" style={{
              fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
            }}>
              Ready to Work Together?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Whether you need a Phase I ESA, wetland delineation, or regulatory guidance, we're here to help.
            </p>
            <a
              href="/contact"
              className="inline-block bg-white text-[#0A1929] px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}