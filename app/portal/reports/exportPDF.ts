import { computeCetoScore, deriveScoreInput } from '@/lib/cetoScore';
import { generateMapUrls } from '@/lib/mapUrls';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportCetoPDF(params: {
  projectName: string;
  clientName: string;
  location: string;
  surveyDate: string;
  reportText: string;
  notes: string;
  reg: Record<string, unknown> | null;
  epName?: string;
}) {
  const { projectName, clientName, location, surveyDate, reportText, notes, reg } = params;

  // Compute score
  let cetoScore = 85;
  let rating = 'Low Risk';
  let ratingCode = 'LOW';
  let breakdown = {};
  let redFlags: string[] = [];
  let recommendedAction = '';

  if (reg) {
    const input = deriveScoreInput(reg, null, notes);
    const score = computeCetoScore(input);
    cetoScore = score.finalScore;
    rating = score.rating;
    ratingCode = score.ratingCode;
    breakdown = score.breakdown;
    redFlags = score.redFlags;
    recommendedAction = score.recommendedAction;
  }

  // Generate map URLs if Mapbox token available
  let mapUrls = {};
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const coords = reg?.coordinates as { lat: number; lng: number } | undefined;
  if (mapboxToken && coords?.lat && coords?.lng) {
    mapUrls = generateMapUrls(coords.lat, coords.lng, mapboxToken);
  }

  const res = await fetch('/api/portal/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName, clientName, location, surveyDate, reportText,
      cetoScore, rating, ratingCode, breakdown, redFlags, recommendedAction,
      reg, mapUrls,
      epName: params.epName || 'D.J. Morgan',
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'PDF generation failed');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CETO-${projectName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
