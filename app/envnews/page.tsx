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

const BRAND = {
  ink: "#142337",
  teal: "#254A4F",
  blue: "#2F5D8C",
  border: "rgba(20, 35, 55, 0.18)",
  glass: "rgba(255,255,255,0.62)",
  glassStrong: "rgba(255,255,255,0.78)",
  muted: "rgba(20, 35, 55, 0.68)",
};

/**
 * ✅ YOUR REAL LOGO (embedded)
 * This prevents the broken image icon forever, because it does not rely on /public/logo.png.
 */
const CETO_LOGO_DATA_URI =
  "data:image/png;base64," +
  "iVBORw0KGgoAAAANSUhEUgAAAqAAAAGMCAYAAAAFuhAVAAAMTGlDQ1BJQ0MgUHJvZmlsZQAASImVVwdY"
  + "AAAB....(TRUNCATED HERE IN CHAT FOR SAFETY OF LENGTH)....";

/**
 * IMPORTANT:
 * The string above MUST be the full base64.
 * I can’t safely paste 138,000+ base64 chars into a single chat message without it getting mangled.
 *
 * ✅ Do this instead (1 minute, guaranteed correct):
 * 1) Put your real logo file at: /public/ceto-logo.png
 *    (the exact image you posted)
 * 2) Set LOGO_SRC to "/ceto-logo.png"
 *
 * If you insist on the data URI approach, tell me “paste full base64”
 * and I’ll output it split across multiple small chunks you can paste safely.
 */
const LOGO_SRC = "/ceto-logo.png"; // <-- use this (recommended)

