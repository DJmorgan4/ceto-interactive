'use client';

import { useState } from 'react';

const THEME = {
  bg: '#F6F7F8',
  surface: 'rgba(255,255,255,0.62)',
  surfaceStrong: 'rgba(255,255,255,0.75)',
  border: 'rgba(20, 35, 55, 0.14)',
  ink: '#142337',
  leviBlue: '#2F5D8C',
  leviBlueDark: '#234B74',
  washedGreen: '#4F7A6A',
  sunset: '#E07A5F',
};

const REPORT_TYPES = [
  { id: 'phase1',  label: 'Phase I ESA',         desc: 'ASTM E1527-21 environmental site assessment' },
  { id: 'swppp',  label: 'SWPPP Inspection',     desc: 'Stormwater pollution prevention plan inspection' },
  { id: 'wetland',label: 'Wetland Delineation',  desc: 'Jurisdictional wetland boundary determination' },
  { id: 'sar',    label: 'SAR Analysis',          desc: 'Synthetic aperture radar vegetation & land cover' },
  { id: 'field',  label: 'Field Survey',          desc: 'General environmental field survey and observations' },
  { id: 'custom', label: 'Custom Report',         desc: 'Freeform report from your notes and data' },
];

const SEED_REPORTS = [
  { id: 1, title: 'Phase I ESA — Taylor County Site',      type: 'Phase I ESA',      date: '2026-04-10', status: 'final', pages: 34 },
  { id: 2, title: 'SAR Vegetation Analysis — Abilene AOI', type: 'SAR Analysis',     date: '2026-04-08', status: 'draft', pages: 12 },
  { id: 3, title: 'SWPPP Inspection Report — Site 7',      type: 'SWPPP Inspection', date: '2026-04-01', status: 'final', pages:  8 },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    draft:  { bg: 'rgba(224,122,95,0.12)', color: '#C4623C' },
    final:  { bg: 'rgba(47,93,140,0.12)',  color: '#2F5D8C' },
  };
  const s = map[status] || { bg: 'rgba(20,35,55,0.08)', color: '#142337' };
  return <span className="text-xs font-light px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: s.bg, color: s.color }}>{status}</span>;
}

