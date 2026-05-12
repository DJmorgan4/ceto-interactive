"use client";

import { useEffect, useMemo, useState } from "react";

type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  summary: string;
  category: string;
  impact: "Low" | "Medium" | "High";
  score: number;
};

const T = {
  ink: "#142337",
  blue: "#2F5D8C",
  green: "#4F7A6A",
  amber: "#B86A2E",
  red: "#B84A3A",
  border: "rgba(20,35,55,0.12)",
  surface: "rgba(255,255,255,0.72)"
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.max(1, Math.round(diff / 36e5));
  if (hours < 24) return `${hours}H AGO`;
  return `${Math.round(hours / 24)}D AGO`;
}

function impactColor(impact: NewsItem["impact"]) {
  if (impact === "High") return T.red;
  if (impact === "Medium") return T.amber;
  return T.green;
}

export default function EnvNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/envnews")
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category)))],
    [items]
  );

  const filtered = items.filter((item) => {
    const haystack = `${item.title} ${item.summary} ${item.source} ${item.category}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesCategory = category === "All" || item.category === category;
    return matchesQuery && matchesCategory;
  });

  const lead = filtered[0];
  const rest = filtered.slice(1);

  return (
    <main className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10">
      <section
        className="rounded-3xl p-8 sm:p-10 mb-9 shadow-sm"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="text-[11px] tracking-[0.32em] uppercase font-semibold mb-3" style={{ color: T.amber }}>
              Texas Environmental Intelligence
            </div>
            <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight" style={{ color: T.ink }}>
              CETO INTEL
            </h1>
            <p className="mt-3 text-base sm:text-lg font-light" style={{ color: "rgba(20,35,55,0.68)" }}>
              Land · Water · Air · Permitting · Conservation · Infrastructure
            </p>
          </div>

          <div className="text-sm font-light lg:text-right" style={{ color: "rgba(20,35,55,0.62)" }}>
            Updated automatically from Texas-focused environmental sources.
            <br />
            Prioritized by relevance, impact, and operational importance.
          </div>
        </div>

        <div className="mt-7 grid lg:grid-cols-[1fr_auto] gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Texas environmental intelligence..."
            className="w-full rounded-xl px-4 py-3 outline-none"
            style={{ border: `1px solid ${T.border}`, backgroundColor: "rgba(255,255,255,0.72)" }}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl px-4 py-3 outline-none"
            style={{ border: `1px solid ${T.border}`, backgroundColor: "rgba(255,255,255,0.72)" }}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Updates" value={items.length} />
          <Stat label="High Impact" value={items.filter((i) => i.impact === "High").length} />
          <Stat label="Sources" value={new Set(items.map((i) => i.source)).size} />
          <Stat label="Texas Focus" value="Live" />
        </div>
      </section>

      {loading && (
        <div className="text-center py-20" style={{ color: "rgba(20,35,55,0.62)" }}>
          Loading Texas environmental intelligence...
        </div>
      )}

      {!loading && lead && (
        <>
          <SectionLabel label="Lead Story" />
          <NewsCard item={lead} large />
        </>
      )}

      {!loading && rest.length > 0 && (
        <>
          <SectionLabel label="Featured Intelligence" />
          <div className="grid md:grid-cols-2 gap-5">
            {rest.map((item) => (
              <NewsCard key={`${item.title}-${item.source}`} item={item} />
            ))}
          </div>
        </>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-3xl p-10 text-center" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          No matching environmental updates found.
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-2xl font-semibold" style={{ color: T.blue }}>{value}</div>
      <div className="text-xs font-light" style={{ color: "rgba(20,35,55,0.62)" }}>{label}</div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mt-8 mb-4 flex items-center gap-3">
      <div className="h-px w-7" style={{ backgroundColor: "rgba(184,106,46,0.55)" }} />
      <div className="text-xs uppercase tracking-[0.28em] font-semibold" style={{ color: "#123D70" }}>
        {label}
      </div>
    </div>
  );
}

function NewsCard({ item, large = false }: { item: NewsItem; large?: boolean }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noreferrer"
      className="block rounded-3xl p-6 transition-all hover:shadow-lg"
      style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge label={item.impact} color={impactColor(item.impact)} />
        <Badge label={item.category} color={T.blue} />
        {item.score >= 45 && <Badge label="Priority" color={T.red} />}
      </div>

      <h2 className={large ? "text-2xl sm:text-3xl font-semibold leading-tight" : "text-xl font-semibold leading-tight"} style={{ color: T.ink }}>
        {item.title}
      </h2>

      <p className="mt-3 text-sm leading-relaxed line-clamp-3" style={{ color: "rgba(20,35,55,0.68)" }}>
        {item.summary}
      </p>

      <div className="mt-5 flex items-center gap-3 text-xs font-semibold" style={{ color: "#123D70" }}>
        <span>{item.source}</span>
        <span style={{ color: "rgba(20,35,55,0.35)" }}>•</span>
        <span style={{ color: "rgba(20,35,55,0.55)" }}>{timeAgo(item.publishedAt)}</span>
      </div>
    </a>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-[10px] uppercase tracking-[0.14em] rounded-md px-2.5 py-1 font-semibold"
      style={{ backgroundColor: `${color}12`, color }}
    >
      {label}
    </span>
  );
}
