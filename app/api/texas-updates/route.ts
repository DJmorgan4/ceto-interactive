/**
 * /app/api/texas-updates/route.ts
 * 
 * COMPREHENSIVE TEXAS ENVIRONMENTAL INTELLIGENCE PLATFORM
 * 
 * This aggregates from 20+ sources across:
 * - State agencies (TCEQ, TPWD, RRC, GLO)
 * - Federal agencies (EPA, USACE, DOI)
 * - News outlets (Tribune, Monitor, regional papers)
 * - Local governments (major cities)
 * - Industry sources
 */

import Parser from "rss-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 1800; // 30 minutes

type Impact = "high" | "medium" | "low";
type ArticleType = "permit" | "enforcement" | "policy" | "hunting" | "development" | "conservation" | "general";

type FeedItem = {
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
};

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; TexasEnvironmentalIntel/1.0)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

/**
 * COMPREHENSIVE TEXAS INTELLIGENCE SOURCES
 * 20+ verified RSS feeds across government, news, and industry
 */
const COMPREHENSIVE_FEEDS = [
  // ==================== STATE AGENCIES ====================
  { 
    url: "https://www.tceq.texas.gov/news/news-releases.rss", 
    source: "TCEQ News", 
    priority: "high" as const,
  },
  { 
    url: "https://tpwd.texas.gov/newsmedia/releases/?format=rss", 
    source: "TPWD", 
    priority: "high" as const,
  },
  { 
    url: "https://www.rrc.texas.gov/news/rss/", 
    source: "Railroad Commission", 
    priority: "high" as const,
  },
  { 
    url: "https://www.glo.texas.gov/the-glo/news/rss.xml", 
    source: "TX General Land Office", 
    priority: "medium" as const,
  },

  // ==================== TEXAS NEWS OUTLETS ====================
  { 
    url: "https://www.texastribune.org/feeds/latest/", 
    source: "Texas Tribune", 
    priority: "high" as const,
  },
  { 
    url: "https://www.austinmonitor.com/feed/", 
    source: "Austin Monitor", 
    priority: "high" as const,
  },
  { 
    url: "https://www.houstonchronicle.com/rss/feed/Texas-165.php", 
    source: "Houston Chronicle", 
    priority: "medium" as const,
  },
  { 
    url: "https://www.dallasnews.com/feed/", 
    source: "Dallas Morning News", 
    priority: "medium" as const,
  },
  { 
    url: "https://www.statesman.com/rss/", 
    source: "Austin American-Statesman", 
    priority: "medium" as const,
  },
  { 
    url: "https://www.expressnews.com/rss/feed/San-Antonio-and-South-Texas-News-151.php", 
    source: "San Antonio Express-News", 
    priority: "medium" as const,
  },

  // ==================== FEDERAL SOURCES ====================
  { 
    url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bterm%5D=Texas%20environmental&conditions%5Btype%5D%5B%5D=RULE&order=newest", 
    source: "Federal Register (TX)", 
    priority: "high" as const,
  },
  { 
    url: "https://www.epa.gov/tx/rss.xml", 
    source: "EPA Region 6", 
    priority: "high" as const,
  },
  { 
    url: "https://www.swf.usace.army.mil/RSS/Rss.aspx?RSS=LatestNews", 
    source: "US Army Corps (Fort Worth)", 
    priority: "medium" as const,
  },
  { 
    url: "https://www.swg.usace.army.mil/RSS/Rss.aspx?RSS=LatestNews", 
    source: "US Army Corps (Galveston)", 
    priority: "medium" as const,
  },

  // ==================== REGIONAL SOURCES ====================
  { 
    url: "https://www.mysanantonio.com/rss/feed/mySA-Environment-11668.php", 
    source: "mySA Environment", 
    priority: "low" as const,
  },
  { 
    url: "https://www.chron.com/rss/feed/Texas-165.php", 
    source: "Chron Texas", 
    priority: "low" as const,
  },

  // ==================== INDUSTRY & TRADE ====================
  { 
    url: "https://www.texasmonthly.com/feed/", 
    source: "Texas Monthly", 
    priority: "low" as const,
  },
  { 
    url: "https://www.houstonpublicmedia.org/articles/news/energy-environment/rss.xml", 
    source: "Houston Public Media", 
    priority: "medium" as const,
  },
  { 
    url: "https://kut.org/term/environment/feed", 
    source: "KUT Austin", 
    priority: "medium" as const,
  },
  { 
    url: "https://www.kera.org/category/environment/feed/", 
    source: "KERA Dallas", 
    priority: "medium" as const,
  },
];

