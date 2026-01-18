"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "../SiteShell";

type Impact = "high" | "medium" | "low";

type FeedItem = {
  title: string;
  link: string;
  source: string;
  publishedAt?: string;
  summary?: string;
  category?: string;
  impact?: Impact;
  deadline?: string;
  location?: string;
};

const THEME = {
  bg: "#F6F7F8",
  surface: "rgba(255,255,255,0.62)",
  surfaceStrong: "rgba(255,255,255,0.75)",
  border: "rgba(20, 35, 55, 0.14)",
  ink: "#142337",

  texasBlue: "#002868", // Texas flag blue
  texasRed: "#BF0A30", // Texas flag red
  lonestarGold: "#C5A572",
  
  washedGreen: "#4F7A6A",
  washedGreenDark: "#3E6357",

  sunset: "#E07A5F",
};

const IMPACT_WEIGHT: Record<Impact, number> = { high: 3, medium: 2, low: 1 };
const RECENCY_DAYS_FOR_HOME = 90;

function toTime(iso?: string) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function primaryTime(item: FeedItem) {
  return Math.max(toTime(item.publishedAt), toTime(item.deadline));
}

function sortScore(item: FeedItem) {
  const recency = primaryTime(item);
  const impact = item.impact ? IMPACT_WEIGHT[item.impact] : 0;
  return recency * 10 + impact;
}

