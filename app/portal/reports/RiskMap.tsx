'use client';
export { generateNearestFacilityNarrative, generateRiskInterpretation } from '../../../lib/narratives';

import { useEffect, useRef, useState } from 'react';

const T = {
  ink: '#111A24', muted: 'rgba(17,26,36,0.42)',
  blue: '#1E4976', blueLight: 'rgba(30,73,118,0.08)',
  green: '#2D6A4F', greenLight: 'rgba(45,106,79,0.10)',
  amber: '#8C5E1A', amberLight: 'rgba(140,94,26,0.10)',
  red: '#B43C28', redLight: 'rgba(180,60,40,0.10)',
  border: 'rgba(17,26,36,0.11)', surface: 'rgba(255,255,255,0.92)',
};
const FS = "'Jost', sans-serif";

interface Facility {
  name: string;
  type: string;
  program?: string;
  violations?: string;
  distanceMi?: number;
  lat?: number;
  lng?: number;
}

interface RiskMapProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reg: any;
  projectName?: string;
}

function facilityRiskColor(facility: Facility): string {
  const prog = (facility.program || facility.type || '').toUpperCase();
  if (prog.includes('SUPERFUND') || prog.includes('NPL') || prog.includes('CORRACTS')) return '#B43C28';
  if (prog.includes('RCRA')) return '#B43C28';
  if (prog.includes('LUST') || prog.includes('UST')) return '#8C5E1A';
  if (facility.violations?.includes('Active')) return '#8C5E1A';
  if (prog.includes('TRI')) return '#8C5E1A';
  return '#2D6A4F';
}

function facilityRiskLabel(facility: Facility): string {
  const prog = (facility.program || facility.type || '').toUpperCase();
  if (prog.includes('SUPERFUND') || prog.includes('NPL') || prog.includes('CORRACTS')) return 'High Risk';
  if (prog.includes('RCRA') || prog.includes('LUST') || prog.includes('UST')) return 'Moderate-High Risk';
  if (facility.violations?.includes('Active')) return 'Active Violation';
  return 'Low Risk';
}