// Enhanced category keywords
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Land Development": [
    "land development", "subdivision", "master plan", "commercial development", 
    "residential development", "site plan", "zoning", "annexation", "platting",
    "rezoning", "land use", "comprehensive plan", "development agreement"
  ],
  "Construction Permits": [
    "construction permit", "building permit", "site development", "grading permit", 
    "erosion control", "stormwater permit", "construction authorization", "storm water",
    "npdes", "swppp", "grading plan"
  ],
  "Hunting & Wildlife": [
    "hunting", "hunting season", "game management", "wildlife", "deer", "waterfowl", 
    "dove", "turkey", "public hunting land", "wildlife management area", "wma", 
    "migratory bird", "duck", "goose", "bag limit", "season dates", "harvest"
  ],
  "Public Land Access": [
    "public land", "state park", "public access", "land acquisition", "conservation easement", 
    "public hunting", "recreational access", "park opening", "trail", "outdoor recreation",
    "public property", "land trust"
  ],
  "Water & Aquifers": [
    "water rights", "water permit", "groundwater", "surface water", "river authority", 
    "water district", "edwards aquifer", "trinity aquifer", "aquifer", "water quality",
    "drought", "water supply", "reservoir", "lake level", "groundwater district"
  ],
  "Air Quality & Emissions": [
    "air permit", "air quality", "emissions", "title v", "prevention of significant deterioration", 
    "psd permit", "nonattainment", "air authorization", "ozone", "particulate matter",
    "emission reduction", "air monitoring"
  ],
  "Infrastructure Projects": [
    "infrastructure", "highway", "pipeline", "transmission line", "utility", 
    "transportation project", "txdot", "road construction", "toll road", "interstate",
    "bridge", "railway"
  ],
  "Coastal & Wetlands": [
    "coastal", "wetland", "gulf coast", "marsh", "coastal zone", "section 404", 
    "dredge and fill", "beach", "erosion", "shoreline", "coastal erosion",
    "mitigation bank", "wetland delineation"
  ],
  "Energy & Extraction": [
    "oil and gas", "pipeline", "mining", "quarry", "aggregate", "hydraulic fracturing", 
    "drilling", "fracking", "natural gas", "coal", "renewable energy", "wind farm",
    "solar farm", "power plant", "refinery", "petrochemical"
  ],
  "Conservation & Habitat": [
    "conservation", "habitat", "restoration", "mitigation", "endangered species", 
    "biological opinion", "threatened species", "critical habitat", "ecological",
    "biodiversity", "native species", "invasive species"
  ],
  "Enforcement & Compliance": [
    "enforcement action", "violation", "penalty", "fine", "compliance", "settlement",
    "consent decree", "notice of violation", "noncompliance", "corrective action"
  ],
  "Waste & Remediation": [
    "waste", "hazardous waste", "cleanup", "remediation", "superfund", "brownfield",
    "landfill", "recycling", "solid waste", "contamination", "pollution"
  ],
};

