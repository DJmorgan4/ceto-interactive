'use client';
import { useState } from 'react';

const FS = 'Jost, sans-serif';
const T = { blue: '#2F5D8C', border: 'rgba(17,26,36,0.1)', surface: '#FFFFFF', blueLight: 'rgba(47,93,140,0.06)', muted: 'rgba(17,26,36,0.45)', ink: '#111A24' };

type YNN = 'yes' | 'no' | 'unknown';

export interface ReconData {
  reconDate: string;
  reconType: 'physical' | 'desktop' | 'none';
  staining: YNN; stainingNotes: string;
  odors: YNN; odorNotes: string;
  drums: YNN; drumNotes: string;
  fillMaterial: YNN; fillNotes: string;
  ustIndicators: YNN; ustNotes: string;
  aboveGroundTanks: YNN; astNotes: string;
  pipingVents: YNN;
  floorDrains: YNN; sumps: YNN; drainNotes: string;
  distressedVeg: YNN; vegNotes: string;
  asbestosAge: YNN; leadPaint: YNN;
  adjPetroleum: YNN; adjIndustrial: YNN; adjNotes: string;
  generalNotes: string;
}

const defaultRecon = (): ReconData => ({
  reconDate: new Date().toISOString().split('T')[0], reconType: 'desktop',
  staining: 'unknown', stainingNotes: '', odors: 'unknown', odorNotes: '',
  drums: 'unknown', drumNotes: '', fillMaterial: 'unknown', fillNotes: '',
  ustIndicators: 'unknown', ustNotes: '', aboveGroundTanks: 'unknown', astNotes: '',
  pipingVents: 'unknown', floorDrains: 'unknown', sumps: 'unknown', drainNotes: '',
  distressedVeg: 'unknown', vegNotes: '', asbestosAge: 'unknown', leadPaint: 'unknown',
  adjPetroleum: 'unknown', adjIndustrial: 'unknown', adjNotes: '', generalNotes: '',
});

export function reconToNotes(r: ReconData): string {
  return [
    `SITE RECONNAISSANCE — ${r.reconType === 'physical' ? 'Physical Site Visit' : r.reconType === 'desktop' ? 'Desktop Reconnaissance Only' : 'Not Performed'} — ${r.reconDate}`,
    `\nSURFACE CONDITIONS:`,
    `  Staining/Discoloration: ${r.staining.toUpperCase()}${r.stainingNotes ? ' — ' + r.stainingNotes : ''}`,
    `  Odors: ${r.odors.toUpperCase()}${r.odorNotes ? ' — ' + r.odorNotes : ''}`,
    `  Drums/Containers: ${r.drums.toUpperCase()}${r.drumNotes ? ' — ' + r.drumNotes : ''}`,
    `  Fill Material: ${r.fillMaterial.toUpperCase()}${r.fillNotes ? ' — ' + r.fillNotes : ''}`,
    `\nUST/AST INDICATORS:`,
    `  UST Evidence: ${r.ustIndicators.toUpperCase()}${r.ustNotes ? ' — ' + r.ustNotes : ''}`,
    `  Above-Ground Tanks: ${r.aboveGroundTanks.toUpperCase()}${r.astNotes ? ' — ' + r.astNotes : ''}`,
    `  Piping/Vents/Fill Ports: ${r.pipingVents.toUpperCase()}`,
    `\nDRAINAGE:`,
    `  Floor Drains: ${r.floorDrains.toUpperCase()}`,
    `  Sumps/Pits: ${r.sumps.toUpperCase()}`,
    r.drainNotes ? `  Notes: ${r.drainNotes}` : '',
    `\nVEGETATION & STRUCTURES:`,
    `  Distressed Vegetation: ${r.distressedVeg.toUpperCase()}${r.vegNotes ? ' — ' + r.vegNotes : ''}`,
    `  Pre-1980 Construction (ACM): ${r.asbestosAge.toUpperCase()}`,
    `  Pre-1978 Construction (LBP): ${r.leadPaint.toUpperCase()}`,
    `\nADJACENT LAND USES:`,
    `  Petroleum/Automotive Adjacent: ${r.adjPetroleum.toUpperCase()}`,
    `  Industrial Adjacent: ${r.adjIndustrial.toUpperCase()}`,
    r.adjNotes ? `  Notes: ${r.adjNotes}` : '',
    r.generalNotes ? `\nADDITIONAL OBSERVATIONS:\n  ${r.generalNotes}` : '',
  ].filter(Boolean).join('\n');
}

interface Props { data?: ReconData | null; onUpdate?: (d: ReconData) => void; onNotesChange?: (n: string) => void; }

