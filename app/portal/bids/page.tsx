'use client';
import { useState } from 'react';

const BLUE = '#2F5D8C';
const INK = '#111A24';
const MUTED = 'rgba(17,26,36,0.45)';
const BORDER = 'rgba(17,26,36,0.1)';
const SURFACE = '#FAFBFC';
const FS = 'Jost, sans-serif';
const T = { blue: BLUE, ink: INK, muted: MUTED, border: BORDER, green: '#27AE60', amber: '#B45309', red: '#C0392B' };

const inp = { width: '100%', boxSizing: 'border-box' as const, fontSize: 13, fontFamily: FS, fontWeight: 300, padding: '9px 12px', backgroundColor: 'rgba(17,26,36,0.02)', border: `1px solid ${BORDER}`, borderRadius: 2, outline: 'none', color: INK };
const lbl = { display: 'block' as const, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: MUTED, fontFamily: FS, marginBottom: 5 };

type ClientType = 'government_federal' | 'government_state' | 'government_municipal' | 'real_estate_developer' | 'engineering_firm' | 'legal' | 'financial' | 'private_landowner' | 'nonprofit' | 'other';
type BidStatus = 'tracking' | 'in_progress' | 'submitted' | 'won' | 'lost' | 'no_bid';

interface Bid {
  id: string;
  projectName: string;
  clientName: string;
  clientType: ClientType;
  rfqNumber: string;
  dueDate: string;
  estimatedValue: string;
  serviceType: string;
  status: BidStatus;
  rfqText: string;
  astraAnalysis: AstraAnalysis | null;
  notes: string;
  createdAt: string;
}

interface AstraAnalysis {
  summary: string;
  clientType: string;
  scopeOfWork: string[];
  keyRequirements: string[];
  cetoAdvantages: string[];
  risks: string[];
  gameplan: string[];
  estimatedHours: string;
  recommendedFee: string;
  goNoGo: 'GO' | 'CONDITIONAL' | 'NO-BID';
  goNoGoReason: string;
  deliverables: string[];
  winThemes: string[];
}

const CLIENT_TYPES: { value: ClientType; label: string }[] = [
  { value: 'government_federal', label: 'Federal Government' },
  { value: 'government_state', label: 'State Government' },
  { value: 'government_municipal', label: 'City / Municipality' },
  { value: 'real_estate_developer', label: 'Real Estate Developer' },
  { value: 'engineering_firm', label: 'Engineering / Architecture Firm' },
  { value: 'legal', label: 'Legal / Law Firm' },
  { value: 'financial', label: 'Bank / Lender / Financial' },
  { value: 'private_landowner', label: 'Private Landowner' },
  { value: 'nonprofit', label: 'Nonprofit / Foundation' },
  { value: 'other', label: 'Other' },
];

const SERVICE_TYPES = [
  'Phase I ESA', 'Phase II ESA', 'SWPPP', 'Wetland Delineation',
  'Environmental Due Diligence', 'NEPA Review', 'Remediation Assessment',
  'LithicEarth Geospatial Analysis', 'Multi-service / IDIQ', 'Other'
];

const STATUS_COLORS: Record<BidStatus, string> = {
  tracking: '#64748B', in_progress: BLUE, submitted: '#B45309',
  won: '#27AE60', lost: '#C0392B', no_bid: MUTED,
};