// Generate nearest facility narrative
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RiskMap({ reg, projectName }: RiskMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'satellite'>('map');

  const siteLat = reg?.coordinates?.lat;
  const siteLng = reg?.coordinates?.lng;
  // Merge TCEQ + ECHO facilities, dedupe by name, sort by distance
  const echoFacs: Facility[] = reg?.epaEcho?.facilitiesNearby || [];
  const tceqFacs: Facility[] = (reg as any)?.tceq?.facilitiesNearby || [];
  const seen = new Set<string>();
  const facilities: Facility[] = [...echoFacs, ...tceqFacs]
    .filter(f => { const k = f.name + (f.lat || '') + (f.lng || ''); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => (a.distanceMi ?? 99) - (b.distanceMi ?? 99));
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!siteLat || !siteLng || !token || !mapContainerRef.current) return;

    let map: unknown;

    import('mapbox-gl').then(({ default: mapboxgl }) => {
      // Required for Next.js — suppress worker URL resolution error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapboxgl as any).workerClass = null;
      if (!mapContainerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapboxgl as any).accessToken = token;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map = new (mapboxgl as any).Map({
        container: mapContainerRef.current,
        style: activeTab === 'satellite'
          ? 'mapbox://styles/mapbox/satellite-streets-v12'
          : 'mapbox://styles/mapbox/light-v11',
        center: [siteLng, siteLat],
        zoom: 13,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mapRef.current = map as any;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any).on('error', () => { setMapError(true); });
      (map as any).on('load', () => {
        setMapLoaded(true);

        // 1-mile radius circle (GeoJSON)
        const radiusGeoJSON = createCircle(siteLat, siteLng, 1.0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).addSource('radius', { type: 'geojson', data: radiusGeoJSON });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).addLayer({
          id: 'radius-fill', type: 'fill', source: 'radius',
          paint: { 'fill-color': '#1E4976', 'fill-opacity': 0.04 }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).addLayer({
          id: 'radius-border', type: 'line', source: 'radius',
          paint: { 'line-color': '#1E4976', 'line-width': 1.5, 'line-dasharray': [4, 3] }
        });

        // FEMA flood overlay via tile service
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).addSource('fema-nfhl', {
          type: 'raster',
          tiles: ['https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&layers=show:28&f=image'],
          tileSize: 256,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).addLayer({ id: 'fema-layer', type: 'raster', source: 'fema-nfhl', paint: { 'raster-opacity': 0.45 } });

        // NWI wetlands overlay
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).addSource('nwi', {
          type: 'raster',
          tiles: ['https://www.fws.gov/wetlandsmapper/rest/services/Wetlands_Raster/ImageServer/exportImage?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&f=image'],
          tileSize: 256,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).addLayer({ id: 'nwi-layer', type: 'raster', source: 'nwi', paint: { 'raster-opacity': 0.40 } });

        // Subject property marker
        const siteEl = document.createElement('div');
        siteEl.style.cssText = `width:16px;height:16px;border-radius:50%;background:#1E4976;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new (mapboxgl as any).Marker({ element: siteEl })
          .setLngLat([siteLng, siteLat])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .setPopup(new (mapboxgl as any).Popup({ offset: 12 }).setHTML(`
            <div style="font-family:'Jost',sans-serif;padding:4px;">
              <div style="font-size:11px;font-weight:500;color:#111A24;">${projectName || 'Subject Property'}</div>
              <div style="font-size:10px;color:#666;margin-top:2px;">${siteLat.toFixed(5)}°N, ${Math.abs(siteLng).toFixed(5)}°W</div>
            </div>
          `))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .addTo(map as any);

        // EPA facility markers with real distances
        facilities.forEach(f => {
          if (!f.lat || !f.lng) return;
          const color = facilityRiskColor(f);
          const label = facilityRiskLabel(f);
          const el = document.createElement('div');
          el.style.cssText = `width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);cursor:pointer;`;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          new (mapboxgl as any).Marker({ element: el })
            .setLngLat([f.lng, f.lat])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .setPopup(new (mapboxgl as any).Popup({ offset: 10 }).setHTML(`
              <div style="font-family:'Jost',sans-serif;padding:4px;min-width:160px;">
                <div style="font-size:11px;font-weight:500;color:#111A24;">${f.name}</div>
                <div style="font-size:10px;color:#666;margin-top:2px;">${f.program || f.type}</div>
                ${f.distanceMi !== undefined ? `<div style="font-size:10px;color:${color};margin-top:2px;">${f.distanceMi.toFixed(2)} mi from site</div>` : ''}
                <div style="font-size:9px;margin-top:3px;padding:2px 6px;background:${color}20;color:${color};border-radius:2px;display:inline-block;">${label}</div>
              </div>
            `))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .addTo(map as any);
        });

        // Navigation controls
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).addControl(new (mapboxgl as any).NavigationControl({ showCompass: false }), 'top-right');
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any).on('error', () => setMapError(true));
    }).catch(() => setMapError(true));

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapLoaded(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteLat, siteLng, token, activeTab]);

  // Circle GeoJSON helper (haversine-based polygon)
  function createCircle(lat: number, lng: number, radiusMi: number) {
    const points = 64;
    const coords = [];
    const distRad = radiusMi / 3959;
    const latRad = lat * Math.PI / 180;
    const lngRad = lng * Math.PI / 180;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const pLat = Math.asin(Math.sin(latRad) * Math.cos(distRad) + Math.cos(latRad) * Math.sin(distRad) * Math.cos(angle));
      const pLng = lngRad + Math.atan2(Math.sin(angle) * Math.sin(distRad) * Math.cos(latRad), Math.cos(distRad) - Math.sin(latRad) * Math.sin(pLat));
      coords.push([pLng * 180 / Math.PI, pLat * 180 / Math.PI]);
    }
    return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} };
  }

  if (!siteLat || !siteLng) return (
    <div style={{ border: '1px solid rgba(17,26,36,0.1)', borderRadius: 4, backgroundColor: '#F4F5F3', padding: '32px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'rgba(17,26,36,0.4)', fontFamily: 'Jost, sans-serif', marginBottom: 4 }}>Environmental Risk Map</div>
      <div style={{ fontSize: 12, color: 'rgba(17,26,36,0.55)', fontFamily: 'Jost, sans-serif' }}>
        Enter a site address and click ⚡ Pull to load the interactive map
      </div>
    </div>
  );
  if (!token) return (
    <div style={{ padding: 16, background: T.amberLight, borderRadius: 4, fontSize: 11, color: T.amber, fontFamily: FS }}>
      Add NEXT_PUBLIC_MAPBOX_TOKEN to enable interactive map
    </div>
  );

  const facilitiesWithCoords = facilities.filter(f => f.lat && f.lng);

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.20em', textTransform: 'uppercase', color: T.blue, fontFamily: FS }}>
          Environmental Risk Map
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['map', 'satellite'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '3px 10px', borderRadius: 2, border: 'none', cursor: 'pointer', fontSize: 9, fontFamily: FS, textTransform: 'capitalize', backgroundColor: activeTab === tab ? T.blue : 'rgba(17,26,36,0.06)', color: activeTab === tab ? 'white' : T.muted }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div style={{ position: 'relative' }}>
        <div ref={mapContainerRef} style={{ height: 320, width: '100%' }} />
        {!mapLoaded && !mapError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(244,245,243,0.8)', fontSize: 11, color: T.muted, fontFamily: FS }}>
            Loading map...
          </div>
        )}
        {mapError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F5F3', fontSize: 11, color: T.muted, fontFamily: FS }}>
            Map unavailable — verify Mapbox token
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {[
            { color: T.blue,   label: 'Subject Property', shape: 'circle' },
            { color: '#B43C28', label: 'High Risk Facility (RCRA/Superfund)', shape: 'circle' },
            { color: '#8C5E1A', label: 'Moderate Risk Facility (UST/LUST)', shape: 'circle' },
            { color: '#2D6A4F', label: 'Low Risk Facility', shape: 'circle' },
            { color: 'rgba(30,73,118,0.25)', label: '1-Mile Search Radius', shape: 'dashed' },
            { color: 'rgba(29,158,117,0.45)', label: 'NWI Wetlands Overlay', shape: 'square' },
            { color: 'rgba(55,138,221,0.45)', label: 'FEMA Flood Zones', shape: 'square' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {item.shape === 'circle' ? (
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
              ) : item.shape === 'square' ? (
                <div style={{ width: 10, height: 8, backgroundColor: item.color, borderRadius: 1, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 14, height: 2, borderTop: `2px dashed ${T.blue}`, flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 8, color: T.muted, fontFamily: FS }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Facility list with real distances */}
      {facilitiesWithCoords.length > 0 && (
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          <div style={{ padding: '8px 16px 4px', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, fontFamily: FS }}>
            Mapped Facilities — Sorted by Distance
          </div>
          {facilitiesWithCoords
            .sort((a, b) => (a.distanceMi ?? 99) - (b.distanceMi ?? 99))
            .map((f, i) => {
              const color = facilityRiskColor(f);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px', borderBottom: i < facilitiesWithCoords.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: T.ink, fontFamily: FS, fontWeight: 300 }}>{f.name}</div>
                    <div style={{ fontSize: 9, color: T.muted, fontFamily: FS }}>{f.program || f.type}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {f.distanceMi !== undefined && (
                      <div style={{ fontSize: 11, color, fontFamily: FS, fontWeight: 500 }}>{f.distanceMi.toFixed(2)} mi</div>
                    )}
                    <div style={{ fontSize: 8, color: T.muted, fontFamily: FS }}>{facilityRiskLabel(f)}</div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {facilities.length > 0 && facilitiesWithCoords.length === 0 && (
        <div style={{ padding: '8px 16px', borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.muted, fontFamily: FS }}>
          {facilities.length} facilities identified — coordinate data unavailable for map display. Search at echo.epa.gov for locations.
        </div>
      )}

      {facilities.length === 0 && (
        <div style={{ padding: '8px 16px', borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.green, fontFamily: FS }}>
          ✓ No EPA-regulated facilities within 1-mile search radius
        </div>
      )}
    </div>
  );
}
