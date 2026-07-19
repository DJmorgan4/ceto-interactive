import { XMLParser } from "fast-xml-parser";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

type FeedDefinition = {
  category: string;
  url: string;
};

type ParsedFeedItem = {
  title?: unknown;
  link?: unknown;
  description?: unknown;
  pubDate?: unknown;
  source?: unknown;
  guid?: unknown;
};

const MAX_ITEMS_PER_FEED = 15;
const MAX_RETURNED_ITEMS = 36;
const FETCH_TIMEOUT_MS = 12_000;
const CACHE_SECONDS = 1_800;

const FEEDS: FeedDefinition[] = [
  {
    category: "Texas Environment",
    url:
      "https://news.google.com/rss/search?" +
      new URLSearchParams({
        q: '"Texas" environmental OR TCEQ OR "EPA Region 6"',
        hl: "en-US",
        gl: "US",
        ceid: "US:en",
      }),
  },
  {
    category: "Water",
    url:
      "https://news.google.com/rss/search?" +
      new URLSearchParams({
        q: 'Texas water OR drought OR groundwater OR reservoir OR TWDB',
        hl: "en-US",
        gl: "US",
        ceid: "US:en",
      }),
  },
  {
    category: "Air Quality",
    url:
      "https://news.google.com/rss/search?" +
      new URLSearchParams({
        q: 'Texas "air quality" OR pollution OR ozone OR emissions OR TCEQ',
        hl: "en-US",
        gl: "US",
        ceid: "US:en",
      }),
  },
  {
    category: "Land + Development",
    url:
      "https://news.google.com/rss/search?" +
      new URLSearchParams({
        q: 'Texas land development OR wetlands OR floodplain OR environmental permit',
        hl: "en-US",
        gl: "US",
        ceid: "US:en",
      }),
  },
  {
    category: "Conservation",
    url:
      "https://news.google.com/rss/search?" +
      new URLSearchParams({
        q: 'Texas wildlife OR habitat OR TPWD OR endangered species OR conservation',
        hl: "en-US",
        gl: "US",
        ceid: "US:en",
      }),
  },
  {
    category: "Energy + Infrastructure",
    url:
      "https://news.google.com/rss/search?" +
      new URLSearchParams({
        q: 'Texas pipeline OR transmission OR battery OR solar OR wind environmental',
        hl: "en-US",
        gl: "US",
        ceid: "US:en",
      }),
  },
  {
    category: "Permitting + Compliance",
    url:
      "https://news.google.com/rss/search?" +
      new URLSearchParams({
        q: 'Texas environmental permit OR enforcement OR violation OR compliance',
        hl: "en-US",
        gl: "US",
        ceid: "US:en",
      }),
  },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
  parseTagValue: false,
  processEntities: true,
});

const SCORE_TERMS: Array<{
  terms: string[];
  points: number;
}> = [
  {
    terms: [
      "emergency",
      "spill",
      "contamination",
      "evacuation",
      "explosion",
      "wildfire",
      "toxic",
      "hazardous",
      "superfund",
    ],
    points: 18,
  },
  {
    terms: [
      "enforcement",
      "violation",
      "lawsuit",
      "penalty",
      "fine",
      "compliance",
      "investigation",
    ],
    points: 14,
  },
  {
    terms: [
      "permit",
      "permitting",
      "approval",
      "application",
      "public hearing",
      "comment period",
    ],
    points: 11,
  },
  {
    terms: [
      "groundwater",
      "aquifer",
      "wastewater",
      "drinking water",
      "reservoir",
      "drought",
      "flood",
      "wetland",
    ],
    points: 10,
  },
  {
    terms: [
      "air quality",
      "ozone",
      "emissions",
      "pollution",
      "particulate",
      "methane",
    ],
    points: 10,
  },
  {
    terms: [
      "pipeline",
      "transmission",
      "solar",
      "wind",
      "battery",
      "industrial",
      "infrastructure",
    ],
    points: 8,
  },
  {
    terms: [
      "habitat",
      "endangered",
      "wildlife",
      "conservation",
      "ecosystem",
      "species",
    ],
    points: 8,
  },
];

const TEXAS_LOCATIONS = [
  "texas",
  "houston",
  "dallas",
  "fort worth",
  "austin",
  "san antonio",
  "el paso",
  "corpus christi",
  "beaumont",
  "galveston",
  "lubbock",
  "amarillo",
  "midland",
  "odessa",
  "permian basin",
  "gulf coast",
  "rio grande",
];

