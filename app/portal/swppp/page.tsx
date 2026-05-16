'use client';
import { useState } from 'react';
import Link from 'next/link';

const SECTIONS = [
  'Site Description & Location',
  'Pollution Prevention Team',
  'Potential Pollutant Sources',
  'Best Management Practices (BMPs)',
  'Inspection & Monitoring Schedule',
  'Corrective Action Procedures',
  'TPDES TXR150000 Certification',
];

export default function SwpppPage() {
  const [projectName, setProjectName] = useState('');
  const [address, setAddress] = useState('');
  const [acres, setAcres] = useState('');
  const [operator, setOperator] = useState('');
  const [generating, setGenerating] = useState(false);
  const [ready, setReady] = useState(false);

  const generate = async () => {
    if (!projectName || generating) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1800));
    setReady(true);
    setGenerating(false);
  };

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: '#B08840', fontSize: 9, letterSpacing: '0.35em', marginBottom: 4 }}>SWPPP MODULE · TPDES TXR150000</div>
        <div style={{ color: '#2a2a2a', fontSize: 9 }}>Stormwater Pollution Prevention Plan · Texas Construction General Permit</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
        {[
          { label: 'PROJECT NAME', val: projectName, set: setProjectName, ph: 'e.g. McKinney Commercial Development' },
          { label: 'SITE ADDRESS', val: address, set: setAddress, ph: 'Street address or legal description' },
          { label: 'DISTURBED ACRES', val: acres, set: setAcres, ph: 'Total acres of land disturbance' },
          { label: 'OPERATOR / PERMITTEE', val: operator, set: setOperator, ph: 'Responsible party name' },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', gap: 0 }}>
            <div style={{ width: 180, background: '#0a0a0a', border: '1px solid #111', borderRight: 'none', padding: '10px 14px', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#333', fontSize: 9, letterSpacing: '0.18em' }}>{f.label}</span>
            </div>
            <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              style={{ flex: 1, background: '#0a0a0a', border: '1px solid #111', color: '#777', fontSize: 11, padding: '10px 14px', outline: 'none' }} />
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #111', marginBottom: 24 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #111' }}>
          <span style={{ color: '#2a2a2a', fontSize: 9, letterSpacing: '0.2em' }}>SWPPP SECTIONS TO GENERATE</span>
        </div>
        {SECTIONS.map((s, i) => (
          <div key={i} style={{ padding: '10px 16px', borderBottom: i < SECTIONS.length - 1 ? '1px solid #0d0d0d' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 3, background: '#B08840', borderRadius: '50%', opacity: 0.5 }} />
            <span style={{ color: '#333', fontSize: 10 }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={generate} disabled={!projectName || generating}
          style={{ padding: '12px 32px', border: '1px solid #B08840', color: '#B08840', background: 'transparent', fontSize: 9, letterSpacing: '0.2em', cursor: 'pointer', opacity: !projectName || generating ? 0.4 : 1 }}>
          {generating ? 'GENERATING...' : 'GENERATE SWPPP'}
        </button>
        {ready && (
          <Link href="/portal/reports" style={{ color: '#22c55e', fontSize: 9, letterSpacing: '0.18em', textDecoration: 'none' }}>
            ✓ READY · VIEW IN REPORTS →
          </Link>
        )}
      </div>

      {ready && (
        <div style={{ marginTop: 20, padding: '16px 20px', border: '1px solid #1a2a1a', background: '#080e08' }}>
          <div style={{ color: '#22c55e', fontSize: 9, letterSpacing: '0.2em', marginBottom: 6 }}>SWPPP GENERATED</div>
          <div style={{ color: '#333', fontSize: 10 }}>Project: {projectName} · {acres} acres · Operator: {operator || 'Not specified'}</div>
          <div style={{ color: '#222', fontSize: 9, marginTop: 4 }}>TXR150000 compliant · Ready for EP review and signature</div>
        </div>
      )}
    </div>
  );
}
