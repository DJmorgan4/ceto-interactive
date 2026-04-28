'use client';
import { useState } from 'react';

const FS = 'Jost, sans-serif';
const T = { blue: '#2F5D8C', border: 'rgba(17,26,36,0.1)', surface: '#FFFFFF', blueLight: 'rgba(47,93,140,0.06)', muted: 'rgba(17,26,36,0.45)', ink: '#111A24' };

export interface HistoricalResearchData {
  naipReviewed: boolean;
  topoReviewed: boolean;
  googleEarthReviewed: boolean;
  historicAerialsReviewed: boolean;
  sanbornReviewed: boolean;
  notes: string;
}

interface Props {
  lat?: number; lng?: number; city?: string; state?: string;
  data?: HistoricalResearchData | null;
  onUpdate?: (data: HistoricalResearchData) => void;
}

export default function HistoricalResearchPanel({ lat, lng, city, state, data, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [local, setLocal] = useState<HistoricalResearchData>(data || {
    naipReviewed: false, topoReviewed: false, googleEarthReviewed: false,
    historicAerialsReviewed: false, sanbornReviewed: false, notes: '',
  });

  const update = (field: keyof HistoricalResearchData, value: boolean | string) => {
    const next = { ...local, [field]: value };
    setLocal(next);
    onUpdate?.(next);
  };

  const reviewedCount = [local.naipReviewed, local.topoReviewed, local.googleEarthReviewed, local.historicAerialsReviewed, local.sanbornReviewed].filter(Boolean).length;

  // Build research URLs
  const naipUrl = lat && lng ? `https://giscrg.com/viewer/index.html?lat=${lat}&lon=${lng}&zoom=15` : 'https://datagateway.nrcs.usda.gov/GDGHome_DirectDownLoad.aspx'\;
  const topoUrl = lat && lng ? `https://ngmdb.usgs.gov/topoview/viewer/#15/${lat}/${lng}` : 'https://ngmdb.usgs.gov/topoview/'\;
  const historicAerialsUrl = city && state ? `https://www.historicaerials.com/viewer#2${encodeURIComponent(city + ' ' + state)}` : 'https://www.historicaerials.com'\;
  const googleEarthUrl = lat && lng ? `https://earth.google.com/web/@${lat},${lng},500a,1000d,35y,0h,0t,0r` : 'https://earth.google.com'\;
  const sanbornCity = city ? encodeURIComponent(city) : '';
  const sanbornUrl = `https://www.loc.gov/collections/sanborn-maps/?q=${sanbornCity}&st=list`;

  const sources = [
    { key: 'naipReviewed' as const, label: 'NAIP Aerial Imagery', desc: 'USDA Farm Service Agency — current & historical aerials', url: naipUrl, color: '#2F5D8C' },
    { key: 'topoReviewed' as const, label: 'USGS Topographic Maps', desc: 'Historical topo maps — drainage, land use context', url: topoUrl, color: '#6B5B2B' },
    { key: 'historicAerialsReviewed' as const, label: 'Historic Aerials Database', desc: 'Decade-by-decade aerial coverage since 1930s', url: historicAerialsUrl, color: '#4A7C5A' },
    { key: 'googleEarthReviewed' as const, label: 'Google Earth Pro', desc: 'Street view + historical imagery timeline', url: googleEarthUrl, color: '#1A5276' },
    { key: 'sanbornReviewed' as const, label: 'Sanborn Fire Insurance Maps', desc: 'Library of Congress — pre-1950 urban building detail', url: sanbornUrl, color: '#7B3F2B' },
  ];

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden', marginBottom: 14 }}>
      <div onClick={() => setExpanded(e => !e)} style={{ padding: '10px 16px', borderBottom: expanded ? `1px solid ${T.border}` : 'none', backgroundColor: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: '0.20em', textTransform: 'uppercase', color: T.blue, fontFamily: FS }}>Historical Research</div>
          <div style={{ fontSize: 11, color: T.ink, fontFamily: FS, marginTop: 2 }}>{reviewedCount}/5 sources reviewed</div>
        </div>
        <div style={{ fontSize: 11, color: T.muted, fontFamily: FS }}>{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded && (
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sources.map(s => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 2, backgroundColor: local[s.key] ? 'rgba(39,174,96,0.05)' : 'rgba(17,26,36,0.02)', border: `1px solid ${local[s.key] ? 'rgba(39,174,96,0.2)' : T.border}` }}>
              <div onClick={() => update(s.key, !local[s.key])} style={{ width: 14, height: 14, borderRadius: 2, backgroundColor: local[s.key] ? '#27AE60' : 'transparent', border: `1.5px solid ${local[s.key] ? '#27AE60' : T.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                {local[s.key] && <div style={{ color: 'white', fontSize: 9 }}>✓</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: T.ink, fontFamily: FS, fontWeight: 400 }}>{s.label}</div>
                <div style={{ fontSize: 9, color: T.muted, fontFamily: FS }}>{s.desc}</div>
              </div>
              <a href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ padding: '4px 10px', backgroundColor: s.color, color: 'white', borderRadius: 2, fontSize: 10, fontFamily: FS, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Open ↗
              </a>
            </div>
          ))}

          <div style={{ marginTop: 4 }}>
            <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 4, fontFamily: FS }}>Research Notes</label>
            <textarea value={local.notes} onChange={e => update('notes', e.target.value)} rows={3}
              placeholder="Note any significant historical uses, structures, or concerns identified during aerial/map review..."
              style={{ width: '100%', boxSizing: 'border-box', fontSize: 12, fontFamily: FS, padding: '7px 10px', backgroundColor: 'rgba(17,26,36,0.02)', border: `1px solid ${T.border}`, borderRadius: 2, outline: 'none', resize: 'vertical', color: T.ink }} />
          </div>

          <div style={{ fontSize: 10, color: T.muted, fontFamily: FS, lineHeight: 1.5, padding: '8px 10px', backgroundColor: 'rgba(17,26,36,0.02)', borderRadius: 2 }}>
            Report language: Historical aerial and topographic review was initiated using external research sources ({reviewedCount}/5 reviewed). {reviewedCount < 3 ? 'Additional source review required before final Phase I reliance.' : 'Review is substantially complete per ASTM E1527-21 Section 8.3.'}
          </div>
        </div>
      )}
    </div>
  );
}
