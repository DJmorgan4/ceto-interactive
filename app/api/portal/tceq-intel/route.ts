import { NextRequest, NextResponse } from 'next/server';

// ── Haversine distance (miles) ────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// ── Bounding box for ~1 mile radius (degrees) ────────────────────────────────
function bbox1mi(lat: number, lng: number) {
  const dLat = 1.0 / 69.0;          // ~1 mile in degrees lat
  const dLng = 1.0 / (69.0 * Math.cos(lat * Math.PI / 180));
  return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
}

// ── Confirmed-working TCEQ ArcGIS FeatureServer layers ───────────────────────
// All use services2.arcgis.com/LYMgRMwHfrWWEg3s
// Queried via LAT_DD/LONG_DD attribute WHERE (Web Mercator spatial queries return 0)
const TCEQ_LAYERS = [
  {
    dataset: 'LPST',
    label: 'Leaking Petroleum Storage Tank',
    url: 'https://services2.arcgis.com/LYMgRMwHfrWWEg3s/arcgis/rest/services/TCEQ_Leaking_Petroleum_Storage_Tank/FeatureServer/0',
    riskClass: 'HIGH' as const,
    weight: 1.8,
    nameField: 'SITE_NAME',
    addrField: 'PHYS_ADDR',
    cityField: 'CITY',
    countyField: 'COUNTY',
    latField: 'LAT_DD',
    lngField: 'LONG_DD',
    statusField: 'REM_PROG',
  },
  {
    dataset: 'PST',
    label: 'Petroleum Storage Tank',
    url: 'https://services2.arcgis.com/LYMgRMwHfrWWEg3s/arcgis/rest/services/TCEQ_Petroleum_Storage_Tanks/FeatureServer/0',
    riskClass: 'MODERATE' as const,
    weight: 1.3,
    nameField: 'FACILITY_NAME',
    addrField: 'ADDRESS',
    cityField: 'CITY',
    countyField: 'COUNTY',
    latField: 'lat_dd',
    lngField: 'long_dd',
    statusField: 'UST_TYPE',
  },
  {
    dataset: 'DRYCLEANER',
    label: 'Dry Cleaner Remediation Program',
    url: 'https://services2.arcgis.com/LYMgRMwHfrWWEg3s/arcgis/rest/services/TCEQ_Dry_Cleaner_Remediation_Program/FeatureServer/0',
    riskClass: 'HIGH' as const,
    weight: 1.7,
    nameField: 'FACILITY_NAME',
    addrField: 'PHYS_ADDR',
    cityField: 'CITY',
    countyField: 'COUNTY',
    latField: 'LAT_DD',
    lngField: 'LONG_DD',
    statusField: 'PROGRAM_STATUS',
  },
  {
    dataset: 'VCP',
    label: 'Voluntary Cleanup / Brownfields',
    url: 'https://services2.arcgis.com/LYMgRMwHfrWWEg3s/arcgis/rest/services/TCEQ_Voluntary_Cleanup_Program/FeatureServer/0',
    riskClass: 'MODERATE' as const,
    weight: 1.5,
    nameField: 'SITE_NAME',
    addrField: 'PHYS_ADDR',
    cityField: 'CITY',
    countyField: 'COUNTY',
    latField: 'LAT_DD',
    lngField: 'LONG_DD',
    statusField: 'SITE_STATUS',
  },
  {
    dataset: 'IHWCA',
    label: 'Industrial & Hazardous Waste Corrective Action',
    url: 'https://services2.arcgis.com/LYMgRMwHfrWWEg3s/arcgis/rest/services/TCEQ_Industrial_Hazardous_Waste_Corrective_Action/FeatureServer/0',
    riskClass: 'HIGH' as const,
    weight: 1.7,
    nameField: 'SITE_NAME',
    addrField: 'PHYS_ADDR',
    cityField: 'CITY',
    countyField: 'COUNTY',
    latField: 'LAT_DD',
    lngField: 'LONG_DD',
    statusField: 'SITE_STATUS',
  },
  {
    dataset: 'SUPERFUND',
    label: 'TCEQ Superfund / State Cleanup',
    url: 'https://services2.arcgis.com/LYMgRMwHfrWWEg3s/arcgis/rest/services/TCEQ_Superfund_Sites/FeatureServer/0',
    riskClass: 'HIGH' as const,
    weight: 2.0,
    nameField: 'SITE_NAME',
    addrField: 'PHYS_ADDR',
    cityField: 'CITY',
    countyField: 'COUNTY',
    latField: 'LAT_DD',
    lngField: 'LONG_DD',
    statusField: 'SITE_STATUS',
  },
] as const;

