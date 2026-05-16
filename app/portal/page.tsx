'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const SUBSYSTEMS = [
  { id: 'STRATUM', label: 'Geospatial Index', desc: '18 knowledge domains' },
  { id: 'LOCUS', label: 'AI Cognition', desc: 'EP-grade reasoning' },
  { id: 'NEXUS', label: 'Satellite Telemetry', desc: 'Sentinel-1/2 · Landsat-9' },
  { id: 'ASTRA', label: 'Intelligence Core', desc: 'Composite system' },
];

const QUICK = [
  { href: '/portal/reports', label: 'NEW PHASE I ESA', desc: 'ASTM E1527-21 compliant report' },
  { href: '/portal/astra-query', label: 'QUERY ASTRA', desc: 'Ask LOCUS anything environmental' },
  { href: '/portal/regulatory', label: 'REGULATORY SCAN', desc: 'Live TCEQ · EPA · FEMA · NWI' },
  { href: '/portal/swppp', label: 'SWPPP MODULE', desc: 'TXR150000 · TPDES compliance' },
];

export default function PortalCommand() {
  const [health, setHealth] = useState<any>(null);
  const [time, setTime] = useState('');

  useEffect(() => {
    fetch('/api/astra/health').then(r => r.json()).then(setHealth).catch(() => {});
    const tick = () => setTime(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ color: '#B08840', fontSize: 9, letterSpacing: '0.35em', marginBottom: 6 }}>ASTRA COMMAND CENTER</div>
        <div style={{ color: '#222', fontSize: 9, letterSpacing: '0.2em', fontFamily: 'monospace' }}>{time}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginBottom: 32, background: '#111' }}>
        {SUBSYSTEMS.map(s => {
          const online = health?.subsystems?.[s.id];
          return (
            <div key={s.id} style={{ background: '#0a0a0a', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: online ? '#22c55e' : health ? '#ef4444' : '#333' }} />
                <span style={{ color: '#B08840', fontSize: 9, letterSpacing: '0.25em' }}>{s.id}</span>
              </div>
              <div style={{ color: '#555', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
              <div style={{ color: '#2a2a2a', fontSize: 9 }}>{s.desc}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: '#111', marginBottom: 32 }}>
        {QUICK.map(q => (
          <Link key={q.href} href={q.href} style={{ background: '#0a0a0a', padding: '20px 24px', textDecoration: 'none', display: 'block', borderLeft: '2px solid #111', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderLeftColor = '#B08840')}
            onMouseLeave={e => (e.currentTarget.style.borderLeftColor = '#111')}>
            <div style={{ color: '#B08840', fontSize: 9, letterSpacing: '0.25em', marginBottom: 6 }}>{q.label}</div>
            <div style={{ color: '#444', fontSize: 10 }}>{q.desc}</div>
          </Link>
        ))}
      </div>

      <div style={{ border: '1px solid #111', padding: '16px 20px' }}>
        <div style={{ color: '#2a2a2a', fontSize: 9, letterSpacing: '0.2em', marginBottom: 12 }}>SYSTEM STATUS</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <span style={{ color: '#333', fontSize: 9 }}>ENGINE · {health?.status?.toUpperCase() || 'CONNECTING'}</span>
          <span style={{ color: '#222', fontSize: 9 }}>PORTAL AUTH · ACTIVE</span>
          <span style={{ color: '#222', fontSize: 9 }}>TCEQ FEED · LIVE</span>
          <span style={{ color: '#222', fontSize: 9 }}>EPA FEED · LIVE</span>
        </div>
      </div>
    </div>
  );
}
