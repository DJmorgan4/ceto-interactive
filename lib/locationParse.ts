// lib/locationParse.ts
//
// One parser for every way a location arrives at Ceto: typed decimal pairs
// (either order), DMS from a deed or survey, hemisphere-suffixed values,
// pasted Google Maps URLs, or a plain street address. Coordinates are
// normalized to a canonical "lat, lng" string so the geocoding API always
// receives one predictable format.

export type ParsedLocation =
  | { kind: 'coords'; lat: number; lng: number; canonical: string; note?: string }
  | { kind: 'address'; text: string }
  | { kind: 'empty' }

const LAT_MAX = 90
const LNG_MAX = 180

export function toCanonical(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

function inRange(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= LAT_MAX &&
    Math.abs(lng) <= LNG_MAX
  )
}

function coords(
  lat: number,
  lng: number,
  note?: string,
): ParsedLocation | null {
  if (!inRange(lat, lng)) return null
  return { kind: 'coords', lat, lng, canonical: toCanonical(lat, lng), note }
}

/** Pasted Google Maps / Apple Maps URLs. Matches, in priority order:
 *  !3d<lat>!4d<lng> (the pin itself), ?q= / ?ll= params, then /@lat,lng
 *  (the viewport center — least precise, so last). */
function fromMapUrl(raw: string): ParsedLocation | null {
  if (!/^https?:\/\//i.test(raw) && !raw.includes('google.') && !raw.includes('maps')) {
    return null
  }

  const pin = raw.match(/!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/)
  if (pin) {
    const c = coords(parseFloat(pin[1]), parseFloat(pin[2]), 'From map link pin')
    if (c) return c
  }

  const param = raw.match(/[?&](?:q|ll|query|center)=(-?\d{1,3}(?:\.\d+)?)[,%2C+]+(-?\d{1,3}(?:\.\d+)?)/i)
  if (param) {
    const c = coords(parseFloat(param[1]), parseFloat(param[2]), 'From map link')
    if (c) return c
  }

  const at = raw.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/)
  if (at) {
    const c = coords(parseFloat(at[1]), parseFloat(at[2]), 'From map link viewport')
    if (c) return c
  }

  return null
}

/** Degrees-minutes-seconds, e.g. 33°02'03.4"N 96°29'13"W.
 *  Also tolerates unicode prime marks and spaces between parts. */
function fromDMS(raw: string): ParsedLocation | null {
  const dmsPattern =
    /(\d{1,3})\s*[°d:\s]\s*(\d{1,2})\s*['′m:\s]\s*(\d{1,2}(?:\.\d+)?)\s*["″s]?\s*([NSEW])/gi

  const matches = [...raw.matchAll(dmsPattern)]
  if (matches.length < 2) return null

  let lat: number | null = null
  let lng: number | null = null

  for (const m of matches.slice(0, 2)) {
    const value =
      parseInt(m[1], 10) + parseInt(m[2], 10) / 60 + parseFloat(m[3]) / 3600
    const hemi = m[4].toUpperCase()
    if (hemi === 'N') lat = value
    else if (hemi === 'S') lat = -value
    else if (hemi === 'E') lng = value
    else if (hemi === 'W') lng = -value
  }

  if (lat === null || lng === null) return null
  return coords(lat, lng, 'Parsed from DMS')
}

/** Decimal degrees with hemisphere letters, e.g. "33.034 N, 96.487 W". */
function fromHemisphereDecimal(raw: string): ParsedLocation | null {
  const pattern = /(-?\d{1,3}(?:\.\d+)?)\s*°?\s*([NSEW])\b/gi
  const matches = [...raw.matchAll(pattern)]
  if (matches.length < 2) return null

  let lat: number | null = null
  let lng: number | null = null

  for (const m of matches.slice(0, 2)) {
    const value = Math.abs(parseFloat(m[1]))
    const hemi = m[2].toUpperCase()
    if (hemi === 'N') lat = value
    else if (hemi === 'S') lat = -value
    else if (hemi === 'E') lng = value
    else if (hemi === 'W') lng = -value
  }

  if (lat === null || lng === null) return null
  return coords(lat, lng)
}

/** Plain decimal pair in either order. GIS exports are commonly lng-first;
 *  detect and swap rather than failing or geocoding garbage. */
function fromDecimalPair(raw: string): ParsedLocation | null {
  const cleaned = raw.replace(/[()°]/g, ' ').trim()
  const parts = cleaned.split(/[,;\s]+/).filter(Boolean)
  if (parts.length !== 2) return null

  const a = parseFloat(parts[0])
  const b = parseFloat(parts[1])
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  // Reject things like street numbers pretending to be coordinates
  if (!/^-?\d{1,3}(\.\d+)?$/.test(parts[0]) || !/^-?\d{1,3}(\.\d+)?$/.test(parts[1])) {
    return null
  }

  // Unambiguous by magnitude: only one ordering is valid
  if (Math.abs(a) <= LAT_MAX && Math.abs(b) > LAT_MAX) return coords(a, b)
  if (Math.abs(a) > LAT_MAX && Math.abs(b) <= LAT_MAX) {
    return coords(b, a, 'Swapped — longitude was first')
  }

  // Both within ±90: use sign convention. In the western hemisphere the
  // negative value is the longitude.
  if (a > 0 && b < 0) return coords(a, b)
  if (a < 0 && b > 0) return coords(b, a, 'Swapped — longitude was first')

  // Truly ambiguous (both positive or both negative, both ≤90).
  // Assume lat-first and say so.
  return coords(a, b, 'Assumed latitude first')
}

export function parseLocation(raw: string): ParsedLocation {
  const trimmed = (raw || '').trim()
  if (!trimmed) return { kind: 'empty' }

  const parsed =
    fromMapUrl(trimmed) ||
    fromDMS(trimmed) ||
    fromHemisphereDecimal(trimmed) ||
    fromDecimalPair(trimmed)

  if (parsed) return parsed
  return { kind: 'address', text: trimmed }
}
