"use client";

import { useEffect, useMemo, useState } from "react";

type Impact = "high" | "medium" | "low";
type ArticleType = "permit" | "enforcement" | "policy" | "hunting" | "development" | "conservation" | "general";

interface FeedItem {
  id?: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  summary?: string;
  category?: string;
  impact?: Impact;
  deadline?: string;
  location?: string;
  type?: ArticleType;
  tags?: string[];
}

const THEME = {
  bg: "#F8F9FA",
  surface: "rgba(255,255,255,0.85)",
  surfaceStrong: "rgba(255,255,255,0.92)",
  border: "rgba(20, 35, 55, 0.12)",
  ink: "#0A1929",
  inkMuted: "rgba(10, 25, 41, 0.72)",

  texasBlue: "#002868",
  texasRed: "#BF0A30",
  lonestarGold: "#C5A572",

  sage: "#4F7A6A",
  sageDark: "#3E6357",
  sunset: "#E07A5F",
};

interface ImpactConfig {
  weight: number;
  color: string;
  bg: string;
  label: string;
}

const IMPACT_CONFIG: Record<Impact, ImpactConfig> = {
  high: { weight: 3, color: "#D97706", bg: "rgba(217, 119, 6, 0.08)", label: "HIGH" },
  medium: { weight: 2, color: THEME.lonestarGold, bg: "rgba(197, 165, 114, 0.10)", label: "MEDIUM" },
  low: { weight: 1, color: THEME.sage, bg: "rgba(79, 122, 106, 0.08)", label: "LOW" },
};

const RECENCY_DAYS = 90;

function toTime(iso?: string): number {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function primaryTime(item: FeedItem): number {
  return Math.max(toTime(item.publishedAt), toTime(item.deadline));
}

function sortScore(item: FeedItem): number {
  const recency = primaryTime(item);
  const impact = item.impact ? IMPACT_CONFIG[item.impact].weight : 0;
  return recency + impact * 86400000;
}

function formatEditionDate(d = new Date()): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "TODAY";
    if (diffDays === 1) return "YESTERDAY";
    if (diffDays < 7) return `${diffDays}D AGO`;

    return date
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      })
      .toUpperCase();
  } catch {
    return iso;
  }
}

// Component for section headers
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs font-bold tracking-[0.15em] mb-4 flex items-center gap-2"
      style={{ color: THEME.texasBlue }}
    >
      <span className="w-6 h-px" style={{ backgroundColor: THEME.lonestarGold }} />
      {children}
    </h2>
  );
}

// Lead Story Component
function LeadStory({ item }: { item: FeedItem }) {
  const impactCfg = item.impact ? IMPACT_CONFIG[item.impact] : null;

  return (
    <article
      className="rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
      style={{
        backgroundColor: THEME.surfaceStrong,
        border: `1px solid ${THEME.border}`,
      }}
    >
      <div className="flex items-start gap-4 mb-3">
        {impactCfg && (
          <span
            className="px-3 py-1 rounded-md text-[10px] font-bold tracking-wider"
            style={{ backgroundColor: impactCfg.bg, color: impactCfg.color }}
          >
            {impactCfg.label}
          </span>
        )}
        {item.category && (
          <span
            className="px-3 py-1 rounded-md text-[10px] font-semibold tracking-wide"
            style={{ backgroundColor: "rgba(0,40,104,0.06)", color: THEME.texasBlue }}
          >
            {item.category}
          </span>
        )}
      </div>

      <h3
        className="text-2xl font-bold mb-3 leading-tight"
        style={{ color: THEME.ink }}
      >
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {item.title}
        </a>
      </h3>

      {item.summary && (
        <p className="text-sm leading-relaxed mb-4" style={{ color: THEME.inkMuted }}>
          {item.summary}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: THEME.inkMuted }}>
        <span className="font-semibold" style={{ color: THEME.texasBlue }}>
          {item.source}
        </span>
        <span>•</span>
        <span>{formatDate(item.publishedAt)}</span>
        {item.location && (
          <>
            <span>•</span>
            <span>{item.location}</span>
          </>
        )}
        {item.deadline && (
          <>
            <span>•</span>
            <span className="font-semibold" style={{ color: THEME.sunset }}>
              Deadline: {formatDate(item.deadline)}
            </span>
          </>
        )}
      </div>
    </article>
  );
}

