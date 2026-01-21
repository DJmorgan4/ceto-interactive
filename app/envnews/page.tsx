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

  const lead = filtered[0] || null;
  const featured = filtered.slice(1, 5);
  const headlines = filtered.slice(5, 15);
  const briefs = filtered.slice(15, 30);

  const upcomingDeadlines = useMemo(() => {
    const now = Date.now();
    return filtered
      .filter((i) => i.deadline && toTime(i.deadline) >= now)
      .sort((a, b) => toTime(a.deadline!) - toTime(b.deadline!))
      .slice(0, 8);
  }, [filtered]);

  const highImpactItems = useMemo(() => {
    return filtered.filter((i) => i.impact === "high").slice(0, 5);
  }, [filtered]);

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
            className="rounded-3xl p-6 sm:p-8 lg:p-12 shadow-xl"
            style={{
              backgroundColor: THEME.surfaceStrong,
              border: `1px solid ${THEME.border}`,
              backdropFilter: "blur(20px)",
            }}
          >
            {/* ... YOUR EXISTING CONTENT CONTINUES UNCHANGED ... */}
          </header>

          {/* ... REST OF YOUR COMPONENTS / JSX UNCHANGED ... */}
        </div>
      </div>
    </main>
  );
}

// (Everything below here stays exactly the same: SectionHeader, LeadStory, FeaturedCard, etc.)

