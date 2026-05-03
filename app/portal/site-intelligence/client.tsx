'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const SITE_INTEL_API = process.env.NEXT_PUBLIC_SITE_INTEL_API_URL || 'http://localhost:8001'
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

const DATASETS = [
  { id: 'usgs_3dep', label: 'USGS 3DEP', desc: 'Elevation' },
  { id: 'macrostrat', label: 'Macrostrat', desc: 'Geology' },
  { id: 'soilgrids', label: 'SSURGO/SoilGrids', desc: 'Soils' },
  { id: 'nhd', label: 'NHD', desc: 'Hydrology' },
  { id: 'osm', label: 'OSM', desc: 'Context' },
  { id: 'nlcd', label: 'NLCD', desc: 'Land Cover' },
]

const OUTPUTS = [
  { id: 'hillshade', label: 'Hillshade' },
  { id: 'slope', label: 'Slope' },
  { id: 'drainage', label: 'Drainage' },
  { id: 'geology', label: 'Geology' },
  { id: 'soils', label: 'Soils' },
  { id: 'nlcd', label: 'Land Cover' },
  { id: 'cross_section', label: 'Cross-Section' },
  { id: 'pdf', label: 'PDF Report' },
]

export default function SiteIntelligenceClient() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const aoiClickRef = useRef<maplibregl.LngLat[]>([])
  const transectClickRef = useRef<number[][]>([])

  const [projectName, setProjectName] = useState('')
  const [bbox, setBbox] = useState<number[] | null>(null)
  const [center, setCenter] = useState<number[] | null>(null)
  const [transect, setTransect] = useState<{start: number[], end: number[]} | null>(null)
  const [isDrawingAOI, setIsDrawingAOI] = useState(false)
  const [isDrawingTransect, setIsDrawingTransect] = useState(false)
  const [aoiDrawn, setAoiDrawn] = useState(false)
  const [transectDrawn, setTransectDrawn] = useState(false)
  const [datasets, setDatasets] = useState(['usgs_3dep', 'macrostrat', 'soilgrids', 'nhd', 'osm', 'nlcd'])
  const [outputs, setOutputs] = useState(['hillshade', 'slope', 'drainage', 'geology', 'soils', 'nlcd', 'cross_section', 'pdf'])
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<any>(null)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [-96.625, 33.20],
      zoom: 9,
    })
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.on('load', () => {
      map.current!.addSource('aoi', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.current!.addLayer({ id: 'aoi-fill', type: 'fill', source: 'aoi', paint: { 'fill-color': '#3498db', 'fill-opacity': 0.15 } })
      map.current!.addLayer({ id: 'aoi-line', type: 'line', source: 'aoi', paint: { 'line-color': '#3498db', 'line-width': 2 } })
      map.current!.addSource('transect', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.current!.addLayer({ id: 'transect-line', type: 'line', source: 'transect', paint: { 'line-color': '#e74c3c', 'line-width': 2, 'line-dasharray': [4, 2] } })
      map.current!.addSource('transect-points', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.current!.addLayer({ id: 'transect-pts', type: 'circle', source: 'transect-points', paint: { 'circle-radius': 6, 'circle-color': '#e74c3c', 'circle-stroke-width': 2, 'circle-stroke-color': 'white' } })
    })
    return () => { map.current?.remove(); map.current = null }
  }, [])

  const isDrawingAOIRef = useRef(false)
  const isDrawingTransectRef = useRef(false)
  useEffect(() => { isDrawingAOIRef.current = isDrawingAOI }, [isDrawingAOI])
  useEffect(() => { isDrawingTransectRef.current = isDrawingTransect }, [isDrawingTransect])

  useEffect(() => {
    if (!map.current) return
    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat
      if (isDrawingAOIRef.current) {
        aoiClickRef.current.push(e.lngLat)
        if (aoiClickRef.current.length >= 2) {
          const pts = aoiClickRef.current
          const lons = pts.map(p => p.lng), lats = pts.map(p => p.lat)
          const minLon = Math.min(...lons), maxLon = Math.max(...lons)
          const minLat = Math.min(...lats), maxLat = Math.max(...lats)
          setBbox([minLon, minLat, maxLon, maxLat])
          setCenter([(minLon + maxLon) / 2, (minLat + maxLat) / 2]);
          (map.current!.getSource('aoi') as maplibregl.GeoJSONSource).setData({
            type: 'FeatureCollection', features: [{
              type: 'Feature', properties: {},
              geometry: { type: 'Polygon', coordinates: [[[minLon,minLat],[maxLon,minLat],[maxLon,maxLat],[minLon,maxLat],[minLon,minLat]]] }
            }]
          })
          aoiClickRef.current = []
          setIsDrawingAOI(false); setAoiDrawn(true)
          map.current!.getCanvas().style.cursor = ''
        }
      }
      if (isDrawingTransectRef.current) {
        transectClickRef.current.push([lng, lat]);
        (map.current!.getSource('transect-points') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection', features: transectClickRef.current.map(p => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: p } }))
        })
        if (transectClickRef.current.length === 2) {
          const pts = transectClickRef.current;
          (map.current!.getSource('transect') as maplibregl.GeoJSONSource).setData({
            type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: pts } }]
          })
          setTransect({ start: pts[0], end: pts[1] })
          setTransectDrawn(true); setIsDrawingTransect(false)
          transectClickRef.current = []
          map.current!.getCanvas().style.cursor = ''
        }
      }
    }
    map.current.on('click', handleClick)
    return () => { map.current?.off('click', handleClick) }
  }, [])

  const clearAll = useCallback(() => {
    if (!map.current) return
    ;(map.current.getSource('aoi') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features: [] })
    ;(map.current.getSource('transect') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features: [] })
    ;(map.current.getSource('transect-points') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features: [] })
    setBbox(null); setCenter(null); setTransect(null)
    setAoiDrawn(false); setTransectDrawn(false)
    setIsDrawingAOI(false); setIsDrawingTransect(false)
    map.current.getCanvas().style.cursor = ''
  }, [])

  const startDrawAOI = () => {
    aoiClickRef.current = []
    setIsDrawingAOI(true); setIsDrawingTransect(false)
    setAoiDrawn(false); setBbox(null); setCenter(null)
    if (map.current) {
      map.current.getCanvas().style.cursor = 'crosshair';
      (map.current.getSource('aoi') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features: [] })
    }
  }

  const startDrawTransect = () => {
    transectClickRef.current = []
    setIsDrawingTransect(true); setIsDrawingAOI(false)
    setTransectDrawn(false); setTransect(null)
    if (map.current) {
      map.current.getCanvas().style.cursor = 'crosshair';
      (map.current.getSource('transect') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features: [] })
      ;(map.current.getSource('transect-points') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features: [] })
    }
  }

  const submitJob = async () => {
    setError('')
    if (!bbox) { setError('Draw an AOI on the map first.'); return }
    if (datasets.length === 0) { setError('Select at least one dataset.'); return }
    const body: any = { project_name: projectName || 'Unnamed Site', bbox, center: center!, datasets, outputs }
    if (transect) body.transect = transect
    try {
      setSubmitting(true)
      const res = await fetch(`${SITE_INTEL_API}/api/jobs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setJobId(data.job_id); setJobStatus(data); setPolling(true)
    } catch (e: any) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  useEffect(() => {
    if (!polling || !jobId) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${SITE_INTEL_API}/api/jobs/${jobId}`)
        const data = await res.json()
        setJobStatus(data)
        if (data.status === 'complete' || data.status === 'failed') { setPolling(false); clearInterval(pollRef.current!) }
      } catch {}
    }, 2500)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [polling, jobId])

  return (
    <div style={{ height: '100vh', background: '#0a0a0a', color: 'white', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: '1px solid #1a1a1a', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '2px' }}>Ceto Interactive</div>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>Site Intelligence</div>
        </div>
        <Link href="/portal/site-intelligence/jobs" style={{ color: '#3498db', fontSize: '12px', textDecoration: 'none' }}>Job History →</Link>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #1a1a1a', overflowY: 'auto', padding: '18px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Project Name</label>
            <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. 817 Sammons Dr"
              style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '8px 10px', color: 'white', fontSize: '12px' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Area of Interest</label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              <button onClick={startDrawAOI} style={{ flex: 1, padding: '8px', background: isDrawingAOI ? '#1a3a5c' : '#111', border: `1px solid ${isDrawingAOI ? '#3498db' : '#2a2a2a'}`, borderRadius: '4px', color: isDrawingAOI ? '#3498db' : '#888', cursor: 'pointer', fontSize: '11px' }}>
                {isDrawingAOI ? '✦ Click two corners...' : '⬜ Draw AOI'}
              </button>
              <button onClick={clearAll} style={{ padding: '8px 10px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '4px', color: '#555', cursor: 'pointer', fontSize: '11px' }}>Clear</button>
            </div>
            {aoiDrawn && bbox ? (
              <div style={{ background: '#0d1f0d', border: '1px solid #27ae60', borderRadius: '4px', padding: '6px 8px', fontSize: '10px', color: '#27ae60' }}>
                ✓ {bbox[0].toFixed(3)},{bbox[1].toFixed(3)} → {bbox[2].toFixed(3)},{bbox[3].toFixed(3)}
              </div>
            ) : <div style={{ fontSize: '10px', color: '#444' }}>Click two opposite corners on the map.</div>}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Transect <span style={{ textTransform: 'none', letterSpacing: 0, color: '#333' }}>(optional)</span></label>
            <button onClick={startDrawTransect} style={{ width: '100%', padding: '8px', background: isDrawingTransect ? '#2a1a1a' : '#111', border: `1px solid ${isDrawingTransect ? '#e74c3c' : '#2a2a2a'}`, borderRadius: '4px', color: isDrawingTransect ? '#e74c3c' : '#888', cursor: 'pointer', fontSize: '11px' }}>
              {isDrawingTransect ? '✦ Click start → end...' : '╱ Draw Transect'}
            </button>
            {transectDrawn && <div style={{ marginTop: '6px', fontSize: '10px', color: '#e74c3c' }}>✓ Transect set</div>}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Datasets</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {DATASETS.map(d => (
                <button key={d.id} onClick={() => setDatasets(prev => prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id])}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', border: '1px solid', background: datasets.includes(d.id) ? '#1a3a5c' : '#111', borderColor: datasets.includes(d.id) ? '#3498db' : '#2a2a2a', color: datasets.includes(d.id) ? '#3498db' : '#555' }}>
                  <span style={{ fontWeight: 600 }}>{d.label}</span><span style={{ opacity: 0.7 }}>{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Outputs</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {OUTPUTS.map(o => (
                <button key={o.id} onClick={() => setOutputs(prev => prev.includes(o.id) ? prev.filter(x => x !== o.id) : [...prev, o.id])}
                  style={{ padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 600, border: '1px solid', background: outputs.includes(o.id) ? '#1a3a1a' : '#111', borderColor: outputs.includes(o.id) ? '#27ae60' : '#2a2a2a', color: outputs.includes(o.id) ? '#27ae60' : '#555' }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ background: '#2a0a0a', border: '1px solid #e74c3c', borderRadius: '4px', padding: '8px 10px', marginBottom: '12px', color: '#e74c3c', fontSize: '11px' }}>{error}</div>}

          {!jobId && (
            <button onClick={submitJob} disabled={submitting || !aoiDrawn}
              style={{ width: '100%', padding: '11px', background: (!aoiDrawn || submitting) ? '#1a1a1a' : '#3498db', border: 'none', borderRadius: '4px', color: (!aoiDrawn || submitting) ? '#444' : 'white', fontSize: '13px', fontWeight: 700, cursor: (!aoiDrawn || submitting) ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Submitting...' : !aoiDrawn ? 'Draw AOI to continue' : '⚡ Generate Report'}
            </button>
          )}

          {jobStatus && (
            <div style={{ marginTop: '12px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</span>
                <span style={{ fontSize: '9px', color: '#444' }}>{jobStatus.job_id?.slice(0, 8).toUpperCase()}</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '11px', color: jobStatus.status === 'failed' ? '#e74c3c' : jobStatus.status === 'complete' ? '#27ae60' : '#f39c12' }}>{jobStatus.status?.toUpperCase()}</span>
                  <span style={{ fontSize: '10px', color: '#555' }}>{jobStatus.progress || 0}%</span>
                </div>
                <div style={{ background: '#1a1a1a', borderRadius: '2px', height: '3px' }}>
                  <div style={{ background: jobStatus.status === 'failed' ? '#e74c3c' : '#3498db', height: '3px', borderRadius: '2px', width: `${jobStatus.progress || 0}%`, transition: 'width 0.4s' }} />
                </div>
                {jobStatus.message && <div style={{ fontSize: '10px', color: '#555', marginTop: '3px' }}>{jobStatus.message}</div>}
              </div>
              {jobStatus.status === 'complete' && jobStatus.report_id && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <a href={`${SITE_INTEL_API}/api/reports/${jobStatus.report_id}/download`} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '9px', background: '#27ae60', borderRadius: '4px', color: 'white', textAlign: 'center', textDecoration: 'none', fontWeight: 700, fontSize: '12px' }}>⬇ Download PDF</a>
                  <button onClick={() => { setJobId(null); setJobStatus(null); setError(''); clearAll() }}
                    style={{ padding: '7px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#aaa', cursor: 'pointer', fontSize: '11px' }}>New Report</button>
                </div>
              )}
              {jobStatus.status === 'failed' && (
                <div>
                  <div style={{ color: '#e74c3c', fontSize: '10px', marginBottom: '6px' }}>{jobStatus.error}</div>
                  <button onClick={() => { setJobId(null); setJobStatus(null); setError('') }}
                    style={{ padding: '7px 12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#aaa', cursor: 'pointer', fontSize: '11px' }}>Try Again</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
          {(isDrawingAOI || isDrawingTransect) && (
            <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.85)', border: `1px solid ${isDrawingAOI ? '#3498db' : '#e74c3c'}`, borderRadius: '6px', padding: '8px 16px', color: 'white', fontSize: '12px', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              {isDrawingAOI ? '🖱 Click two corners to define bounding box' : '🖱 Click start point, then end point'}
            </div>
          )}
          {bbox && (
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', borderRadius: '4px', padding: '5px 8px', fontSize: '10px', color: '#aaa' }}>
              [{bbox.map(v => v.toFixed(4)).join(', ')}]
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
