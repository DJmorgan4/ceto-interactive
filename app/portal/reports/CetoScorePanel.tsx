'use client';

import { computeCetoScore, deriveScoreInput, ScoreOutput } from '@/lib/cetoScore';

const T = {
  green: '#2D6A4F', greenLight: 'rgba(45,106,79,0.10)',
  amber: '#8C5E1A', amberLight: 'rgba(140,94,26,0.10)',
  red: '#B43C28', redLight: 'rgba(180,60,40,0.10)',
  blue: '#1E4976', blueLight: 'rgba(30,73,118,0.08)',
  ink: '#111A24', muted: 'rgba(17,26,36,0.42)',
  border: 'rgba(17,26,36,0.11)', surface: 'rgba(255,255,255,0.92)',
};
const FS = "'Jost', sans-serif";
const FF = "'Cormorant Garamond', Georgia, serif";

function rc(code: string) {
  return code === 'LOW' ? T.green : code === 'MODERATE_LOW' ? '#4A7A5A' : code === 'MODERATE' ? T.amber : T.red;
}
function rb(code: string) {
  return code === 'LOW' ? T.greenLight : code === 'MODERATE_LOW' ? 'rgba(74,122,90,0.10)' : code === 'MODERATE' ? T.amberLight : T.redLight;
}

