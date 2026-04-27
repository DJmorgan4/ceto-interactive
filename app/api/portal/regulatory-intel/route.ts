import { NextRequest, NextResponse } from 'next/server';

interface Coordinates { lat: number; lng: number; }

// ── Haversine distance (miles) ────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function geocode(location: string): Promise<{ coords: Coordinates; address: string; county: string; state: string }> {
  const latLngMatch = location.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (latLngMatch) {
    const lat = parseFloat(latLngMatch[1]);
    const lng = parseFloat(latLngMatch[2]);
    const geo = await reverseGeocode(lat, lng);
    return { coords: { lat, lng }, address: location, ...geo };
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
      const geo = await reverseGeocode(lat, lng);
      return { coords: { lat, lng }, address: match.matchedAddress, ...geo };
    }
  } catch {}
  const url2 = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&countrycodes=us`;
  const res2 = await fetch(url2, { headers: { 'User-Agent': 'CetoInteractive/1.0' }, signal: AbortSignal.timeout(8000) });
  const data2 = await res2.json();
  if (!data2?.length) throw new Error('Location not found — try a full address or lat/lng');
  const lat = parseFloat(data2[0].lat);
  const lng = parseFloat(data2[0].lon);
  const geo = await reverseGeocode(lat, lng);
  return { coords: { lat, lng }, address: data2[0].display_name.split(',').slice(0,3).join(',').trim(), ...geo };
}

async function reverseGeocode(lat: number, lng: number): Promise<{ county: string; state: string }> {
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=2020&vintage=2020&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    const counties = data?.result?.geographies?.Counties;
    const states = data?.result?.geographies?.States;
    return {
      county: counties?.[0] ? counties[0].NAME + ' County' : 'County',
      state: states?.[0]?.NAME || 'Texas',
    };
  } catch {
    return { county: 'County', state: 'Texas' };
  }
}

async function fetchFEMA(coords: Coordinates) {
  try {
    const { lat, lng } = coords;
    const url = `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,ZONE_SUBTY,DFIRM_ID&returnGeometry=false&f=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    const features = data?.features;
    if (features?.length > 0) {
      const attrs = features[0].attributes;
      const zone = attrs.FLD_ZONE || 'X';
      const zoneDesc: Record<string,string> = {
        'A': 'SFHA — 1% annual chance flood; no BFE determined',
        'AE': 'SFHA — 1% annual chance flood with BFE determined',
        'AH': 'SFHA — Shallow flooding; ponding, depth 1–3 feet',
        'AO': 'SFHA — Shallow flooding; alluvial fan or stream',
        'VE': 'Coastal SFHA — 1% annual chance with wave action',
        'X': 'Zone X — Minimal flood hazard; outside SFHA',
        'D': 'Zone D — Unstudied; hazard undetermined',
      };
      const risk = zone.startsWith('A') || zone.startsWith('V') ? 'HIGH' : 'LOW';
      return { floodZone: zone, floodZoneDesc: zoneDesc[zone] || `Zone ${zone}`, panelNumber: attrs.DFIRM_ID || 'See FIRM', source: 'FEMA NFHL ArcGIS REST', risk };
    }
    return { floodZone: 'X', floodZoneDesc: 'Zone X — Minimal flood hazard; outside mapped SFHA', panelNumber: 'Verify at msc.fema.gov', source: 'FEMA NFHL', risk: 'LOW' };
  } catch {
    return { floodZone: 'X', floodZoneDesc: 'Zone X (assumed) — verify at msc.fema.gov', panelNumber: 'Manual verification required', source: 'FEMA NFHL (timeout)', risk: 'LOW' };
  }
}

