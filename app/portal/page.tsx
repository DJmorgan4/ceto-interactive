'use client';

import { useState, useEffect } from 'react';

const THEME = {
  bg: '#F6F7F8',
  surface: 'rgba(255,255,255,0.62)',
  surfaceStrong: 'rgba(255,255,255,0.82)',
  border: 'rgba(20, 35, 55, 0.14)',
  ink: '#142337',
  leviBlue: '#2F5D8C',
  leviBlueDark: '#234B74',
  washedGreen: '#4F7A6A',
  sunset: '#E07A5F',
};

const NAV = [
  { href:'/portal', label:'Dashboard', icon:'grid' },
  { href:'/portal/upload', label:'Upload Data', icon:'upload' },
  { href:'/portal/reports', label:'Reports', icon:'doc' },
  { href:'/portal/site-intelligence', label:'Site Intelligence', icon:'terrain' },
  { href:'/portal/bids', label:'Bid Pipeline', icon:'doc' },
];

const INTEL_NAV = [
  { href:'https://lithicearth.com', label:'SAR Analysis', icon:'satellite' },
  { href:'https://lithicearth.com', label:'Field Maps', icon:'map' },
  { href:'https://lithicearth.com', label:'Analytics', icon:'chart' },
];

function Icon({ name, size=20 }: { name:string; size?:number }) {
  const paths: Record<string,string> = {
    grid: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    upload: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
    terrain: 'M3 21h18M3 10h18M3 6l9-3 9 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11',
    doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    satellite: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064',
    map: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    external: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
    lightning: 'M13 10V3L4 14h7v7l9-11h-7z',
    refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    close: 'M6 18L18 6M6 6l12 12',
  };
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={paths[name]||paths.doc}/>
    </svg>
  );
}

interface WeatherData { temp: number; desc: string; humidity: number; wind: number; feels: number; }
interface NewsItem { title: string; source: string; url: string; date: string; }


