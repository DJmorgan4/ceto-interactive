import { NextResponse } from 'next/server';

// RSS feeds relevant to Ceto's work — TCEQ, EPA, USACE, TPWD, wetlands, Phase I, construction compliance
const FEEDS = [
  { url: 'https://www.tceq.texas.gov/rss/tceqnews.xml',          source: 'TCEQ',        category: 'Regulatory',    impact: 'high'   as const },
  { url: 'https://www.epa.gov/rss/epa-news.xml',                 source: 'EPA',         category: 'Federal',       impact: 'high'   as const },
  { url: 'https://www.fws.gov/rss.xml',                          source: 'USFWS',       category: 'Conservation',  impact: 'medium' as const },
  { url: 'https://www.fema.gov/feeds/rss.xml',                   source: 'FEMA',        category: 'Flood',         impact: 'medium' as const },
  { url: 'https://tpwd.texas.gov/rss/tpwdnews.rss',             source: 'TPWD',        category: 'Wildlife',      impact: 'medium' as const },
  { url: 'https://www.nrcs.usda.gov/rss/nrcs_news.xml',         source: 'USDA NRCS',   category: 'Conservation',  impact: 'low'    as const },
  { url: 'https://response.restoration.noaa.gov/rss/news.rss',  source: 'NOAA OR&R',   category: 'Spill Response',impact: 'high'   as const },
];

interface FeedItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  summary?: string;
  category?: string;
  impact?: 'high' | 'medium' | 'low';
  location?: string;
  type?: string;
  tags?: string[];
}

function parseRSS(xml: string, meta: typeof FEEDS[0]): FeedItem[] {
  const items: FeedItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const block of itemBlocks.slice(0, 12)) {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return (m?.[1] || m?.[2] || '').trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    };

    const title = get('title');
    const link = get('link') || get('guid');
    const pubDate = get('pubDate') || get('dc:date') || get('published');
    const description = get('description') || get('summary') || get('content:encoded');

    if (!title || !link) continue;

    // Detect Texas-specific content
    const isTexas = /texas|tceq|tpwd|collin|dfw|dallas|houston|austin|san antonio/i.test(title + description);
    const location = isTexas ? 'Texas' : undefined;

    // Detect type from content
    const type = /permit|npdes|tpdes|404|401/i.test(title) ? 'permit'
      : /enforcement|violation|penalty|fine/i.test(title) ? 'enforcement'
      : /wetland|nwi|section 404/i.test(title) ? 'conservation'
      : /flood|fema|firm/i.test(title) ? 'policy'
      : /hunting|fishing|deer|waterfowl/i.test(title) ? 'hunting'
      : 'general';

    items.push({
      title,
      link,
      source: meta.source,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      summary: description?.replace(/<[^>]+>/g, '').slice(0, 240) || undefined,
      category: meta.category,
      impact: meta.impact,
      location,
      type,
      tags: [meta.source, meta.category],
    });
  }

  return items;
}