// ── EPA ECHO — now with real lat/lng and haversine distance ───────────────────
async function fetchEPAECHO(coords: Coordinates) {
  try {
    const { lat, lng } = coords;
    // Use the ECHO REST API that returns facility coordinates
    // FIXED: use proper radius search, not degenerate bounding box
    const url = `https://echo.epa.gov/facilities/map-data/facilities?output=JSON&p_lat=${lat}&p_long=${lng}&p_radius=1&p_act=Y&responseset=10&qcolumns=1,3,5,6,7,8,16,17,23,24`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const data = await res.json();
    const results = data?.Results?.Facilities || [];

    const facilities = results.slice(0, 8).map((f: Record<string, string>) => {
      // Get real facility lat/lng for haversine
      const facLat = parseFloat(f.FacLat || f.Latitude || '0');
      const facLng = parseFloat(f.FacLong || f.Longitude || '0');

      // Compute real distance
      const distanceMi = (facLat && facLng)
        ? Math.round(haversine(lat, lng, facLat, facLng) * 100) / 100
        : null;

      // Determine program type for risk weighting
      const program = f.FacDerivedTRIReporter === 'Y' ? 'TRI'
        : f.FacDerivedRCRAFlagger === 'Y' ? 'RCRA'
        : f.FacDerivedCWAFlagger === 'Y' ? 'NPDES'
        : f.FacDerivedCAAAIRFlagger === 'Y' ? 'Air'
        : f.SICCode ? 'Permit'
        : 'default';

      return {
        name: f.FacName || 'Unknown Facility',
        type: f.SICCode ? `SIC ${f.SICCode}` : program,
        violations: f.CurrentVioFlag === 'Y' ? 'Active violation' : 'No current violation',
        distanceMi,
        distanceDisplay: distanceMi !== null ? `${distanceMi.toFixed(2)} mi` : 'Distance unknown',
        lat: facLat || null,
        lng: facLng || null,
        program,
      };
    });

    // Sort by real distance ascending
    facilities.sort((a: {distanceMi: number | null}, b: {distanceMi: number | null}) => {
      if (a.distanceMi === null) return 1;
      if (b.distanceMi === null) return -1;
      return a.distanceMi - b.distanceMi;
    });

    const risk = results.length === 0 ? 'LOW' : results.length <= 2 ? 'MODERATE' : 'HIGH';
    return {
      totalCount: results.length,
      facilitiesNearby: facilities,
      source: 'EPA ECHO API — 1-mile radius with real distances',
      risk,
    };
  } catch {
    return {
      totalCount: 0,
      facilitiesNearby: [],
      source: 'EPA ECHO (timeout — search at echo.epa.gov)',
      risk: 'LOW',
    };
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
      const wetlandTypes = [...new Set(features.map((f: {attributes: Record<string,string>}) => f.attributes.ATTRIBUTE || f.attributes.WETLAND_TYPE).filter(Boolean))] as string[];
      const totalAcres = features.reduce((sum: number, f: {attributes: Record<string,string>}) => sum + (parseFloat(f.attributes.ACRES) || 0), 0);
      return { wetlandsPresent: true, wetlandTypes, acresEstimate: totalAcres > 0 ? totalAcres.toFixed(2) : '<1', source: 'USFWS NWI ArcGIS REST', risk: 'MODERATE' };
    }
    return { wetlandsPresent: false, wetlandTypes: [], acresEstimate: '0', source: 'USFWS NWI', risk: 'LOW' };
  } catch {
    return { wetlandsPresent: false, wetlandTypes: [], acresEstimate: '0', source: 'USFWS NWI (timeout)', risk: 'LOW' };
  }
}

