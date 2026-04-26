// ── CETO Environmental Risk Scoring Engine v2 ─────────────────────────────────
// Separation: riskScore (actual env risk) vs confidenceScore (data completeness)
// FinalScore = 100 - (rawRisk × confidenceMultiplier × severityMultiplier)
// Ceilings applied for red flags — a former dry cleaner CANNOT score 92

export interface TracedValue<T> {
  value: T;
  source: string;
  confidence: 'VERIFIED' | 'INFERRED' | 'UNAVAILABLE';
  timestamp: string;
}

export interface ScoreInput {
  // Regulatory
  facilitiesWithin1Mile: number;
  facilitiesWithinHalfMile: number;
  facilitiesAdjacent: boolean;
  knownReleaseOnSite: boolean;
  migrationDirection: 'downgradient' | 'cross' | 'unknown' | 'upgradient';
  hasViolations: boolean;
  hasActiveCleanup: boolean;
  hasOpenEnforcement: boolean;

  // Historical Use
  historicalUse: 'vacant'|'agricultural'|'residential'|'office'|'retail'|'commercial'|'auto'|'gasStation'|'dryCleaner'|'industrial'|'landfill'|'unknown';

  // Current Use (NEW — separate from historical)
  currentUse: 'vacant'|'agricultural'|'residential'|'office'|'retail'|'restaurant'|'auto'|'gasStation'|'dryCleaner'|'industrial'|'landfill'|'unknown';
  currentUseSource: string;
  currentUseConfidence: 'VERIFIED' | 'INFERRED' | 'UNAVAILABLE';

  // Site Classification
  siteClass: 'RESIDENTIAL'|'COMMERCIAL'|'INDUSTRIAL'|'AGRICULTURAL'|'VACANT'|'PUBLIC'|'UNKNOWN';

  // Wetland / Water
  nwiOnSite: boolean;
  nwiAdjacent: boolean;
  nwiWithin500ft: boolean;
  hydricPercent: number;
  drainage: 'well'|'moderate'|'poor'|'unknown';
  surfaceWaterOnSite: boolean;
  surfaceWaterWithin500ft: boolean;

  // Flood
  floodZone: string;
  inFloodway: boolean;

  // Soils / Geology
  shrinkSwell: 'low'|'moderate'|'high'|'unknown';
  permeability: 'low'|'moderate'|'high'|'unknown';
  karst: 'none'|'possible'|'mapped';

  // Field Observations
  fieldObservation: 'none'|'debris'|'staining'|'drums'|'ust'|'odor'|'release';

  // Data Gaps — SEPARATE from risk
  dataGaps: {
    soilsUnavailable: boolean;
    geologyUnavailable: boolean;
    parcelUnavailable: boolean;
    historicalAerialsUnavailable: boolean;
    tceqManualRequired: boolean;
    noSiteRecon: boolean;
    noHistoricalRecords: boolean;
  };

  // Red Flags — for ceiling calculation only
  formerGasStation: boolean;
  formerDryCleaner: boolean;
  formerIndustrial: boolean;
  mappedWetlandOnSite: boolean;
}

export interface ScoreExplanation {
  category: string;
  points: number;
  sign: '+' | '-';
  reason: string;
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
  // Scores
  finalScore: number;
  rawRiskScore: number;      // Pure environmental risk, 0-100
  confidenceScore: number;   // Data completeness, 0-100 (separate from risk)
  correctedScore: number;
  ceiling: number;

  // Multipliers
  confidenceMultiplier: number;
  severityMultiplier: number;

  // Rating
  rating: string;
  ratingCode: 'LOW'|'MODERATE_LOW'|'MODERATE'|'ELEVATED'|'HIGH';

  // Breakdown — risk scores per category (0-100 risk each)
  breakdown: {
    regulatory: number;
    historicalUse: number;
    currentUse: number;
    wetland: number;
    flood: number;
    soil: number;
    field: number;
  };

