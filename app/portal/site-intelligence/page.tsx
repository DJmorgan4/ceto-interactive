'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const SITE_INTEL_API = process.env.NEXT_PUBLIC_SITE_INTEL_API_URL || 'http://localhost:8001'

const DATASETS = [
  { id: 'usgs_3dep', label: 'USGS 3DEP', desc: 'Elevation / LiDAR', primary: true },
  { id: 'macrostrat', label: 'Macrostrat', desc: 'Geology', primary: true },
  { id: 'soilgrids', label: 'SoilGrids', desc: 'Soils', primary: true },
  { id: 'nhd', label: 'NHD', desc: 'Hydrology', primary: true },
  { id: 'osm', label: 'OSM', desc: 'Context', primary: false },
]

const OUTPUTS = [
  { id: 'hillshade', label: 'Hillshade' },
  { id: 'slope', label: 'Slope' },
  { id: 'drainage', label: 'Drainage' },
  { id: 'geology', label: 'Geology' },
  { id: 'soils', label: 'Soils' },
  { id: 'cross_section', label: 'Cross-Section' },
  { id: 'pdf', label: 'PDF Report' },
]

export default function SiteIntelligencePage() {
  const [projectName, setProjectName] = useState('')
  const [bbox, setBbox] = useState({ minLon: '', minLat: '', maxLon: '', maxLat: '' })
  const [center, setCenter] = useState({ lon: '', lat: '' })
  const [transect, setTransect] = useState({ startLon: '', startLat: '', endLon: '', endLat: '' })
  const [useTransect, setUseTransect] = useState(false)
  const [datasets, setDatasets] = useState(['usgs_3dep', 'macrostrat', 'soilgrids', 'nhd', 'osm'])
  const [outputs, setOutputs] = useState(['hillshade', 'slope', 'drainage', 'geology', 'soils', 'cross_section', 'pdf'])
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<any>(null)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const toggleDataset = (id: string) => {
    setDatasets(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])
  }

  const toggleOutput = (id: string) => {
    setOutputs(prev => prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id])
  }

  const autoCenter = () => {
    const { minLon, minLat, maxLon, maxLat } = bbox
    if (minLon && minLat && maxLon && maxLat) {
      setCenter({
        lon: String(((parseFloat(minLon) + parseFloat(maxLon)) / 2).toFixed(6)),
        lat: String(((parseFloat(minLat) + parseFloat(maxLat)) / 2).toFixed(6)),
      })
    }
  }

  const submitJob = async () => {
    setError('')
    if (!bbox.minLon || !bbox.minLat || !bbox.maxLon || !bbox.maxLat) {
      setError('Bounding box required.'); return
    }
    if (!center.lon || !center.lat) {
      setError('Center point required. Click Auto-Center.'); return
    }
    if (datasets.length === 0) {
      setError('Select at least one dataset.'); return
    }

    const body: any = {
      project_name: projectName || 'Unnamed Site',
      bbox: [parseFloat(bbox.minLon), parseFloat(bbox.minLat), parseFloat(bbox.maxLon), parseFloat(bbox.maxLat)],
      center: [parseFloat(center.lon), parseFloat(center.lat)],
      datasets,
      outputs,
    }

    if (useTransect && transect.startLon && transect.startLat && transect.endLon && transect.endLat) {
      body.transect = {
        start: [parseFloat(transect.startLon), parseFloat(transect.startLat)],
        end: [parseFloat(transect.endLon), parseFloat(transect.endLat)],
      }
    }

    try {
      setSubmitting(true)
      const res = await fetch(`${SITE_INTEL_API}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setJobId(data.job_id)
      setJobStatus(data)
      setPolling(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!polling || !jobId) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${SITE_INTEL_API}/api/jobs/${jobId}`)
        const data = await res.json()
        setJobStatus(data)
        if (data.status === 'complete' || data.status === 'failed') {
          setPolling(false)
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } catch {}
    }, 2500)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [polling, jobId])

  const riskColors: Record<string, string> = {
    Low: '#27ae60', Moderate: '#f39c12', Elevated: '#e74c3c', Unknown: '#7f8c8d'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #1a1a1a', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Ceto Interactive</div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>Site Intelligence</div>
        </div>
        <Link href="/portal/site-intelligence/jobs" style={{ color: '#3498db', fontSize: '13px', textDecoration: 'none' }}>
          View Job History →
        </Link>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>

        {/* Project Name */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Project Name</label>
          <input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="e.g. 817 Sammons Dr — Phase I Screening"
            style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '10px 14px', color: 'white', fontSize: '14px' }}
          />
        </div>

        {/* Bounding Box */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            Bounding Box <span style={{ color: '#444', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(decimal degrees, WGS84)</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            {(['minLon', 'minLat', 'maxLon', 'maxLat'] as const).map(k => (
              <div key={k}>
                <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px' }}>{k}</div>
                <input
                  value={bbox[k]}
                  onChange={e => setBbox(p => ({ ...p, [k]: e.target.value }))}
                  placeholder={k.includes('Lon') ? '-95.50' : '29.50'}
                  style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '8px 10px', color: 'white', fontSize: '13px' }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={autoCenter} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#aaa', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
              Auto-Center
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['lon', 'lat'] as const).map(k => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#555' }}>Center {k}</span>
                  <input
                    value={center[k]}
                    onChange={e => setCenter(p => ({ ...p, [k]: e.target.value }))}
                    style={{ width: '110px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '6px 8px', color: 'white', fontSize: '12px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transect */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <input type="checkbox" id="useTransect" checked={useTransect} onChange={e => setUseTransect(e.target.checked)} />
            <label htmlFor="useTransect" style={{ fontSize: '12px', color: '#aaa', cursor: 'pointer' }}>Include cross-section transect</label>
          </div>
          {useTransect && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
              {(['startLon', 'startLat', 'endLon', 'endLat'] as const).map(k => (
                <div key={k}>
                  <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px' }}>{k}</div>
                  <input
                    value={transect[k]}
                    onChange={e => setTransect(p => ({ ...p, [k]: e.target.value }))}
                    style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '8px 10px', color: 'white', fontSize: '13px' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Datasets */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Datasets</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {DATASETS.map(d => (
              <button key={d.id} onClick={() => toggleDataset(d.id)}
                style={{ padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, border: '1px solid',
                  background: datasets.includes(d.id) ? '#1a3a5c' : '#111',
                  borderColor: datasets.includes(d.id) ? '#3498db' : '#2a2a2a',
                  color: datasets.includes(d.id) ? '#3498db' : '#666' }}>
                {d.label} <span style={{ fontWeight: 400, fontSize: '11px' }}>{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Outputs */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Outputs</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {OUTPUTS.map(o => (
              <button key={o.id} onClick={() => toggleOutput(o.id)}
                style={{ padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, border: '1px solid',
                  background: outputs.includes(o.id) ? '#1a3a1a' : '#111',
                  borderColor: outputs.includes(o.id) ? '#27ae60' : '#2a2a2a',
                  color: outputs.includes(o.id) ? '#27ae60' : '#666' }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#2a0a0a', border: '1px solid #e74c3c', borderRadius: '4px', padding: '12px 16px', marginBottom: '20px', color: '#e74c3c', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Submit */}
        {!jobId && (
          <button onClick={submitJob} disabled={submitting}
            style={{ width: '100%', padding: '14px', background: submitting ? '#1a1a1a' : '#3498db', border: 'none', borderRadius: '4px', color: 'white', fontSize: '15px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Submitting...' : '⚡ Generate Site Intelligence Report'}
          </button>
        )}

        {/* Job Status */}
        {jobStatus && (
          <div style={{ marginTop: '32px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Job Status</div>
              <div style={{ fontSize: '11px', color: '#555' }}>{jobStatus.job_id?.slice(0, 8).toUpperCase()}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: jobStatus.status === 'failed' ? '#e74c3c' : jobStatus.status === 'complete' ? '#27ae60' : '#f39c12' }}>
                  {jobStatus.status?.toUpperCase()}
                </span>
                <span style={{ fontSize: '12px', color: '#555' }}>{jobStatus.progress || 0}%</span>
              </div>
              <div style={{ background: '#1a1a1a', borderRadius: '2px', height: '4px' }}>
                <div style={{ background: jobStatus.status === 'failed' ? '#e74c3c' : '#3498db', height: '4px', borderRadius: '2px', width: `${jobStatus.progress || 0}%`, transition: 'width 0.4s' }} />
              </div>
              {jobStatus.message && <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>{jobStatus.message}</div>}
            </div>

            {jobStatus.status === 'complete' && jobStatus.report_id && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <a href={`${SITE_INTEL_API}/api/reports/${jobStatus.report_id}/download`} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, padding: '12px', background: '#27ae60', borderRadius: '4px', color: 'white', textAlign: 'center', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
                  ⬇ Download PDF
                </a>
                <button onClick={() => { setJobId(null); setJobStatus(null); setError('') }}
                  style={{ flex: 1, padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#aaa', cursor: 'pointer', fontSize: '14px' }}>
                  New Report
                </button>
              </div>
            )}

            {jobStatus.status === 'failed' && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ color: '#e74c3c', fontSize: '12px', marginBottom: '12px' }}>{jobStatus.error}</div>
                <button onClick={() => { setJobId(null); setJobStatus(null); setError('') }}
                  style={{ padding: '10px 20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#aaa', cursor: 'pointer', fontSize: '13px' }}>
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
