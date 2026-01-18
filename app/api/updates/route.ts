/**
 * /app/api/updates/route.ts
 * 
 * HIGH-SIGNAL ENVIRONMENTAL INTELLIGENCE FEED
 * 
 * Sources:
 * - Federal Register API (EPA significant rules, enforcement)
 * - EPA Newsroom RSS (settlements, major announcements)
 * - EPA Region 6 RSS (Texas/South Central specific)
 * - TCEQ RSS (Texas state-level)
 * - USFWS RSS (endangered species, habitat)
 * - Federal Register RSS (EPA rules feed)
 */

import Parser from "rss-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache for 1 hour

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
    "User-Agent": "Environmental-Intelligence-Platform/1.0",
    Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
  },
});

// RSS feeds (kept for regional/state sources that don't have JSON APIs)
const RSS_FEEDS = [
  { url: "https://www.epa.gov/newsreleases/search/rss", source: "EPA Newsroom", priority: "high" },
  {
    url: "https://www.epa.gov/newsreleases/search/rss/field_press_office/region-6-south-central-234",
    source: "EPA Region 6",
    priority: "high",
  },
  { url: "https://www.tceq.texas.gov/news/news-releases.rss", source: "TCEQ", priority: "high" },
] as const;

/**
 * CATEGORY KEYWORDS - Updated for developer/consultant focus
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Air Quality": ["air quality", "naaqs", "emissions", "ozone", "air plan", "sip", "attainment"],
  "Water Quality": [
    "water quality",
    "npdes",
    "discharge",
    "clean water act",
    "cwa",
    "404",
    "wetland",
    "waters of the united states",
    "wotus",
  ],
  "Site Cleanup": ["superfund", "cercla", "remediation", "cleanup", "brownfield", "hazardous site"],
  "Waste Management": ["hazardous waste", "rcra", "solid waste", "waste management", "landfill"],
  NEPA: ["nepa", "environmental impact statement", "eis", "environmental assessment", "ea", "finding of no significant"],
  Enforcement: [
    "enforcement",
    "settlement",
    "consent decree",
    "penalty",
    "violation",
    "compliance order",
    "notice of violation",
  ],
  Permits: ["permit", "authorization", "approval", "individual permit", "general permit", "coverage"],
  "Endangered Species": ["endangered species", "esa", "critical habitat", "threatened", "section 7", "biological opinion"],
  Toxics: ["toxic", "chemical", "pcb", "asbestos", "lead", "pfas", "per- and polyfluoroalkyl"],
  "Drinking Water": ["drinking water", "sdwa", "safe drinking water", "public water system", "pwsid"],
};

/**
 * HIGH-VALUE KEYWORDS - What developers/consultants need to see
 */
const HIGH_IMPACT_KEYWORDS = [
  "final rule",
  "enforcement action",
  "settlement",
  "consent decree",
  "penalty",
  "million",
  "emergency order",
  "significant",
  "major permit",
  "superfund",
  "delisting",
];

const MEDIUM_IMPACT_KEYWORDS = [
  "proposed rule",
  "comment period",
  "public notice",
  "draft permit",
  "guidance",
  "approval",
  "authorization",
];

/**
 * LOW-VALUE KEYWORDS - Filter these OUT
 */
const LOW_VALUE_KEYWORDS = [
  "bird song",
  "pesticide tolerance",
  "minor editorial",
  "technical correction",
  "extension of comment period",
  "administrative",
];

/**
 * Fetch from Federal Register JSON API
 * This is the BEST source - structured data, significant flag, reliable
 */
async function fetchFederalRegisterAPI(): Promise<FeedItem[]> {
  try {
    const url = new URL("https://www.federalregister.gov/api/v1/documents.json");

    url.searchParams.append("conditions[agencies][]", "environmental-protection-agency");
    url.searchParams.append("conditions[type][]", "RULE");
    url.searchParams.append("conditions[type][]", "PRORULE");
    url.searchParams.append("conditions[type][]", "NOTICE");
    url.searchParams.append("per_page", "30");
    url.searchParams.append("order", "newest");

    const fields = ["title", "abstract", "html_url", "publication_date", "action", "significant", "type"];
    fields.forEach((f) => url.searchParams.append("fields[]", f));

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Environmental-Intelligence-Platform/1.0" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`Federal Register API failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const results = data.results || [];

    // CRITICAL: Filter for HIGH-VALUE content only
    return results
      .filter((item: any) => {
        const text = `${item.title} ${item.abstract || ""}`.toLowerCase();

        // Exclude low-value content
        if (LOW_VALUE_KEYWORDS.some((kw) => text.includes(kw))) {
          return false;
        }

        // Include if: significant OR contains high-value keywords
        return (
          item.significant === true ||
          text.includes("final rule") ||
          text.includes("proposed rule") ||
          text.includes("enforcement") ||
          text.includes("cleanup") ||
          text.includes("superfund") ||
          text.includes("permit") ||
          text.includes("nepa") ||
          text.includes("settlement") ||
          text.includes("consent decree") ||
          text.includes("rcra") ||
          text.includes("npdes") ||
          text.includes("404") ||
          text.includes("wetland") ||
          text.includes("air quality") ||
          text.includes("water quality") ||
          text.includes("brownfield") ||
          text.includes("remediation") ||
          text.includes("million")
        );
      })
      .map((item: any) => ({
        title: item.title || "Untitled",
        link: item.html_url,
        source: "Federal Register (EPA)",
        publishedAt: item.publication_date,
        summary: item.abstract ? cleanText(item.abstract).substring(0, 350) : undefined,
        category: categorizeItem(item.title, item.abstract || ""),
        impact: item.significant ? "high" : assessImpact(item.title, item.abstract || ""),
        deadline: extractDeadline(item.title, item.abstract || ""),
      }));
  } catch (err) {
    console.error("Federal Register API error:", err);
    return [];
  }
}

