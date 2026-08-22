'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

const SITE_INTEL_API =
  process.env.NEXT_PUBLIC_SITE_INTEL_API_URL || 'http://localhost:8001'

// Shared with the Site Intelligence wizard — it mirrors every submitted
// job here so history survives FastAPI restarts.
const STORAGE_JOB_MIRROR = 'ceto:site-intel:jobs'

const COLORS = {
  page: '#071018',
  surface: '#0d1822',
  surfaceStrong: '#111f2c',
  surfaceSoft: '#142637',
  border: 'rgba(151, 179, 199, 0.18)',
  borderStrong: 'rgba(151, 179, 199, 0.32)',
  text: '#f3f7fa',
  muted: '#91a3b2',
  faint: '#607482',
  blue: '#4da3e6',
  blueSoft: 'rgba(77, 163, 230, 0.14)',
  green: '#56c98f',
  greenSoft: 'rgba(86, 201, 143, 0.12)',
  amber: '#e8b55b',
  amberSoft: 'rgba(232, 181, 91, 0.12)',
  red: '#ef6a67',
  redSoft: 'rgba(239, 106, 103, 0.12)',
}

type MirroredJob = {
  job_id: string
  project_name?: string
  client?: string
  bbox?: [number, number, number, number]
  transect?: { start: [number, number]; end: [number, number] } | null
  datasets?: string[]
  outputs?: string[]
  created_at?: string
}

type MergedJob = {
  job_id: string
  project_name: string
  client: string
  status: string
  progress: number
  message: string
  overall_risk: string
  created_at: string | null
  report_id: string | null
  report_url: string | null
  pdf_url: string | null
  download_url: string | null
  onServer: boolean
  mirror: MirroredJob | null
}

const RUNNING_STATUSES = new Set(['running', 'queued', 'pending', 'processing'])
const COMPLETE_STATUSES = new Set(['complete', 'completed', 'success', 'succeeded'])
const FAILED_STATUSES = new Set(['failed', 'error'])

function statusColor(status: string): string {
  if (COMPLETE_STATUSES.has(status)) return COLORS.green
  if (FAILED_STATUSES.has(status)) return COLORS.red
  if (RUNNING_STATUSES.has(status)) return COLORS.amber
  if (status === 'expired') return COLORS.faint
  return COLORS.blue
}