const TEXAS_LOCATIONS = [
  // Major metros
  { keywords: ["austin", "travis county", "williamson county", "hays county"], name: "Austin Metro" },
  { keywords: ["dallas", "fort worth", "dfw", "tarrant county", "collin county", "denton county", "rockwall"], name: "DFW Metroplex" },
  { keywords: ["houston", "harris county", "montgomery county", "fort bend", "brazoria", "galveston county"], name: "Houston Metro" },
  { keywords: ["san antonio", "bexar county", "comal county", "guadalupe county"], name: "San Antonio Metro" },
  
  // Other major cities
  { keywords: ["el paso"], name: "El Paso" },
  { keywords: ["corpus christi", "nueces county"], name: "Corpus Christi" },
  { keywords: ["lubbock"], name: "Lubbock" },
  { keywords: ["amarillo", "potter county"], name: "Amarillo" },
  { keywords: ["midland", "odessa", "ector county"], name: "Midland-Odessa" },
  { keywords: ["waco", "mclennan county"], name: "Waco" },
  { keywords: ["killeen", "temple", "bell county"], name: "Killeen-Temple" },
  { keywords: ["brownsville", "mcallen", "laredo"], name: "Border Region" },
  
  // Growing suburban areas
  { keywords: ["mckinney", "frisco", "plano", "allen", "richardson", "carrollton"], name: "North Dallas Suburbs" },
  { keywords: ["round rock", "georgetown", "cedar park", "leander", "pflugerville"], name: "North Austin Suburbs" },
  { keywords: ["the woodlands", "conroe", "spring", "tomball"], name: "North Houston Suburbs" },
  { keywords: ["katy", "sugar land", "pearland", "league city"], name: "West/South Houston Suburbs" },
  
  // Regions
  { keywords: ["west texas", "permian basin", "big bend"], name: "West Texas" },
  { keywords: ["south texas", "rio grande valley", "rgv", "valley"], name: "South Texas" },
  { keywords: ["east texas", "piney woods", "tyler", "longview"], name: "East Texas" },
  { keywords: ["texas coast", "gulf coast", "coastal texas", "port arthur", "beaumont"], name: "Texas Coast" },
  { keywords: ["hill country", "central texas", "fredericksburg", "kerrville"], name: "Hill Country" },
  { keywords: ["panhandle", "texas panhandle"], name: "Panhandle" },
];

const HIGH_IMPACT_KEYWORDS = [
  "major development", "master plan", "billion", "million", 
  "new hunting land", "public land acquisition", "conservation easement", 
  "infrastructure project", "pipeline approval", "major permit", 
  "zoning change", "annexation", "land purchase", "hunting access",
  "emergency order", "enforcement action", "settlement", "lawsuit",
  "record fine", "shutdown", "emergency response", "major spill",
  "drought emergency", "water shortage", "critical habitat"
];

const MEDIUM_IMPACT_KEYWORDS = [
  "permit approved", "public notice", "comment period", "planning commission", 
  "city council", "hearing", "application", "proposed rule", "authorization",
  "public hearing", "environmental assessment", "draft permit", "variance",
  "special use permit", "rezoning request"
];

const LOW_VALUE_FILTERS = [
  "office closed", "holiday hours", "awards ceremony", "employee spotlight",
  "newsletter", "calendar", "reminder", "birthday", "anniversary"
];

