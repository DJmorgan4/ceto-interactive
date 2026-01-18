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

// Official-first RSS (press + agency updates)
const RSS_FEEDS = [
  { url: "https://www.epa.gov/newsreleases/search/rss", source: "EPA" },
  { url: "https://www.epa.gov/newsreleases/search/rss/field_press_office/region-6-south-central-234", source: "EPA Region 6" },
  { url: "https://www.fws.gov/news/rss.xml", source: "USFWS" },
  { url: "https://www.tceq.texas.gov/news/news-releases.rss", source: "TCEQ" },
] as const;

// Categories tuned for “developer environmental intel”
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "NEPA / Permitting": ["nepa", "environmental impact statement", "eis", "environmental assessment", "ea", "permit", "permitting", "public notice"],
  "Air (CAA)": ["clean air act", "caa", "sip", "ozone", "naaqs", "pm2.5", "emissions", "air quality"],
  "Water (CWA)": ["clean water act", "cwa", "npdes", "wastewater", "discharge", "effluent", "wotus", "wetland", "section 404", "waters of the united states"],
  "Chemicals": ["tsca", "pesticide", "tolerance", "toxic substances", "p fas", "pfas"],
  "Waste / Superfund": ["superfund", "cercla", "rcra", "hazardous waste", "remediation"],
  "Wildlife / ESA": ["endangered species", "esa", "critical habitat", "threatened", "incidental take"],
  "Climate / GHG": ["greenhouse", "ghg", "climate", "methane", "carbon", "co2"],
  "Enforcement": ["enforcement", "violation", "penalty", "notice of violation", "consent decree", "settlement"],
  "Funding (Grants & Contracts)": ["grant", "funding opportunity", "cooperative agreement", "solicitation", "sam.gov", "assistance listing"],
  "Jobs": ["usajobs", "vacancy", "hiring", "position", "job announcement"],
};

const HIGH_IMPACT_KEYWORDS = [
  "final rule",
  "interim final",
  "emergency",
  "consent decree",
  "settlement",
  "penalty",
  "nationwide permit",
  "compliance",
];

const MEDIUM_IMPACT_KEYWORDS = [
  "proposed rule",
  "notice of proposed rulemaking",
  "draft",
  "guidance",
  "request for comment",
  "public notice",
  "comment period",
];

