// ── CETO Environmental Risk Scoring Engine v4 (Final) ─────────────────────────
// All 5 final fixes applied:
// 1. TracedValue used throughout and rendered in UI
// 2. Facility type weighting ACTUALLY active (not default)
// 3. Distance modeling — closer facilities = higher risk
// 4. Site class + confidence surfaced in header
// 5. Confidence-aware penalties visible to user

export interface TracedValue<T> {
  value: T;
  source: string;
  confidence: 'VERIFIED' | 'INFERRED' | 'UNAVAILABLE';
  timestamp: string;
  note?: string; // explains any penalty applied
}

export function trace<T>(
  value: T,
  source: string,
  confidence: 'VERIFIED' | 'INFERRED' | 'UNAVAILABLE',
  note?: string
): TracedValue<T> {
  return {
    value, source, confidence,
    timestamp: new Date().toISOString().split('T')[0],
    ...(note ? { note } : {}),
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type SiteClass =
  | 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL'
  | 'AGRICULTURAL' | 'VACANT' | 'PUBLIC' | 'UNKNOWN';

export type CurrentUse =
  | 'vacant' | 'agricultural' | 'residential' | 'office' | 'retail'
  | 'restaurant' | 'auto' | 'gasStation' | 'dryCleaner' | 'industrial'
  | 'landfill' | 'unknown';

export interface ScoreExplanation {
  category: string;
  points: number;
  sign: '+' | '-' | '~';
  reason: string;
  traced?: string;
  confidenceNote?: string; // FIX 5: surfaces confidence penalties
}

export interface DealImpact {
  estimatedLiability: string;
  phase2Likelihood: string;
  permittingDelayRisk: string;
  developmentConstraintRisk: string;
  cleanupRisk: string;
  lenderConcern: string;
}

export interface ScoredInput {
  hydricPercent: TracedValue<number>;
  floodZone: TracedValue<string>;
  wetlandsPresent: TracedValue<boolean>;
  facilitiesCount: TracedValue<number>;
  facilitiesNearby: TracedValue<{ name: string; type: string; distanceMi?: number; program?: string }[]>;
  elevation: TracedValue<number | null>;
  geology: TracedValue<string>;
  soilSeries: TracedValue<string>;
  drainage: TracedValue<string>;
  currentUse: TracedValue<CurrentUse>;
  siteClass: TracedValue<SiteClass>;
  knownReleaseOnSite: boolean;
  migrationDirection: 'downgradient' | 'cross' | 'unknown' | 'upgradient';
  hasViolations: boolean;
  hasActiveCleanup: boolean;
  hasOpenEnforcement: boolean;
  facilitiesWithinHalfMile: number;
  facilitiesAdjacent: boolean;
  historicalUse: CurrentUse;
  nwiOnSite: boolean;
  nwiAdjacent: boolean;
  surfaceWaterWithin500ft: boolean;
  inFloodway: boolean;
  shrinkSwell: 'low' | 'moderate' | 'high' | 'unknown';
  permeability: 'low' | 'moderate' | 'high' | 'unknown';
  karst: 'none' | 'possible' | 'mapped';
  fieldObservation: 'none' | 'debris' | 'staining' | 'drums' | 'ust' | 'odor' | 'release';
  formerGasStation: boolean;
  formerDryCleaner: boolean;
  formerIndustrial: boolean;
  dataGaps: {
    soilsUnavailable: boolean;
    geologyUnavailable: boolean;
    parcelUnavailable: boolean;
    historicalAerialsUnavailable: boolean;
    tceqManualRequired: boolean;
    noSiteRecon: boolean;
    noHistoricalRecords: boolean;
  };
}

export interface ScoreOutput {
  finalScore: number;
  rawRiskScore: number;
  confidenceScore: number;
  correctedScore: number;
  ceiling: number;
  confidenceMultiplier: number;
  severityMultiplier: number;
  rating: string;
  ratingCode: 'LOW' | 'MODERATE_LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  breakdown: {
    regulatory: number;
    historicalUse: number;
    currentUse: number;
    wetland: number;
    flood: number;
    soil: number;
    field: number;
  };
  explanations: ScoreExplanation[];
  dataCompleteness: {
    score: number;
    missingItems: string[];
    verifiedItems: string[];
  };
  redFlags: string[];
  recommendedAction: string;
  reason: string;
  dealImpact: DealImpact;
  // FIX 4: full traceability in header
  siteClass: string;
  siteClassConfidence: string;
  siteClassSource: string;
  currentUseLabel: string;
  currentUseConfidence: string;
  currentUseSource: string;
  currentUseNote?: string;
  tracedInputs: ScoredInput['facilitiesCount'] extends TracedValue<infer _> ? {
    hydricPercent: TracedValue<number>;
    floodZone: TracedValue<string>;
    wetlandsPresent: TracedValue<boolean>;
    facilitiesCount: TracedValue<number>;
    currentUse: TracedValue<CurrentUse>;
    siteClass: TracedValue<SiteClass>;
    soilSeries: TracedValue<string>;
    geology: TracedValue<string>;
  } : never;
}

// ── Risk tables ───────────────────────────────────────────────────────────────

const HISTORICAL_USE_RISK: Record<string, number> = {
  vacant: 5, agricultural: 8, residential: 10, office: 12, retail: 15,
  commercial: 25, restaurant: 20, auto: 60, gasStation: 80,
  dryCleaner: 90, industrial: 85, landfill: 100, unknown: 20,
};

const CURRENT_USE_RISK: Record<CurrentUse, { risk: number; label: string }> = {
  vacant:      { risk: 5,   label: 'Vacant — minimal current use risk' },
  agricultural:{ risk: 15,  label: 'Agricultural — pesticide/herbicide potential' },
  residential: { risk: 8,   label: 'Residential — low current use risk' },
  office:      { risk: 8,   label: 'Office — low current use risk' },
  retail:      { risk: 12,  label: 'Retail — low current use risk' },
  restaurant:  { risk: 18,  label: 'Restaurant — grease trap, cleaning chemicals potential' },
  auto:        { risk: 65,  label: 'Auto repair — petroleum products, solvents, waste oil' },
  gasStation:  { risk: 85,  label: 'Gas station — UST potential, petroleum release risk' },
  dryCleaner:  { risk: 90,  label: 'Dry cleaner — PCE/TCE chlorinated solvent risk' },
  industrial:  { risk: 80,  label: 'Industrial — hazardous materials, process chemicals' },
  landfill:    { risk: 100, label: 'Landfill — gas generation, leachate, waste' },
  unknown:     { risk: 20,  label: 'Current use unknown — manual verification required' },
};

// FIX 2: Facility type weights — actually used now
const FACILITY_TYPE_WEIGHTS: Record<string, number> = {
  'Superfund':      2.0,
  'NPL':            2.0,
  'RCRA':           1.8,
  'CORRACTS':       1.8,
  'LUST':           1.6,
  'UST':            1.4,
  'TRI':            1.3,
  'NPDES':          1.1,
  'Air':            1.0,
  'Stormwater':     0.9,
  'Minor Permit':   0.8,
  'default':        1.0,
};

const FIELD_SCORES: Record<string, number> = {
  none: 0, debris: 10, staining: 25, drums: 50, ust: 70, odor: 80, release: 100,
};

function cap(val: number, max = 100): number {
  return Math.min(max, Math.max(0, val));
}

// FIX 3: Distance modeling — 0.1 mi facility ≠ 1.0 mi facility
function distanceWeight(distanceMi: number): number {
  // Linear decay: 1.0 at 0 miles, 0.5 at 1.0 mile
  return Math.max(0.5, 1.0 - (distanceMi / 1.0) * 0.5);
}

// FIX 2+3: Compute weighted facility risk from actual facility data
function computeFacilityRisk(
  facilities: { name: string; type: string; distanceMi?: number; program?: string }[],
  facilitiesAdjacent: boolean,
  knownRelease: boolean
): { risk: number; highestWeight: number; highestType: string; closestMi: number | null } {
  if (knownRelease) return { risk: 100, highestWeight: 2.0, highestType: 'Known Release', closestMi: 0 };
  if (facilitiesAdjacent) return { risk: 60, highestWeight: 1.0, highestType: 'Adjacent facility', closestMi: 0 };
  if (!facilities.length) return { risk: 0, highestWeight: 1.0, highestType: 'None', closestMi: null };

  let maxRisk = 0;
  let highestWeight = 1.0;
  let highestType = 'Unknown';
  let closestMi: number | null = null;

  for (const f of facilities) {
    const program = f.program || f.type || 'default';
    // Match program to weight table
    const typeWeight = Object.keys(FACILITY_TYPE_WEIGHTS).find(k =>
      program.toUpperCase().includes(k.toUpperCase())
    ) ? FACILITY_TYPE_WEIGHTS[Object.keys(FACILITY_TYPE_WEIGHTS).find(k =>
      program.toUpperCase().includes(k.toUpperCase())
    )!] : FACILITY_TYPE_WEIGHTS['default'];

    const dist = f.distanceMi ?? 0.75; // default to 0.75 mi if unknown
    const dWeight = distanceWeight(dist);
    const facilityRisk = 20 * typeWeight * dWeight; // base 20 pts × type × distance

    if (closestMi === null || dist < closestMi) closestMi = dist;
    if (facilityRisk > maxRisk) {
      maxRisk = facilityRisk;
      highestWeight = typeWeight;
      highestType = program;
    }
  }

  return { risk: cap(maxRisk), highestWeight, highestType, closestMi };
}

// ── Site classification (priority order) ──────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function classifySite(parcel: any, zoning: any, landCover: any): TracedValue<SiteClass> {
  const luc = String(parcel?.landUseCode || '').toUpperCase();
  const desc = String(parcel?.landUseDescription || '').toLowerCase();
  const ownerType = String(parcel?.ownerType || '').toUpperCase();
  const zoningCode = String(zoning?.zoningCode || '').toUpperCase();
  const cropPct = landCover?.cultivatedCropPercent || 0;
  const devPct = landCover?.developedPercent || 0;
  const pConf = parcel?.confidence || 'UNAVAILABLE';

  // Priority 1: Parcel
  if (pConf !== 'UNAVAILABLE') {
    if (ownerType === 'GOVERNMENT' || ownerType === 'SCHOOL')
      return trace('PUBLIC' as SiteClass, parcel?.source || 'County CAD', pConf);
    if (luc.startsWith('I') || desc.includes('industrial') || desc.includes('manufactur') || desc.includes('warehouse'))
      return trace('INDUSTRIAL' as SiteClass, parcel?.source || 'County CAD', pConf);
    if (luc.startsWith('C') || luc.startsWith('F') || desc.includes('commercial') || desc.includes('retail') || desc.includes('office'))
      return trace('COMMERCIAL' as SiteClass, parcel?.source || 'County CAD', pConf);
    if (luc.startsWith('A') || desc.includes('farm') || desc.includes('agricultural') || desc.includes('crop'))
      return trace('AGRICULTURAL' as SiteClass, parcel?.source || 'County CAD', pConf);
    if (luc.startsWith('D') || luc.startsWith('E') || luc.startsWith('R') || desc.includes('residential') || desc.includes('single family'))
      return trace('RESIDENTIAL' as SiteClass, parcel?.source || 'County CAD', pConf);
    if (luc.startsWith('X') || desc.includes('vacant') || devPct < 10)
      return trace('VACANT' as SiteClass, parcel?.source || 'County CAD', pConf);
  }

  // Priority 2: Zoning
  if (zoning?.confidence !== 'UNAVAILABLE' && zoningCode) {
    if (zoningCode.startsWith('I')) return trace('INDUSTRIAL' as SiteClass, zoning?.source || 'Zoning', 'INFERRED');
    if (zoningCode.startsWith('C') || zoningCode.startsWith('B')) return trace('COMMERCIAL' as SiteClass, zoning?.source || 'Zoning', 'INFERRED');
    if (zoningCode.startsWith('R') || zoningCode.startsWith('SF')) return trace('RESIDENTIAL' as SiteClass, zoning?.source || 'Zoning', 'INFERRED');
    if (zoningCode.startsWith('A') || zoningCode.startsWith('AG')) return trace('AGRICULTURAL' as SiteClass, zoning?.source || 'Zoning', 'INFERRED');
  }

  // Priority 3: Land cover
  if (landCover?.confidence !== 'UNAVAILABLE') {
    if (cropPct > 50) return trace('AGRICULTURAL' as SiteClass, 'USGS NLCD 2021', 'INFERRED');
    if (devPct > 60) return trace('COMMERCIAL' as SiteClass, 'USGS NLCD 2021', 'INFERRED');
    if (devPct > 20) return trace('RESIDENTIAL' as SiteClass, 'USGS NLCD 2021', 'INFERRED');
    if (devPct < 10) return trace('VACANT' as SiteClass, 'USGS NLCD 2021', 'INFERRED');
  }

  return trace('UNKNOWN' as SiteClass, 'Unable to determine — manual verification required', 'UNAVAILABLE');
}

