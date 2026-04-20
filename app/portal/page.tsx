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
  washedBlue: '#6E93B5',
  washedGreen: '#4F7A6A',
  washedGreenDark: '#3E6357',
  sunset: '#E07A5F',
};

const NAV_ITEMS = [
  { href: '/portal', label: 'Dashboard', icon: 'grid' },
  { href: '/portal/upload', label: 'Upload Data', icon: 'upload' },
  { href: '/portal/reports', label: 'Reports', icon: 'doc' },
];

const RECENT_UPLOADS = [
  { id: 1, name: 'ERS2_Abilene_2005_C-band.tif', type: 'SAR', date: '2026-04-18', size: '412 MB', status: 'processed' },
  { id: 2, name: 'NAIP_TaylorCounty_2005.tif', type: 'Optical', date: '2026-04-17', size: '1.2 GB', status: 'processed' },
  { id: 3, name: 'FieldNotes_Abilene_Apr2026.pdf', type: 'Field Notes', date: '2026-04-16', size: '2.4 MB', status: 'processed' },
  { id: 4, name: 'GPSPoints_Survey_Apr2026.geojson', type: 'GPS', date: '2026-04-15', size: '48 KB', status: 'processed' },
];

const RECENT_REPORTS = [
  { id: 1, title: 'Phase I ESA — Taylor County Site', date: '2026-04-10', status: 'final', pages: 34 },
  { id: 2, title: 'SAR Vegetation Analysis — Abilene AOI', date: '2026-04-08', status: 'draft', pages: 12 },
  { id: 3, title: 'SWPPP Inspection Report — Site 7', date: '2026-04-01', status: 'final', pages: 8 },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const s = { width: size, height: size, flexShrink: 0 as const };
  const props = { fill: 'none' as const, stroke: 'currentColor', viewBox: '0 0 24 24', style: s };
  if (name === 'grid') return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
  if (name === 'upload') return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
  if (name === 'doc') return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  if (name === 'satellite') return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
  if (name === 'map') return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>;
  if (name === 'chart') return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
  if (name === 'arrow') return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
  if (name === 'external') return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
  return null;
}

function StatCard({ label, value, sub, icon, color }: { label: string; value: string; sub: string; icon: string; color: string }) {
  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: THEME.surfaceStrong, border: `1px solid ${THEME.border}`, backdropFilter: 'blur(10px)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${color}18` }}>
        <div style={{ color }}><Icon name={icon} size={20} /></div>
      </div>
      <div className="text-3xl font-light mb-1" style={{ color: THEME.ink }}>{value}</div>
      <div className="text-sm font-light" style={{ color: THEME.ink }}>{label}</div>
      <div className="text-xs font-light mt-1" style={{ color: 'rgba(20,35,55,0.50)' }}>{sub}</div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    SAR: { bg: 'rgba(47,93,140,0.12)', color: '#2F5D8C' },
    Optical: { bg: 'rgba(79,122,106,0.12)', color: '#4F7A6A' },
    'Field Notes': { bg: 'rgba(224,122,95,0.12)', color: '#C4623C' },
    GPS: { bg: 'rgba(110,147,181,0.15)', color: '#3A6E9E' },
  };
  const s = map[type] || { bg: 'rgba(20,35,55,0.08)', color: THEME.ink };
  return <span className="text-xs font-light px-2.5 py-1 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>{type}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    processed: { bg: 'rgba(79,122,106,0.12)', color: '#4F7A6A' },
    draft: { bg: 'rgba(224,122,95,0.12)', color: '#C4623C' },
    final: { bg: 'rgba(47,93,140,0.12)', color: '#2F5D8C' },
  };
  const s = map[status] || { bg: 'rgba(20,35,55,0.08)', color: THEME.ink };
  return <span className="text-xs font-light px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: s.bg, color: s.color }}>{status}</span>;
}

