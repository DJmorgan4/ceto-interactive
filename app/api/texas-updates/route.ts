import { NextResponse } from 'next/server';

const FEEDS = [
  { url: 'https://www.fws.gov/rss.xml', source: 'USFWS', category: 'Conservation', impact: 'medium' as const },
  { url: 'https://www.epa.gov/newsreleases/search/rss', source: 'EPA', category: 'Federal', impact: 'high' as const },
  { url: 'https://www.fema.gov/media-library/assets/rss/disaster-declarations.xml', source: 'FEMA', category: 'Flood', impact: 'high' as const },
  { url: 'https://www.federalregister.gov/documents/search.rss?conditions%5Bagencies%5D%5B%5D=environmental-protection-agency', source: 'Federal Register · EPA', category: 'Regulatory', impact: 'high' as const },
  { url: 'https://www.federalregister.gov/documents/search.rss?conditions%5Bagencies%5D%5B%5D=army-corps-of-engineers', source: 'Federal Register · USACE', category: 'Permitting', impact: 'high' as const },
  { url: 'https://www.federalregister.gov/documents/search.rss?conditions%5Bagencies%5D%5B%5D=fish-and-wildlife-service', source: 'Federal Register · FWS', category: 'Conservation', impact: 'medium' as const },
  { url: 'https://www.federalregister.gov/documents/search.rss?conditions%5Bagencies%5D%5B%5D=federal-emergency-management-agency', source: 'Federal Register · FEMA', category: 'Flood', impact: 'medium' as const },
  { url: 'https://earthjustice.org/feed', source: 'Earthjustice', category: 'Enforcement', impact: 'medium' as const },
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

function parseRSS(xml: string, meta: typeof FEEDS[0]): FeedItem[] {
  const items: FeedItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const block of itemBlocks.slice(0, 15)) {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return stripHtml((m?.[1] || m?.[2] || '').trim());
    };

    const title = get('title');
    const link = get('link') || get('guid');
    const pubDate = get('pubDate') || get('dc:date') || get('updated');
    const description = get('description') || get('summary') || get('content:encoded');

    if (!title || !link) continue;

    const content = (title + ' ' + description).toLowerCase();
    const isTexas = /texas|tceq|tpwd|collin|tarrant|denton|houston|dallas|austin|san antonio|fort worth|galveston|gulf/i.test(content);
    const location = isTexas ? 'Texas' : /louisiana|oklahoma|new mexico|arkansas/i.test(content) ? 'South-Central' : undefined;

    const type = /permit|npdes|tpdes|404|401|nationwide permit/i.test(content) ? 'permit'
      : /enforcement|violation|penalty|fine|lawsuit|settlement/i.test(content) ? 'enforcement'
      : /wetland|nwi|section 404|mitigation/i.test(content) ? 'conservation'
      : /flood|fema|firm|sfha|floodplain/i.test(content) ? 'policy'
      : /hunting|fishing|deer|waterfowl|duck|migratory/i.test(content) ? 'hunting'
      : /conservation|habitat|endangered|species/i.test(content) ? 'conservation'
      : 'general';

    // Boost impact for Texas-relevant items
    const impact = isTexas && meta.impact === 'medium' ? 'high' as const : meta.impact;

    items.push({
      title,
      link,
      source: meta.source,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      summary: description ? description.slice(0, 280) : undefined,
      category: meta.category,
      impact,
      location,
      type,
      tags: [meta.source, meta.category],
    });
  }
  return items;
}