// ── Current use detection (priority order) ────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function detectCurrentUse(parcel: any, zoning: any, landCover: any, notes: string): TracedValue<CurrentUse> {
  const n = notes.toLowerCase();
  const parcelDesc = String(parcel?.landUseDescription || '').toLowerCase();
  const pConf = parcel?.confidence || 'UNAVAILABLE';

  function classify(text: string): CurrentUse | null {
    if (text.includes('dry clean') || text.includes('laundry')) return 'dryCleaner';
    if (text.includes('gas station') || text.includes('fuel') || text.includes('service station')) return 'gasStation';
    if (text.includes('auto repair') || text.includes('mechanic') || text.includes('body shop')) return 'auto';
    if (text.includes('industrial') || text.includes('manufactur') || text.includes('warehouse')) return 'industrial';
    if (text.includes('landfill') || text.includes('dump') || text.includes('waste')) return 'landfill';
    if (text.includes('restaurant') || text.includes('food') || text.includes('cafe')) return 'restaurant';
    if (text.includes('office') || text.includes('professional services')) return 'office';
    if (text.includes('retail') || text.includes('shopping') || text.includes('commercial')) return 'retail';
    if (text.includes('residential') || text.includes('house') || text.includes('apartment')) return 'residential';
    if (text.includes('agricultural') || text.includes('farm') || text.includes('crop')) return 'agricultural';
    if (text.includes('vacant') || text.includes('undeveloped') || text.includes('empty lot')) return 'vacant';
    return null;
  }

  // Priority 1: Parcel (most reliable)
  if (pConf !== 'UNAVAILABLE' && parcelDesc) {
    const use = classify(parcelDesc);
    if (use) return trace(use, parcel?.source || 'County CAD', pConf as 'VERIFIED' | 'INFERRED');
  }

  // Priority 2: Zoning description
  const zDesc = String(zoning?.zoningDescription || '').toLowerCase();
  if (zoning?.confidence !== 'UNAVAILABLE' && zDesc) {
    const use = classify(zDesc);
    if (use) return trace(use, zoning?.source || 'Zoning', 'INFERRED',
      'Inferred from zoning classification — parcel-level verification recommended');
  }

  // Priority 3: Land cover
  if (landCover?.confidence !== 'UNAVAILABLE') {
    if ((landCover?.cultivatedCropPercent || 0) > 50)
      return trace('agricultural', 'USGS NLCD 2021', 'INFERRED', 'Inferred from land cover — parcel verification recommended');
    if ((landCover?.developedPercent || 0) < 15)
      return trace('vacant', 'USGS NLCD 2021', 'INFERRED', 'Inferred from land cover — parcel verification recommended');
  }

  // Priority 4: Field notes (lowest confidence)
  if (n.length > 10) {
    const use = classify(n);
    if (use) return trace(use, 'Field notes (manual entry)', 'INFERRED',
      'Inferred from field notes — parcel data verification recommended. Slight uncertainty adjustment applied.');
  }

  return trace('unknown', 'Unable to determine from automated sources', 'UNAVAILABLE',
    'Manual verification required — current use unknown increases risk conservatively');
}

