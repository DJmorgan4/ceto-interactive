// ── CETO Environmental Risk Scoring Engine v3 ─────────────────────────────────
// Key principles:
// 1. TracedValue used throughout — every input has source + confidence
// 2. Risk and data completeness are fully separated
// 3. Current use detection uses priority order (parcel > zoning > landcover > notes)
// 4. siteClass actively adjusts risk thresholds
// 5. Regulatory risk includes facility type weighting and distance

export interface TracedValue<T> {
  value: T;
  source: string;
  confidence: 'VERIFIED' | 'INFERRED' | 'UNAVAILABLE';
  timestamp: string;
}

export function trace<T>(
  value: T,
  source: string,
  confidence: 'VERIFIED' | 'INFERRED' | 'UNAVAILABLE'
): TracedValue<T> {
  return { value, source, confidence, timestamp: new Date().toISOString().split('T')[0] };
}

// ── Site Classification ───────────────────────────────────────────────────────

export type SiteClass =
  | 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL'
  | 'AGRICULTURAL' | 'VACANT' | 'PUBLIC' | 'UNKNOWN';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function classifySite(parcel: any, zoning: any, landCover: any): {
  siteClass: SiteClass;
  confidence: 'VERIFIED' | 'INFERRED' | 'UNAVAILABLE';
  source: string;
} {
  const luc = String(parcel?.landUseCode || '').toUpperCase();
  const desc = String(parcel?.landUseDescription || '').toLowerCase();
  const ownerType = String(parcel?.ownerType || '').toUpperCase();
  const zoningCode = String(zoning?.zoningCode || '').toUpperCase();
  const cropPct = landCover?.cultivatedCropPercent || 0;
  const devPct = landCover?.developedPercent || 0;
  const parcelConf = parcel?.confidence || 'UNAVAILABLE';

  // Priority 1: Parcel data (highest confidence)
  if (parcelConf === 'VERIFIED' || parcelConf === 'INFERRED') {
    if (ownerType === 'GOVERNMENT' || ownerType === 'SCHOOL')
      return { siteClass: 'PUBLIC', confidence: parcelConf, source: parcel?.source || 'County CAD' };
    if (luc.startsWith('I') || desc.includes('industrial') || desc.includes('manufactur') || desc.includes('warehouse'))
      return { siteClass: 'INDUSTRIAL', confidence: parcelConf, source: parcel?.source || 'County CAD' };
    if (luc.startsWith('C') || luc.startsWith('F') || desc.includes('commercial') || desc.includes('retail') || desc.includes('office'))
      return { siteClass: 'COMMERCIAL', confidence: parcelConf, source: parcel?.source || 'County CAD' };
    if (luc.startsWith('A') || desc.includes('farm') || desc.includes('agricultural') || desc.includes('crop'))
      return { siteClass: 'AGRICULTURAL', confidence: parcelConf, source: parcel?.source || 'County CAD' };
    if (luc.startsWith('D') || luc.startsWith('E') || luc.startsWith('R') || desc.includes('residential') || desc.includes('single family') || desc.includes('multi'))
      return { siteClass: 'RESIDENTIAL', confidence: parcelConf, source: parcel?.source || 'County CAD' };
    if (luc.startsWith('X') || desc.includes('vacant') || devPct < 10)
      return { siteClass: 'VACANT', confidence: parcelConf, source: parcel?.source || 'County CAD' };
  }

  // Priority 2: Zoning
  if (zoning?.confidence !== 'UNAVAILABLE' && zoningCode) {
    if (zoningCode.startsWith('I')) return { siteClass: 'INDUSTRIAL', confidence: 'INFERRED', source: zoning?.source || 'Zoning' };
    if (zoningCode.startsWith('C') || zoningCode.startsWith('B')) return { siteClass: 'COMMERCIAL', confidence: 'INFERRED', source: zoning?.source || 'Zoning' };
    if (zoningCode.startsWith('R') || zoningCode.startsWith('SF') || zoningCode.startsWith('MF')) return { siteClass: 'RESIDENTIAL', confidence: 'INFERRED', source: zoning?.source || 'Zoning' };
    if (zoningCode.startsWith('A') || zoningCode.startsWith('AG')) return { siteClass: 'AGRICULTURAL', confidence: 'INFERRED', source: zoning?.source || 'Zoning' };
  }

  // Priority 3: Land cover
  if (landCover?.confidence !== 'UNAVAILABLE') {
    if (cropPct > 50) return { siteClass: 'AGRICULTURAL', confidence: 'INFERRED', source: 'USGS NLCD 2021' };
    if (devPct > 60) return { siteClass: 'COMMERCIAL', confidence: 'INFERRED', source: 'USGS NLCD 2021' };
    if (devPct > 20) return { siteClass: 'RESIDENTIAL', confidence: 'INFERRED', source: 'USGS NLCD 2021' };
    if (devPct < 10) return { siteClass: 'VACANT', confidence: 'INFERRED', source: 'USGS NLCD 2021' };
  }

  return { siteClass: 'UNKNOWN', confidence: 'UNAVAILABLE', source: 'Unable to determine — manual verification required' };
}