type Layer = typeof TCEQ_LAYERS[number];

async function queryLayer(layer: Layer, bb: ReturnType<typeof bbox1mi>) {
  const where = encodeURIComponent(
    `${layer.latField} BETWEEN ${bb.minLat} AND ${bb.maxLat} AND ${layer.lngField} BETWEEN ${bb.minLng} AND ${bb.maxLng}`
  );
  const fields = [layer.nameField, layer.addrField, layer.cityField, layer.countyField, layer.latField, layer.lngField, layer.statusField].join(',');
  const url = `${layer.url}/query?where=${where}&outFields=${fields}&returnGeometry=false&f=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  const data = await res.json();
  return (data?.features || []) as { attributes: Record<string, unknown> }[];
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lat, lng } = body.coordinates || {};

  if (!lat || !lng) {
    return NextResponse.json({ error: 'coordinates required' }, { status: 400 });
  }

  const bb = bbox1mi(lat, lng);

  const results = await Promise.allSettled(
    TCEQ_LAYERS.map(async (layer) => {
      const features = await queryLayer(layer, bb);
      return features.map((f) => {
        const attrs = f.attributes;
        const facLat = Number(attrs[layer.latField]) || null;
        const facLng = Number(attrs[layer.lngField]) || null;
        const distanceMi = facLat && facLng
          ? Math.round(haversine(lat, lng, facLat, facLng) * 100) / 100
          : null;

        return {
          name: String(attrs[layer.nameField] || 'Unknown Facility'),
          source: 'TCEQ' as const,
          dataset: layer.dataset,
          type: layer.label,
          program: layer.dataset,
          status: String(attrs[layer.statusField] || ''),
          address: String(attrs[layer.addrField] || ''),
          city: String(attrs[layer.cityField] || ''),
          county: String(attrs[layer.countyField] || ''),
          lat: facLat,
          lng: facLng,
          distanceMi,
          riskClass: layer.riskClass,
          weight: layer.weight,
          violations: '',
        };
      });
    })
  );

  // Flatten, filter to true 1-mile radius (bbox is square, haversine is circle)
  const allFacilities = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => (r as PromiseFulfilledResult<unknown[]>).value as ReturnType<typeof Array.prototype.map>)
    .filter((f) => f.distanceMi === null || f.distanceMi <= 1.0)
    .sort((a, b) => (a.distanceMi ?? 99) - (b.distanceMi ?? 99));

  const layerStatus = TCEQ_LAYERS.map((layer, i) => ({
    dataset: layer.dataset,
    status: results[i].status === 'fulfilled' ? 'success' : 'error',
    count: results[i].status === 'fulfilled'
      ? (results[i] as PromiseFulfilledResult<unknown[]>).value.length
      : 0,
  }));

  return NextResponse.json({
    facilitiesNearby: allFacilities,
    totalCount: allFacilities.length,
    layerStatus,
    source: 'TCEQ ArcGIS FeatureServer — services2.arcgis.com/LYMgRMwHfrWWEg3s',
    note: 'Facility data sourced from TCEQ regulatory databases via ArcGIS Online. Federal EPA ECHO data temporarily unavailable; TCEQ data covers all regulated petroleum storage, leaking sites, dry cleaners, brownfields, hazardous waste, and Superfund sites.',
  });
}
