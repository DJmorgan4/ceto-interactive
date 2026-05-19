'use client';
import { useState, useEffect, useRef } from 'react';

const BLUE = '#2F5D8C';
const RED = '#C0392B';
const GREEN = '#27AE60';
const INK = '#111A24';
const MUTED = 'rgba(17,26,36,0.45)';
const BORDER = 'rgba(17,26,36,0.12)';
const FS = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

type YNN = 'yes' | 'no' | 'unknown';

interface FieldData {
  projectName: string;
  address: string;
  clientName: string;
  reconDate: string;
  reconType: 'physical' | 'desktop' | 'none';
  lat: number | null;
  lng: number | null;
  // Surface
  staining: YNN; stainingNotes: string;
  odors: YNN; odorNotes: string;
  drums: YNN; drumNotes: string;
  fillMaterial: YNN; fillNotes: string;
  // UST/AST
  ustIndicators: YNN; ustNotes: string;
  aboveGroundTanks: YNN; astNotes: string;
  pipingVents: YNN;
  // Drainage
  floorDrains: YNN; sumps: YNN; drainNotes: string;
  // Vegetation & Structures
  distressedVeg: YNN; vegNotes: string;
  asbestosAge: YNN; leadPaint: YNN;
  // Adjacent
  adjPetroleum: YNN; adjIndustrial: YNN; adjNotes: string;
  // General
  generalNotes: string;
  photos: string[]; // base64
}

const defaults = (): FieldData => ({
  projectName: '', address: '', clientName: '',
  reconDate: new Date().toISOString().split('T')[0],
  reconType: 'physical', lat: null, lng: null,
  staining: 'unknown', stainingNotes: '',
  odors: 'unknown', odorNotes: '',
  drums: 'unknown', drumNotes: '',
  fillMaterial: 'unknown', fillNotes: '',
  ustIndicators: 'unknown', ustNotes: '',
  aboveGroundTanks: 'unknown', astNotes: '',
  pipingVents: 'unknown',
  floorDrains: 'unknown', sumps: 'unknown', drainNotes: '',
  distressedVeg: 'unknown', vegNotes: '',
  asbestosAge: 'unknown', leadPaint: 'unknown',
  adjPetroleum: 'unknown', adjIndustrial: 'unknown', adjNotes: '',
  generalNotes: '', photos: [],
});

