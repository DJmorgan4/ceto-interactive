/**
 * /app/api/texas-updates/route.ts
 * 
 * TEXAS ENVIRONMENTAL INTELLIGENCE
 * 
 * Focus: Land development, construction permits, hunting access,
 * conservation, public land, infrastructure projects
 * 
 * Sources:
 * - TCEQ (Texas Commission on Environmental Quality)
 * - Texas Parks & Wildlife Department
 * - Texas Tribune (environment/land use)
 * - Austin Monitor (development/permits)
 * - Houston Chronicle (development)
 * - Dallas Morning News (development)
 */

import Parser from "rss-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 3600;

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

const parser = new Parser({
  timeout: 12000,
  headers: {
    "User-Agent": "Texas-Environmental-Intelligence/1.0",
    Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
  },
});

/**
 * TEXAS-SPECIFIC SOURCES
 */
const TEXAS_FEEDS = [
  // State agencies
  { url: "https://www.tceq.texas.gov/news/news-releases.rss", source: "TCEQ", priority: "high" },
  { url: "https://tpwd.texas.gov/newsmedia/releases/rss.xml", source: "TPWD", priority: "high" },
  
  // News outlets covering development/land
  { url: "https://www.texastribune.org/feeds/topic/energy-environment/", source: "Texas Tribune", priority: "high" },
  { url: "https://www.houstonchronicle.com/business/energy/rss/", source: "Houston Chronicle", priority: "medium" },
] as const;

/**
 * TEXAS-FOCUSED CATEGORIES
 */
const TEXAS_CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Land Development": [
    "land development",
    "subdivision",
    "master plan",
    "commercial development",
    "residential development",
    "site plan",
    "zoning",
    "annexation",
  ],
  "Construction Permits": [
    "construction permit",
    "building permit",
    "site development",
    "grading permit",
    "erosion control",
    "stormwater permit",
    "construction authorization",
  ],
  "Hunting & Wildlife": [
    "hunting",
    "hunting season",
    "game management",
    "wildlife",
    "deer",
    "waterfowl",
    "dove",
    "turkey",
    "public hunting land",
    "wildlife management area",
    "wma",
  ],
  "Public Land": [
    "public land",
    "state park",
    "public access",
    "land acquisition",
    "conservation easement",
    "public hunting",
    "recreational access",
  ],
  "Water Rights": [
    "water rights",
    "water permit",
    "groundwater",
    "surface water",
    "river authority",
    "water district",
    "edwards aquifer",
    "trinity aquifer",
  ],
  "Air Permits": [
    "air permit",
    "air quality",
    "emissions",
    "title v",
    "prevention of significant deterioration",
    "psd permit",
    "nonattainment",
  ],
  "Infrastructure": [
    "infrastructure",
    "highway",
    "pipeline",
    "transmission line",
    "utility",
    "transportation project",
    "txdot",
  ],
  "Coastal & Wetlands": [
    "coastal",
    "wetland",
    "gulf coast",
    "marsh",
    "coastal zone",
    "section 404",
    "dredge and fill",
  ],
  "Energy & Mining": [
    "oil and gas",
    "pipeline",
    "mining",
    "quarry",
    "aggregate",
    "hydraulic fracturing",
    "drilling",
  ],
  "Conservation": [
    "conservation",
    "habitat",
    "restoration",
    "mitigation",
    "endangered species",
    "biological opinion",
  ],
};

/**
 * TEXAS CITIES/REGIONS
 */
const TEXAS_LOCATIONS = [
  // Major metros
  { keywords: ["austin", "travis county", "williamson county"], name: "Austin" },
  { keywords: ["dallas", "fort worth", "dfw", "tarrant county", "collin county"], name: "DFW" },
  { keywords: ["houston", "harris county", "montgomery county"], name: "Houston" },
  { keywords: ["san antonio", "bexar county"], name: "San Antonio" },
  
  // Other major cities
  { keywords: ["el paso"], name: "El Paso" },
  { keywords: ["corpus christi", "nueces county"], name: "Corpus Christi" },
  { keywords: ["lubbock"], name: "Lubbock" },
  { keywords: ["amarillo"], name: "Amarillo" },
  
  // Growing areas
  { keywords: ["mckinney", "frisco", "plano", "allen"], name: "North Dallas" },
  { keywords: ["round rock", "georgetown", "cedar park"], name: "North Austin" },
  { keywords: ["the woodlands", "conroe"], name: "North Houston" },
  
  // Regions
  { keywords: ["west texas", "permian basin"], name: "West Texas" },
  { keywords: ["south texas", "rio grande valley"], name: "South Texas" },
  { keywords: ["east texas", "piney woods"], name: "East Texas" },
  { keywords: ["texas coast", "gulf coast"], name: "Texas Coast" },
  { keywords: ["hill country"], name: "Hill Country" },
  { keywords: ["panhandle"], name: "Panhandle" },
];

/**
 * HIGH-VALUE KEYWORDS FOR TEXAS
 */
const TEXAS_HIGH_IMPACT = [
  "major development",
  "master plan",
  "billion",
  "million",
  "new hunting land",
  "public land acquisition",
  "conservation easement",
  "infrastructure project",
  "pipeline approval",
  "major permit",
  "zoning change",
  "annexation",
  "land purchase",
  "hunting access",
];