/**
 * Fetch from RSS feeds with high-value filtering
 */
async function fetchRSSFeed(feedConfig: (typeof RSS_FEEDS)[number]): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(feedConfig.url);

    return (feed.items || [])
      .slice(0, 25)
      .filter((item) => {
        // Filter out low-value content at RSS level too
        const text = `${item.title || ""} ${(item as any).contentSnippet || ""}`.toLowerCase();

        if (LOW_VALUE_KEYWORDS.some((kw) => text.includes(kw))) {
          return false;
        }

        // Only include if it has high/medium value keywords OR is enforcement/settlement
        return (
          HIGH_IMPACT_KEYWORDS.some((kw) => text.includes(kw)) ||
          MEDIUM_IMPACT_KEYWORDS.some((kw) => text.includes(kw)) ||
          text.includes("settlement") ||
          text.includes("enforcement") ||
          text.includes("million") ||
          text.includes("cleanup") ||
          text.includes("permit")
        );
      })
      .map((item) => {
        const title = cleanText(item.title || "");
        const summaryRaw = cleanText((item as any).contentSnippet || (item as any).content || "");
        const summary = summaryRaw.substring(0, 350);

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

/**
 * Clean HTML and normalize text
 */
function cleanText(text: string): string {
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

/**
 * Safe ISO date conversion
 */
function safeIsoDate(input?: string): string | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  if (!isNaN(d.getTime())) return d.toISOString();
  return undefined;
}

/**
 * Categorize by keywords
 */
function categorizeItem(title: string, summary: string): string | undefined {
  const text = `${title} ${summary}`.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) return category;
  }
  return undefined;
}

/**
 * Assess impact level
 */
function assessImpact(title: string, summary: string): Impact {
  const text = `${title} ${summary}`.toLowerCase();

  if (HIGH_IMPACT_KEYWORDS.some((k) => text.includes(k))) return "high";
  if (MEDIUM_IMPACT_KEYWORDS.some((k) => text.includes(k))) return "medium";
  return "low";
}

/**
 * Extract deadlines from text
 */
function extractDeadline(title: string, summary: string): string | undefined {
  const text = `${title} ${summary}`;
  const patterns = [
    /by\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /deadline[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /comment period closes?\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /due\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /through\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
  ];

  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m?.[1]) {
      const iso = safeIsoDate(m[1]);
      if (iso) return iso;
    }
  }
  return undefined;
}

/**
 * Normalize URLs (remove tracking params)
 */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((p) =>
      u.searchParams.delete(p)
    );
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Main GET handler
 */
export async function GET() {
  try {
    console.log("[ENV-INTEL] Fetching environmental intelligence feeds...");

    // Fetch Federal Register API (primary source) + RSS feeds in parallel
    const [federalRegisterItems, ...rssResults] = await Promise.all([
      fetchFederalRegisterAPI(),
      ...RSS_FEEDS.map((feed) => fetchRSSFeed(feed)),
    ]);

    console.log(
      `[ENV-INTEL] Fetched: FedReg=${federalRegisterItems.length}, RSS=${rssResults.reduce((sum, r) => sum + r.length, 0)}`
    );

    // Combine all items
    const allItems = [federalRegisterItems, ...rssResults].flat().filter((x) => x.title && x.link);

    // Deduplicate by link and title+source
    const seen = new Set<string>();
    const deduped: FeedItem[] = [];

    for (const item of allItems) {
      const linkKey = item.link.toLowerCase();
      const titleKey = `${item.source}::${item.title}`.toLowerCase();

      if (seen.has(linkKey) || seen.has(titleKey)) continue;

      seen.add(linkKey);
      seen.add(titleKey);
      deduped.push(item);
    }

    // Sort by date (newest first)
    deduped.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    // Take top 50 items
    const items = deduped.slice(0, 50);

    console.log(`[ENV-INTEL] Returning ${items.length} high-value items`);

    // Log category distribution for monitoring
    const categoryDist: Record<string, number> = {};
    items.forEach((item) => {
      const cat = item.category || "General";
      categoryDist[cat] = (categoryDist[cat] || 0) + 1;
    });
    console.log("[ENV-INTEL] Category distribution:", categoryDist);

    return Response.json(
      {
        items,
        count: items.length,
        generatedAt: new Date().toISOString(),
        sources: ["Federal Register API", "EPA Newsroom", "EPA Region 6", "TCEQ"],
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error) {
    console.error("[ENV-INTEL] Fatal error:", error);

    return Response.json(
      {
        items: [],
        error: "Unable to fetch environmental updates. Please try again later.",
        generatedAt: new Date().toISOString(),
      },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
