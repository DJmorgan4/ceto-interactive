'use client';

import { useState, useCallback } from 'react';

const THEME = {
  bg: '#F6F7F8',
  surfaceStrong: 'rgba(255,255,255,0.85)',
  border: 'rgba(20, 35, 55, 0.14)',
  ink: '#142337',
  leviBlue: '#2F5D8C',
  leviBlueDark: '#234B74',
  washedGreen: '#4F7A6A',
  sunset: '#E07A5F',
};

const REPORT_TYPES = [
  { id: 'phase1',  label: 'Phase I ESA',        desc: 'ASTM E1527-21 site assessment' },
  { id: 'swppp',  label: 'SWPPP Inspection',    desc: 'TPDES TXR150000 stormwater' },
  { id: 'wetland',label: 'Wetland Delineation', desc: '1987 Corps manual + regional supp.' },
  { id: 'sar',    label: 'SAR Analysis',         desc: 'Backscatter, NDVI, land cover' },
  { id: 'field',  label: 'Field Survey',         desc: 'General environmental observation' },
  { id: 'custom', label: 'Custom Report',        desc: 'Freeform from your notes' },
];

function Badge({ label, color }: { label: string; color: 'blue'|'green'|'red'|'gray' }) {
  const s = { blue:{bg:'rgba(47,93,140,0.12)',color:'#2F5D8C'}, green:{bg:'rgba(79,122,106,0.12)',color:'#4F7A6A'}, red:{bg:'rgba(224,122,95,0.14)',color:'#C4623C'}, gray:{bg:'rgba(20,35,55,0.08)',color:'rgba(20,35,55,0.55)'} }[color];
  return <span className="text-[11px] font-light px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>{label}</span>;
}

interface RegData {
  coordinates: { lat: number; lng: number };
  address: string; county: string;
  fema: { floodZone: string; floodZoneDesc: string; panelNumber: string; source: string };
  epaEcho: { facilitiesNearby: { name: string; type: string; violations: string }[]; totalCount: number; source: string };
  nwi: { wetlandsPresent: boolean; wetlandTypes: string[]; acresEstimate: string; source: string };
  tceq: { source: string };
}

