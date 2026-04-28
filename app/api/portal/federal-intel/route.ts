import { NextRequest, NextResponse } from 'next/server';

// ── Haversine distance (miles) ────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// ── Bounding box ~1 mile ──────────────────────────────────────────────────────
function bbox(lat: number, lng: number, miles = 2.0) {
  const dLat = miles / 69.0;
  const dLng = miles / (69.0 * Math.cos(lat * Math.PI / 180));
  return { minLat: lat-dLat, maxLat: lat+dLat, minLng: lng-dLng, maxLng: lng+dLng };
}

interface FederalSource {
  name: string;
  dataset: string;
  endpointUrl: string;
  queryDate: string;
  resultCount: number;
  status: 'success' | 'failed' | 'manual_required';
  facilities: { name: string; lat: number | null; lng: number | null; distanceMi: number | null; status: string; epaId: string; city: string; dataset: string; riskClass: string }[];
}

// ── EPA Superfund NPL Boundaries (confirmed working WGS84) ───────────────────
async function fetchNPL(lat: number, lng: number): Promise<FederalSource> {
  const bb = bbox(lat, lng, 2.0);
  const url = `https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/FAC_Superfund_Site_Boundaries_EPA_Public/FeatureServer/0/query?geometry=${bb.minLng},${bb.minLat},${bb.maxLng},${bb.maxLat}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=SITE_NAME,STATE_CODE,CITY_NAME,NPL_STATUS_CODE,EPA_ID,STREET_ADDR_TXT&returnGeometry=true&f=json`;
  const queryDate = new Date().toISOString();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const data = await res.json();
    const feats = data?.features || [];

    const facilities = feats.map((f: any) => {
      const attrs = f.attributes || {};
      // Extract centroid from polygon rings
      const rings = f.geometry?.rings || [];
      let cLat: number | null = null, cLng: number | null = null;
      if (rings.length > 0 && rings[0].length > 0) {
        const pts = rings[0];
        cLng = pts.reduce((s: number, p: number[]) => s + p[0], 0) / pts.length;
        cLat = pts.reduce((s: number, p: number[]) => s + p[1], 0) / pts.length;
      }
      const distanceMi = cLat && cLng ? Math.round(haversine(lat, lng, cLat, cLng) * 100) / 100 : null;
      return {
        name: attrs.SITE_NAME || 'Unknown Superfund Site',
        lat: cLat, lng: cLng, distanceMi,
        status: attrs.NPL_STATUS_CODE || 'Unknown',
        epaId: attrs.EPA_ID || '',
        city: attrs.CITY_NAME || '',
        dataset: 'NPL',
        riskClass: 'HIGH',
      };
    }).filter((f: any) => f.distanceMi === null || f.distanceMi <= 1.0)
      .sort((a: any, b: any) => (a.distanceMi ?? 99) - (b.distanceMi ?? 99));

    return { name: 'EPA Superfund NPL Site Boundaries', dataset: 'NPL', endpointUrl: url, queryDate, resultCount: facilities.length, status: 'success', facilities };
  } catch (e) {
    return { name: 'EPA Superfund NPL Site Boundaries', dataset: 'NPL', endpointUrl: url, queryDate, resultCount: 0, status: 'failed', facilities: [] };
  }
}

// ── TCEQ Superfund (state-level, confirmed working) ───────────────────────────
async function fetchTCEQSuperfund(lat: number, lng: number): Promise<FederalSource> {
  const bb = bbox(lat, lng, 1.0);
  const where = encodeURIComponent(`LAT_DD BETWEEN ${bb.minLat} AND ${bb.maxLat} AND LONG_DD BETWEEN ${bb.minLng} AND ${bb.maxLng}`);
  const url = `https://services2.arcgis.com/LYMgRMwHfrWWEg3s/arcgis/rest/services/TCEQ_Superfund_Sites/FeatureServer/0/query?where=${where}&outFields=SITE_NAME,LAT_DD,LONG_DD,SITE_STATUS,PHYS_ADDR,CITY&returnGeometry=false&f=json`;
  const queryDate = new Date().toISOString();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const data = await res.json();
    const feats = data?.features || [];
    const facilities = feats.map((f: any) => {
      const a = f.attributes || {};
      const facLat = Number(a.LAT_DD) || null;
      const facLng = Number(a.LONG_DD) || null;
      const distanceMi = facLat && facLng ? Math.round(haversine(lat, lng, facLat, facLng) * 100) / 100 : null;
      return { name: a.SITE_NAME || 'Unknown', lat: facLat, lng: facLng, distanceMi, status: a.SITE_STATUS || '', epaId: '', city: a.CITY || '', dataset: 'TCEQ_SUPERFUND', riskClass: 'HIGH' };
    }).filter((f: any) => f.distanceMi === null || f.distanceMi <= 1.0)
      .sort((a: any, b: any) => (a.distanceMi ?? 99) - (b.distanceMi ?? 99));
    return { name: 'TCEQ State Superfund / Corrective Action', dataset: 'TCEQ_SUPERFUND', endpointUrl: url, queryDate, resultCount: facilities.length, status: 'success', facilities };
  } catch {
    return { name: 'TCEQ State Superfund', dataset: 'TCEQ_SUPERFUND', endpointUrl: url, queryDate, resultCount: 0, status: 'failed', facilities: [] };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lat, lng } = body.coordinates || {};
  if (!lat || !lng) return NextResponse.json({ error: 'coordinates required' }, { status: 400 });

  const [npl, tceqSuperfund] = await Promise.allSettled([
    fetchNPL(lat, lng),
    fetchTCEQSuperfund(lat, lng),
  ]);

  const sources: FederalSource[] = [
    npl.status === 'fulfilled' ? npl.value : { name: 'EPA NPL', dataset: 'NPL', endpointUrl: '', queryDate: new Date().toISOString(), resultCount: 0, status: 'failed' as const, facilities: [] },
    tceqSuperfund.status === 'fulfilled' ? tceqSuperfund.value : { name: 'TCEQ Superfund', dataset: 'TCEQ_SUPERFUND', endpointUrl: '', queryDate: new Date().toISOString(), resultCount: 0, status: 'failed' as const, facilities: [] },
  ];

  const allFacilities = sources.flatMap(s => s.facilities)
    .sort((a, b) => (a.distanceMi ?? 99) - (b.distanceMi ?? 99));

  const audit = sources.map(s => ({
    sourceName: s.name,
    dataset: s.dataset,
    queryDate: s.queryDate,
    resultCount: s.resultCount,
    status: s.status,
  }));

  return NextResponse.json({
    facilitiesNearby: allFacilities,
    totalCount: allFacilities.length,
    sourceAudit: audit,
    nplCount: sources[0].resultCount,
    tceqSuperfundCount: sources[1].resultCount,
    manualRequired: ['RCRA', 'TRI', 'ERNS'],
    note: 'Federal database review: EPA NPL via ArcGIS FeatureServer (WGS84 boundary polygons). RCRA, TRI, and ERNS require manual search — see Federal Database Review panel.',
  });
}
