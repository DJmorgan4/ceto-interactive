// ── Data Confidence Language Engine ──────────────────────────────────────────
// Prevents the report from asserting things it cannot verify

type Confidence = 'VERIFIED' | 'INFERRED' | 'UNAVAILABLE';

export function confident(
  value: string | number | null | undefined,
  confidence: Confidence,
  verifiedPrefix = 'Data indicates',
  inferredPrefix = 'Based on available regional data, it appears',
  unavailableText = 'Unable to determine from automated sources. Manual verification recommended.'
): string {
  if (!value || confidence === 'UNAVAILABLE') return unavailableText;
  if (confidence === 'INFERRED') return `${inferredPrefix} ${value}.`;
  return `${verifiedPrefix}: ${value}.`;
}

export function sourceTag(source: string, confidence: Confidence): string {
  const tag = confidence === 'VERIFIED' ? '✓ Verified'
    : confidence === 'INFERRED' ? '~ Inferred'
    : '⚠ Unverified';
  return `${tag} · ${source}`;
}

export function buildingAgeNote(yearBuilt: number | null): string {
  if (!yearBuilt) return 'Unable to determine from automated sources. Manual verification recommended.';
  const concerns: string[] = [];
  if (yearBuilt < 1980) concerns.push('potential asbestos-containing materials');
  if (yearBuilt < 1978) concerns.push('potential lead-based paint');
  if (yearBuilt < 1985) concerns.push('potential heating oil storage');
  if (yearBuilt < 1979) concerns.push('potential PCB electrical equipment');
  if (concerns.length === 0) return `Construction year ${yearBuilt} does not indicate elevated building material concerns.`;
  return `Based on verified construction year (${yearBuilt}): ${concerns.join('; ')}. These items warrant further evaluation.`;
}