// Featured Card Component
function FeaturedCard({ item }: { item: FeedItem }) {
  const impactCfg = item.impact ? IMPACT_CONFIG[item.impact] : null;

  return (
    <article
      className="rounded-xl p-4 shadow transition-all duration-300 hover:shadow-lg"
      style={{
        backgroundColor: THEME.surface,
        border: `1px solid ${THEME.border}`,
      }}
    >
      <div className="flex items-start gap-2 mb-2">
        {impactCfg && (
          <span
            className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider"
            style={{ backgroundColor: impactCfg.bg, color: impactCfg.color }}
          >
            {impactCfg.label}
          </span>
        )}
        {item.category && (
          <span
            className="px-2 py-0.5 rounded text-[9px] font-semibold"
            style={{ backgroundColor: "rgba(0,40,104,0.05)", color: THEME.texasBlue }}
          >
            {item.category}
          </span>
        )}
      </div>

      <h3 className="text-base font-bold mb-2 leading-tight" style={{ color: THEME.ink }}>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {item.title}
        </a>
      </h3>

      {item.summary && (
        <p
          className="text-xs leading-relaxed mb-3 line-clamp-2"
          style={{ color: THEME.inkMuted }}
        >
          {item.summary}
        </p>
      )}

      <div
        className="flex flex-wrap items-center gap-2 text-[10px]"
        style={{ color: THEME.inkMuted }}
      >
        <span className="font-semibold" style={{ color: THEME.texasBlue }}>
          {item.source}
        </span>
        <span>•</span>
        <span>{formatDate(item.publishedAt)}</span>
        {item.location && (
          <>
            <span>•</span>
            <span>{item.location}</span>
          </>
        )}
      </div>
    </article>
  );
}