const TEXAS_MEDIUM_IMPACT = [
  "permit approved",
  "public notice",
  "comment period",
  "planning commission",
  "city council",
  "hearing",
  "application",
];

/**
 * LOW-VALUE - FILTER OUT
 */
const TEXAS_LOW_VALUE = [
  "office closed",
  "holiday hours",
  "staff announcement",
  "awards ceremony",
  "recognition",
];

/**
 * Fetch from Texas feeds with smart filtering
 */
async function fetchTexasFeed(feedConfig: (typeof TEXAS_FEEDS)[number]): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(feedConfig.url);

    return (feed.items || [])
      .slice(0, 30)
      .filter((item) => {
        const text = `${item.title || ""} ${(item as any).contentSnippet || ""}`.toLowerCase();

        // Filter OUT low-value
        if (TEXAS_LOW_VALUE.some((kw) => text.includes(kw))) {
          return false;
        }

        // For TCEQ/TPWD: keep anything about land, hunting, permits, development
        if (feedConfig.source === "TCEQ" || feedConfig.source === "TPWD") {
          return (
            text.includes("permit") ||
            text.includes("land") ||
            text.includes("hunting") ||
            text.includes("development") ||
            text.includes("construction") ||
            text.includes("water") ||
            text.includes("air") ||
            text.includes("public")
          );
        }

        // For news outlets: keep if matches high/medium keywords
        return (
          TEXAS_HIGH_IMPACT.some((kw) => text.includes(kw)) ||
          TEXAS_MEDIUM_IMPACT.some((kw) => text.includes(kw)) ||
          text.includes("development") ||
          text.includes("construction") ||
          text.includes("permit") ||
          text.includes("land") ||
          text.includes("hunting")
        );
      })
      .map((item) => {
        const title = cleanText(item.title || "");
        const summaryRaw = cleanText((item as any).contentSnippet || (item as any).content || "");
        const summary = summaryRaw.substring(0, 350);

        const category = categorizeTexasItem(title, summaryRaw);
        const location = extractTexasLocation(title, summaryRaw);
        const impact = assessTexasImpact(title, summaryRaw);
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
          location,
          impact,
          deadline,
        };
      });
  } catch (error) {
    console.error(`[TEXAS-INTEL] Failed to fetch ${feedConfig.source}:`, error);
    return [];
  }
}

/**
 * Categorize Texas items
 */
function categorizeTexasItem(title: string, summary: string): string | undefined {
  const text = `${title} ${summary}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(TEXAS_CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) {
      return category;
    }
  }
  
  return undefined;
}

/**
 * Extract Texas location
 */
function extractTexasLocation(title: string, summary: string): string | undefined {
  const text = `${title} ${summary}`.toLowerCase();
  
  for (const loc of TEXAS_LOCATIONS) {
    if (loc.keywords.some((k) => text.includes(k))) {
      return loc.name;
    }
  }
  
  return undefined;
}

/**
 * Assess impact for Texas items
 */
function assessTexasImpact(title: string, summary: string): Impact {
  const text = `${title} ${summary}`.toLowerCase();

  if (TEXAS_HIGH_IMPACT.some((k) => text.includes(k))) {
    return "high";
  }
  
  if (TEXAS_MEDIUM_IMPACT.some((k) => text.includes(k))) {
    return "medium";
  }
  
  return "low";
}

/**
 * Extract deadlines
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
 * Utility functions
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

function safeIsoDate(input?: string): string | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  if (!isNaN(d.getTime())) return d.toISOString();
  return undefined;
}

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
    console.log("[TEXAS-INTEL] Fetching Texas environmental intelligence...");

    // Fetch from all Texas sources
    const results = await Promise.all(TEXAS_FEEDS.map((feed) => fetchTexasFeed(feed)));

    const allItems = results.flat().filter((x) => x.title && x.link);

    console.log(`[TEXAS-INTEL] Fetched ${allItems.length} total items`);

    // Deduplicate
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

    const items = deduped.slice(0, 50);

    // Log distribution
    const categoryDist: Record<string, number> = {};
    const locationDist: Record<string, number> = {};
    
    items.forEach((item) => {
      const cat = item.category || "General";
      const loc = item.location || "Statewide";
      categoryDist[cat] = (categoryDist[cat] || 0) + 1;
      locationDist[loc] = (locationDist[loc] || 0) + 1;
    });

    console.log("[TEXAS-INTEL] Category distribution:", categoryDist);
    console.log("[TEXAS-INTEL] Location distribution:", locationDist);
    console.log(`[TEXAS-INTEL] Returning ${items.length} items`);

    return Response.json(
      {
        items,
        count: items.length,
        generatedAt: new Date().toISOString(),
        sources: ["TCEQ", "TPWD", "Texas Tribune", "Houston Chronicle"],
        focusAreas: ["Land Development", "Construction", "Hunting Access", "Public Land", "Infrastructure"],
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error) {
    console.error("[TEXAS-INTEL] Fatal error:", error);

    return Response.json(
      {
        items: [],
        error: "Unable to fetch Texas environmental updates. Please try again later.",
        generatedAt: new Date().toISOString(),
      },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