  // Explanation — why the score is what it is
  explanations: ScoreExplanation[];

  // Data completeness — separate panel
  dataCompleteness: {
    score: number; // 0-100
    missingItems: string[];
    verifiedItems: string[];
  };

  // Red flags and actions
  redFlags: string[];
  recommendedAction: string;
  reason: string;

  // Deal impact
  dealImpact: DealImpact;

  // Site classification
  siteClass: string;
  currentUseRisk: string;
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
  retail: { risk: 12, label: 'Retail — low to moderate current use risk' },
  restaurant: { risk: 18, label: 'Restaurant — grease trap, cleaning chemicals potential' },
  auto: { risk: 65, label: 'Auto repair — petroleum products, solvents, waste oil' },
  gasStation: { risk: 85, label: 'Gas station — UST potential, petroleum release risk' },
  dryCleaner: { risk: 90, label: 'Dry cleaner — PCE/TCE chlorinated solvent risk' },
  industrial: { risk: 80, label: 'Industrial — hazardous materials, process chemicals' },
  landfill: { risk: 100, label: 'Landfill — gas generation, leachate, waste' },
  unknown: { risk: 20, label: 'Current use unknown — manual verification required' },
};

const FIELD_SCORES: Record<string, number> = {
  none: 0, debris: 10, staining: 25, drums: 50, ust: 70, odor: 80, release: 100,
};

