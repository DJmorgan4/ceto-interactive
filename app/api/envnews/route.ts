import { XMLParser } from "fast-xml-parser";

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

const FEEDS = [
  {
    category: "Texas Environment",
    url: "https://news.google.com/rss/search?q=Texas%20environmental%20news%20OR%20TCEQ%20OR%20EPA%20Region%206&hl=en-US&gl=US&ceid=US:en"
  },
  {
    category: "Water",
    url: "https://news.google.com/rss/search?q=Texas%20water%20drought%20groundwater%20TWDB&hl=en-US&gl=US&ceid=US:en"
  },
  {
    category: "Air Quality",
    url: "https://news.google.com/rss/search?q=Texas%20air%20quality%20pollution%20TCEQ%20ozone&hl=en-US&gl=US&ceid=US:en"
  },
  {
    category: "Land + Development",
    url: "https://news.google.com/rss/search?q=Texas%20land%20development%20wetlands%20floodplain%20environmental%20permit&hl=en-US&gl=US&ceid=US:en"
  },
  {
    category: "Conservation",
    url: "https://news.google.com/rss/search?q=Texas%20wildlife%20habitat%20TPWD%20endangered%20species&hl=en-US&gl=US&ceid=US:en"
  }
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ""
});

function cleanText(input = "") {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&#8217;/g, "’")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function getSource(item: any) {
  if (item.source?.["#text"]) return item.source["#text"];
  if (typeof item.source === "string") return item.source;
  return "Environmental News";
}

function scoreItem(title: string, summary: string, source: string) {
  const text = `${title} ${summary} ${source}`.toLowerCase();

  let score = 0;

  const highTerms = [
    "tceq",
    "epa",
    "permit",
    "enforcement",
    "violation",
    "contamination",
    "groundwater",
    "flood",
    "wetland",
    "drought",
    "air quality",
    "wastewater",
    "superfund",
    "industrial",
    "pipeline",
    "solar",
    "wind",
    "battery",
    "habitat",
    "endangered"
  ];

  for (const term of highTerms) {
    if (text.includes(term)) score += 8;
  }

  if (text.includes("texas")) score += 15;
  if (text.includes("tceq")) score += 20;
  if (text.includes("twdb")) score += 15;
  if (text.includes("tpwd")) score += 12;
  if (text.includes("epa region 6")) score += 15;

  return score;
}

function impactFromScore(score: number): "Low" | "Medium" | "High" {
  if (score >= 45) return "High";
  if (score >= 22) return "Medium";
  return "Low";
}

export async function GET() {
  const results: NewsItem[] = [];

  await Promise.all(
    FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          next: { revalidate: 1800 },
          headers: {
            "User-Agent": "CetoInteractiveEnvironmentalIntel/1.0"
          }
        });

        const xml = await res.text();
        const parsed = parser.parse(xml);
        const rawItems = parsed?.rss?.channel?.item ?? [];
        const items = Array.isArray(rawItems) ? rawItems : [rawItems];

        for (const item of items.slice(0, 12)) {
          const title = cleanText(item.title);
          const summary = cleanText(item.description);
          const source = cleanText(getSource(item));
          const score = scoreItem(title, summary, source);

          results.push({
            title,
            link: item.link,
            source,
            publishedAt: item.pubDate || new Date().toISOString(),
            summary,
            category: feed.category,
            impact: impactFromScore(score),
            score
          });
        }
      } catch {
        // ignore failed source so the feed still loads
      }
    })
  );

  const seen = new Set<string>();

  const deduped = results
    .filter((item) => {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 90);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 24);

  return Response.json({
    updatedAt: new Date().toISOString(),
    count: deduped.length,
    items: deduped
  });
}