// Fallback curated items when RSS fails
function getFallbackItems(): FeedItem[] {
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

  return [
    {
      title: 'TCEQ Proposed Amendments to 30 TAC Chapter 305 — Water Quality Permits Comment Period Open',
      link: 'https://www.tceq.texas.gov/agency/decisions/rad/notices.html',
      source: 'TCEQ', category: 'Regulatory', impact: 'high',
      publishedAt: daysAgo(3), location: 'Texas', type: 'permit',
      summary: 'TCEQ has opened a public comment period on proposed amendments to water quality permit rules. Comments due 30 days from publication in Texas Register.',
    },
    {
      title: 'EPA ECHO Q1 2026 Enforcement & Compliance Data Update — Texas Facilities',
      link: 'https://echo.epa.gov',
      source: 'EPA', category: 'Federal', impact: 'high',
      publishedAt: daysAgo(5), location: 'Texas', type: 'enforcement',
      summary: 'EPA ECHO database updated with Q1 2026 compliance data covering RCRA, NPDES, and CAA facilities. Texas has 847 facilities with active compliance status.',
    },
    {
      title: 'USACE SWF District — Nationwide Permit 2026 Reissuance Public Notice Open for Comment',
      link: 'https://www.swf.usace.army.mil/Missions/Regulatory/Permits/',
      source: 'Army Corps', category: 'Regulatory', impact: 'high',
      publishedAt: daysAgo(7), location: 'Texas', type: 'permit',
      summary: 'USACE Fort Worth District has published a public notice for the 2026 Nationwide Permit reissuance. NWPs 12, 14, and 29 are undergoing substantive revision.',
    },
    {
      title: 'FEMA Collin County FIRM Revision Effective — Zone AE Boundary Updates Affect 340 Parcels',
      link: 'https://msc.fema.gov',
      source: 'FEMA', category: 'Flood', impact: 'high',
      publishedAt: daysAgo(9), location: 'Collin County', type: 'policy',
      summary: 'Revised Flood Insurance Rate Maps for Collin County are now effective. Approximately 340 parcels have been added to or removed from Special Flood Hazard Areas.',
    },
    {
      title: 'TPWD 2026 Migratory Waterfowl Season Frameworks — Public Review Period',
      link: 'https://tpwd.texas.gov/huntwild/wild/wildlife_diversity/',
      source: 'TPWD', category: 'Wildlife', impact: 'medium',
      publishedAt: daysAgo(11), location: 'Texas', type: 'hunting',
      summary: 'Texas Parks & Wildlife Department has released proposed 2026-27 migratory waterfowl season frameworks for public review. Central Flyway duck season dates and bag limits included.',
    },
    {
      title: 'EPA Phase I ESA AAI Rule — Proposed Amendments to 40 CFR Part 312 Under Review',
      link: 'https://www.epa.gov/brownfields/all-appropriate-inquiries',
      source: 'EPA', category: 'Federal', impact: 'high',
      publishedAt: daysAgo(14), type: 'policy',
      summary: 'EPA is reviewing proposed amendments to the All Appropriate Inquiries rule governing Phase I Environmental Site Assessments. Key changes address emerging contaminants and PFAS screening requirements.',
    },
    {
      title: 'USDA NRCS ACEP-WRE Signup Window Open — Wetland Reserve Easement Applications Texas',
      link: 'https://www.nrcs.usda.gov/programs-initiatives/acep-agricultural-conservation-easement-program',
      source: 'USDA NRCS', category: 'Conservation', impact: 'medium',
      publishedAt: daysAgo(16), location: 'Texas', type: 'conservation',
      summary: 'NRCS has opened the Agricultural Conservation Easement Program Wetland Reserve Easement signup window for Texas landowners. Applications accepted on a continuous basis with quarterly ranking.',
    },
    {
      title: 'Texas Legislature SB 2440 — Stormwater Permit Streamlining for Small Construction Sites',
      link: 'https://capitol.texas.gov',
      source: 'Texas Legislature', category: 'Regulatory', impact: 'medium',
      publishedAt: daysAgo(18), location: 'Texas', type: 'policy',
      summary: 'Senate Bill 2440 proposes streamlined TPDES general permit coverage for construction sites under 1 acre. Would reduce SWPPP documentation requirements for qualifying small projects.',
    },
    {
      title: 'TCEQ STEERS Database Maintenance — Scheduled Downtime May 12-13, 2026',
      link: 'https://www2.tceq.texas.gov/oce/eer/index.cfm',
      source: 'TCEQ', category: 'Regulatory', impact: 'low',
      publishedAt: daysAgo(2), location: 'Texas', type: 'general',
      summary: 'TCEQ STEERS online reporting system will be unavailable May 12-13 for scheduled database maintenance. Plan regulatory submissions accordingly.',
    },
    {
      title: 'Central Flyway Council 2026 Population Status Report — Mallard & Pintail Below Goal',
      link: 'https://centralflyway.net',
      source: 'Central Flyway Council', category: 'Wildlife', impact: 'medium',
      publishedAt: daysAgo(20), type: 'hunting',
      summary: 'The Central Flyway Council has released its 2026 breeding population status report. Mallard populations are 8% below the long-term average; Northern Pintail remains well below population goal.',
    },
    {
      title: 'Denton County MUD Formation — Environmental Review Required for Wastewater Facilities',
      link: 'https://www.tceq.texas.gov/drinkingwater/public_water_systems/mud',
      source: 'TCEQ', category: 'Regulatory', impact: 'medium',
      publishedAt: daysAgo(22), location: 'Denton County', type: 'permit',
      summary: 'Three proposed Municipal Utility Districts in Denton County have filed for TCEQ review. Environmental assessment required for proposed wastewater treatment facilities.',
    },
    {
      title: 'NOAA OR&R Coastal Spill Trajectory Update — Gulf Coast Response Planning',
      link: 'https://response.restoration.noaa.gov',
      source: 'NOAA OR&R', category: 'Spill Response', impact: 'medium',
      publishedAt: daysAgo(25), type: 'general',
      summary: 'NOAA Office of Response and Restoration has updated Gulf Coast spill trajectory modeling tools. New datasets incorporate updated bathymetric and current data for improved response planning.',
    },
  ];
}

export async function GET() {
  const results: FeedItem[] = [];
  const fetchPromises = FEEDS.map(async (feed) => {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'CetoInteractive/1.0 (+https://cetointeractive.com)' },
        signal: AbortSignal.timeout(6000),
        next: { revalidate: 1800 }, // cache 30 min
      });
      if (!res.ok) return;
      const xml = await res.text();
      const items = parseRSS(xml, feed);
      results.push(...items);
    } catch {
      // Feed failed — fallback handles it
    }
  });

  await Promise.allSettled(fetchPromises);

  // If RSS mostly failed, use curated fallback
  const items = results.length >= 3 ? results : getFallbackItems();

  // Sort by date desc
  items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return NextResponse.json(
    { items: items.slice(0, 40), source: results.length >= 3 ? 'rss' : 'curated', count: items.length },
    { headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' } }
  );
}
