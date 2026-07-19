"use client";

import { useEffect, useMemo, useState } from "react";

type Impact = "Low" | "Medium" | "High";

type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  summary: string;
  category: string;
  impact: Impact;
  score: number;
};

type EnvNewsResponse = {
  items?: NewsItem[];
  updatedAt?: string;
  error?: string;
};

const theme = {
  ink: "#102033",
  navy: "#123D70",
  blue: "#2F5D8C",
  green: "#4F7A6A",
  amber: "#B86A2E",
  red: "#B84A3A",
  cream: "#F5F1E8",
  border: "rgba(16,32,51,0.11)",
  muted: "rgba(16,32,51,0.64)",
  soft: "rgba(255,255,255,0.72)",
};

function isValidNewsItem(item: unknown): item is NewsItem {
  if (!item || typeof item !== "object") return false;

  const candidate = item as Partial<NewsItem>;

  return (
    typeof candidate.title === "string" &&
    typeof candidate.link === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.publishedAt === "string" &&
    typeof candidate.summary === "string" &&
    typeof candidate.category === "string" &&
    ["Low", "Medium", "High"].includes(candidate.impact ?? "") &&
    typeof candidate.score === "number"
  );
}

function timeAgo(date: string) {
  const timestamp = new Date(date).getTime();

  if (!Number.isFinite(timestamp)) {
    return "RECENT";
  }

  const difference = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(difference / 60_000);

  if (minutes < 1) return "JUST NOW";
  if (minutes < 60) return `${minutes}M AGO`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}H AGO`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}D AGO`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year:
      new Date(date).getFullYear() !== new Date().getFullYear()
        ? "numeric"
        : undefined,
  })
    .format(new Date(date))
    .toUpperCase();
}

function impactColor(impact: Impact) {
  if (impact === "High") return theme.red;
  if (impact === "Medium") return theme.amber;
  return theme.green;
}

function formatUpdatedAt(date: string | null) {
  if (!date) return "Awaiting intelligence feed";

  const parsed = new Date(date);

  if (!Number.isFinite(parsed.getTime())) {
    return "Intelligence feed active";
  }

  return `Updated ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed)}`;
}