// ── Main scoring function ─────────────────────────────────────────────────────
export function computeCetoScore(input: ScoredInput): ScoreOutput {
  const redFlags: string[] = [];
  const explanations: ScoreExplanation[] = [];

  // ── SITE CLASS ADJUSTMENTS ────────────────────────────────────────────────
  const sc = input.siteClass.value;
  const scm = {
    INDUSTRIAL:   { reg: 1.20, hist: 1.15, cur: 1.20, wet: 1.00, soil: 1.15 },
    COMMERCIAL:   { reg: 1.05, hist: 1.05, cur: 1.10, wet: 1.00, soil: 1.00 },
    AGRICULTURAL: { reg: 1.00, hist: 1.00, cur: 1.00, wet: 1.20, soil: 1.10 },
    RESIDENTIAL:  { reg: 1.10, hist: 1.05, cur: 1.00, wet: 1.10, soil: 1.00 },
    VACANT:       { reg: 1.00, hist: 1.00, cur: 1.00, wet: 1.00, soil: 1.00 },
    PUBLIC:       { reg: 0.90, hist: 0.95, cur: 0.90, wet: 1.00, soil: 1.00 },
    UNKNOWN:      { reg: 1.05, hist: 1.00, cur: 1.05, wet: 1.00, soil: 1.00 },
  }[sc] ?? { reg: 1.0, hist: 1.0, cur: 1.0, wet: 1.0, soil: 1.0 };

  // ── FIX 2+3: REGULATORY RISK — actual facility types + distance ───────────
  const facilities = input.facilitiesNearby.value;
  const { risk: facilityRisk, highestWeight, highestType, closestMi } = computeFacilityRisk(
    facilities,
    input.facilitiesAdjacent,
    input.knownReleaseOnSite
  );

  const migrationRisk = { downgradient: 0, cross: 0, unknown: 15, upgradient: 30 }[input.migrationDirection] ?? 15;
  const complianceRisk = input.hasActiveCleanup ? 80
    : input.hasOpenEnforcement ? 60
    : input.hasViolations ? 40
    : input.facilitiesCount.value > 0 ? 20 : 0;

  const regulatoryRisk = cap((facilityRisk + migrationRisk + complianceRisk) * scm.reg);

  // ── HISTORICAL USE RISK ───────────────────────────────────────────────────
  const historicalRisk = cap((HISTORICAL_USE_RISK[input.historicalUse] ?? 20) * scm.hist);

  // ── CURRENT USE RISK — FIX 5: confidence penalty visible ─────────────────
  const cuEntry = CURRENT_USE_RISK[input.currentUse.value] ?? CURRENT_USE_RISK.unknown;
  const cuConfPenalty = input.currentUse.confidence === 'UNAVAILABLE' ? 1.12
    : input.currentUse.confidence === 'INFERRED' ? 1.05 : 1.0;
  const currentUseRisk = cap(cuEntry.risk * scm.cur * cuConfPenalty);
  const cuPenaltyApplied = cuConfPenalty > 1.0;

  // ── WETLAND / WATER RISK ──────────────────────────────────────────────────
  const hydric = input.hydricPercent.value;
  const nwiRisk = input.wetlandsPresent.value ? (input.nwiOnSite ? 90 : input.nwiAdjacent ? 60 : 30) : 0;
  const hydricRisk = hydric > 50 ? 40 : hydric > 0 ? 20 : 0;
  const drainRisk = { well: 0, moderate: 10, poor: 25, unknown: 5 }[input.drainage.value as string] ?? 5;
  const surfaceRisk = input.surfaceWaterWithin500ft ? 15 : 0;
  const wetlandRisk = cap((nwiRisk + hydricRisk + drainRisk + surfaceRisk) * scm.wet);

  // ── FLOOD RISK ────────────────────────────────────────────────────────────
  const fz = input.floodZone.value;
  const floodRisk = input.inFloodway ? 100
    : (fz.startsWith('AE') || fz === 'A') ? 60
    : fz === 'X500' ? 20 : 0;

  // ── SOIL / GEOLOGY RISK ───────────────────────────────────────────────────
  const shrinkRisk = { low: 0, moderate: 10, high: 20, unknown: 5 }[input.shrinkSwell] ?? 5;
  const permRisk = { low: 0, moderate: 10, high: 25, unknown: 5 }[input.permeability] ?? 5;
  const karstRisk = { none: 0, possible: 25, mapped: 50 }[input.karst] ?? 0;
  const soilRisk = cap((shrinkRisk + permRisk + karstRisk) * scm.soil);

  // ── FIELD OBSERVATION RISK ────────────────────────────────────────────────
  const fieldRisk = FIELD_SCORES[input.fieldObservation] ?? 0;

  // ── WEIGHTED RAW RISK (pure environmental, NO data gap penalty) ───────────
  const rawRisk =
    (regulatoryRisk  * 0.25) +
    (historicalRisk  * 0.12) +
    (currentUseRisk  * 0.13) +
    (wetlandRisk     * 0.15) +
    (floodRisk       * 0.10) +
    (soilRisk        * 0.15) +
    (fieldRisk       * 0.10);

  const rawRiskScore = Math.round(rawRisk);

  // ── DATA COMPLETENESS (fully separate from risk math) ────────────────────
  const gaps = input.dataGaps;
  const missingItems: string[] = [];
  const verifiedItems: string[] = [];

  if (gaps.soilsUnavailable) missingItems.push('USDA SSURGO soils data');
  else verifiedItems.push(`Soils: ${input.soilSeries.value} — ${input.soilSeries.source} (${input.soilSeries.confidence})`);

  if (gaps.geologyUnavailable) missingItems.push('USGS geology formation');
  else verifiedItems.push(`Geology: ${input.geology.value} — ${input.geology.source} (${input.geology.confidence})`);

  if (gaps.parcelUnavailable) missingItems.push('County appraisal district parcel data');
  else verifiedItems.push(`Parcel: ${input.siteClass.value} — ${input.siteClass.source} (${input.siteClass.confidence})`);

  if (gaps.historicalAerialsUnavailable) missingItems.push('Historical aerial imagery pre-1950');
  else verifiedItems.push('Historical records review');

  if (gaps.tceqManualRequired) missingItems.push('TCEQ STEERS (manual search required)');
  if (gaps.noSiteRecon) missingItems.push('Site reconnaissance not performed');
  else verifiedItems.push('Site reconnaissance completed');

  if (gaps.noHistoricalRecords) missingItems.push('Historical records (Sanborn maps, city directories)');
  else verifiedItems.push('Historical use review');

  const completenessScore = Math.max(40, Math.round(100 - (missingItems.length * 11)));

  // ── CONFIDENCE MULTIPLIER ─────────────────────────────────────────────────
  const missingCritical = (gaps.noSiteRecon ? 1 : 0) + (gaps.noHistoricalRecords ? 1 : 0);
  const missingMajor = (gaps.soilsUnavailable ? 1 : 0) + (gaps.geologyUnavailable ? 1 : 0) + (gaps.parcelUnavailable ? 1 : 0);
  const confidenceMultiplier = Math.min(1.35, 1 + (missingCritical * 0.08) + (missingMajor * 0.03));

  // ── RED FLAGS + SEVERITY ──────────────────────────────────────────────────
  if (input.knownReleaseOnSite)                        redFlags.push('Known release on-site');
  if (input.formerGasStation)                          redFlags.push('Former gas station — UST/petroleum risk');
  if (input.formerDryCleaner)                          redFlags.push('Former dry cleaner — chlorinated solvent risk');
  if (input.formerIndustrial)                          redFlags.push('Former industrial use');
  if (input.wetlandsPresent.value && input.nwiOnSite)  redFlags.push('Mapped wetland on-site (USFWS NWI)');
  if (input.inFloodway)                                redFlags.push('Located in FEMA floodway');
  if (input.fieldObservation === 'release')            redFlags.push('Release evidence observed — field reconnaissance');
  if (input.fieldObservation === 'ust')                redFlags.push('UST/AST evidence observed — field reconnaissance');
  if (input.currentUse.value === 'gasStation')         redFlags.push('Current use: active gas station');
  if (input.currentUse.value === 'dryCleaner')         redFlags.push('Current use: dry cleaner');
  if (input.currentUse.value === 'auto' && (sc === 'INDUSTRIAL' || sc === 'COMMERCIAL')) redFlags.push('Current use: auto repair/service facility');
  if (fz.startsWith('AE'))                             redFlags.push('FEMA Zone AE — Special Flood Hazard Area');
  if (input.hasActiveCleanup)                          redFlags.push('Active cleanup site within 1 mile');

  const severityMultiplier = redFlags.length >= 3 ? 1.60 : redFlags.length === 2 ? 1.35 : redFlags.length === 1 ? 1.15 : 1.0;

  // ── CORRECTED + FINAL SCORE ───────────────────────────────────────────────
  const correctedRisk = Math.min(100, rawRisk * confidenceMultiplier * severityMultiplier);
  const correctedScore = Math.round(100 - correctedRisk);

  let ceiling = 100;
  if (input.knownReleaseOnSite)                        ceiling = Math.min(ceiling, 42);
  if (input.formerDryCleaner)                          ceiling = Math.min(ceiling, 62);
  if (input.formerGasStation)                          ceiling = Math.min(ceiling, 62);
  if (input.currentUse.value === 'dryCleaner')         ceiling = Math.min(ceiling, 55);
  if (input.currentUse.value === 'gasStation')         ceiling = Math.min(ceiling, 60);
  if (input.wetlandsPresent.value && input.nwiOnSite)  ceiling = Math.min(ceiling, 68);
  if (input.inFloodway)                                ceiling = Math.min(ceiling, 68);
  if (gaps.noSiteRecon)                                ceiling = Math.min(ceiling, 78);
  if (gaps.noHistoricalRecords)                        ceiling = Math.min(ceiling, 73);

  const finalScore = Math.min(correctedScore, ceiling);

  // ── RATING ────────────────────────────────────────────────────────────────
  const rating = finalScore >= 90 ? 'Low Risk'
    : finalScore >= 75 ? 'Moderate-Low Risk'
    : finalScore >= 60 ? 'Moderate Risk'
    : finalScore >= 40 ? 'Elevated Risk' : 'High Risk';

  const ratingCode = (finalScore >= 90 ? 'LOW' : finalScore >= 75 ? 'MODERATE_LOW' : finalScore >= 60 ? 'MODERATE' : finalScore >= 40 ? 'ELEVATED' : 'HIGH') as ScoreOutput['ratingCode'];

  // ── EXPLANATIONS — FIX 1: traced rendered, FIX 5: confidence notes ────────
  if (regulatoryRisk === 0)
    explanations.push({ category: 'Regulatory', points: 25, sign: '+', reason: 'No regulated facilities within 1 mile', traced: `EPA ECHO API — ${input.facilitiesCount.confidence} · ${input.facilitiesCount.timestamp}` });
  else {
    const distNote = closestMi !== null ? ` (nearest: ${closestMi.toFixed(2)} mi)` : '';
    const typeNote = highestType !== 'None' && highestType !== 'default' ? ` — ${highestType} weighted ×${highestWeight.toFixed(1)}` : '';
    explanations.push({ category: 'Regulatory', points: -Math.round(regulatoryRisk * 0.25), sign: '-', reason: `${input.facilitiesCount.value} facility(ies) within 1 mile${distNote}${typeNote}`, traced: `EPA ECHO API — ${input.facilitiesNearby.confidence} · ${input.facilitiesCount.timestamp}` });
  }

  if (historicalRisk <= 12)
    explanations.push({ category: 'Historical Use', points: 12, sign: '+', reason: `Low-risk historical use: ${input.historicalUse}` });
  else
    explanations.push({ category: 'Historical Use', points: -Math.round(historicalRisk * 0.12), sign: '-', reason: `Elevated historical use: ${input.historicalUse}` });

  if (currentUseRisk <= 15)
    explanations.push({ category: 'Current Use', points: 13, sign: '+', reason: cuEntry.label, traced: `${input.currentUse.source} — ${input.currentUse.confidence} · ${input.currentUse.timestamp}`, confidenceNote: cuPenaltyApplied ? input.currentUse.note : undefined });
  else
    explanations.push({ category: 'Current Use', points: -Math.round(currentUseRisk * 0.13), sign: '-', reason: cuEntry.label, traced: `${input.currentUse.source} — ${input.currentUse.confidence} · ${input.currentUse.timestamp}`, confidenceNote: cuPenaltyApplied ? input.currentUse.note : undefined });

  if (wetlandRisk === 0)
    explanations.push({ category: 'Wetlands', points: 15, sign: '+', reason: 'No wetlands mapped on-site or adjacent', traced: `USFWS NWI — ${input.wetlandsPresent.confidence} · ${input.wetlandsPresent.timestamp}` });
  else
    explanations.push({ category: 'Wetlands', points: -Math.round(wetlandRisk * 0.15), sign: '-', reason: `Wetland indicators present — ${hydric}% hydric soils`, traced: `USFWS NWI (${input.wetlandsPresent.confidence}), USDA SSURGO (${input.hydricPercent.confidence}) · ${input.hydricPercent.timestamp}` });

  if (floodRisk === 0)
    explanations.push({ category: 'Flood', points: 10, sign: '+', reason: `FEMA Zone ${fz} — outside SFHA`, traced: `FEMA NFHL — ${input.floodZone.confidence} · ${input.floodZone.timestamp}` });
  else
    explanations.push({ category: 'Flood', points: -Math.round(floodRisk * 0.10), sign: '-', reason: `FEMA Zone ${fz} — flood hazard present`, traced: `FEMA NFHL — ${input.floodZone.confidence} · ${input.floodZone.timestamp}` });

  if (soilRisk <= 10)
    explanations.push({ category: 'Soils / Geology', points: 15, sign: '+', reason: 'Low permeability — limits contaminant migration', traced: `USDA SSURGO — ${input.soilSeries.confidence} · ${input.soilSeries.timestamp}` });
  else
    explanations.push({ category: 'Soils / Geology', points: -Math.round(soilRisk * 0.15), sign: '-', reason: `Shrink-swell: ${input.shrinkSwell}, permeability: ${input.permeability}`, traced: `USDA SSURGO — ${input.soilSeries.confidence} · ${input.soilSeries.timestamp}` });

  if (fieldRisk === 0)
    explanations.push({ category: 'Field Observations', points: 10, sign: '+', reason: 'No environmental concerns observed during reconnaissance' });
  else
    explanations.push({ category: 'Field Observations', points: -Math.round(fieldRisk * 0.10), sign: '-', reason: `Observation: ${input.fieldObservation}` });

  // Site class adjustment explanation
  if (sc === 'INDUSTRIAL')
    explanations.push({ category: 'Site Class', points: -3, sign: '-', reason: 'Industrial classification — elevated risk thresholds applied', traced: `${input.siteClass.source} — ${input.siteClass.confidence}` });
  else if (sc === 'PUBLIC')
    explanations.push({ category: 'Site Class', points: 3, sign: '+', reason: 'Government/public ownership — reduced risk multipliers', traced: `${input.siteClass.source} — ${input.siteClass.confidence}` });

  // Data completeness note — informational only, NOT in score
  if (missingItems.length > 0)
    explanations.push({ category: 'Data Completeness', points: 0, sign: '~', reason: `${missingItems.length} gap(s) noted — affects confidence multiplier (×${confidenceMultiplier.toFixed(2)}), not risk score` });

  if (ceiling < 100)
    explanations.push({ category: 'Red Flag Ceiling', points: -(100 - ceiling), sign: '-', reason: `Hard ceiling: max ${ceiling}/100 — ${redFlags[0]}` });

  // ── REASON + ACTION ───────────────────────────────────────────────────────
  const negatives = explanations.filter(e => e.sign === '-' && e.category !== 'Data Completeness');
  const reason = negatives.length > 0
    ? negatives.map(e => e.reason).join('; ') + '.'
    : 'No significant environmental concerns identified based on available data and site reconnaissance.';

  const recommendedAction = ratingCode === 'HIGH' || ratingCode === 'ELEVATED'
    ? 'Phase II ESA strongly recommended prior to any property transaction.'
    : ratingCode === 'MODERATE'
    ? 'Review flagged items. Phase II ESA recommended if transaction is risk-sensitive.'
    : ratingCode === 'MODERATE_LOW'
    ? 'No Phase II ESA required. Complete manual TCEQ STEERS search and verify flagged items.'
    : 'No further environmental investigation recommended based on the scope of services performed.';

  const dealImpact: DealImpact = {
    estimatedLiability: finalScore >= 88 ? 'Minimal (<$25K)' : finalScore >= 75 ? '$25K–$150K (Phase II dependent)' : finalScore >= 55 ? '$150K–$1M (remediation possible)' : '>$1M (significant remediation likely)',
    phase2Likelihood: finalScore >= 88 ? '<5%' : finalScore >= 75 ? '10–25%' : finalScore >= 55 ? '40–70%' : '>80%',
    permittingDelayRisk: wetlandRisk > 30 || floodRisk > 30 ? 'Moderate–High (6–18 months potential)' : 'Low (<60 days)',
    developmentConstraintRisk: (wetlandRisk > 60 || floodRisk > 60) ? 'High' : wetlandRisk > 20 || floodRisk > 20 ? 'Moderate' : 'Low',
    cleanupRisk: finalScore >= 82 ? 'Low' : finalScore >= 62 ? 'Moderate' : 'High',
    lenderConcern: finalScore >= 82 ? 'None — no environmental contingency recommended' : finalScore >= 68 ? 'Low — monitor flagged items' : 'Moderate — lender may require Phase II prior to closing',
  };

  return {
    finalScore, rawRiskScore, confidenceScore: completenessScore,
    correctedScore, ceiling,
    confidenceMultiplier: Math.round(confidenceMultiplier * 100) / 100,
    severityMultiplier, rating, ratingCode,
    breakdown: {
      regulatory: Math.round(regulatoryRisk), historicalUse: Math.round(historicalRisk),
      currentUse: Math.round(currentUseRisk), wetland: Math.round(wetlandRisk),
      flood: Math.round(floodRisk), soil: Math.round(soilRisk), field: Math.round(fieldRisk),
    },
    explanations, dataCompleteness: { score: completenessScore, missingItems, verifiedItems },
    redFlags, reason, recommendedAction, dealImpact,
    // FIX 4: full confidence in header
    siteClass: sc,
    siteClassConfidence: input.siteClass.confidence,
    siteClassSource: input.siteClass.source,
    currentUseLabel: cuEntry.label,
    currentUseConfidence: input.currentUse.confidence,
    currentUseSource: input.currentUse.source,
    currentUseNote: input.currentUse.note,
    tracedInputs: {
      hydricPercent: input.hydricPercent,
      floodZone: input.floodZone,
      wetlandsPresent: input.wetlandsPresent,
      facilitiesCount: input.facilitiesCount,
      currentUse: input.currentUse,
      siteClass: input.siteClass,
      soilSeries: input.soilSeries,
      geology: input.geology,
    },
  };
}

