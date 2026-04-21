import { NextRequest, NextResponse } from 'next/server';

interface FemaResult { floodZone: string; floodZoneDesc: string; panelNumber: string; effectiveDate: string; source: string; }
interface EchoFacility { name: string; type: string; distance: string; violations: string; address: string; }
interface EchoResult { facilitiesNearby: EchoFacility[]; totalCount: number; source: string; }
interface NwiResult { wetlandsPresent: boolean; wetlandTypes: string[]; acresEstimate: string; source: string; }
interface TceqResult { sitesNearby: { name: string; type: string; distance: string }[]; source: string; }

async function geocodeLocation(location: string): Promise<{ lat: number; lng: number; address: string; county: string; state: string } | null> {
  try {
    const coordMatch = location.match(/(-?\d+\.?\d*)[°\s,]+[NS]?\s*,?\s*(-?\d+\.?\d*)[°\s]*[EW]?/i);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      return { lat, lng, address: location, county: 'Unknown County', state: 'TX' };
    }
    const encoded = encodeURIComponent(location);
    const res = await fetch(`https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encoded}&benchmark=Public_AR_Current&format=json`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const match = data?.result?.addressMatches?.[0];
    if (!match) return null;
    return { lat: parseFloat(match.coordinates.y), lng: parseFloat(match.coordinates.x), address: match.matchedAddress, county: match.addressComponents?.county || 'Unknown County', state: match.addressComponents?.state || 'TX' };
  } catch { return null; }
}