function cap(val: number, max = 100): number {
  return Math.min(max, Math.max(0, val));
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function computeCetoScore(input: ScoreInput): ScoreOutput {
  const redFlags: string[] = [];
  const explanations: ScoreExplanation[] = [];

  // ── RISK SCORES (0-100, higher = more risk) ───────────────────────────────

  // Regulatory risk
  const facilityRisk = input.knownReleaseOnSite ? 100
    : input.facilitiesAdjacent ? 60
    : input.facilitiesWithinHalfMile > 0 ? 40
    : input.facilitiesWithin1Mile > 0 ? 20 : 0;

  const migrationRisk = {
    downgradient: 0, cross: 0, unknown: 15, upgradient: 30
  }[input.migrationDirection] ?? 15;

  const complianceRisk = input.hasActiveCleanup ? 80
    : input.hasOpenEnforcement ? 60
    : input.hasViolations ? 40
    : input.facilitiesWithin1Mile > 0 ? 20 : 0;

  const regulatoryRisk = cap(facilityRisk + migrationRisk + complianceRisk);

  // Historical use risk
  const historicalRisk = HISTORICAL_USE_RISK[input.historicalUse] ?? 20;

  // Current use risk (NEW — weighted separately)
  const currentUseEntry = CURRENT_USE_RISK[input.currentUse] ?? CURRENT_USE_RISK.unknown;
  const currentUseRisk = currentUseEntry.risk;

  // Wetland / water risk
  const nwiRisk = input.nwiOnSite ? 90 : input.nwiAdjacent ? 60 : input.nwiWithin500ft ? 30 : 0;
  const hydricRisk = input.hydricPercent > 50 ? 40 : input.hydricPercent > 0 ? 20 : 0;
  const drainageRisk = { well: 0, moderate: 10, poor: 25, unknown: 5 }[input.drainage] ?? 5;
  const surfaceRisk = input.surfaceWaterOnSite ? 30 : input.surfaceWaterWithin500ft ? 15 : 0;
  const wetlandRisk = cap(nwiRisk + hydricRisk + drainageRisk + surfaceRisk);

  // Flood risk
  const floodRisk = input.inFloodway ? 100
    : (input.floodZone.startsWith('AE') || input.floodZone === 'A') ? 60
    : input.floodZone === 'X500' ? 20 : 0;

  // Soil / geology risk
  const shrinkRisk = { low: 0, moderate: 10, high: 20, unknown: 5 }[input.shrinkSwell] ?? 5;
  const permRisk = { low: 0, moderate: 10, high: 25, unknown: 5 }[input.permeability] ?? 5;
  const karstRisk = { none: 0, possible: 25, mapped: 50 }[input.karst] ?? 0;
  const soilRisk = cap(shrinkRisk + permRisk + karstRisk);

  // Field observation risk
  const fieldRisk = FIELD_SCORES[input.fieldObservation] ?? 0;

  // ── WEIGHTED RAW RISK (pure environmental, no data gap penalty) ────────────
  // Weights: regulatory 25%, historical 12%, current use 13%, wetland 15%,
  //          flood 10%, soil 15%, field 10%
  const rawRisk =
    (regulatoryRisk  * 0.25) +
    (historicalRisk  * 0.12) +
    (currentUseRisk  * 0.13) +
    (wetlandRisk     * 0.15) +
    (floodRisk       * 0.10) +
    (soilRisk        * 0.15) +
    (fieldRisk       * 0.10);

  const rawRiskScore = Math.round(rawRisk);

  // ── DATA COMPLETENESS (separate from risk score) ──────────────────────────
  const gaps = input.dataGaps;
  const missingItems: string[] = [];
  const verifiedItems: string[] = [];

  if (gaps.soilsUnavailable) missingItems.push('USDA SSURGO soils data');
  else verifiedItems.push('USDA SSURGO soils');

  if (gaps.geologyUnavailable) missingItems.push('USGS geology formation');
  else verifiedItems.push('Macrostrat/USGS geology');

  if (gaps.parcelUnavailable) missingItems.push('County appraisal district parcel data');
  else verifiedItems.push('County CAD parcel data');

  if (gaps.historicalAerialsUnavailable) missingItems.push('Historical aerial imagery pre-1950');
  else verifiedItems.push('Historical records review');

  if (gaps.tceqManualRequired) missingItems.push('TCEQ STEERS database (manual review required)');

  if (gaps.noSiteRecon) missingItems.push('Site reconnaissance (field visit not performed)');
  else verifiedItems.push('Site reconnaissance');

  if (gaps.noHistoricalRecords) missingItems.push('Historical records (city directories, Sanborn maps)');
  else verifiedItems.push('Historical use review');

  const completenessScore = Math.round(100 - (missingItems.length * 12));
  const confidenceScore = Math.max(40, completenessScore);

  // ── CONFIDENCE MULTIPLIER (based on data gaps, not environmental risk) ────
  const missingCritical = (gaps.noSiteRecon ? 1 : 0) + (gaps.noHistoricalRecords ? 1 : 0);
  const missingMajor = (gaps.soilsUnavailable ? 1 : 0) + (gaps.geologyUnavailable ? 1 : 0) + (gaps.parcelUnavailable ? 1 : 0);
  const confidenceMultiplier = Math.min(1.35, 1 + (missingCritical * 0.08) + (missingMajor * 0.03));

  // ── RED FLAGS + SEVERITY MULTIPLIER ──────────────────────────────────────
  if (input.knownReleaseOnSite) redFlags.push('Known release on-site');
  if (input.formerGasStation) redFlags.push('Former gas station — UST/petroleum risk');
  if (input.formerDryCleaner) redFlags.push('Former dry cleaner — chlorinated solvent risk');
  if (input.formerIndustrial) redFlags.push('Former industrial use');
  if (input.mappedWetlandOnSite) redFlags.push('Mapped wetland on-site (USFWS NWI)');
  if (input.inFloodway) redFlags.push('Located in FEMA floodway');
  if (input.fieldObservation === 'release') redFlags.push('Release evidence observed during reconnaissance');
  if (input.fieldObservation === 'ust') redFlags.push('UST/AST evidence observed');
  if (input.currentUse === 'gasStation') redFlags.push('Current use: active gas station');
  if (input.currentUse === 'dryCleaner') redFlags.push('Current use: dry cleaner');
  if (input.currentUse === 'auto') redFlags.push('Current use: auto repair/service');
  if (input.floodZone.startsWith('AE')) redFlags.push('FEMA Zone AE — Special Flood Hazard Area');
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
  if (input.knownReleaseOnSite)  ceiling = Math.min(ceiling, 42);
  if (input.formerDryCleaner)    ceiling = Math.min(ceiling, 62);
  if (input.formerGasStation)    ceiling = Math.min(ceiling, 62);
  if (input.currentUse === 'dryCleaner') ceiling = Math.min(ceiling, 55);
  if (input.currentUse === 'gasStation') ceiling = Math.min(ceiling, 60);
  if (input.mappedWetlandOnSite) ceiling = Math.min(ceiling, 68);
  if (input.inFloodway)          ceiling = Math.min(ceiling, 68);
  if (gaps.noSiteRecon)          ceiling = Math.min(ceiling, 78);
  if (gaps.noHistoricalRecords)  ceiling = Math.min(ceiling, 73);

  const finalScore = Math.min(correctedScore, ceiling);

  // ── RATING ────────────────────────────────────────────────────────────────
  const rating = finalScore >= 90 ? 'Low Risk'
    : finalScore >= 75 ? 'Moderate-Low Risk'
    : finalScore >= 60 ? 'Moderate Risk'
    : finalScore >= 40 ? 'Elevated Risk'
    : 'High Risk';

  const ratingCode = finalScore >= 90 ? 'LOW'
    : finalScore >= 75 ? 'MODERATE_LOW'
    : finalScore >= 60 ? 'MODERATE'
    : finalScore >= 40 ? 'ELEVATED'
    : 'HIGH';

  // ── EXPLANATIONS (+ and - contributions) ─────────────────────────────────
  if (regulatoryRisk === 0)
    explanations.push({ category: 'Regulatory', points: 25, sign: '+', reason: 'No regulated facilities within 1 mile (EPA ECHO)' });
  else
    explanations.push({ category: 'Regulatory', points: -Math.round(regulatoryRisk * 0.25), sign: '-', reason: `${input.facilitiesWithin1Mile} regulated facility(ies) within 1 mile` });

  if (historicalRisk <= 10)
    explanations.push({ category: 'Historical Use', points: 12, sign: '+', reason: `Low-risk historical use: ${input.historicalUse}` });
  else
    explanations.push({ category: 'Historical Use', points: -Math.round(historicalRisk * 0.12), sign: '-', reason: `Elevated historical use: ${input.historicalUse}` });

  if (currentUseRisk <= 15)
    explanations.push({ category: 'Current Use', points: 13, sign: '+', reason: currentUseEntry.label });
  else
    explanations.push({ category: 'Current Use', points: -Math.round(currentUseRisk * 0.13), sign: '-', reason: currentUseEntry.label });

  if (wetlandRisk === 0)
    explanations.push({ category: 'Wetlands', points: 15, sign: '+', reason: 'No wetlands mapped on-site or adjacent (USFWS NWI)' });
  else
    explanations.push({ category: 'Wetlands', points: -Math.round(wetlandRisk * 0.15), sign: '-', reason: `Wetland indicators present — ${input.hydricPercent}% hydric soils` });

  if (floodRisk === 0)
    explanations.push({ category: 'Flood', points: 10, sign: '+', reason: `FEMA Zone ${input.floodZone} — outside Special Flood Hazard Area` });
  else
    explanations.push({ category: 'Flood', points: -Math.round(floodRisk * 0.10), sign: '-', reason: `FEMA Zone ${input.floodZone} — flood hazard present` });

  if (soilRisk <= 10)
    explanations.push({ category: 'Soils / Geology', points: 15, sign: '+', reason: 'Low permeability soils — limits contaminant migration' });
  else
    explanations.push({ category: 'Soils / Geology', points: -Math.round(soilRisk * 0.15), sign: '-', reason: `Soil risk: shrink-swell ${input.shrinkSwell}, permeability ${input.permeability}` });

  if (fieldRisk === 0)
    explanations.push({ category: 'Field Observations', points: 10, sign: '+', reason: 'No environmental concerns observed during site reconnaissance' });
  else
    explanations.push({ category: 'Field Observations', points: -Math.round(fieldRisk * 0.10), sign: '-', reason: `Field observation: ${input.fieldObservation}` });

  if (missingItems.length > 0)
    explanations.push({ category: 'Data Gaps', points: -Math.round((missingItems.length * 2)), sign: '-', reason: `${missingItems.length} data gap(s): ${missingItems.slice(0,2).join(', ')}` });

  if (ceiling < 100)
    explanations.push({ category: 'Red Flag Ceiling', points: -(100 - ceiling), sign: '-', reason: `Score ceiling ${ceiling}/100 — ${redFlags[0] || 'red flag applied'}` });

  // ── REASON STRING ─────────────────────────────────────────────────────────
  const negatives = explanations.filter(e => e.sign === '-');
  const reason = negatives.length > 0
    ? negatives.map(e => e.reason).join('; ') + '.'
    : 'No significant environmental concerns identified based on available data and site reconnaissance.';

  // ── DEAL IMPACT ───────────────────────────────────────────────────────────
  const dealImpact: DealImpact = {
    estimatedLiability: finalScore >= 85 ? 'Minimal (<$25K)' : finalScore >= 70 ? '$25K–$150K (Phase II dependent)' : finalScore >= 50 ? '$150K–$1M (remediation possible)' : '>$1M (significant remediation likely)',
    phase2Likelihood: finalScore >= 85 ? '<5%' : finalScore >= 70 ? '10–25%' : finalScore >= 50 ? '40–70%' : '>80%',
    permittingDelayRisk: wetlandRisk > 30 || floodRisk > 30 ? 'Moderate–High (6–18 months)' : 'Low (<60 days)',
    developmentConstraintRisk: (wetlandRisk > 60 || floodRisk > 60) ? 'High' : wetlandRisk > 20 || floodRisk > 20 ? 'Moderate' : 'Low',
    cleanupRisk: finalScore >= 80 ? 'Low' : finalScore >= 60 ? 'Moderate' : 'High',
    lenderConcern: finalScore >= 80 ? 'None — no environmental contingency recommended' : finalScore >= 65 ? 'Low — monitor flagged items' : 'Moderate — lender may require Phase II prior to closing',
  };

  // ── RECOMMENDED ACTION ────────────────────────────────────────────────────
  const recommendedAction = ratingCode === 'HIGH' || ratingCode === 'ELEVATED'
    ? 'Phase II ESA strongly recommended prior to any property transaction. Do not proceed without further investigation.'
    : ratingCode === 'MODERATE'
    ? 'Review flagged items carefully. Phase II ESA recommended if transaction is sensitive to environmental risk.'
    : ratingCode === 'MODERATE_LOW'
    ? 'No Phase II ESA required. Complete manual TCEQ STEERS search and verify flagged items.'
    : 'No further environmental investigation recommended. Site appears suitable for intended use.';

  return {
    finalScore, rawRiskScore, confidenceScore, correctedScore, ceiling,
    confidenceMultiplier: Math.round(confidenceMultiplier * 100) / 100,
    severityMultiplier,
    rating, ratingCode,
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
    dataCompleteness: { score: confidenceScore, missingItems, verifiedItems },
    redFlags, reason, recommendedAction, dealImpact,
    siteClass: input.siteClass,
    currentUseRisk: currentUseEntry.label,
  };
}

// ── Site classifier ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function classifySite(parcel: any, zoning: any, landCover: any): string {
  const luc = String(parcel?.landUseCode || '').toUpperCase();
  const desc = String(parcel?.landUseDescription || '').toLowerCase();
  const ownerType = String(parcel?.ownerType || '').toUpperCase();
  const zoningCode = String(zoning?.zoningCode || '').toUpperCase();
  const cropPct = landCover?.cultivatedCropPercent || 0;
  const devPct = landCover?.developedPercent || 0;

  if (ownerType === 'GOVERNMENT' || ownerType === 'SCHOOL') return 'PUBLIC';
  if (luc.startsWith('I') || zoningCode.startsWith('I') || desc.includes('industrial') || desc.includes('manufactur')) return 'INDUSTRIAL';
  if (luc.startsWith('C') || luc.startsWith('F') || zoningCode.startsWith('C') || desc.includes('commercial') || desc.includes('retail') || desc.includes('office')) return 'COMMERCIAL';
  if (luc.startsWith('A') || cropPct > 50 || desc.includes('farm') || desc.includes('agricultural') || desc.includes('crop')) return 'AGRICULTURAL';
  if (luc.startsWith('D') || luc.startsWith('E') || luc.startsWith('R') || zoningCode.startsWith('R') || desc.includes('residential') || desc.includes('single family') || desc.includes('multi')) return 'RESIDENTIAL';
  if (luc.startsWith('X') || desc.includes('vacant') || devPct < 10) return 'VACANT';
  return 'UNKNOWN';
}