function AstraPanel({ leviBlue, border, surfaceStrong, ink }: { leviBlue:string; border:string; surfaceStrong:string; ink:string }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{q:string;a:string}[]>([]);

  const ask = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    const q = query.trim();
    setQuery('');
    try {
      const res = await fetch('/api/astra/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, source: 'ceto-dashboard' }),
      });
      const data = await res.json();
      const answer = data.response || data.error || 'No response';
      setResponse(answer);
      setHistory(h => [{ q, a: answer }, ...h].slice(0, 5));
    } catch { setResponse('ASTRA unavailable.'); }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl mb-4 md:mb-6" style={{ backgroundColor:surfaceStrong, border:`1px solid ${border}` }}>
      <div className="px-5 md:px-6 py-4 flex items-center justify-between" style={{ borderBottom:`1px solid ${border}` }}>
        <div>
          <div className="text-sm font-light" style={{ color:ink }}>ASTRA Environmental Intelligence</div>
          <div className="text-xs font-light mt-0.5" style={{ color:'rgba(20,35,55,0.45)' }}>Phase I · TCEQ · Wetlands · SWPPP · Regulatory — ask anything</div>
        </div>
        <div className="text-[10px] font-light px-2 py-1 rounded-full" style={{ backgroundColor:`rgba(47,93,140,0.10)`, color:leviBlue }}>LOCUS</div>
      </div>
      <div className="p-5 md:p-6">
        <div className="flex gap-2 mb-4">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="Ask ASTRA — REC classification, TCEQ databases, wetland delineation, SWPPP requirements..."
            className="flex-1 rounded-xl text-sm font-light px-4 py-3 outline-none"
            style={{ backgroundColor:'rgba(20,35,55,0.04)', border:`1px solid ${border}`, color:ink, minHeight:44 }}
          />
          <button
            onClick={ask}
            disabled={loading || !query.trim()}
            className="rounded-xl text-sm font-light px-5 text-white transition-all"
            style={{ backgroundColor:loading ? 'rgba(47,93,140,0.5)' : leviBlue, minHeight:44, minWidth:80, cursor:loading?'wait':'pointer' }}
          >
            {loading ? '...' : 'Ask'}
          </button>
        </div>
        {response && (
          <div className="rounded-xl p-4 mb-3" style={{ backgroundColor:'rgba(47,93,140,0.05)', border:`1px solid rgba(47,93,140,0.12)` }}>
            <div className="text-[10px] font-light tracking-widest uppercase mb-2" style={{ color:'rgba(47,93,140,0.6)' }}>ASTRA Response</div>
            <div className="text-sm font-light leading-relaxed whitespace-pre-wrap" style={{ color:ink }}>{response}</div>
          </div>
        )}
        {history.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {history.slice(1).map((h,i) => (
              <button key={i} onClick={() => setQuery(h.q)}
                className="text-xs font-light px-3 py-1.5 rounded-full transition-all"
                style={{ backgroundColor:'rgba(20,35,55,0.04)', border:`1px solid ${border}`, color:'rgba(20,35,55,0.55)' }}>
                {h.q.length > 40 ? h.q.slice(0,40)+'…' : h.q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortalDashboard() {
  const [weather, setWeather] = useState<WeatherData|null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [reportCount, setReportCount] = useState(0);
  const [time, setTime] = useState(new Date());
  // Desktop: sidebar open/collapsed. Mobile: drawer open/closed.
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close mobile nav on resize to desktop
  useEffect(() => {
    if (!isMobile) setMobileNavOpen(false);
  }, [isMobile]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=33.197&longitude=-96.615&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph')
      .then(r=>r.json())
      .then(d => {
        const c = d.current;
        const WMO: Record<number,string> = {0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Icy fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',80:'Showers',81:'Heavy showers',95:'Thunderstorm',96:'Thunderstorm w/ hail'};
        setWeather({ temp:Math.round(c.temperature_2m), desc:WMO[c.weather_code]||'Clear', humidity:c.relative_humidity_2m, wind:Math.round(c.wind_speed_10m), feels:Math.round(c.apparent_temperature) });
      }).catch(()=>{});
  }, []);

  useEffect(() => {
    fetch('/api/texas-updates')
      .then(r=>r.json())
      .then(d => { if (d.items) setNews(d.items.slice(0,4)); })
      .catch(()=>{
        setNews([
          { title:'TCEQ Proposed Amendments to 30 TAC Chapter 305 — Water Quality Permits', source:'TCEQ', url:'https://www.tceq.texas.gov', date:new Date().toLocaleDateString() },
          { title:'EPA ECHO Updated Facility Compliance Data — Q1 2026', source:'EPA ECHO', url:'https://echo.epa.gov', date:new Date().toLocaleDateString() },
          { title:'USACE Nationwide Permit Program Reissuance — Public Notice', source:'Army Corps', url:'https://www.swf.usace.army.mil', date:new Date().toLocaleDateString() },
          { title:'TPWD Updated Threatened & Endangered Species List — Texas 2026', source:'TPWD', url:'https://tpwd.texas.gov', date:new Date().toLocaleDateString() },
        ]);
      });
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ceto_report_count');
      if (stored) setReportCount(parseInt(stored)||0);
    } catch {}
  }, []);

  const today = time.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const timeStr = time.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});

  const QUICK_REPORTS = [
    { type:'phase1', label:'Phase I ESA', color:THEME.leviBlue },
    { type:'swppp',  label:'SWPPP Inspection', color:THEME.washedGreen },
    { type:'wetland',label:'Wetland Delineation', color:'#5B7FA6' },
    { type:'field',  label:'Field Survey', color:'#7A6F5A' },
  ];

  // Sidebar width — desktop only
  const sidebarW = sidebarOpen ? 220 : 64;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor:THEME.bg }}>

      {/* ── Mobile backdrop ── */}
      {isMobile && mobileNavOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor:'rgba(20,35,55,0.45)', backdropFilter:'blur(2px)' }}
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* ── Sidebar / Mobile Drawer ── */}
      <aside
        className="fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300"
        style={{
          width: isMobile ? 240 : sidebarW,
          transform: isMobile ? (mobileNavOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          backgroundColor: THEME.surfaceStrong,
          borderRight: `1px solid ${THEME.border}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom:`1px solid ${THEME.border}` }}>
          <div className="text-base font-light" style={{ color:THEME.ink }}>
            Ceto<span style={{ color:THEME.leviBlue, fontWeight:400 }}>Portal</span>
          </div>
          {/* Desktop collapse / Mobile close */}
          <button
            onClick={() => isMobile ? setMobileNavOpen(false) : setSidebarOpen(p=>!p)}
            className="p-1.5 rounded-lg"
            style={{ color:'rgba(20,35,55,0.45)', minWidth:32, minHeight:32, display:'flex', alignItems:'center', justifyContent:'center' }}
          >
            <Icon name={isMobile ? 'close' : 'grid'} size={16}/>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setMobileNavOpen(false)}
              className="flex items-center gap-3 px-3 rounded-xl transition-all"
              style={{
                minHeight:44,
                backgroundColor:item.href==='/portal'?'rgba(47,93,140,0.10)':'transparent',
                color:item.href==='/portal'?THEME.leviBlue:'rgba(20,35,55,0.65)',
              }}
            >
              <Icon name={item.icon} size={16}/>
              {(isMobile || sidebarOpen) && <span className="text-sm font-light">{item.label}</span>}
            </a>
          ))}

          {(isMobile || sidebarOpen) && (
            <div className="text-[10px] font-light tracking-widest uppercase mt-5 mb-2 px-3" style={{ color:'rgba(20,35,55,0.35)' }}>
              Intelligence
            </div>
          )}

          {INTEL_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 rounded-xl transition-all"
              style={{ minHeight:44, color:'rgba(20,35,55,0.55)' }}
            >
              <Icon name={item.icon} size={16}/>
              {(isMobile || sidebarOpen) && <span className="text-sm font-light">{item.label}</span>}
            </a>
          ))}
        </nav>

        <div className="px-4 py-4" style={{ borderTop:`1px solid ${THEME.border}` }}>
          <a href="/" className="flex items-center gap-2 text-xs font-light" style={{ color:'rgba(20,35,55,0.40)', minHeight:44 }}>
            <Icon name="external" size={13}/>
            {(isMobile || sidebarOpen) && 'cetointeractive.com'}
          </a>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main
        className="flex-1 transition-all duration-300 min-w-0"
        style={{ marginLeft: isMobile ? 0 : sidebarW }}
      >
        {/* Top bar */}
        <header
          className="sticky top-0 z-20"
          style={{ backgroundColor:THEME.surfaceStrong, borderBottom:`1px solid ${THEME.border}`, backdropFilter:'blur(12px)' }}
        >
          <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile hamburger */}
              {isMobile && (
                <button
                  onClick={() => setMobileNavOpen(true)}
                  className="flex-shrink-0 rounded-lg flex items-center justify-center"
                  style={{ minWidth:44, minHeight:44, color:'rgba(20,35,55,0.55)' }}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                </button>
              )}
              <div className="min-w-0">
                <div className="text-base md:text-lg font-light truncate" style={{ color:THEME.ink }}>Operations Dashboard</div>
                <div className="hidden sm:block text-xs font-light" style={{ color:'rgba(20,35,55,0.45)' }}>Environmental Intelligence · Private Workspace</div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              {/* Clock — hide on small mobile */}
              <div className="hidden sm:block text-right">
                <div className="text-sm font-light" style={{ color:THEME.ink }}>{timeStr}</div>
                <div className="hidden md:block text-xs font-light" style={{ color:'rgba(20,35,55,0.45)' }}>{today}</div>
              </div>
              <a href="/portal/upload"
                className="flex items-center gap-1.5 text-white rounded-full font-light text-xs md:text-sm"
                style={{ backgroundColor:THEME.leviBlue, padding:'8px 14px', minHeight:40 }}
              >
                <Icon name="upload" size={14}/>
                <span className="hidden sm:inline">Upload</span>
              </a>
              <a href="/portal/reports"
                className="flex items-center gap-1.5 rounded-full font-light text-xs md:text-sm border"
                style={{ color:THEME.leviBlue, borderColor:'rgba(47,93,140,0.30)', padding:'8px 14px', minHeight:40 }}
              >
                <Icon name="doc" size={14}/>
                <span className="hidden sm:inline">Report</span>
              </a>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="px-4 md:px-8 py-4 md:py-8 max-w-7xl">

          {/* Weather + Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            {/* Weather */}
            <div className="col-span-2 lg:col-span-1 rounded-2xl p-4 md:p-5" style={{ backgroundColor:THEME.surfaceStrong, border:`1px solid ${THEME.border}` }}>
              <div className="text-[10px] font-light tracking-widest uppercase mb-2" style={{ color:'rgba(20,35,55,0.40)' }}>McKinney, TX · Field</div>
              {weather ? (
                <>
                  <div className="text-3xl md:text-4xl font-light mb-1" style={{ color:THEME.ink }}>{weather.temp}°F</div>
                  <div className="text-sm font-light mb-3" style={{ color:'rgba(20,35,55,0.65)' }}>{weather.desc}</div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-light" style={{ color:'rgba(20,35,55,0.50)' }}>
                    <div><div style={{ color:THEME.ink }}>{weather.feels}°</div>Feels</div>
                    <div><div style={{ color:THEME.ink }}>{weather.humidity}%</div>Humidity</div>
                    <div><div style={{ color:THEME.ink }}>{weather.wind}mph</div>Wind</div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm font-light" style={{ color:'rgba(20,35,55,0.40)' }}>
                  <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Loading...
                </div>
              )}
            </div>

            {/* Stat cards */}
            {[
              { label:'Reports Generated', value: reportCount, sub:'This session', color:THEME.leviBlue, icon:'doc' },
              { label:'Regulatory APIs', value:'4', sub:'FEMA · EPA · NWI · TCEQ', color:THEME.washedGreen, icon:'lightning' },
              { label:'Report Types', value:'6', sub:'Phase I · SWPPP · Wetland…', color:'#7A6F5A', icon:'chart' },
            ].map(s=>(
              <div key={s.label} className="rounded-2xl p-4 md:p-5" style={{ backgroundColor:THEME.surfaceStrong, border:`1px solid ${THEME.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-light tracking-widest uppercase leading-tight" style={{ color:'rgba(20,35,55,0.40)' }}>{s.label}</div>
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor:`${s.color}18`, color:s.color }}><Icon name={s.icon} size={14}/></div>
                </div>
                <div className="text-2xl md:text-3xl font-light mb-1" style={{ color:THEME.ink }}>{s.value}</div>
                <div className="text-xs font-light" style={{ color:'rgba(20,35,55,0.45)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Site Intelligence CTA */}
          <a href="/portal/site-intelligence" className="block rounded-2xl p-4 md:p-6 mb-4 md:mb-6 transition-all"
            style={{ background:'linear-gradient(135deg, #0a1628 0%, #1a2f4a 100%)', border:'1px solid rgba(47,93,140,0.35)', textDecoration:'none' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(47,93,140,0.7)'; e.currentTarget.style.boxShadow='0 4px 24px rgba(47,93,140,0.15)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(47,93,140,0.35)'; e.currentTarget.style.boxShadow='none'; }}>
            <div className="flex items-start md:items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-light tracking-widest uppercase mb-2" style={{ color:'rgba(47,93,140,0.8)' }}>New</div>
                <div className="text-base md:text-lg font-light mb-1" style={{ color:'white' }}>Site Intelligence</div>
                <div className="text-xs md:text-sm font-light" style={{ color:'rgba(255,255,255,0.50)' }}>DEM · Geology · Soils · Hydrology · Cross-Section → PDF</div>
              </div>
              <div className="flex-shrink-0 text-xs font-light px-3 py-1.5 rounded-full" style={{ background:'rgba(47,93,140,0.25)', color:'rgba(47,93,140,1)', border:'1px solid rgba(47,93,140,0.4)', whiteSpace:'nowrap' }}>
                Generate →
              </div>
            </div>
          </a>

          {/* Three-col grid → single col on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
            {/* Quick Generate */}
            <div className="rounded-2xl p-5 md:p-6" style={{ backgroundColor:THEME.surfaceStrong, border:`1px solid ${THEME.border}` }}>
              <div className="text-xs font-light tracking-widest uppercase mb-4" style={{ color:'rgba(20,35,55,0.40)' }}>Quick Generate</div>
              <div className="flex flex-col gap-2">
                {QUICK_REPORTS.map(r=>(
                  <a key={r.type} href="/portal/reports"
                    className="flex items-center justify-between rounded-xl transition-all"
                    style={{ padding:'12px 14px', backgroundColor:'rgba(20,35,55,0.03)', border:`1px solid ${THEME.border}`, minHeight:48 }}
                    onMouseEnter={e=>{e.currentTarget.style.backgroundColor='rgba(47,93,140,0.06)';e.currentTarget.style.borderColor='rgba(47,93,140,0.20)';}}
                    onMouseLeave={e=>{e.currentTarget.style.backgroundColor='rgba(20,35,55,0.03)';e.currentTarget.style.borderColor=THEME.border;}}>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor:r.color }}/>
                      <span className="text-sm font-light" style={{ color:THEME.ink }}>{r.label}</span>
                    </div>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color:'rgba(20,35,55,0.30)', flexShrink:0 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7"/></svg>
                  </a>
                ))}
              </div>
              <a href="/portal/reports" className="flex items-center justify-center gap-2 mt-4 text-xs font-light py-3 rounded-xl" style={{ color:THEME.leviBlue, backgroundColor:'rgba(47,93,140,0.07)', border:`1px dashed rgba(47,93,140,0.25)` }}>
                <Icon name="lightning" size={13}/> Open Report Generator
              </a>
            </div>

            {/* Live Data Sources */}
            <div className="rounded-2xl p-5 md:p-6" style={{ backgroundColor:THEME.surfaceStrong, border:`1px solid ${THEME.border}` }}>
              <div className="text-xs font-light tracking-widest uppercase mb-4" style={{ color:'rgba(20,35,55,0.40)' }}>Live Data Sources</div>
              <div className="flex flex-col gap-3">
                {[
                  { name:'FEMA National Flood Hazard Layer', status:'live', url:'https://msc.fema.gov' },
                  { name:'EPA ECHO Compliance Database', status:'live', url:'https://echo.epa.gov' },
                  { name:'USFWS National Wetlands Inventory', status:'live', url:'https://www.fws.gov/wetlands' },
                  { name:'TCEQ STEERS Database', status:'manual', url:'https://www.tceq.texas.gov' },
                  { name:'US Census Geocoder', status:'live', url:'https://geocoding.geo.census.gov' },
                ].map(s=>(
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 min-h-[36px]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor:s.status==='live'?'#4F7A6A':'rgba(20,35,55,0.25)' }}/>
                      <span className="text-sm font-light truncate" style={{ color:THEME.ink }}>{s.name}</span>
                    </div>
                    <span className="text-[10px] font-light flex-shrink-0" style={{ color:s.status==='live'?THEME.washedGreen:'rgba(20,35,55,0.40)' }}>{s.status}</span>
                  </a>
                ))}
              </div>
              <div className="mt-5 pt-4 text-[11px] font-light" style={{ borderTop:`1px solid ${THEME.border}`, color:'rgba(20,35,55,0.45)' }}>
                All free federal APIs. No keys required.
              </div>
            </div>

            {/* LithicEarth */}
            <div className="rounded-2xl overflow-hidden flex flex-col" style={{ backgroundImage:`linear-gradient(135deg, ${THEME.leviBlueDark} 0%, ${THEME.leviBlue} 60%, rgba(79,122,106,0.6) 120%)` }}>
              <div className="p-5 md:p-6 flex-1">
                <div className="text-[10px] font-light tracking-widest uppercase mb-3" style={{ color:'rgba(255,255,255,0.55)' }}>LithicEarth Pipeline</div>
                <div className="text-base md:text-lg font-light text-white mb-2">Geospatial Processing</div>
                <div className="text-sm font-light mb-4 md:mb-6" style={{ color:'rgba(255,255,255,0.65)' }}>Connect GDAL/rasterio pipeline to process field data and generate map outputs for reports.</div>
                <div className="flex flex-col gap-2">
                  {['GDAL 3.12.3 installed','Rasterio 1.5.0 ready','QGIS 4.0.1 available','Docker 29.3 running'].map(s=>(
                    <div key={s} className="flex items-center gap-2 text-sm font-light" style={{ color:'rgba(255,255,255,0.80)' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-300 flex-shrink-0"/>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-5 md:px-6 pb-5 md:pb-6">
                <a href="https://lithicearth.com" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-full text-sm font-light"
                  style={{ backgroundColor:'rgba(255,255,255,0.15)', color:'white', border:'1px solid rgba(255,255,255,0.30)', padding:'10px 0', minHeight:44 }}>
                  Open LithicEarth <Icon name="external" size={13}/>
                </a>
              </div>
            </div>
          </div>

          {/* ASTRA Intelligence Panel */}
          <AstraPanel leviBlue={THEME.leviBlue} border={THEME.border} surfaceStrong={THEME.surfaceStrong} ink={THEME.ink} />

          {/* Environmental news feed */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor:THEME.surfaceStrong, border:`1px solid ${THEME.border}` }}>
            <div className="px-4 md:px-6 py-4 flex items-center justify-between" style={{ borderBottom:`1px solid ${THEME.border}` }}>
              <div>
                <div className="text-sm font-light" style={{ color:THEME.ink }}>Environmental Intelligence Feed</div>
                <div className="hidden sm:block text-xs font-light mt-0.5" style={{ color:'rgba(20,35,55,0.45)' }}>TCEQ · EPA · USACE · TPWD — live regulatory updates</div>
              </div>
              <a href="/envnews" className="text-xs font-light flex-shrink-0 ml-4" style={{ color:THEME.leviBlue }}>Full feed →</a>
            </div>
            {news.length===0 ? (
              <div className="px-6 py-8 flex items-center gap-3" style={{ color:'rgba(20,35,55,0.40)' }}>
                <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span className="text-sm font-light">Loading regulatory updates...</span>
              </div>
            ) : news.map((item,i)=>(
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-3 md:gap-4 px-4 md:px-6 py-4 transition-colors"
                style={{ borderBottom:i<news.length-1?`1px solid ${THEME.border}`:'none', minHeight:60 }}
                onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(47,93,140,0.04)'}
                onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor:THEME.leviBlue }}/>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-light leading-snug" style={{ color:THEME.ink }}>{item.title}</div>
                  <div className="text-xs font-light mt-1" style={{ color:'rgba(20,35,55,0.45)' }}>{item.source} · {item.date}</div>
                </div>
                <div className="flex-shrink-0 mt-0.5"><Icon name="external" size={13}/></div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
