'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const FS = 'Jost, sans-serif';
const T = { blue: '#2F5D8C', border: 'rgba(17,26,36,0.1)', surface: '#FFFFFF', blueLight: 'rgba(47,93,140,0.06)', muted: 'rgba(17,26,36,0.45)', ink: '#111A24' };

interface Facility {
  name: string; type: string; distanceMi?: number | null; program?: string;
  lat?: number | null; lng?: number | null; riskClass?: string; dataset?: string;
  source?: string; status?: string;
}
interface RegData {
  coordinates?: { lat: number; lng: number };
  epaEcho?: { facilitiesNearby?: Facility[] };
  tceq?: { facilitiesNearby?: Facility[] };
  [key: string]: unknown;
}

type LayerKey = 'topo' | 'naip' | 'fema' | 'nwi' | 'facilities';

const LAYER_CONFIG: Record<LayerKey, { label: string; color: string }> = {
  topo:       { label: 'USGS Topo',     color: '#6B5B2B' },
  naip:       { label: 'NAIP Aerial',   color: '#4A7C5A' },
  fema:       { label: 'FEMA Flood',    color: '#2471A3' },
  nwi:        { label: 'NWI Wetlands',  color: '#1A7A4A' },
  facilities: { label: 'Reg. Sites',    color: '#C0392B' },
};

function getRiskColor(rc?: string) {
  return rc === 'HIGH' ? '#EB5757' : rc === 'MODERATE' ? '#F2994A' : '#27AE60';
}

interface Props {
  reg: RegData | null;
  projectName?: string;
  onSnapshot?: (dataUrl: string) => void;
}

