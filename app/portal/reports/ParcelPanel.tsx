'use client';

const T = {
  ink: '#111A24', muted: 'rgba(17,26,36,0.42)',
  blue: '#1E4976', blueLight: 'rgba(30,73,118,0.08)',
  green: '#2D6A4F', greenLight: 'rgba(45,106,79,0.08)',
  amber: '#8C5E1A', amberLight: 'rgba(140,94,26,0.08)',
  red: '#B43C28', redLight: 'rgba(180,60,40,0.08)',
  border: 'rgba(17,26,36,0.11)', surface: 'rgba(255,255,255,0.92)',
};
const FONT_SANS = "'Jost', sans-serif";

function confidenceTag(confidence: string) {
  const cfg = confidence === 'VERIFIED'
    ? { label: '✓ Verified', color: T.green, bg: T.greenLight }
    : confidence === 'INFERRED'
    ? { label: '~ Inferred', color: T.amber, bg: T.amberLight }
    : { label: '⚠ Unverified', color: T.red, bg: T.redLight };
  return (
    <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 2, backgroundColor: cfg.bg, color: cfg.color, fontFamily: FONT_SANS, letterSpacing: '0.08em' }}>
      {cfg.label}
    </span>
  );
}

function Row({ label, value, confidence, source }: { label: string; value: string | number | null; confidence?: string; source?: string }) {
  const display = value !== null && value !== undefined && value !== 'Unknown'
    ? String(value)
    : 'Unable to determine — manual verification recommended';
  const isUnknown = !value || value === 'Unknown' || value === 'Unable to determine from automated sources. Manual verification recommended.';

  return (
    <div style={{ padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 10, color: T.muted, fontFamily: FONT_SANS, flexShrink: 0, minWidth: 100 }}>{label}</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: isUnknown ? T.muted : T.ink, fontFamily: FONT_SANS, fontStyle: isUnknown ? 'italic' : 'normal', lineHeight: 1.4 }}>{display}</div>
          {confidence && <div style={{ marginTop: 2 }}>{confidenceTag(confidence)}</div>}
        </div>
      </div>
      {source && !isUnknown && (
        <div style={{ fontSize: 8, color: 'rgba(17,26,36,0.30)', fontFamily: FONT_SANS, marginTop: 3 }}>{source}</div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ParcelPanel({ data, loading }: { data: any; loading: boolean }) {
  if (loading) return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, padding: 14, marginBottom: 12 }}>
      <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, fontFamily: FONT_SANS, marginBottom: 6 }}>Parcel Intelligence</div>
      <div style={{ fontSize: 11, color: T.muted, fontFamily: FONT_SANS }}>Pulling ownership, zoning, land cover, receptors...</div>
    </div>
  );
  if (!data) return null;

  const { parcel, landCover, zoning, receptors, occupant } = data;

  const riskColor = occupant?.environmentalUseRisk === 'HIGH' ? T.red
    : occupant?.environmentalUseRisk === 'ELEVATED' ? T.amber
    : occupant?.environmentalUseRisk === 'MODERATE' ? T.amber
    : T.green;

  const riskBg = occupant?.environmentalUseRisk === 'HIGH' ? T.redLight
    : occupant?.environmentalUseRisk === 'ELEVATED' ? T.amberLight
    : occupant?.environmentalUseRisk === 'MODERATE' ? T.amberLight
    : T.greenLight;

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden', marginBottom: 12 }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.20em', textTransform: 'uppercase', color: T.blue, fontFamily: FONT_SANS }}>Parcel Intelligence</div>
        {parcel?.confidence && confidenceTag(parcel.confidence)}
      </div>

      {/* Parcel ownership */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, fontFamily: FONT_SANS, marginBottom: 6 }}>Ownership & Property</div>
        <Row label="Parcel ID" value={parcel?.parcelId} confidence={parcel?.confidence} source={parcel?.source} />
        <Row label="Owner" value={parcel?.ownerName} confidence={parcel?.confidence} />
        <Row label="Owner Type" value={parcel?.ownerType} confidence={parcel?.confidence} />
        <Row label="Property Class" value={parcel?.propertyClass} confidence={parcel?.confidence} />
        <Row label="Land Use" value={parcel?.landUseDescription} confidence={parcel?.confidence} />
        <Row label="Acres" value={parcel?.acres ? parcel.acres.toFixed(2) + ' ac' : null} confidence={parcel?.confidence} />
        <Row label="Year Built" value={parcel?.yearBuilt} confidence={parcel?.confidence} />
        <Row label="Building Sq Ft" value={parcel?.buildingSqFt ? parcel.buildingSqFt.toLocaleString() + ' sf' : null} confidence={parcel?.confidence} />
        <Row label="Assessed Land" value={parcel?.assessedLandValue ? '$' + parcel.assessedLandValue.toLocaleString() : null} confidence={parcel?.confidence} />
      </div>

      {/* Building age risk */}
      {occupant && (
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, backgroundColor: riskBg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: riskColor, fontFamily: FONT_SANS }}>Building Age Risk Assessment</div>
            <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 2, backgroundColor: riskBg, color: riskColor, fontFamily: FONT_SANS, fontWeight: 500, border: `1px solid ${riskColor}22` }}>
              {occupant.environmentalUseRisk}
            </span>
          </div>
          <div style={{ fontSize: 10, color: T.ink, fontFamily: FONT_SANS, lineHeight: 1.6 }}>{occupant.riskBasis}</div>
          <div style={{ fontSize: 8, color: T.muted, fontFamily: FONT_SANS, marginTop: 4 }}>{occupant.source}</div>
        </div>
      )}

      {/* Zoning */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, fontFamily: FONT_SANS, marginBottom: 6 }}>
          Zoning {zoning?.confidence && confidenceTag(zoning.confidence)}
        </div>
        <Row label="Jurisdiction" value={zoning?.jurisdiction} confidence={zoning?.confidence} source={zoning?.source} />
        <Row label="Zoning Code" value={zoning?.zoningCode} confidence={zoning?.confidence} />
        <Row label="Description" value={zoning?.zoningDescription} confidence={zoning?.confidence} />
        <Row label="Future Land Use" value={zoning?.futureLandUse} confidence={zoning?.confidence} />
      </div>

      {/* Land cover */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, fontFamily: FONT_SANS, marginBottom: 6 }}>
          Land Cover (NLCD 2021) {landCover?.confidence && confidenceTag(landCover.confidence)}
        </div>
        <Row label="Classification" value={landCover?.nlcdClass} confidence={landCover?.confidence} source={landCover?.source} />
        {landCover?.confidence !== 'UNAVAILABLE' && (
          <div style={{ marginTop: 8 }}>
            {[
              { label: 'Developed', pct: landCover?.developedPercent },
              { label: 'Impervious', pct: landCover?.imperviousPercent },
              { label: 'Cropland', pct: landCover?.cultivatedCropPercent },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontSize: 10, color: T.muted, fontFamily: FONT_SANS }}>
                  <span>{item.label}</span>
                  <span>{item.pct || 0}%</span>
                </div>
                <div style={{ height: 3, backgroundColor: 'rgba(17,26,36,0.08)', borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct || 0}%`, backgroundColor: T.blue, borderRadius: 1 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receptors */}
      <div style={{ padding: '10px 16px' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, fontFamily: FONT_SANS, marginBottom: 6 }}>
          Sensitive Receptors {receptors?.confidence && confidenceTag(receptors.confidence)}
        </div>
        <Row label="Nearest School" value={receptors?.nearestSchoolMi ? receptors.nearestSchoolMi.toFixed(2) + ' mi' : null} source={receptors?.source} />
        <Row label="Nearest Park" value={receptors?.nearestParkMi ? receptors.nearestParkMi.toFixed(2) + ' mi' : null} />
        <Row label="Nearest Surface Water" value={receptors?.nearestSurfaceWaterMi ? receptors.nearestSurfaceWaterMi.toFixed(2) + ' mi' : null} />
        <Row label="Nearest Hospital" value={receptors?.nearestHospitalMi ? receptors.nearestHospitalMi.toFixed(2) + ' mi' : null} />
        <div style={{ marginTop: 8, fontSize: 9, color: T.muted, fontFamily: FONT_SANS, lineHeight: 1.6, fontStyle: 'italic' }}>
          Receptor proximity based on OpenStreetMap data. Nearest residence requires parcel-level building data — manual verification recommended.
        </div>
      </div>
    </div>
  );
}