// Headline Item Component
function HeadlineItem({ item }: { item: FeedItem }) {
  return (
    <article className="py-3 border-b" style={{ borderColor: THEME.border }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold mb-1.5 leading-snug" style={{ color: THEME.ink }}>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {item.title}
            </a>
          </h4>

          <div
            className="flex flex-wrap items-center gap-2 text-[10px]"
            style={{ color: THEME.inkMuted }}
          >
            <span className="font-semibold" style={{ color: THEME.texasBlue }}>
              {item.source}
            </span>
            {item.category && (
              <>
                <span>•</span>
                <span>{item.category}</span>
              </>
            )}
            {item.location && (
              <>
                <span>•</span>
                <span>{item.location}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: THEME.inkMuted }}>
            {formatDate(item.publishedAt)}
          </span>
          {item.impact && (
            <span
              className="px-2 py-0.5 rounded text-[8px] font-bold tracking-wider whitespace-nowrap"
              style={{
                backgroundColor: IMPACT_CONFIG[item.impact].bg,
                color: IMPACT_CONFIG[item.impact].color,
              }}
            >
              {IMPACT_CONFIG[item.impact].label}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

// Brief Item Component
function BriefItem({ item }: { item: FeedItem }) {
  return (
    <article className="py-2 border-b" style={{ borderColor: THEME.border }}>
      <h5 className="text-xs font-medium mb-1 leading-snug" style={{ color: THEME.ink }}>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {item.title}
        </a>
      </h5>

      <div
        className="flex flex-wrap items-center gap-2 text-[9px]"
        style={{ color: THEME.inkMuted }}
      >
        <span className="font-semibold" style={{ color: THEME.texasBlue }}>
          {item.source}
        </span>
        <span>•</span>
        <span>{formatDate(item.publishedAt)}</span>
        {item.category && (
          <>
            <span>•</span>
            <span>{item.category}</span>
          </>
        )}
      </div>
    </article>
  );
}

export default function TexasEnvironmentalNews() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [impactFilter, setImpactFilter] = useState<"All" | Impact>("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState<"All" | ArticleType>("All");

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch("/api/texas-updates", {
          cache: "no-store",
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();

        if (!alive) return;

        // Add IDs to items if they don't have them
        const itemsWithIds = (Array.isArray(data.items) ? data.items : []).map((item: FeedItem, idx: number) => ({
          ...item,
          id: item.id || `${item.source}-${idx}-${item.link.substring(item.link.length - 10)}`,
        }));

        setItems(itemsWithIds);
      } catch (e: unknown) {
        if (!alive) return;
        const err = e as Error;
        if (err?.name === "AbortError") {
          setError("Request timeout. Please refresh.");
        } else {
          setError("Unable to load updates. Refresh to try again.");
        }
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category).filter(Boolean) as string[]);
    return ["All", ...Array.from(cats).sort()];
  }, [items]);

  const locations = useMemo(() => {
    const locs = new Set(items.map((i) => i.location).filter(Boolean) as string[]);
    return ["All", ...Array.from(locs).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const userIsRefining =
      q.length > 0 ||
      categoryFilter !== "All" ||
      impactFilter !== "All" ||
      locationFilter !== "All" ||
      typeFilter !== "All";

    const cutoff = Date.now() - RECENCY_DAYS * 24 * 60 * 60 * 1000;

    const base = items.filter((it) => {
      const t = primaryTime(it);
      const withinWindow = t === 0 ? true : t >= cutoff;
      if (!userIsRefining && !withinWindow) return false;

      const categoryOk = categoryFilter === "All" || it.category === categoryFilter;
      const impactOk = impactFilter === "All" || it.impact === impactFilter;
      const locationOk = locationFilter === "All" || it.location === locationFilter;
      const typeOk = typeFilter === "All" || it.type === typeFilter;

      const queryOk = q
        ? [it.title, it.source, it.summary, it.category, it.location, ...(it.tags || [])]
            .join(" ")
            .toLowerCase()
            .includes(q)
        : true;

      return categoryOk && impactOk && locationOk && typeOk && queryOk;
    });

    return base.sort((a, b) => sortScore(b) - sortScore(a));
  }, [items, query, categoryFilter, impactFilter, locationFilter, typeFilter]);

  // Main sections
  const lead = filtered[0] || null;
  const featured = filtered.slice(1, 5);
  const headlines = filtered.slice(5, 15);
  const briefs = filtered.slice(15, 30);

  // Track which items have been shown in main sections
  const shownIds = useMemo(() => {
    const ids = new Set<string>();
    if (lead?.id) ids.add(lead.id);
    featured.forEach(item => item.id && ids.add(item.id));
    headlines.forEach(item => item.id && ids.add(item.id));
    briefs.forEach(item => item.id && ids.add(item.id));
    return ids;
  }, [lead, featured, headlines, briefs]);

  // Sidebar sections - EXCLUDE items already shown in main sections
  const upcomingDeadlines = useMemo(() => {
    const now = Date.now();
    return filtered
      .filter((i) => !shownIds.has(i.id!)) // EXCLUDE already shown items
      .filter((i) => i.deadline && toTime(i.deadline) >= now)
      .sort((a, b) => toTime(a.deadline!) - toTime(b.deadline!))
      .slice(0, 8);
  }, [filtered, shownIds]);

  const highImpactItems = useMemo(() => {
    return filtered
      .filter((i) => !shownIds.has(i.id!)) // EXCLUDE already shown items
      .filter((i) => i.impact === "high")
      .slice(0, 5);
  }, [filtered, shownIds]);

  return (
    <main className="relative min-h-screen" style={{ backgroundColor: THEME.bg }}>
      {/* Sophisticated background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.35,
            backgroundImage: `
                radial-gradient(circle at 15% 25%, rgba(0, 40, 104, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 85% 75%, rgba(197, 165, 114, 0.06) 0%, transparent 45%),
                radial-gradient(circle at 50% 50%, rgba(191, 10, 48, 0.03) 0%, transparent 60%)
              `,
          }}
        />

        {/* Topographic lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
          <defs>
            <pattern id="topo" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path
                d="M0 50 Q 25 45, 50 50 T 100 50"
                fill="none"
                stroke="rgba(0,40,104,0.15)"
                strokeWidth="0.5"
              />
              <path
                d="M0 75 Q 25 70, 50 75 T 100 75"
                fill="none"
                stroke="rgba(0,40,104,0.10)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo)" />
        </svg>
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-10 pt-8 pb-20">
        <div className="max-w-[1400px] mx-auto">
          {/* Masthead */}
          <header
            className="rounded-3xl p-6 sm:p-8 lg:p-12 shadow-xl mb-8"
            style={{
              backgroundColor: THEME.surfaceStrong,
              border: `1px solid ${THEME.border}`,
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2"
                  style={{ color: THEME.texasBlue }}
                >
                  Texas Environmental Intelligence
                </h1>
                <p className="text-sm sm:text-base" style={{ color: THEME.inkMuted }}>
                  Comprehensive regulatory intelligence for Texas developers, consultants, and agencies
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold mb-1" style={{ color: THEME.lonestarGold }}>
                  DAILY EDITION
                </p>
                <p className="text-xs" style={{ color: THEME.inkMuted }}>
                  {formatEditionDate()}
                </p>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search updates..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: "rgba(255,255,255,0.8)",
                  borderColor: THEME.border,
                  color: THEME.ink,
                }}
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: showFilters ? THEME.texasBlue : "rgba(0,40,104,0.1)",
                  color: showFilters ? "white" : THEME.texasBlue,
                }}
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm border"
                  style={{ backgroundColor: "rgba(255,255,255,0.8)", borderColor: THEME.border }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={impactFilter}
                  onChange={(e) => setImpactFilter(e.target.value as "All" | Impact)}
                  className="px-3 py-2 rounded-lg text-sm border"
                  style={{ backgroundColor: "rgba(255,255,255,0.8)", borderColor: THEME.border }}
                >
                  <option value="All">All Impact Levels</option>
                  <option value="high">High Impact</option>
                  <option value="medium">Medium Impact</option>
                  <option value="low">Low Impact</option>
                </select>

                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm border"
                  style={{ backgroundColor: "rgba(255,255,255,0.8)", borderColor: THEME.border }}
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as "All" | ArticleType)}
                  className="px-3 py-2 rounded-lg text-sm border"
                  style={{ backgroundColor: "rgba(255,255,255,0.8)", borderColor: THEME.border }}
                >
                  <option value="All">All Types</option>
                  <option value="permit">Permits</option>
                  <option value="enforcement">Enforcement</option>
                  <option value="policy">Policy</option>
                  <option value="hunting">Hunting</option>
                  <option value="development">Development</option>
                  <option value="conservation">Conservation</option>
                  <option value="general">General</option>
                </select>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-2xl font-bold" style={{ color: THEME.texasBlue }}>
                  {filtered.length}
                </p>
                <p className="text-xs" style={{ color: THEME.inkMuted }}>
                  Total Updates
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: THEME.sunset }}>
                  {upcomingDeadlines.length}
                </p>
                <p className="text-xs" style={{ color: THEME.inkMuted }}>
                  Active Deadlines
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "#D97706" }}>
                  {highImpactItems.length}
                </p>
                <p className="text-xs" style={{ color: THEME.inkMuted }}>
                  High Impact
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: THEME.sage }}>
                  {new Set(filtered.map(i => i.source)).size}
                </p>
                <p className="text-xs" style={{ color: THEME.inkMuted }}>
                  Active Sources
                </p>
              </div>
            </div>
          </header>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-current border-r-transparent mb-4" style={{ color: THEME.texasBlue }}></div>
              <p className="text-sm" style={{ color: THEME.inkMuted }}>
                Loading Texas environmental intelligence...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div
              className="rounded-xl p-6 text-center"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}
            >
              <p className="text-sm font-semibold mb-2" style={{ color: "#DC2626" }}>
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: THEME.texasBlue, color: "white" }}
              >
                Refresh Page
              </button>
            </div>
          )}

          {/* Main Content */}
          {!loading && !error && filtered.length > 0 && (
            <div className="space-y-8">
              {/* Lead Story */}
              {lead && (
                <section>
                  <SectionHeader>LEAD STORY</SectionHeader>
                  <LeadStory item={lead} />
                </section>
              )}

              {/* Featured Stories */}
              {featured.length > 0 && (
                <section>
                  <SectionHeader>FEATURED</SectionHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {featured.map((item) => (
                      <FeaturedCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column - Headlines */}
                <div className="lg:col-span-2 space-y-8">
                  {headlines.length > 0 && (
                    <section
                      className="rounded-2xl p-6"
                      style={{
                        backgroundColor: THEME.surface,
                        border: `1px solid ${THEME.border}`,
                      }}
                    >
                      <SectionHeader>HEADLINES</SectionHeader>
                      <div className="space-y-0">
                        {headlines.map((item) => (
                          <HeadlineItem key={item.id} item={item} />
                        ))}
                      </div>
                    </section>
                  )}

                  {briefs.length > 0 && (
                    <section
                      className="rounded-2xl p-6"
                      style={{
                        backgroundColor: THEME.surface,
                        border: `1px solid ${THEME.border}`,
                      }}
                    >
                      <SectionHeader>BRIEFS</SectionHeader>
                      <div className="space-y-0">
                        {briefs.map((item) => (
                          <BriefItem key={item.id} item={item} />
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Upcoming Deadlines */}
                  {upcomingDeadlines.length > 0 && (
                    <section
                      className="rounded-2xl p-5 sticky top-4"
                      style={{
                        backgroundColor: THEME.surfaceStrong,
                        border: `1px solid ${THEME.border}`,
                      }}
                    >
                      <SectionHeader>UPCOMING DEADLINES</SectionHeader>
                      <div className="space-y-3">
                        {upcomingDeadlines.map((item) => (
                          <div key={item.id} className="pb-3 border-b last:border-b-0" style={{ borderColor: THEME.border }}>
                            <p className="text-xs font-bold mb-1" style={{ color: THEME.sunset }}>
                              {formatDate(item.deadline!)}
                            </p>
                            <p className="text-xs font-medium mb-1 leading-snug" style={{ color: THEME.ink }}>
                              <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {item.title}
                              </a>
                            </p>
                            <p className="text-[10px]" style={{ color: THEME.inkMuted }}>
                              {item.source}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* High Impact Items */}
                  {highImpactItems.length > 0 && (
                    <section
                      className="rounded-2xl p-5"
                      style={{
                        backgroundColor: THEME.surfaceStrong,
                        border: `1px solid ${THEME.border}`,
                      }}
                    >
                      <SectionHeader>HIGH IMPACT</SectionHeader>
                      <div className="space-y-3">
                        {highImpactItems.map((item) => (
                          <div key={item.id} className="pb-3 border-b last:border-b-0" style={{ borderColor: THEME.border }}>
                            <p className="text-xs font-medium mb-1 leading-snug" style={{ color: THEME.ink }}>
                              <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {item.title}
                              </a>
                            </p>
                            <div className="flex items-center gap-2 text-[10px]" style={{ color: THEME.inkMuted }}>
                              <span className="font-semibold" style={{ color: THEME.texasBlue }}>
                                {item.source}
                              </span>
                              {item.category && (
                                <>
                                  <span>•</span>
                                  <span>{item.category}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg font-semibold mb-2" style={{ color: THEME.ink }}>
                No updates found
              </p>
              <p className="text-sm" style={{ color: THEME.inkMuted }}>
                Try adjusting your filters or search query
              </p>
            </div>
          )}

          {/* Legal Disclaimer Footer */}
          {!loading && !error && filtered.length > 0 && (
            <footer 
              className="mt-16 pt-8 pb-4 border-t-2 text-center"
              style={{ borderColor: THEME.border }}
            >
              <div className="max-w-3xl mx-auto space-y-3">
                <p className="text-xs font-semibold" style={{ color: THEME.texasBlue }}>
                  CONTENT ATTRIBUTION & DISCLAIMER
                </p>
                <p className="text-xs leading-relaxed" style={{ color: THEME.inkMuted }}>
                  All content is aggregated from publicly available RSS feeds provided by government agencies, 
                  news organizations, and other sources. Headlines, summaries, and links are used under fair use 
                  principles for informational and educational purposes.
                </p>
                <p className="text-xs leading-relaxed" style={{ color: THEME.inkMuted }}>
                  <strong style={{ color: THEME.ink }}>All articles and content © their respective sources.</strong> 
                  {" "}Click article headlines to read full content at the original source. 
                  Ceto Interactive does not claim ownership of any aggregated content.
                </p>
                <p className="text-xs leading-relaxed" style={{ color: THEME.inkMuted }}>
                  This intelligence platform is provided as a professional service for Texas environmental 
                  consultants, developers, and regulatory professionals. If you are a content owner and would 
                  like your feed removed, please contact us.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className="text-xs font-mono" style={{ color: THEME.lonestarGold }}>
                    CETO INTERACTIVE
                  </span>
                  <span className="text-xs" style={{ color: THEME.inkMuted }}>•</span>
                  <span className="text-xs" style={{ color: THEME.inkMuted }}>
                    Texas Environmental Consulting
                  </span>
                </div>
              </div>
            </footer>
          )}
        </div>
      </div>
    </main>
  );
}
