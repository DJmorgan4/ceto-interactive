'use client';
import { useState } from 'react';

const SOURCES = [
  { id: 'tceq', label: 'TCEQ', desc: 'Texas Commission on Environmental Quality' },
  { id: 'epa', label: 'EPA', desc: 'Federal facility databases' },
  { id: 'fema', label: 'FEMA', desc: 'Flood hazard areas' },
  { id: 'nwi', label: 'NWI', desc: 'National Wetland Inventory' },
  { id: 'usgs', label: 'USGS 3DEP', desc: 'Elevation · terrain' },
  { id: 'ssurgo', label: 'SSURGO', desc: 'Soils · drainage · hydro group' },
];

export default function RegulatoryPage() {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const scan = async () => {
    if (!lat || !lng || loading) return;
    setLoading(true); setError(''); setResults(null);
    try {
      const [intel, tceq] = await Promise.allSettled([
        fetch(`/api/portal/regulatory-intel?lat=${lat}&lng=${lng}`).then(r => r.json()),
        fetch(`/api/portal/tceq-intel?lat=${lat}&lng=${lng}`).then(r => r.json()),
      ]);
      setResults({
        intel: intel.status === 'fulfilled' ? intel.value : null,
        tceq: tceq.status === 'fulfilled' ? tceq.value : null,
        coords: { lat, lng },
      });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: '#B08840', fontSize: 9, letterSpacing: '0.35em', marginBottom: 4 }}>REGULATORY INTELLIGENCE SCAN</div>
        <div style={{ color: '#2a2a2a', fontSize: 9 }}>Live coordinate query · TCEQ · EPA · FEMA · NWI · USGS · SSURGO</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input value={lat} onChange={e => setLat(e.target.value)} placeholder="Latitude (e.g. 33.1972)"
          style={{ flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#888', fontSize: 11, padding: '10px 14px', outline: 'none' }} />
        <input value={lng} onChange={e => setLng(e.target.value)} placeholder="Longitude (e.g. -96.6397)"
          style={{ flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#888', fontSize: 11, padding: '10px 14px', outline: 'none' }} />
        <button onClick={scan} disabled={loading}
          style={{ padding: '10px 28px', border: '1px solid #B08840', color: '#B08840', background: 'transparent', fontSize: 9, letterSpacing: '0.2em', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'SCANNING...' : 'SCAN'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#111', marginBottom: 24 }}>
        {SOURCES.map(s => (
          <div key={s.id} style={{ background: '#0a0a0a', padding: '12px 16px' }}>
            <div style={{ color: '#B08840', fontSize: 9, letterSpacing: '0.2em', marginBottom: 3 }}>{s.label}</div>
            <div style={{ color: '#2a2a2a', fontSize: 9 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {error && <div style={{ color: '#ef4444', fontSize: 10, padding: '12px 16px', border: '1px solid #2a0a0a', marginBottom: 16 }}>{error}</div>}

      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#111' }}>
          <div style={{ background: '#0a0a0a', padding: '16px 20px' }}>
            <div style={{ color: '#B08840', fontSize: 9, letterSpacing: '0.2em', marginBottom: 10 }}>SCAN COORDINATES</div>
            <div style={{ color: '#555', fontSize: 10 }}>{results.coords.lat}° N · {results.coords.lng}° E</div>
          </div>
          {results.tceq && (
            <div style={{ background: '#0a0a0a', padding: '16px 20px' }}>
              <div style={{ color: '#B08840', fontSize: 9, letterSpacing: '0.2em', marginBottom: 10 }}>TCEQ DATABASE</div>
              <pre style={{ color: '#444', fontSize: 9, lineHeight: 1.6, overflow: 'auto', maxHeight: 200 }}>{JSON.stringify(results.tceq, null, 2)}</pre>
            </div>
          )}
          {results.intel && (
            <div style={{ background: '#0a0a0a', padding: '16px 20px' }}>
              <div style={{ color: '#B08840', fontSize: 9, letterSpacing: '0.2em', marginBottom: 10 }}>ENVIRONMENTAL INTEL</div>
              <pre style={{ color: '#444', fontSize: 9, lineHeight: 1.6, overflow: 'auto', maxHeight: 300 }}>{JSON.stringify(results.intel, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