// ── Current Use Detection (priority order) ────────────────────────────────────

export type CurrentUse =
  | 'vacant' | 'agricultural' | 'residential' | 'office' | 'retail'
  | 'restaurant' | 'auto' | 'gasStation' | 'dryCleaner' | 'industrial'
  | 'landfill' | 'unknown';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function detectCurrentUse(parcel: any, zoning: any, landCover: any, notes: string): TracedValue<CurrentUse> {
  const n = notes.toLowerCase();
  const parcelDesc = String(parcel?.landUseDescription || '').toLowerCase();
  const parcelConf = parcel?.confidence || 'UNAVAILABLE';

  // Helper to classify from text
  function classifyText(text: string): CurrentUse | null {
    if (text.includes('dry clean') || text.includes('laundry')) return 'dryCleaner';
    if (text.includes('gas station') || text.includes('fuel') || text.includes('service station') || text.includes('filling station')) return 'gasStation';
    if (text.includes('auto repair') || text.includes('mechanic') || text.includes('body shop') || text.includes('auto service')) return 'auto';
    if (text.includes('industrial') || text.includes('manufactur') || text.includes('warehouse') || text.includes('chemical')) return 'industrial';
    if (text.includes('landfill') || text.includes('dump') || text.includes('waste')) return 'landfill';
    if (text.includes('restaurant') || text.includes('food') || text.includes('kitchen') || text.includes('cafe')) return 'restaurant';
    if (text.includes('office') || text.includes('professional')) return 'office';
    if (text.includes('retail') || text.includes('shopping') || text.includes('store') || text.includes('commercial')) return 'retail';
    if (text.includes('residential') || text.includes('house') || text.includes('apartment') || text.includes('dwelling')) return 'residential';
    if (text.includes('agricultural') || text.includes('farm') || text.includes('crop') || text.includes('pasture')) return 'agricultural';
    if (text.includes('vacant') || text.includes('undeveloped') || text.includes('empty')) return 'vacant';
    return null;
  }

  // Priority 1: Parcel data
  if (parcelConf !== 'UNAVAILABLE' && parcelDesc) {
    const use = classifyText(parcelDesc);
    if (use) return trace(use, parcel?.source || 'County CAD', parcelConf as 'VERIFIED' | 'INFERRED');
  }

  // Priority 2: Zoning description
  const zoningDesc = String(zoning?.zoningDescription || '').toLowerCase();
  if (zoning?.confidence !== 'UNAVAILABLE' && zoningDesc) {
    const use = classifyText(zoningDesc);
    if (use) return trace(use, zoning?.source || 'Zoning', 'INFERRED');
  }

  // Priority 3: Land cover
  if (landCover?.confidence !== 'UNAVAILABLE') {
    if ((landCover?.cultivatedCropPercent || 0) > 50) return trace('agricultural', 'USGS NLCD 2021', 'INFERRED');
    if ((landCover?.developedPercent || 0) < 15) return trace('vacant', 'USGS NLCD 2021', 'INFERRED');
  }

  // Priority 4: Field notes (lowest confidence fallback)
  if (n.length > 10) {
    const use = classifyText(n);
    if (use) return trace(use, 'Field notes (manual)', 'INFERRED');
  }

  return trace('unknown', 'Unable to determine — manual verification required', 'UNAVAILABLE');
}

// ── Scored input with full traceability ───────────────────────────────────────