function RegPanel({ data, loading, error }: { data: RegData|null; loading: boolean; error: string }) {
  if (loading) return (
    <div className="rounded-2xl p-6 flex items-center gap-4" style={{ backgroundColor: THEME.surfaceStrong, border:`1px solid ${THEME.border}` }}>
      <svg className="animate-spin flex-shrink-0" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: THEME.leviBlue }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
      <div><div className="text-sm font-light" style={{ color:THEME.ink }}>Pulling regulatory databases...</div><div className="text-xs font-light mt-0.5" style={{ color:'rgba(20,35,55,0.45)' }}>FEMA NFHL · EPA ECHO · USFWS NWI · TCEQ</div></div>
    </div>
  );
  if (error) return <div className="rounded-2xl p-5" style={{ backgroundColor:'rgba(224,122,95,0.08)', border:'1px solid rgba(224,122,95,0.25)' }}><div className="text-xs font-light" style={{ color:THEME.sunset }}>{error}</div></div>;
  if (!data) return (
    <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: THEME.surfaceStrong, border:`1px dashed rgba(20,35,55,0.15)` }}>
      <div className="text-xs font-light tracking-widest uppercase mb-2" style={{ color:'rgba(20,35,55,0.30)' }}>Regulatory Intelligence</div>
      <div className="text-sm font-light mb-4" style={{ color:'rgba(20,35,55,0.40)' }}>Enter a location and click <span style={{ color:THEME.leviBlue }}>⚡ Pull</span> to auto-populate from live federal databases</div>
      <div className="grid grid-cols-2 gap-2 text-[11px] font-light text-left" style={{ color:'rgba(20,35,55,0.35)' }}>
        {['FEMA Flood Zone','EPA ECHO Violations','USFWS NWI Wetlands','TCEQ STEERS Sites'].map(s=>(
          <div key={s} className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor:'rgba(20,35,55,0.20)' }}/>{s}</div>
        ))}
      </div>
    </div>
  );
  const highRisk = data.fema.floodZone.includes('A') || data.fema.floodZone.includes('V');
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: THEME.surfaceStrong, border:`1px solid ${THEME.border}` }}>
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom:`1px solid ${THEME.border}`, backgroundColor:'rgba(47,93,140,0.04)' }}>
        <div><div className="text-xs font-light tracking-widest uppercase" style={{ color:THEME.leviBlue }}>Regulatory Intelligence</div><div className="text-[11px] font-light mt-0.5" style={{ color:'rgba(20,35,55,0.50)' }}>{data.address} · {data.county}</div></div>
        <Badge label="✓ Live data" color="green"/>
      </div>
      <div className="divide-y" style={{ borderColor:THEME.border }}>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-1.5"><div className="text-xs font-light tracking-widests uppercase" style={{ color:'rgba(20,35,55,0.40)' }}>FEMA Flood Zone</div><Badge label={data.fema.floodZone} color={highRisk?'red':'green'}/></div>
          <div className="text-sm font-light" style={{ color:THEME.ink }}>{data.fema.floodZoneDesc}</div>
          <div className="text-[11px] font-light mt-1" style={{ color:'rgba(20,35,55,0.40)' }}>Panel: {data.fema.panelNumber} · {data.fema.source}</div>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-1.5"><div className="text-xs font-light tracking-widests uppercase" style={{ color:'rgba(20,35,55,0.40)' }}>EPA ECHO — 1 Mile Radius</div><Badge label={`${data.epaEcho.totalCount} facilities`} color={data.epaEcho.totalCount>0?'red':'green'}/></div>
          {data.epaEcho.facilitiesNearby.length===0 ? <div className="text-sm font-light" style={{ color:THEME.ink }}>No regulated facilities identified within 1 mile</div> : (
            <div className="flex flex-col gap-1.5 mt-1">{data.epaEcho.facilitiesNearby.slice(0,3).map((f,i)=>(
              <div key={i} className="text-[12px] font-light p-2 rounded-lg" style={{ backgroundColor:'rgba(224,122,95,0.07)', color:THEME.ink }}><span className="font-normal">{f.name}</span><span style={{ color:'rgba(20,35,55,0.50)' }}> · {f.type}</span></div>
            ))}</div>
          )}
          <div className="text-[11px] font-light mt-1.5" style={{ color:'rgba(20,35,55,0.40)' }}>{data.epaEcho.source}</div>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-1.5"><div className="text-xs font-light tracking-widests uppercase" style={{ color:'rgba(20,35,55,0.40)' }}>USFWS NWI Wetlands</div><Badge label={data.nwi.wetlandsPresent?`${data.nwi.acresEstimate} ac`:'None mapped'} color={data.nwi.wetlandsPresent?'red':'green'}/></div>
          {data.nwi.wetlandsPresent ? <div><div className="text-sm font-light mb-1.5" style={{ color:THEME.ink }}>Wetlands identified — field verification required</div><div className="flex flex-wrap gap-1.5">{data.nwi.wetlandTypes.map((t,i)=><Badge key={i} label={t} color="blue"/>)}</div></div> : <div className="text-sm font-light" style={{ color:THEME.ink }}>No wetlands mapped within AOI</div>}
          <div className="text-[11px] font-light mt-1.5" style={{ color:'rgba(20,35,55,0.40)' }}>{data.nwi.source}</div>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-1.5"><div className="text-xs font-light tracking-widests uppercase" style={{ color:'rgba(20,35,55,0.40)' }}>TCEQ STEERS</div><Badge label="Manual review" color="gray"/></div>
          <div className="text-sm font-light" style={{ color:THEME.ink }}>Search required for {data.county}</div>
          <a href="https://www2.tceq.texas.gov/oce/eer/index.cfm" target="_blank" rel="noopener noreferrer" className="text-[11px] font-light mt-1 block" style={{ color:THEME.leviBlue }}>→ Open TCEQ STEERS ↗</a>
        </div>
      </div>
    </div>
  );
}