function YNNToggle({ value, onChange, label, redIfYes = true }: { value: YNN; onChange: (v: YNN) => void; label: string; redIfYes?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
      <span style={{ fontSize: 11, color: T.ink, fontFamily: FS, flex: 1 }}>{label}</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {(['yes', 'no', 'unknown'] as YNN[]).map(opt => {
          const active = value === opt;
          const color = active ? (opt === 'yes' ? (redIfYes ? '#C0392B' : '#27AE60') : opt === 'no' ? (redIfYes ? '#27AE60' : '#C0392B') : '#64748B') : T.muted;
          return <button key={opt} onClick={() => onChange(opt)} style={{ padding: '3px 8px', fontSize: 9, fontFamily: FS, borderRadius: 2, border: `1px solid ${active ? color : T.border}`, backgroundColor: active ? `${color}15` : 'transparent', color: active ? color : T.muted, cursor: 'pointer' }}>{opt === 'unknown' ? '?' : opt}</button>;
        })}
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', boxSizing: 'border-box' as const, fontSize: 11, fontFamily: FS, padding: '6px 9px', backgroundColor: 'rgba(17,26,36,0.02)', border: `1px solid rgba(17,26,36,0.1)`, borderRadius: 2, outline: 'none', color: '#111A24', marginBottom: 8 };
const sectionLabel = { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: T.muted, fontFamily: FS, marginBottom: 8, marginTop: 4, display: 'block' as const };

export default function ReconForm({ data, onUpdate, onNotesChange }: Props) {
  const [r, setR] = useState<ReconData>(data || defaultRecon());
  const [expanded, setExpanded] = useState(false);

  const update = (field: keyof ReconData, value: string) => {
    const next = { ...r, [field]: value };
    setR(next);
    onUpdate?.(next);
    onNotesChange?.(reconToNotes(next));
  };

  const hasRECs = r.staining === 'yes' || r.ustIndicators === 'yes' || r.drums === 'yes' || r.odors === 'yes';
  const unknownCount = Object.values(r).filter(v => v === 'unknown').length;

  return (
    <div style={{ border: `1px solid ${hasRECs ? 'rgba(192,57,43,0.3)' : T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden', marginBottom: 8 }}>
      <div onClick={() => setExpanded(e => !e)} style={{ padding: '9px 12px', backgroundColor: hasRECs ? 'rgba(192,57,43,0.04)' : T.blueLight, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: hasRECs ? '#C0392B' : T.blue, fontFamily: FS }}>
            Site Reconnaissance {hasRECs ? '⚠ REC Indicators Present' : unknownCount < 8 ? '✓ Recorded' : '— Click to Complete'}
          </span>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: FS, marginTop: 1 }}>
            {r.reconType === 'physical' ? 'Physical visit' : r.reconType === 'desktop' ? 'Desktop only' : 'Not performed'} · {r.reconDate}
          </div>
        </div>
        <span style={{ fontSize: 10, color: T.muted, fontFamily: FS }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {([['physical', 'Physical Site Visit'], ['desktop', 'Desktop Only'], ['none', 'Not Performed']] as const).map(([val, lbl]) => (
              <button key={val} onClick={() => update('reconType', val)} style={{ padding: '4px 10px', fontSize: 10, fontFamily: FS, borderRadius: 2, border: `1px solid ${r.reconType === val ? T.blue : T.border}`, backgroundColor: r.reconType === val ? T.blueLight : 'transparent', color: r.reconType === val ? T.blue : T.muted, cursor: 'pointer' }}>{lbl}</button>
            ))}
          </div>

          <span style={sectionLabel}>Surface Conditions</span>
          <YNNToggle value={r.staining} onChange={v => update('staining', v)} label="Staining / discoloration" />
          {r.staining === 'yes' && <input value={r.stainingNotes} onChange={e => update('stainingNotes', e.target.value)} placeholder="Location, color, extent..." style={inputStyle} />}
          <YNNToggle value={r.odors} onChange={v => update('odors', v)} label="Petroleum / chemical odors" />
          {r.odors === 'yes' && <input value={r.odorNotes} onChange={e => update('odorNotes', e.target.value)} placeholder="Odor type and location..." style={inputStyle} />}
          <YNNToggle value={r.drums} onChange={v => update('drums', v)} label="Drums / containers / hazmat storage" />
          <YNNToggle value={r.fillMaterial} onChange={v => update('fillMaterial', v)} label="Fill material / disturbed soils" />

          <span style={sectionLabel}>UST / AST Indicators</span>
          <YNNToggle value={r.ustIndicators} onChange={v => update('ustIndicators', v)} label="UST evidence (fill ports, dispenser pads, vent pipes)" />
          {r.ustIndicators === 'yes' && <input value={r.ustNotes} onChange={e => update('ustNotes', e.target.value)} placeholder="Describe UST indicators..." style={inputStyle} />}
          <YNNToggle value={r.aboveGroundTanks} onChange={v => update('aboveGroundTanks', v)} label="Above-ground storage tanks (ASTs)" />
          <YNNToggle value={r.pipingVents} onChange={v => update('pipingVents', v)} label="Suspect piping / vents / fill ports" />

          <span style={sectionLabel}>Drainage</span>
          <YNNToggle value={r.floorDrains} onChange={v => update('floorDrains', v)} label="Floor drains / trench drains" />
          <YNNToggle value={r.sumps} onChange={v => update('sumps', v)} label="Sumps / pits / underground vaults" />

          <span style={sectionLabel}>Vegetation & Structures</span>
          <YNNToggle value={r.distressedVeg} onChange={v => update('distressedVeg', v)} label="Distressed / dead vegetation patterns" />
          <YNNToggle value={r.asbestosAge} onChange={v => update('asbestosAge', v)} label="Pre-1980 construction (ACM risk)" redIfYes={false} />
          <YNNToggle value={r.leadPaint} onChange={v => update('leadPaint', v)} label="Pre-1978 construction (lead paint risk)" redIfYes={false} />

          <span style={sectionLabel}>Adjacent Land Uses</span>
          <YNNToggle value={r.adjPetroleum} onChange={v => update('adjPetroleum', v)} label="Petroleum / automotive uses adjacent" />
          <YNNToggle value={r.adjIndustrial} onChange={v => update('adjIndustrial', v)} label="Industrial / manufacturing adjacent" />

          <span style={{ ...sectionLabel, marginTop: 10 }}>Additional Observations</span>
          <textarea value={r.generalNotes} onChange={e => update('generalNotes', e.target.value)} rows={2}
            placeholder="Any other environmental observations..."
            style={{ ...inputStyle, resize: 'vertical' }} />

          {hasRECs && (
            <div style={{ padding: '8px 10px', backgroundColor: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 2, fontSize: 10, color: '#C0392B', fontFamily: FS }}>
              ⚠ REC indicators present — Phase II ESA strongly recommended. Document with photographs.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
