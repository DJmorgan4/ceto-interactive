"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "../SiteShell"; // if SiteShell is in /app/SiteShell.tsx

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
  paper: "#F9F7F4",
  ink: "#101C2E",
  teal: "#254A4F",
  deepTeal: "#163D42",
  blue: "#335684",
};

export default function EnvironmentalNews() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [impactFilter, setImpactFilter] = useState<"All" | Impact>("All");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/updates", { cache: "no-store" });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = (await res.json()) as { items: FeedItem[] };
        if (!alive) return;
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load updates.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
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

  const urgentItems = filtered.filter((i) => i.impact === "high" && i.deadline);
  const topStories = filtered.filter((i) => i.impact === "high" && !i.deadline).slice(0, 1);
  const secondTier = filtered.filter((i) => i.impact === "high" && !i.deadline).slice(1, 3);
  const regularItems = filtered.filter((i) => i.impact !== "high");

  return (
    <SiteShell>
      <section className="px-6 lg:px-10 pt-10 pb-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Page title */}
          <div
            className="rounded-3xl border p-7 md:p-9"
            style={{
              backgroundColor: "rgba(255,255,255,0.62)",
              borderColor: "rgba(20, 35, 55, 0.14)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="text-xs tracking-[0.28em] uppercase" style={{ color: BRAND.teal }}>
              Environmental Intelligence
            </div>
            <h1 className="mt-2 text-3xl md:text-4xl font-light" style={{ color: BRAND.ink }}>
              News &amp; Regulatory Updates
            </h1>
            <p className="mt-3 text-sm md:text-base font-light" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
              Official sources, prioritized for impact: deadlines, enforcement, rules, and guidance.
            </p>

            {/* Search row */}
            <div className="mt-6 grid md:grid-cols-[1fr_auto_auto] gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search (rules, enforcement, permits, comment periods)…"
                className="px-4 py-2 border-2 text-sm focus:outline-none bg-white/70"
                style={{ borderColor: "rgba(20, 35, 55, 0.18)" }}
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border-2 text-sm focus:outline-none bg-white/70"
                style={{ borderColor: "rgba(20, 35, 55, 0.18)" }}
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
                className="px-4 py-2 border-2 text-sm focus:outline-none bg-white/70"
                style={{ borderColor: "rgba(20, 35, 55, 0.18)" }}
              >
                <option value="All">All Impact</option>
                <option value="high">High Impact</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="mt-4 text-[11px] font-light" style={{ color: "rgba(20, 35, 55, 0.60)" }}>
              Updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>

          {/* Content */}
          <div className="mt-8">
            {error && (
              <div className="bg-red-50 border-4 p-6 mb-10" style={{ borderColor: "#b91c1c" }}>
                <div className="text-center">
                  <div className="font-bold text-red-900 text-lg mb-2">Service Unavailable</div>
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              </div>
            )}

            {loading && !error && (
              <div className="text-center py-16 bg-white/70 border-2 rounded-3xl" style={{ borderColor: "rgba(20, 35, 55, 0.18)" }}>
                <div className="font-light text-xl" style={{ color: BRAND.ink }}>
                  Gathering latest intelligence…
                </div>
                <div className="text-sm text-gray-600 mt-2">EPA • TCEQ • USFWS • Federal Register</div>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-16 bg-white/70 border-2 rounded-3xl" style={{ borderColor: "rgba(20, 35, 55, 0.18)" }}>
                <div className="font-light text-lg" style={{ color: BRAND.ink }}>
                  No reports match your search.
                </div>
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <>
                {/* URGENT */}
                {urgentItems.length > 0 && (
                  <section className="mb-10">
                    <div className="bg-red-100 border-4 p-6 rounded-3xl" style={{ borderColor: "#b91c1c" }}>
                      <div className="border-b-2 pb-3 mb-6" style={{ borderColor: "#b91c1c" }}>
                        <h2 className="text-2xl md:text-3xl font-light" style={{ color: "#7f1d1d" }}>
                          Immediate Action Required
                        </h2>
                      </div>

                      <div className="space-y-6">
                        {urgentItems.map((item) => (
                          <article key={item.link} className="bg-white border-2 p-5 rounded-2xl" style={{ borderColor: "#b91c1c" }}>
                            <div className="flex items-start justify-between gap-6 mb-3">
                              <h3 className="text-xl md:text-2xl font-light leading-tight flex-1" style={{ color: BRAND.ink }}>
                                <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                                  {item.title}
                                </a>
                              </h3>

                              {item.deadline && (
                                <div className="text-white px-4 py-2 text-xs font-bold uppercase shrink-0 rounded-full" style={{ backgroundColor: "#b91c1c" }}>
                                  Deadline: {formatDate(item.deadline)}
                                </div>
                              )}
                            </div>

                            {item.summary && (
                              <p className="text-sm leading-relaxed text-gray-800 mb-3 border-l-4 pl-4" style={{ borderColor: "#b91c1c" }}>
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

                {/* LEAD STORY */}
                {topStories.length > 0 && (
                  <section className="mb-10">
                    <div className="bg-white/80 border-2 p-8 rounded-3xl" style={{ borderColor: "rgba(20, 35, 55, 0.18)" }}>
                      {topStories.map((item) => (
                        <article key={item.link}>
                          {item.category && (
                            <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: BRAND.teal }}>
                              {item.category}
                            </div>
                          )}

                          <h2 className="text-3xl md:text-5xl font-light leading-tight mb-5" style={{ color: BRAND.ink }}>
                            <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                              {item.title}
                            </a>
                          </h2>

                          {item.summary && (
                            <p className="text-base md:text-lg leading-relaxed text-gray-800 mb-5 border-l-4 pl-6" style={{ borderColor: BRAND.ink }}>
                              {item.summary}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-wide text-gray-700 border-t pt-4" style={{ borderColor: "rgba(20, 35, 55, 0.18)" }}>
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

                {/* SECONDARY */}
                {secondTier.length > 0 && (
                  <section className="mb-10">
                    <div className="grid md:grid-cols-2 gap-6">
                      {secondTier.map((item) => (
                        <article key={item.link} className="bg-white/80 border-2 p-6 rounded-3xl" style={{ borderColor: "rgba(20, 35, 55, 0.18)" }}>
                          {item.category && (
                            <div className="text-[9px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: BRAND.teal }}>
                              {item.category}
                            </div>
                          )}

                          <h3 className="text-xl md:text-2xl font-light leading-tight mb-4" style={{ color: BRAND.ink }}>
                            <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                              {item.title}
                            </a>
                          </h3>

                          {item.summary && <p className="text-sm leading-relaxed text-gray-800 mb-4">{item.summary}</p>}

                          <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-wide text-gray-700 border-t pt-3" style={{ borderColor: "rgba(20, 35, 55, 0.18)" }}>
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

                {/* REGULAR GRID */}
                {regularItems.length > 0 && (
                  <section>
                    <div className="grid md:grid-cols-3 gap-4">
                      {regularItems.map((item) => (
                        <article key={item.link} className="bg-white/80 border-2 p-4 rounded-3xl" style={{ borderColor: "rgba(20, 35, 55, 0.18)" }}>
                          {item.category && (
                            <div className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: BRAND.deepTeal }}>
                              {item.category}
                            </div>
                          )}

                          <h4 className="text-base font-light leading-tight mb-2" style={{ color: BRAND.ink }}>
                            <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                              {item.title}
                            </a>
                          </h4>

                          {item.summary && <p className="text-xs leading-relaxed text-gray-700 mb-2 line-clamp-3">{item.summary}</p>}

                          <div className="text-[10px] uppercase text-gray-600">
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
    <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-wide text-gray-700">
      <span className="font-bold" style={{ color: "#101C2E" }}>
        {item.source}
      </span>
      {item.publishedAt && <span>• {formatDate(item.publishedAt)}</span>}
      {item.category && <span>• {item.category}</span>}
      {item.impact && <span>• Impact: {item.impact}</span>}
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

