import { NextRequest, NextResponse } from 'next/server';

interface Coordinates { lat: number; lng: number; }

async function geocode(location: string): Promise<{ coords: Coordinates; address: string; county: string }> {
  const latLngMatch = location.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (latLngMatch) {
    const lat = parseFloat(latLngMatch[1]);
    const lng = parseFloat(latLngMatch[2]);
    const county = await reverseGeocodeCounty(lat, lng);
    return { coords: { lat, lng }, address: location, county };
  }
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(location)}&benchmark=2020&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const matches = data?.result?.addressMatches;
    if (matches && matches.length > 0) {
      const match = matches[0];
      const lat = parseFloat(match.coordinates.y);
      const lng = parseFloat(match.coordinates.x);
      const county = match.addressComponents?.county || await reverseGeocodeCounty(lat, lng);
      return { coords: { lat, lng }, address: match.matchedAddress, county: county + ' County' };
    }
  } catch {}
  const url2 = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&countrycodes=us`;
  const res2 = await fetch(url2, { headers: { 'User-Agent': 'CetoInteractive/1.0 (cetointeractive.com)' }, signal: AbortSignal.timeout(8000) });
  const data2 = await res2.json();
  if (!data2 || data2.length === 0) throw new Error('Location not found — try a full address or lat/lng');
  const lat = parseFloat(data2[0].lat);
  const lng = parseFloat(data2[0].lon);
  const county = await reverseGeocodeCounty(lat, lng);
  return { coords: { lat, lng }, address: data2[0].display_name.split(',').slice(0,3).join(',').trim(), county };
}

async function reverseGeocodeCounty(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=2020&vintage=2020&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    const counties = data?.result?.geographies?.Counties;
    if (counties && counties.length > 0) return counties[0].NAME + ' County';
  } catch {}
  return 'County';
}

async function fetchFEMA(coords: Coordinates) {
  try {
    const { lat, lng } = coords;
    const url = `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,ZONE_SUBTY,DFIRM_ID&returnGeometry=false&f=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    const features = data?.features;
    if (features && features.length > 0) {
      const attrs = features[0].attributes;
      const zone = attrs.FLD_ZONE || 'X';
      const zoneDesc: Record<string,string> = {
        'A':'SFHA — 1% annual chance flood; no BFE determined',
        'AE':'SFHA — 1% annual chance flood with BFE determined',
        'AH':'SFHA — Shallow flooding; ponding, depth 1–3 feet',
        'AO':'SFHA — Shallow flooding; alluvial fan or stream',
        'VE':'Coastal SFHA — 1% annual chance with wave action',
        'X':'Zone X — Minimal flood hazard; outside SFHA',
        'D':'Zone D — Unstudied area; hazard undetermined',
      };
      return { floodZone: zone, floodZoneDesc: zoneDesc[zone] || `Zone ${zone}`, panelNumber: attrs.DFIRM_ID || 'See FIRM', source: 'FEMA NFHL ArcGIS REST' };
    }
    return { floodZone: 'X', floodZoneDesc: 'Zone X — Minimal flood hazard (outside mapped SFHA)', panelNumber: 'Verify at msc.fema.gov', source: 'FEMA NFHL' };
  } catch {
    return { floodZone: 'X', floodZoneDesc: 'Zone X (assumed) — verify at msc.fema.gov', panelNumber: 'Manual verification required', source: 'FEMA NFHL (timeout)' };
  }
}

