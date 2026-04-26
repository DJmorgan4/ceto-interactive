'use client';

import { computeCetoScore, deriveScoreInput, ScoreOutput } from '@/lib/cetoScore';

const T = {
  green: '#2D6A4F', greenLight: 'rgba(45,106,79,0.10)',
  amber: '#8C5E1A', amberLight: 'rgba(140,94,26,0.10)',
  red: '#B43C28', redLight: 'rgba(180,60,40,0.10)',
  blue: '#1E4976',
  ink: '#111A24', muted: 'rgba(17,26,36,0.42)',
  border: 'rgba(17,26,36,0.11)', surface: 'rgba(255,255,255,0.92)',
};
const FONT_SANS = "'Jost', sans-serif";
const FONT_SERIF = "'Cormorant Garamond', Georgia, serif";

function riskColor(code: string) {
  return code === 'LOW' ? T.green : code === 'MODERATE_LOW' ? '#4A7A5A' : code === 'MODERATE' ? T.amber : T.red;
}
function riskBg(code: string) {
  return code === 'LOW' ? T.greenLight : code === 'MODERATE_LOW' ? 'rgba(74,122,90,0.10)' : code === 'MODERATE' ? T.amberLight : T.redLight;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CetoScorePanel({ reg, fieldNotes }: { reg: any; fieldNotes: string }) {
  if (!reg) return null;
  const input = deriveScoreInput(reg, fieldNotes);
  const score: ScoreOutput = computeCetoScore(input);
  const rc = score.ratingCode;

  const categories = [
    { label: 'Regulatory', raw: score.breakdown.regulatory, weight: 25 },
    { label: 'Historical Use', raw: score.breakdown.historical, weight: 15 },
    { label: 'Wetland / Water', raw: score.breakdown.wetland, weight: 15 },
    { label: 'Flood', raw: score.breakdown.flood, weight: 10 },
    { label: 'Soil / Geology', raw: score.breakdown.soil, weight: 15 },
    { label: 'Field Observations', raw: score.breakdown.field, weight: 10 },
    { label: 'Data Gaps', raw: score.breakdown.dataGap, weight: 10 },
  ];

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ background: 'linear-gradient(135deg, #111A24 0%, #1E4976 100%)', padding: '18px 20px', color: 'white' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontFamily: FONT_SANS, marginBottom: 10 }}>
          CETO Environmental Risk Score
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 56, fontFamily: FONT_SERIF, fontWeight: 300, lineHeight: 1 }}>{score.finalScore}</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}>/100</div>
            <div style={{ fontSize: 10, letterSpacing: '0.10em', fontFamily: FONT_SANS, marginTop: 6, padding: '4px 12px', borderRadius: 2, backgroundColor: riskBg(rc), color: riskColor(rc), display: 'inline-block' }}>
              {score.rating.toUpperCase()}
            </div>
          </div>
        </div>
        <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ height: '100%', width: `${score.finalScore}%`, backgroundColor: rc === 'LOW' ? '#6FCF97' : rc === 'MODERATE_LOW' ? '#A8D5A2' : rc === 'MODERATE' ? '#F2C94C' : rc === 'ELEVATED' ? '#F2994A' : '#EB5757', borderRadius: 2 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Raw Score', value: score.rawScore },
            { label: 'Confidence ×', value: score.confidenceMultiplier + 'x' },
            { label: 'Severity ×', value: score.severityMultiplier + 'x' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, padding: '6px 8px' }}>
              <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)', fontFamily: FONT_SANS, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 14, color: 'white', fontFamily: FONT_SANS, fontWeight: 300 }}>{s.value}</div>
            </div>
          ))}
        </div>
        {score.ceiling < 100 && (
          <div style={{ marginTop: 8, padding: '6px 10px', backgroundColor: 'rgba(235,87,87,0.15)', borderRadius: 2, fontSize: 10, color: '#F8BCBC', fontFamily: FONT_SANS }}>
            ⚠ Score ceiling applied: max {score.ceiling}/100 — red flag override
          </div>
        )}
      </div>

      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, fontFamily: FONT_SANS, marginBottom: 10 }}>Risk Breakdown (weighted)</div>
        {categories.map(cat => {
          const catRc = cat.raw > 60 ? 'HIGH' : cat.raw > 30 ? 'MODERATE' : 'LOW';
          return (
            <div key={cat.label} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: T.ink, fontFamily: FONT_SANS, fontWeight: 300 }}>
                  {cat.label} <span style={{ color: T.muted, fontSize: 9 }}>({cat.weight}%)</span>
                </span>
                <span style={{ fontSize: 11, fontFamily: FONT_SANS, color: riskColor(catRc) }}>{cat.raw} risk</span>
              </div>
              <div style={{ height: 3, backgroundColor: 'rgba(17,26,36,0.08)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${cat.raw}%`, backgroundColor: riskColor(catRc), borderRadius: 1 }} />
              </div>
            </div>
          );
        })}
      </div>

      {score.redFlags.length > 0 && (
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.redLight }}>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.red, fontFamily: FONT_SANS, marginBottom: 6 }}>
            Red Flags ({score.redFlags.length})
          </div>
          {score.redFlags.map((f, i) => (
            <div key={i} style={{ fontSize: 11, color: T.red, fontFamily: FONT_SANS, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: T.red, flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '12px 18px' }}>
        <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT_SANS, lineHeight: 1.6, marginBottom: 8 }}>
          <strong style={{ color: T.ink, fontWeight: 400 }}>Basis: </strong>{score.reason}
        </div>
        <div style={{ padding: '8px 12px', backgroundColor: riskBg(rc), borderRadius: 2, fontSize: 11, color: riskColor(rc), fontFamily: FONT_SANS, lineHeight: 1.5 }}>
          <strong style={{ fontWeight: 400 }}>Recommended Action: </strong>{score.recommendedAction}
        </div>
      </div>
    </div>
  );
}
