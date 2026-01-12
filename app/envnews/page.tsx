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
};

const THEME = {
  bg: "#F6F7F8",
  surface: "rgba(255,255,255,0.62)",
  surfaceStrong: "rgba(255,255,255,0.75)",
  border: "rgba(20, 35, 55, 0.14)",
  ink: "#142337",

  leviBlue: "#2F5D8C",
  leviBlueDark: "#234B74",
  washedBlue: "#6E93B5",

  washedGreen: "#4F7A6A",
  washedGreenDark: "#3E6357",

  sunset: "#E07A5F",
};

const IMPACT_WEIGHT: Record<Impact, number> = { high: 3, medium: 2, low: 1 };
const RECENCY_DAYS_FOR_HOME = 120; // keeps the "edition" fresh; archive can come later

function toTime(iso?: string) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function primaryTime(item: FeedItem) {
  // Prefer publishedAt; fallback to deadline. If neither parses, returns 0.
  return Math.max(toTime(item.publishedAt), toTime(item.deadline));
}

function sortScore(item: FeedItem) {
  const recency = primaryTime(item);
  const impact = item.impact ? IMPACT_WEIGHT[item.impact] : 0;
  // Recency dominates; impact breaks ties.
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

export default function EnvironmentalNews() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reading-first: keep filters, but tuck them behind “Refine”
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [impactFilter, setImpactFilter] = useState<"All" | Impact>("All");

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const timeout = setTimeout(() => controller.abort(), 12000);

        const res = await fetch("/api/updates", {
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const userIsRefining = q.length > 0 || categoryFilter !== "All" || impactFilter !== "All";

    const cutoff = Date.now() - RECENCY_DAYS_FOR_HOME * 24 * 60 * 60 * 1000;

    const base = items.filter((it) => {
      // Homepage edition stays fresh unless user is explicitly searching/filtering
      const t = primaryTime(it);
      const withinWindow = t === 0 ? true : t >= cutoff;
      if (!userIsRefining && !withinWindow) return false;

      const categoryOk = categoryFilter === "All" ? true : it.category === categoryFilter;
      const impactOk = impactFilter === "All" ? true : it.impact === impactFilter;

      const queryOk = q
        ? (it.title || "").toLowerCase().includes(q) ||
          (it.source || "").toLowerCase().includes(q) ||
          (it.summary || "").toLowerCase().includes(q) ||
          (it.category || "").toLowerCase().includes(q)
        : true;

      return categoryOk && impactOk && queryOk;
    });

    // Always: latest first, then “greatest”
    return base.sort((a, b) => sortScore(b) - sortScore(a));
  }, [items, query, categoryFilter, impactFilter]);

  const now = Date.now();

  const lead = filtered[0] ? filtered[0] : null;
  const topStories = filtered.slice(1, 7);
  const briefs = filtered.slice(7, 17);

  const keyDates = useMemo(() => {
    return filtered
      .filter((i) => i.deadline && toTime(i.deadline) >= now - 24 * 60 * 60 * 1000) // drop stale dates
      .sort((a, b) => toTime(a.deadline) - toTime(b.deadline))
      .slice(0, 6);
  }, [filtered, now]);

  return (
    <SiteShell>
      <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: THEME.bg }}>
        {/* Calm background wash (blue + green, very light) */}
        <div
          className="fixed inset-0 z-0"
          style={{
            opacity: 0.55,
            backgroundImage: `
              radial-gradient(circle at 18% 40%, rgba(47, 93, 140, 0.14) 0%, transparent 58%),
              radial-gradient(circle at 82% 78%, rgba(79, 122, 106, 0.12) 0%, transparent 60%),
              radial-gradient(circle at 55% 18%, rgba(224, 122, 95, 0.06) 0%, transparent 55%)
            `,
          }}
        />

        {/* Topographic lines (subtle) */}
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.35 }}>
          <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => {
              const y = 120 + i * 70;
              const o = 0.08 - i * 0.007;
              return (
                <path
                  key={i}
                  d={`M0 ${y}
                      C 200 ${y - 18}, 360 ${y + 12}, 520 ${y - 8}
                      C 700 ${y - 22}, 900 ${y + 18}, 1200 ${y - 6}`}
                  fill="none"
                  stroke={`rgba(20, 35, 55, ${Math.max(o, 0.02)})`}
                  strokeWidth="1.15"
                />
              );
            })}
          </svg>
        </div>

        <section className="relative z-10 px-6 lg:px-10 pt-10 pb-14">
          <div className="max-w-[1200px] mx-auto">
            {/* Masthead (newspaper-ish, no logo) */}
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
                      className="text-[11px] md:text-xs tracking-[0.28em] uppercase"
                      style={{ color: "rgba(79, 122, 106, 0.85)" }}
                    >
                      Environmental intelligence
                    </div>

                    <h1
                      className="mt-2 text-4xl md:text-6xl font-light tracking-tight"
                      style={{
                        color: THEME.ink,
                        fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
                      }}
                    >
                      Environmental Ledger
                    </h1>

                    <div
                      className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.22em]"
                      style={{ color: "rgba(20, 35, 55, 0.58)" }}
                    >
                      <span>Daily Brief</span>
                      <span>•</span>
                      <span>{formatEditionDate()}</span>
                      <span>•</span>
                      <span>
                        Updated{" "}
                        {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>

                    <p
                      className="mt-4 text-sm md:text-base font-light max-w-3xl leading-relaxed"
                      style={{ color: "rgba(20, 35, 55, 0.70)" }}
                    >
                      Official sources, edited into a front page. Latest first—context where it matters.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowFilters((v) => !v)}
                      className="px-4 py-2 rounded-full border text-sm bg-white/60 hover:bg-white/70 transition"
                      style={{ borderColor: THEME.border, color: THEME.ink }}
                    >
                      {showFilters ? "Close" : "Refine"}
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_180px] gap-3">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search the archive (rules, permits, enforcement, comment periods)…"
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

                    <div className="md:col-span-3 text-[11px]" style={{ color: "rgba(20, 35, 55, 0.55)" }}>
                      Tip: the front page prioritizes the last {RECENCY_DAYS_FOR_HOME} days. Searching expands beyond that.
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
                    Printing today’s edition…
                  </div>
                  <div className="text-sm mt-2" style={{ color: "rgba(20, 35, 55, 0.68)" }}>
                    EPA • TCEQ • USFWS • Federal Register
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
                  {/* LEFT COLUMN: Front page */}
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
                        <div className="flex items-center justify-between gap-4 border-b pb-4 mb-6" style={{ borderColor: THEME.border }}>
                          <div
                            className="text-[11px] uppercase tracking-[0.26em]"
                            style={{ color: "rgba(20, 35, 55, 0.55)" }}
                          >
                            Front Page
                          </div>

                          <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "rgba(20, 35, 55, 0.55)" }}>
                            Latest first
                          </div>
                        </div>

                        {lead.category && (
                          <div
                            className="text-[10px] font-bold tracking-[0.22em] uppercase mb-3"
                            style={{ color: "rgba(79, 122, 106, 0.85)" }}
                          >
                            {lead.category}
                          </div>
                        )}

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

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-wide"
                             style={{ color: "rgba(20, 35, 55, 0.62)" }}>
                          <span className="font-bold" style={{ color: THEME.ink }}>
                            {lead.source}
                          </span>
                          {(lead.publishedAt || lead.deadline) && (
                            <span>• {formatDate(lead.publishedAt || lead.deadline || "")}</span>
                          )}
                          {lead.impact && <span>• Impact: {lead.impact}</span>}
                        </div>

                        {lead.summary && (
                          <p
                            className="mt-6 text-base md:text-lg leading-relaxed border-l-4 pl-6"
                            style={{ borderColor: THEME.border, color: "rgba(20, 35, 55, 0.78)" }}
                          >
                            {lead.summary}
                          </p>
                        )}

                        {/* “Old man newspaper” rule */}
                        <div className="mt-7 pt-5 border-t" style={{ borderColor: THEME.border }}>
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "rgba(20,35,55,0.55)" }}>
                                Section
                              </div>
                              <div className="mt-1" style={{ color: THEME.ink }}>
                                {lead.category || "General"}
                              </div>
                            </div>

                            <div>
                              <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "rgba(20,35,55,0.55)" }}>
                                Source
                              </div>
                              <div className="mt-1" style={{ color: THEME.ink }}>
                                {lead.source}
                              </div>
                            </div>

                            <div>
                              <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "rgba(20,35,55,0.55)" }}>
                                Filed
                              </div>
                              <div className="mt-1" style={{ color: THEME.ink }}>
                                {(lead.publishedAt || lead.deadline) ? formatDate(lead.publishedAt || lead.deadline || "") : "—"}
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
                        <div className="flex items-end justify-between gap-4 border-b pb-4 mb-6" style={{ borderColor: THEME.border }}>
                          <h3
                            className="text-xl md:text-2xl font-light"
                            style={{
                              color: THEME.ink,
                              fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
                            }}
                          >
                            Top stories
                          </h3>

                          <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "rgba(20, 35, 55, 0.55)" }}>
                            {topStories.length} headlines
                          </div>
                        </div>

                        <div className="space-y-5">
                          {topStories.map((item, idx) => (
                            <article key={item.link} className="pb-5 border-b last:border-b-0 last:pb-0" style={{ borderColor: THEME.border }}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div
                                    className="text-[10px] uppercase tracking-[0.22em] mb-1"
                                    style={{ color: "rgba(20,35,55,0.55)" }}
                                  >
                                    {String(idx + 1).padStart(2, "0")} • {item.category || "General"}
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
                                    <p className="mt-2 text-sm leading-relaxed line-clamp-2" style={{ color: "rgba(20,35,55,0.78)" }}>
                                      {item.summary}
                                    </p>
                                  )}

                                  <div className="mt-2 flex flex-wrap gap-3 text-[10px] uppercase tracking-wide" style={{ color: "rgba(20,35,55,0.62)" }}>
                                    <span className="font-bold" style={{ color: THEME.ink }}>
                                      {item.source}
                                    </span>
                                    {(item.publishedAt || item.deadline) && (
                                      <span>• {formatDate(item.publishedAt || item.deadline || "")}</span>
                                    )}
                                    {item.impact && <span>• Impact: {item.impact}</span>}
                                  </div>
                                </div>

                                {item.impact === "high" && (
                                  <span
                                    className="shrink-0 px-3 py-1 text-[10px] uppercase rounded-full border"
                                    style={{
                                      borderColor: "rgba(224, 122, 95, 0.30)",
                                      color: "rgba(224, 122, 95, 0.95)",
                                      backgroundColor: "rgba(224, 122, 95, 0.08)",
                                    }}
                                  >
                                    noteworthy
                                  </span>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>

                  {/* RIGHT COLUMN: The Brief + Key Dates (and future game placeholder) */}
                  <aside className="space-y-6">
                    {/* The Brief */}
                    <section
                      className="rounded-3xl p-7 md:p-8"
                      style={{
                        backgroundColor: THEME.surfaceStrong,
                        border: `1px solid ${THEME.border}`,
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <div className="flex items-end justify-between gap-4 border-b pb-4 mb-6" style={{ borderColor: THEME.border }}>
                        <h3
                          className="text-xl md:text-2xl font-light"
                          style={{
                            color: THEME.ink,
                            fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
                          }}
                        >
                          The Brief
                        </h3>
                        <div className="text-[11px]" style={{ color: "rgba(20, 35, 55, 0.62)" }}>
                          Quick reads
                        </div>
                      </div>

                      {briefs.length === 0 ? (
                        <div className="text-sm" style={{ color: "rgba(20,35,55,0.70)" }}>
                          No additional items in this edition yet.
                        </div>
                      ) : (
                        <ol className="space-y-4">
                          {briefs.map((item, idx) => (
                            <li key={item.link} className="flex gap-3">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] border"
                                style={{
                                  borderColor: THEME.border,
                                  color: "rgba(20,35,55,0.70)",
                                  backgroundColor: "rgba(255,255,255,0.55)",
                                }}
                              >
                                {idx + 1}
                              </div>

                              <div className="min-w-0">
                                <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "rgba(20,35,55,0.55)" }}>
                                  {item.category || "General"}
                                </div>

                                <div className="mt-1 text-sm leading-snug" style={{ color: THEME.ink }}>
                                  <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                                    {item.title}
                                  </a>
                                </div>

                                <div className="mt-1 text-[10px] uppercase tracking-wide" style={{ color: "rgba(20,35,55,0.62)" }}>
                                  <span className="font-bold" style={{ color: THEME.ink }}>
                                    {item.source}
                                  </span>
                                  {(item.publishedAt || item.deadline) && (
                                    <span> • {formatDate(item.publishedAt || item.deadline || "")}</span>
                                  )}
                                  {item.impact && <span> • {item.impact}</span>}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                    </section>

                    {/* Key dates & comment periods */}
                    {keyDates.length > 0 && (
                      <section
                        className="rounded-3xl p-7 md:p-8"
                        style={{
                          backgroundColor: THEME.surfaceStrong,
                          border: `1px solid ${THEME.border}`,
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        <div className="flex items-end justify-between gap-4 border-b pb-4 mb-6" style={{ borderColor: THEME.border }}>
                          <h3
                            className="text-xl md:text-2xl font-light"
                            style={{
                              color: THEME.ink,
                              fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
                            }}
                          >
                            Calendar
                          </h3>
                          <div className="text-[11px]" style={{ color: "rgba(20, 35, 55, 0.62)" }}>
                            Deadlines & comment periods
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
                                  <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "rgba(20,35,55,0.55)" }}>
                                    {item.category || "Calendar"}
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

                                  <div className="mt-2 text-[10px] uppercase tracking-wide" style={{ color: "rgba(20,35,55,0.62)" }}>
                                    <span className="font-bold" style={{ color: THEME.ink }}>
                                      {item.source}
                                    </span>
                                    {item.deadline && <span> • Due {formatDate(item.deadline)}</span>}
                                  </div>
                                </div>

                                {item.deadline && (
                                  <div
                                    className="shrink-0 px-3 py-2 text-[10px] uppercase rounded-full w-fit border"
                                    style={{
                                      borderColor: "rgba(47, 93, 140, 0.30)",
                                      color: THEME.leviBlue,
                                      backgroundColor: "rgba(47, 93, 140, 0.08)",
                                    }}
                                  >
                                    {formatDate(item.deadline)}
                                  </div>
                                )}
                              </div>

                              {item.summary && (
                                <p className="mt-3 text-xs leading-relaxed line-clamp-3" style={{ color: "rgba(20, 35, 55, 0.78)" }}>
                                  {item.summary}
                                </p>
                              )}
                            </article>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Placeholder for your future daily environmental game */}
                    <section
                      className="rounded-3xl p-7 md:p-8"
                      style={{
                        backgroundColor: THEME.surface,
                        border: `1px solid ${THEME.border}`,
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <div className="flex items-end justify-between gap-4 border-b pb-4 mb-5" style={{ borderColor: THEME.border }}>
                        <h3
                          className="text-xl md:text-2xl font-light"
                          style={{
                            color: THEME.ink,
                            fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
                          }}
                        >
                          The Daily Game
                        </h3>
                        <div className="text-[11px]" style={{ color: "rgba(20, 35, 55, 0.62)" }}>
                          Coming soon
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
                        A small daily environmental puzzle will live here (one-minute play, one good fact). For now: front page only.
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

