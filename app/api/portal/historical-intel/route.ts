import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { coordinates, address, county } = body;
  const { lat, lng } = coordinates || {};

  if (!lat || !lng) {
    return NextResponse.json({ error: 'coordinates required' }, { status: 400 });
  }

  // ── USGS Topo map availability check ────────────────────────────────────────
  let topoAvailable = false;
  try {
    const topoRes = await fetch(
      `https://tnmaccess.nationalmap.gov/api/v1/products?` +
      new URLSearchParams({
        datasets: 'Historical Topographic Maps',
        bbox: `${lng - 0.05},${lat - 0.05},${lng + 0.05},${lat + 0.05}`,
        max: '3',
        outputFormat: 'json',
      }),
      { signal: AbortSignal.timeout(8000) }
    );
    const topoJson = await topoRes.json();
    topoAvailable = (topoJson?.total || 0) > 0;
  } catch { topoAvailable = false; }

  // ── NAIP aerial imagery availability ────────────────────────────────────────
  let naipAvailable = false;
  try {
    const naipRes = await fetch(
      `https://tnmaccess.nationalmap.gov/api/v1/products?` +
      new URLSearchParams({
        datasets: 'NAIP',
        bbox: `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`,
        max: '1',
        outputFormat: 'json',
      }),
      { signal: AbortSignal.timeout(8000) }
    );
    const naipJson = await naipRes.json();
    naipAvailable = (naipJson?.total || 0) > 0;
  } catch { naipAvailable = false; }

  // ── Build source checklist ───────────────────────────────────────────────────
  const sources = [
    {
      name: 'USGS Historical Topographic Maps',
      status: topoAvailable ? 'LINK_GENERATED' : 'CHECKED_NONE_FOUND',
      confidence: topoAvailable ? 'PARTIAL' : 'UNAVAILABLE',
      link: `https://ngmdb.usgs.gov/topoview/viewer/#14/${lat}/${lng}`,
      use: 'Historical structures, roads, rail lines, industrial features, water features',
      astmRequired: true,
    },
    {
      name: 'USGS NAIP Aerial Imagery',
      status: naipAvailable ? 'LINK_GENERATED' : 'CHECKED_NONE_FOUND',
      confidence: naipAvailable ? 'PARTIAL' : 'UNAVAILABLE',
      link: `https://earthexplorer.usgs.gov/`,
      use: 'Historical land use, adjacent property review, vegetation change',
      astmRequired: true,
    },
    {
      name: 'Historic Aerials (NETR Online)',
      status: 'LINK_GENERATED',
      confidence: 'PARTIAL',
      link: `https://www.historicaerials.com/location/${lat}/${lng}`,
      use: 'Multi-decade aerial imagery — gas stations, tanks, industrial operations',
      astmRequired: true,
    },
    {
      name: 'Sanborn Fire Insurance Maps',
      status: 'MANUAL_REQUIRED',
      confidence: 'UNAVAILABLE',
      link: 'https://www.loc.gov/collections/sanborn-maps/',
      use: 'Dry cleaners, fuel tanks, industrial uses, building materials — highest REC value',
      astmRequired: true,
    },
    {
      name: 'City Directories',
      status: 'MANUAL_REQUIRED',
      confidence: 'UNAVAILABLE',
      link: null,
      use: 'Historical business names and occupants — identifies gas stations, auto repair, cleaners',
      astmRequired: true,
    },
    {
      name: 'Building Permits',
      status: 'MANUAL_REQUIRED',
      confidence: 'UNAVAILABLE',
      link: null,
      use: 'Construction date, tank installations, demo permits, additions',
      astmRequired: true,
    },
    {
      name: 'Environmental Liens / AULs',
      status: 'MANUAL_REQUIRED',
      confidence: 'UNAVAILABLE',
      link: null,
      use: 'Activity and use limitations, cleanup obligations running with land',
      astmRequired: true,
    },
    {
      name: 'Chain of Title',
      status: 'MANUAL_REQUIRED',
      confidence: 'UNAVAILABLE',
      link: `https://search.${(county || 'collin').toLowerCase().replace(/\s/g,'')}countytx.gov/`,
      use: 'Ownership history — identifies industrial eras, government ownership, cleanup parties',
      astmRequired: false,
    },
  ];

  const automatedCount = sources.filter(s => s.status === 'LINK_GENERATED').length;
  const manualCount = sources.filter(s => s.status === 'MANUAL_REQUIRED').length;

  const historicalConfidence: 'COMPLETE' | 'PARTIAL' | 'MINIMAL' | 'UNAVAILABLE' =
    manualCount === 0 ? 'COMPLETE' :
    automatedCount >= 3 ? 'PARTIAL' :
    automatedCount >= 1 ? 'MINIMAL' : 'UNAVAILABLE';

  const gaps = sources
    .filter(s => s.status === 'MANUAL_REQUIRED')
    .map(s => `${s.name} — manual review required`);

  return NextResponse.json({
    checked: true,
    historicalConfidence,
    automatedCount,
    manualCount,
    address,
    county,
    sources,
    gaps,
    // Direct links for UI
    topoViewerUrl: `https://ngmdb.usgs.gov/topoview/viewer/#14/${lat}/${lng}`,
    historicAerialsUrl: `https://www.historicaerials.com/location/${lat}/${lng}`,
    earthExplorerUrl: 'https://earthexplorer.usgs.gov/',
    sanbornUrl: 'https://www.loc.gov/collections/sanborn-maps/',
    // Scoring flags
    noSanbornReview: true,
    noCityDirectories: true,
    noPermitReview: true,
    noLienSearch: true,
  });
}
