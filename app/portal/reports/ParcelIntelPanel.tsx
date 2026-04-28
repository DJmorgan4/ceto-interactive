'use client';
import { useState } from 'react';

const FS = 'Jost, sans-serif';
const T = { blue: '#2F5D8C', border: 'rgba(17,26,36,0.1)', surface: '#FFFFFF', blueLight: 'rgba(47,93,140,0.06)', muted: 'rgba(17,26,36,0.45)', ink: '#111A24' };

const CAD_URLS: Record<string, { name: string; url: string }> = {
  'taylor': { name: 'Taylor CAD', url: 'https://www.taylorcad.org/search.aspx' },
  'travis': { name: 'Travis CAD', url: 'https://www.traviscad.org/property-search/' },
  'dallas': { name: 'Dallas CAD', url: 'https://www.dallascad.org/search.aspx' },
  'tarrant': { name: 'Tarrant CAD', url: 'https://www.tad.org/search/' },
  'harris': { name: 'Harris CAD', url: 'https://hcad.org/property-search/' },
  'bexar': { name: 'Bexar CAD', url: 'https://www.bcad.org/search.aspx' },
  'collin': { name: 'Collin CAD', url: 'https://www.collincad.org/propertysearch' },
  'denton': { name: 'Denton CAD', url: 'https://www.dentoncad.com/search' },
  'williamson': { name: 'Williamson CAD', url: 'https://search.wcad.org/' },
  'el paso': { name: 'El Paso CAD', url: 'https://www.epcad.org/search.aspx' },
  'lubbock': { name: 'Lubbock CAD', url: 'https://www.lubbockcad.org/search.aspx' },
  'nueces': { name: 'Nueces CAD', url: 'https://www.nuecescad.net/search' },
  'jefferson': { name: 'Jefferson CAD', url: 'https://www.jcad.org/search.aspx' },
  'mclennan': { name: 'McLennan CAD', url: 'https://www.mclennancad.org/search' },
  'smith': { name: 'Smith CAD', url: 'https://www.smithcad.org/search.aspx' },
  'brazos': { name: 'Brazos CAD', url: 'https://www.brazoscad.org/search' },
  'tom green': { name: 'Tom Green CAD', url: 'https://www.tomgreencad.com/search' },
  'ector': { name: 'Ector CAD', url: 'https://www.ectorcad.org/search.aspx' },
  'midland': { name: 'Midland CAD', url: 'https://www.midlandcad.org/search' },
  'potter': { name: 'Potter CAD', url: 'https://www.pottercad.org/search' },
  'webb': { name: 'Webb CAD', url: 'https://www.webbcad.com/search' },
};

function getCadInfo(county: string): { name: string; url: string } {
  const key = county.toLowerCase().replace(' county', '').trim();
  return CAD_URLS[key] || { name: `${county} CAD`, url: `https://www.google.com/search?q=${encodeURIComponent(county + ' county appraisal district property search')}` };
}

export interface ParcelIntelData {
  county: string;
  cadUrl: string;
  ownerName?: string;
  acreage?: string;
  parcelId?: string;
  zoning?: string;
  legalDescription?: string;
  verifiedByUser: boolean;
}

interface Props {
  county?: string;
  data?: ParcelIntelData | null;
  onUpdate?: (data: ParcelIntelData) => void;
}

const inputStyle = { width: '100%', boxSizing: 'border-box' as const, fontSize: 12, fontFamily: FS, fontWeight: 300, padding: '7px 10px', backgroundColor: 'rgba(17,26,36,0.02)', border: `1px solid ${T.border}`, borderRadius: 2, outline: 'none', color: T.ink };
const labelStyle = { display: 'block' as const, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: T.muted, marginBottom: 4, fontFamily: FS };