function YNNButton({ value, onChange, label, redIfYes = true }: { value: YNN; onChange: (v: YNN) => void; label: string; redIfYes?: boolean }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, color: INK, fontFamily: FS, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['yes', 'no', 'unknown'] as YNN[]).map(opt => {
          const active = value === opt;
          const color = active
            ? opt === 'yes' ? (redIfYes ? RED : GREEN)
            : opt === 'no' ? (redIfYes ? GREEN : RED)
            : '#64748B'
            : MUTED;
          return (
            <button key={opt} onClick={() => onChange(opt)} style={{
              flex: 1, padding: '10px 0', fontSize: 13, fontFamily: FS,
              borderRadius: 6, border: `1.5px solid ${active ? color : BORDER}`,
              backgroundColor: active ? `${color}18` : '#fff',
              color: active ? color : MUTED, cursor: 'pointer', fontWeight: active ? 600 : 400,
            }}>
              {opt === 'unknown' ? '?' : opt.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: BLUE, fontFamily: FS, fontWeight: 600, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>{title}</div>
      {children}
    </div>
  );
}

const inp = { width: '100%', boxSizing: 'border-box' as const, fontSize: 15, fontFamily: FS, padding: '12px 14px', backgroundColor: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: 8, outline: 'none', color: INK, marginBottom: 12 };

export default function FieldRecon() {
  const [d, setD] = useState<FieldData>(defaults());
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'getting' | 'got' | 'error'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const steps = ['Project', 'Surface', 'UST/AST', 'Drainage', 'Structure', 'Adjacent', 'Photos', 'Submit'];

  useEffect(() => {
    const saved = localStorage.getItem('ceto_field_draft');
    if (saved) try { setD(JSON.parse(saved)); } catch {}
  }, []);

  const update = (field: keyof FieldData, value: any) => {
    setD(prev => {
      const next = { ...prev, [field]: value };
      localStorage.setItem('ceto_field_draft', JSON.stringify(next));
      return next;
    });
  };

  const getGPS = () => {
    setGpsStatus('getting');
    navigator.geolocation.getCurrentPosition(
      pos => { update('lat', pos.coords.latitude); update('lng', pos.coords.longitude); setGpsStatus('got'); },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const b64 = ev.target?.result as string;
        update('photos', [...d.photos, b64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const hasRECs = d.staining === 'yes' || d.ustIndicators === 'yes' || d.drums === 'yes' || d.odors === 'yes';

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        project_name: d.projectName,
        address: d.address,
        client_name: d.clientName,
        recon_date: d.reconDate,
        recon_type: d.reconType,
        lat: d.lat, lng: d.lng,
        has_recs: hasRECs,
        field_data: d,
        photo_count: d.photos.length,
        created_at: new Date().toISOString(),
      };
      const res = await fetch('/api/portal/field-recon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaved(true);
        localStorage.removeItem('ceto_field_draft');
      }
    } catch {}
    setSaving(false);
  };

  if (saved) return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: GREEN, fontFamily: FS, marginBottom: 8 }}>Saved to STRATUM</div>
        <div style={{ fontSize: 14, color: MUTED, fontFamily: FS, marginBottom: 24 }}>Field recon for {d.projectName} is synced.</div>
        <button onClick={() => { setD(defaults()); setSaved(false); setStep(0); }} style={{ padding: '12px 24px', backgroundColor: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: FS, cursor: 'pointer' }}>New Recon</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F8F9FA', fontFamily: FS }}>

      {/* Header */}
      <div style={{ backgroundColor: BLUE, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.6)' }}>CETO INTERACTIVE</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Field Reconnaissance</div>
        </div>
        {hasRECs && <div style={{ backgroundColor: RED, color: '#fff', fontSize: 10, padding: '4px 10px', borderRadius: 4, letterSpacing: '0.1em' }}>⚠ REC</div>}
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', backgroundColor: '#fff', borderBottom: `1px solid ${BORDER}`, overflowX: 'auto' }}>
        {steps.map((s, i) => (
          <button key={s} onClick={() => setStep(i)} style={{
            flex: '0 0 auto', padding: '10px 14px', fontSize: 11, fontFamily: FS,
            border: 'none', borderBottom: `2px solid ${i === step ? BLUE : 'transparent'}`,
            backgroundColor: 'transparent', color: i === step ? BLUE : MUTED,
            cursor: 'pointer', fontWeight: i === step ? 600 : 400, whiteSpace: 'nowrap',
          }}>{s}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 20px', maxWidth: 600, margin: '0 auto' }}>

        {/* Step 0: Project */}
        {step === 0 && (
          <Section title="Project Information">
            <input value={d.projectName} onChange={e => update('projectName', e.target.value)} placeholder="Project name *" style={inp} />
            <input value={d.address} onChange={e => update('address', e.target.value)} placeholder="Site address *" style={inp} />
            <input value={d.clientName} onChange={e => update('clientName', e.target.value)} placeholder="Client name" style={inp} />
            <input type="date" value={d.reconDate} onChange={e => update('reconDate', e.target.value)} style={inp} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {([['physical','Physical Visit'],['desktop','Desktop Only'],['none','Not Performed']] as const).map(([val, lbl]) => (
                <button key={val} onClick={() => update('reconType', val)} style={{
                  flex: 1, padding: '10px 6px', fontSize: 12, fontFamily: FS,
                  borderRadius: 6, border: `1.5px solid ${d.reconType === val ? BLUE : BORDER}`,
                  backgroundColor: d.reconType === val ? `${BLUE}18` : '#fff',
                  color: d.reconType === val ? BLUE : MUTED, cursor: 'pointer',
                }}>{lbl}</button>
              ))}
            </div>
            <button onClick={getGPS} style={{ width: '100%', padding: '12px', backgroundColor: gpsStatus === 'got' ? `${GREEN}18` : '#fff', border: `1.5px solid ${gpsStatus === 'got' ? GREEN : BORDER}`, borderRadius: 8, fontSize: 14, color: gpsStatus === 'got' ? GREEN : BLUE, fontFamily: FS, cursor: 'pointer' }}>
              {gpsStatus === 'idle' ? '📍 Capture GPS Location' : gpsStatus === 'getting' ? 'Getting location...' : gpsStatus === 'got' ? `✓ ${d.lat?.toFixed(5)}, ${d.lng?.toFixed(5)}` : '⚠ GPS unavailable'}
            </button>
          </Section>
        )}

        {/* Step 1: Surface */}
        {step === 1 && (
          <Section title="Surface Conditions">
            <YNNButton value={d.staining} onChange={v => update('staining', v)} label="Staining / discoloration" />
            {d.staining === 'yes' && <input value={d.stainingNotes} onChange={e => update('stainingNotes', e.target.value)} placeholder="Location, color, extent..." style={inp} />}
            <YNNButton value={d.odors} onChange={v => update('odors', v)} label="Petroleum / chemical odors" />
            {d.odors === 'yes' && <input value={d.odorNotes} onChange={e => update('odorNotes', e.target.value)} placeholder="Odor type and location..." style={inp} />}
            <YNNButton value={d.drums} onChange={v => update('drums', v)} label="Drums / containers / hazmat storage" />
            {d.drums === 'yes' && <input value={d.drumNotes} onChange={e => update('drumNotes', e.target.value)} placeholder="Type, condition, quantity..." style={inp} />}
            <YNNButton value={d.fillMaterial} onChange={v => update('fillMaterial', v)} label="Fill material / disturbed soils" />
            {d.fillMaterial === 'yes' && <input value={d.fillNotes} onChange={e => update('fillNotes', e.target.value)} placeholder="Describe fill material..." style={inp} />}
          </Section>
        )}

        {/* Step 2: UST/AST */}
        {step === 2 && (
          <Section title="UST / AST Indicators">
            <YNNButton value={d.ustIndicators} onChange={v => update('ustIndicators', v)} label="UST evidence (fill ports, dispenser pads, vent pipes)" />
            {d.ustIndicators === 'yes' && <textarea value={d.ustNotes} onChange={e => update('ustNotes', e.target.value)} rows={3} placeholder="Describe UST indicators..." style={{ ...inp, resize: 'vertical' }} />}
            <YNNButton value={d.aboveGroundTanks} onChange={v => update('aboveGroundTanks', v)} label="Above-ground storage tanks (ASTs)" />
            {d.aboveGroundTanks === 'yes' && <input value={d.astNotes} onChange={e => update('astNotes', e.target.value)} placeholder="Tank size, contents, condition..." style={inp} />}
            <YNNButton value={d.pipingVents} onChange={v => update('pipingVents', v)} label="Suspect piping / vents / fill ports" />
          </Section>
        )}

        {/* Step 3: Drainage */}
        {step === 3 && (
          <Section title="Drainage">
            <YNNButton value={d.floorDrains} onChange={v => update('floorDrains', v)} label="Floor drains / trench drains" />
            <YNNButton value={d.sumps} onChange={v => update('sumps', v)} label="Sumps / pits / underground vaults" />
            <input value={d.drainNotes} onChange={e => update('drainNotes', e.target.value)} placeholder="Drainage notes..." style={inp} />
          </Section>
        )}

        {/* Step 4: Structure */}
        {step === 4 && (
          <Section title="Vegetation & Structures">
            <YNNButton value={d.distressedVeg} onChange={v => update('distressedVeg', v)} label="Distressed / dead vegetation patterns" />
            {d.distressedVeg === 'yes' && <input value={d.vegNotes} onChange={e => update('vegNotes', e.target.value)} placeholder="Location and pattern..." style={inp} />}
            <YNNButton value={d.asbestosAge} onChange={v => update('asbestosAge', v)} label="Pre-1980 construction (ACM risk)" redIfYes={false} />
            <YNNButton value={d.leadPaint} onChange={v => update('leadPaint', v)} label="Pre-1978 construction (lead paint risk)" redIfYes={false} />
          </Section>
        )}

        {/* Step 5: Adjacent */}
        {step === 5 && (
          <Section title="Adjacent Land Uses">
            <YNNButton value={d.adjPetroleum} onChange={v => update('adjPetroleum', v)} label="Petroleum / automotive uses adjacent" />
            <YNNButton value={d.adjIndustrial} onChange={v => update('adjIndustrial', v)} label="Industrial / manufacturing adjacent" />
            <textarea value={d.adjNotes} onChange={e => update('adjNotes', e.target.value)} rows={3} placeholder="Additional adjacent land use observations..." style={{ ...inp, resize: 'vertical' }} />
            <textarea value={d.generalNotes} onChange={e => update('generalNotes', e.target.value)} rows={4} placeholder="General observations / additional notes..." style={{ ...inp, resize: 'vertical' }} />
          </Section>
        )}

        {/* Step 6: Photos */}
        {step === 6 && (
          <Section title="Site Photographs">
            <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" onChange={addPhoto} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '16px', backgroundColor: '#fff', border: `2px dashed ${BLUE}`, borderRadius: 8, fontSize: 15, color: BLUE, fontFamily: FS, cursor: 'pointer', marginBottom: 16 }}>
              📷 Add Photos ({d.photos.length})
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {d.photos.map((p, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={p} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }} />
                  <button onClick={() => update('photos', d.photos.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer' }}>×</button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Step 7: Submit */}
        {step === 7 && (
          <Section title="Submit Reconnaissance">
            <div style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
              {[
                ['Project', d.projectName || '—'],
                ['Address', d.address || '—'],
                ['Client', d.clientName || '—'],
                ['Date', d.reconDate],
                ['Type', d.reconType],
                ['GPS', d.lat ? `${d.lat.toFixed(5)}, ${d.lng?.toFixed(5)}` : 'Not captured'],
                ['Photos', `${d.photos.length}`],
                ['REC Indicators', hasRECs ? '⚠ YES' : 'None'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
                  <span style={{ color: MUTED }}>{label}</span>
                  <span style={{ color: label === 'REC Indicators' && hasRECs ? RED : INK, fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
            {hasRECs && (
              <div style={{ backgroundColor: 'rgba(192,57,43,0.06)', border: `1px solid rgba(192,57,43,0.3)`, borderRadius: 8, padding: 14, marginBottom: 20, fontSize: 13, color: RED }}>
                ⚠ REC indicators present — Phase II ESA recommended. Document with photographs and include in report.
              </div>
            )}
            <button onClick={submit} disabled={saving || !d.projectName} style={{ width: '100%', padding: '16px', backgroundColor: d.projectName ? BLUE : MUTED, color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontFamily: FS, cursor: d.projectName ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
              {saving ? 'Saving...' : 'Save to STRATUM'}
            </button>
            <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', marginTop: 10 }}>
              Draft auto-saved locally. Submitting syncs to Ceto portal.
            </div>
          </Section>
        )}

        {/* Nav */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '14px', backgroundColor: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: 8, fontSize: 15, color: INK, fontFamily: FS, cursor: 'pointer' }}>← Back</button>}
          {step < steps.length - 1 && <button onClick={() => setStep(s => s + 1)} style={{ flex: 2, padding: '14px', backgroundColor: BLUE, border: 'none', borderRadius: 8, fontSize: 15, color: '#fff', fontFamily: FS, cursor: 'pointer', fontWeight: 600 }}>Next →</button>}
        </div>
      </div>
    </div>
  );
}