const AUTHORITATIVE_SOURCES = [
  "texas commission on environmental quality",
  "tceq",
  "texas water development board",
  "twdb",
  "texas parks and wildlife",
  "tpwd",
  "environmental protection agency",
  "epa",
  "us geological survey",
  "usgs",
  "national oceanic and atmospheric administration",
  "noaa",
];

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;/gi, "'")
    .replace(/&#8216;/gi, "‘")
    .replace(/&#8217;/gi, "’")
    .replace(/&#8220;/gi, "“")
    .replace(/&#8221;/gi, "”")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";

  return decodeHtmlEntities(value)
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSource(item: ParsedFeedItem): string {
  const source = item.source;

  if (typeof source === "string") {
    return cleanText(source);
  }

  if (source && typeof source === "object") {
    const sourceObject = source as Record<string, unknown>;

    if (typeof sourceObject["#text"] === "string") {
      return cleanText(sourceObject["#text"]);
    }
  }

  return "Environmental News";
}

function getLink(item: ParsedFeedItem): string {
  if (typeof item.link === "string") {
    return item.link.trim();
  }

  if (item.link && typeof item.link === "object") {
    const linkObject = item.link as Record<string, unknown>;

    if (typeof linkObject.href === "string") {
      return linkObject.href.trim();
    }

    if (typeof linkObject["#text"] === "string") {
      return linkObject["#text"].trim();
    }
  }

  if (typeof item.guid === "string") {
    return item.guid.trim();
  }

  return "";
}

function normalizeDate(value: unknown): string {
  if (typeof value !== "string") {
    return new Date().toISOString();
  }

  const parsed = new Date(value);

  return Number.isFinite(parsed.getTime())
    ? parsed.toISOString()
    : new Date().toISOString();
}

function normalizeTitle(title: string): string {
  return title
    .replace(/\s+-\s+[^-]{2,80}$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function createDeduplicationKey(item: NewsItem): string {
  return item.title
    .toLowerCase()
    .replace(/\b(the|a|an|and|or|of|to|in|for|on|with|from)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 140);
}

function calculateRecencyScore(publishedAt: string): number {
  const publishedTime = new Date(publishedAt).getTime();

  if (!Number.isFinite(publishedTime)) return 0;

  const ageHours = Math.max(
    0,
    (Date.now() - publishedTime) / (1000 * 60 * 60),
  );

  if (ageHours <= 6) return 18;
  if (ageHours <= 24) return 14;
  if (ageHours <= 72) return 9;
  if (ageHours <= 168) return 5;
  if (ageHours <= 720) return 2;

  return 0;
}

function scoreItem(
  title: string,
  summary: string,
  source: string,
  category: string,
  publishedAt: string,
): number {
  const titleText = title.toLowerCase();
  const combinedText = `${title} ${summary} ${source} ${category}`.toLowerCase();

  let score = 0;

  for (const group of SCORE_TERMS) {
    for (const term of group.terms) {
      if (combinedText.includes(term)) {
        score += group.points;

        if (titleText.includes(term)) {
          score += Math.ceil(group.points * 0.45);
        }
      }
    }
  }

  if (TEXAS_LOCATIONS.some((location) => combinedText.includes(location))) {
    score += 18;
  }

  if (combinedText.includes("tceq")) score += 24;
  if (combinedText.includes("twdb")) score += 20;
  if (combinedText.includes("tpwd")) score += 16;
  if (combinedText.includes("epa region 6")) score += 20;

  if (
    AUTHORITATIVE_SOURCES.some((authority) =>
      source.toLowerCase().includes(authority),
    )
  ) {
    score += 12;
  }

  score += calculateRecencyScore(publishedAt);

  if (title.length >= 35 && title.length <= 140) {
    score += 3;
  }

  if (summary.length >= 80) {
    score += 3;
  }

  if (
    combinedText.includes("opinion") ||
    combinedText.includes("sponsored") ||
    combinedText.includes("advertisement")
  ) {
    score -= 12;
  }

  return Math.max(0, Math.min(score, 100));
}

function impactFromScore(score: number): Impact {
  if (score >= 60) return "High";
  if (score >= 30) return "Medium";
  return "Low";
}

function isSafeLink(link: string): boolean {
  try {
    const url = new URL(link);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isRelevantToTexas(item: NewsItem): boolean {
  const text = `${item.title} ${item.summary} ${item.source}`.toLowerCase();

  return (
    TEXAS_LOCATIONS.some((location) => text.includes(location)) ||
    text.includes("tceq") ||
    text.includes("twdb") ||
    text.includes("tpwd") ||
    text.includes("epa region 6")
  );
}

async function fetchFeed(
  feed: FeedDefinition,
): Promise<{ items: NewsItem[]; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(feed.url, {
      signal: controller.signal,
      next: {
        revalidate: CACHE_SECONDS,
      },
      headers: {
        Accept:
          "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        "User-Agent":
          "CETO-Environmental-Intelligence/2.0 (+https://lithicearth.com)",
      },
    });

    if (!response.ok) {
      throw new Error(`Feed returned HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (
      !contentType.includes("xml") &&
      !contentType.includes("rss") &&
      !contentType.includes("text")
    ) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    const xml = await response.text();

    if (!xml.trim()) {
      throw new Error("Feed returned an empty response");
    }

    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel;
    const rawItems = channel?.item ?? [];
    const feedItems = Array.isArray(rawItems) ? rawItems : [rawItems];

    const items: NewsItem[] = [];

    for (const rawItem of feedItems.slice(0, MAX_ITEMS_PER_FEED)) {
      const item = rawItem as ParsedFeedItem;

      const title = normalizeTitle(cleanText(item.title));
      const summary = cleanText(item.description);
      const source = getSource(item);
      const link = getLink(item);
      const publishedAt = normalizeDate(item.pubDate);

      if (!title || !link || !isSafeLink(link)) {
        continue;
      }

      const score = scoreItem(
        title,
        summary,
        source,
        feed.category,
        publishedAt,
      );

      const newsItem: NewsItem = {
        title,
        link,
        source,
        publishedAt,
        summary:
          summary ||
          `Environmental intelligence update from ${source}. Open the source for full details.`,
        category: feed.category,
        impact: impactFromScore(score),
        score,
      };

      if (isRelevantToTexas(newsItem)) {
        items.push(newsItem);
      }
    }

    return { items };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown feed error";

    console.error(`CETO feed failure [${feed.category}]:`, message);

    return {
      items: [],
      error: `${feed.category}: ${message}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const startedAt = Date.now();

  try {
    const feedResults = await Promise.all(FEEDS.map(fetchFeed));

    const allItems = feedResults.flatMap((result) => result.items);
    const feedErrors = feedResults
      .map((result) => result.error)
      .filter((error): error is string => Boolean(error));

    const seenTitles = new Set<string>();
    const seenLinks = new Set<string>();

    const deduped = allItems
      .filter((item) => {
        const titleKey = createDeduplicationKey(item);
        const linkKey = item.link.toLowerCase();

        if (!titleKey) return false;

        if (seenTitles.has(titleKey) || seenLinks.has(linkKey)) {
          return false;
        }

        seenTitles.add(titleKey);
        seenLinks.add(linkKey);

        return true;
      })
      .sort((a, b) => {
        const scoreDifference = b.score - a.score;

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        return (
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime()
        );
      })
      .slice(0, MAX_RETURNED_ITEMS);

    const categoryCounts = deduped.reduce<Record<string, number>>(
      (counts, item) => {
        counts[item.category] = (counts[item.category] ?? 0) + 1;
        return counts;
      },
      {},
    );

    const impactCounts = deduped.reduce<Record<Impact, number>>(
      (counts, item) => {
        counts[item.impact] += 1;
        return counts;
      },
      {
        Low: 0,
        Medium: 0,
        High: 0,
      },
    );

    return NextResponse.json(
      {
        status: deduped.length > 0 ? "operational" : "degraded",
        updatedAt: new Date().toISOString(),
        responseTimeMs: Date.now() - startedAt,
        count: deduped.length,
        sourceCount: new Set(deduped.map((item) => item.source)).size,
        categoryCounts,
        impactCounts,
        feedHealth: {
          configured: FEEDS.length,
          successful: FEEDS.length - feedErrors.length,
          failed: feedErrors.length,
        },
        warnings: feedErrors,
        items: deduped,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=1800, stale-while-revalidate=3600",
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  } catch (error) {
    console.error("CETO intelligence API failure:", error);

    return NextResponse.json(
      {
        status: "offline",
        updatedAt: new Date().toISOString(),
        responseTimeMs: Date.now() - startedAt,
        count: 0,
        sourceCount: 0,
        categoryCounts: {},
        impactCounts: {
          Low: 0,
          Medium: 0,
          High: 0,
        },
        feedHealth: {
          configured: FEEDS.length,
          successful: 0,
          failed: FEEDS.length,
        },
        warnings: ["The intelligence service encountered an internal error."],
        items: [],
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