function exportPDF(reportText: string, title: string, reg: RegData|null) {
  const win = window.open('','_blank');
  if (!win) return;
  const regBlock = reg ? `<div class="reg"><div class="reg-title">REGULATORY DATABASE SUMMARY</div><table>${[
    ['FEMA Flood Zone', `${reg.fema.floodZone} — ${reg.fema.floodZoneDesc}`],
    ['FIRM Panel', reg.fema.panelNumber],
    ['EPA ECHO (1 mi)', `${reg.epaEcho.totalCount} regulated facilities`],
    ['USFWS NWI', reg.nwi.wetlandsPresent?`${reg.nwi.acresEstimate} acres — ${reg.nwi.wetlandTypes.join(', ')}`:'No wetlands mapped'],
    ['TCEQ', 'Manual STEERS search required'],
    ['Coordinates', `${reg.coordinates.lat.toFixed(5)}°N, ${reg.coordinates.lng.toFixed(5)}°W`],
    ['County', reg.county],
  ].map(([k,v])=>`<tr><td class="k">${k}</td><td>${v}</td></tr>`).join('')}</table><div class="note">Sources: FEMA NFHL, EPA ECHO, USFWS NWI. Retrieved ${new Date().toLocaleDateString()}.</div></div>` : '';
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;font-size:11pt;line-height:1.75;color:#1a1a2e}.page{max-width:780px;margin:0 auto;padding:60px 72px}.cover{border-bottom:3px solid #2F5D8C;padding-bottom:28px;margin-bottom:36px}.logo{font-size:20pt;font-weight:300;color:#142337}.logo span{color:#2F5D8C}.title{font-size:14pt;margin:20px 0 6px}.meta{font-size:9.5pt;color:#555;line-height:2}.reg{background:#f4f6f9;border-left:3px solid #2F5D8C;padding:16px 20px;margin:24px 0 32px}.reg-title{font-size:8.5pt;font-weight:600;letter-spacing:.12em;color:#2F5D8C;text-transform:uppercase;margin-bottom:10px}table{width:100%;border-collapse:collapse;font-size:9.5pt}td{padding:3px 8px 3px 0;vertical-align:top}.k{font-weight:600;color:#444;width:160px;white-space:nowrap}.note{font-size:8pt;color:#888;margin-top:10px;font-style:italic}pre{white-space:pre-wrap;font-family:Georgia,serif;font-size:10.5pt;line-height:1.8}.footer{margin-top:48px;padding-top:16px;border-top:1px solid #ddd;font-size:8pt;color:#aaa}@media print{.page{padding:36px 52px}}</style></head><body><div class="page"><div class="cover"><div class="logo">Ceto<span>Interactive</span></div><div class="title">${title}</div><div class="meta">Prepared by: Ceto Interactive Environmental Consulting<br>McKinney, Texas · cetointeractive.com<br>Report Date: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div></div>${regBlock}<pre>${reportText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre><div class="footer">© ${new Date().getFullYear()} Ceto Interactive. Confidential. All regulatory data reflects conditions at time of query.</div></div><script>window.onload=()=>window.print()<\/script></body></html>`);
  win.document.close();
}

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState('phase1');
  const [projectName, setProjectName]   = useState('');
  const [clientName, setClientName]     = useState('');
  const [location, setLocation]         = useState('');
  const [surveyDate, setSurveyDate]     = useState('');
  const [notes, setNotes]               = useState('');
  const [generating, setGenerating]     = useState(false);
  const [report, setReport]             = useState<string|null>(null);
  const [title, setTitle]               = useState('');
  const [library, setLibrary]           = useState<{id:number;title:string;type:string;date:string;status:string;pages:number}[]>([]);
  const [tab, setTab]                   = useState<'generate'|'library'>('generate');
  const [copied, setCopied]             = useState(false);
  const [error, setError]               = useState('');
  const [reg, setReg]                   = useState<RegData|null>(null);
  const [regLoading, setRegLoading]     = useState(false);
  const [regError, setRegError]         = useState('');

  const pullReg = useCallback(async () => {
    if (!location) return;
    setRegLoading(true); setRegError(''); setReg(null);
    try {
      const res = await fetch('/api/portal/regulatory-intel', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({location}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Lookup failed');
      setReg(data);
    } catch(e:unknown) { setRegError(e instanceof Error?e.message:'Regulatory lookup failed'); }
    setRegLoading(false);
  }, [location]);

  const buildRegContext = (r:RegData|null) => !r ? '' : `\n\nREGULATORY DATABASE FINDINGS (AUTO-RETRIEVED):\n- Address: ${r.address}\n- County: ${r.county}\n- Coordinates: ${r.coordinates.lat.toFixed(5)}°N, ${r.coordinates.lng.toFixed(5)}°W\n- FEMA: ${r.fema.floodZone} — ${r.fema.floodZoneDesc} (Panel: ${r.fema.panelNumber})\n- EPA ECHO: ${r.epaEcho.totalCount>0?`${r.epaEcho.totalCount} regulated facilities within 1 mile: ${r.epaEcho.facilitiesNearby.map(f=>f.name).join(', ')}`:'No regulated facilities within 1 mile'}\n- NWI: ${r.nwi.wetlandsPresent?`${r.nwi.acresEstimate} acres mapped (${r.nwi.wetlandTypes.join(', ')})`:'No wetlands mapped'}\n- TCEQ: Manual STEERS search required\n\nIncorporate these findings into the Records Review section with proper citations.`;

  const generate = async () => {
    if (!projectName||!notes) return;
    setGenerating(true); setReport(null); setError('');
    const rType = REPORT_TYPES.find(r=>r.id===selectedType);
    const t = `${rType?.label} — ${projectName}`;
    setTitle(t);
    try {
      const res = await fetch('/api/portal/generate-report', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ reportType:rType?.label, projectName, clientName, location, surveyDate, notes: notes + buildRegContext(reg) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Failed');
      setReport(data.report);
      setLibrary(prev=>[{id:Date.now(),title:t,type:rType?.label||'Custom',date:new Date().toISOString().split('T')[0],status:'draft',pages:Math.ceil((data.report?.length||1000)/3000)},...prev]);
    } catch(e:unknown) { setError(e instanceof Error?e.message:'Generation failed'); }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor:THEME.bg }}>
      <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-4" style={{ backgroundColor:THEME.surfaceStrong, borderBottom:`1px solid ${THEME.border}`, backdropFilter:'blur(12px)' }}>
        <div className="flex items-center gap-4">
          <a href="/portal" className="text-sm font-light flex items-center gap-1.5" style={{ color:'rgba(20,35,55,0.50)' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/></svg>Dashboard
          </a>
          <span style={{ color:THEME.border }}>·</span>
          <h1 className="text-base font-light" style={{ color:THEME.ink }}>Reports</h1>
          {reg && <Badge label="⚡ Regulatory data loaded" color="green"/>}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-full" style={{ backgroundColor:'rgba(20,35,55,0.06)' }}>
          {(['generate','library'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className="px-5 py-1.5 rounded-full text-sm font-light capitalize transition-all"
              style={{ backgroundColor:tab===t?'white':'transparent', color:tab===t?THEME.ink:'rgba(20,35,55,0.55)', boxShadow:tab===t?'0 1px 3px rgba(20,35,55,0.08)':'none' }}>
              {t==='generate'?'Generate':`Library (${library.length})`}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {tab==='generate' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* COL 1 — Form */}
            <div className="flex flex-col gap-5">
              <div>
                <div className="text-xs font-light tracking-widests uppercase mb-3" style={{ color:'rgba(20,35,55,0.40)' }}>Report Type</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {REPORT_TYPES.map(t=>(
                    <button key={t.id} onClick={()=>setSelectedType(t.id)} className="text-left p-3 rounded-xl transition-all"
                      style={{ backgroundColor:selectedType===t.id?'rgba(47,93,140,0.10)':THEME.surfaceStrong, border:`1px solid ${selectedType===t.id?'rgba(47,93,140,0.35)':THEME.border}` }}>
                      <div className="text-sm font-light" style={{ color:selectedType===t.id?THEME.leviBlue:THEME.ink }}>{t.label}</div>
                      <div className="text-[10px] font-light mt-0.5" style={{ color:'rgba(20,35,55,0.40)' }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-5 flex flex-col gap-3.5" style={{ backgroundColor:THEME.surfaceStrong, border:`1px solid ${THEME.border}` }}>
                <div className="text-xs font-light tracking-widests uppercase" style={{ color:'rgba(20,35,55,0.40)' }}>Project Details</div>
                {[{label:'Project / Site Name *',value:projectName,set:setProjectName,ph:'e.g. Abilene Solar Farm — Site A'},{label:'Client Name',value:clientName,set:setClientName,ph:'e.g. Apex Energy Partners'}].map(f=>(
                  <div key={f.label}><label className="block text-[11px] font-light mb-1" style={{ color:'rgba(20,35,55,0.50)' }}>{f.label}</label>
                  <input value={f.value} onChange={e=>f.set(e.target.value)} placeholder={f.ph} className="w-full text-sm font-light px-3.5 py-2 rounded-xl outline-none" style={{ backgroundColor:'rgba(20,35,55,0.04)', border:`1px solid ${THEME.border}`, color:THEME.ink }}/></div>
                ))}
                <div>
                  <label className="block text-[11px] font-light mb-1" style={{ color:'rgba(20,35,55,0.50)' }}>Location / Coordinates *</label>
                  <div className="flex gap-2">
                    <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Address, city, or lat/lng" className="flex-1 text-sm font-light px-3.5 py-2 rounded-xl outline-none" style={{ backgroundColor:'rgba(20,35,55,0.04)', border:`1px solid ${THEME.border}`, color:THEME.ink }}/>
                    <button onClick={pullReg} disabled={!location||regLoading} className="flex-shrink-0 text-xs font-light px-3 py-2 rounded-xl text-white disabled:opacity-40" style={{ backgroundColor:THEME.leviBlue }} title="Pull FEMA, EPA ECHO, NWI data">
                      {regLoading?<svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>:'⚡ Pull'}
                    </button>
                  </div>
                  <div className="text-[10px] font-light mt-1" style={{ color:'rgba(20,35,55,0.35)' }}>Auto-pulls FEMA · EPA ECHO · NWI · TCEQ</div>
                </div>
                <div>
                  <label className="block text-[11px] font-light mb-1" style={{ color:'rgba(20,35,55,0.50)' }}>Survey Date</label>
                  <input type="date" value={surveyDate} onChange={e=>setSurveyDate(e.target.value)} className="text-sm font-light px-3.5 py-2 rounded-xl outline-none" style={{ backgroundColor:'rgba(20,35,55,0.04)', border:`1px solid ${THEME.border}`, color:THEME.ink }}/>
                </div>
                <div>
                  <label className="block text-[11px] font-light mb-1" style={{ color:'rgba(20,35,55,0.50)' }}>Field Observations / Data *</label>
                  <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={8} placeholder="Paste field notes, BMP conditions, soil/veg/hydrology observations, GPS points, site history, adjacent land uses. More detail = more complete report." className="w-full text-sm font-light px-3.5 py-2 rounded-xl outline-none resize-none" style={{ backgroundColor:'rgba(20,35,55,0.04)', border:`1px solid ${THEME.border}`, color:THEME.ink }}/>
                </div>
                {error && <div className="text-xs font-light px-4 py-3 rounded-xl" style={{ backgroundColor:'rgba(224,122,95,0.10)', color:THEME.sunset }}>{error}</div>}
                <button onClick={generate} disabled={!projectName||!notes||generating} className="flex items-center justify-center gap-2 text-white px-6 py-3 rounded-full font-light text-sm disabled:opacity-40" style={{ backgroundColor:generating?THEME.leviBlueDark:THEME.leviBlue }}>
                  {generating?(<><svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Generating...</>):(reg?'⚡ Generate with Live Data':'Generate Report')}
                </button>
              </div>
            </div>

            {/* COL 2 — Regulatory Panel */}
            <div>
              <div className="text-xs font-light tracking-widests uppercase mb-3" style={{ color:'rgba(20,35,55,0.40)' }}>Regulatory Intelligence</div>
              <RegPanel data={reg} loading={regLoading} error={regError}/>
            </div>

            {/* COL 3 — Output */}
            <div>
              <div className="text-xs font-light tracking-widests uppercase mb-3" style={{ color:'rgba(20,35,55,0.40)' }}>Generated Report</div>
              {!report&&!generating&&(
                <div className="rounded-2xl flex flex-col items-center justify-center py-24 text-center" style={{ backgroundColor:THEME.surfaceStrong, border:`1px dashed rgba(20,35,55,0.15)` }}>
                  <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color:'rgba(20,35,55,0.18)', marginBottom:12 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  <div className="text-sm font-light" style={{ color:'rgba(20,35,55,0.30)' }}>{reg?'⚡ Regulatory data ready — fill details and generate':'Fill in project details and generate'}</div>
                </div>
              )}
              {generating&&(
                <div className="rounded-2xl flex flex-col items-center justify-center py-24 text-center" style={{ backgroundColor:THEME.surfaceStrong, border:`1px solid ${THEME.border}` }}>
                  <svg className="animate-spin mb-4" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color:THEME.leviBlue }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  <div className="text-sm font-light mb-1" style={{ color:THEME.ink }}>Composing report...</div>
                  <div className="text-xs font-light" style={{ color:'rgba(20,35,55,0.45)' }}>{reg?'Incorporating live regulatory data':'Applying Ceto template'}</div>
                </div>
              )}
              {report&&(
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor:THEME.surfaceStrong, border:`1px solid ${THEME.border}` }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:`1px solid ${THEME.border}` }}>
                    <div className="flex items-center gap-2">
                      <Badge label="draft" color="red"/>
                      {reg&&<Badge label="live data" color="green"/>}
                      <span className="text-[11px] font-light" style={{ color:'rgba(20,35,55,0.40)' }}>~{Math.ceil(report.length/3000)} pages</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={()=>{navigator.clipboard.writeText(report);setCopied(true);setTimeout(()=>setCopied(false),2000);}} className="text-xs font-light px-3 py-1.5 rounded-lg border" style={{ color:'rgba(20,35,55,0.55)', borderColor:THEME.border }}>{copied?'✓':'Copy'}</button>
                      <button onClick={()=>exportPDF(report,title,reg)} className="text-xs font-light px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor:THEME.washedGreen }}>Export PDF</button>
                    </div>
                  </div>
                  <div className="px-5 py-4 max-h-[600px] overflow-y-auto">
                    <pre className="text-sm font-light leading-relaxed whitespace-pre-wrap" style={{ color:THEME.ink, fontFamily:'inherit' }}>{report}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab==='library'&&(
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor:THEME.surfaceStrong, border:`1px solid ${THEME.border}` }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom:`1px solid ${THEME.border}` }}>
              <span className="text-sm font-light" style={{ color:THEME.ink }}>{library.length===0?'No reports yet — generate your first one below':`${library.length} report${library.length!==1?'s':''}`}</span>
              <button onClick={()=>setTab('generate')} className="text-xs font-light px-4 py-1.5 rounded-full text-white" style={{ backgroundColor:THEME.leviBlue }}>+ New Report</button>
            </div>
            {library.length===0?(
              <div className="px-6 py-16 text-center">
                <div className="text-sm font-light" style={{ color:'rgba(20,35,55,0.35)' }}>Reports you generate will appear here</div>
                <button onClick={()=>setTab('generate')} className="mt-4 text-xs font-light px-5 py-2 rounded-full text-white" style={{ backgroundColor:THEME.leviBlue }}>Generate First Report</button>
              </div>
            ):library.map((r,i)=>(
              <div key={r.id} className="flex items-center gap-4 px-6 py-4" style={{ borderBottom:i<library.length-1?`1px solid ${THEME.border}`:'none' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor:'rgba(47,93,140,0.10)' }}>
                  <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color:THEME.leviBlue }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-light" style={{ color:THEME.ink }}>{r.title}</div>
                  <div className="text-xs font-light mt-0.5" style={{ color:'rgba(20,35,55,0.45)' }}>{r.type} · {r.date} · ~{r.pages} pages</div>
                </div>
                <Badge label={r.status} color="red"/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