async function fetchEPAECHO(coords: Coordinates) {
  try {
    const { lat, lng } = coords;
    const url = `https://echo.epa.gov/facilities/map-data/facilities?output=JSON&p_c1lat=${lat}&p_c1long=${lng}&p_c2lat=${lat}&p_c2long=${lng}&p_radius=1&p_act=Y&responseset=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    const results = data?.Results?.Facilities || [];
    const facilities = results.slice(0,5).map((f: Record<string,string>) => ({
      name: f.FacName || 'Unknown Facility',
      type: f.SICCode ? `SIC ${f.SICCode}` : 'Regulated Facility',
      violations: f.CurrentVioFlag === 'Y' ? 'Active violation' : 'No current violation',
    }));
    return { totalCount: results.length, facilitiesNearby: facilities, source: 'EPA ECHO API — 1-mile radius' };
  } catch {
    return { totalCount: 0, facilitiesNearby: [], source: 'EPA ECHO (timeout — search at echo.epa.gov)' };
  }
}

async function fetchNWI(coords: Coordinates) {
  try {
    const { lat, lng } = coords;
    const url = `https://www.fws.gov/wetlandsmapper/rest/services/Wetlands/MapServer/0/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=ATTRIBUTE,WETLAND_TYPE,ACRES&returnGeometry=false&f=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    const features = data?.features || [];
    if (features.length > 0) {
      const wetlandTypes = features.map((f: {attributes: Record<string,string>}) => f.attributes.ATTRIBUTE || f.attributes.WETLAND_TYPE).filter(Boolean);
      const totalAcres = features.reduce((sum: number, f: {attributes: Record<string,string>}) => sum + (parseFloat(f.attributes.ACRES) || 0), 0);
      return { wetlandsPresent: true, wetlandTypes: [...new Set(wetlandTypes)] as string[], acresEstimate: totalAcres > 0 ? totalAcres.toFixed(2) : '<1', source: 'USFWS NWI ArcGIS REST' };
    }
    return { wetlandsPresent: false, wetlandTypes: [], acresEstimate: '0', source: 'USFWS NWI (no wetlands at location)' };
  } catch {
    return { wetlandsPresent: false, wetlandTypes: [], acresEstimate: '0', source: 'USFWS NWI (timeout — verify at fws.gov/wetlands/mapper)' };
  }
}

async function fetchSSURGO(coords: Coordinates) {
  try {
    const { lat, lng } = coords;
    const query = `SELECT mu.muname, c.hydgrp, c.drainagecl, c.hydricrating, c.texinfil FROM mapunit mu INNER JOIN component c ON c.mukey = mu.mukey AND c.majcompflag = 'Yes' WHERE mu.mukey IN (SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('point(${lng} ${lat})')) ORDER BY c.comppct_r DESC`;
    const res = await fetch('https://SDMDataAccess.sc.egov.usda.gov/tabular/post.rest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `query=${encodeURIComponent(query)}&format=JSON&p_type=2`,
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    const rows: string[][] = data?.Table || [];
    if (rows.length > 0) {
      const mapUnits = rows.slice(0,4).map(row => ({
        name: row[0] || 'Unknown',
        hydric: (row[3] || '').toLowerCase().includes('yes'),
        drainage: row[2] || 'Unknown',
        texture: row[4] || 'Unknown',
      }));
      const hydricPct = Math.round((mapUnits.filter(u => u.hydric).length / mapUnits.length) * 100);
      return { mapUnits, hydricPercent: hydricPct, source: 'USDA NRCS SSURGO via Soil Data Access' };
    }
    return { mapUnits: [{ name: 'No SSURGO data', hydric: false, drainage: 'Unknown', texture: 'Unknown' }], hydricPercent: 0, source: 'USDA SSURGO (no data at location)' };
  } catch {
    return { mapUnits: [{ name: 'SSURGO lookup failed', hydric: false, drainage: 'Unknown', texture: 'Unknown' }], hydricPercent: 0, source: 'USDA SSURGO (timeout)' };
  }
}

export async function POST(req: NextRequest) {
  const { location } = await req.json();
  if (!location?.trim()) return NextResponse.json({ error: 'Location is required' }, { status: 400 });
  try {
    const geo = await geocode(location.trim());
    const [fema, epaEcho, nwi, soils] = await Promise.allSettled([
      fetchFEMA(geo.coords),
      fetchEPAECHO(geo.coords),
      fetchNWI(geo.coords),
      fetchSSURGO(geo.coords),
    ]);
    return NextResponse.json({
      coordinates: geo.coords,
      address: geo.address,
      county: geo.county,
      fema: fema.status === 'fulfilled' ? fema.value : { floodZone: 'X', floodZoneDesc: 'Verify at msc.fema.gov', panelNumber: 'N/A', source: 'Error' },
      epaEcho: epaEcho.status === 'fulfilled' ? epaEcho.value : { totalCount: 0, facilitiesNearby: [], source: 'Error' },
      nwi: nwi.status === 'fulfilled' ? nwi.value : { wetlandsPresent: false, wetlandTypes: [], acresEstimate: '0', source: 'Error' },
      soils: soils.status === 'fulfilled' ? soils.value : { mapUnits: [], hydricPercent: 0, source: 'Error' },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Lookup failed' }, { status: 400 });
  }
}