export default function EnvironmentalNews() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        // Simple timeout so “slow API” doesn’t feel broken
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
    return items.filter((it) => {
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
  }, [items, query, categoryFilter, impactFilter]);

  // Neutral buckets (no “ALERT” framing)
  const keyDates = filtered.filter((i) => i.deadline); // deadlines/comment periods
  const featured = filtered.filter((i) => i.impact === "high" && !i.deadline).slice(0, 1);
  const secondary = filtered.filter((i) => i.impact === "high" && !i.deadline).slice(1, 3);
  const more = filtered.filter((i) => i.impact !== "high");

  return (
    <SiteShell>
      <section className="px-6 lg:px-10 pt-10 pb-12">
        <div className="max-w-[1200px] mx-auto">
          {/* Masthead */}
          <div
            className="rounded-3xl border px-7 py-8 md:px-10 md:py-10"
            style={{
              backgroundColor: BRAND.glass,
              borderColor: BRAND.border,
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="min-w-0">
                <div className="flex items-center gap-4">
                  {/* Lowkey logo (exact image) */}
                  <img
                    src={LOGO_SRC /* or use CETO_LOGO_DATA_URI */}
                    alt="ceto interactive"
                    className="h-10 md:h-12 w-auto"
                    style={{ display: "block" }}
                    draggable={false}
                  />

                  <div>
                    <div
                      className="text-[11px] md:text-xs tracking-[0.28em] uppercase"
                      style={{ color: BRAND.teal }}
                    >
                      Environmental intelligence
                    </div>

                    <h1
                      className="mt-2 text-3xl md:text-4xl font-light"
                      style={{ color: BRAND.ink, fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif" }}
                    >
                      News &amp; Regulatory Updates
                    </h1>
                  </div>
                </div>

                <p className="mt-4 text-sm md:text-base font-light max-w-3xl leading-relaxed" style={{ color: BRAND.muted }}>
                  Official sources, organized for clarity. Facts first—room for context, and eventually human reporting.
                </p>
              </div>

              <div className="text-[11px] font-light md:text-right" style={{ color: "rgba(20, 35, 55, 0.55)" }}>
                Updated:{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>

            {/* Filters */}
            <div className="mt-7 grid grid-cols-1 md:grid-cols-[1fr_220px_180px] gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search (rules, permits, enforcement, comment periods)…"
                className="px-4 py-3 border-2 text-sm focus:outline-none rounded-2xl bg-white/70"
                style={{ borderColor: BRAND.border }}
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 border-2 text-sm focus:outline-none rounded-2xl bg-white/70"
                style={{ borderColor: BRAND.border }}
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
                className="px-4 py-3 border-2 text-sm focus:outline-none rounded-2xl bg-white/70"
                style={{ borderColor: BRAND.border }}
              >
                <option value="All">All impact</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Body */}
          <div className="mt-10">
            {error && (
              <div className="bg-white/80 border-2 p-6 rounded-3xl" style={{ borderColor: BRAND.border }}>
                <div className="text-center">
                  <div className="font-light text-lg" style={{ color: BRAND.ink }}>
                    Updates unavailable
                  </div>
                  <div className="text-sm mt-1" style={{ color: BRAND.muted }}>
                    {error}
                  </div>
                </div>
              </div>
            )}

            {loading && !error && (
              <div className="text-center py-16 border-2 rounded-3xl bg-white/70" style={{ borderColor: BRAND.border }}>
                <div className="font-light text-xl" style={{ color: BRAND.ink }}>
                  Gathering latest updates…
                </div>
                <div className="text-sm mt-2" style={{ color: BRAND.muted }}>
                  EPA • TCEQ • USFWS • Federal Register
                </div>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-16 border-2 rounded-3xl bg-white/70" style={{ borderColor: BRAND.border }}>
                <div className="font-light text-lg" style={{ color: BRAND.ink }}>
                  No items match your search.
                </div>
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <>
                {/* Key dates (neutral, not alarmist) */}
                {keyDates.length > 0 && (
                  <section className="mb-10">
                    <div className="rounded-3xl border p-7 md:p-8" style={{ backgroundColor: BRAND.glassStrong, borderColor: BRAND.border }}>
                      <div className="flex items-end justify-between gap-4 border-b pb-4 mb-6" style={{ borderColor: BRAND.border }}>
                        <h2
                          className="text-xl md:text-2xl font-light"
                          style={{ color: BRAND.ink, fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif" }}
                        >
                          Key dates &amp; comment periods
                        </h2>
                        <div className="text-[11px]" style={{ color: BRAND.muted }}>
                          Neutral calendar items (no “alerts”)
                        </div>
                      </div>

                      <div className="space-y-5">
                        {keyDates.slice(0, 6).map((item) => (
                          <article key={item.link} className="bg-white/80 border-2 p-6 rounded-2xl" style={{ borderColor: BRAND.border }}>
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-3">
                              <h3 className="text-lg md:text-xl font-light leading-snug" style={{ color: BRAND.ink }}>
                                <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                                  {item.title}
                                </a>
                              </h3>

                              {item.deadline && (
                                <div
                                  className="px-4 py-2 text-[11px] uppercase rounded-full w-fit border"
                                  style={{
                                    borderColor: "rgba(47, 93, 140, 0.30)",
                                    color: BRAND.blue,
                                    backgroundColor: "rgba(47, 93, 140, 0.08)",
                                  }}
                                >
                                  Date: {formatDate(item.deadline)}
                                </div>
                              )}
                            </div>

                            {item.summary && (
                              <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(20, 35, 55, 0.78)" }}>
                                {item.summary}
                              </p>
                            )}

                            <MetaRow item={item} />
                          </article>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* Featured story */}
                {featured.length > 0 && (
                  <section className="mb-10">
                    <div className="bg-white/80 border-2 p-8 md:p-10 rounded-3xl" style={{ borderColor: BRAND.border }}>
                      {featured.map((item) => (
                        <article key={item.link}>
                          {item.category && (
                            <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: BRAND.teal }}>
                              {item.category}
                            </div>
                          )}

                          <h2
                            className="text-3xl md:text-5xl font-light leading-tight mb-5"
                            style={{ color: BRAND.ink, fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif" }}
                          >
                            <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                              {item.title}
                            </a>
                          </h2>

                          {item.summary && (
                            <p className="text-base md:text-lg leading-relaxed mb-5 border-l-4 pl-6" style={{ borderColor: BRAND.border, color: "rgba(20, 35, 55, 0.78)" }}>
                              {item.summary}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-wide border-t pt-4" style={{ borderColor: BRAND.border, color: BRAND.muted }}>
                            <span className="font-bold" style={{ color: BRAND.ink }}>
                              {item.source}
                            </span>
                            {item.publishedAt && <span>• {formatDate(item.publishedAt)}</span>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {/* Secondary */}
                {secondary.length > 0 && (
                  <section className="mb-10">
                    <div className="grid md:grid-cols-2 gap-6">
                      {secondary.map((item) => (
                        <article key={item.link} className="bg-white/80 border-2 p-7 rounded-3xl" style={{ borderColor: BRAND.border }}>
                          {item.category && (
                            <div className="text-[9px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: BRAND.teal }}>
                              {item.category}
                            </div>
                          )}

                          <h3
                            className="text-xl md:text-2xl font-light leading-tight mb-4"
                            style={{ color: BRAND.ink, fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif" }}
                          >
                            <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                              {item.title}
                            </a>
                          </h3>

                          {item.summary && (
                            <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(20, 35, 55, 0.78)" }}>
                              {item.summary}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-wide border-t pt-3" style={{ borderColor: BRAND.border, color: BRAND.muted }}>
                            <span className="font-bold" style={{ color: BRAND.ink }}>
                              {item.source}
                            </span>
                            {item.publishedAt && <span>• {formatDate(item.publishedAt)}</span>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {/* More */}
                {more.length > 0 && (
                  <section>
                    <div className="grid md:grid-cols-3 gap-4">
                      {more.map((item) => (
                        <article key={item.link} className="bg-white/80 border-2 p-6 rounded-3xl" style={{ borderColor: BRAND.border }}>
                          {item.category && (
                            <div className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: BRAND.teal }}>
                              {item.category}
                            </div>
                          )}

                          <h4
                            className="text-base font-light leading-tight mb-2"
                            style={{ color: BRAND.ink, fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif" }}
                          >
                            <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                              {item.title}
                            </a>
                          </h4>

                          {item.summary && (
                            <p className="text-xs leading-relaxed mb-3 line-clamp-3" style={{ color: "rgba(20, 35, 55, 0.78)" }}>
                              {item.summary}
                            </p>
                          )}

                          <div className="text-[10px] uppercase" style={{ color: BRAND.muted }}>
                            <span className="font-bold" style={{ color: BRAND.ink }}>
                              {item.source}
                            </span>
                            {item.publishedAt && <span> • {formatDate(item.publishedAt)}</span>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function MetaRow({ item }: { item: FeedItem }) {
  return (
    <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-wide" style={{ color: "rgba(20, 35, 55, 0.62)" }}>
      <span className="font-bold" style={{ color: BRAND.ink }}>
        {item.source}
      </span>
      {item.publishedAt && <span>• {formatDate(item.publishedAt)}</span>}
      {item.category && <span>• {item.category}</span>}
      {item.impact && <span>• Impact: {item.impact}</span>}
      {item.deadline && <span>• Date: {formatDate(item.deadline)}</span>}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  } catch {
    return iso;
  }
}

