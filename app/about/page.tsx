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
          Environmental assurance and real-time intelligence—built to help projects move forward responsibly, predictably,
          and with confidence.
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
          Ceto Interactive helps organizations meet environmental obligations without sacrificing schedule or performance.
          We unite field-verified science with modern IoT monitoring and regulatory intelligence so cities, developers, and
          conservation partners can make decisions that protect ecosystems, reduce risk, and keep work moving.
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
              Phase I Environmental Site Assessments (ESAs), wetland delineations, and habitat surveys delivered with
              disciplined methodology, clear documentation, and practical guidance aligned to permitting and compliance
              requirements.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-light mb-2" style={{ color: THEME.ink }}>
              Real-Time Environmental Monitoring
            </h3>
            <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
              Purpose-built IoT sensor networks that measure water quality, air conditions, and ecosystem indicators—streaming
              live, reliable data to support proactive compliance, early issue detection, and defensible reporting.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-light mb-2" style={{ color: THEME.ink }}>
              Regulatory Intelligence
            </h3>
            <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
              Curated updates across EPA actions, enforcement trends, and permit changes—translated into clear, actionable
              intelligence that helps teams anticipate requirements, document decisions, and respond quickly.
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
          We operate where compliance meets execution. Our teams pair on-site expertise with technology that delivers
          continuous visibility—whether monitoring wetlands during active construction, tracking sensitive habitat, or
          keeping stakeholders aligned as regulations evolve. The result is clarity you can act on, backed by evidence you
          can stand behind.
        </p>
        <p className="text-base font-light leading-relaxed" style={{ color: "rgba(20, 35, 55, 0.80)" }}>
          Headquartered in McKinney, Texas, we support clients across diverse ecosystems and regulatory environments with a
          standard of precision, transparency, and stewardship that earns trust—from the field to the boardroom.
        </p>
      </div>
    </div>
  );
}