// FIX 4: Confidence badge with source
function ConfBadge({ confidence, source }: { confidence: string; source?: string }) {
  const cfg = confidence === 'VERIFIED'
    ? { label: '✓ Verified', color: T.green, bg: T.greenLight }
    : confidence === 'INFERRED'
    ? { label: '~ Inferred', color: T.amber, bg: T.amberLight }
    : { label: '⚠ Unverified', color: T.red, bg: T.redLight };
  return (
    <span title={source || ''} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 2, backgroundColor: cfg.bg, color: cfg.color, fontFamily: FS, letterSpacing: '0.08em', cursor: source ? 'help' : 'default' }}>
      {cfg.label}{source ? ` · ${source.split(' ').slice(0,3).join(' ')}` : ''}
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CetoScorePanel({ reg, parcelData, fieldNotes }: { reg: any; parcelData: any; fieldNotes: string }) {
  if (!reg) return null;
  const input = deriveScoreInput(reg, parcelData, fieldNotes);
  const score: ScoreOutput = computeCetoScore(input);
  const rCode = score.ratingCode;

  const categories = [
    { label: 'Regulatory',       raw: score.breakdown.regulatory,   weight: 25 },
    { label: 'Historical Use',   raw: score.breakdown.historicalUse, weight: 12 },
    { label: 'Current Use',      raw: score.breakdown.currentUse,    weight: 13 },
    { label: 'Wetland / Water',  raw: score.breakdown.wetland,       weight: 15 },
    { label: 'Flood',            raw: score.breakdown.flood,         weight: 10 },
    { label: 'Soil / Geology',   raw: score.breakdown.soil,          weight: 15 },
    { label: 'Field Obs.',       raw: score.breakdown.field,         weight: 10 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Score header ── */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #111A24 0%, #1E4976 100%)', padding: '16px 18px', color: 'white' }}>
          <div style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', fontFamily: FS, marginBottom: 10 }}>
            CETO Environmental Risk Score
          </div>

          {/* Score + rating */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 52, fontFamily: FF, fontWeight: 300, lineHeight: 1 }}>{score.finalScore}</div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)' }}>/100</div>
              <div style={{ fontSize: 9, letterSpacing: '0.10em', fontFamily: FS, marginTop: 4, padding: '3px 10px', borderRadius: 2, backgroundColor: rb(rCode), color: rc(rCode), display: 'inline-block' }}>
                {score.rating.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Score bar */}
          <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', width: `${score.finalScore}%`, backgroundColor: rCode === 'LOW' ? '#6FCF97' : rCode === 'MODERATE_LOW' ? '#A8D5A2' : rCode === 'MODERATE' ? '#F2C94C' : rCode === 'ELEVATED' ? '#F2994A' : '#EB5757', borderRadius: 2 }} />
          </div>

          {/* Score metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
            {[
              { l: 'Raw Risk', v: score.rawRiskScore + '/100' },
              { l: 'Confidence ×', v: score.confidenceMultiplier + 'x' },
              { l: 'Severity ×', v: score.severityMultiplier + 'x' },
            ].map(s => (
              <div key={s.l} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, padding: '5px 7px' }}>
                <div style={{ fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', fontFamily: FS, marginBottom: 2 }}>{s.l}</div>
                <div style={{ fontSize: 13, color: 'white', fontFamily: FS, fontWeight: 300 }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* FIX 4: Site class + current use with confidence tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)', fontFamily: FS }}>Site Classification</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, color: 'white', fontFamily: FS }}>{score.siteClass}</span>
                <ConfBadge confidence={score.siteClassConfidence} source={score.siteClassSource} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)', fontFamily: FS }}>Current Use</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, color: 'white', fontFamily: FS }}>{input.currentUse.value.toUpperCase()}</span>
                <ConfBadge confidence={score.currentUseConfidence} source={score.currentUseSource} />
              </div>
            </div>
            {/* FIX 5: Show confidence note when penalty applied */}
            {score.currentUseNote && (
              <div style={{ fontSize: 8, color: 'rgba(255,193,100,0.80)', fontFamily: FS, fontStyle: 'italic', paddingTop: 2 }}>
                ⚠ {score.currentUseNote}
              </div>
            )}
          </div>

          {score.ceiling < 100 && (
            <div style={{ marginTop: 8, padding: '5px 8px', backgroundColor: 'rgba(235,87,87,0.15)', borderRadius: 2, fontSize: 9, color: '#F8BCBC', fontFamily: FS }}>
              ⚠ Hard ceiling: max {score.ceiling}/100 — {score.redFlags[0]}
            </div>
          )}
        </div>

        {/* Risk breakdown bars */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, fontFamily: FS, marginBottom: 8 }}>Risk Breakdown (weighted)</div>
          {categories.map(cat => {
            const barColor = cat.raw > 60 ? T.red : cat.raw > 30 ? T.amber : T.green;
            return (
              <div key={cat.label} style={{ marginBottom: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: T.ink, fontFamily: FS, fontWeight: 300 }}>
                    {cat.label} <span style={{ color: T.muted, fontSize: 8 }}>({cat.weight}%)</span>
                  </span>
                  <span style={{ fontSize: 10, fontFamily: FS, color: barColor }}>{cat.raw}</span>
                </div>
                <div style={{ height: 3, backgroundColor: 'rgba(17,26,36,0.08)', borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cat.raw}%`, backgroundColor: barColor, borderRadius: 1 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FIX 1: Score explanations with traced sources rendered ── */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.blueLight }}>
          <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.blue, fontFamily: FS }}>Score Explanation</div>
        </div>
        <div style={{ padding: '8px 16px' }}>
          {score.explanations.map((e, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '7px 0',
              borderBottom: i < score.explanations.length - 1 ? `1px solid ${T.border}` : 'none',
              opacity: e.sign === '~' ? 0.65 : 1,
            }}>
              {/* Points */}
              <div style={{ width: 38, flexShrink: 0, textAlign: 'right', paddingTop: 1 }}>
                <span style={{ fontSize: 11, fontFamily: FS, fontWeight: 500, color: e.sign === '+' ? T.green : e.sign === '-' ? T.red : T.muted }}>
                  {e.sign === '~' ? '~' : e.sign}{e.sign !== '~' ? Math.abs(e.points) : ''}
                </span>
              </div>
              {/* Reason + source */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 8, letterSpacing: '0.10em', textTransform: 'uppercase', color: T.muted, fontFamily: FS, marginBottom: 1 }}>{e.category}</div>
                <div style={{ fontSize: 10, color: T.ink, fontFamily: FS, fontWeight: 300, lineHeight: 1.4 }}>{e.reason}</div>
                {/* FIX 1: Traced source rendered */}
                {e.traced && (
                  <div style={{ fontSize: 8, color: T.muted, fontFamily: FS, marginTop: 2, fontStyle: 'italic' }}>
                    Source: {e.traced}
                  </div>
                )}
                {/* FIX 5: Confidence penalty note rendered */}
                {e.confidenceNote && (
                  <div style={{ fontSize: 8, color: T.amber, fontFamily: FS, marginTop: 2 }}>
                    ⚠ {e.confidenceNote}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Data Completeness (separate from risk) ── */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, fontFamily: FS }}>Data Completeness</div>
            <span style={{ fontSize: 10, fontFamily: FS, color: score.confidenceScore >= 70 ? T.green : T.amber }}>{score.confidenceScore}%</span>
          </div>
          <div style={{ marginTop: 5, height: 3, backgroundColor: 'rgba(17,26,36,0.08)', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${score.confidenceScore}%`, backgroundColor: score.confidenceScore >= 70 ? T.green : T.amber, borderRadius: 1 }} />
          </div>
          <div style={{ fontSize: 8, color: T.muted, fontFamily: FS, marginTop: 4, fontStyle: 'italic' }}>
            Data gaps affect confidence multiplier (×{score.confidenceMultiplier}), not the environmental risk score
          </div>
        </div>
        <div style={{ padding: '8px 16px' }}>
          {score.dataCompleteness.verifiedItems.slice(0,5).map((item, i) => (
            <div key={i} style={{ fontSize: 9, color: T.green, fontFamily: FS, marginBottom: 3, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
              <span style={{ flexShrink: 0 }}>✓</span><span>{item}</span>
            </div>
          ))}
          {score.dataCompleteness.missingItems.map((item, i) => (
            <div key={i} style={{ fontSize: 9, color: T.amber, fontFamily: FS, marginBottom: 3, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
              <span style={{ flexShrink: 0 }}>⚠</span><span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Red Flags ── */}
      {score.redFlags.length > 0 && (
        <div style={{ border: `1px solid rgba(180,60,40,0.25)`, borderRadius: 4, backgroundColor: T.redLight, padding: '10px 16px' }}>
          <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.red, fontFamily: FS, marginBottom: 6 }}>
            Red Flags ({score.redFlags.length}) — Score ceiling applied
          </div>
          {score.redFlags.map((f, i) => (
            <div key={i} style={{ fontSize: 10, color: T.red, fontFamily: FS, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: T.red, flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>
      )}

      {/* ── Deal Impact ── */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.blueLight }}>
          <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.blue, fontFamily: FS }}>Deal Impact Translation</div>
        </div>
        <div style={{ padding: '8px 16px' }}>
          {[
            { label: 'Est. Environmental Liability', value: score.dealImpact.estimatedLiability },
            { label: 'Phase II Likelihood',          value: score.dealImpact.phase2Likelihood },
            { label: 'Permitting Delay Risk',        value: score.dealImpact.permittingDelayRisk },
            { label: 'Cleanup Risk',                 value: score.dealImpact.cleanupRisk },
            { label: 'Development Constraints',      value: score.dealImpact.developmentConstraintRisk },
            { label: 'Lender Concern',               value: score.dealImpact.lenderConcern },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '5px 0', borderBottom: i < 5 ? `1px solid ${T.border}` : 'none', gap: 8 }}>
              <span style={{ fontSize: 10, color: T.muted, fontFamily: FS, flexShrink: 0 }}>{row.label}</span>
              <span style={{ fontSize: 10, color: T.ink, fontFamily: FS, fontWeight: 400, textAlign: 'right', lineHeight: 1.4, maxWidth: '55%' }}>{row.value}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 16px', borderTop: `1px solid ${T.border}`, backgroundColor: rb(rCode) }}>
          <div style={{ fontSize: 10, color: rc(rCode), fontFamily: FS, lineHeight: 1.5 }}>
            <strong style={{ fontWeight: 500 }}>Recommended Action: </strong>{score.recommendedAction}
          </div>
        </div>
      </div>

    </div>
  );
}