export default function BidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  const [activeBid, setActiveBid] = useState<Bid | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // New bid form state
  const [form, setForm] = useState({
    projectName: '', clientName: '', clientType: 'government_municipal' as ClientType,
    rfqNumber: '', dueDate: '', estimatedValue: '', serviceType: 'Phase I ESA',
    rfqText: '', notes: '',
  });

  const updateForm = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const createBid = () => {
    const bid: Bid = {
      id: Date.now().toString(),
      ...form,
      status: 'tracking',
      astraAnalysis: null,
      createdAt: new Date().toISOString(),
    };
    setBids(p => [bid, ...p]);
    setActiveBid(bid);
    setView('detail');
    setForm({ projectName: '', clientName: '', clientType: 'government_municipal', rfqNumber: '', dueDate: '', estimatedValue: '', serviceType: 'Phase I ESA', rfqText: '', notes: '' });
  };

  const updateBid = (id: string, updates: Partial<Bid>) => {
    setBids(p => p.map(b => b.id === id ? { ...b, ...updates } : b));
    if (activeBid?.id === id) setActiveBid(p => p ? { ...p, ...updates } : p);
  };

  const runAstra = async (bid: Bid) => {
    if (!bid.rfqText || bid.rfqText.length < 50) {
      alert('Paste the RFQ / opportunity text first — ASTRA needs the source document to analyze.');
      return;
    }
    setAnalyzing(true);
    try {
      const clientLabel = CLIENT_TYPES.find(c => c.value === bid.clientType)?.label || bid.clientType;
      const query = `You are analyzing a government or commercial bid opportunity for Ceto Interactive Environmental Consulting, a Texas-based EP-credentialed firm specializing in Phase I ESA, SWPPP, wetland delineation, and LithicEarth geospatial intelligence.

CLIENT: ${bid.clientName} (${clientLabel})
RFQ/OPPORTUNITY NUMBER: ${bid.rfqNumber || 'Not specified'}
SERVICE TYPE: ${bid.serviceType}
DUE DATE: ${bid.dueDate || 'Not specified'}
ESTIMATED VALUE: ${bid.estimatedValue || 'Not specified'}

RFQ / OPPORTUNITY TEXT:
${bid.rfqText.slice(0, 8000)}

Analyze this opportunity and return ONLY valid JSON (no markdown, no preamble):
{
  "summary": "2-3 sentence plain English summary of what they want",
  "clientType": "plain English description of who this client is and what they care about",
  "scopeOfWork": ["specific deliverable 1", "specific deliverable 2"],
  "keyRequirements": ["requirement 1", "requirement 2"],
  "cetoAdvantages": ["why Ceto is well positioned for this specific bid"],
  "risks": ["risk 1", "risk 2"],
  "gameplan": ["step 1: do this first", "step 2: do this next"],
  "estimatedHours": "estimated hours range",
  "recommendedFee": "recommended fee range based on scope",
  "goNoGo": "GO or CONDITIONAL or NO-BID",
  "goNoGoReason": "one sentence explanation of go/no-go recommendation",
  "deliverables": ["deliverable 1", "deliverable 2"],
  "winThemes": ["theme 1: what to emphasize in the proposal"]
}`;

      const res = await fetch('https://astarte-works.vercel.app/api/astra/core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, source: 'ceto-bids', domain: 'business_compliance' }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      const raw = data.response || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis: AstraAnalysis = JSON.parse(jsonMatch[0]);
        updateBid(bid.id, { astraAnalysis: analysis });
      }
    } catch (e) {
      alert('ASTRA analysis failed: ' + String(e));
    }
    setAnalyzing(false);
  };

  const daysUntil = (date: string) => {
    if (!date) return null;
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    return diff;
  };

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (view === 'list') return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, fontFamily: FS }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', color: MUTED, marginBottom: 4 }}>CETO INTERACTIVE</div>
          <div style={{ fontSize: 24, fontWeight: 300, color: INK }}>Bid Pipeline</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Opportunity tracking · ASTRA analysis · Proposal support</div>
        </div>
        <button onClick={() => setView('new')} style={{ padding: '10px 20px', backgroundColor: BLUE, color: '#fff', border: 'none', borderRadius: 2, fontSize: 12, fontFamily: FS, cursor: 'pointer', letterSpacing: '0.05em' }}>+ New Opportunity</button>
      </div>

      {/* Stats */}
      {bids.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, backgroundColor: BORDER, marginBottom: 24 }}>
          {[
            { label: 'TRACKING', value: bids.filter(b => b.status === 'tracking').length, color: '#64748B' },
            { label: 'IN PROGRESS', value: bids.filter(b => b.status === 'in_progress').length, color: BLUE },
            { label: 'SUBMITTED', value: bids.filter(b => b.status === 'submitted').length, color: T.amber },
            { label: 'WON', value: bids.filter(b => b.status === 'won').length, color: T.green },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#fff', padding: '14px 18px' }}>
              <div style={{ fontSize: 8, letterSpacing: '0.2em', color: MUTED, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 300, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {bids.length === 0 ? (
        <div style={{ border: `1px dashed ${BORDER}`, borderRadius: 2, padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>No opportunities tracked yet</div>
          <button onClick={() => setView('new')} style={{ fontSize: 12, color: BLUE, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FS }}>Add your first bid →</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, backgroundColor: BORDER }}>
          {bids.map(bid => {
            const days = daysUntil(bid.dueDate);
            return (
              <div key={bid.id} onClick={() => { setActiveBid(bid); setView('detail'); }}
                style={{ backgroundColor: '#fff', padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: INK, marginBottom: 2 }}>{bid.projectName}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>{bid.clientName} · {bid.serviceType} {bid.rfqNumber ? `· ${bid.rfqNumber}` : ''}</div>
                </div>
                {bid.astraAnalysis && (
                  <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 2, backgroundColor: bid.astraAnalysis.goNoGo === 'GO' ? 'rgba(39,174,96,0.1)' : bid.astraAnalysis.goNoGo === 'NO-BID' ? 'rgba(192,57,43,0.1)' : 'rgba(180,83,9,0.1)', color: bid.astraAnalysis.goNoGo === 'GO' ? T.green : bid.astraAnalysis.goNoGo === 'NO-BID' ? T.red : T.amber }}>
                    {bid.astraAnalysis.goNoGo}
                  </div>
                )}
                {days !== null && (
                  <div style={{ fontSize: 11, color: days <= 7 ? T.red : days <= 14 ? T.amber : MUTED, minWidth: 60, textAlign: 'right' }}>
                    {days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `${days}d left`}
                  </div>
                )}
                <div style={{ fontSize: 10, padding: '3px 8px', borderRadius: 2, backgroundColor: `${STATUS_COLORS[bid.status]}18`, color: STATUS_COLORS[bid.status], letterSpacing: '0.08em' }}>
                  {bid.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── NEW BID FORM ───────────────────────────────────────────────────────────
  if (view === 'new') return (
    <div style={{ padding: '32px 40px', maxWidth: 800, fontFamily: FS }}>
      <button onClick={() => setView('list')} style={{ fontSize: 11, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FS, marginBottom: 20 }}>← Back to pipeline</button>
      <div style={{ fontSize: 20, fontWeight: 300, color: INK, marginBottom: 24 }}>New Opportunity</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={lbl}>Project / Opportunity Name *</label>
          <input value={form.projectName} onChange={e => updateForm('projectName', e.target.value)} placeholder="e.g. Fort Worth RFQ 26-0191 Phase I ESA" style={inp} />
        </div>
        <div>
          <label style={lbl}>Client / Agency Name *</label>
          <input value={form.clientName} onChange={e => updateForm('clientName', e.target.value)} placeholder="e.g. City of Fort Worth" style={inp} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>Client Type</label>
        <select value={form.clientType} onChange={e => updateForm('clientType', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
          {CLIENT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={lbl}>RFQ / Solicitation Number</label>
          <input value={form.rfqNumber} onChange={e => updateForm('rfqNumber', e.target.value)} placeholder="e.g. RFQ 26-0191" style={inp} />
        </div>
        <div>
          <label style={lbl}>Due Date</label>
          <input type="date" value={form.dueDate} onChange={e => updateForm('dueDate', e.target.value)} style={inp} />
        </div>
        <div>
          <label style={lbl}>Estimated Value</label>
          <input value={form.estimatedValue} onChange={e => updateForm('estimatedValue', e.target.value)} placeholder="e.g. $4,500 or $15k–25k" style={inp} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>Primary Service Type</label>
        <select value={form.serviceType} onChange={e => updateForm('serviceType', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
          {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>RFQ / Opportunity Text — Paste the full solicitation, scope, or opportunity description</label>
        <textarea value={form.rfqText} onChange={e => updateForm('rfqText', e.target.value)} rows={10}
          placeholder="Paste the full RFQ text, scope of work, solicitation description, or any relevant details from the bid document here. ASTRA will analyze this to build your gameplan."
          style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={lbl}>Notes</label>
        <textarea value={form.notes} onChange={e => updateForm('notes', e.target.value)} rows={3}
          placeholder="Internal notes, contacts, context..."
          style={{ ...inp, resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setView('list')} style={{ padding: '10px 20px', backgroundColor: '#fff', border: `1px solid ${BORDER}`, borderRadius: 2, fontSize: 12, fontFamily: FS, cursor: 'pointer', color: INK }}>Cancel</button>
        <button onClick={createBid} disabled={!form.projectName || !form.clientName}
          style={{ padding: '10px 24px', backgroundColor: form.projectName && form.clientName ? BLUE : MUTED, color: '#fff', border: 'none', borderRadius: 2, fontSize: 12, fontFamily: FS, cursor: form.projectName && form.clientName ? 'pointer' : 'not-allowed' }}>
          Save Opportunity →
        </button>
      </div>
    </div>
  );

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (view === 'detail' && activeBid) {
    const bid = bids.find(b => b.id === activeBid.id) || activeBid;
    const days = daysUntil(bid.dueDate);
    const a = bid.astraAnalysis;

    return (
      <div style={{ padding: '28px 40px', maxWidth: 1100, fontFamily: FS }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button onClick={() => setView('list')} style={{ fontSize: 11, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FS }}>← Pipeline</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 400, color: INK }}>{bid.projectName}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{bid.clientName} · {bid.serviceType} {bid.rfqNumber ? `· ${bid.rfqNumber}` : ''}</div>
          </div>
          {days !== null && (
            <div style={{ fontSize: 12, color: days <= 7 ? T.red : days <= 14 ? T.amber : MUTED }}>
              {days < 0 ? '⚠ Overdue' : `${days} days left`}
            </div>
          )}
          <select value={bid.status} onChange={e => updateBid(bid.id, { status: e.target.value as BidStatus })}
            style={{ fontSize: 11, fontFamily: FS, padding: '6px 10px', border: `1px solid ${BORDER}`, borderRadius: 2, backgroundColor: '#fff', color: STATUS_COLORS[bid.status], cursor: 'pointer' }}>
            {(['tracking','in_progress','submitted','won','lost','no_bid'] as BidStatus[]).map(s => (
              <option key={s} value={s}>{s.replace('_',' ').toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* LEFT — RFQ input + editable fields */}
          <div>
            <div style={{ fontSize: 8, letterSpacing: '0.2em', color: MUTED, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>OPPORTUNITY DETAILS</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'Client', value: bid.clientName },
                { label: 'Type', value: CLIENT_TYPES.find(c => c.value === bid.clientType)?.label || '' },
                { label: 'Due Date', value: bid.dueDate },
                { label: 'Est. Value', value: bid.estimatedValue || '—' },
              ].map(f => (
                <div key={f.label} style={{ backgroundColor: SURFACE, padding: '10px 12px', borderRadius: 2, border: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 8, letterSpacing: '0.15em', color: MUTED, marginBottom: 3 }}>{f.label.toUpperCase()}</div>
                  <div style={{ fontSize: 12, color: INK }}>{f.value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>RFQ / Opportunity Text</label>
              <textarea value={bid.rfqText} onChange={e => updateBid(bid.id, { rfqText: e.target.value })} rows={12}
                placeholder="Paste full RFQ text here for ASTRA analysis..."
                style={{ ...inp, resize: 'vertical', lineHeight: 1.7, fontSize: 12 }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Notes</label>
              <textarea value={bid.notes} onChange={e => updateBid(bid.id, { notes: e.target.value })} rows={3}
                style={{ ...inp, resize: 'vertical', fontSize: 12 }} />
            </div>

            <button onClick={() => runAstra(bid)} disabled={analyzing}
              style={{ width: '100%', padding: '12px', backgroundColor: analyzing ? MUTED : BLUE, color: '#fff', border: 'none', borderRadius: 2, fontSize: 13, fontFamily: FS, cursor: analyzing ? 'not-allowed' : 'pointer', letterSpacing: '0.05em' }}>
              {analyzing ? 'ASTRA analyzing...' : a ? '↺ Re-run ASTRA Analysis' : '⚡ Run ASTRA Analysis'}
            </button>
            {!bid.rfqText && <div style={{ fontSize: 10, color: T.amber, marginTop: 6, textAlign: 'center' }}>Paste RFQ text above before running ASTRA</div>}
          </div>

          {/* RIGHT — ASTRA analysis */}
          <div>
            <div style={{ fontSize: 8, letterSpacing: '0.2em', color: MUTED, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>ASTRA ANALYSIS</div>

            {analyzing && (
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 2, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: BLUE, fontFamily: FS, marginBottom: 8 }}>ASTRA reading opportunity...</div>
                <div style={{ fontSize: 11, color: MUTED }}>Analyzing scope, requirements, and win strategy</div>
              </div>
            )}

            {!a && !analyzing && (
              <div style={{ border: `1px dashed ${BORDER}`, borderRadius: 2, padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>No analysis yet</div>
                <div style={{ fontSize: 11, color: MUTED }}>Paste the RFQ text and run ASTRA to get a full breakdown, gameplan, and go/no-go recommendation</div>
              </div>
            )}

            {a && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Go/No-Go */}
                <div style={{ padding: '14px 16px', backgroundColor: a.goNoGo === 'GO' ? 'rgba(39,174,96,0.06)' : a.goNoGo === 'NO-BID' ? 'rgba(192,57,43,0.06)' : 'rgba(180,83,9,0.06)', border: `1px solid ${a.goNoGo === 'GO' ? 'rgba(39,174,96,0.25)' : a.goNoGo === 'NO-BID' ? 'rgba(192,57,43,0.25)' : 'rgba(180,83,9,0.25)'}`, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: a.goNoGo === 'GO' ? T.green : a.goNoGo === 'NO-BID' ? T.red : T.amber }}>{a.goNoGo}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.15em', color: MUTED, marginBottom: 2 }}>ASTRA RECOMMENDATION</div>
                    <div style={{ fontSize: 11, color: INK }}>{a.goNoGoReason}</div>
                  </div>
                  {a.recommendedFee && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 8, letterSpacing: '0.15em', color: MUTED, marginBottom: 2 }}>FEE RANGE</div>
                      <div style={{ fontSize: 12, color: INK, fontWeight: 500 }}>{a.recommendedFee}</div>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 2, padding: '12px 14px' }}>
                  <div style={{ fontSize: 8, letterSpacing: '0.15em', color: MUTED, marginBottom: 6 }}>SUMMARY</div>
                  <div style={{ fontSize: 12, color: INK, lineHeight: 1.7 }}>{a.summary}</div>
                  {a.clientType && <div style={{ fontSize: 11, color: MUTED, marginTop: 6, lineHeight: 1.6 }}>{a.clientType}</div>}
                </div>

                {/* Gameplan */}
                {a.gameplan?.length > 0 && (
                  <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 2, padding: '12px 14px' }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.15em', color: MUTED, marginBottom: 8 }}>GAMEPLAN</div>
                    {a.gameplan.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                        <div style={{ fontSize: 10, color: BLUE, fontWeight: 600, minWidth: 18 }}>{i + 1}</div>
                        <div style={{ fontSize: 11, color: INK, lineHeight: 1.6 }}>{step.replace(/^step\s*\d+:\s*/i, '')}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Key Requirements */}
                {a.keyRequirements?.length > 0 && (
                  <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 2, padding: '12px 14px' }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.15em', color: MUTED, marginBottom: 8 }}>KEY REQUIREMENTS</div>
                    {a.keyRequirements.map((r, i) => <div key={i} style={{ fontSize: 11, color: INK, marginBottom: 4, paddingLeft: 10, borderLeft: `2px solid ${BLUE}` }}>{r}</div>)}
                  </div>
                )}

                {/* Win Themes */}
                {a.winThemes?.length > 0 && (
                  <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 2, padding: '12px 14px' }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.15em', color: MUTED, marginBottom: 8 }}>WIN THEMES</div>
                    {a.winThemes.map((t, i) => <div key={i} style={{ fontSize: 11, color: INK, marginBottom: 4, lineHeight: 1.6 }}>→ {t}</div>)}
                  </div>
                )}

                {/* Ceto Advantages */}
                {a.cetoAdvantages?.length > 0 && (
                  <div style={{ backgroundColor: 'rgba(39,174,96,0.04)', border: `1px solid rgba(39,174,96,0.2)`, borderRadius: 2, padding: '12px 14px' }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.15em', color: T.green, marginBottom: 8 }}>CETO ADVANTAGES</div>
                    {a.cetoAdvantages.map((adv, i) => <div key={i} style={{ fontSize: 11, color: INK, marginBottom: 4 }}>✓ {adv}</div>)}
                  </div>
                )}

                {/* Risks */}
                {a.risks?.length > 0 && (
                  <div style={{ backgroundColor: 'rgba(192,57,43,0.04)', border: `1px solid rgba(192,57,43,0.15)`, borderRadius: 2, padding: '12px 14px' }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.15em', color: T.red, marginBottom: 8 }}>RISKS</div>
                    {a.risks.map((r, i) => <div key={i} style={{ fontSize: 11, color: INK, marginBottom: 4 }}>⚠ {r}</div>)}
                  </div>
                )}

                {/* Deliverables */}
                {a.deliverables?.length > 0 && (
                  <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 2, padding: '12px 14px' }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.15em', color: MUTED, marginBottom: 8 }}>DELIVERABLES</div>
                    {a.deliverables.map((d, i) => <div key={i} style={{ fontSize: 11, color: INK, marginBottom: 3 }}>• {d}</div>)}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
