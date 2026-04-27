import { NextRequest, NextResponse } from 'next/server';

// ── Verified TCEQ ArcGIS REST Layer URLs ─────────────────────────────────────
// Sources confirmed via curl 2026-04-27:
// - services2.arcgis.com/LYMgRMwHfrWWEg3s = official TCEQ ArcGIS Online org
// - gisweb.tceq.texas.gov/arcgis/rest/services/Public = direct TCEQ server
const TCEQ_LAYERS = [
  {
    dataset: 'LPST',
    label: 'Leaking Petroleum Storage Tank',
    url: 'https://services2.arcgis.com/LYMgRMwHfrWWEg3s/arcgis/rest/services/TCEQ_Leaking_Petroleum_Storage_Tank/FeatureServer/0',
    riskClass: 'HIGH',
    weight: 1.8,
    nameField: ['SITE_NAME', 'RN', 'PST_ID'],
    statusField: ['REM_PROG', 'STATUS', 'SITE_STATUS'],
  },
  {
    dataset: 'PST',
    label: 'Petroleum Storage Tank',
    url: 'https://gisweb.tceq.texas.gov/arcgis/rest/services/Public/PST/MapServer/0',
    riskClass: 'MODERATE',
    weight: 1.3,
    nameField: ['FACILITY_N', 'FACILITY_NAME', 'SITE_NAME'],
    statusField: ['UST_TYPE', 'STATUS', 'ACTIVE_STATUS'],
  },
  {
    dataset: 'DRYCLEANER',
    label: 'Dry Cleaner Remediation Program',
    url: 'https://gisweb.tceq.texas.gov/arcgis/rest/services/Public/DryCleaner/MapServer/0',
    riskClass: 'HIGH',
    weight: 1.7,
    nameField: ['FACILITY_NAME', 'NAME', 'SITE_NAME'],
    statusField: ['PROGRAM_STATUS', 'STATUS', 'REM_PROG'],
  },
  {
    dataset: 'VCP',
    label: 'Voluntary Cleanup Program',
    url: 'https://gisweb.tceq.texas.gov/arcgis/rest/services/Public/Brownfield/MapServer/0',
    riskClass: 'MODERATE',
    weight: 1.5,
    nameField: ['SITE_NAME', 'FACILITY_NAME', 'NAME'],
    statusField: ['SITE_STATUS', 'VCP_STATUS', 'STATUS'],
  },
  {
    dataset: 'IHWCA',
    label: 'Industrial & Hazardous Waste Corrective Action',
    url: 'https://gisweb.tceq.texas.gov/arcgis/rest/services/Public/IHWCA/MapServer/0',
    riskClass: 'HIGH',
    weight: 1.7,
    nameField: ['SITE_NAME', 'REGULATED_ENTITY_NAME', 'NAME'],
    statusField: ['SITE_STATUS', 'STATUS', 'REM_PROG'],
  },
] as const;

// ── Haversine distance (miles) ────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Query one ArcGIS layer within 1-mile radius ───────────────────────────────
async function queryLayer(
  layerUrl: string,
  lat: number,
  lng: number,
  radiusMeters = 1609
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    distance: String(radiusMeters),
    units: 'esriSRUnit_Meter',
    outFields: '*',
    returnGeometry: 'true',
  });

  const res = await fetch(`${layerUrl}/query?${params}`, {
    signal: AbortSignal.timeout(12000),
    headers: { 'User-Agent': 'CetoInteractive/1.0' },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} from ${layerUrl}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'ArcGIS error');
  return json.features || [];
}

// ── Pick first non-empty value from attrs ─────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickField(attrs: any, fields: readonly string[]): string {
  for (const f of fields) {
    if (attrs[f] && String(attrs[f]).trim() && String(attrs[f]).trim() !== 'null')
      return String(attrs[f]).trim();
  }
  return 'Unknown';
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lat, lng } = body.coordinates || {};

  if (!lat || !lng) {
    return NextResponse.json({ error: 'coordinates required' }, { status: 400 });
  }

  const results = await Promise.allSettled(
    TCEQ_LAYERS.map(async (layer) => {
      const features = await queryLayer(layer.url, lat, lng);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return features.map((f: any) => {
        const attrs = f.attributes || {};
        const geom = f.geometry || {};
        const facLat: number | null = geom.y ?? attrs.LAT_DD ?? attrs.lat_dd ?? attrs.LATITUDE ?? null;
        const facLng: number | null = geom.x ?? attrs.LONG_DD ?? attrs.long_dd ?? attrs.LONGITUDE ?? null;
        const distanceMi =
          facLat && facLng
            ? Math.round(haversine(lat, lng, facLat, facLng) * 100) / 100
            : null;

        return {
          name: pickField(attrs, layer.nameField),
          source: 'TCEQ' as const,
          dataset: layer.dataset,
          type: layer.label,
          program: layer.dataset,
          status: pickField(attrs, layer.statusField),
          address: attrs.PHYS_ADDR || attrs.ADDRESS || attrs.LOCATION_ADDRESS || '',
          city: attrs.CITY || '',
          county: attrs.COUNTY || '',
          lat: facLat,
          lng: facLng,
          distanceMi,
          riskClass: layer.riskClass,
          weight: layer.weight,
          violations: attrs.OPEN_CASES ? `${attrs.OPEN_CASES} open case(s)` : '',
          raw: attrs,
        };
      });
    })
  );

  const facilitiesNearby = results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter(Boolean)
    .sort((a, b) => (a.distanceMi ?? 99) - (b.distanceMi ?? 99));

  const layerStatus = TCEQ_LAYERS.map((layer, i) => ({
    dataset: layer.dataset,
    label: layer.label,
    status: results[i].status === 'fulfilled' ? 'OK' : 'ERROR',
    error: results[i].status === 'rejected'
      ? (results[i] as PromiseRejectedResult).reason?.message
      : null,
    count: results[i].status === 'fulfilled'
      ? (results[i] as PromiseFulfilledResult<unknown[]>).value.length
      : 0,
  }));

  const checked = layerStatus.some(l => l.status === 'OK');

  return NextResponse.json({
    checked,
    source: 'TCEQ — services2.arcgis.com (official) + gisweb.tceq.texas.gov (direct)',
    totalCount: facilitiesNearby.length,
    facilitiesNearby,
    layerStatus,
    lpstCount: facilitiesNearby.filter(f => f.dataset === 'LPST').length,
    dryCleanerCount: facilitiesNearby.filter(f => f.dataset === 'DRYCLEANER').length,
    highRiskCount: facilitiesNearby.filter(f => f.riskClass === 'HIGH').length,
  });
}