const DEADLINE_PATTERNS: RegExp[] = [
  /comment period closes?\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
  /deadline[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
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
  if (!Number.isNaN(d.getTime())) return d.toISOString();
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

function categorizeItem(title: string, summary: string): string {
  const text = `${title} ${summary}`.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) return category;
  }
  return "General";
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

function assessImpact(title: string, summary: string, deadline?: string): Impact {
  // Deadline soon => higher impact (devs love actionable dates)
  if (deadline) {
    const t = Date.parse(deadline);
    if (Number.isFinite(t)) {
      const days = (t - Date.now()) / (1000 * 60 * 60 * 24);
      if (days <= 14 && days >= -1) return "high";
      if (days <= 30 && days >= -1) return "medium";
    }
  }

  const text = `${title} ${summary}`.toLowerCase();
  if (HIGH_IMPACT_KEYWORDS.some((k) => text.includes(k))) return "high";
  if (MEDIUM_IMPACT_KEYWORDS.some((k) => text.includes(k))) return "medium";
  return "low";
}

function toTime(iso?: string) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function primaryTime(item: FeedItem) {
  return Math.max(toTime(item.publishedAt), toTime(item.deadline));
}

async function fetchTextWithTimeout(url: string, ms = 12000): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

// ---- RSS ingest (press releases etc.) ----
async function fetchRssFeed(feedConfig: (typeof RSS_FEEDS)[number]): Promise<FeedItem[]> {
  try {
    const xml = await fetchTextWithTimeout(feedConfig.url, 12000);
    const feed = await parser.parseString(xml);

    return (feed.items || [])
      .slice(0, 25)
      .map((item) => {
        const title = cleanHtml(item.title || "");
        const summaryRaw = cleanHtml((item as any).contentSnippet || (item as any).content || "");
        const summary = summaryRaw ? summaryRaw.slice(0, 360) : undefined;

        const link = normalizeUrl(item.link || (item as any).guid || "");

        // IMPORTANT: do NOT default to now — it breaks recency ranking
        const publishedAt =
          safeIsoDate((item as any).isoDate) ||
          safeIsoDate(item.pubDate || "") ||
          safeIsoDate((item as any).published);

        const deadline = extractDeadline(title, summaryRaw);
        const category = categorizeItem(title, summaryRaw);
        const impact = assessImpact(title, summaryRaw, deadline);

        return { title, link, source: feedConfig.source, publishedAt, summary, category, impact, deadline };
      })
      .filter((x) => x.title && x.link);
  } catch (error) {
    console.error(`Failed RSS ${feedConfig.source}:`, error);
    return [];
  }
}

// ---- Federal Register (best official “laws changing”) ----
async function fetchFederalRegisterEPA(): Promise<FeedItem[]> {
  try {
    const url =
      "https://www.federalregister.gov/api/v1/articles.json" +
      "?per_page=40&order=newest" +
      "&conditions[agencies][]=environmental-protection-agency" +
      "&conditions[type][]=RULE&conditions[type][]=PRORULE";

    const text = await fetchTextWithTimeout(url, 12000);
    const json = JSON.parse(text);
    const results = Array.isArray(json?.results) ? json.results : [];

    return results
      .map((r: any): FeedItem => {
        const title = String(r?.title || "").trim();
        const link = String(r?.html_url || r?.pdf_url || "").trim();
        const summary = cleanHtml(String(r?.abstract || "")).slice(0, 360) || undefined;

        const publishedAt = r?.publication_date ? new Date(r.publication_date).toISOString() : undefined;
        const deadline = r?.comment_end_date ? new Date(r.comment_end_date).toISOString() : undefined;

        const category = categorizeItem(title, summary || "");
        const impact = assessImpact(title, summary || "", deadline);

        return { title, link, source: "Federal Register (EPA)", publishedAt, summary, category, impact, deadline };
      })
      .filter((x: FeedItem) => x.title && x.link);
  } catch (e) {
    console.error("Failed Federal Register (EPA):", e);
    return [];
  }
}

// ---- Regulations.gov (comment periods / docket deadlines) ----
// This uses the public v4 API. If their schema changes, log will show it; route continues.
async function fetchRegulationsGov(): Promise<FeedItem[]> {
  try {
    const url = "https://api.regulations.gov/v4/documents?filter[searchTerm]=environmental%20protection%20agency&sort=-postedDate&page[size]=25";
    const text = await fetchTextWithTimeout(url, 12000);
    const json = JSON.parse(text);

    const data = Array.isArray(json?.data) ? json.data : [];
    const items: FeedItem[] = [];

    for (const row of data) {
      const attr = row?.attributes || {};
      const title = cleanHtml(String(attr?.title || attr?.documentTitle || "")).trim();
      if (!title) continue;

      const docId = String(row?.id || attr?.documentId || "").trim();
      if (!docId) continue;

      const link = `https://www.regulations.gov/document/${encodeURIComponent(docId)}`;
      const summary = cleanHtml(String(attr?.abstract || attr?.summary || "")).slice(0, 360) || undefined;

      const publishedAt =
        safeIsoDate(attr?.postedDate) ||
        safeIsoDate(attr?.publishDate) ||
        safeIsoDate(attr?.datePosted);

      // comment end date if available
      const deadline =
        safeIsoDate(attr?.commentEndDate) ||
        safeIsoDate(attr?.commentDueDate) ||
        extractDeadline(title, summary || "");

      const category = categorizeItem(title, summary || "");
      const impact = assessImpact(title, summary || "", deadline);

      // Narrow to higher-signal docs (optional): prefer rules / notices
      const docType = String(attr?.documentType || "").toLowerCase();
      if (docType && !["rule", "proposed rule", "notice", "supporting & related material"].some((t) => docType.includes(t))) {
        // keep it if deadline exists (still actionable)
        if (!deadline) continue;
      }

      items.push({
        title,
        link,
        source: "Regulations.gov",
        publishedAt,
        summary,
        category,
        impact,
        deadline,
      });
    }

    return items;
  } catch (e) {
    console.error("Failed Regulations.gov:", e);
    return [];
  }
}

export async function GET() {
  try {
    const [fr, regs, ...rss] = await Promise.all([
      fetchFederalRegisterEPA(),
      fetchRegulationsGov(),
      ...RSS_FEEDS.map(fetchRssFeed),
    ]);

    const all = [...fr, ...regs, ...rss.flat()].filter((x) => x.title && x.link);

    // Dedupe: link OR source+title
    const seen = new Set<string>();
    const deduped: FeedItem[] = [];
    for (const it of all) {
      const keyLink = (it.link || "").toLowerCase();
      const keyTitle = `${it.source}::${it.title}`.toLowerCase();
      if ((keyLink && seen.has(keyLink)) || seen.has(keyTitle)) continue;
      if (keyLink) seen.add(keyLink);
      seen.add(keyTitle);
      deduped.push(it);
    }

    // Sort newest by publishedAt OR deadline (calendar items float correctly)
    deduped.sort((a, b) => primaryTime(b) - primaryTime(a));

    const items = deduped.slice(0, 90);

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

