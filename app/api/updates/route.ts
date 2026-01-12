import Parser from "rss-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

const parser = new Parser({
  timeout: 12000,
  headers: {
    "User-Agent": "CetoInteractive/1.0 (+https://cetointeractive.com)",
    Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
  },
});

// Add more later, but keep it “official-first”
const RSS_FEEDS = [
  { url: "https://www.epa.gov/newsreleases/search/rss", source: "EPA", priority: "high" },
  {
    url: "https://www.epa.gov/newsreleases/search/rss/field_press_office/region-6-south-central-234",
    source: "EPA Region 6",
    priority: "high",
  },
  { url: "https://www.fws.gov/news/rss.xml", source: "USFWS", priority: "high" },
  { url: "https://www.tceq.texas.gov/news/news-releases.rss", source: "TCEQ", priority: "high" },
  {
    url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bagencies%5D%5B%5D=environmental-protection-agency&conditions%5Btype%5D%5B%5D=RULE&conditions%5Btype%5D%5B%5D=PRORULE",
    source: "Federal Register (EPA)",
    priority: "high",
  },
] as const;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Clean Water Act": ["clean water act", "cwa", "npdes", "wastewater", "discharge", "effluent"],
  Wetlands: ["wetland", "waters of the united states", "wotus", "section 404", "jurisdictional"],
  "Endangered Species": ["endangered species", "esa", "critical habitat", "threatened", "candidate species"],
  NEPA: ["nepa", "environmental impact statement", "eis", "environmental assessment", "ea"],
  "Air Quality": ["air quality", "naaqs", "emissions", "clean air act", "caa"],
  Stormwater: ["stormwater", "storm water", "msgp", "construction general permit"],
  "Drinking Water": ["drinking water", "sdwa", "safe drinking water", "public water system"],
  "Hazardous Waste": ["hazardous waste", "rcra", "superfund", "cercla", "remediation"],
  Wildlife: ["wildlife", "migratory bird", "hunting", "waterfowl", "habitat"],
  Agriculture: ["agriculture", "farm", "conservation", "usda", "eqip"],
};

const HIGH_IMPACT_KEYWORDS = [
  "final rule",
  "enforcement",
  "deadline",
  "violation",
  "penalty",
  "compliance",
  "notice of violation",
  "consent decree",
  "settlement",
  "emergency order",
];

const MEDIUM_IMPACT_KEYWORDS = ["proposed rule", "guidance", "draft", "comment period", "public notice", "request for comment"];

const DEADLINE_PATTERNS: RegExp[] = [
  /by\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
  /deadline[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
  /comment period closes?\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
  /due\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
  /through\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
];

function cleanHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function safeIsoDate(input?: string): string | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  if (!isNaN(d.getTime())) return d.toISOString();
  return undefined;
}

function categorizeItem(title: string, summary: string): string | undefined {
  const text = `${title} ${summary}`.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) return category;
  }
  return undefined;
}

function assessImpact(title: string, summary: string): Impact {
  const text = `${title} ${summary}`.toLowerCase();
  if (HIGH_IMPACT_KEYWORDS.some((k) => text.includes(k))) return "high";
  if (MEDIUM_IMPACT_KEYWORDS.some((k) => text.includes(k))) return "medium";
  return "low";
}

function extractDeadline(title: string, summary: string): string | undefined {
  const text = `${title} ${summary}`;
  for (const pattern of DEADLINE_PATTERNS) {
    const m = text.match(pattern);
    if (m?.[1]) {
      const iso = safeIsoDate(m[1]);
      if (iso) return iso;
    }
  }
  return undefined;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // kill tracking params (basic)
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
}

async function fetchFeed(feedConfig: (typeof RSS_FEEDS)[number]): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(feedConfig.url);

    return (feed.items || []).slice(0, 25).map((item) => {
      const title = cleanHtml(item.title || "");
      const summaryRaw = cleanHtml((item as any).contentSnippet || (item as any).content || "");
      const summary = summaryRaw.slice(0, 360);

      const category = categorizeItem(title, summaryRaw);
      const impact = assessImpact(title, summaryRaw);
      const deadline = extractDeadline(title, summaryRaw);

      const publishedAt =
        safeIsoDate((item as any).isoDate) ||
        safeIsoDate(item.pubDate || "") ||
        safeIsoDate((item as any).published) ||
        new Date().toISOString();

      const link = normalizeUrl(item.link || (item as any).guid || "");

      return {
        title,
        link,
        source: feedConfig.source,
        publishedAt,
        summary,
        category,
        impact,
        deadline,
      };
    });
  } catch (error) {
    console.error(`Failed to fetch ${feedConfig.source}:`, error);
    return [];
  }
}

export async function GET() {
  try {
    const results = await Promise.all(RSS_FEEDS.map((f) => fetchFeed(f)));
    const all = results.flat().filter((x) => x.title && x.link);

    // Dedupe (same link OR same title+source)
    const seen = new Set<string>();
    const deduped: FeedItem[] = [];
    for (const it of all) {
      const key = `${it.link}`.toLowerCase() || `${it.source}::${it.title}`.toLowerCase();
      const key2 = `${it.source}::${it.title}`.toLowerCase();
      if (seen.has(key) || seen.has(key2)) continue;
      seen.add(key);
      seen.add(key2);
      deduped.push(it);
    }

    // Sort newest first
    deduped.sort((a, b) => {
      const A = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const B = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return B - A;
    });

    const items = deduped.slice(0, 60);

    return Response.json(
      { items, count: items.length, generatedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "no-store, must-revalidate",
          "CDN-Cache-Control": "no-store",
          "Vercel-CDN-Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch environmental updates:", error);

    return Response.json(
      { items: [], error: "Unable to fetch updates at this time. Please try again later." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