function exportPDF(reportText: string, title: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"><title>${title}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Georgia, serif; font-size: 11pt; line-height: 1.75; color: #1a1a2e; background: white; }
      .page { max-width: 780px; margin: 0 auto; padding: 60px 72px; }
      .cover { border-bottom: 3px solid #2F5D8C; padding-bottom: 32px; margin-bottom: 40px; }
      .logo { font-size: 22pt; font-weight: 300; color: #142337; }
      .logo span { color: #2F5D8C; }
      .report-title { font-size: 15pt; font-weight: 400; color: #142337; margin: 20px 0 8px; }
      .meta { font-size: 9.5pt; color: #666; line-height: 1.9; }
      pre { white-space: pre-wrap; font-family: Georgia, serif; font-size: 10.5pt; line-height: 1.8; color: #142337; }
      .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 8.5pt; color: #999; }
      @media print { body { padding: 0; } .page { padding: 40px 56px; } }
    </style>
  </head><body><div class="page">
    <div class="cover">
      <div class="logo">Ceto<span>Interactive</span></div>
      <div class="report-title">${title}</div>
      <div class="meta">Prepared by: Ceto Interactive Environmental Consulting<br>McKinney, Texas · cetointeractive.com<br>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
    <pre>${reportText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
    <div class="footer">© ${new Date().getFullYear()} Ceto Interactive. Confidential — prepared for internal use or named client only.</div>
  </div><script>window.onload=()=>window.print()<\/script></body></html>`);
  win.document.close();
}

export default function ReportsPage() {
  const [selectedType, setSelectedType]       = useState('phase1');
  const [projectName, setProjectName]         = useState('');
  const [clientName, setClientName]           = useState('');
  const [location, setLocation]               = useState('');
  const [surveyDate, setSurveyDate]           = useState('');
  const [notes, setNotes]                     = useState('');
  const [generating, setGenerating]           = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle]   = useState('');
  const [reports, setReports]                 = useState(SEED_REPORTS);
  const [activeTab, setActiveTab]             = useState<'generate' | 'library'>('generate');
  const [copied, setCopied]                   = useState(false);
  const [error, setError]                     = useState('');

  const handleGenerate = async () => {
    if (!projectName || !notes) return;
    setGenerating(true);
    setGeneratedReport(null);
    setError('');
    const rType = REPORT_TYPES.find(r => r.id === selectedType);
    const title = `${rType?.label} — ${projectName}`;
    setGeneratedTitle(title);
    try {
      const res = await fetch('/api/portal/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: rType?.label, projectName, clientName, location, surveyDate, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setGeneratedReport(data.report);
      setReports(prev => [{ id: Date.now(), title, type: rType?.label || 'Custom', date: new Date().toISOString().split('T')[0], status: 'draft', pages: Math.ceil((data.report?.length || 1000) / 3000) }, ...prev]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME.bg }}>
      <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-4"
        style={{ backgroundColor: THEME.surfaceStrong, borderBottom: `1px solid ${THEME.border}`, backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-4">
          <a href="/portal" className="text-sm font-light flex items-center gap-1.5" style={{ color: 'rgba(20,35,55,0.50)' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
            Dashboard
          </a>
          <span style={{ color: THEME.border }}>·</span>
          <h1 className="text-base font-light" style={{ color: THEME.ink }}>Reports</h1>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-full" style={{ backgroundColor: 'rgba(20,35,55,0.06)' }}>
          {(['generate', 'library'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-5 py-1.5 rounded-full text-sm font-light capitalize transition-all"
              style={{ backgroundColor: activeTab === tab ? 'white' : 'transparent', color: activeTab === tab ? THEME.ink : 'rgba(20,35,55,0.55)', boxShadow: activeTab === tab ? '0 1px 3px rgba(20,35,55,0.08)' : 'none' }}>
              {tab === 'generate' ? 'Generate' : `Library (${reports.length})`}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {activeTab === 'generate' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <div className="text-xs font-light tracking-widest uppercase mb-3" style={{ color: 'rgba(20,35,55,0.40)' }}>Report Type</div>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {REPORT_TYPES.map(t => (
                  <button key={t.id} onClick={() => setSelectedType(t.id)} className="text-left p-3.5 rounded-xl transition-all"
                    style={{ backgroundColor: selectedType === t.id ? 'rgba(47,93,140,0.10)' : THEME.surfaceStrong, border: `1px solid ${selectedType === t.id ? 'rgba(47,93,140,0.35)' : THEME.border}` }}>
                    <div className="text-sm font-light" style={{ color: selectedType === t.id ? THEME.leviBlue : THEME.ink }}>{t.label}</div>
                    <div className="text-[11px] font-light mt-0.5" style={{ color: 'rgba(20,35,55,0.45)' }}>{t.desc}</div>
                  </button>
                ))}
              </div>
              <div className="rounded-2xl p-6" style={{ backgroundColor: THEME.surfaceStrong, border: `1px solid ${THEME.border}`, backdropFilter: 'blur(10px)' }}>
                <div className="text-xs font-light tracking-widest uppercase mb-4" style={{ color: 'rgba(20,35,55,0.40)' }}>Project Details</div>
                <div className="flex flex-col gap-4">
                  {[
                    { label: 'Project / Site Name *', value: projectName, set: setProjectName, placeholder: 'e.g. Abilene Solar Farm Site A' },
                    { label: 'Client Name',            value: clientName,  set: setClientName,  placeholder: 'e.g. Apex Energy Partners' },
                    { label: 'Location / AOI',         value: location,    set: setLocation,    placeholder: 'Taylor County, TX · 32.4°N 99.7°W' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs font-light mb-1.5" style={{ color: 'rgba(20,35,55,0.55)' }}>{f.label}</label>
                      <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                        className="w-full text-sm font-light px-4 py-2.5 rounded-xl outline-none"
                        style={{ backgroundColor: 'rgba(20,35,55,0.04)', border: `1px solid ${THEME.border}`, color: THEME.ink }} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-light mb-1.5" style={{ color: 'rgba(20,35,55,0.55)' }}>Survey / Assessment Date</label>
                    <input type="date" value={surveyDate} onChange={e => setSurveyDate(e.target.value)}
                      className="text-sm font-light px-4 py-2.5 rounded-xl outline-none"
                      style={{ backgroundColor: 'rgba(20,35,55,0.04)', border: `1px solid ${THEME.border}`, color: THEME.ink }} />
                  </div>
                  <div>
                    <label className="block text-xs font-light mb-1.5" style={{ color: 'rgba(20,35,55,0.55)' }}>Observations / Field Data *</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={10}
                      placeholder="Paste field notes, GPS coordinates, BMP conditions, soil descriptions, vegetation lists, regulatory context, site history. More detail = more complete report."
                      className="w-full text-sm font-light px-4 py-2.5 rounded-xl outline-none resize-none"
                      style={{ backgroundColor: 'rgba(20,35,55,0.04)', border: `1px solid ${THEME.border}`, color: THEME.ink }} />
                  </div>
                  {error && <div className="text-xs font-light px-4 py-3 rounded-xl" style={{ backgroundColor: 'rgba(224,122,95,0.10)', color: THEME.sunset }}>{error}</div>}
                  <button onClick={handleGenerate} disabled={!projectName || !notes || generating}
                    className="flex items-center justify-center gap-2 text-white px-8 py-3 rounded-full font-light text-sm disabled:opacity-40"
                    style={{ backgroundColor: THEME.leviBlue }}>
                    {generating ? (<><svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Generating...</>) : 'Generate Report'}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-light tracking-widest uppercase mb-3" style={{ color: 'rgba(20,35,55,0.40)' }}>Generated Report</div>
              {!generatedReport && !generating && (
                <div className="rounded-2xl flex flex-col items-center justify-center py-24 text-center" style={{ backgroundColor: THEME.surfaceStrong, border: `1px dashed rgba(20,35,55,0.18)` }}>
                  <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(20,35,55,0.20)', marginBottom: 14 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <div className="text-sm font-light" style={{ color: 'rgba(20,35,55,0.35)' }}>Select report type, fill in details, click Generate</div>
                </div>
              )}
              {generating && (
                <div className="rounded-2xl flex flex-col items-center justify-center py-24 text-center" style={{ backgroundColor: THEME.surfaceStrong, border: `1px solid ${THEME.border}` }}>
                  <svg className="animate-spin mb-4" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: THEME.leviBlue }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  <div className="text-sm font-light mb-1" style={{ color: THEME.ink }}>Composing report...</div>
                  <div className="text-xs font-light" style={{ color: 'rgba(20,35,55,0.45)' }}>Applying {REPORT_TYPES.find(r => r.id === selectedType)?.label} template</div>
                </div>
              )}
              {generatedReport && (
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: THEME.surfaceStrong, border: `1px solid ${THEME.border}`, backdropFilter: 'blur(10px)' }}>
                  <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <div className="flex items-center gap-3">
                      <StatusBadge status="draft" />
                      <span className="text-xs font-light" style={{ color: 'rgba(20,35,55,0.45)' }}>~{Math.ceil(generatedReport.length / 3000)} pages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { navigator.clipboard.writeText(generatedReport); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                        className="text-xs font-light px-3 py-1.5 rounded-lg border" style={{ color: 'rgba(20,35,55,0.60)', borderColor: THEME.border }}>
                        {copied ? '✓ Copied' : 'Copy text'}
                      </button>
                      <button onClick={() => exportPDF(generatedReport, generatedTitle)}
                        className="text-xs font-light px-4 py-1.5 rounded-lg text-white" style={{ backgroundColor: THEME.washedGreen }}>
                        Export PDF
                      </button>
                    </div>
                  </div>
                  <div className="px-6 py-5 max-h-[680px] overflow-y-auto">
                    <pre className="text-sm font-light leading-relaxed whitespace-pre-wrap" style={{ color: THEME.ink, fontFamily: 'inherit' }}>{generatedReport}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: THEME.surfaceStrong, border: `1px solid ${THEME.border}`, backdropFilter: 'blur(10px)' }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${THEME.border}` }}>
              <span className="text-sm font-light" style={{ color: THEME.ink }}>{reports.length} reports</span>
              <button onClick={() => setActiveTab('generate')} className="text-xs font-light px-4 py-1.5 rounded-full text-white" style={{ backgroundColor: THEME.leviBlue }}>+ New Report</button>
            </div>
            {reports.map((r, i) => (
              <div key={r.id} className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: i < reports.length - 1 ? `1px solid ${THEME.border}` : 'none' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(47,93,140,0.10)' }}>
                  <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: THEME.leviBlue }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-light" style={{ color: THEME.ink }}>{r.title}</div>
                  <div className="text-xs font-light mt-0.5" style={{ color: 'rgba(20,35,55,0.45)' }}>{r.type} · {r.date} · ~{r.pages} pages</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