function formatEditionDate(d = new Date()) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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
        const data = (await res.json()) as { items: FeedItem[] };

        if (!alive) return;
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e: any) {
        if (!alive) return;
        if (e?.name === "AbortError") {
          setError("Updates are taking longer than expected. Please refresh in a moment.");
        } else {
          setError(e?.message || "Failed to load updates.");
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
    return ["All", ...Array.from(cats)];
  }, [items]);

  const locations = useMemo(() => {
    const locs = new Set(items.map((i) => i.location).filter(Boolean) as string[]);
    return ["All", ...Array.from(locs)];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const userIsRefining =
      q.length > 0 || categoryFilter !== "All" || impactFilter !== "All" || locationFilter !== "All";

    const cutoff = Date.now() - RECENCY_DAYS_FOR_HOME * 24 * 60 * 60 * 1000;

    const base = items.filter((it) => {
      const t = primaryTime(it);
      const withinWindow = t === 0 ? true : t >= cutoff;
      if (!userIsRefining && !withinWindow) return false;

      const categoryOk = categoryFilter === "All" ? true : it.category === categoryFilter;
      const impactOk = impactFilter === "All" ? true : it.impact === impactFilter;
      const locationOk = locationFilter === "All" ? true : it.location === locationFilter;

      const queryOk = q
        ? (it.title || "").toLowerCase().includes(q) ||
          (it.source || "").toLowerCase().includes(q) ||
          (it.summary || "").toLowerCase().includes(q) ||
          (it.category || "").toLowerCase().includes(q) ||
          (it.location || "").toLowerCase().includes(q)
        : true;

      return categoryOk && impactOk && locationOk && queryOk;
    });

    return base.sort((a, b) => sortScore(b) - sortScore(a));
  }, [items, query, categoryFilter, impactFilter, locationFilter]);

  const now = Date.now();

  const lead = filtered[0] ? filtered[0] : null;
  const topStories = filtered.slice(1, 7);
  const briefs = filtered.slice(7, 17);

  const keyDates = useMemo(() => {
    return filtered
      .filter((i) => i.deadline && toTime(i.deadline) >= now - 24 * 60 * 60 * 1000)
      .sort((a, b) => toTime(a.deadline) - toTime(b.deadline))
      .slice(0, 6);
  }, [filtered, now]);

  return (
    <SiteShell>
      <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: THEME.bg }}>
        {/* Texas-themed background wash */}
        <div
          className="fixed inset-0 z-0"
          style={{
            opacity: 0.45,
            backgroundImage: `
              radial-gradient(circle at 20% 35%, rgba(0, 40, 104, 0.12) 0%, transparent 55%),
              radial-gradient(circle at 80% 70%, rgba(197, 165, 114, 0.10) 0%, transparent 58%),
              radial-gradient(circle at 45% 15%, rgba(191, 10, 48, 0.06) 0%, transparent 50%)
            `,
          }}
        />

        {/* Contour lines - land survey aesthetic */}
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.30 }}>
          <svg className="w-full h-full" viewBox="0 0 1400 900" preserveAspectRatio="none" aria-hidden="true">
            {Array.from({ length: 11 }).map((_, i) => {
              const y = 100 + i * 75;
              const o = 0.09 - i * 0.006;
              return (
                <path
                  key={i}
                  d={`M0 ${y}
                      C 240 ${y - 22}, 480 ${y + 15}, 720 ${y - 10}
                      C 960 ${y - 28}, 1200 ${y + 20}, 1400 ${y - 8}`}
                  fill="none"
                  stroke={`rgba(0, 40, 104, ${Math.max(o, 0.02)})`}
                  strokeWidth="1.2"
                />
              );
            })}
          </svg>
        </div>

        <section className="relative z-10 px-6 lg:px-10 pt-10 pb-14">
          <div className="max-w-[1200px] mx-auto">
            {/* Masthead - Texas Edition */}
            <header
              className="rounded-3xl p-7 md:p-10"
              style={{
                backgroundColor: THEME.surface,
                border: `1px solid ${THEME.border}`,
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div className="min-w-0">
                    <div
                      className="text-[11px] md:text-xs tracking-[0.30em] uppercase font-bold"
                      style={{ color: THEME.texasBlue }}
                    >
                      🇨🇱 The Lone Star Report
                    </div>

                    <h1
                      className="mt-2 text-4xl md:text-6xl font-light tracking-tight"
                      style={{
                        color: THEME.ink,
                        fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
                      }}
                    >
                      Texas Environmental Intel
                    </h1>

                    <div
                      className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.22em]"
                      style={{ color: "rgba(20, 35, 55, 0.58)" }}
                    >
                      <span>Daily Briefing</span>
                      <span>•</span>
                      <span>{formatEditionDate()}</span>
                      <span>•</span>
                      <span>
                        Updated {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>

                    <p
                      className="mt-4 text-sm md:text-base font-light max-w-3xl leading-relaxed"
                      style={{ color: "rgba(20, 35, 55, 0.70)" }}
                    >
                      Land development, construction permits, hunting access, conservation—Texas news that moves dirt
                      and opens gates.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowFilters((v) => !v)}
                      className="px-4 py-2 rounded-full border text-sm font-medium bg-white/60 hover:bg-white/70 transition"
                      style={{ borderColor: THEME.border, color: THEME.texasBlue }}
                    >
                      {showFilters ? "Close" : "Filter"}
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_180px_180px] gap-3">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search permits, land, hunting, construction…"
                      className="px-4 py-3 border text-sm focus:outline-none rounded-2xl bg-white/70"
                      style={{ borderColor: THEME.border }}
                    />

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-4 py-3 border text-sm focus:outline-none rounded-2xl bg-white/70"
                      style={{ borderColor: THEME.border }}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="px-4 py-3 border text-sm focus:outline-none rounded-2xl bg-white/70"
                      style={{ borderColor: THEME.border }}
                    >
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>

                    <select
                      value={impactFilter}
                      onChange={(e) => setImpactFilter(e.target.value as any)}
                      className="px-4 py-3 border text-sm focus:outline-none rounded-2xl bg-white/70"
                      style={{ borderColor: THEME.border }}
                    >
                      <option value="All">All impact</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>

                    <div className="md:col-span-4 text-[11px]" style={{ color: "rgba(20, 35, 55, 0.55)" }}>
                      Covering the last {RECENCY_DAYS_FOR_HOME} days. Use search to expand the archive.
                    </div>
                  </div>
                )}
              </div>
            </header>

            {/* Body */}
            <div className="mt-10">
              {error && (
                <div
                  className="p-6 rounded-3xl"
                  style={{
                    backgroundColor: THEME.surfaceStrong,
                    border: `1px solid ${THEME.border}`,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="text-center">
                    <div className="font-light text-lg" style={{ color: THEME.ink }}>
                      Updates unavailable
                    </div>
                    <div className="text-sm mt-1" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
                      {error}
                    </div>
                  </div>
                </div>
              )}

              {loading && !error && (
                <div
                  className="text-center py-16 rounded-3xl"
                  style={{
                    backgroundColor: THEME.surfaceStrong,
                    border: `1px solid ${THEME.border}`,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="font-light text-xl" style={{ color: THEME.ink }}>
                    Gathering Texas intel…
                  </div>
                  <div className="text-sm mt-2" style={{ color: "rgba(20, 35, 55, 0.68)" }}>
                    TCEQ • TPWD • Texas Tribune • Austin Monitor
                  </div>
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div
                  className="text-center py-16 rounded-3xl"
                  style={{
                    backgroundColor: THEME.surfaceStrong,
                    border: `1px solid ${THEME.border}`,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="font-light text-lg" style={{ color: THEME.ink }}>
                    No items match your search.
                  </div>
                </div>
              )}

              {!loading && !error && filtered.length > 0 && (
                <div className="grid lg:grid-cols-[1.65fr_1fr] gap-6">
                  {/* LEFT COLUMN: Lead + Top Stories */}
                  <div className="space-y-6">
                    {/* Lead story */}
                    {lead && (
                      <section
                        className="p-8 md:p-10 rounded-3xl"
                        style={{
                          backgroundColor: THEME.surfaceStrong,
                          border: `1px solid ${THEME.border}`,
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        <div
                          className="flex items-center justify-between gap-4 border-b pb-4 mb-6"
                          style={{ borderColor: THEME.border }}
                        >
                          <div
                            className="text-[11px] uppercase tracking-[0.26em] font-bold"
                            style={{ color: THEME.texasBlue }}
                          >
                            🌟 Lead Story
                          </div>

                          <div
                            className="text-[11px] uppercase tracking-[0.18em]"
                            style={{ color: "rgba(20, 35, 55, 0.55)" }}
                          >
                            Latest first
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {lead.category && (
                            <span
                              className="text-[10px] font-bold tracking-[0.22em] uppercase px-3 py-1 rounded-full"
                              style={{
                                color: THEME.texasBlue,
                                backgroundColor: "rgba(0, 40, 104, 0.08)",
                                border: `1px solid rgba(0, 40, 104, 0.20)`,
                              }}
                            >
                              {lead.category}
                            </span>
                          )}
                          {lead.location && (
                            <span
                              className="text-[10px] font-bold tracking-[0.22em] uppercase px-3 py-1 rounded-full"
                              style={{
                                color: THEME.lonestarGold,
                                backgroundColor: "rgba(197, 165, 114, 0.10)",
                                border: `1px solid rgba(197, 165, 114, 0.25)`,
                              }}
                            >
                              📍 {lead.location}
                            </span>
                          )}
                        </div>

                        <h2
                          className="text-3xl md:text-5xl font-light leading-tight"
                          style={{
                            color: THEME.ink,
                            fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
                          }}
                        >
                          <a href={lead.link} target="_blank" rel="noreferrer" className="hover:underline">
                            {lead.title}
                          </a>
                        </h2>

                        <div
                          className="mt-4 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-wide"
                          style={{ color: "rgba(20, 35, 55, 0.62)" }}
                        >
                          <span className="font-bold" style={{ color: THEME.ink }}>
                            {lead.source}
                          </span>
                          {(lead.publishedAt || lead.deadline) && (
                            <span>• {formatDate(lead.publishedAt || lead.deadline || "")}</span>
                          )}
                          {lead.impact && (
                            <span
                              className="px-2 py-0.5 rounded"
                              style={{
                                backgroundColor:
                                  lead.impact === "high"
                                    ? "rgba(191, 10, 48, 0.12)"
                                    : "rgba(197, 165, 114, 0.12)",
                                color: lead.impact === "high" ? THEME.texasRed : THEME.lonestarGold,
                              }}
                            >
                              {lead.impact.toUpperCase()}
                            </span>
                          )}
                        </div>

                        {lead.summary && (
                          <p
                            className="mt-6 text-base md:text-lg leading-relaxed border-l-4 pl-6"
                            style={{ borderColor: THEME.texasBlue, color: "rgba(20, 35, 55, 0.78)" }}
                          >
                            {lead.summary}
                          </p>
                        )}

                        <div className="mt-7 pt-5 border-t" style={{ borderColor: THEME.border }}>
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div
                                className="text-[10px] uppercase tracking-[0.22em]"
                                style={{ color: "rgba(20,35,55,0.55)" }}
                              >
                                Category
                              </div>
                              <div className="mt-1" style={{ color: THEME.ink }}>
                                {lead.category || "General"}
                              </div>
                            </div>

                            <div>
                              <div
                                className="text-[10px] uppercase tracking-[0.22em]"
                                style={{ color: "rgba(20,35,55,0.55)" }}
                              >
                                Location
                              </div>
                              <div className="mt-1" style={{ color: THEME.ink }}>
                                {lead.location || "Statewide"}
                              </div>
                            </div>

                            <div>
                              <div
                                className="text-[10px] uppercase tracking-[0.22em]"
                                style={{ color: "rgba(20,35,55,0.55)" }}
                              >
                                Filed
                              </div>
                              <div className="mt-1" style={{ color: THEME.ink }}>
                                {lead.publishedAt || lead.deadline
                                  ? formatDate(lead.publishedAt || lead.deadline || "")
                                  : "—"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Top stories */}
                    {topStories.length > 0 && (
                      <section
                        className="rounded-3xl p-7 md:p-8"
                        style={{
                          backgroundColor: THEME.surfaceStrong,
                          border: `1px solid ${THEME.border}`,
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        <div
                          className="flex items-end justify-between gap-4 border-b pb-4 mb-6"
                          style={{ borderColor: THEME.border }}
                        >
                          <h3
                            className="text-xl md:text-2xl font-light"
                            style={{
                              color: THEME.ink,
                              fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
                            }}
                          >
                            Texas Headlines
                          </h3>

                          <div
                            className="text-[11px] uppercase tracking-[0.18em]"
                            style={{ color: "rgba(20, 35, 55, 0.55)" }}
                          >
                            {topStories.length} stories
                          </div>
                        </div>

                        <div className="space-y-5">
                          {topStories.map((item, idx) => (
                            <article
                              key={item.link}
                              className="pb-5 border-b last:border-b-0 last:pb-0"
                              style={{ borderColor: THEME.border }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <div
                                      className="text-[10px] uppercase tracking-[0.22em]"
                                      style={{ color: "rgba(20,35,55,0.55)" }}
                                    >
                                      {String(idx + 1).padStart(2, "0")}
                                    </div>
                                    {item.category && (
                                      <span
                                        className="text-[9px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded-full"
                                        style={{
                                          color: THEME.texasBlue,
                                          backgroundColor: "rgba(0, 40, 104, 0.08)",
                                        }}
                                      >
                                        {item.category}
                                      </span>
                                    )}
                                    {item.location && (
                                      <span
                                        className="text-[9px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded-full"
                                        style={{
                                          color: THEME.lonestarGold,
                                          backgroundColor: "rgba(197, 165, 114, 0.10)",
                                        }}
                                      >
                                        {item.location}
                                      </span>
                                    )}
                                  </div>

                                  <h4
                                    className="text-lg md:text-xl font-light leading-snug"
                                    style={{
                                      color: THEME.ink,
                                      fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
                                    }}
                                  >
                                    <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                                      {item.title}
                                    </a>
                                  </h4>

                                  {item.summary && (
                                    <p
                                      className="mt-2 text-sm leading-relaxed line-clamp-2"
                                      style={{ color: "rgba(20,35,55,0.78)" }}
                                    >
                                      {item.summary}
                                    </p>
                                  )}

                                  <div
                                    className="mt-2 flex flex-wrap gap-3 text-[10px] uppercase tracking-wide"
                                    style={{ color: "rgba(20,35,55,0.62)" }}
                                  >
                                    <span className="font-bold" style={{ color: THEME.ink }}>
                                      {item.source}
                                    </span>
                                    {(item.publishedAt || item.deadline) && (
                                      <span>• {formatDate(item.publishedAt || item.deadline || "")}</span>
                                    )}
                                  </div>
                                </div>

                                {item.impact === "high" && (
                                  <span
                                    className="shrink-0 px-3 py-1 text-[10px] uppercase rounded-full border font-bold"
                                    style={{
                                      borderColor: "rgba(191, 10, 48, 0.30)",
                                      color: THEME.texasRed,
                                      backgroundColor: "rgba(191, 10, 48, 0.08)",
                                    }}
                                  >
                                    Major
                                  </span>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>

                  {/* RIGHT COLUMN: Quick Hits + Upcoming */}
                  <aside className="space-y-6">
                    {/* Quick Hits */}
                    <section
                      className="rounded-3xl p-7 md:p-8"
                      style={{
                        backgroundColor: THEME.surfaceStrong,
                        border: `1px solid ${THEME.border}`,
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <div
                        className="flex items-end justify-between gap-4 border-b pb-4 mb-6"
                        style={{ borderColor: THEME.border }}
                      >
                        <h3
                          className="text-xl md:text-2xl font-light"
                          style={{
                            color: THEME.ink,
                            fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
                          }}
                        >
                          Quick Hits
                        </h3>
                        <div className="text-[11px]" style={{ color: "rgba(20, 35, 55, 0.62)" }}>
                          Brief updates
                        </div>
                      </div>

                      {briefs.length === 0 ? (
                        <div className="text-sm" style={{ color: "rgba(20,35,55,0.70)" }}>
                          No additional items yet.
                        </div>
                      ) : (
                        <ol className="space-y-4">
                          {briefs.map((item, idx) => (
                            <li key={item.link} className="flex gap-3">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] border font-bold"
                                style={{
                                  borderColor: THEME.border,
                                  color: THEME.texasBlue,
                                  backgroundColor: "rgba(0, 40, 104, 0.05)",
                                }}
                              >
                                {idx + 1}
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {item.category && (
                                    <span
                                      className="text-[9px] uppercase tracking-[0.18em]"
                                      style={{ color: "rgba(20,35,55,0.55)" }}
                                    >
                                      {item.category}
                                    </span>
                                  )}
                                  {item.location && (
                                    <span
                                      className="text-[9px] uppercase tracking-[0.18em]"
                                      style={{ color: THEME.lonestarGold }}
                                    >
                                      • {item.location}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-1 text-sm leading-snug" style={{ color: THEME.ink }}>
                                  <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                                    {item.title}
                                  </a>
                                </div>

                                <div
                                  className="mt-1 text-[10px] uppercase tracking-wide"
                                  style={{ color: "rgba(20,35,55,0.62)" }}
                                >
                                  <span className="font-bold" style={{ color: THEME.ink }}>
                                    {item.source}
                                  </span>
                                  {(item.publishedAt || item.deadline) && (
                                    <span> • {formatDate(item.publishedAt || item.deadline || "")}</span>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                    </section>

                    {/* Key Dates */}
                    {keyDates.length > 0 && (
                      <section
                        className="rounded-3xl p-7 md:p-8"
                        style={{
                          backgroundColor: THEME.surfaceStrong,
                          border: `1px solid ${THEME.border}`,
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        <div
                          className="flex items-end justify-between gap-4 border-b pb-4 mb-6"
                          style={{ borderColor: THEME.border }}
                        >
                          <h3
                            className="text-xl md:text-2xl font-light"
                            style={{
                              color: THEME.ink,
                              fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
                            }}
                          >
                            Upcoming
                          </h3>
                          <div className="text-[11px]" style={{ color: "rgba(20, 35, 55, 0.62)" }}>
                            Deadlines
                          </div>
                        </div>

                        <div className="space-y-4">
                          {keyDates.map((item) => (
                            <article
                              key={item.link}
                              className="p-5 rounded-2xl"
                              style={{
                                backgroundColor: "rgba(255,255,255,0.80)",
                                border: `1px solid ${THEME.border}`,
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap gap-2 mb-1">
                                    {item.category && (
                                      <span
                                        className="text-[9px] font-bold tracking-[0.18em] uppercase"
                                        style={{ color: THEME.texasBlue }}
                                      >
                                        {item.category}
                                      </span>
                                    )}
                                    {item.location && (
                                      <span
                                        className="text-[9px] font-bold tracking-[0.18em] uppercase"
                                        style={{ color: THEME.lonestarGold }}
                                      >
                                        • {item.location}
                                      </span>
                                    )}
                                  </div>

                                  <div
                                    className="mt-1 text-sm leading-snug"
                                    style={{
                                      color: THEME.ink,
                                      fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
                                    }}
                                  >
                                    <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                                      {item.title}
                                    </a>
                                  </div>

                                  <div
                                    className="mt-2 text-[10px] uppercase tracking-wide"
                                    style={{ color: "rgba(20,35,55,0.62)" }}
                                  >
                                    <span className="font-bold" style={{ color: THEME.ink }}>
                                      {item.source}
                                    </span>
                                    {item.deadline && <span> • Due {formatDate(item.deadline)}</span>}
                                  </div>
                                </div>

                                {item.deadline && (
                                  <div
                                    className="shrink-0 px-3 py-2 text-[10px] uppercase rounded-full w-fit border font-bold"
                                    style={{
                                      borderColor: "rgba(191, 10, 48, 0.30)",
                                      color: THEME.texasRed,
                                      backgroundColor: "rgba(191, 10, 48, 0.08)",
                                    }}
                                  >
                                    {formatDate(item.deadline)}
                                  </div>
                                )}
                              </div>

                              {item.summary && (
                                <p
                                  className="mt-3 text-xs leading-relaxed line-clamp-3"
                                  style={{ color: "rgba(20, 35, 55, 0.78)" }}
                                >
                                  {item.summary}
                                </p>
                              )}
                            </article>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Texas Pride Box */}
                    <section
                      className="rounded-3xl p-7 md:p-8"
                      style={{
                        backgroundColor: THEME.surface,
                        border: `1px solid ${THEME.border}`,
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <div
                        className="flex items-end justify-between gap-4 border-b pb-4 mb-5"
                        style={{ borderColor: THEME.border }}
                      >
                        <h3
                          className="text-xl md:text-2xl font-light"
                          style={{
                            color: THEME.ink,
                            fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
                          }}
                        >
                          About This Feed
                        </h3>
                      </div>

                      <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
                        Tracking Texas environmental news that matters: land deals, construction permits, hunting
                        access, conservation easements, and development approvals.
                      </p>

                      <p className="text-sm leading-relaxed" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
                        Sources include TCEQ, Texas Parks & Wildlife, Texas Tribune, Austin Monitor, and major
                        metro newspapers.
                      </p>
                    </section>
                  </aside>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso)
      .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      .toUpperCase();
  } catch {
    return iso;
  }
}
