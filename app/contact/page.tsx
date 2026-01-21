export default function ContactPage() {
  const THEME = {
    bg: "#F6F7F8",
    surface: "rgba(255,255,255,0.62)",
    border: "rgba(20, 35, 55, 0.14)",
    ink: "#142337",
    leviBlue: "#2F5D8C",
    leviBlueDark: "#234B74",
  };

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-light mb-4" style={{ color: THEME.ink }}>
          Start a <span style={{ color: THEME.leviBlue, fontWeight: 400 }}>Conversation</span>
        </h1>
        <p className="text-lg font-light" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
          Let's discuss how environmental intelligence can support your next project.
        </p>
      </div>

      <div
        className="rounded-3xl p-8 md:p-12"
        style={{
          backgroundColor: THEME.surface,
          border: `1px solid ${THEME.border}`,
          backdropFilter: "blur(10px)",
        }}
      >
        <form className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-light mb-2" style={{ color: THEME.ink }}>
                Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border font-light"
                style={{
                  borderColor: THEME.border,
                  backgroundColor: "rgba(255,255,255,0.8)",
                }}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-light mb-2" style={{ color: THEME.ink }}>
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-lg border font-light"
                style={{
                  borderColor: THEME.border,
                  backgroundColor: "rgba(255,255,255,0.8)",
                }}
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-light mb-2" style={{ color: THEME.ink }}>
              Organization
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border font-light"
              style={{
                borderColor: THEME.border,
                backgroundColor: "rgba(255,255,255,0.8)",
              }}
              placeholder="Company or agency name"
            />
          </div>

          <div>
            <label className="block text-sm font-light mb-2" style={{ color: THEME.ink }}>
              How can we help?
            </label>
            <textarea
              rows={6}
              className="w-full px-4 py-3 rounded-lg border font-light"
              style={{
                borderColor: THEME.border,
                backgroundColor: "rgba(255,255,255,0.8)",
              }}
              placeholder="Tell us about your project, compliance needs, or monitoring requirements..."
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-8 py-3 rounded-full text-white font-light shadow-sm transition-colors duration-200"
            style={{ backgroundColor: THEME.leviBlue }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = THEME.leviBlueDark)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = THEME.leviBlue)}
          >
            Send Message
          </button>
        </form>

        <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${THEME.border}` }}>
          <h3 className="text-lg font-light mb-4" style={{ color: THEME.ink }}>
            Other Ways to Reach Us
          </h3>
          <div className="space-y-3 text-sm font-light" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
            <p>
              <strong style={{ color: THEME.ink }}>Email:</strong> contact@cetointeractive.com
            </p>
            <p>
              <strong style={{ color: THEME.ink }}>Phone:</strong> (555) 123-4567
            </p>
            <p>
              <strong style={{ color: THEME.ink }}>Location:</strong> McKinney, Texas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
