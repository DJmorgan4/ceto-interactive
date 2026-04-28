'use client';
import { useState } from 'react';

const FS = 'Jost, sans-serif';
const T = { blue: '#2F5D8C', border: 'rgba(17,26,36,0.1)', surface: '#FFFFFF', blueLight: 'rgba(47,93,140,0.06)', muted: 'rgba(17,26,36,0.45)', ink: '#111A24' };

export interface FederalDBData {
  nplReviewed: boolean; nplFindings: string;
  rcraReviewed: boolean; rcraFindings: string;
  triReviewed: boolean; triFindings: string;
  ernsReviewed: boolean; ernsFindings: string;
  brownfieldsReviewed: boolean; brownfieldsFindings: string;
}

const defaultData = (): FederalDBData => ({
  nplReviewed: false, nplFindings: '',
  rcraReviewed: false, rcraFindings: '',
  triReviewed: false, triFindings: '',
  ernsReviewed: false, ernsFindings: '',
  brownfieldsReviewed: false, brownfieldsFindings: '',
});

interface Props {
  county?: string; state?: string; address?: string;
  data?: FederalDBData | null;
  onUpdate?: (d: FederalDBData) => void;
}

export default function FederalDatabasePanel({ county, state = 'TX', address, data, onUpdate }: Props) {
  const [d, setD] = useState<FederalDBData>(data || defaultData());
  const [expanded, setExpanded] = useState(false);

  const update = (field: keyof FederalDBData, value: boolean | string) => {
    const next = { ...d, [field]: value };
    setD(next);
    onUpdate?.(next);
  };

  const reviewedCount = [d.nplReviewed, d.rcraReviewed, d.triReviewed, d.ernsReviewed, d.brownfieldsReviewed].filter(Boolean).length;

  const databases = [
    { key: 'npl', label: 'NPL / Superfund Sites', desc: 'EPA National Priorities List — federally-listed contaminated sites', risk: 'HIGH', url: 'https://www.epa.gov/superfund/search-superfund-sites-where-you-live', altUrl: 'https://cumulis.epa.gov/supercpad/cursites/srchsites.cfm' },
    { key: 'rcra', label: 'RCRA Corrective Action', desc: 'Hazardous waste generators, treatment/storage/disposal facilities', risk: 'HIGH', url: 'https://rcrainfo.epa.gov/rcrainfoprod/action/secured/login', altUrl: `https://enviro.epa.gov/enviro/efservice/RCRA_FACILITIES/STATE_CODE/${state}/COUNTY_NAME/${encodeURIComponent(county||'')}/HTML` },
    { key: 'tri', label: 'TRI — Toxic Release Inventory', desc: 'Industrial facilities reporting toxic chemical releases', risk: 'MODERATE', url: 'https://www.epa.gov/toxics-release-inventory-tri-program/tri-data-and-tools', altUrl: '' },
    { key: 'erns', label: 'ERNS — Emergency Response Spills', desc: 'Reported spills and emergency response notifications', risk: 'MODERATE', url: 'https://www.epa.gov/emergency-response/emergency-response-notification-system', altUrl: '' },
    { key: 'brownfields', label: 'EPA Brownfields', desc: 'Brownfield sites under assessment or cleanup', risk: 'MODERATE', url: 'https://bfapp3.epa.gov/bf_map/index.htm', altUrl: '' },
  ];

  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', fontSize: 11, fontFamily: FS, padding: '5px 8px', backgroundColor: 'rgba(17,26,36,0.02)', border: `1px solid ${T.border}`, borderRadius: 2, outline: 'none', color: T.ink, marginTop: 4 };

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden', marginBottom: 14 }}>
      <div onClick={() => setExpanded(e => !e)} style={{ padding: '10px 14px', backgroundColor: T.blueLight, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.blue, fontFamily: FS }}>Federal Database Review</div>
          <div style={{ fontSize: 11, color: T.ink, fontFamily: FS, marginTop: 2 }}>{reviewedCount}/5 databases reviewed · ASTM E1527-21 Table 1</div>
        </div>
        <span style={{ fontSize: 10, color: T.muted, fontFamily: FS }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: FS, lineHeight: 1.5, padding: '8px 10px', backgroundColor: 'rgba(17,26,36,0.02)', borderRadius: 2 }}>
            Federal database review per ASTM E1527-21 Table 1. Check each database, record findings, and mark reviewed. Query date: {new Date().toLocaleDateString()}.
          </div>

          {databases.map(db => {
            const reviewed = d[`${db.key}Reviewed` as keyof FederalDBData] as boolean;
            const findings = d[`${db.key}Findings` as keyof FederalDBData] as string;
            return (
              <div key={db.key} style={{ border: `1px solid ${reviewed ? 'rgba(39,174,96,0.2)' : T.border}`, borderRadius: 3, padding: '10px 12px', backgroundColor: reviewed ? 'rgba(39,174,96,0.03)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div onClick={() => update(`${db.key}Reviewed` as keyof FederalDBData, !reviewed)}
                    style={{ width: 14, height: 14, borderRadius: 2, backgroundColor: reviewed ? '#27AE60' : 'transparent', border: `1.5px solid ${reviewed ? '#27AE60' : T.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', marginTop: 2 }}>
                    {reviewed && <span style={{ color: 'white', fontSize: 9 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 11, color: T.ink, fontFamily: FS, fontWeight: 400 }}>{db.label}</span>
                      <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 2, backgroundColor: db.risk === 'HIGH' ? 'rgba(192,57,43,0.1)' : 'rgba(217,119,6,0.1)', color: db.risk === 'HIGH' ? '#C0392B' : '#B45309', fontFamily: FS }}>{db.risk}</span>
                    </div>
                    <div style={{ fontSize: 9, color: T.muted, fontFamily: FS, marginBottom: 6 }}>{db.desc}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={db.url} target="_blank" rel="noopener noreferrer" style={{ padding: '3px 10px', backgroundColor: T.blue, color: 'white', borderRadius: 2, fontSize: 9, fontFamily: FS, textDecoration: 'none' }}>Search ↗</a>
                      {db.altUrl && <a href={db.altUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '3px 10px', backgroundColor: 'transparent', color: T.blue, border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 9, fontFamily: FS, textDecoration: 'none' }}>Alt ↗</a>}
                    </div>
                  </div>
                </div>
                {reviewed && (
                  <input value={findings} onChange={e => update(`${db.key}Findings` as keyof FederalDBData, e.target.value)}
                    placeholder="Findings: number of sites, nearest site, any within search radius..."
                    style={inputStyle} />
                )}
              </div>
            );
          })}

          <div style={{ fontSize: 10, color: T.muted, fontFamily: FS, lineHeight: 1.55, padding: '8px 10px', backgroundColor: 'rgba(17,26,36,0.02)', borderRadius: 2 }}>
            {reviewedCount < 5 ? `⚠ ${5 - reviewedCount} database(s) pending review — constitutes data gap per ASTM E1527-21.` : '✓ All standard federal databases reviewed per ASTM E1527-21 Table 1.'}
          </div>
        </div>
      )}
    </div>
  );
}
