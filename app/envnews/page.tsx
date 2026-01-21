"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "../SiteShell";

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
    
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined 
    }).toUpperCase();
  } catch {
    return iso;
  }
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

        const res = await fetch("/api/texas-updates/tx", {
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
    const cats = new Set(items.map(i => i.category).filter(Boolean) as string[]);
    return ["All", ...Array.from(cats).sort()];
  }, [items]);

  const locations = useMemo(() => {
    const locs = new Set(items.map(i => i.location).filter(Boolean) as string[]);
    return ["All", ...Array.from(locs).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const userIsRefining =
      q.length > 0 || categoryFilter !== "All" || impactFilter !== "All" || 
      locationFilter !== "All" || typeFilter !== "All";

    const cutoff = Date.now() - RECENCY_DAYS * 24 * 60 * 60 * 1000;

    const base = items.filter(it => {
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

  const lead = filtered[0] || null;
  const featured = filtered.slice(1, 5);
  const headlines = filtered.slice(5, 15);
  const briefs = filtered.slice(15, 30);

  const upcomingDeadlines = useMemo(() => {
    const now = Date.now();
    return filtered
      .filter(i => i.deadline && toTime(i.deadline) >= now)
      .sort((a, b) => toTime(a.deadline!) - toTime(b.deadline!))
      .slice(0, 8);
  }, [filtered]);

  const highImpactItems = useMemo(() => {
    return filtered.filter(i => i.impact === "high").slice(0, 5);
  }, [filtered]);

  return (
    <SiteShell>
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
                <path d="M0 50 Q 25 45, 50 50 T 100 50" fill="none" stroke="rgba(0,40,104,0.15)" strokeWidth="0.5"/>
                <path d="M0 75 Q 25 70, 50 75 T 100 75" fill="none" stroke="rgba(0,40,104,0.10)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#topo)"/>
          </svg>
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-10 pt-8 pb-20">
          <div className="max-w-[1400px] mx-auto">
            {/* Masthead */}
            <header
              className="rounded-3xl p-6 sm:p-8 lg:p-12 shadow-xl"
              style={{
                backgroundColor: THEME.surfaceStrong,
                border: `1px solid ${THEME.border}`,
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="text-xs tracking-[0.28em] uppercase font-bold"
                        style={{ color: THEME.texasBlue }}
                      >
                        🇨🇱 THE LONE STAR REPORT
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider" style={{
                        backgroundColor: "rgba(191, 10, 48, 0.10)",
                        color: THEME.texasRed,
                        border: `1px solid rgba(191, 10, 48, 0.25)`
                      }}>
                        LIVE
                      </span>
                    </div>

                    <h1
                      className="text-4xl sm:text-5xl lg:text-7xl font-light tracking-tight leading-none"
                      style={{
                        color: THEME.ink,
                        fontFamily: "ui-serif, Georgia, Cambria, Times",
                      }}
                    >
                      Texas Environmental Intel
                    </h1>

                    <div
                      className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.20em]"
                      style={{ color: THEME.inkMuted }}
                    >
                      <span className="font-bold">Environmental Intelligence Platform</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{formatEditionDate()}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {filtered.length} Active {filtered.length === 1 ? "Update" : "Updates"}
                      </span>
                    </div>

                    <p
                      className="mt-5 text-sm sm:text-base lg:text-lg font-light max-w-3xl leading-relaxed"
                      style={{ color: THEME.inkMuted }}
                    >
                      Real-time intelligence on permits, enforcement actions, land access, and regulatory changes 
                      affecting Texas development, conservation, and outdoor recreation.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowFilters(v => !v)}
                      className="px-5 py-2.5 rounded-full border text-sm font-semibold transition-all hover:shadow-md"
                      style={{
                        borderColor: THEME.border,
                        color: showFilters ? "white" : THEME.texasBlue,
                        backgroundColor: showFilters ? THEME.texasBlue : "white",
                      }}
                    >
                      {showFilters ? "Hide Filters" : "Filter & Search"}
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-6 border-t" style={{ borderColor: THEME.border }}>
                    <input
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search updates..."
                      className="sm:col-span-2 px-4 py-3 border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-white"
                      style={{ borderColor: THEME.border }}
                    />

                    <select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      className="px-4 py-3 border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-white"
                      style={{ borderColor: THEME.border }}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === "All" ? "All Categories" : cat}
                        </option>
                      ))}
                    </select>

                    <select
                      value={typeFilter}
                      onChange={e => setTypeFilter(e.target.value as "All" | ArticleType)}
                      className="px-4 py-3 border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-white"
                      style={{ borderColor: THEME.border }}
                    >
                      <option value="All">All Types</option>
                      <option value="permit">Permits</option>
                      <option value="enforcement">Enforcement</option>
                      <option value="policy">Policy</option>
                      <option value="hunting">Hunting Access</option>
                      <option value="development">Development</option>
                      <option value="conservation">Conservation</option>
                    </select>

                    <select
                      value={locationFilter}
                      onChange={e => setLocationFilter(e.target.value)}
                      className="px-4 py-3 border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-white"
                      style={{ borderColor: THEME.border }}
                    >
                      {locations.map(loc => (
                        <option key={loc} value={loc}>
                          {loc === "All" ? "All Locations" : loc}
                        </option>
                      ))}
                    </select>

                    <select
                      value={impactFilter}
                      onChange={e => setImpactFilter(e.target.value as "All" | Impact)}
                      className="px-4 py-3 border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-white"
                      style={{ borderColor: THEME.border }}
                    >
                      <option value="All">All Impact Levels</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                )}
              </div>
            </header>

            {/* Loading State */}
            {loading && (
              <div
                className="mt-10 text-center py-24 rounded-3xl"
                style={{
                  backgroundColor: THEME.surfaceStrong,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mb-4" style={{ borderColor: THEME.texasBlue, borderTopColor: "transparent" }}></div>
                <div className="font-light text-2xl mb-2" style={{ color: THEME.ink }}>
                  Loading Intelligence Feed
                </div>
                <div className="text-sm" style={{ color: THEME.inkMuted }}>
                  Aggregating from TCEQ, TPWD, Texas Tribune, and more...
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div
                className="mt-10 p-10 rounded-3xl text-center"
                style={{
                  backgroundColor: THEME.surfaceStrong,
                  border: `2px solid rgba(191, 10, 48, 0.20)`,
                }}
              >
                <div className="text-6xl mb-4">⚠️</div>
                <div className="font-light text-xl mb-2" style={{ color: THEME.ink }}>
                  Updates Currently Unavailable
                </div>
                <div className="text-sm" style={{ color: THEME.inkMuted }}>
                  {error}
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-6 px-6 py-3 rounded-full font-semibold text-white transition-all hover:shadow-lg"
                  style={{ backgroundColor: THEME.texasBlue }}
                >
                  Refresh Page
                </button>
              </div>
            )}

            {/* No Results */}
            {!loading && !error && filtered.length === 0 && (
              <div
                className="mt-10 text-center py-24 rounded-3xl"
                style={{
                  backgroundColor: THEME.surfaceStrong,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <div className="text-5xl mb-4">🔍</div>
                <div className="font-light text-2xl mb-2" style={{ color: THEME.ink }}>
                  No Updates Match Your Filters
                </div>
                <div className="text-sm" style={{ color: THEME.inkMuted }}>
                  Try adjusting your search criteria
                </div>
              </div>
            )}

            {/* Main Content */}
            {!loading && !error && filtered.length > 0 && (
              <>
                {/* High Impact Alerts Bar */}
                {highImpactItems.length > 0 && (
                  <div
                    className="mt-8 p-5 rounded-2xl"
                    style={{
                      backgroundColor: "rgba(217, 119, 6, 0.08)",
                      border: `2px solid rgba(217, 119, 6, 0.25)`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">⚡</span>
                      <span className="text-xs font-bold tracking-wider uppercase" style={{ color: "#D97706" }}>
                        {highImpactItems.length} High Impact {highImpactItems.length === 1 ? "Update" : "Updates"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {highImpactItems.map(item => (
                        <a
                          key={item.id}
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-sm font-medium hover:underline"
                          style={{ color: THEME.ink }}
                        >
                          → {item.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-10 grid lg:grid-cols-[1.8fr_1fr] gap-8">
                  {/* LEFT COLUMN */}
                  <div className="space-y-8">
                    {/* Lead Story */}
                    {lead && <LeadStory item={lead} />}

                    {/* Featured Stories */}
                    {featured.length > 0 && (
                      <section
                        className="rounded-3xl p-8 shadow-lg"
                        style={{
                          backgroundColor: THEME.surfaceStrong,
                          border: `1px solid ${THEME.border}`,
                        }}
                      >
                        <SectionHeader title="Featured Intelligence" count={featured.length} />
                        
                        <div className="grid sm:grid-cols-2 gap-5 mt-6">
                          {featured.map(item => (
                            <FeaturedCard key={item.id} item={item} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Headlines */}
                    {headlines.length > 0 && (
                      <section
                        className="rounded-3xl p-8 shadow-lg"
                        style={{
                          backgroundColor: THEME.surfaceStrong,
                          border: `1px solid ${THEME.border}`,
                        }}
                      >
                        <SectionHeader title="Latest Headlines" count={headlines.length} />
                        
                        <div className="space-y-4 mt-6">
                          {headlines.map((item, idx) => (
                            <HeadlineItem key={item.id} item={item} index={idx + 1} />
                          ))}
                        </div>
                      </section>
                    )}
                  </div>

                  {/* RIGHT COLUMN */}
                  <aside className="space-y-8">
                    {/* Upcoming Deadlines */}
                    {upcomingDeadlines.length > 0 && (
                      <section
                        className="rounded-3xl p-8 shadow-lg"
                        style={{
                          backgroundColor: THEME.surfaceStrong,
                          border: `1px solid ${THEME.border}`,
                        }}
                      >
                        <SectionHeader title="Upcoming Deadlines" icon="📅" count={upcomingDeadlines.length} />
                        
                        <div className="space-y-3 mt-6">
                          {upcomingDeadlines.map(item => (
                            <DeadlineCard key={item.id} item={item} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Quick Briefs */}
                    {briefs.length > 0 && (
                      <section
                        className="rounded-3xl p-8 shadow-lg"
                        style={{
                          backgroundColor: THEME.surfaceStrong,
                          border: `1px solid ${THEME.border}`,
                        }}
                      >
                        <SectionHeader title="Quick Briefs" count={briefs.length} />
                        
                        <div className="space-y-3 mt-6">
                          {briefs.map((item, idx) => (
                            <BriefItem key={item.id} item={item} index={idx + 1} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* About */}
                    <section
                      className="rounded-3xl p-8 shadow-lg"
                      style={{
                        backgroundColor: THEME.surface,
                        border: `1px solid ${THEME.border}`,
                      }}
                    >
                      <h3
                        className="text-2xl font-light mb-4"
                        style={{
                          color: THEME.ink,
                          fontFamily: "ui-serif, Georgia, Cambria, Times",
                        }}
                      >
                        Intelligence Sources
                      </h3>
                      
                      <p className="text-sm leading-relaxed mb-4" style={{ color: THEME.inkMuted }}>
                        Aggregating breaking developments from TCEQ, Texas Parks & Wildlife, Texas Tribune, 
                        Austin Monitor, regional newspapers, and official state channels.
                      </p>

                      <div className="pt-4 border-t" style={{ borderColor: THEME.border }}>
                        <div className="text-xs uppercase tracking-wider mb-2" style={{ color: THEME.inkMuted }}>
                          Coverage Areas
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {["Permits", "Enforcement", "Land Access", "Conservation", "Development", "Policy"].map(tag => (
                            <span
                              key={tag}
                              className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider"
                              style={{
                                backgroundColor: "rgba(0, 40, 104, 0.08)",
                                color: THEME.texasBlue,
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </section>
                  </aside>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </SiteShell>
  );
}

// Component: Section Header
function SectionHeader({ title, icon, count }: { title: string; icon?: string; count?: number }) {
  return (
    <div className="flex items-end justify-between gap-4 pb-4 border-b" style={{ borderColor: THEME.border }}>
      <h3
        className="text-2xl font-light flex items-center gap-2"
        style={{
          color: THEME.ink,
          fontFamily: "ui-serif, Georgia, Cambria, Times",
        }}
      >
        {icon && <span>{icon}</span>}
        {title}
      </h3>
      {count !== undefined && (
        <div className="text-xs uppercase tracking-wider" style={{ color: THEME.inkMuted }}>
          {count} {count === 1 ? "item" : "items"}
        </div>
      )}
    </div>
  );
}

// Component: Lead Story
function LeadStory({ item }: { item: FeedItem }) {
  const impactConfig = item.impact ? IMPACT_CONFIG[item.impact] : null;
  
  return (
    <article
      className="rounded-3xl p-10 shadow-2xl"
      style={{
        backgroundColor: THEME.surfaceStrong,
        border: `1px solid ${THEME.border}`,
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold tracking-[0.28em] uppercase" style={{ color: THEME.texasBlue }}>
          🌟 LEAD STORY
        </span>
        {impactConfig && (
          <span
            className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider"
            style={{
              backgroundColor: impactConfig.bg,
              color: impactConfig.color,
              border: `1px solid ${impactConfig.color}40`,
            }}
          >
            {impactConfig.label}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {item.category && <Badge text={item.category} color={THEME.texasBlue} />}
        {item.location && <Badge text={`📍 ${item.location}`} color={THEME.lonestarGold} />}
        {item.type && <Badge text={item.type} color={THEME.sage} />}
      </div>

      <h2
        className="text-4xl lg:text-5xl font-light leading-tight mb-5"
        style={{
          color: THEME.ink,
          fontFamily: "ui-serif, Georgia, Cambria, Times",
        }}
      >
        <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
          {item.title}
        </a>
      </h2>

      {item.summary && (
        <p
          className="text-lg leading-relaxed border-l-4 pl-6 mb-6"
          style={{ borderColor: THEME.texasBlue, color: THEME.inkMuted }}
        >
          {item.summary}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-wider" style={{ color: THEME.inkMuted }}>
        <span className="font-bold" style={{ color: THEME.ink }}>{item.source}</span>
        <span>•</span>
        <span>{formatDate(item.publishedAt)}</span>
        {item.deadline && (
          <>
            <span>•</span>
            <span style={{ color: THEME.texasRed }}>Deadline: {formatDate(item.deadline)}</span>
          </>
        )}
      </div>

      {item.tags && item.tags.length > 0 && (
        <div className="mt-6 pt-6 border-t flex flex-wrap gap-2" style={{ borderColor: THEME.border }}>
          {item.tags.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider"
              style={{
                backgroundColor: "rgba(0, 40, 104, 0.06)",
                color: THEME.texasBlue,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

// Component: Featured Card
function FeaturedCard({ item }: { item: FeedItem }) {
  const impactConfig = item.impact ? IMPACT_CONFIG[item.impact] : null;
  
  return (
    <article
      className="p-6 rounded-2xl transition-all hover:shadow-lg"
      style={{
        backgroundColor: "white",
        border: `1px solid ${THEME.border}`,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          {item.category && <Badge text={item.category} color={THEME.texasBlue} small />}
          {item.location && <Badge text={item.location} color={THEME.lonestarGold} small />}
        </div>
        {impactConfig && (
          <span
            className="px-2 py-1 rounded text-[9px] font-bold tracking-wider shrink-0"
            style={{
              backgroundColor: impactConfig.bg,
              color: impactConfig.color,
            }}
          >
            {impactConfig.label}
          </span>
        )}
      </div>

      <h4
        className="text-lg font-light leading-snug mb-3"
        style={{
          color: THEME.ink,
          fontFamily: "ui-serif, Georgia, Cambria, Times",
        }}
      >
        <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
          {item.title}
        </a>
      </h4>

      {item.summary && (
        <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: THEME.inkMuted }}>
          {item.summary}
        </p>
      )}

      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider" style={{ color: THEME.inkMuted }}>
        <span className="font-bold" style={{ color: THEME.ink }}>{item.source}</span>
        <span>•</span>
        <span>{formatDate(item.publishedAt)}</span>
      </div>
    </article>
  );
}

// Component: Headline Item
function HeadlineItem({ item, index }: { item: FeedItem; index: number }) {
  return (
    <article
      className="pb-4 border-b last:border-b-0 last:pb-0"
      style={{ borderColor: THEME.border }}
    >
      <div className="flex gap-4">
        <div
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor: "rgba(0, 40, 104, 0.08)",
            color: THEME.texasBlue,
          }}
        >
          {index}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2 mb-2">
            {item.category && <Badge text={item.category} color={THEME.texasBlue} small />}
            {item.location && <Badge text={item.location} color={THEME.lonestarGold} small />}
            {item.impact && (
              <span
                className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider"
                style={{
                  backgroundColor: IMPACT_CONFIG[item.impact].bg,
                  color: IMPACT_CONFIG[item.impact].color,
                }}
              >
                {IMPACT_CONFIG[item.impact].label}
              </span>
            )}
          </div>

          <h4
            className="text-base font-light leading-snug mb-2"
            style={{
              color: THEME.ink,
              fontFamily: "ui-serif, Georgia, Cambria, Times",
            }}
          >
            <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
              {item.title}
            </a>
          </h4>

          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider" style={{ color: THEME.inkMuted }}>
            <span className="font-bold" style={{ color: THEME.ink }}>{item.source}</span>
            <span>•</span>
            <span>{formatDate(item.publishedAt)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

// Component: Brief Item
function BriefItem({ item, index }: { item: FeedItem; index: number }) {
  return (
    <article className="flex gap-3">
      <div
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{
          backgroundColor: "rgba(0, 40, 104, 0.08)",
          color: THEME.texasBlue,
        }}
      >
        {index}
      </div>

      <div className="min-w-0">
        {item.category && (
          <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: THEME.inkMuted }}>
            {item.category}
          </div>
        )}

        <div className="text-sm leading-snug mb-1" style={{ color: THEME.ink }}>
          <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
            {item.title}
          </a>
        </div>

        <div className="text-[10px] uppercase tracking-wider" style={{ color: THEME.inkMuted }}>
          <span className="font-bold" style={{ color: THEME.ink }}>{item.source}</span>
          <span> • {formatDate(item.publishedAt)}</span>
        </div>
      </div>
    </article>
  );
}

// Component: Deadline Card
function DeadlineCard({ item }: { item: FeedItem }) {
  return (
    <article
      className="p-4 rounded-xl transition-all hover:shadow-md"
      style={{
        backgroundColor: "white",
        border: `1px solid ${THEME.border}`,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          {item.category && (
            <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: THEME.inkMuted }}>
              {item.category}
            </div>
          )}

          <div className="text-sm leading-snug" style={{ color: THEME.ink }}>
            <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
              {item.title}
            </a>
          </div>
        </div>

        {item.deadline && (
          <div
            className="shrink-0 px-2 py-1 rounded text-[9px] font-bold tracking-wider"
            style={{
              backgroundColor: "rgba(191, 10, 48, 0.08)",
              color: THEME.texasRed,
              border: `1px solid rgba(191, 10, 48, 0.20)`,
            }}
          >
            {formatDate(item.deadline)}
          </div>
        )}
      </div>

      <div className="text-[10px] uppercase tracking-wider" style={{ color: THEME.inkMuted }}>
        <span className="font-bold" style={{ color: THEME.ink }}>{item.source}</span>
      </div>
    </article>
  );
}

// Component: Badge
function Badge({ text, color, small }: { text: string; color: string; small?: boolean }) {
  return (
    <span
      className={`${small ? "px-2 py-0.5 text-[9px]" : "px-3 py-1 text-[10px]"} font-bold tracking-wider uppercase rounded-full`}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      {text}
    </span>
  );
}