async function fetchFeed(feedConfig: typeof COMPREHENSIVE_FEEDS[number]): Promise<FeedItem[]> {
  try {
    console.log(`[TX-INTEL] Fetching ${feedConfig.source}...`);
    const feed = await parser.parseURL(feedConfig.url);
    
    if (!feed.items || feed.items.length === 0) {
      console.warn(`[TX-INTEL] ${feedConfig.source} returned no items`);
      return [];
    }

    console.log(`[TX-INTEL] ${feedConfig.source}: ${feed.items.length} raw items`);

    const items = feed.items
      .slice(0, 100)
      .filter((item) => {
        const title = (item.title || "").toLowerCase();
        const content = ((item as any).contentSnippet || (item as any).content || "").toLowerCase();
        const text = `${title} ${content}`;

        // Filter out obvious noise
        if (LOW_VALUE_FILTERS.some(kw => text.includes(kw))) {
          return false;
        }

        // Keep if it matches environmental/development keywords
        const isRelevant = 
          text.includes("environmental") ||
          text.includes("permit") ||
          text.includes("development") ||
          text.includes("construction") ||
          text.includes("water") ||
          text.includes("air") ||
          text.includes("land") ||
          text.includes("wildlife") ||
          text.includes("hunting") ||
          text.includes("conservation") ||
          text.includes("energy") ||
          text.includes("infrastructure") ||
          text.includes("wetland") ||
          text.includes("coastal") ||
          text.includes("regulation") ||
          text.includes("enforcement") ||
          text.includes("cleanup") ||
          text.includes("pollution") ||
          text.includes("emission") ||
          text.includes("habitat");

        return isRelevant;
      })
      .map((item, idx) => {
        const title = cleanText(item.title || "");
        const summaryRaw = cleanText((item as any).contentSnippet || (item as any).content || "");
        const summary = summaryRaw.substring(0, 400);
        const category = categorizeItem(title, summaryRaw);
        const location = extractLocation(title, summaryRaw);
        const impact = assessImpact(title, summaryRaw);
        const deadline = extractDeadline(title, summaryRaw);
        const type = determineType(title, summaryRaw, category);
        const tags = extractTags(title, summaryRaw);

        const publishedAt = 
          safeIsoDate((item as any).isoDate) || 
          safeIsoDate(item.pubDate || "") || 
          safeIsoDate((item as any).published) || 
          new Date().toISOString();

        const link = normalizeUrl(item.link || (item as any).guid || "");
        const id = `${feedConfig.source}-${idx}-${link.substring(link.length - 10)}`;

        return { 
          id,
          title, 
          link, 
          source: feedConfig.source, 
          publishedAt, 
          summary, 
          category, 
          location, 
          impact, 
          deadline,
          type,
          tags
        };
      });

    console.log(`[TX-INTEL] ${feedConfig.source}: ${items.length} items after filtering`);
    return items;
  } catch (error) {
    console.error(`[TX-INTEL] Failed to fetch ${feedConfig.source}:`, error);
    return [];
  }
}

