export default function AboutPage() {
  const THEME = {
    bg: "#F6F7F8",
    surface: "rgba(255,255,255,0.62)",
    border: "rgba(20, 35, 55, 0.14)",
    ink: "#142337",
    leviBlue: "#2F5D8C",
    washedBlue: "#6E93B5",
    washedGreen: "#4F7A6A",
  };

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-light mb-4" style={{ color: THEME.ink }}>
          About <span style={{ color: THEME.leviBlue, fontWeight: 400 }}>Ceto Interactive</span>
        </h1>
        <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
          Where environmental expertise meets real-time intelligence for smarter, more sustainable decisions.
        </p>
      </div>

      {/* Mission Section */}
      <div
        className="rounded-3xl p-8 md:p-12 mb-8"
        style={{
          backgroundColor: THEME.surface,
          border: `1px solid ${THEME.border}`,
          backdropFilter: "blur(10px)",
        }}
      >
        <h2 className="text-2xl font-light mb-4" style={{ color: THEME.leviBlue }}>
          Our Mission
        </h2>
        <p className="text-base font-light leading-relaxed" style={{ color: "rgba(20, 35, 55, 0.80)" }}>
          We bridge the gap between environmental compliance and operational efficiency. Through cutting-edge IoT monitoring, 
          regulatory intelligence, and field expertise, we help cities, developers, and conservationists make informed decisions 
          that protect ecosystems while advancing projects with confidence.
        </p>
      </div>

      {/* What We Do */}
      <div
        className="rounded-3xl p-8 md:p-12 mb-8"
        style={{
          backgroundColor: THEME.surface,
          border: `1px solid ${THEME.border}`,
          backdropFilter: "blur(10px)",
        }}
      >
        <h2 className="text-2xl font-light mb-6" style={{ color: THEME.leviBlue }}>
          What We Do
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-light mb-2" style={{ color: THEME.ink }}>
              Environmental Site Assessments
            </h3>
            <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
              Comprehensive Phase I ESAs, wetland delineations, and habitat surveys backed by professional expertise 
              and regulatory knowledge.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-light mb-2" style={{ color: THEME.ink }}>
              Real-Time Environmental Monitoring
            </h3>
            <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
              IoT sensor networks that track water quality, air conditions, and ecosystem health—delivering live data 
              for proactive compliance and conservation.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-light mb-2" style={{ color: THEME.ink }}>
              Regulatory Intelligence
            </h3>
            <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
              Curated news feeds, EPA rulings, enforcement actions, and permit updates—transforming regulatory noise 
              into actionable business intelligence.
            </p>
          </div>
        </div>
      </div>

      {/* Our Approach */}
      <div
        className="rounded-3xl p-8 md:p-12"
        style={{
          backgroundColor: THEME.surface,
          border: `1px solid ${THEME.border}`,
          backdropFilter: "blur(10px)",
        }}
      >
        <h2 className="text-2xl font-light mb-4" style={{ color: THEME.leviBlue }}>
          Our Approach
        </h2>
        <p className="text-base font-light leading-relaxed mb-6" style={{ color: "rgba(20, 35, 55, 0.80)" }}>
          We combine boots-on-the-ground field work with sophisticated technology platforms. Whether it's monitoring 
          wetlands during construction, tracking endangered species habitat, or keeping clients ahead of regulatory 
          changes, we deliver clarity when it matters most.
        </p>
        <p className="text-base font-light leading-relaxed" style={{ color: "rgba(20, 35, 55, 0.80)" }}>
          Based in McKinney, Texas, Ceto Interactive serves clients across diverse ecosystems and regulatory landscapes, 
          bringing precision, transparency, and environmental stewardship to every project.
        </p>
      </div>
    </div>
  );
}