export default function ParcelIntelPanel({ county, data, onUpdate }: Props) {
  const cad = getCadInfo(county || 'Unknown');
  const [expanded, setExpanded] = useState(false);
  const [local, setLocal] = useState<ParcelIntelData>(data || {
    county: county || '',
    cadUrl: cad.url,
    ownerName: '', acreage: '', parcelId: '', zoning: '', legalDescription: '',
    verifiedByUser: false,
  });

  const update = (field: keyof ParcelIntelData, value: string | boolean) => {
    const next = { ...local, [field]: value };
    setLocal(next);
    onUpdate?.(next);
  };

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden', marginBottom: 14 }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '10px 16px', borderBottom: expanded ? `1px solid ${T.border}` : 'none', backgroundColor: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
      >
        <div>
          <div style={{ fontSize: 8, letterSpacing: '0.20em', textTransform: 'uppercase', color: T.blue, fontFamily: FS }}>Parcel Intelligence</div>
          {county && <div style={{ fontSize: 11, color: T.ink, fontFamily: FS, marginTop: 2 }}>{cad.name} · {local.verifiedByUser ? '✓ Verified' : 'Manual verification required'}</div>}
        </div>
        <div style={{ fontSize: 11, color: T.muted, fontFamily: FS }}>{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded && (
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* CAD Link */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href={cad.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', backgroundColor: T.blue, color: 'white', borderRadius: 2, fontSize: 11, fontFamily: FS, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Open {cad.name} ↗
            </a>
            <div style={{ fontSize: 10, color: T.muted, fontFamily: FS }}>Search by address to retrieve parcel data</div>
          </div>

          <div style={{ height: 1, backgroundColor: T.border }} />

          {/* Manual fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>Owner Name</label><input value={local.ownerName || ''} onChange={e => update('ownerName', e.target.value)} placeholder="From CAD search" style={inputStyle} /></div>
            <div><label style={labelStyle}>Parcel ID / Account #</label><input value={local.parcelId || ''} onChange={e => update('parcelId', e.target.value)} placeholder="CAD account number" style={inputStyle} /></div>
            <div><label style={labelStyle}>Acreage</label><input value={local.acreage || ''} onChange={e => update('acreage', e.target.value)} placeholder="e.g. 2.35 ac" style={inputStyle} /></div>
            <div><label style={labelStyle}>Zoning</label><input value={local.zoning || ''} onChange={e => update('zoning', e.target.value)} placeholder="e.g. C-2, I-1, AG" style={inputStyle} /></div>
          </div>
          <div><label style={labelStyle}>Legal Description</label><input value={local.legalDescription || ''} onChange={e => update('legalDescription', e.target.value)} placeholder="From deed or CAD record" style={inputStyle} /></div>

          {/* Verified toggle */}
          <div
            onClick={() => update('verifiedByUser', !local.verifiedByUser)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 10px', borderRadius: 2, backgroundColor: local.verifiedByUser ? 'rgba(39,174,96,0.08)' : 'rgba(17,26,36,0.03)', border: `1px solid ${local.verifiedByUser ? 'rgba(39,174,96,0.3)' : T.border}` }}
          >
            <div style={{ width: 14, height: 14, borderRadius: 2, backgroundColor: local.verifiedByUser ? '#27AE60' : 'transparent', border: `1.5px solid ${local.verifiedByUser ? '#27AE60' : T.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {local.verifiedByUser && <div style={{ color: 'white', fontSize: 9, lineHeight: 1 }}>✓</div>}
            </div>
            <div style={{ fontSize: 11, color: local.verifiedByUser ? '#27AE60' : T.muted, fontFamily: FS }}>
              {local.verifiedByUser ? 'Parcel data verified by Environmental Professional' : 'Mark as verified after CAD confirmation'}
            </div>
          </div>

          {/* Report note */}
          <div style={{ fontSize: 10, color: T.muted, fontFamily: FS, lineHeight: 1.5, padding: '8px 10px', backgroundColor: 'rgba(17,26,36,0.02)', borderRadius: 2 }}>
            Report language: Parcel data sourced from {cad.name}. {local.verifiedByUser ? 'Data has been verified by the Environmental Professional.' : 'Manual verification required before final Phase I reliance.'}
          </div>
        </div>
      )}
    </div>
  );
}
