/**
 * /app/api/texas-updates/tx.route.ts
 * 
 * TEXAS ENVIRONMENTAL INTELLIGENCE
 * 
 * Focus: Land development, construction permits, hunting access,
 * conservation, public land, infrastructure projects
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
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; TexasEnvironmentalIntel/1.0)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

const TEXAS_FEEDS = [
  { 
    url: "https://www.tceq.texas.gov/news/news-releases.rss", 
    source: "TCEQ", 
    priority: "high" as const,
    requiresTexas: false 
  },
  { 
    url: "https://tpwd.texas.gov/newsmedia/releases/rss.xml", 
    source: "TPWD", 
    priority: "high" as const,
    requiresTexas: false 
  },
  { 
    url: "https://www.texastribune.org/feeds/topic/energy-environment/", 
    source: "Texas Tribune", 
    priority: "high" as const,
    requiresTexas: false 
  },
  { 
    url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bterm%5D=Texas&conditions%5Btype%5D%5B%5D=RULE&conditions%5Btype%5D%5B%5D=PRORULE&order=newest", 
    source: "Federal Register", 
    priority: "medium" as const,
    requiresTexas: true 
  },
];

const TEXAS_CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Land Development": ["land development", "subdivision", "master plan", "commercial development", "residential development", "site plan", "zoning", "annexation", "platting"],
  "Construction Permits": ["construction permit", "building permit", "site development", "grading permit", "erosion control", "stormwater permit", "construction authorization", "storm water"],
  "Hunting & Wildlife": ["hunting", "hunting season", "game management", "wildlife", "deer", "waterfowl", "dove", "turkey", "public hunting land", "wildlife management area", "wma", "migratory bird", "duck", "goose"],
  "Public Land": ["public land", "state park", "public access", "land acquisition", "conservation easement", "public hunting", "recreational access", "park opening"],
  "Water Rights": ["water rights", "water permit", "groundwater", "surface water", "river authority", "water district", "edwards aquifer", "trinity aquifer", "aquifer", "water quality"],
  "Air Permits": ["air permit", "air quality", "emissions", "title v", "prevention of significant deterioration", "psd permit", "nonattainment", "air authorization"],
  "Infrastructure": ["infrastructure", "highway", "pipeline", "transmission line", "utility", "transportation project", "txdot", "road construction"],
  "Coastal & Wetlands": ["coastal", "wetland", "gulf coast", "marsh", "coastal zone", "section 404", "dredge and fill", "beach"],
  "Energy & Mining": ["oil and gas", "pipeline", "mining", "quarry", "aggregate", "hydraulic fracturing", "drilling", "fracking", "natural gas"],
  "Conservation": ["conservation", "habitat", "restoration", "mitigation", "endangered species", "biological opinion", "threatened species"],
};

const TEXAS_LOCATIONS = [
  { keywords: ["austin", "travis county", "williamson county"], name: "Austin" },
  { keywords: ["dallas", "fort worth", "dfw", "tarrant county", "collin county", "denton county"], name: "DFW" },
  { keywords: ["houston", "harris county", "montgomery county", "fort bend"], name: "Houston" },
  { keywords: ["san antonio", "bexar county"], name: "San Antonio" },
  { keywords: ["el paso"], name: "El Paso" },
  { keywords: ["corpus christi", "nueces county"], name: "Corpus Christi" },
  { keywords: ["lubbock"], name: "Lubbock" },
  { keywords: ["amarillo"], name: "Amarillo" },
  { keywords: ["midland", "odessa"], name: "Midland-Odessa" },
  { keywords: ["mckinney", "frisco", "plano", "allen", "richardson"], name: "North Dallas" },
  { keywords: ["round rock", "georgetown", "cedar park", "leander"], name: "North Austin" },
  { keywords: ["the woodlands", "conroe", "spring"], name: "North Houston" },
  { keywords: ["west texas", "permian basin"], name: "West Texas" },
  { keywords: ["south texas", "rio grande valley", "rgv"], name: "South Texas" },
  { keywords: ["east texas", "piney woods"], name: "East Texas" },
  { keywords: ["texas coast", "gulf coast", "coastal texas"], name: "Texas Coast" },
  { keywords: ["hill country", "central texas"], name: "Hill Country" },
  { keywords: ["panhandle", "texas panhandle"], name: "Panhandle" },
];

const TEXAS_HIGH_IMPACT = ["major development", "master plan", "billion", "million", "new hunting land", "public land acquisition", "conservation easement", "infrastructure project", "pipeline approval", "major permit", "zoning change", "annexation", "land purchase", "hunting access", "emergency order", "enforcement action", "settlement"];
const TEXAS_MEDIUM_IMPACT = ["permit approved", "public notice", "comment period", "planning commission", "city council", "hearing", "application", "proposed rule", "authorization"];
const TEXAS_LOW_VALUE = ["office closed", "holiday hours", "staff announcement", "awards ceremony", "recognition", "employee spotlight"];

async function fetchTexasFeed(feedConfig: typeof TEXAS_FEEDS[number]): Promise<FeedItem[]> {
  try {
    console.log(`[TEXAS-INTEL] Fetching ${feedConfig.source}...`);
    const feed = await parser.parseURL(feedConfig.url);

    const items = (feed.items || [])
      .slice(0, 40)
      .filter((item) => {
        const title = item.title || "";
        const text = `${title} ${(item as any).contentSnippet || ""}`.toLowerCase();

        if (TEXAS_LOW_VALUE.some((kw) => text.includes(kw))) return false;
        if (feedConfig.requiresTexas && !text.includes("texas")) return false;

        if (feedConfig.source === "TCEQ" || feedConfig.source === "TPWD") {
          return text.includes("permit") || text.includes("land") || text.includes("hunting") || text.includes("development") || text.includes("construction") || text.includes("water") || text.includes("air") || text.includes("public") || text.includes("wildlife") || text.includes("season");
        }

        return TEXAS_HIGH_IMPACT.some((kw) => text.includes(kw)) || TEXAS_MEDIUM_IMPACT.some((kw) => text.includes(kw)) || text.includes("development") || text.includes("construction") || text.includes("permit") || text.includes("land") || text.includes("hunting") || text.includes("wildlife") || text.includes("conservation");
      })
      .map((item) => {
        const title = cleanText(item.title || "");
        const summaryRaw = cleanText((item as any).contentSnippet || (item as any).content || "");
        const summary = summaryRaw.substring(0, 350);

        const category = categorizeTexasItem(title, summaryRaw);
        const location = extractTexasLocation(title, summaryRaw);
        const impact = assessTexasImpact(title, summaryRaw);
        const deadline = extractDeadline(title, summaryRaw);

        const publishedAt = safeIsoDate((item as any).isoDate) || safeIsoDate(item.pubDate || "") || safeIsoDate((item as any).published) || new Date().toISOString();
        const link = normalizeUrl(item.link || (item as any).guid || "");

        return { title, link, source: feedConfig.source, publishedAt, summary, category, location, impact, deadline };
      });

    console.log(`[TEXAS-INTEL] ${feedConfig.source}: ${items.length} items after filtering`);
    return items;
  } catch (error) {
    console.error(`[TEXAS-INTEL] Failed to fetch ${feedConfig.source}:`, error);
    return [];
  }
}

function categorizeTexasItem(title: string, summary: string): string | undefined {
  const text = `${title} ${summary}`.toLowerCase();
  for (const [category, keywords] of Object.entries(TEXAS_CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) return category;
  }
  return undefined;
}

function extractTexasLocation(title: string, summary: string): string | undefined {
  const text = `${title} ${summary}`.toLowerCase();
  for (const loc of TEXAS_LOCATIONS) {
    if (loc.keywords.some((k) => text.includes(k))) return loc.name;
  }
  return undefined;
}

function assessTexasImpact(title: string, summary: string): Impact {
  const text = `${title} ${summary}`.toLowerCase();
  if (TEXAS_HIGH_IMPACT.some((k) => text.includes(k))) return "high";
  if (TEXAS_MEDIUM_IMPACT.some((k) => text.includes(k))) return "medium";
  return "low";
}

function extractDeadline(title: string, summary: string): string | undefined {
  const text = `${title} ${summary}`;
  const patterns = [
    /by\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /deadline[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /comment period closes?\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /comments? due\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /through\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /until\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
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
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function safeIsoDate(input?: string): string | undefined {
  if (!input) return undefined;
  try {
    const d = new Date(input);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch (e) {}
  return undefined;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
}

export async function GET() {
  try {
    console.log("[TEXAS-INTEL] Starting Texas environmental intelligence fetch...");

    const results = await Promise.allSettled(TEXAS_FEEDS.map((feed) => fetchTexasFeed(feed)));

    const allItems: FeedItem[] = [];
    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        allItems.push(...result.value);
      } else {
        console.error(`[TEXAS-INTEL] Feed ${TEXAS_FEEDS[idx].source} failed:`, result.reason);
      }
    });

    console.log(`[TEXAS-INTEL] Fetched ${allItems.length} total items from all sources`);

    if (allItems.length === 0) {
      console.warn("[TEXAS-INTEL] No items fetched from any source");
      return Response.json(
        { items: [], count: 0, error: "No updates available at this time. Please try again later.", generatedAt: new Date().toISOString(), sources: ["TCEQ", "TPWD", "Texas Tribune", "Federal Register"] },
        { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } }
      );
    }

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

    deduped.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    const items = deduped.slice(0, 60);

    const categoryDist: Record<string, number> = {};
    const locationDist: Record<string, number> = {};
    const sourceDist: Record<string, number> = {};
    
    items.forEach((item) => {
      const cat = item.category || "General";
      const loc = item.location || "Statewide";
      categoryDist[cat] = (categoryDist[cat] || 0) + 1;
      locationDist[loc] = (locationDist[loc] || 0) + 1;
      sourceDist[item.source] = (sourceDist[item.source] || 0) + 1;
    });

    console.log("[TEXAS-INTEL] Category distribution:", categoryDist);
    console.log("[TEXAS-INTEL] Location distribution:", locationDist);
    console.log("[TEXAS-INTEL] Source distribution:", sourceDist);
    console.log(`[TEXAS-INTEL] Returning ${items.length} deduplicated items`);

    return Response.json(
      {
        items,
        count: items.length,
        generatedAt: new Date().toISOString(),
        sources: Array.from(new Set(items.map(i => i.source))),
        focusAreas: Object.keys(TEXAS_CATEGORY_KEYWORDS),
        stats: { categories: categoryDist, locations: locationDist, sources: sourceDist },
      },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
    );
  } catch (error) {
    console.error("[TEXAS-INTEL] Fatal error:", error);
    return Response.json(
      { items: [], count: 0, error: "Unable to fetch Texas environmental updates. Please try again later.", generatedAt: new Date().toISOString() },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
