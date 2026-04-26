// ── CETO Environmental Risk Scoring Engine ────────────────────────────────────
// Formula: FinalScore = min(CorrectedScore, RedFlagCeiling, DataConfidenceCeiling)

export interface ScoreInput {
  facilitiesWithin1Mile: number;
  facilitiesWithinHalfMile: number;
  facilitiesAdjacent: boolean;
  knownReleaseOnSite: boolean;
  migrationDirection: 'downgradient' | 'cross' | 'unknown' | 'upgradient';
  hasViolations: boolean;
  hasActiveCleanup: boolean;
  hasOpenEnforcement: boolean;
  historicalUse: 'vacant'|'agricultural'|'residential'|'office'|'retail'|'commercial'|'auto'|'gasStation'|'dryCleaner'|'industrial'|'landfill'|'unknown';
  nwiOnSite: boolean;
  nwiAdjacent: boolean;
  nwiWithin500ft: boolean;
  hydricPercent: number;
  drainage: 'well'|'moderate'|'poor'|'unknown';
  surfaceWaterOnSite: boolean;
  surfaceWaterWithin500ft: boolean;
  floodZone: string;
  shrinkSwell: 'low'|'moderate'|'high'|'unknown';
  permeability: 'low'|'moderate'|'high'|'unknown';
  karst: 'none'|'possible'|'mapped';
  fieldObservation: 'none'|'debris'|'staining'|'drums'|'ust'|'odor'|'release';
  minorGaps: number;
  majorGaps: number;
  criticalGaps: number;
  formerGasStation: boolean;
  formerDryCleaner: boolean;
  formerIndustrial: boolean;
  mappedWetlandOnSite: boolean;
  inFloodway: boolean;
  noSiteRecon: boolean;
  noHistoricalRecords: boolean;
  noRegDatabase: boolean;
}

export interface ScoreOutput {
  finalScore: number;
  rawScore: number;
  correctedScore: number;
  ceiling: number;
  confidenceMultiplier: number;
  severityMultiplier: number;
  rating: string;
  ratingCode: 'LOW'|'MODERATE_LOW'|'MODERATE'|'ELEVATED'|'HIGH';
  breakdown: {
    regulatory: number;
    historical: number;
    wetland: number;
    flood: number;
    soil: number;
    field: number;
    dataGap: number;
  };
  redFlags: string[];
  recommendedAction: string;
  reason: string;
}

const HISTORICAL_SCORES: Record<string, number> = {
  vacant: 5, agricultural: 8, residential: 10, office: 15, retail: 15,
  commercial: 25, auto: 60, gasStation: 80, dryCleaner: 90,
  industrial: 85, landfill: 100, unknown: 20,
};

const FIELD_SCORES: Record<string, number> = {
  none: 0, debris: 10, staining: 25, drums: 50, ust: 70, odor: 80, release: 100,
};

function cap(val: number, max = 100): number {
  return Math.min(max, Math.max(0, val));
}