// ── Derive full ScoredInput from live reg + parcel data ───────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deriveScoreInput(reg: any, parcelData: any, fieldNotes: string): ScoredInput {
  const notes = fieldNotes || '';
  const n = notes.toLowerCase();
  const parcel = parcelData?.parcel;
  const zoning = parcelData?.zoning;
  const landCover = parcelData?.landCover;

  const hydricPercent = trace(
    reg?.soils?.hydricPercent || 0,
    'USDA NRCS SSURGO via Soil Data Access',
    reg?.soils?.mapUnits?.length ? 'VERIFIED' : 'UNAVAILABLE'
  );

  const floodZone = trace(
    reg?.fema?.floodZone || 'X',
    'FEMA NFHL ArcGIS REST',
    reg?.fema?.floodZone ? 'VERIFIED' : 'INFERRED'
  );

  const wetlandsPresent = trace(
    reg?.nwi?.wetlandsPresent || false,
    'USFWS NWI ArcGIS REST',
    reg?.nwi ? 'VERIFIED' : 'UNAVAILABLE'
  );

  const facilitiesCount = trace(
    reg?.epaEcho?.totalCount || 0,
    'EPA ECHO API — 1-mile radius query',
    reg?.epaEcho ? 'VERIFIED' : 'UNAVAILABLE'
  );

  // FIX 2: Pass actual facility data with type info for weighting
  const facilitiesNearby = trace(
    (reg?.epaEcho?.facilitiesNearby || []).map((f: {name: string; type: string; violations: string; distanceMi?: number; program?: string}) => ({
      name: f.name,
      type: f.type,
      program: f.type, // use type as program for weight lookup
      distanceMi: f.distanceMi ?? undefined,
    })),
    'EPA ECHO API',
    reg?.epaEcho ? 'VERIFIED' : 'UNAVAILABLE'
  );

  const soilSeries = trace(
    reg?.soils?.mapUnits?.[0]?.name || 'Unknown',
    'USDA NRCS SSURGO',
    reg?.soils?.mapUnits?.length ? 'VERIFIED' : 'UNAVAILABLE'
  );

  const geology = trace(
    reg?.geology?.formation || 'Unknown',
    'Macrostrat / USGS NGMDB',
    (reg?.geology?.formation && reg?.geology?.formation !== 'Unknown') ? 'VERIFIED' : 'UNAVAILABLE'
  );

  const elevation = trace(
    reg?.elevation?.elevationFt || null,
    'USGS National Elevation Dataset',
    reg?.elevation?.elevationFt ? 'VERIFIED' : 'UNAVAILABLE'
  );

  const currentUse = detectCurrentUse(parcel, zoning, landCover, notes);
  const siteClass = classifySite(parcel, zoning, landCover);

  const rawDrainage = reg?.soils?.mapUnits?.[0]?.drainage?.toLowerCase() || '';
  const drainage = trace(
    rawDrainage.includes('poor') ? 'poor' : rawDrainage.includes('moderate') ? 'moderate' : rawDrainage.includes('well') ? 'well' : 'unknown',
    'USDA NRCS SSURGO',
    reg?.soils?.mapUnits?.length ? 'VERIFIED' : 'UNAVAILABLE'
  );

  const shrinkSwell = reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('high') ? 'high'
    : reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('moderate') ? 'moderate'
    : reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('low') ? 'low'
    : 'unknown';

  const fieldObservation = n.includes('release') || n.includes('spill') ? 'release'
    : n.includes('ust') || (n.includes('tank') && !n.includes('water tank')) ? 'ust'
    : n.includes('odor') || n.includes('sheen') ? 'odor'
    : n.includes('drum') || n.includes('container') ? 'drums'
    : n.includes('stain') ? 'staining'
    : n.includes('debris') || n.includes('trash') ? 'debris'
    : 'none';

  function classifyHistorical(): CurrentUse {
    if (n.includes('dry clean')) return 'dryCleaner';
    if (n.includes('gas station') || n.includes('fuel station')) return 'gasStation';
    if (n.includes('industrial') || n.includes('manufactur')) return 'industrial';
    if (n.includes('auto repair') || n.includes('mechanic')) return 'auto';
    if (n.includes('landfill') || n.includes('dump')) return 'landfill';
    if (n.includes('commercial') || n.includes('retail')) return 'retail';
    if (n.includes('residential') || n.includes('house')) return 'residential';
    if (n.includes('vacant') || n.includes('undeveloped')) return 'vacant';
    if (n.includes('agricultural') || n.includes('farm')) return 'agricultural';
    return 'unknown';
  }

  const historicalUse = classifyHistorical();

  return {
    hydricPercent, floodZone, wetlandsPresent, facilitiesCount, facilitiesNearby,
    soilSeries, geology, elevation, currentUse, siteClass, drainage,
    knownReleaseOnSite: n.includes('release') && n.includes('on-site'),
    migrationDirection: 'unknown',
    hasViolations: reg?.epaEcho?.facilitiesNearby?.some((f: {violations: string}) => f.violations?.includes('Active')) || false,
    hasActiveCleanup: false,
    hasOpenEnforcement: false,
    facilitiesWithinHalfMile: 0,
    facilitiesAdjacent: false,
    historicalUse,
    nwiOnSite: reg?.nwi?.wetlandsPresent || false,
    nwiAdjacent: false,
    surfaceWaterWithin500ft: reg?.hydrology?.nearbyStreams?.length > 0,
    inFloodway: (reg?.fema?.floodZone || '') === 'FLOODWAY',
    shrinkSwell: shrinkSwell as ScoredInput['shrinkSwell'],
    permeability: 'unknown',
    karst: 'none',
    fieldObservation: fieldObservation as ScoredInput['fieldObservation'],
    formerGasStation: historicalUse === 'gasStation',
    formerDryCleaner: historicalUse === 'dryCleaner',
    formerIndustrial: historicalUse === 'industrial',
    dataGaps: {
      soilsUnavailable: !reg?.soils?.mapUnits?.length,
      geologyUnavailable: !reg?.geology?.formation || reg?.geology?.formation === 'Unknown',
      parcelUnavailable: !parcel || parcel?.confidence === 'UNAVAILABLE',
      historicalAerialsUnavailable: true,
      tceqManualRequired: true,
      noSiteRecon: notes.trim().length < 30,
      noHistoricalRecords: false,
    },
  };
}