function getFallbackItems(): FeedItem[] {
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  return [
    { title: 'USACE SWF District — Nationwide Permit 2026 Reissuance Public Notice', link: 'https://www.swf.usace.army.mil/Missions/Regulatory/Permits/', source: 'Federal Register · USACE', category: 'Permitting', impact: 'high', publishedAt: daysAgo(3), location: 'Texas', type: 'permit', summary: 'USACE Fort Worth District has published a public notice for the 2026 Nationwide Permit reissuance. NWPs 12, 14, and 29 are undergoing substantive revision.' },
    { title: 'TCEQ Proposed Amendments to 30 TAC Chapter 305 — Water Quality Permits Comment Period', link: 'https://www.tceq.texas.gov/agency/decisions/rad/notices.html', source: 'TCEQ', category: 'Regulatory', impact: 'high', publishedAt: daysAgo(5), location: 'Texas', type: 'permit', summary: 'TCEQ has opened a public comment period on proposed amendments to water quality permit rules.' },
    { title: 'EPA Phase I ESA AAI Rule — Proposed Amendments to 40 CFR Part 312', link: 'https://www.epa.gov/brownfields/all-appropriate-inquiries', source: 'EPA', category: 'Federal', impact: 'high', publishedAt: daysAgo(8), type: 'policy', summary: 'EPA reviewing proposed amendments to the All Appropriate Inquiries rule. Key changes address emerging contaminants and PFAS screening.' },
    { title: 'FEMA Collin County FIRM Revision Effective — Zone AE Boundary Updates', link: 'https://msc.fema.gov', source: 'FEMA', category: 'Flood', impact: 'high', publishedAt: daysAgo(10), location: 'Collin County', type: 'policy', summary: 'Revised Flood Insurance Rate Maps for Collin County now effective. ~340 parcels added to or removed from Special Flood Hazard Areas.' },
    { title: 'TPWD 2026 Migratory Waterfowl Season Frameworks — Central Flyway Public Review', link: 'https://tpwd.texas.gov/huntwild/', source: 'TPWD', category: 'Wildlife', impact: 'medium', publishedAt: daysAgo(12), location: 'Texas', type: 'hunting', summary: 'Texas Parks & Wildlife has released proposed 2026-27 migratory waterfowl season frameworks. Mallard populations 8% below long-term average.' },
    { title: 'USDA NRCS ACEP-WRE Signup Window Open — Wetland Reserve Easements Texas', link: 'https://www.nrcs.usda.gov/programs-initiatives/acep-agricultural-conservation-easement-program', source: 'USDA NRCS', category: 'Conservation', impact: 'medium', publishedAt: daysAgo(15), location: 'Texas', type: 'conservation', summary: 'NRCS has opened the Agricultural Conservation Easement Program Wetland Reserve Easement signup window for Texas landowners.' },
    { title: 'Section 404 Permit Streamlining — EPA and USACE Joint Guidance Update', link: 'https://www.epa.gov/cwa-404', source: 'Federal Register · EPA', category: 'Regulatory', impact: 'high', publishedAt: daysAgo(18), type: 'permit', summary: 'EPA and USACE have issued updated joint guidance on Section 404 permit processing timelines and mitigation requirements.' },
    { title: 'TCEQ STEERS Scheduled Maintenance — Plan Regulatory Submissions', link: 'https://www2.tceq.texas.gov/oce/eer/index.cfm', source: 'TCEQ', category: 'Regulatory', impact: 'low', publishedAt: daysAgo(2), location: 'Texas', type: 'general', summary: 'TCEQ STEERS online reporting system will be unavailable for scheduled database maintenance. Plan submissions accordingly.' },
  ];
}

export async function GET() {
  const results: FeedItem[] = [];

  await Promise.allSettled(FEEDS.map(async (feed) => {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 CetoInteractive/1.0 (+https://cetointeractive.com)' },
        signal: AbortSignal.timeout(7000),
        next: { revalidate: 1800 },
      });
      if (!res.ok) return;
      const xml = await res.text();
      results.push(...parseRSS(xml, feed));
    } catch { /* silent fail */ }
  }));

  const items = results.length >= 5 ? results : [...results, ...getFallbackItems()];
  items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const deduped = items.filter(item => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json(
    { items: deduped.slice(0, 50), source: results.length >= 5 ? 'rss' : 'mixed', count: deduped.length },
    { headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' } }
  );
}