export default function EnvNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [impact, setImpact] = useState<Impact | "All">("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  async function loadNews() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/envnews", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Intelligence service returned HTTP ${response.status}.`);
      }

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error("The intelligence service returned an invalid response.");
      }

      const data = (await response.json()) as EnvNewsResponse;

      if (!Array.isArray(data.items)) {
        throw new Error("The intelligence feed did not return a valid item list.");
      }

      const normalizedItems = data.items
        .filter(isValidNewsItem)
        .sort((a, b) => {
          const scoreDifference = b.score - a.score;

          if (scoreDifference !== 0) {
            return scoreDifference;
          }

          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        });

      setItems(normalizedItems);
      setLastUpdated(data.updatedAt ?? new Date().toISOString());

      if (data.error) {
        setError(data.error);
      }
    } catch (caughtError) {
      console.error("CETO intelligence request failed:", caughtError);

      setItems([]);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Environmental intelligence is temporarily unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNews();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(items.map((item) => item.category).filter(Boolean)),
    ).sort();

    return ["All", ...uniqueCategories];
  }, [items]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const searchableText = [
        item.title,
        item.summary,
        item.source,
        item.category,
        item.impact,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery.length === 0 ||
        searchableText.includes(normalizedQuery);

      const matchesCategory =
        category === "All" || item.category === category;

      const matchesImpact =
        impact === "All" || item.impact === impact;

      return matchesQuery && matchesCategory && matchesImpact;
    });
  }, [items, query, category, impact]);

  const lead = filtered[0];
  const secondary = filtered.slice(1, 3);
  const remaining = filtered.slice(3);

  const highImpactCount = items.filter(
    (item) => item.impact === "High",
  ).length;

  const sourceCount = new Set(items.map((item) => item.source)).size;

  const averageScore =
    items.length > 0
      ? Math.round(
          items.reduce((total, item) => total + item.score, 0) / items.length,
        )
      : 0;

  return (
    <main className="min-h-screen bg-[#F3F0E8]">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(47,93,140,0.08), transparent 36%), radial-gradient(circle at top right, rgba(79,122,106,0.08), transparent 34%)",
        }}
      />

      <div className="relative mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <section
          className="relative overflow-hidden rounded-[32px] border shadow-[0_24px_80px_rgba(16,32,51,0.08)]"
          style={{
            borderColor: theme.border,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(247,244,237,0.9))",
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{
              background:
                "linear-gradient(90deg, #123D70, #2F5D8C, #4F7A6A, #B86A2E)",
            }}
          />

          <div className="grid gap-10 p-7 sm:p-10 lg:grid-cols-[1.45fr_0.55fr] lg:p-12">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]"
                  style={{
                    color: theme.green,
                    backgroundColor: "rgba(79,122,106,0.1)",
                    border: "1px solid rgba(79,122,106,0.14)",
                  }}
                >
                  <span className="h-2 w-2 rounded-full bg-[#4F7A6A] shadow-[0_0_0_4px_rgba(79,122,106,0.12)]" />
                  Live intelligence
                </div>

                <div
                  className="text-[11px] font-semibold uppercase tracking-[0.24em]"
                  style={{ color: theme.amber }}
                >
                  Texas environmental operations
                </div>
              </div>

              <h1
                className="max-w-4xl text-5xl font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl"
                style={{ color: theme.ink }}
              >
                CETO
                <span
                  className="ml-3 font-light"
                  style={{ color: theme.blue }}
                >
                  INTEL
                </span>
              </h1>

              <p
                className="mt-5 max-w-3xl text-base font-light leading-7 sm:text-lg"
                style={{ color: theme.muted }}
              >
                Executive-grade environmental intelligence across land, water,
                air, infrastructure, permitting, compliance, and conservation.
              </p>

              <div className="mt-8 flex flex-wrap gap-2.5">
                {[
                  "Land",
                  "Water",
                  "Air",
                  "Permitting",
                  "Conservation",
                  "Infrastructure",
                ].map((label) => (
                  <span
                    key={label}
                    className="rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{
                      color: theme.navy,
                      backgroundColor: "rgba(18,61,112,0.06)",
                      border: "1px solid rgba(18,61,112,0.1)",
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div
                className="rounded-2xl border p-5"
                style={{
                  borderColor: theme.border,
                  backgroundColor: "rgba(255,255,255,0.56)",
                }}
              >
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: theme.blue }}
                >
                  Intelligence status
                </div>

                <div
                  className="mt-3 text-2xl font-semibold"
                  style={{ color: theme.ink }}
                >
                  {loading ? "Synchronizing" : "Operational"}
                </div>

                <div
                  className="mt-1 text-sm font-light"
                  style={{ color: theme.muted }}
                >
                  {formatUpdatedAt(lastUpdated)}
                </div>

                <div
                  className="mt-5 h-1.5 overflow-hidden rounded-full"
                  style={{ backgroundColor: "rgba(16,32,51,0.08)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: loading ? "54%" : error ? "28%" : "100%",
                      backgroundColor: error ? theme.red : theme.green,
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => void loadNews()}
                disabled={loading}
                className="mt-4 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  color: "white",
                  backgroundColor: theme.ink,
                }}
              >
                {loading ? "Refreshing intelligence..." : "Refresh intelligence"}
              </button>
            </div>
          </div>

          <div
            className="grid grid-cols-2 border-t md:grid-cols-4"
            style={{ borderColor: theme.border }}
          >
            <Metric
              label="Active updates"
              value={items.length}
              detail="Current intelligence records"
            />
            <Metric
              label="High impact"
              value={highImpactCount}
              detail="Priority operational events"
            />
            <Metric
              label="Verified sources"
              value={sourceCount}
              detail="Distinct publishers"
            />
            <Metric
              label="Average score"
              value={averageScore}
              detail="Relevance index"
              last
            />
          </div>
        </section>

        <section className="mt-8">
          <div
            className="grid gap-3 rounded-2xl border p-3 shadow-sm lg:grid-cols-[1fr_auto_auto]"
            style={{
              borderColor: theme.border,
              backgroundColor: "rgba(255,255,255,0.72)",
            }}
          >
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                style={{ color: "rgba(16,32,51,0.42)" }}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search agencies, projects, permits, water, air, land..."
                className="w-full rounded-xl border-0 bg-transparent py-3.5 pl-12 pr-4 text-sm outline-none"
                style={{ color: theme.ink }}
              />
            </div>

            <FilterSelect
              label="Category"
              value={category}
              onChange={setCategory}
              options={categories}
            />

            <FilterSelect
              label="Impact"
              value={impact}
              onChange={(value) => setImpact(value as Impact | "All")}
              options={["All", "High", "Medium", "Low"]}
            />
          </div>
        </section>

        {error && (
          <section
            role="alert"
            className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center"
            style={{
              borderColor: "rgba(184,74,58,0.2)",
              backgroundColor: "rgba(184,74,58,0.07)",
            }}
          >
            <div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: theme.red }}
              >
                Intelligence feed interrupted
              </div>

              <p
                className="mt-1 text-sm"
                style={{ color: "rgba(16,32,51,0.74)" }}
              >
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadNews()}
              className="rounded-lg px-4 py-2 text-sm font-semibold"
              style={{
                color: theme.red,
                border: "1px solid rgba(184,74,58,0.2)",
                backgroundColor: "rgba(255,255,255,0.58)",
              }}
            >
              Retry connection
            </button>
          </section>
        )}

        {loading && <LoadingState />}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            hasFilters={
              query.trim().length > 0 ||
              category !== "All" ||
              impact !== "All"
            }
            onReset={() => {
              setQuery("");
              setCategory("All");
              setImpact("All");
            }}
          />
        )}

        {!loading && lead && (
          <section className="mt-10">
            <SectionHeading
              eyebrow="Executive brief"
              title="Lead intelligence"
              count={filtered.length}
            />

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
              <LeadStoryCard item={lead} />

              <div className="grid gap-5">
                {secondary.map((item) => (
                  <CompactStoryCard
                    key={`${item.title}-${item.source}`}
                    item={item}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {!loading && remaining.length > 0 && (
          <section className="mt-12 pb-12">
            <SectionHeading
              eyebrow="Intelligence stream"
              title="Latest developments"
              count={remaining.length}
            />

            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {remaining.map((item) => (
                <StoryCard
                  key={`${item.title}-${item.source}-${item.publishedAt}`}
                  item={item}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  detail,
  last = false,
}: {
  label: string;
  value: string | number;
  detail: string;
  last?: boolean;
}) {
  return (
    <div
      className="border-b p-5 sm:p-6 md:border-b-0 md:border-r"
      style={{
        borderColor: last ? "transparent" : theme.border,
      }}
    >
      <div
        className="text-2xl font-semibold tracking-tight"
        style={{ color: theme.ink }}
      >
        {value}
      </div>

      <div
        className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: theme.blue }}
      >
        {label}
      </div>

      <div
        className="mt-1 text-xs font-light"
        style={{ color: theme.muted }}
      >
        {detail}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label
      className="flex min-w-[180px] items-center gap-3 rounded-xl px-4 py-3"
      style={{
        backgroundColor: "rgba(16,32,51,0.035)",
        border: `1px solid ${theme.border}`,
      }}
    >
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: theme.muted }}
      >
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-medium outline-none"
        style={{ color: theme.ink }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionHeading({
  eyebrow,
  title,
  count,
}: {
  eyebrow: string;
  title: string;
  count: number;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.25em]"
          style={{ color: theme.amber }}
        >
          {eyebrow}
        </div>

        <h2
          className="mt-2 text-3xl font-semibold tracking-[-0.03em]"
          style={{ color: theme.ink }}
        >
          {title}
        </h2>
      </div>

      <div
        className="text-xs font-semibold uppercase tracking-[0.16em]"
        style={{ color: theme.muted }}
      >
        {count} intelligence {count === 1 ? "record" : "records"}
      </div>
    </div>
  );
}

function LeadStoryCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex min-h-[430px] flex-col justify-between overflow-hidden rounded-[28px] border p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(16,32,51,0.14)] sm:p-9"
      style={{
        borderColor: theme.border,
        background:
          "linear-gradient(145deg, rgba(16,32,51,0.98), rgba(18,61,112,0.92))",
      }}
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(255,255,255,0.14), transparent 36%), radial-gradient(circle at bottom left, rgba(79,122,106,0.25), transparent 34%)",
        }}
      />

      <div className="relative">
        <div className="flex flex-wrap gap-2">
          <Badge label={item.impact} color={impactColor(item.impact)} dark />
          <Badge label={item.category} color="#AFC7E1" dark />
          {item.score >= 45 && (
            <Badge label="Priority intelligence" color="#F0C79E" dark />
          )}
        </div>

        <h3 className="mt-8 max-w-4xl text-3xl font-semibold leading-[1.12] tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
          {item.title}
        </h3>

        <p className="mt-5 max-w-3xl text-sm font-light leading-7 text-white/70 sm:text-base">
          {item.summary}
        </p>
      </div>

      <div className="relative mt-10 flex flex-col justify-between gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
        <div>
          <div className="text-sm font-semibold text-white">{item.source}</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-white/50">
            {timeAgo(item.publishedAt)} · Score {item.score}
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
          Open intelligence
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </div>
      </div>
    </a>
  );
}

function CompactStoryCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-[205px] flex-col justify-between rounded-[24px] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        borderColor: theme.border,
        backgroundColor: "rgba(255,255,255,0.76)",
      }}
    >
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge label={item.impact} color={impactColor(item.impact)} />
          <Badge label={item.category} color={theme.blue} />
        </div>

        <h3
          className="mt-5 text-xl font-semibold leading-tight tracking-[-0.02em]"
          style={{ color: theme.ink }}
        >
          {item.title}
        </h3>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <div
            className="text-xs font-semibold"
            style={{ color: theme.navy }}
          >
            {item.source}
          </div>
          <div
            className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: theme.muted }}
          >
            {timeAgo(item.publishedAt)}
          </div>
        </div>

        <span
          className="text-lg transition-transform duration-300 group-hover:translate-x-1"
          style={{ color: theme.blue }}
        >
          →
        </span>
      </div>
    </a>
  );
}

function StoryCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full min-h-[330px] flex-col rounded-[24px] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(16,32,51,0.11)]"
      style={{
        borderColor: theme.border,
        backgroundColor: "rgba(255,255,255,0.74)",
      }}
    >
      <div className="flex flex-wrap gap-2">
        <Badge label={item.impact} color={impactColor(item.impact)} />
        <Badge label={item.category} color={theme.blue} />
        {item.score >= 45 && (
          <Badge label="Priority" color={theme.red} />
        )}
      </div>

      <h3
        className="mt-6 text-xl font-semibold leading-tight tracking-[-0.02em]"
        style={{ color: theme.ink }}
      >
        {item.title}
      </h3>

      <p
        className="mt-4 line-clamp-4 text-sm font-light leading-6"
        style={{ color: theme.muted }}
      >
        {item.summary}
      </p>

      <div
        className="mt-auto flex items-end justify-between gap-5 border-t pt-5"
        style={{ borderColor: theme.border }}
      >
        <div>
          <div
            className="text-xs font-semibold"
            style={{ color: theme.navy }}
          >
            {item.source}
          </div>

          <div
            className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: theme.muted }}
          >
            {timeAgo(item.publishedAt)} · Score {item.score}
          </div>
        </div>

        <span
          className="transition-transform duration-300 group-hover:translate-x-1"
          style={{ color: theme.blue }}
        >
          →
        </span>
      </div>
    </a>
  );
}

function Badge({
  label,
  color,
  dark = false,
}: {
  label: string;
  color: string;
  dark?: boolean;
}) {
  return (
    <span
      className="rounded-md px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.15em]"
      style={{
        color,
        backgroundColor: dark ? "rgba(255,255,255,0.08)" : `${color}12`,
        border: dark
          ? "1px solid rgba(255,255,255,0.1)"
          : `1px solid ${color}18`,
      }}
    >
      {label}
    </span>
  );
}

function LoadingState() {
  return (
    <section className="mt-10">
      <div className="mb-5 h-8 w-56 animate-pulse rounded-lg bg-black/5" />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="min-h-[430px] animate-pulse rounded-[28px] bg-black/[0.06]" />

        <div className="grid gap-5">
          <div className="min-h-[205px] animate-pulse rounded-[24px] bg-black/[0.05]" />
          <div className="min-h-[205px] animate-pulse rounded-[24px] bg-black/[0.05]" />
        </div>
      </div>
    </section>
  );
}

function EmptyState({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <section
      className="mt-10 rounded-[28px] border px-6 py-20 text-center"
      style={{
        borderColor: theme.border,
        backgroundColor: "rgba(255,255,255,0.68)",
      }}
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
        style={{
          color: theme.blue,
          backgroundColor: "rgba(47,93,140,0.08)",
        }}
      >
        ◎
      </div>

      <h2
        className="mt-5 text-2xl font-semibold"
        style={{ color: theme.ink }}
      >
        {hasFilters
          ? "No intelligence matches your filters"
          : "No intelligence is currently available"}
      </h2>

      <p
        className="mx-auto mt-2 max-w-xl text-sm leading-6"
        style={{ color: theme.muted }}
      >
        {hasFilters
          ? "Adjust your search criteria or reset the filters to return to the full intelligence stream."
          : "The page is operational, but the environmental news endpoint has not returned any records."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 rounded-xl px-5 py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: theme.ink }}
        >
          Reset all filters
        </button>
      )}
    </section>
  );
}