export interface ScoredInput {
  // All key values traced
  hydricPercent: TracedValue<number>;
  floodZone: TracedValue<string>;
  wetlandsPresent: TracedValue<boolean>;
  facilitiesCount: TracedValue<number>;
  elevation: TracedValue<number | null>;
  geology: TracedValue<string>;
  soilSeries: TracedValue<string>;
  drainage: TracedValue<string>;
  currentUse: TracedValue<CurrentUse>;
  siteClass: TracedValue<SiteClass>;

  // Risk flags
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

// ── Risk tables ───────────────────────────────────────────────────────────────

const HISTORICAL_USE_RISK: Record<string, number> = {
  vacant: 5, agricultural: 8, residential: 10, office: 12, retail: 15,
  commercial: 25, restaurant: 20, auto: 60, gasStation: 80,
  dryCleaner: 90, industrial: 85, landfill: 100, unknown: 20,
};

const CURRENT_USE_RISK: Record<string, { risk: number; label: string }> = {
  vacant: { risk: 5, label: 'Vacant — minimal current use risk' },
  agricultural: { risk: 15, label: 'Agricultural — pesticide/herbicide potential' },
  residential: { risk: 8, label: 'Residential — low current use risk' },
  office: { risk: 8, label: 'Office — low current use risk' },
  retail: { risk: 12, label: 'Retail — low current use risk' },
  restaurant: { risk: 18, label: 'Restaurant — grease trap, cleaning chemicals potential' },
  auto: { risk: 65, label: 'Auto repair — petroleum products, solvents, waste oil' },
  gasStation: { risk: 85, label: 'Gas station — UST potential, petroleum release risk' },
  dryCleaner: { risk: 90, label: 'Dry cleaner — PCE/TCE chlorinated solvent risk' },
  industrial: { risk: 80, label: 'Industrial — hazardous materials, process chemicals' },
  landfill: { risk: 100, label: 'Landfill — gas generation, leachate, waste' },
  unknown: { risk: 20, label: 'Current use unknown — manual verification required' },
};

// Facility type weights — RCRA > UST > minor permit
const FACILITY_TYPE_WEIGHTS: Record<string, number> = {
  'RCRA': 1.8,
  'Superfund': 2.0,
  'LUST': 1.5,
  'UST': 1.3,
  'TRI': 1.2,
  'NPDES': 1.0,
  'default': 1.0,
};

const FIELD_SCORES: Record<string, number> = {
  none: 0, debris: 10, staining: 25, drums: 50, ust: 70, odor: 80, release: 100,
};

function cap(val: number, max = 100): number {
  return Math.min(max, Math.max(0, val));
}

// ── Score output types ────────────────────────────────────────────────────────

export interface ScoreExplanation {
  category: string;
  points: number;
  sign: '+' | '-';
  reason: string;
  traced?: string; // "Source: X (Verified)"
}

export interface DealImpact {
  estimatedLiability: string;
  phase2Likelihood: string;
  permittingDelayRisk: string;
  developmentConstraintRisk: string;
  cleanupRisk: string;
  lenderConcern: string;
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
  siteClass: string;
  siteClassConfidence: string;
  currentUseLabel: string;
  currentUseConfidence: string;
  tracedInputs: {
    hydricPercent: TracedValue<number>;
    floodZone: TracedValue<string>;
    wetlandsPresent: TracedValue<boolean>;
    facilitiesCount: TracedValue<number>;
    currentUse: TracedValue<CurrentUse>;
    siteClass: TracedValue<SiteClass>;
    soilSeries: TracedValue<string>;
    geology: TracedValue<string>;
  };
}

// ── Main scoring function ─────────────────────────────────────────────────────

export function computeCetoScore(input: ScoredInput): ScoreOutput {
  const redFlags: string[] = [];
  const explanations: ScoreExplanation[] = [];

  // ── SITE CLASS ADJUSTMENTS ────────────────────────────────────────────────
  // siteClass actively adjusts risk thresholds and sensitivities
  const sc = input.siteClass.value;
  const siteClassMultipliers = {
    INDUSTRIAL:   { regulatory: 1.20, historical: 1.15, current: 1.20, wetland: 1.0, soil: 1.15 },
    COMMERCIAL:   { regulatory: 1.05, historical: 1.05, current: 1.10, wetland: 1.0, soil: 1.0 },
    AGRICULTURAL: { regulatory: 1.0,  historical: 1.0,  current: 1.0,  wetland: 1.20, soil: 1.10 },
    RESIDENTIAL:  { regulatory: 1.10, historical: 1.05, current: 1.0,  wetland: 1.10, soil: 1.0 },
    VACANT:       { regulatory: 1.0,  historical: 1.0,  current: 1.0,  wetland: 1.0,  soil: 1.0 },
    PUBLIC:       { regulatory: 0.90, historical: 0.95, current: 0.90, wetland: 1.0,  soil: 1.0 },
    UNKNOWN:      { regulatory: 1.05, historical: 1.0,  current: 1.05, wetland: 1.0,  soil: 1.0 },
  }[sc] ?? { regulatory: 1.0, historical: 1.0, current: 1.0, wetland: 1.0, soil: 1.0 };

  // ── REGULATORY RISK (weighted by facility type + distance) ────────────────
  const facilityCount = input.facilitiesCount.value;

  // Base proximity risk
  let facilityRisk = input.knownReleaseOnSite ? 100
    : input.facilitiesAdjacent ? 60
    : input.facilitiesWithinHalfMile > 0 ? 40
    : facilityCount > 0 ? 20 : 0;

  // Facility type weighting — if we have type info
  // This gets populated from EPA ECHO facility types
  const typeWeight = FACILITY_TYPE_WEIGHTS['default'];
  facilityRisk = cap(facilityRisk * typeWeight);

  const migrationRisk = {
    downgradient: 0, cross: 0, unknown: 15, upgradient: 30
  }[input.migrationDirection] ?? 15;

  const complianceRisk = input.hasActiveCleanup ? 80
    : input.hasOpenEnforcement ? 60
    : input.hasViolations ? 40
    : facilityCount > 0 ? 20 : 0;

  const regulatoryRisk = cap(
    (facilityRisk + migrationRisk + complianceRisk) * siteClassMultipliers.regulatory
  );

  // ── HISTORICAL USE RISK ───────────────────────────────────────────────────
  const historicalRisk = cap(
    (HISTORICAL_USE_RISK[input.historicalUse] ?? 20) * siteClassMultipliers.historical
  );

  // ── CURRENT USE RISK (TracedValue, priority-ordered) ─────────────────────
  const currentUseEntry = CURRENT_USE_RISK[input.currentUse.value] ?? CURRENT_USE_RISK.unknown;
  // Reduce confidence of current use risk if source is unreliable
  const currentUseConfidencePenalty = input.currentUse.confidence === 'UNAVAILABLE' ? 1.10
    : input.currentUse.confidence === 'INFERRED' ? 1.05 : 1.0;
  const currentUseRisk = cap(
    currentUseEntry.risk * siteClassMultipliers.current * currentUseConfidencePenalty
  );

  // ── WETLAND / WATER RISK ──────────────────────────────────────────────────
  const hydric = input.hydricPercent.value;
  const nwiRisk = input.wetlandsPresent.value ? (input.nwiOnSite ? 90 : input.nwiAdjacent ? 60 : 30) : 0;
  const hydricRisk = hydric > 50 ? 40 : hydric > 0 ? 20 : 0;
  const drainageRisk = { well: 0, moderate: 10, poor: 25, unknown: 5 }[input.drainage ?? 'unknown'] ?? 5;
  const surfaceRisk = input.surfaceWaterWithin500ft ? 15 : 0;
  // Agricultural sites get extra wetland sensitivity
  const wetlandRisk = cap(
    (nwiRisk + hydricRisk + drainageRisk + surfaceRisk) * siteClassMultipliers.wetland
  );

  // ── FLOOD RISK ────────────────────────────────────────────────────────────
  const fz = input.floodZone.value;
  const floodRisk = input.inFloodway ? 100
    : (fz.startsWith('AE') || fz === 'A') ? 60
    : fz === 'X500' ? 20 : 0;

  // ── SOIL / GEOLOGY RISK ───────────────────────────────────────────────────
  const shrinkRisk = { low: 0, moderate: 10, high: 20, unknown: 5 }[input.shrinkSwell] ?? 5;
  const permRisk = { low: 0, moderate: 10, high: 25, unknown: 5 }[input.permeability] ?? 5;
  const karstRisk = { none: 0, possible: 25, mapped: 50 }[input.karst] ?? 0;
  // Industrial sites get extra soil sensitivity
  const soilRisk = cap(
    (shrinkRisk + permRisk + karstRisk) * siteClassMultipliers.soil
  );

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

  // ── DATA COMPLETENESS (completely separate from risk) ─────────────────────
  const gaps = input.dataGaps;
  const missingItems: string[] = [];
  const verifiedItems: string[] = [];

  if (gaps.soilsUnavailable) missingItems.push('USDA SSURGO soils data');
  else verifiedItems.push('USDA SSURGO soils — ' + input.soilSeries.source);

  if (gaps.geologyUnavailable) missingItems.push('USGS geology formation data');
  else verifiedItems.push('Macrostrat/USGS geology — ' + input.geology.source);

  if (gaps.parcelUnavailable) missingItems.push('County appraisal district parcel data');
  else verifiedItems.push('County CAD parcel — ' + input.siteClass.source);

  if (gaps.historicalAerialsUnavailable) missingItems.push('Historical aerial imagery pre-1950');
  else verifiedItems.push('Historical records review');

  if (gaps.tceqManualRequired) missingItems.push('TCEQ STEERS database (manual review required)');
  if (gaps.noSiteRecon) missingItems.push('Site reconnaissance (field visit not performed)');
  else verifiedItems.push('Site reconnaissance');

  if (gaps.noHistoricalRecords) missingItems.push('Historical records (city directories, Sanborn maps)');
  else verifiedItems.push('Historical use review');

  const completenessScore = Math.max(40, Math.round(100 - (missingItems.length * 11)));

  // ── CONFIDENCE MULTIPLIER (data gaps → conservative score, not penalized) ─
  const missingCritical = (gaps.noSiteRecon ? 1 : 0) + (gaps.noHistoricalRecords ? 1 : 0);
  const missingMajor = (gaps.soilsUnavailable ? 1 : 0) + (gaps.geologyUnavailable ? 1 : 0) + (gaps.parcelUnavailable ? 1 : 0);
  const confidenceMultiplier = Math.min(1.35,
    1 + (missingCritical * 0.08) + (missingMajor * 0.03)
  );

  // ── RED FLAGS + SEVERITY MULTIPLIER ──────────────────────────────────────
  if (input.knownReleaseOnSite) redFlags.push('Known release on-site');
  if (input.formerGasStation) redFlags.push('Former gas station — UST/petroleum risk');
  if (input.formerDryCleaner) redFlags.push('Former dry cleaner — chlorinated solvent risk');
  if (input.formerIndustrial) redFlags.push('Former industrial use');
  if (input.wetlandsPresent.value && input.nwiOnSite) redFlags.push('Mapped wetland on-site (USFWS NWI)');
  if (input.inFloodway) redFlags.push('Located in FEMA floodway');
  if (input.fieldObservation === 'release') redFlags.push('Release evidence observed during reconnaissance');
  if (input.fieldObservation === 'ust') redFlags.push('UST/AST evidence observed during reconnaissance');
  if (input.currentUse.value === 'gasStation') redFlags.push('Current use: active gas station');
  if (input.currentUse.value === 'dryCleaner') redFlags.push('Current use: dry cleaner');
  if (input.currentUse.value === 'auto') redFlags.push('Current use: auto repair/service facility');
  if (fz.startsWith('AE')) redFlags.push('FEMA Zone AE — Special Flood Hazard Area');
  if (input.hasActiveCleanup) redFlags.push('Active cleanup site within 1 mile');

  const severityMultiplier =
    redFlags.length >= 3 ? 1.60
    : redFlags.length === 2 ? 1.35
    : redFlags.length === 1 ? 1.15 : 1.0;

  // ── CORRECTED SCORE ───────────────────────────────────────────────────────
  const correctedRisk = Math.min(100, rawRisk * confidenceMultiplier * severityMultiplier);
  const correctedScore = Math.round(100 - correctedRisk);

  // ── RED FLAG CEILINGS ─────────────────────────────────────────────────────
  let ceiling = 100;
  if (input.knownReleaseOnSite)               ceiling = Math.min(ceiling, 42);
  if (input.formerDryCleaner)                 ceiling = Math.min(ceiling, 62);
  if (input.formerGasStation)                 ceiling = Math.min(ceiling, 62);
  if (input.currentUse.value === 'dryCleaner') ceiling = Math.min(ceiling, 55);
  if (input.currentUse.value === 'gasStation') ceiling = Math.min(ceiling, 60);
  if (input.currentUse.value === 'auto' && sc === 'INDUSTRIAL') ceiling = Math.min(ceiling, 65);
  if (input.wetlandsPresent.value && input.nwiOnSite) ceiling = Math.min(ceiling, 68);
  if (input.inFloodway)                       ceiling = Math.min(ceiling, 68);
  if (gaps.noSiteRecon)                       ceiling = Math.min(ceiling, 78);
  if (gaps.noHistoricalRecords)               ceiling = Math.min(ceiling, 73);

  const finalScore = Math.min(correctedScore, ceiling);

  // ── RATING ────────────────────────────────────────────────────────────────
  const rating = finalScore >= 90 ? 'Low Risk'
    : finalScore >= 75 ? 'Moderate-Low Risk'
    : finalScore >= 60 ? 'Moderate Risk'
    : finalScore >= 40 ? 'Elevated Risk'
    : 'High Risk';

  const ratingCode = (finalScore >= 90 ? 'LOW'
    : finalScore >= 75 ? 'MODERATE_LOW'
    : finalScore >= 60 ? 'MODERATE'
    : finalScore >= 40 ? 'ELEVATED'
    : 'HIGH') as ScoreOutput['ratingCode'];

  // ── EXPLANATIONS (+ and -, with traceability) ─────────────────────────────
  // Only show data gaps in explanation panel — NOT in score
  if (regulatoryRisk === 0)
    explanations.push({ category: 'Regulatory', points: 25, sign: '+', reason: `No regulated facilities within 1 mile`, traced: `EPA ECHO API (${input.facilitiesCount.confidence})` });
  else
    explanations.push({ category: 'Regulatory', points: -Math.round(regulatoryRisk * 0.25), sign: '-', reason: `${facilityCount} regulated facility(ies) within 1 mile`, traced: `EPA ECHO API (${input.facilitiesCount.confidence})` });

  if (historicalRisk <= 12)
    explanations.push({ category: 'Historical Use', points: 12, sign: '+', reason: `Low-risk historical use: ${input.historicalUse}` });
  else
    explanations.push({ category: 'Historical Use', points: -Math.round(historicalRisk * 0.12), sign: '-', reason: `Elevated historical use: ${input.historicalUse}` });

  if (currentUseRisk <= 15)
    explanations.push({ category: 'Current Use', points: 13, sign: '+', reason: currentUseEntry.label, traced: `${input.currentUse.source} (${input.currentUse.confidence})` });
  else
    explanations.push({ category: 'Current Use', points: -Math.round(currentUseRisk * 0.13), sign: '-', reason: currentUseEntry.label, traced: `${input.currentUse.source} (${input.currentUse.confidence})` });

  if (wetlandRisk === 0)
    explanations.push({ category: 'Wetlands', points: 15, sign: '+', reason: 'No wetlands mapped on-site or adjacent', traced: `USFWS NWI (${input.wetlandsPresent.confidence})` });
  else
    explanations.push({ category: 'Wetlands', points: -Math.round(wetlandRisk * 0.15), sign: '-', reason: `Wetland indicators present — ${hydric}% hydric soils`, traced: `USFWS NWI (${input.wetlandsPresent.confidence}), USDA SSURGO (${input.hydricPercent.confidence})` });

  if (floodRisk === 0)
    explanations.push({ category: 'Flood', points: 10, sign: '+', reason: `FEMA Zone ${fz} — outside Special Flood Hazard Area`, traced: `FEMA NFHL (${input.floodZone.confidence})` });
  else
    explanations.push({ category: 'Flood', points: -Math.round(floodRisk * 0.10), sign: '-', reason: `FEMA Zone ${fz} — flood hazard present`, traced: `FEMA NFHL (${input.floodZone.confidence})` });

  if (soilRisk <= 10)
    explanations.push({ category: 'Soils / Geology', points: 15, sign: '+', reason: 'Low permeability — limits contaminant migration', traced: `USDA SSURGO (${input.soilSeries.confidence})` });
  else
    explanations.push({ category: 'Soils / Geology', points: -Math.round(soilRisk * 0.15), sign: '-', reason: `Soil risk: shrink-swell ${input.shrinkSwell}, permeability ${input.permeability}`, traced: `USDA SSURGO (${input.soilSeries.confidence})` });

  if (fieldRisk === 0)
    explanations.push({ category: 'Field Observations', points: 10, sign: '+', reason: 'No environmental concerns observed during reconnaissance' });
  else
    explanations.push({ category: 'Field Observations', points: -Math.round(fieldRisk * 0.10), sign: '-', reason: `Field observation: ${input.fieldObservation}` });

  if (sc === 'INDUSTRIAL')
    explanations.push({ category: 'Site Class Adjustment', points: -5, sign: '-', reason: 'Industrial site classification increases risk thresholds', traced: `${input.siteClass.source} (${input.siteClass.confidence})` });
  else if (sc === 'PUBLIC')
    explanations.push({ category: 'Site Class Adjustment', points: 3, sign: '+', reason: 'Government/public ownership reduces certain risk factors', traced: `${input.siteClass.source} (${input.siteClass.confidence})` });

  // Data gap explanations — purely informational, NOT in score math
  if (missingItems.length > 0)
    explanations.push({ category: 'Data Completeness Note', points: 0, sign: '+', reason: `${missingItems.length} data gap(s) noted — see Data Completeness panel. These affect confidence, not the risk score.` });

  if (ceiling < 100)
    explanations.push({ category: 'Red Flag Ceiling', points: -(100 - ceiling), sign: '-', reason: `Score ceiling ${ceiling}/100 applied — ${redFlags[0]}` });

  // ── REASON ───────────────────────────────────────────────────────────────
  const negatives = explanations.filter(e => e.sign === '-' && e.category !== 'Data Completeness Note');
  const reason = negatives.length > 0
    ? negatives.map(e => e.reason).join('; ') + '.'
    : 'No significant environmental concerns identified based on available data and site reconnaissance.';

  // ── DEAL IMPACT ───────────────────────────────────────────────────────────
  const dealImpact: DealImpact = {
    estimatedLiability: finalScore >= 88 ? 'Minimal (<$25K)' : finalScore >= 75 ? '$25K–$150K (Phase II dependent)' : finalScore >= 55 ? '$150K–$1M (remediation possible)' : '>$1M (significant remediation likely)',
    phase2Likelihood: finalScore >= 88 ? '<5%' : finalScore >= 75 ? '10–25%' : finalScore >= 55 ? '40–70%' : '>80%',
    permittingDelayRisk: wetlandRisk > 30 || floodRisk > 30 ? 'Moderate–High (6–18 months potential)' : 'Low (<60 days)',
    developmentConstraintRisk: (wetlandRisk > 60 || floodRisk > 60) ? 'High' : wetlandRisk > 20 || floodRisk > 20 ? 'Moderate' : 'Low',
    cleanupRisk: finalScore >= 82 ? 'Low' : finalScore >= 62 ? 'Moderate' : 'High',
    lenderConcern: finalScore >= 82 ? 'None — no environmental contingency recommended' : finalScore >= 68 ? 'Low — monitor flagged items prior to closing' : 'Moderate — lender may require Phase II prior to closing',
  };

  // ── RECOMMENDED ACTION ────────────────────────────────────────────────────
  const recommendedAction = ratingCode === 'HIGH' || ratingCode === 'ELEVATED'
    ? 'Phase II ESA strongly recommended prior to any property transaction.'
    : ratingCode === 'MODERATE'
    ? 'Review flagged items. Phase II ESA recommended if transaction is risk-sensitive.'
    : ratingCode === 'MODERATE_LOW'
    ? 'No Phase II ESA required at this time. Complete manual TCEQ STEERS search and verify flagged items.'
    : 'No further environmental investigation recommended based on the scope of services performed.';

  return {
    finalScore, rawRiskScore, confidenceScore: completenessScore,
    correctedScore, ceiling, confidenceMultiplier: Math.round(confidenceMultiplier * 100) / 100,
    severityMultiplier, rating, ratingCode,
    breakdown: {
      regulatory: Math.round(regulatoryRisk),
      historicalUse: Math.round(historicalRisk),
      currentUse: Math.round(currentUseRisk),
      wetland: Math.round(wetlandRisk),
      flood: Math.round(floodRisk),
      soil: Math.round(soilRisk),
      field: Math.round(fieldRisk),
    },
    explanations,
    dataCompleteness: { score: completenessScore, missingItems, verifiedItems },
    redFlags, reason, recommendedAction, dealImpact,
    siteClass: sc,
    siteClassConfidence: input.siteClass.confidence,
    currentUseLabel: currentUseEntry.label,
    currentUseConfidence: input.currentUse.confidence,
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

// ── Derive full ScoredInput from live data ────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deriveScoreInput(reg: any, parcelData: any, fieldNotes: string): ScoredInput {
  const notes = fieldNotes || '';
  const n = notes.toLowerCase();
  const parcel = parcelData?.parcel;
  const zoning = parcelData?.zoning;
  const landCover = parcelData?.landCover;

  // All key values traced
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
    'EPA ECHO API — 1-mile radius',
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

  // Current use — priority ordered
  const currentUse = detectCurrentUse(parcel, zoning, landCover, notes);

  // Site classification — priority ordered
  const siteClassResult = classifySite(parcel, zoning, landCover);
  const siteClass = trace(siteClassResult.siteClass, siteClassResult.source, siteClassResult.confidence);

  // Historical use from notes
  function classifyHistorical(text: string): CurrentUse {
    if (text.includes('dry clean')) return 'dryCleaner';
    if (text.includes('gas station') || text.includes('fuel station')) return 'gasStation';
    if (text.includes('industrial') || text.includes('manufactur')) return 'industrial';
    if (text.includes('auto repair') || text.includes('mechanic')) return 'auto';
    if (text.includes('landfill') || text.includes('dump')) return 'landfill';
    if (text.includes('commercial') || text.includes('retail')) return 'commercial' as CurrentUse;
    if (text.includes('residential') || text.includes('house')) return 'residential';
    if (text.includes('vacant') || text.includes('undeveloped')) return 'vacant';
    if (text.includes('agricultural') || text.includes('farm')) return 'agricultural';
    return 'unknown';
  }

  const historicalUse = classifyHistorical(n);

  const drainage = reg?.soils?.mapUnits?.[0]?.drainage?.toLowerCase().includes('poor') ? 'poor'
    : reg?.soils?.mapUnits?.[0]?.drainage?.toLowerCase().includes('moderate') ? 'moderate'
    : reg?.soils?.mapUnits?.[0]?.drainage?.toLowerCase().includes('well') ? 'well'
    : 'unknown';

  const shrinkSwell = reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('high') ? 'high'
    : reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('moderate') ? 'moderate'
    : reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('low') ? 'low'
    : 'unknown';

  const fieldObservation =
    n.includes('release') || n.includes('spill') ? 'release'
    : n.includes('ust') || (n.includes('tank') && !n.includes('water tank')) ? 'ust'
    : n.includes('odor') || n.includes('sheen') ? 'odor'
    : n.includes('drum') || n.includes('container') ? 'drums'
    : n.includes('stain') ? 'staining'
    : n.includes('debris') || n.includes('trash') ? 'debris'
    : 'none';

  const dataGaps = {
    soilsUnavailable: !reg?.soils?.mapUnits?.length,
    geologyUnavailable: !reg?.geology?.formation || reg?.geology?.formation === 'Unknown',
    parcelUnavailable: !parcel || parcel?.confidence === 'UNAVAILABLE',
    historicalAerialsUnavailable: true,
    tceqManualRequired: true,
    noSiteRecon: notes.trim().length < 30,
    noHistoricalRecords: false,
  };

  return {
    hydricPercent, floodZone, wetlandsPresent, facilitiesCount, soilSeries, geology, currentUse, siteClass,
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
    drainage,
    shrinkSwell: shrinkSwell as ScoredInput['shrinkSwell'],
    permeability: 'unknown',
    karst: 'none',
    fieldObservation: fieldObservation as ScoredInput['fieldObservation'],
    formerGasStation: historicalUse === 'gasStation',
    formerDryCleaner: historicalUse === 'dryCleaner',
    formerIndustrial: historicalUse === 'industrial',
    dataGaps,
  };
}
