'use client';
import { useState } from 'react';

const FS = 'Jost, sans-serif';
const T = {
  blue: '#2F5D8C', border: 'rgba(17,26,36,0.1)', surface: '#FFFFFF',
  blueLight: 'rgba(47,93,140,0.06)', muted: 'rgba(17,26,36,0.45)', ink: '#111A24',
};

interface Facility {
  name: string; type: string; distanceMi?: number | null; program?: string; source?: string; status?: string; address?: string; city?: string; county?: string; weight?: number; violations?: string;
  lat?: number | null; lng?: number | null; riskClass?: string; dataset?: string;
}
interface RegData {
  coordinates?: { lat: number; lng: number };
  epaEcho?: { facilitiesNearby?: Facility[] };
  tceq?: { facilitiesNearby?: Facility[] };
  [key: string]: unknown;
}

export function generateNearestFacilityNarrative(reg: RegData | null): string {
  if (!reg) return '';
  const all = [...(reg?.epaEcho?.facilitiesNearby || []), ...((reg as any)?.tceq?.facilitiesNearby || [])];
  const nearest = all.filter(f => typeof f.distanceMi === 'number').sort((a,b) => (a.distanceMi??99)-(b.distanceMi??99))[0];
  if (!nearest) return 'No regulated facilities identified within 1-mile search radius.';
  const dist = nearest.distanceMi!;
  const prox = dist <= 0.1 ? 'immediately adjacent to' : dist <= 0.25 ? 'in very close proximity to' : dist <= 0.5 ? 'in nearby proximity to' : 'within the 1-mile search radius of';
  return `The nearest identified regulated facility is ${nearest.name} (${nearest.dataset || nearest.program || nearest.type}), located ${prox} the subject property at approximately ${dist.toFixed(2)} miles.`;
}

export function generateRiskInterpretation(reg: RegData | null): string {
  if (!reg) return '';
  const all = [...(reg?.epaEcho?.facilitiesNearby || []), ...((reg as any)?.tceq?.facilitiesNearby || [])];
  const high = all.filter(f => f.riskClass === 'HIGH').length;
  const within025 = all.filter(f => (f.distanceMi ?? 99) <= 0.25).length;
  if (high > 0) return `${high} high-risk facility(ies) identified within the search radius. Subsurface investigation recommended to evaluate potential contaminant migration pathways.`;
  if (within025 > 0) return `${within025} facility(ies) identified within 0.25 miles. Contaminant migration risk is present but manageable pending Phase II investigation.`;
  return 'No high-risk facilities identified within the 1-mile search radius. Regulatory database review is consistent with a low contamination risk profile.';
}

function getRiskColor(rc?: string) {
  return rc === 'HIGH' ? '#EB5757' : rc === 'MODERATE' ? '#F2994A' : '#27AE60';
}

