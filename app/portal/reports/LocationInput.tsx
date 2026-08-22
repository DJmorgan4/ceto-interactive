'use client';
// app/portal/reports/LocationInput.tsx
//
// Replaces the bare location <input> in the reports page. Understands
// decimal pairs in either order, DMS, hemisphere suffixes, Google Maps
// URLs, and plain addresses — and tells the analyst what it understood
// BEFORE the Pull fires, so a bad geocode never silently poisons the
// screening. Emits the normalized query string + structured coords.

import { useMemo, useState } from 'react';
import { parseLocation } from '../../../lib/locationParse';

const T = {
  ink: '#111A24',
  blue: '#1E4976',
  green: '#2D6A4F',
  amber: '#8C5E1A',
  border: 'rgba(17,26,36,0.11)',
  muted: 'rgba(17,26,36,0.42)',
};
const FONT_SANS = "'Jost', sans-serif";

export type LocationPullPayload = {
  /** Normalized string to send to the geocoder — canonical "lat, lng"
   *  when coordinates were recognized, otherwise the raw address. */
  query: string;
  /** Structured coordinates when the input parsed as a coordinate pair. */
  coords?: { lat: number; lng: number };
};

export default function LocationInput({
  value,
  onChange,
  onPull,
  loading,
}: {
  value: string;
  onChange: (next: string) => void;
  onPull: (payload: LocationPullPayload) => void;
  loading: boolean;
}) {
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const parsed = useMemo(() => parseLocation(value), [value]);

  const canPull = parsed.kind !== 'empty' && !loading;

  const buildPayload = (): LocationPullPayload | null => {
    if (parsed.kind === 'coords') {
      return {
        query: parsed.canonical,
        coords: { lat: parsed.lat, lng: parsed.lng },
      };
    }
    if (parsed.kind === 'address') {
      return { query: parsed.text };
    }
    return null;
  };

  const firePull = () => {
    const payload = buildPayload();
    if (!payload || loading) return;
    // Normalize the visible field too, so what runs is what's shown.
    if (payload.coords) onChange(payload.query);
    onPull(payload);
  };

  const useMyLocation = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Location services unavailable in this browser.');
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsBusy(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const canonical = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        onChange(canonical);
        onPull({ query: canonical, coords: { lat, lng } });
      },
      (err) => {
        setGpsBusy(false);
        setGpsError(err.message || 'Unable to read your location.');
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    fontSize: 13,
    fontFamily: FONT_SANS,
    fontWeight: 300,
    padding: '9px 12px',
    backgroundColor: 'rgba(17,26,36,0.03)',
    border: `1px solid ${
      parsed.kind === 'coords' ? 'rgba(45,106,79,0.45)' : T.border
    }`,
    borderRadius: 2,
    outline: 'none',
    color: T.ink,
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && firePull()}
          placeholder="Address · lat, lng · DMS · or paste a Google Maps link"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={gpsBusy || loading}
          title="Use my current location"
          style={{
            flexShrink: 0,
            padding: '9px 10px',
            backgroundColor: 'rgba(17,26,36,0.05)',
            color: T.ink,
            border: `1px solid ${T.border}`,
            borderRadius: 2,
            cursor: gpsBusy || loading ? 'not-allowed' : 'pointer',
            fontSize: 11,
            fontFamily: FONT_SANS,
            opacity: gpsBusy || loading ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {gpsBusy ? '…' : '📍 GPS'}
        </button>
        <button
          type="button"
          onClick={firePull}
          disabled={!canPull}
          style={{
            flexShrink: 0,
            padding: '9px 10px',
            backgroundColor: T.blue,
            color: 'white',
            border: 'none',
            borderRadius: 2,
            cursor: !canPull ? 'not-allowed' : 'pointer',
            fontSize: 11,
            fontFamily: FONT_SANS,
            opacity: !canPull ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? '...' : '⚡ Pull'}
        </button>
      </div>

      {/* Live parse feedback — the analyst sees what will run before it runs */}
      <div style={{ fontSize: 9, fontFamily: FONT_SANS, marginTop: 4, lineHeight: 1.5 }}>
        {parsed.kind === 'coords' && (
          <span style={{ color: T.green }}>
            ✓ Coordinates {parsed.canonical}
            {parsed.note ? ` · ${parsed.note}` : ''}
          </span>
        )}
        {parsed.kind === 'address' && (
          <span style={{ color: T.muted }}>
            Address — will geocode via Census/Nominatim on Pull
          </span>
        )}
        {parsed.kind === 'empty' && (
          <span style={{ color: T.muted }}>
            Accepts: street address · 33.03407, -96.48694 · -96.48694, 33.03407 ·
            33°02'03"N 96°29'13"W · Google Maps link
          </span>
        )}
        {gpsError && <span style={{ color: T.amber }}> · {gpsError}</span>}
      </div>
    </div>
  );
}
