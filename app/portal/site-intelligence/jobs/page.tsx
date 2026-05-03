'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const SITE_INTEL_API = process.env.NEXT_PUBLIC_SITE_INTEL_API_URL || 'http://localhost:8001'

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${SITE_INTEL_API}/api/jobs`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setJobs(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [])

  const statusColor: Record<string, string> = {
    complete: '#27ae60',
    running: '#f39c12',
    queued: '#3498db',
    failed: '#e74c3c',
  }

  const riskColor: Record<string, string> = {
    Low: '#27ae60',
    Moderate: '#f39c12',
    Elevated: '#e74c3c',
    Unknown: '#555',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', fontFamily: 'Inter, sans-serif' }}>

      <div style={{ borderBottom: '1px solid #1a1a1a', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Ceto Interactive</div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>Job History</div>
        </div>
        <Link href="/portal/site-intelligence"
          style={{ background: '#3498db', color: 'white', padding: '8px 18px', borderRadius: '4px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
          + New Report
        </Link>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>

        {loading && (
          <div style={{ color: '#555', fontSize: '14px', textAlign: 'center', padding: '60px 0' }}>Loading jobs...</div>
        )}

        {error && (
          <div style={{ background: '#2a0a0a', border: '1px solid #e74c3c', borderRadius: '4px', padding: '16px', color: '#e74c3c', fontSize: '13px', marginBottom: '20px' }}>
            Could not reach Site Intelligence engine: {error}
            <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>Make sure the FastAPI server is running at {SITE_INTEL_API}</div>
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#444' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>◎</div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>No reports generated yet.</div>
            <Link href="/portal/site-intelligence" style={{ color: '#3498db', fontSize: '13px' }}>Generate your first report →</Link>
          </div>
        )}

        {jobs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {jobs.map((job: any) => (
              <div key={job.job_id}
                style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '6px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{job.project_name || 'Unnamed Site'}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '3px',
                      background: `${statusColor[job.status] || '#555'}22`,
                      color: statusColor[job.status] || '#555',
                      border: `1px solid ${statusColor[job.status] || '#555'}` }}>
                      {job.status?.toUpperCase()}
                    </span>
                    {job.overall_risk && (
                      <span style={{ fontSize: '10px', color: riskColor[job.overall_risk] || '#555' }}>
                        ● {job.overall_risk} Risk
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '20px', fontSize: '11px', color: '#555' }}>
                    <span>ID: {job.job_id?.slice(0, 8).toUpperCase()}</span>
                    <span>{new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {job.status === 'running' && <span style={{ color: '#f39c12' }}>{job.progress || 0}% — {job.message}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                  {job.status === 'complete' && job.report_id && (
                    <a href={`${SITE_INTEL_API}/api/reports/${job.report_id}/download`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ padding: '8px 16px', background: '#27ae60', borderRadius: '4px', color: 'white', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>
                      ⬇ PDF
                    </a>
                  )}
                  {job.status === 'failed' && (
                    <Link href="/portal/site-intelligence"
                      style={{ padding: '8px 16px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#aaa', textDecoration: 'none', fontSize: '12px' }}>
                      Retry
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '32px', padding: '16px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '4px', fontSize: '11px', color: '#444' }}>
          Job history is stored in-memory on the FastAPI server. Restarting the server clears history.
          Supabase persistence coming in next build.
        </div>
      </div>
    </div>
  )
}