function categorizeItem(title: string, summary: string): string | undefined {
  const text = `${title} ${summary}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) return category;
  }
  
  return undefined;
}

function extractLocation(title: string, summary: string): string | undefined {
  const text = `${title} ${summary}`.toLowerCase();
  
  for (const loc of TEXAS_LOCATIONS) {
    if (loc.keywords.some((k) => text.includes(k))) return loc.name;
  }
  
  return undefined;
}

function assessImpact(title: string, summary: string): Impact {
  const text = `${title} ${summary}`.toLowerCase();
  
  if (HIGH_IMPACT_KEYWORDS.some((k) => text.includes(k))) return "high";
  if (MEDIUM_IMPACT_KEYWORDS.some((k) => text.includes(k))) return "medium";
  return "low";
}

function determineType(title: string, summary: string, category?: string): ArticleType {
  const text = `${title} ${summary}`.toLowerCase();
  
  if (text.includes("permit") || category === "Construction Permits") return "permit";
  if (text.includes("enforcement") || text.includes("violation") || text.includes("fine")) return "enforcement";
  if (text.includes("policy") || text.includes("rule") || text.includes("regulation")) return "policy";
  if (category === "Hunting & Wildlife" || text.includes("hunting") || text.includes("season")) return "hunting";
  if (category === "Land Development" || text.includes("development") || text.includes("construction")) return "development";
  if (category === "Conservation & Habitat" || text.includes("conservation")) return "conservation";
  
  return "general";
}

function extractTags(title: string, summary: string): string[] {
  const text = `${title} ${summary}`.toLowerCase();
  const tags: string[] = [];
  
  if (text.includes("urgent") || text.includes("emergency")) tags.push("urgent");
  if (text.includes("deadline") || text.includes("comment period")) tags.push("deadline");
  if (text.includes("new") || text.includes("announced")) tags.push("new");
  if (text.includes("public hearing") || text.includes("public meeting")) tags.push("public-input");
  if (text.includes("federal")) tags.push("federal");
  if (text.includes("state")) tags.push("state");
  if (text.includes("local") || text.includes("city") || text.includes("county")) tags.push("local");
  
  return tags;
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
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((p) => 
      u.searchParams.delete(p)
    );
    return u.toString();
  } catch {
    return url;
  }
}

export async function GET() {
  try {
    console.log("[TX-INTEL] Starting comprehensive Texas intelligence aggregation...");
    console.log(`[TX-INTEL] Querying ${COMPREHENSIVE_FEEDS.length} sources...`);

    const results = await Promise.allSettled(
      COMPREHENSIVE_FEEDS.map((feed) => fetchFeed(feed))
    );

    const allItems: FeedItem[] = [];
    let successCount = 0;
    let failCount = 0;

    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        successCount++;
        allItems.push(...result.value);
      } else {
        failCount++;
        console.error(`[TX-INTEL] Feed ${COMPREHENSIVE_FEEDS[idx].source} failed:`, result.reason);
      }
    });

    console.log(`[TX-INTEL] Success: ${successCount}/${COMPREHENSIVE_FEEDS.length} sources`);
    console.log(`[TX-INTEL] Failed: ${failCount} sources`);
    console.log(`[TX-INTEL] Total items collected: ${allItems.length}`);

    if (allItems.length === 0) {
      return Response.json(
        { 
          items: [], 
          count: 0, 
          error: "No updates available. RSS feeds may be temporarily unavailable.", 
          generatedAt: new Date().toISOString(),
          stats: { successfulSources: successCount, failedSources: failCount }
        },
        { headers: { "Cache-Control": "public, s-maxage=300" } }
      );
    }

    // Deduplicate
    const seen = new Set<string>();
    const deduped: FeedItem[] = [];
    
    for (const item of allItems) {
      const linkKey = item.link.toLowerCase();
      const titleKey = `${item.source}::${item.title}`.toLowerCase().substring(0, 100);
      
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

    const items = deduped.slice(0, 120); // Return up to 120 items

    // Generate stats
    const categoryDist: Record<string, number> = {};
    const locationDist: Record<string, number> = {};
    const sourceDist: Record<string, number> = {};
    const impactDist: Record<string, number> = {};

    items.forEach((item) => {
      const cat = item.category || "General";
      const loc = item.location || "Statewide";
      categoryDist[cat] = (categoryDist[cat] || 0) + 1;
      locationDist[loc] = (locationDist[loc] || 0) + 1;
      sourceDist[item.source] = (sourceDist[item.source] || 0) + 1;
      impactDist[item.impact || "low"] = (impactDist[item.impact || "low"] || 0) + 1;
    });

    console.log("[TX-INTEL] === FINAL STATISTICS ===");
    console.log("[TX-INTEL] Total items returned:", items.length);
    console.log("[TX-INTEL] Categories:", categoryDist);
    console.log("[TX-INTEL] Locations:", locationDist);
    console.log("[TX-INTEL] Sources:", sourceDist);
    console.log("[TX-INTEL] Impact levels:", impactDist);

    return Response.json(
      {
        items,
        count: items.length,
        generatedAt: new Date().toISOString(),
        sources: Array.from(new Set(items.map(i => i.source))),
        focusAreas: Object.keys(CATEGORY_KEYWORDS),
        stats: { 
          categories: categoryDist, 
          locations: locationDist, 
          sources: sourceDist,
          impact: impactDist,
          successfulSources: successCount,
          failedSources: failCount,
          totalSources: COMPREHENSIVE_FEEDS.length
        },
      },
      { 
        headers: { 
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" 
        } 
      }
    );
  } catch (error) {
    console.error("[TX-INTEL] Fatal error:", error);
    return Response.json(
      { 
        items: [], 
        count: 0, 
        error: "System error. Please try again.", 
        generatedAt: new Date().toISOString() 
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