async function fetchSSURGO(coords: Coordinates) {
  try {
    const { lat, lng } = coords;
    const query = `SELECT mu.muname, c.hydgrp, c.drainagecl, c.hydricrating, c.texinfil, c.pondingfreqcl, c.flodfreqcl, c.taxclname, c.shrinkswel, c.wtdepannmin
      FROM mapunit mu
      INNER JOIN component c ON c.mukey = mu.mukey AND c.majcompflag = 'Yes'
      WHERE mu.mukey IN (SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('point(${lng} ${lat})'))
      ORDER BY c.comppct_r DESC`;
    const res = await fetch('https://SDMDataAccess.sc.egov.usda.gov/tabular/post.rest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `query=${encodeURIComponent(query)}&format=JSON&p_type=2`,
      signal: AbortSignal.timeout(12000),
    });
    const data = await res.json();
    const rows: string[][] = data?.Table || [];
    if (rows.length > 0) {
      const mapUnits = rows.slice(0,4).map(row => ({
        name: row[0] || 'Unknown',
        hydricGroup: row[1] || 'Unknown',
        drainage: row[2] || 'Unknown',
        hydric: (row[3] || '').toLowerCase().includes('yes'),
        texture: row[4] || 'Unknown',
        ponding: row[5] || 'None',
        flooding: row[6] || 'None',
        taxClass: row[7] || 'Unknown',
        shrinkSwell: row[8] || 'Unknown',
        waterTableDepth: row[9] || 'Unknown',
      }));
      const hydricPct = Math.round((mapUnits.filter(u => u.hydric).length / mapUnits.length) * 100);
      const risk = hydricPct > 50 ? 'HIGH' : hydricPct > 0 ? 'MODERATE' : 'LOW';
      const primary = mapUnits[0];
      let interpretation = `Soils at the site consist primarily of ${primary.name}`;
      if (primary.drainage) interpretation += `, characterized by ${primary.drainage.toLowerCase()} drainage`;
      if (primary.hydric) interpretation += ` and hydric characteristics indicating potential wetland conditions`;
      if (primary.shrinkSwell && primary.shrinkSwell !== 'Unknown') interpretation += `. Shrink-swell potential is ${primary.shrinkSwell.toLowerCase()}`;
      interpretation += '.';
      return { mapUnits, hydricPercent: hydricPct, source: 'USDA NRCS SSURGO via Soil Data Access', risk, interpretation };
    }
    return { mapUnits: [], hydricPercent: 0, source: 'USDA SSURGO (no data)', risk: 'LOW', interpretation: 'Soil data unavailable — verify at websoilsurvey.nrcs.usda.gov' };
  } catch {
    return { mapUnits: [], hydricPercent: 0, source: 'USDA SSURGO (timeout)', risk: 'LOW', interpretation: 'Soil data unavailable — verify at websoilsurvey.nrcs.usda.gov' };
  }
}

async function fetchElevation(coords: Coordinates) {
  try {
    const { lat, lng } = coords;
    const url = `https://epqs.nationalmap.gov/v1/json?x=${lng}&y=${lat}&wkid=4326&includeDate=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const elevFt = data?.value;
    if (elevFt && elevFt !== '-1000000') {
      return { elevationFt: Math.round(parseFloat(elevFt)), elevationM: Math.round(parseFloat(elevFt) * 0.3048), source: 'USGS National Elevation Dataset' };
    }
    return { elevationFt: null, elevationM: null, source: 'USGS NED (no data)' };
  } catch {
    return { elevationFt: null, elevationM: null, source: 'USGS NED (timeout)' };
  }
}

async function fetchHydrology(coords: Coordinates) {
  try {
    const { lat, lng } = coords;
    const url = `https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer/2/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=2000&units=esriSRUnit_Meter&outFields=GNIS_Name,FType,LengthKM&returnGeometry=false&f=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    const features = data?.features || [];
    if (features.length > 0) {
      const streams = features
        .filter((f: {attributes: Record<string,string>}) => f.attributes.GNIS_Name)
        .slice(0, 3)
        .map((f: {attributes: Record<string,string>}) => ({ name: f.attributes.GNIS_Name, type: f.attributes.FType }));
      return { nearbyStreams: streams, withinHUC: true, source: 'USGS NHD Plus HR' };
    }
    return { nearbyStreams: [], withinHUC: false, source: 'USGS NHD (no streams within 2km)' };
  } catch {
    return { nearbyStreams: [], withinHUC: false, source: 'USGS NHD (timeout)' };
  }
}