async function getFemaFloodZone(lat: number, lng: number): Promise<FemaResult> {
  const ZONES: Record<string, string> = { 'A':'High risk — Special Flood Hazard Area (1% annual chance)', 'AE':'High risk — Special Flood Hazard Area with base flood elevations', 'AH':'High risk — Shallow flooding 1-3 ft', 'AO':'High risk — Sheet flow flooding 1-3 ft', 'X':'Minimal to moderate risk — outside 500-year floodplain', 'VE':'High risk — Coastal flooding with wave action', 'D':'Undetermined flood hazard' };
  try {
    const res = await fetch(`https://msc.fema.gov/arcgis/rest/services/NFHL/FIRMette/MapServer/28/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,DFIRM_ID,EFF_DATE&returnGeometry=false&f=json`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const f = data?.features?.[0]?.attributes;
    if (f) {
      const zone = f.FLD_ZONE || 'X';
      return { floodZone: `Zone ${zone}`, floodZoneDesc: ZONES[zone] || 'See FEMA FIRM map', panelNumber: f.DFIRM_ID || '[DATA NEEDED]', effectiveDate: f.EFF_DATE ? new Date(f.EFF_DATE).toLocaleDateString() : '[DATA NEEDED]', source: 'FEMA National Flood Hazard Layer (NFHL)' };
    }
    return { floodZone: 'Zone X', floodZoneDesc: 'Minimal to moderate risk (default — verify against FIRM panel)', panelNumber: '[DATA NEEDED]', effectiveDate: '[DATA NEEDED]', source: 'FEMA NFHL — no direct hit, Zone X assumed' };
  } catch {
    return { floodZone: 'Lookup Failed', floodZoneDesc: 'Manual FEMA FIRM review required at msc.fema.gov', panelNumber: '[DATA NEEDED]', effectiveDate: '[DATA NEEDED]', source: 'FEMA NFHL — connection error' };
  }
}

async function getEpaEchoFacilities(lat: number, lng: number): Promise<EchoResult> {
  try {
    const res = await fetch(`https://echo.epa.gov/rest/services/ECHO/ECHO_FACILITIES/MapServer/0/query?where=1%3D1&geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=1609&units=esriSRUnit_Meter&outFields=FAC_NAME,FAC_STREET,FAC_CITY,FAC_STATE,RCRA_COMPLIANCE_STATUS,NPDES_STATUS&resultRecordCount=10&returnGeometry=false&f=json`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const features = data?.features || [];
    const facilities: EchoFacility[] = features.map((f: { attributes: Record<string, string> }) => ({
      name: f.attributes?.FAC_NAME || 'Unknown',
      type: [f.attributes?.RCRA_COMPLIANCE_STATUS ? 'RCRA' : '', f.attributes?.NPDES_STATUS ? 'NPDES' : ''].filter(Boolean).join(', ') || 'Regulated',
      distance: 'Within 1 mile',
      violations: f.attributes?.RCRA_COMPLIANCE_STATUS || f.attributes?.NPDES_STATUS || 'Unknown',
      address: [f.attributes?.FAC_STREET, f.attributes?.FAC_CITY, f.attributes?.FAC_STATE].filter(Boolean).join(', '),
    }));
    return { facilitiesNearby: facilities, totalCount: facilities.length, source: 'EPA ECHO (Enforcement and Compliance History Online)' };
  } catch {
    return { facilitiesNearby: [], totalCount: 0, source: 'EPA ECHO — manual review at echo.epa.gov' };
  }
}

async function getNwiWetlands(lat: number, lng: number): Promise<NwiResult> {
  const CODES: Record<string, string> = { 'PFO':'Palustrine Forested', 'PSS':'Palustrine Scrub-Shrub', 'PEM':'Palustrine Emergent', 'PAB':'Palustrine Aquatic Bed', 'PUB':'Palustrine Unconsolidated Bottom', 'R':'Riverine', 'E':'Estuarine', 'L':'Lacustrine' };
  try {
    const delta = 0.003;
    const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
    const res = await fetch(`https://www.fws.gov/wetlands/arcgis/rest/services/Wetlands/MapServer/0/query?geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=WETLAND_TYPE,ACRES,ATTRIBUTE&returnGeometry=false&f=json`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const features = data?.features || [];
    if (features.length === 0) return { wetlandsPresent: false, wetlandTypes: [], acresEstimate: '0', source: 'USFWS National Wetlands Inventory (NWI)' };
    const types = [...new Set(features.map((f: { attributes: Record<string, string> }) => { const code = (f.attributes?.ATTRIBUTE || '').substring(0, 3); return CODES[code] || f.attributes?.ATTRIBUTE || 'Wetland'; }))] as string[];
    const acres = features.reduce((s: number, f: { attributes: Record<string, string> }) => s + (parseFloat(f.attributes?.ACRES) || 0), 0);
    return { wetlandsPresent: true, wetlandTypes: types, acresEstimate: acres.toFixed(2), source: 'USFWS National Wetlands Inventory (NWI)' };
  } catch {
    return { wetlandsPresent: false, wetlandTypes: [], acresEstimate: 'Lookup failed', source: 'USFWS NWI — manual review at fws.gov/wetlands' };
  }
}

function getTceqSites(county: string): TceqResult {
  return { sitesNearby: [{ name: `TCEQ STEERS — ${county}`, type: 'Manual review required', distance: 'County-level' }], source: 'TCEQ STEERS (tceq.texas.gov/search-our-data/steers)' };
}

export async function POST(req: NextRequest) {
  const { location } = await req.json();
  if (!location) return NextResponse.json({ error: 'Location required' }, { status: 400 });

  const geo = await geocodeLocation(location);
  if (!geo) return NextResponse.json({ error: 'Could not geocode location. Try "City, State TX" or lat,lng coordinates.' }, { status: 422 });

  const { lat, lng, address, county, state } = geo;
  const [fema, epaEcho, nwi] = await Promise.all([getFemaFloodZone(lat, lng), getEpaEchoFacilities(lat, lng), getNwiWetlands(lat, lng)]);
  const tceq = getTceqSites(county);

  return NextResponse.json({ coordinates: { lat, lng }, address, county, state, fema, epaEcho, nwi, tceq, timestamp: new Date().toISOString() });
}