export default function RiskMap({ reg, projectName }: { reg: RegData | null; projectName?: string }) {
  const [activeTab, setActiveTab] = useState<'map' | 'satellite'>('map');

  const siteLat = reg?.coordinates?.lat;
  const siteLng = reg?.coordinates?.lng;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Merge and dedupe facilities
  const echoFacs: Facility[] = reg?.epaEcho?.facilitiesNearby || [];
  const tceqFacs: Facility[] = (reg as any)?.tceq?.facilitiesNearby || [];
  const seen = new Set<string>();
  const facilities: Facility[] = [...echoFacs, ...tceqFacs]
    .filter(f => { const k = String(f.name)+String(f.lat??'')+String(f.lng??''); if(seen.has(k))return false; seen.add(k); return true; })
    .sort((a, b) => ((a.distanceMi ?? 99) as number) - ((b.distanceMi ?? 99) as number));

  if (!siteLat || !siteLng) return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: '#F4F5F3', padding: '32px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(17,26,36,0.35)', fontFamily: FS, marginBottom: 6 }}>Environmental Risk Map</div>
      <div style={{ fontSize: 12, color: 'rgba(17,26,36,0.5)', fontFamily: FS }}>Enter a site address and click ⚡ Pull to load the interactive map</div>
    </div>
  );

  // Build Mapbox Static Image URL — no WebGL, works everywhere
  // Overlay: subject property pin + facility pins (max 20 in URL)
  const buildStaticMapUrl = () => {
    if (!token || !siteLat || !siteLng) return null;
    const style = activeTab === 'satellite' ? 'satellite-streets-v12' : 'light-v11';
    // Site marker (blue pin)
    const sitePin = `pin-l-star+2F5D8C(${siteLng},${siteLat})`;
    // Top facility pins (up to 8 with coords)
    const facPins = facilities
      .filter(f => f.lat && f.lng)
      .slice(0, 8)
      .map(f => {
        const color = f.riskClass === 'HIGH' ? 'EB5757' : f.riskClass === 'MODERATE' ? 'F2994A' : '27AE60';
        return `pin-s+${color}(${f.lng},${f.lat})`;
      });
    const overlays = [sitePin, ...facPins].join(',');
    const zoom = 13;
    const width = 700;
    const height = 320;
    return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${overlays}/${siteLng},${siteLat},${zoom}/${width}x${height}@2x?access_token=${token}`;
  };

  const staticUrl = buildStaticMapUrl();

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden', marginBottom: 14 }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.20em', textTransform: 'uppercase', color: T.blue, fontFamily: FS }}>Environmental Risk Map</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['map', 'satellite'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '3px 10px', borderRadius: 2, border: 'none', cursor: 'pointer', fontSize: 9, fontFamily: FS, textTransform: 'capitalize', backgroundColor: activeTab === tab ? T.blue : 'rgba(17,26,36,0.06)', color: activeTab === tab ? 'white' : T.muted }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Static map image */}
      <div style={{ position: 'relative', height: 320, backgroundColor: '#E8EAE6' }}>
        {staticUrl ? (
          <img
            src={staticUrl}
            alt={`Environmental risk map for ${projectName || 'subject property'}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 11, color: T.muted, fontFamily: FS }}>
            Map unavailable — check Mapbox token configuration
          </div>
        )}
        {/* Coordinate overlay */}
        <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(255,255,255,0.9)', borderRadius: 2, padding: '3px 8px', fontSize: 9, fontFamily: FS, color: T.muted }}>
          {siteLat.toFixed(5)}°N, {Math.abs(siteLng).toFixed(5)}°W · {facilities.length} regulated facilities
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {[
            { color: T.blue, label: 'Subject Property' },
            { color: '#EB5757', label: 'High Risk (RCRA/Superfund)' },
            { color: '#F2994A', label: 'Moderate Risk (UST/LUST)' },
            { color: '#27AE60', label: 'Low Risk Facility' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: T.muted, fontFamily: FS }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Facility list — top 3 most relevant */}
      {facilities.length > 0 && (
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          <div style={{ padding: '8px 16px', backgroundColor: 'rgba(17,26,36,0.02)' }}>
            <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, fontFamily: FS }}>
              Mapped Facilities — Sorted by Distance
            </div>
          </div>
          {facilities.slice(0, 42).map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: i < Math.min(facilities.length, 42) - 1 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: getRiskColor(f.riskClass), flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, color: T.ink, fontFamily: FS, fontWeight: 300 }}>{f.name}</div>
                  <div style={{ fontSize: 10, color: T.muted, fontFamily: FS }}>{f.dataset || f.type}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {f.distanceMi !== undefined && (
                  <div style={{ fontSize: 11, color: T.blue, fontFamily: FS, fontWeight: 500 }}>{f.distanceMi.toFixed(2)} mi</div>
                )}
                <div style={{ fontSize: 9, color: T.muted, fontFamily: FS }}>Low Risk</div>
              </div>
            </div>
          ))}
          {facilities.length > 42 && (
            <div style={{ padding: '8px 16px', fontSize: 10, color: T.muted, fontFamily: FS, textAlign: 'center' }}>
              +{facilities.length - 42} additional facilities within 1-mile radius — see full report
            </div>
          )}
        </div>
      )}
      {facilities.length === 0 && (
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, color: T.muted, fontFamily: FS }}>
            {facilities.length === 0 && reg ? 'No regulated facilities identified within 1-mile radius — TCEQ data loading...' : 'No regulated facilities identified within 1-mile radius.'}
          </div>
        </div>
      )}
    </div>
  );
}
