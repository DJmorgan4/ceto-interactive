'use client';
import { useState } from 'react';

const FS = 'Jost, sans-serif';
const T = { blue: '#2F5D8C', border: 'rgba(17,26,36,0.1)', surface: '#FFFFFF', blueLight: 'rgba(47,93,140,0.06)', muted: 'rgba(17,26,36,0.45)', ink: '#111A24', red: '#C0392B', redLight: 'rgba(192,57,43,0.06)', green: '#27AE60', amber: '#D97706', amberLight: 'rgba(217,119,6,0.06)' };

const BMP_SECTIONS = [
  { section: 'Construction Entrance', items: ['Stabilized construction entrance in place', 'Entrance free of mud/debris tracking', 'Rumble strips or wheel wash present if required'] },
  { section: 'Perimeter Controls', items: ['Silt fence properly installed and entrenched', 'Silt fence free of gaps and tears', 'Silt fence not overtopped or impounded'] },
  { section: 'Inlet Protection', items: ['Inlet protection devices installed at all active inlets', 'Inlet protection devices functional and not clogged', 'Sediment removed from inlet protection'] },
  { section: 'Sediment Controls', items: ['Sediment traps/basins constructed per plan', 'Sediment basin outlet functional', 'Sediment accumulation below 50% capacity'] },
  { section: 'Stockpiles', items: ['All stockpiles protected from erosion', 'Stockpiles located away from waterways', 'Stockpile perimeter controls in place'] },
  { section: 'Concrete Washout', items: ['Concrete washout area properly designated', 'Washout contained and labeled', 'No concrete wash discharging to stormwater'] },
  { section: 'Fuel & Chemical Storage', items: ['Secondary containment in place for fuel/chemicals', 'Containers properly labeled and closed', 'No spills or staining observed'] },
  { section: 'Waste Management', items: ['Waste containers covered and secured', 'No waste or litter outside designated areas', 'Portable toilets stable and not overflowing'] },
  { section: 'Stabilization', items: ['Temporary seeding/mulching on disturbed areas >14 days inactive', 'Permanent stabilization initiated on completed areas', 'Stabilized areas meeting 70% cover standard'] },
  { section: 'Outfalls & Discharge', items: ['All outfall points identified and inspected', 'No visible sediment plumes at discharge', 'Receiving water conditions documented'] },
  { section: 'Tracking', items: ['No excessive mud tracking onto public roads', 'Roads cleaned if tracking observed', 'Vehicle exit points adequate'] },
];

type ItemStatus = 'pass' | 'deficiency' | 'not_applicable' | 'pending';

interface BmpItem {
  item: string; section: string;
  status: ItemStatus;
  notes: string;
  correctiveAction: string;
}

function initItems(): BmpItem[] {
  return BMP_SECTIONS.flatMap(s => s.items.map(item => ({ item, section: s.section, status: 'pending' as ItemStatus, notes: '', correctiveAction: '' })));
}

const STATUS_CONFIG: Record<ItemStatus, { label: string; color: string; bg: string }> = {
  pass: { label: 'Pass', color: '#27AE60', bg: 'rgba(39,174,96,0.08)' },
  deficiency: { label: 'Deficiency', color: '#C0392B', bg: 'rgba(192,57,43,0.08)' },
  not_applicable: { label: 'N/A', color: '#64748B', bg: 'rgba(100,116,139,0.08)' },
  pending: { label: 'Pending', color: '#D97706', bg: 'rgba(217,119,6,0.06)' },
};