export function computeCetoScore(input: ScoreInput): ScoreOutput {
  const redFlags: string[] = [];

  const facilityRisk = input.knownReleaseOnSite ? 100
    : input.facilitiesAdjacent ? 60
    : input.facilitiesWithinHalfMile > 0 ? 40
    : input.facilitiesWithin1Mile > 0 ? 20 : 0;

  const migrationRisk = { downgradient: 0, cross: 0, unknown: 15, upgradient: 30 }[input.migrationDirection];
  const complianceRisk = input.hasActiveCleanup ? 80
    : input.hasOpenEnforcement ? 60
    : input.hasViolations ? 40
    : input.facilitiesWithin1Mile > 0 ? 20 : 0;

  const regulatoryRisk = cap(facilityRisk + migrationRisk + complianceRisk);
  const historicalRisk = HISTORICAL_SCORES[input.historicalUse] ?? 20;

  const nwiRisk = input.nwiOnSite ? 90 : input.nwiAdjacent ? 60 : input.nwiWithin500ft ? 30 : 0;
  const hydricRisk = input.hydricPercent > 50 ? 40 : input.hydricPercent > 0 ? 20 : 0;
  const drainageRisk = { well: 0, moderate: 10, poor: 25, unknown: 10 }[input.drainage];
  const surfaceRisk = input.surfaceWaterOnSite ? 30 : input.surfaceWaterWithin500ft ? 15 : 0;
  const wetlandRisk = cap(nwiRisk + hydricRisk + drainageRisk + surfaceRisk);

  const floodRisk = input.inFloodway ? 100
    : input.floodZone.startsWith('AE') || input.floodZone === 'A' ? 60
    : input.floodZone === 'X500' ? 20 : 0;

  const shrinkRisk = { low: 0, moderate: 15, high: 30, unknown: 10 }[input.shrinkSwell];
  const permRisk = { low: 0, moderate: 15, high: 30, unknown: 10 }[input.permeability];
  const karstRisk = { none: 0, possible: 30, mapped: 60 }[input.karst];
  const soilRisk = cap(shrinkRisk + permRisk + karstRisk);

  const fieldRisk = FIELD_SCORES[input.fieldObservation] ?? 0;
  const dataGapRisk = cap((input.minorGaps * 10) + (input.majorGaps * 30) + (input.criticalGaps * 50));

  const rawRisk =
    (regulatoryRisk * 0.25) +
    (historicalRisk * 0.15) +
    (wetlandRisk   * 0.15) +
    (floodRisk     * 0.10) +
    (soilRisk      * 0.15) +
    (fieldRisk     * 0.10) +
    (dataGapRisk   * 0.10);

  const confidenceMultiplier = Math.min(1.35, 1 + (input.criticalGaps * 0.05) + (input.majorGaps * 0.03));

  if (input.knownReleaseOnSite) redFlags.push('Known release on-site');
  if (input.formerGasStation) redFlags.push('Former gas station');
  if (input.formerDryCleaner) redFlags.push('Former dry cleaner');
  if (input.formerIndustrial) redFlags.push('Former industrial use');
  if (input.mappedWetlandOnSite) redFlags.push('Mapped wetland on-site');
  if (input.inFloodway) redFlags.push('Located in floodway');
  if (input.fieldObservation === 'release') redFlags.push('Release evidence observed');
  if (input.fieldObservation === 'ust') redFlags.push('UST/AST evidence observed');
  if (input.nwiOnSite) redFlags.push('NWI wetland on-site');
  if (input.floodZone.startsWith('AE')) redFlags.push('Zone AE flood hazard');
  if (input.hasActiveCleanup) redFlags.push('Active cleanup site nearby');

  const severityMultiplier =
    redFlags.length >= 3 ? 1.60
    : redFlags.length === 2 ? 1.35
    : redFlags.length === 1 ? 1.15 : 1.0;

  const correctedRisk = Math.min(100, rawRisk * confidenceMultiplier * severityMultiplier);
  const correctedScore = Math.round(100 - correctedRisk);

  let ceiling = 100;
  if (input.knownReleaseOnSite)  ceiling = Math.min(ceiling, 45);
  if (input.formerDryCleaner)    ceiling = Math.min(ceiling, 65);
  if (input.formerGasStation)    ceiling = Math.min(ceiling, 65);
  if (input.mappedWetlandOnSite) ceiling = Math.min(ceiling, 70);
  if (input.inFloodway)          ceiling = Math.min(ceiling, 70);
  if (input.noSiteRecon)         ceiling = Math.min(ceiling, 80);
  if (input.noHistoricalRecords) ceiling = Math.min(ceiling, 75);
  if (input.noRegDatabase)       ceiling = Math.min(ceiling, 70);

  const finalScore = Math.min(correctedScore, ceiling);

  const rating = finalScore >= 90 ? 'Low Risk'
    : finalScore >= 75 ? 'Moderate-Low Risk'
    : finalScore >= 60 ? 'Moderate Risk'
    : finalScore >= 40 ? 'Elevated Risk' : 'High Risk';

  const ratingCode = finalScore >= 90 ? 'LOW'
    : finalScore >= 75 ? 'MODERATE_LOW'
    : finalScore >= 60 ? 'MODERATE'
    : finalScore >= 40 ? 'ELEVATED' : 'HIGH';

  const reasons: string[] = [];
  if (regulatoryRisk > 30) reasons.push(`${input.facilitiesWithin1Mile} regulated facility(ies) within 1 mile`);
  if (historicalRisk > 20) reasons.push(`elevated historical use risk (${input.historicalUse})`);
  if (wetlandRisk > 30) reasons.push('wetland or hydric soil indicators present');
  if (floodRisk > 0) reasons.push(`flood zone ${input.floodZone}`);
  if (dataGapRisk > 20) reasons.push('data gaps affecting confidence');
  if (redFlags.length > 0) reasons.push(`${redFlags.length} red flag(s): ${redFlags.slice(0,2).join(', ')}`);

  const reason = reasons.length > 0
    ? reasons.join('; ') + '.'
    : 'No significant environmental concerns identified based on available data.';

  const recommendedAction = ratingCode === 'HIGH' || ratingCode === 'ELEVATED'
    ? 'Phase II ESA strongly recommended prior to any property transaction.'
    : ratingCode === 'MODERATE'
    ? 'Review flagged items. Phase II ESA recommended if transaction is risk-sensitive.'
    : ratingCode === 'MODERATE_LOW'
    ? 'No Phase II ESA required. Monitor flagged items and verify TCEQ records manually.'
    : 'No further environmental investigation recommended at this time.';

  return {
    finalScore, rawScore: Math.round(100 - rawRisk), correctedScore, ceiling,
    confidenceMultiplier: Math.round(confidenceMultiplier * 100) / 100,
    severityMultiplier, rating, ratingCode,
    breakdown: {
      regulatory: Math.round(regulatoryRisk), historical: Math.round(historicalRisk),
      wetland: Math.round(wetlandRisk), flood: Math.round(floodRisk),
      soil: Math.round(soilRisk), field: Math.round(fieldRisk), dataGap: Math.round(dataGapRisk),
    },
    redFlags, reason, recommendedAction,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deriveScoreInput(reg: any, fieldNotes: string): ScoreInput {
  const notes = (fieldNotes || '').toLowerCase();

  const fieldObservation =
    notes.includes('release') || notes.includes('spill') ? 'release'
    : notes.includes('ust') || notes.includes('tank') || notes.includes('ast') ? 'ust'
    : notes.includes('odor') || notes.includes('sheen') ? 'odor'
    : notes.includes('drum') || notes.includes('container') ? 'drums'
    : notes.includes('stain') ? 'staining'
    : notes.includes('debris') || notes.includes('trash') ? 'debris'
    : 'none';

  const historicalUse =
    notes.includes('dry clean') ? 'dryCleaner'
    : notes.includes('gas station') || notes.includes('fuel') ? 'gasStation'
    : notes.includes('industrial') || notes.includes('manufactur') ? 'industrial'
    : notes.includes('auto') || notes.includes('repair') ? 'auto'
    : notes.includes('landfill') || notes.includes('dump') ? 'landfill'
    : notes.includes('commercial') || notes.includes('retail') ? 'retail'
    : notes.includes('residential') || notes.includes('house') ? 'residential'
    : notes.includes('vacant') || notes.includes('undeveloped') ? 'vacant'
    : notes.includes('agricultural') || notes.includes('farm') ? 'agricultural'
    : 'unknown';

  const drainage = reg?.soils?.mapUnits?.[0]?.drainage?.toLowerCase().includes('poor') ? 'poor'
    : reg?.soils?.mapUnits?.[0]?.drainage?.toLowerCase().includes('moderate') ? 'moderate'
    : reg?.soils?.mapUnits?.[0]?.drainage?.toLowerCase().includes('well') ? 'well'
    : 'unknown';

  const shrinkSwell = reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('high') ? 'high'
    : reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('moderate') ? 'moderate'
    : reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('low') ? 'low'
    : 'unknown';

  const fz = reg?.fema?.floodZone || 'X';

  return {
    facilitiesWithin1Mile: reg?.epaEcho?.totalCount || 0,
    facilitiesWithinHalfMile: 0,
    facilitiesAdjacent: false,
    knownReleaseOnSite: notes.includes('release') || notes.includes('spill'),
    migrationDirection: 'unknown',
    hasViolations: reg?.epaEcho?.facilitiesNearby?.some((f: {violations: string}) => f.violations?.includes('Active')) || false,
    hasActiveCleanup: false,
    hasOpenEnforcement: false,
    historicalUse,
    nwiOnSite: reg?.nwi?.wetlandsPresent || false,
    nwiAdjacent: false,
    nwiWithin500ft: reg?.nwi?.wetlandsPresent || false,
    hydricPercent: reg?.soils?.hydricPercent || 0,
    drainage,
    surfaceWaterOnSite: reg?.hydrology?.nearbyStreams?.length > 0,
    surfaceWaterWithin500ft: reg?.hydrology?.nearbyStreams?.length > 0,
    floodZone: fz,
    shrinkSwell,
    permeability: 'unknown',
    karst: 'none',
    fieldObservation,
    minorGaps: reg?.soils?.mapUnits?.length === 0 ? 1 : 0,
    majorGaps: !reg?.geology?.formation || reg?.geology?.formation === 'Unknown' ? 1 : 0,
    criticalGaps: 0,
    formerGasStation: historicalUse === 'gasStation',
    formerDryCleaner: historicalUse === 'dryCleaner',
    formerIndustrial: historicalUse === 'industrial',
    mappedWetlandOnSite: reg?.nwi?.wetlandsPresent || false,
    inFloodway: fz === 'FLOODWAY',
    noSiteRecon: notes.length < 30,
    noHistoricalRecords: false,
    noRegDatabase: false,
  };
}