// ── Derive ScoreInput from live reg + parcel data ─────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deriveScoreInput(reg: any, parcelData: any, fieldNotes: string): ScoreInput {
  const notes = (fieldNotes || '').toLowerCase();
  const parcel = parcelData?.parcel;
  const zoning = parcelData?.zoning;
  const landCover = parcelData?.landCover;

  // Field observation from notes
  const fieldObservation =
    notes.includes('release') || notes.includes('spill') ? 'release'
    : notes.includes('ust') || notes.includes('tank') || notes.includes('ast') ? 'ust'
    : notes.includes('odor') || notes.includes('sheen') ? 'odor'
    : notes.includes('drum') || notes.includes('container') ? 'drums'
    : notes.includes('stain') ? 'staining'
    : notes.includes('debris') || notes.includes('trash') ? 'debris'
    : 'none';

  // Historical use from notes
  const historicalUse =
    notes.includes('dry clean') ? 'dryCleaner'
    : notes.includes('gas station') || notes.includes('fuel station') || notes.includes('service station') ? 'gasStation'
    : notes.includes('industrial') || notes.includes('manufactur') || notes.includes('chemical plant') ? 'industrial'
    : notes.includes('auto repair') || notes.includes('mechanic') || notes.includes('body shop') ? 'auto'
    : notes.includes('landfill') || notes.includes('dump') ? 'landfill'
    : notes.includes('commercial') || notes.includes('retail') || notes.includes('shopping') ? 'commercial'
    : notes.includes('residential') || notes.includes('house') || notes.includes('apartments') ? 'residential'
    : notes.includes('vacant') || notes.includes('undeveloped') ? 'vacant'
    : notes.includes('agricultural') || notes.includes('farm') || notes.includes('crop') ? 'agricultural'
    : 'unknown';

  // Current use — from parcel data first, then notes
  const parcelClass = String(parcel?.propertyClass || '').toLowerCase();
  const parcelDesc = String(parcel?.landUseDescription || '').toLowerCase();
  const currentUse =
    parcelDesc.includes('dry clean') ? 'dryCleaner'
    : parcelDesc.includes('gas station') || parcelDesc.includes('fuel') ? 'gasStation'
    : parcelDesc.includes('auto') || parcelDesc.includes('repair') ? 'auto'
    : parcelDesc.includes('industrial') || parcelDesc.includes('manufactur') ? 'industrial'
    : parcelDesc.includes('restaurant') || parcelDesc.includes('food') ? 'restaurant'
    : parcelDesc.includes('retail') || parcelDesc.includes('commercial') || parcelClass === 'commercial' ? 'retail'
    : parcelDesc.includes('residential') || parcelClass === 'residential' ? 'residential'
    : parcelDesc.includes('vacant') || parcelClass === 'vacant' ? 'vacant'
    : parcelDesc.includes('agricultural') || parcelClass === 'agricultural' ? 'agricultural'
    : notes.includes('office') ? 'office'
    : 'unknown';

  const currentUseConfidence: 'VERIFIED' | 'INFERRED' | 'UNAVAILABLE' =
    parcel?.confidence === 'VERIFIED' ? 'VERIFIED'
    : parcel?.confidence === 'INFERRED' ? 'INFERRED'
    : 'UNAVAILABLE';

  // Site classification
  const siteClass = classifySite(parcel, zoning, landCover) as ScoreInput['siteClass'];

  // Soil properties
  const drainage = reg?.soils?.mapUnits?.[0]?.drainage?.toLowerCase().includes('poor') ? 'poor'
    : reg?.soils?.mapUnits?.[0]?.drainage?.toLowerCase().includes('moderate') ? 'moderate'
    : reg?.soils?.mapUnits?.[0]?.drainage?.toLowerCase().includes('well') ? 'well'
    : 'unknown';

  const shrinkSwell = reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('high') ? 'high'
    : reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('moderate') ? 'moderate'
    : reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('low') ? 'low'
    : 'unknown';

  const fz = reg?.fema?.floodZone || 'X';

  // Data gaps — factual, not risk
  const dataGaps = {
    soilsUnavailable: !reg?.soils?.mapUnits?.length,
    geologyUnavailable: !reg?.geology?.formation || reg?.geology?.formation === 'Unknown',
    parcelUnavailable: !parcel || parcel?.confidence === 'UNAVAILABLE',
    historicalAerialsUnavailable: true, // always flag — we don't pull these yet
    tceqManualRequired: true, // always required
    noSiteRecon: fieldNotes.length < 30,
    noHistoricalRecords: false,
  };

  return {
    facilitiesWithin1Mile: reg?.epaEcho?.totalCount || 0,
    facilitiesWithinHalfMile: 0,
    facilitiesAdjacent: false,
    knownReleaseOnSite: notes.includes('release') && notes.includes('on-site'),
    migrationDirection: 'unknown',
    hasViolations: reg?.epaEcho?.facilitiesNearby?.some((f: {violations: string}) => f.violations?.includes('Active')) || false,
    hasActiveCleanup: false,
    hasOpenEnforcement: false,
    historicalUse,
    currentUse,
    currentUseSource: parcel?.source || 'Field notes / manual classification',
    currentUseConfidence,
    siteClass,
    nwiOnSite: reg?.nwi?.wetlandsPresent || false,
    nwiAdjacent: false,
    nwiWithin500ft: reg?.nwi?.wetlandsPresent || false,
    hydricPercent: reg?.soils?.hydricPercent || 0,
    drainage,
    surfaceWaterOnSite: false,
    surfaceWaterWithin500ft: reg?.hydrology?.nearbyStreams?.length > 0,
    floodZone: fz,
    inFloodway: fz === 'FLOODWAY',
    shrinkSwell,
    permeability: 'unknown',
    karst: 'none',
    fieldObservation,
    dataGaps,
    formerGasStation: historicalUse === 'gasStation',
    formerDryCleaner: historicalUse === 'dryCleaner',
    formerIndustrial: historicalUse === 'industrial',
    mappedWetlandOnSite: reg?.nwi?.wetlandsPresent || false,
  };
}

// ── Traceable value wrapper ───────────────────────────────────────────────────
export function trace<T>(value: T, source: string, confidence: 'VERIFIED' | 'INFERRED' | 'UNAVAILABLE'): TracedValue<T> {
  return { value, source, confidence, timestamp: today() };
}