export default function PortalDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: THEME.bg }}>
      <aside className="flex-shrink-0 flex flex-col" style={{ width: sidebarOpen ? 240 : 64, transition: 'width 0.25s ease', backgroundColor: THEME.surfaceStrong, borderRight: `1px solid ${THEME.border}`, backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between px-4 py-5" style={{ borderBottom: `1px solid ${THEME.border}` }}>
          {sidebarOpen && <div className="text-base font-light" style={{ color: THEME.ink }}><span>Ceto</span><span style={{ color: THEME.leviBlue, fontWeight: 400 }}>Portal</span></div>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'rgba(20,35,55,0.50)' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map(item => (
            <a key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-light text-sm"
              style={{ color: item.href === '/portal' ? THEME.leviBlue : 'rgba(20,35,55,0.70)', backgroundColor: item.href === '/portal' ? 'rgba(47,93,140,0.10)' : 'transparent' }}>
              <div style={{ color: item.href === '/portal' ? THEME.leviBlue : 'rgba(20,35,55,0.55)' }}><Icon name={item.icon} size={18} /></div>
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
          <div className="my-3" style={{ borderTop: `1px solid ${THEME.border}` }} />
          {sidebarOpen && <div className="px-3 pb-1 text-xs font-light tracking-widest uppercase" style={{ color: 'rgba(20,35,55,0.35)' }}>Intelligence</div>}
          {[{ href: '/portal/sar', label: 'SAR Analysis', icon: 'satellite' }, { href: '/portal/maps', label: 'Field Maps', icon: 'map' }, { href: '/portal/analytics', label: 'Analytics', icon: 'chart' }].map(item => (
            <a key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-light text-sm" style={{ color: 'rgba(20,35,55,0.55)' }}>
              <Icon name={item.icon} size={18} />
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
        </nav>
        {sidebarOpen && (
          <div className="px-4 py-4" style={{ borderTop: `1px solid ${THEME.border}` }}>
            <a href="/" className="flex items-center gap-2 text-xs font-light" style={{ color: 'rgba(20,35,55,0.45)' }}>
              <Icon name="external" size={13} />Back to cetointeractive.com
            </a>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-8 py-4" style={{ borderBottom: `1px solid ${THEME.border}`, backgroundColor: THEME.surfaceStrong, backdropFilter: 'blur(10px)' }}>
          <div>
            <h1 className="text-xl font-light" style={{ color: THEME.ink }}>Operations Dashboard</h1>
            <p className="text-xs font-light mt-0.5" style={{ color: 'rgba(20,35,55,0.45)' }}>Environmental Intelligence · Private Workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/portal/upload" className="flex items-center gap-2 text-white px-5 py-2 rounded-full font-light text-sm" style={{ backgroundColor: THEME.leviBlue }}>
              <Icon name="upload" size={15} />Upload Data
            </a>
            <a href="/portal/reports" className="flex items-center gap-2 px-5 py-2 rounded-full font-light text-sm border" style={{ color: THEME.leviBlue, borderColor: 'rgba(47,93,140,0.35)' }}>
              <Icon name="doc" size={15} />Generate Report
            </a>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="SAR Scenes" value="4" sub="2 pending processing" icon="satellite" color={THEME.leviBlue} />
            <StatCard label="Field Datasets" value="12" sub="Last upload 1 day ago" icon="map" color={THEME.washedGreen} />
            <StatCard label="Reports Generated" value="3" sub="1 draft in progress" icon="doc" color={THEME.washedBlue} />
            <StatCard label="LithicEarth Ready" value="1" sub="Flagged for export" icon="chart" color={THEME.sunset} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: THEME.surfaceStrong, border: `1px solid ${THEME.border}`, backdropFilter: 'blur(10px)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${THEME.border}` }}>
                <h2 className="text-base font-light" style={{ color: THEME.ink }}>Recent Uploads</h2>
                <a href="/portal/upload" className="text-xs font-light flex items-center gap-1" style={{ color: THEME.leviBlue }}>View all <Icon name="arrow" size={12} /></a>
              </div>
              {RECENT_UPLOADS.map(f => (
                <div key={f.id} className="flex items-center gap-4 px-6 py-3.5" style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-light truncate" style={{ color: THEME.ink }}>{f.name}</div>
                    <div className="text-xs font-light mt-0.5" style={{ color: 'rgba(20,35,55,0.45)' }}>{f.date} · {f.size}</div>
                  </div>
                  <TypeBadge type={f.type} />
                  <StatusBadge status={f.status} />
                </div>
              ))}
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: THEME.surfaceStrong, border: `1px solid ${THEME.border}`, backdropFilter: 'blur(10px)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${THEME.border}` }}>
                <h2 className="text-base font-light" style={{ color: THEME.ink }}>Reports</h2>
                <a href="/portal/reports" className="text-xs font-light flex items-center gap-1" style={{ color: THEME.leviBlue }}>View all <Icon name="arrow" size={12} /></a>
              </div>
              {RECENT_REPORTS.map(r => (
                <a key={r.id} href={`/portal/reports/${r.id}`} className="flex items-center gap-4 px-6 py-3.5 block" style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(47,93,140,0.10)' }}>
                    <div style={{ color: THEME.leviBlue }}><Icon name="doc" size={16} /></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-light truncate" style={{ color: THEME.ink }}>{r.title}</div>
                    <div className="text-xs font-light mt-0.5" style={{ color: 'rgba(20,35,55,0.45)' }}>{r.date} · {r.pages} pages</div>
                  </div>
                  <StatusBadge status={r.status} />
                </a>
              ))}
              <div className="px-6 py-4">
                <a href="/portal/reports" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-light text-sm border" style={{ color: THEME.leviBlue, borderColor: 'rgba(47,93,140,0.25)', borderStyle: 'dashed' }}>
                  + Generate New Report
                </a>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl p-6 flex items-center justify-between gap-6" style={{ backgroundImage: `linear-gradient(135deg, ${THEME.leviBlueDark} 0%, ${THEME.leviBlue} 60%, rgba(79,122,106,0.6) 120%)` }}>
            <div>
              <div className="text-xs font-light tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>LithicEarth Pipeline</div>
              <div className="text-lg font-light text-white mb-1">1 dataset flagged for export</div>
              <div className="text-sm font-light" style={{ color: 'rgba(255,255,255,0.70)' }}>SAR Vegetation Analysis — Abilene AOI · Ready to publish to lithicearth.com</div>
            </div>
            <a href="https://lithicearth.com" target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-full font-light text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.30)' }}>
              Open LithicEarth <Icon name="external" size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