export default function SWPPPModule() {
  const [projectName, setProjectName] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [permitNumber, setPermitNumber] = useState('');
  const [rainfallEvent, setRainfallEvent] = useState(false);
  const [rainfallAmount, setRainfallAmount] = useState('');
  const [items, setItems] = useState<BmpItem[]>(initItems());
  const [expandedSection, setExpandedSection] = useState<string | null>(BMP_SECTIONS[0].section);
  const [signature, setSignature] = useState('');

  const updateItem = (idx: number, field: keyof BmpItem, value: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const deficiencies = items.filter(i => i.status === 'deficiency');
  const passed = items.filter(i => i.status === 'pass');
  const pending = items.filter(i => i.status === 'pending');

  const inputStyle = { width: '100%', boxSizing: 'border-box' as const, fontSize: 12, fontFamily: FS, padding: '7px 10px', backgroundColor: 'rgba(17,26,36,0.02)', border: `1px solid ${T.border}`, borderRadius: 2, outline: 'none', color: T.ink };
  const labelStyle = { display: 'block' as const, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: T.muted, marginBottom: 4, fontFamily: FS };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', backgroundColor: T.blueLight, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.blue, fontFamily: FS }}>SWPPP Inspection Report</div>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: FS, marginTop: 2 }}>TCEQ TXR150000 · Construction General Permit · Effective March 5, 2023 · Expires March 5, 2028</div>
        </div>
        <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={labelStyle}>Project Name *</label><input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Site/project name" style={inputStyle} /></div>
          <div><label style={labelStyle}>TPDES Permit # (TXR15...)</label><input value={permitNumber} onChange={e => setPermitNumber(e.target.value)} placeholder="TXR150000 or site-specific" style={inputStyle} /></div>
          <div><label style={labelStyle}>Inspector Name *</label><input value={inspectorName} onChange={e => setInspectorName(e.target.value)} placeholder="Full name + credential" style={inputStyle} /></div>
          <div><label style={labelStyle}>Inspection Date *</label><input type="date" value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} style={{ ...inputStyle, width: 'auto' }} /></div>
          <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div onClick={() => setRainfallEvent(e => !e)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <div style={{ width: 14, height: 14, borderRadius: 2, backgroundColor: rainfallEvent ? T.blue : 'transparent', border: `1.5px solid ${rainfallEvent ? T.blue : T.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {rainfallEvent && <div style={{ color: 'white', fontSize: 9 }}>✓</div>}
              </div>
              <span style={{ fontSize: 12, fontFamily: FS, color: T.ink }}>Rainfall event triggered this inspection</span>
            </div>
            {rainfallEvent && <input value={rainfallAmount} onChange={e => setRainfallAmount(e.target.value)} placeholder="Amount (e.g. 0.5 in)" style={{ ...inputStyle, width: 160 }} />}
          </div>
        </div>
      </div>

      {/* Status summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { label: 'Passing', count: passed.length, color: '#27AE60' },
          { label: 'Deficiencies', count: deficiencies.length, color: '#C0392B' },
          { label: 'Pending', count: pending.length, color: '#D97706' },
          { label: 'Total Items', count: items.length, color: T.blue },
        ].map(s => (
          <div key={s.label} style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: '10px 14px', backgroundColor: T.surface, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, fontFamily: FS }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* BMP checklist */}
      {BMP_SECTIONS.map(section => {
        const sectionItems = items.filter(i => i.section === section.section);
        const sectionDeficiencies = sectionItems.filter(i => i.status === 'deficiency').length;
        const sectionPassed = sectionItems.filter(i => i.status === 'pass').length;
        const isOpen = expandedSection === section.section;

        return (
          <div key={section.section} style={{ border: `1px solid ${sectionDeficiencies > 0 ? 'rgba(192,57,43,0.3)' : T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden' }}>
            <div onClick={() => setExpandedSection(isOpen ? null : section.section)}
              style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: sectionDeficiencies > 0 ? 'rgba(192,57,43,0.04)' : T.blueLight }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 12, color: T.ink, fontFamily: FS, fontWeight: 400 }}>{section.section}</div>
                {sectionDeficiencies > 0 && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 2, backgroundColor: 'rgba(192,57,43,0.1)', color: '#C0392B', fontFamily: FS }}>{sectionDeficiencies} deficiency</span>}
                {sectionDeficiencies === 0 && sectionPassed === sectionItems.length && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 2, backgroundColor: 'rgba(39,174,96,0.1)', color: '#27AE60', fontFamily: FS }}>✓ Complete</span>}
              </div>
              <div style={{ fontSize: 10, color: T.muted, fontFamily: FS }}>{sectionPassed}/{sectionItems.length} · {isOpen ? '▲' : '▼'}</div>
            </div>

            {isOpen && (
              <div style={{ padding: '0 14px 14px' }}>
                {sectionItems.map((item, localIdx) => {
                  const globalIdx = items.indexOf(item);
                  const cfg = STATUS_CONFIG[item.status];
                  return (
                    <div key={item.item} style={{ paddingTop: 12, borderTop: localIdx === 0 ? `1px solid ${T.border}` : 'none', marginTop: localIdx === 0 ? 14 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: item.status === 'deficiency' ? 8 : 0 }}>
                        <div style={{ fontSize: 11, color: T.ink, fontFamily: FS, flex: 1, paddingTop: 1 }}>{item.item}</div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          {(['pass', 'deficiency', 'not_applicable'] as ItemStatus[]).map(s => (
                            <button key={s} onClick={() => updateItem(globalIdx, 'status', s)}
                              style={{ padding: '3px 8px', fontSize: 9, fontFamily: FS, borderRadius: 2, border: `1px solid ${item.status === s ? STATUS_CONFIG[s].color : T.border}`, backgroundColor: item.status === s ? STATUS_CONFIG[s].bg : 'transparent', color: item.status === s ? STATUS_CONFIG[s].color : T.muted, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              {STATUS_CONFIG[s].label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {item.status === 'deficiency' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingLeft: 0 }}>
                          <div>
                            <label style={{ ...labelStyle, fontSize: 8 }}>Deficiency Description</label>
                            <input value={item.notes} onChange={e => updateItem(globalIdx, 'notes', e.target.value)} placeholder="Describe the deficiency" style={{ ...inputStyle, fontSize: 11 }} />
                          </div>
                          <div>
                            <label style={{ ...labelStyle, fontSize: 8 }}>Required Corrective Action</label>
                            <input value={item.correctiveAction} onChange={e => updateItem(globalIdx, 'correctiveAction', e.target.value)} placeholder="Action required + timeframe" style={{ ...inputStyle, fontSize: 11 }} />
                          </div>
                        </div>
                      )}
                      {item.status === 'pass' && (
                        <input value={item.notes} onChange={e => updateItem(globalIdx, 'notes', e.target.value)} placeholder="Optional note" style={{ ...inputStyle, fontSize: 11, marginTop: 4 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Deficiency summary */}
      {deficiencies.length > 0 && (
        <div style={{ border: `1px solid rgba(192,57,43,0.3)`, borderRadius: 4, backgroundColor: 'rgba(192,57,43,0.04)', padding: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C0392B', fontFamily: FS, marginBottom: 10 }}>Deficiency Summary — {deficiencies.length} Item{deficiencies.length > 1 ? 's' : ''} Require Corrective Action</div>
          {deficiencies.map((d, i) => (
            <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < deficiencies.length - 1 ? `1px solid rgba(192,57,43,0.15)` : 'none' }}>
              <div style={{ fontSize: 11, color: T.ink, fontFamily: FS, fontWeight: 400 }}>{d.section} — {d.item}</div>
              {d.notes && <div style={{ fontSize: 10, color: '#C0392B', fontFamily: FS, marginTop: 2 }}>Issue: {d.notes}</div>}
              {d.correctiveAction && <div style={{ fontSize: 10, color: T.muted, fontFamily: FS, marginTop: 1 }}>Action: {d.correctiveAction}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Signature */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, fontFamily: FS, marginBottom: 10 }}>Inspector Certification</div>
        <div style={{ fontSize: 11, color: T.muted, fontFamily: FS, lineHeight: 1.6, marginBottom: 10 }}>
          I certify that this inspection was conducted in accordance with TCEQ Construction General Permit TXR150000 requirements and that the information recorded herein is accurate and complete to the best of my knowledge.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={labelStyle}>Printed Name / Credential</label><input value={signature} onChange={e => setSignature(e.target.value)} placeholder="Name, EP / CPSWPPP / CESSWI" style={inputStyle} /></div>
          <div><label style={labelStyle}>Date Signed</label><input type="date" value={inspectionDate} readOnly style={{ ...inputStyle, backgroundColor: 'rgba(17,26,36,0.04)' }} /></div>
        </div>
      </div>

      {/* Export */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => {
            const content = [
              `SWPPP INSPECTION REPORT — TCEQ TXR150000`,
              `Project: ${projectName} | Inspector: ${inspectorName} | Date: ${inspectionDate}`,
              `Permit: ${permitNumber || 'TXR150000'} | Rainfall Event: ${rainfallEvent ? 'Yes (' + rainfallAmount + ')' : 'No'}`,
              '',
              `SUMMARY: ${passed.length} Pass | ${deficiencies.length} Deficiencies | ${pending.length} Pending`,
              '',
              ...BMP_SECTIONS.map(s => {
                const sItems = items.filter(i => i.section === s.section);
                return [
                  `\n${s.section.toUpperCase()}`,
                  ...sItems.map(i => `  [${i.status.toUpperCase()}] ${i.item}${i.notes ? ' — ' + i.notes : ''}${i.correctiveAction ? ' | Action: ' + i.correctiveAction : ''}`),
                ].join('\n');
              }),
              '',
              deficiencies.length > 0 ? `\nDEFICIENCIES REQUIRING CORRECTIVE ACTION:\n${deficiencies.map(d => `- ${d.section}: ${d.item}\n  Issue: ${d.notes}\n  Action: ${d.correctiveAction}`).join('\n')}` : 'No deficiencies identified.',
              '',
              `CERTIFICATION: ${signature} — ${inspectionDate}`,
            ].join('\n');

            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `SWPPP_Inspection_${projectName.replace(/\s+/g, '_')}_${inspectionDate}.txt`;
            a.click(); URL.revokeObjectURL(url);
          }}
          style={{ padding: '10px 20px', backgroundColor: T.blue, color: 'white', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: FS }}
        >
          Export Report
        </button>
        <div style={{ fontSize: 10, color: T.muted, fontFamily: FS, display: 'flex', alignItems: 'center' }}>
          TXR150000 compliant · {deficiencies.length > 0 ? `${deficiencies.length} corrective action(s) required` : 'No deficiencies — site compliant'}
        </div>
      </div>
    </div>
  );
}