export default function RiskMapGL({ reg, projectName, onSnapshot }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    topo: false, naip: false, fema: true, nwi: true, facilities: true,
  });
  const [activeBase, setActiveBase] = useState<'light' | 'satellite'>('light');

  const siteLat = reg?.coordinates?.lat;
  const siteLng = reg?.coordinates?.lng;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const echoFacs: Facility[] = reg?.epaEcho?.facilitiesNearby || [];
  const tceqFacs: Facility[] = (reg as any)?.tceq?.facilitiesNearby || [];
  const seen = new Set<string>();
  const facilities: Facility[] = [...echoFacs, ...tceqFacs]
    .filter(f => { const k = String(f.name)+String(f.lat??'')+String(f.lng??''); if(seen.has(k))return false; seen.add(k); return true; })
    .sort((a, b) => ((a.distanceMi ?? 99) as number) - ((b.distanceMi ?? 99) as number));

  const toggleLayer = useCallback((key: LayerKey) => {
    setLayers(prev => {
      const next = { ...prev, [key]: !prev[key] };
      const map = mapRef.current;
      if (!map) return next;
      const vis = next[key] ? 'visible' : 'none';
      const ids: Record<LayerKey, string[]> = {
        topo: ['usgs-topo-layer'],
        naip: ['naip-layer'],
        fema: ['fema-fill', 'fema-line'],
        nwi: ['nwi-layer'],
        facilities: ['facilities-layer'],
      };
      ids[key].forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (!siteLat || !siteLng || !token || !mapContainerRef.current) return;
    if (mapRef.current) return;

    import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (!mapContainerRef.current || mapRef.current) return;
      mapboxgl.accessToken = token;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: `mapbox://styles/mapbox/${activeBase === 'satellite' ? 'satellite-streets-v12' : 'light-v11'}`,
        center: [siteLng, siteLat],
        zoom: 13,
        preserveDrawingBuffer: true, // needed for snapshot
      });

      mapRef.current = map;

      map.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Map error — using static fallback');
      });

      map.on('load', () => {
        // ── 1-mile radius circle ──────────────────────────────────────────────
        const R = 1609.34;
        const coords: [number, number][] = [];
        for (let i = 0; i <= 64; i++) {
          const angle = (i / 64) * 2 * Math.PI;
          const dx = R * Math.cos(angle);
          const dy = R * Math.sin(angle);
          const dLng = (dx / 111320) / Math.cos(siteLat * Math.PI / 180);
          const dLat = dy / 110540;
          coords.push([siteLng + dLng, siteLat + dLat]);
        }
        map.addSource('radius', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} } });
        map.addLayer({ id: 'radius-fill', type: 'fill', source: 'radius', paint: { 'fill-color': '#1E4976', 'fill-opacity': 0.04 } });
        map.addLayer({ id: 'radius-line', type: 'line', source: 'radius', paint: { 'line-color': '#1E4976', 'line-width': 1.5, 'line-dasharray': [4, 3] } });

        // ── USGS Topo ─────────────────────────────────────────────────────────
        map.addSource('usgs-topo', { type: 'raster', tiles: ['https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: 'USGS National Map' });
        map.addLayer({ id: 'usgs-topo-layer', type: 'raster', source: 'usgs-topo', paint: { 'raster-opacity': 0.7 }, layout: { visibility: 'none' } });

        // ── NAIP Aerial ───────────────────────────────────────────────────────
        map.addSource('naip', { type: 'raster', tiles: ['https://gis.apfo.usda.gov/arcgis/rest/services/NAIP/USDA_CONUS_PRIME/ImageServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: 'USDA NAIP' });
        map.addLayer({ id: 'naip-layer', type: 'raster', source: 'naip', paint: { 'raster-opacity': 0.85 }, layout: { visibility: 'none' } });

        // ── FEMA Flood Zones ──────────────────────────────────────────────────
        map.addSource('fema-nfhl', { type: 'raster', tiles: ['https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&layers=show:28&f=image'], tileSize: 256, attribution: 'FEMA NFHL' });
        map.addLayer({ id: 'fema-fill', type: 'raster', source: 'fema-nfhl', paint: { 'raster-opacity': 0.45 }, layout: { visibility: layers.fema ? 'visible' : 'none' } });

        // ── NWI Wetlands ──────────────────────────────────────────────────────
        map.addSource('nwi', { type: 'raster', tiles: ['https://www.fws.gov/wetlandsmapper/rest/services/Wetlands/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&layers=show:0&f=image'], tileSize: 256, attribution: 'USFWS NWI' });
        map.addLayer({ id: 'nwi-layer', type: 'raster', source: 'nwi', paint: { 'raster-opacity': 0.5 }, layout: { visibility: layers.nwi ? 'visible' : 'none' } });

        // ── Facility markers ──────────────────────────────────────────────────
        const facGeojson: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: facilities.filter(f => f.lat && f.lng).map(f => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [f.lng!, f.lat!] },
            properties: { name: f.name, dataset: f.dataset || f.type, distanceMi: f.distanceMi, riskClass: f.riskClass || 'LOW' },
          })),
        };
        map.addSource('facilities', { type: 'geojson', data: facGeojson });
        map.addLayer({ id: 'facilities-layer', type: 'circle', source: 'facilities', paint: {
          'circle-radius': 6,
          'circle-color': ['case', ['==', ['get', 'riskClass'], 'HIGH'], '#EB5757', ['==', ['get', 'riskClass'], 'MODERATE'], '#F2994A', '#27AE60'],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#fff',
        }, layout: { visibility: layers.facilities ? 'visible' : 'none' } });

        // Facility popups
        const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
        map.on('mouseenter', 'facilities-layer', (e: any) => {
          map.getCanvas().style.cursor = 'pointer';
          const props = e.features[0].properties;
          popup.setLngLat(e.features[0].geometry.coordinates)
            .setHTML(`<div style="font-family:Jost,sans-serif;font-size:11px;padding:4px 0"><strong>${props.name}</strong><br/>${props.dataset}${props.distanceMi != null ? ' · ' + Number(props.distanceMi).toFixed(2) + ' mi' : ''}</div>`)
            .addTo(map);
        });
        map.on('mouseleave', 'facilities-layer', () => { map.getCanvas().style.cursor = ''; popup.remove(); });

        // Site marker
        new mapboxgl.Marker({ color: T.blue, scale: 1.2 }).setLngLat([siteLng, siteLat])
          .setPopup(new mapboxgl.Popup().setHTML(`<div style="font-family:Jost,sans-serif;font-size:11px"><strong>${projectName || 'Subject Property'}</strong><br/>${siteLat.toFixed(5)}°N, ${Math.abs(siteLng).toFixed(5)}°W</div>`))
          .addTo(map);

        setMapReady(true);
      });
    }).catch(err => {
      console.error('mapbox-gl load error:', err);
      setMapError(String(err));
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; setMapReady(false); }
    };
  }, [siteLat, siteLng, token]);

  // Base style switch
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    mapRef.current.setStyle(`mapbox://styles/mapbox/${activeBase === 'satellite' ? 'satellite-streets-v12' : 'light-v11'}`);
  }, [activeBase, mapReady]);

  const handleSnapshot = useCallback(() => {
    if (!mapRef.current || !onSnapshot) return;
    const canvas = mapRef.current.getCanvas();
    onSnapshot(canvas.toDataURL('image/png'));
  }, [onSnapshot]);

  if (!siteLat || !siteLng) return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: '#F4F5F3', padding: '32px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(17,26,36,0.35)', fontFamily: FS, marginBottom: 6 }}>Environmental Risk Map</div>
      <div style={{ fontSize: 12, color: 'rgba(17,26,36,0.5)', fontFamily: FS }}>Enter a site address and click ⚡ Pull to load the interactive map</div>
    </div>
  );

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden', marginBottom: 14 }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.20em', textTransform: 'uppercase', color: T.blue, fontFamily: FS }}>Environmental Risk Map</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {(['light', 'satellite'] as const).map(b => (
            <button key={b} onClick={() => setActiveBase(b)} style={{ padding: '3px 10px', borderRadius: 2, border: 'none', cursor: 'pointer', fontSize: 9, fontFamily: FS, textTransform: 'capitalize', backgroundColor: activeBase === b ? T.blue : 'rgba(17,26,36,0.06)', color: activeBase === b ? 'white' : T.muted }}>
              {b === 'light' ? 'Map' : 'Satellite'}
            </button>
          ))}
          {onSnapshot && mapReady && (
            <button onClick={handleSnapshot} style={{ padding: '3px 10px', borderRadius: 2, border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: 9, fontFamily: FS, backgroundColor: 'white', color: T.muted, marginLeft: 4 }}>
              📷 Capture
            </button>
          )}
        </div>
      </div>

      {/* Layer toggles */}
      <div style={{ padding: '6px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 6, flexWrap: 'wrap' as const, alignItems: 'center' }}>
        <span style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, fontFamily: FS, marginRight: 4 }}>Layers:</span>
        {(Object.keys(LAYER_CONFIG) as LayerKey[]).map(key => (
          <button key={key} onClick={() => toggleLayer(key)}
            style={{ padding: '2px 8px', borderRadius: 2, border: `1px solid ${layers[key] ? LAYER_CONFIG[key].color : T.border}`, cursor: 'pointer', fontSize: 9, fontFamily: FS, backgroundColor: layers[key] ? `${LAYER_CONFIG[key].color}15` : 'transparent', color: layers[key] ? LAYER_CONFIG[key].color : T.muted, transition: 'all 0.15s' }}>
            {layers[key] ? '✓' : '○'} {LAYER_CONFIG[key].label}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div style={{ position: 'relative' }}>
        <div ref={mapContainerRef} style={{ height: 380, width: '100%' }} />
        {!mapReady && !mapError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(244,245,243,0.85)', fontSize: 11, color: T.muted, fontFamily: FS }}>
            Loading map…
          </div>
        )}
        {mapError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F5F3', fontSize: 11, color: T.muted, fontFamily: FS, flexDirection: 'column', gap: 6 }}>
            <div>Interactive map unavailable</div>
            <div style={{ fontSize: 9, color: T.muted }}>{mapError}</div>
          </div>
        )}
        {/* Coordinate badge */}
        {mapReady && (
          <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(255,255,255,0.92)', borderRadius: 2, padding: '3px 8px', fontSize: 9, fontFamily: FS, color: T.muted }}>
            {siteLat.toFixed(5)}°N, {Math.abs(siteLng).toFixed(5)}°W · {facilities.length} regulated facilities
          </div>
        )}
      </div>

      {/* Facility list */}
      {facilities.length > 0 && (
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          <div style={{ padding: '8px 16px', backgroundColor: 'rgba(17,26,36,0.02)' }}>
            <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, fontFamily: FS }}>Mapped Facilities — Sorted by Distance</div>
          </div>
          {facilities.slice(0, 42).map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: i < Math.min(facilities.length, 42) - 1 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: getRiskColor(f.riskClass), flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, color: T.ink, fontFamily: FS, fontWeight: 300 }}>{f.name}</div>
                  <div style={{ fontSize: 10, color: T.muted, fontFamily: FS }}>{f.dataset || f.type}</div>
                </div>
              </div>
              {f.distanceMi != null && (
                <div style={{ fontSize: 11, color: T.blue, fontFamily: FS, fontWeight: 500, flexShrink: 0 }}>{(f.distanceMi as number).toFixed(2)} mi</div>
              )}
            </div>
          ))}
          {facilities.length > 42 && (
            <div style={{ padding: '8px 16px', fontSize: 10, color: T.muted, fontFamily: FS, textAlign: 'center' }}>
              +{facilities.length - 42} additional facilities — see full report
            </div>
          )}
        </div>
      )}
    </div>
  );
}