async function fetchGeology(coords: Coordinates) {
  try {
    const { lat, lng } = coords;
    const url = `https://macrostrat.org/api/v2/geologic_units/map?lat=${lat}&lng=${lng}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    const success = data?.success?.data;
    if (success?.length > 0) {
      const unit = success[0];
      return {
        formation: unit.name || unit.strat_name || 'Unknown Formation',
        lithology: unit.lith || 'Unknown',
        age: unit.b_age ? `${unit.b_age}–${unit.t_age} Ma` : 'Unknown',
        description: unit.descrip || '',
        source: 'Macrostrat / USGS NGMDB',
      };
    }
    return { formation: 'Unknown', lithology: 'Unknown', age: 'Unknown', description: '', source: 'USGS NGMDB (no data)' };
  } catch {
    return { formation: 'Unknown', lithology: 'Unknown', age: 'Unknown', description: '', source: 'USGS NGMDB (timeout)' };
  }
}

function computeOverallRisk(femaRisk: string, echoRisk: string, nwiRisk: string, soilRisk: string) {
  const riskMap: Record<string,number> = { LOW: 1, MODERATE: 2, HIGH: 3 };
  const score = Math.max(riskMap[femaRisk]||1, riskMap[echoRisk]||1, riskMap[nwiRisk]||1, riskMap[soilRisk]||1);
  const level = score === 3 ? 'HIGH' : score === 2 ? 'MODERATE' : 'LOW';
  const summaries: Record<string,string> = {
    LOW: 'No significant environmental concerns identified. Site appears suitable for intended use without further Phase II investigation at this time.',
    MODERATE: 'Some environmental factors warrant attention. Recommend further evaluation of flagged items prior to transaction.',
    HIGH: 'Significant environmental concerns identified. Phase II ESA strongly recommended prior to any property transaction.',
  };
  return { level, score, summary: summaries[level] };
}

export async function POST(req: NextRequest) {
  const { location } = await req.json();
  if (!location?.trim()) return NextResponse.json({ error: 'Location is required' }, { status: 400 });

  try {
    const geo = await geocode(location.trim());

    const [fema, epaEcho, nwi, soils, elevation, hydrology, geology] = await Promise.allSettled([
      fetchFEMA(geo.coords),
      fetchEPAECHO(geo.coords),
      fetchNWI(geo.coords),
      fetchSSURGO(geo.coords),
      fetchElevation(geo.coords),
      fetchHydrology(geo.coords),
      fetchGeology(geo.coords),
    ]);

    const femaData = fema.status === 'fulfilled' ? fema.value : { floodZone: 'X', floodZoneDesc: 'Verify at msc.fema.gov', panelNumber: 'N/A', source: 'Error', risk: 'LOW' };
    const echoData = epaEcho.status === 'fulfilled' ? epaEcho.value : { totalCount: 0, facilitiesNearby: [], source: 'Error', risk: 'LOW' };
    const nwiData = nwi.status === 'fulfilled' ? nwi.value : { wetlandsPresent: false, wetlandTypes: [], acresEstimate: '0', source: 'Error', risk: 'LOW' };
    const soilData = soils.status === 'fulfilled' ? soils.value : { mapUnits: [], hydricPercent: 0, source: 'Error', risk: 'LOW', interpretation: '' };
    const elevData = elevation.status === 'fulfilled' ? elevation.value : { elevationFt: null, elevationM: null, source: 'Error' };
    const hydroData = hydrology.status === 'fulfilled' ? hydrology.value : { nearbyStreams: [], withinHUC: false, source: 'Error' };
    const geoData = geology.status === 'fulfilled' ? geology.value : { formation: 'Unknown', lithology: 'Unknown', age: 'Unknown', description: '', source: 'Error' };

    const overallRisk = computeOverallRisk(femaData.risk, echoData.risk, nwiData.risk, soilData.risk);

    return NextResponse.json({
      coordinates: geo.coords,
      address: geo.address,
      county: geo.county,
      state: geo.state,
      fema: femaData,
      epaEcho: echoData,
      nwi: nwiData,
      soils: soilData,
      elevation: elevData,
      hydrology: hydroData,
      geology: geoData,
      overallRisk,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Lookup failed' }, { status: 400 });
  }
}