const RISK_COLORS: Record<string, string> = {
  Low: COLORS.green,
  Moderate: COLORS.amber,
  Elevated: COLORS.red,
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${SITE_INTEL_API}${url}`
  return `${SITE_INTEL_API}/${url}`
}

function readMirror(): MirroredJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_JOB_MIRROR)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is MirroredJob =>
        !!item && typeof item === 'object' && typeof item.job_id === 'string',
    )
  } catch {
    return []
  }
}

/** Build the deep link that reopens the Site Intelligence wizard with this
 *  job's exact site and identity — the cross-page contract both pages share. */
function buildRebuildUrl(job: MergedJob): string {
  const params = new URLSearchParams()
  if (job.project_name && job.project_name !== 'Unnamed Site') {
    params.set('project', job.project_name)
  }
  if (job.client) params.set('client', job.client)
  if (job.mirror?.bbox && job.mirror.bbox.length === 4) {
    params.set('bbox', job.mirror.bbox.map((v) => Number(v).toFixed(6)).join(','))
  }
  if (job.mirror?.transect?.start && job.mirror?.transect?.end) {
    params.set(
      'transect',
      [
        job.mirror.transect.start[0],
        job.mirror.transect.start[1],
        job.mirror.transect.end[0],
        job.mirror.transect.end[1],
      ]
        .map((v) => Number(v).toFixed(6))
        .join(','),
    )
  }
  const query = params.toString()
  return query
    ? `/portal/site-intelligence?${query}`
    : '/portal/site-intelligence'
}

function mergeJobs(apiJobs: any[], mirror: MirroredJob[]): MergedJob[] {
  const byId = new Map<string, MergedJob>()

  for (const raw of apiJobs) {
    if (!raw || typeof raw !== 'object') continue
    const id = String(raw.job_id || raw.id || '')
    if (!id) continue

    byId.set(id, {
      job_id: id,
      project_name: String(raw.project_name || 'Unnamed Site'),
      client: String(raw.client || ''),
      status: String(raw.status || 'unknown').toLowerCase(),
      progress: Number.isFinite(Number(raw.progress)) ? Number(raw.progress) : 0,
      message: String(raw.message || ''),
      overall_risk: String(raw.overall_risk || ''),
      created_at: raw.created_at ? String(raw.created_at) : null,
      report_id: raw.report_id ? String(raw.report_id) : null,
      report_url: typeof raw.report_url === 'string' ? raw.report_url : null,
      pdf_url: typeof raw.pdf_url === 'string' ? raw.pdf_url : null,
      download_url: typeof raw.download_url === 'string' ? raw.download_url : null,
      onServer: true,
      mirror: null,
    })
  }

  for (const record of mirror) {
    const existing = byId.get(record.job_id)
    if (existing) {
      // API data wins; the mirror supplies what the API never stored —
      // the bbox, transect and client needed to rebuild the setup.
      existing.mirror = record
      if (!existing.client && record.client) existing.client = record.client
      continue
    }

    // Known locally but gone from the server: the FastAPI process
    // restarted and dropped it. Show it as expired so the analyst can
    // rebuild the setup in one click instead of losing the site.
    byId.set(record.job_id, {
      job_id: record.job_id,
      project_name: record.project_name || 'Unnamed Site',
      client: record.client || '',
      status: 'expired',
      progress: 0,
      message: 'No longer on the engine — rebuild the setup to run it again.',
      overall_risk: '',
      created_at: record.created_at || null,
      report_id: null,
      report_url: null,
      pdf_url: null,
      download_url: null,
      onServer: false,
      mirror: record,
    })
  }

  return Array.from(byId.values()).sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0
    const tb = b.created_at ? Date.parse(b.created_at) : 0
    return tb - ta
  })
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<MergedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const highlightRef = useRef<HTMLDivElement | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchJobs = useCallback(async () => {
    const mirror = readMirror()
    try {
      const res = await fetch(`${SITE_INTEL_API}/api/jobs`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setError('')
      setJobs(mergeJobs(Array.isArray(data) ? data : [], mirror))
    } catch (e: any) {
      setError(e.message || 'Unable to reach the engine.')
      // Engine unreachable — fall back to the local mirror alone so
      // history is still visible and rebuildable.
      setJobs(mergeJobs([], mirror))
    } finally {
      setLoading(false)
    }
  }, [])

  // Read the ?job= highlight once on mount, then load history.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const target = params.get('job')
    if (target) setHighlightId(target)
    void fetchJobs()
  }, [fetchJobs])

  // Keep polling while anything is still running on the engine.
  useEffect(() => {
    const anyRunning = jobs.some((job) => RUNNING_STATUSES.has(job.status))

    if (!anyRunning) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }

    if (pollRef.current) return
    pollRef.current = setInterval(() => {
      void fetchJobs()
    }, 5000)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [jobs, fetchJobs])

  // Scroll the deep-linked job into view once it exists in the list.
  useEffect(() => {
    if (!highlightId || loading) return
    const frame = requestAnimationFrame(() => {
      highlightRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [highlightId, loading, jobs.length])

  const runningCount = useMemo(
    () => jobs.filter((job) => RUNNING_STATUSES.has(job.status)).length,
    [jobs],
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.page,
        color: COLORS.text,
        fontFamily: 'var(--font-inter), Inter, Arial, sans-serif',
      }}
    >
      <header
        style={{
          borderBottom: `1px solid ${COLORS.border}`,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          background: 'rgba(7, 16, 24, 0.96)',
        }}
      >
        <div>
          <div
            style={{
              color: COLORS.faint,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 3,
            }}
          >
            Ceto Environmental Intelligence
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 650 }}>
              Job History
            </h1>
            {runningCount > 0 && (
              <span style={{ color: COLORS.amber, fontSize: 11 }}>
                {runningCount} running · auto-refreshing
              </span>
            )}
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            href="/portal"
            style={{
              color: COLORS.muted,
              textDecoration: 'none',
              fontSize: 11,
              padding: '8px 10px',
            }}
          >
            Portal
          </Link>
          <Link
            href="/portal/site-intelligence"
            style={{
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: 11,
              fontWeight: 650,
              padding: '9px 16px',
              borderRadius: 7,
              background: COLORS.blue,
            }}
          >
            + New report
          </Link>
        </nav>
      </header>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 24px' }}>
        {loading && (
          <div
            style={{
              color: COLORS.faint,
              fontSize: 13,
              textAlign: 'center',
              padding: '60px 0',
            }}
          >
            Loading job history…
          </div>
        )}

        {error && (
          <div
            style={{
              background: COLORS.redSoft,
              border: `1px solid rgba(239, 106, 103, 0.32)`,
              borderRadius: 7,
              padding: 14,
              color: COLORS.red,
              fontSize: 12,
              marginBottom: 18,
              lineHeight: 1.5,
            }}
          >
            Could not reach the Site Intelligence engine: {error}
            <div style={{ marginTop: 6, color: COLORS.muted, fontSize: 11 }}>
              Confirm the FastAPI server is running at {SITE_INTEL_API}.
              {jobs.length > 0 &&
                ' Showing locally mirrored jobs in the meantime.'}
            </div>
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 0',
              color: COLORS.faint,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
            <div style={{ fontSize: 14, marginBottom: 8, color: COLORS.muted }}>
              No reports generated yet.
            </div>
            <Link
              href="/portal/site-intelligence"
              style={{ color: COLORS.blue, fontSize: 13, textDecoration: 'none' }}
            >
              Generate your first report →
            </Link>
          </div>
        )}

        {jobs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jobs.map((job) => {
              const isHighlighted = highlightId === job.job_id
              const color = statusColor(job.status)
              const rebuildUrl = buildRebuildUrl(job)
              const canRebuild = !!job.mirror?.bbox

              const pdfHref = job.report_id
                ? `${SITE_INTEL_API}/api/reports/${encodeURIComponent(job.report_id)}/download`
                : job.pdf_url
                  ? normalizeUrl(job.pdf_url)
                  : job.report_url
                    ? normalizeUrl(job.report_url)
                    : job.download_url
                      ? normalizeUrl(job.download_url)
                      : null

              return (
                <div
                  key={job.job_id}
                  ref={isHighlighted ? highlightRef : undefined}
                  style={{
                    background: COLORS.surface,
                    border: `1px solid ${
                      isHighlighted ? COLORS.blue : COLORS.border
                    }`,
                    boxShadow: isHighlighted
                      ? `0 0 0 1px ${COLORS.blue}`
                      : 'none',
                    borderRadius: 8,
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    opacity: job.status === 'expired' ? 0.75 : 1,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: COLORS.text,
                        }}
                      >
                        {job.project_name}
                      </span>

                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          background: `${color}22`,
                          color,
                          border: `1px solid ${color}55`,
                        }}
                      >
                        {job.status}
                      </span>

                      {job.overall_risk && (
                        <span
                          style={{
                            fontSize: 10,
                            color: RISK_COLORS[job.overall_risk] || COLORS.faint,
                          }}
                        >
                          ● {job.overall_risk} risk
                        </span>
                      )}

                      {job.client && (
                        <span style={{ fontSize: 10, color: COLORS.muted }}>
                          {job.client}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 16,
                        fontSize: 10,
                        color: COLORS.faint,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>ID {job.job_id.slice(0, 8).toUpperCase()}</span>
                      {job.created_at && (
                        <span>
                          {new Date(job.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      {RUNNING_STATUSES.has(job.status) && (
                        <span style={{ color: COLORS.amber }}>
                          {job.progress || 0}%{job.message ? ` — ${job.message}` : ''}
                        </span>
                      )}
                      {job.status === 'expired' && (
                        <span style={{ color: COLORS.muted }}>{job.message}</span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexShrink: 0,
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {COMPLETE_STATUSES.has(job.status) && pdfHref && (
                      <a
                        href={pdfHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '8px 14px',
                          background: COLORS.green,
                          borderRadius: 6,
                          color: '#06110b',
                          textDecoration: 'none',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        Download PDF
                      </a>
                    )}

                    <Link
                      href={rebuildUrl}
                      title={
                        canRebuild
                          ? 'Reopen Site Intelligence with this exact site and project'
                          : 'Reopen Site Intelligence with this project name'
                      }
                      style={{
                        padding: '8px 14px',
                        background: canRebuild ? COLORS.blueSoft : COLORS.surfaceStrong,
                        border: `1px solid ${
                          canRebuild ? COLORS.blue : COLORS.borderStrong
                        }`,
                        borderRadius: 6,
                        color: canRebuild ? COLORS.blue : COLORS.muted,
                        textDecoration: 'none',
                        fontSize: 11,
                        fontWeight: 650,
                      }}
                    >
                      {FAILED_STATUSES.has(job.status) || job.status === 'expired'
                        ? 'Rebuild & retry'
                        : 'Rebuild setup'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div
          style={{
            marginTop: 28,
            padding: 14,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 7,
            fontSize: 11,
            color: COLORS.faint,
            lineHeight: 1.6,
          }}
        >
          Engine history is stored in-memory on the FastAPI server and clears
          on restart. This page also keeps a local mirror of your last 25
          submitted jobs, so expired jobs stay listed here with a one-click
          setup rebuild. Supabase persistence comes in the next build.
        </div>
      </div>
    </div>
  )
}
