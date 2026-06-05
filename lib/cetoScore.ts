// ── CETO Environmental Risk Scoring Engine v5 ─────────────────────────────────
// v5 fixes applied (all 7 data accuracy issues):
// FIX 1: historicalUse — TCEQ regulatory records first, notes fallback
// FIX 2: facilitiesNearby source — correct attribution (TCEQ ArcGIS, not EPA ECHO)
// FIX 3: permeability — derived from SSURGO drainage class (data already fetched)
// FIX 4: hasOpenEnforcement — live from TCEQ status field keywords
// FIX 5: narratives — facility dataset + name cited as regulatory ID
// FIX 6: migrationDirection — documented as requiring manual determination
// FIX 7: karst — inferred from geology lithology (limestone/dolomite/evaporite)

export interface TracedValue<T> {
  value: T;
  source: string;
  confidence: 'VERIFIED' | 'INFERRED' | 'UNAVAILABLE';
  timestamp: string;
  note?: string;
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
  confidenceNote?: string;
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
  facilitiesNearby: TracedValue<{ name: string; type: string; distanceMi?: number; program?: string; dataset?: string; riskClass?: string }[]>;
  elevation: TracedValue<number | null>;
  geology: TracedValue<string>;
  soilSeries: TracedValue<string>;
  drainage: TracedValue<string>;
  currentUse: TracedValue<CurrentUse>;
  siteClass: TracedValue<SiteClass>;
  knownReleaseOnSite: boolean;
  migrationDirection: 'downgradient' | 'cross' | 'unknown' | 'upgradient';
  migrationNote: string; // FIX 6: documents why direction is unknown
  hasViolations: boolean;
  hasActiveCleanup: boolean;
  hasOpenEnforcement: boolean;
  facilitiesWithinHalfMile: number;
  facilitiesAdjacent: boolean;
  historicalUse: CurrentUse;
  historicalUseSource: string; // FIX 1: tracks evidentiary basis
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
  siteClass: string;
  siteClassConfidence: string;
  siteClassSource: string;
  currentUseLabel: string;
  currentUseConfidence: string;
  currentUseSource: string;
  currentUseNote?: string;
  historicalUseSource: string; // FIX 1: surfaced in report
  migrationNote: string;       // FIX 6: surfaced in report
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

const _defaultWeights: Record<string, number> = {
  'Superfund':2.0,'NPL':2.0,'RCRA':1.8,'CORRACTS':1.8,'LUST':1.6,
  'UST':1.4,'TRI':1.3,'NPDES':1.1,'Air':1.0,'Stormwater':0.9,
  'Minor Permit':0.8,'LPST':1.8,'DRYCLEANER':1.7,'IHWCA':1.7,
  'VCP':1.5,'PST':1.3,'default':1.0,
};
const FACILITY_TYPE_WEIGHTS: Record<string, number> = (() => {
  try {
    return process.env.CETO_WEIGHTS ? JSON.parse(process.env.CETO_WEIGHTS) : _defaultWeights;
  } catch { return _defaultWeights; }
})();

const FIELD_SCORES: Record<string, number> = {
  none: 0, debris: 10, staining: 25, drums: 50, ust: 70, odor: 80, release: 100,
};

function cap(val: number, max = 100): number {
  return Math.min(max, Math.max(0, val));
}

function distanceWeight(distanceMi: number): number {
  return Math.max(0.5, 1.0 - (distanceMi / 1.0) * 0.5);
}

function computeFacilityRisk(
  facilities: { name: string; type: string; distanceMi?: number; program?: string; dataset?: string; riskClass?: string }[],
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
    const matchKey = Object.keys(FACILITY_TYPE_WEIGHTS).find(k =>
      program.toUpperCase().includes(k.toUpperCase())
    );
    const typeWeight = matchKey
      ? FACILITY_TYPE_WEIGHTS[matchKey]
      : FACILITY_TYPE_WEIGHTS['default'];
    const dist = f.distanceMi ?? 0.75;
    const dWeight = distanceWeight(dist);
    const facilityRisk = 20 * typeWeight * dWeight;

    if (closestMi === null || dist < closestMi) closestMi = dist;
    if (facilityRisk > maxRisk) {
      maxRisk = facilityRisk;
      highestWeight = typeWeight;
      highestType = program;
    }
  }

  return { risk: cap(maxRisk), highestWeight, highestType, closestMi };
}

// ── FIX 1: Historical use from TCEQ regulatory data first ────────────────────
// ASTM E1527-21 §8.3: regulatory records ARE historical records.
// A TCEQ LPST/PST record at or adjacent to the site is stronger evidence of
// former gas station use than field notes. This function checks regulatory data
// before falling back to note parsing.
interface TceqFacility {
  dataset?: string;
  program?: string;
  type?: string;
  name?: string;
  status?: string;
  distanceMi?: number | null;
}

function classifyHistoricalFromRegulatory(
  tceqFacilities: TceqFacility[],
  notes: string
): { use: CurrentUse; source: string; confidence: 'VERIFIED' | 'INFERRED' } {
  const n = notes.toLowerCase();

  function datasetToUse(f: TceqFacility): CurrentUse | null {
    const ds = (f.dataset || f.program || f.type || '').toUpperCase();
    if (ds.includes('LPST') || ds.includes('PST')) return 'gasStation';
    if (ds.includes('DRYCLEANER')) return 'dryCleaner';
    if (ds.includes('IHWCA') || ds.includes('SUPERFUND')) return 'industrial';
    if (ds.includes('VCP')) return 'industrial';
    return null;
  }

  // On-site (≤0.1 mi): VERIFIED — this facility was at this address
  const onSite = tceqFacilities.filter(f => (f.distanceMi ?? 99) <= 0.1);
  for (const f of onSite) {
    const use = datasetToUse(f);
    if (use) {
      const ds = f.dataset || f.type || 'TCEQ';
      return {
        use,
        source: `TCEQ ${ds} — ${f.name || 'regulated facility'} (on-site, ${((f.distanceMi ?? 0)).toFixed(2)} mi) — ASTM E1527-21 §8.3 historical record`,
        confidence: 'VERIFIED',
      };
    }
  }

  // Adjacent (≤0.5 mi): INFERRED — adjacent former use, not necessarily on-site
  // Use highest-risk dataset only; do not stack inferences
  const nearby = tceqFacilities.filter(f => (f.distanceMi ?? 99) <= 0.5);
  const riskOrder: CurrentUse[] = ['dryCleaner', 'industrial', 'gasStation'];
  for (const targetUse of riskOrder) {
    const match = nearby.find(f => datasetToUse(f) === targetUse);
    if (match) {
      const ds = match.dataset || match.type || 'TCEQ';
      return {
        use: targetUse,
        source: `TCEQ ${ds} — ${match.name || 'regulated facility'} (${((match.distanceMi ?? 0)).toFixed(2)} mi adjacent) — inferred, not confirmed on-site`,
        confidence: 'INFERRED',
      };
    }
  }

  // Field notes fallback
  const noteMap: Array<[string[], CurrentUse]> = [
    [['dry clean', 'laundry'], 'dryCleaner'],
    [['gas station', 'fuel station', 'service station'], 'gasStation'],
    [['industrial', 'manufactur', 'warehouse', 'plant'], 'industrial'],
    [['auto repair', 'mechanic', 'body shop'], 'auto'],
    [['landfill', 'dump'], 'landfill'],
    [['commercial', 'retail', 'shopping'], 'retail'],
    [['residential', 'house', 'apartment'], 'residential'],
    [['vacant', 'undeveloped'], 'vacant'],
    [['agricultural', 'farm', 'crop', 'ranch'], 'agricultural'],
  ];
  for (const [keywords, use] of noteMap) {
    if (keywords.some(kw => n.includes(kw))) {
      return { use, source: 'Field notes (manual entry)', confidence: 'INFERRED' };
    }
  }

  return {
    use: 'unknown',
    source: 'No historical use determined from TCEQ regulatory records or field notes — manual Sanborn/city directory review required per ASTM E1527-21 §8.3',
    confidence: 'INFERRED',
  };
}

// ── FIX 3: Permeability from SSURGO drainage class ───────────────────────────
// USDA Soil Survey Manual: drainage class maps directly to saturated hydraulic
// conductivity (Ksat) and contaminant vertical migration potential.
function derivePermeability(drainageClass: string): 'low' | 'moderate' | 'high' | 'unknown' {
  const d = drainageClass.toLowerCase();
  if (d.includes('excessively drained') || d === 'well drained' || d.includes('somewhat excessively')) return 'high';
  if (d.includes('well') && !d.includes('poorly')) return 'high';
  if (d.includes('moderately well')) return 'moderate';
  if (d.includes('somewhat poorly')) return 'moderate';
  if (d.includes('very poorly') || d.includes('poorly drained') || d.includes('poor')) return 'low';
  if (d === 'moderate') return 'moderate';
  if (d === 'well') return 'high';
  if (d === 'poor') return 'low';
  return 'unknown';
}

// ── FIX 7: Karst from geology lithology ──────────────────────────────────────
// Texas karst: Edwards Plateau (limestone), Permian Basin (evaporite/gypsum),
// Llano Uplift (carbonate), Glen Rose (limestone). Phase I must flag karst
// because standard soil borings miss solution cavities entirely.
function deriveKarst(lithology: string, formation: string): 'none' | 'possible' | 'mapped' {
  const combined = (lithology + ' ' + formation).toLowerCase();
  // Confirmed karst formations in Texas
  if (
    combined.includes('edwards') ||
    combined.includes('glen rose') ||
    combined.includes('ellenburger') ||
    combined.includes('karst') ||
    combined.includes('sinkhole') ||
    combined.includes('cave')
  ) return 'mapped';
  // Karstifiable lithologies
  if (
    combined.includes('limestone') ||
    combined.includes('dolomite') ||
    combined.includes('carbonate')
  ) return 'possible';
  // Evaporite karst (Permian Basin gypsum dissolution)
  if (
    combined.includes('gypsum') ||
    combined.includes('evaporite') ||
    combined.includes('anhydrite') ||
    combined.includes('halite')
  ) return 'possible';
  return 'none';
}

// ── FIX 4: Open enforcement from TCEQ status field ───────────────────────────
function hasOpenEnforcementFromTCEQ(tceqFacilities: TceqFacility[]): boolean {
  const openKeywords = ['open', 'active', 'enforcement', 'noncompliance', 'violation', 'referral', 'pending', 'notice'];
  return tceqFacilities.some(f => {
    const status = (f.status || '').toLowerCase();
    return openKeywords.some(kw => status.includes(kw));
  });
}

// ── Site classification ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function classifySite(parcel: any, zoning: any, landCover: any): TracedValue<SiteClass> {
  const luc = String(parcel?.landUseCode || '').toUpperCase();
  const desc = String(parcel?.landUseDescription || '').toLowerCase();
  const ownerType = String(parcel?.ownerType || '').toUpperCase();
  const zoningCode = String(zoning?.zoningCode || '').toUpperCase();
  const cropPct = landCover?.cultivatedCropPercent || 0;
  const devPct = landCover?.developedPercent || 0;
  const pConf = parcel?.confidence || 'UNAVAILABLE';

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

  if (zoning?.confidence !== 'UNAVAILABLE' && zoningCode) {
    if (zoningCode.startsWith('I')) return trace('INDUSTRIAL' as SiteClass, zoning?.source || 'Zoning', 'INFERRED');
    if (zoningCode.startsWith('C') || zoningCode.startsWith('B')) return trace('COMMERCIAL' as SiteClass, zoning?.source || 'Zoning', 'INFERRED');
    if (zoningCode.startsWith('R') || zoningCode.startsWith('SF')) return trace('RESIDENTIAL' as SiteClass, zoning?.source || 'Zoning', 'INFERRED');
    if (zoningCode.startsWith('A') || zoningCode.startsWith('AG')) return trace('AGRICULTURAL' as SiteClass, zoning?.source || 'Zoning', 'INFERRED');
  }

  if (landCover?.confidence !== 'UNAVAILABLE') {
    if (cropPct > 50) return trace('AGRICULTURAL' as SiteClass, 'USGS NLCD 2021', 'INFERRED');
    if (devPct > 60) return trace('COMMERCIAL' as SiteClass, 'USGS NLCD 2021', 'INFERRED');
    if (devPct > 20) return trace('RESIDENTIAL' as SiteClass, 'USGS NLCD 2021', 'INFERRED');
    if (devPct < 10) return trace('VACANT' as SiteClass, 'USGS NLCD 2021', 'INFERRED');
  }

  return trace('UNKNOWN' as SiteClass, 'Unable to determine — manual verification required', 'UNAVAILABLE');
}

// ── Current use detection ─────────────────────────────────────────────────────
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

  if (pConf !== 'UNAVAILABLE' && parcelDesc) {
    const use = classify(parcelDesc);
    if (use) return trace(use, parcel?.source || 'County CAD', pConf as 'VERIFIED' | 'INFERRED');
  }

  const zDesc = String(zoning?.zoningDescription || '').toLowerCase();
  if (zoning?.confidence !== 'UNAVAILABLE' && zDesc) {
    const use = classify(zDesc);
    if (use) return trace(use, zoning?.source || 'Zoning', 'INFERRED',
      'Inferred from zoning classification — parcel-level verification recommended');
  }

  if (landCover?.confidence !== 'UNAVAILABLE') {
    if ((landCover?.cultivatedCropPercent || 0) > 50)
      return trace('agricultural', 'USGS NLCD 2021', 'INFERRED', 'Inferred from land cover — parcel verification recommended');
    if ((landCover?.developedPercent || 0) < 15)
      return trace('vacant', 'USGS NLCD 2021', 'INFERRED', 'Inferred from land cover — parcel verification recommended');
  }

  if (n.length > 10) {
    const use = classify(n);
    if (use) return trace(use, 'Field notes (manual entry)', 'INFERRED',
      'Inferred from field notes — parcel data verification recommended.');
  }

  return trace('unknown', 'Unable to determine from automated sources', 'UNAVAILABLE',
    'Manual verification required — current use unknown increases risk conservatively');
}

// ── Main scoring function ─────────────────────────────────────────────────────
export function computeCetoScore(input: ScoredInput): ScoreOutput {
  const redFlags: string[] = [];
  const explanations: ScoreExplanation[] = [];

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

  const facilities = input.facilitiesNearby.value;
  const { risk: facilityRisk, highestWeight, highestType, closestMi } = computeFacilityRisk(
    facilities,
    input.facilitiesAdjacent,
    input.knownReleaseOnSite
  );

  const migrationRisk = { downgradient: 0, cross: 0, unknown: 15, upgradient: 30 }[input.migrationDirection] ?? 15;

  const lpstWithin025 = facilities.some(f =>
    (f.dataset === 'LPST' || f.program === 'LPST' || String(f.type).includes('Leaking')) &&
    (f.distanceMi ?? 99) <= 0.25
  );
  const lpstWithin05 = facilities.some(f =>
    (f.dataset === 'LPST' || f.program === 'LPST' || String(f.type).includes('Leaking')) &&
    (f.distanceMi ?? 99) <= 0.5
  );
  const lpstCount = facilities.filter(f =>
    f.dataset === 'LPST' || f.program === 'LPST' || String(f.type).includes('Leaking')
  ).length;
  const lpstFloor = lpstWithin025 ? 75 : lpstWithin05 ? 55 : lpstCount > 5 ? 35 : 0;
  const lpstRec = lpstWithin05 || lpstCount > 3;

  // FIX 4: hasOpenEnforcement now live — complianceRisk reflects real TCEQ status
  const complianceRisk = input.hasActiveCleanup ? 80
    : input.hasOpenEnforcement ? 60
    : input.hasViolations ? 40
    : input.facilitiesCount.value > 0 ? 20 : 0;

  const regulatoryRisk = cap(Math.max(lpstFloor, (facilityRisk + migrationRisk + complianceRisk) * scm.reg));
  const historicalRisk = cap((HISTORICAL_USE_RISK[input.historicalUse] ?? 20) * scm.hist);

  const cuEntry = CURRENT_USE_RISK[input.currentUse.value] ?? CURRENT_USE_RISK.unknown;
  const cuConfPenalty = input.currentUse.confidence === 'UNAVAILABLE' ? 1.12
    : input.currentUse.confidence === 'INFERRED' ? 1.05 : 1.0;
  const currentUseRisk = cap(cuEntry.risk * scm.cur * cuConfPenalty);
  const cuPenaltyApplied = cuConfPenalty > 1.0;

  const hydric = input.hydricPercent.value;
  const nwiRisk = input.wetlandsPresent.value ? (input.nwiOnSite ? 90 : input.nwiAdjacent ? 60 : 30) : 0;
  const hydricRisk = hydric > 50 ? 40 : hydric > 0 ? 20 : 0;
  const drainRisk = { well: 0, moderate: 10, poor: 25, unknown: 5 }[input.drainage.value as string] ?? 5;
  const surfaceRisk = input.surfaceWaterWithin500ft ? 15 : 0;
  const wetlandRisk = cap((nwiRisk + hydricRisk + drainRisk + surfaceRisk) * scm.wet);

  const fz = input.floodZone.value;
  const floodRisk = input.inFloodway ? 100
    : (fz.startsWith('AE') || fz === 'A') ? 60
    : fz === 'X500' ? 20 : 0;

  const shrinkRisk = { low: 0, moderate: 10, high: 20, unknown: 5 }[input.shrinkSwell] ?? 5;
  const permRisk = { low: 0, moderate: 10, high: 25, unknown: 5 }[input.permeability] ?? 5;
  // FIX 7: karstRisk now live when lithology indicates limestone/dolomite/evaporite
  const karstRisk = { none: 0, possible: 25, mapped: 50 }[input.karst] ?? 0;
  const soilRisk = cap((shrinkRisk + permRisk + karstRisk) * scm.soil);

  const fieldRisk = FIELD_SCORES[input.fieldObservation] ?? 0;

  const rawRisk =
    (regulatoryRisk  * 0.25) +
    (historicalRisk  * 0.12) +
    (currentUseRisk  * 0.13) +
    (wetlandRisk     * 0.15) +
    (floodRisk       * 0.10) +
    (soilRisk        * 0.15) +
    (fieldRisk       * 0.10);

  const rawRiskScore = Math.round(rawRisk);

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

  const missingCritical = (gaps.noSiteRecon ? 1 : 0) + (gaps.noHistoricalRecords ? 1 : 0);
  const missingMajor = (gaps.soilsUnavailable ? 1 : 0) + (gaps.geologyUnavailable ? 1 : 0) + (gaps.parcelUnavailable ? 1 : 0);
  const confidenceMultiplier = Math.min(1.10, 1 + (missingCritical * 0.04) + (missingMajor * 0.02));

  if (input.knownReleaseOnSite)                        redFlags.push('Known release on-site');
  if (input.formerGasStation)                          redFlags.push(`Former gas station — UST/petroleum risk (${input.historicalUseSource})`);
  if (input.formerDryCleaner)                          redFlags.push(`Former dry cleaner — chlorinated solvent risk (${input.historicalUseSource})`);
  if (input.formerIndustrial)                          redFlags.push(`Former industrial use (${input.historicalUseSource})`);
  if (input.wetlandsPresent.value && input.nwiOnSite)  redFlags.push('Mapped wetland on-site (USFWS NWI)');
  if (input.inFloodway)                                redFlags.push('Located in FEMA floodway');
  if (input.fieldObservation === 'release')            redFlags.push('Release evidence observed — field reconnaissance');
  if (input.fieldObservation === 'ust')                redFlags.push('UST/AST evidence observed — field reconnaissance');
  if (input.currentUse.value === 'gasStation')         redFlags.push('Current use: active gas station');
  if (input.currentUse.value === 'dryCleaner')         redFlags.push('Current use: dry cleaner');
  if (input.currentUse.value === 'auto' && (sc === 'INDUSTRIAL' || sc === 'COMMERCIAL')) redFlags.push('Current use: auto repair/service facility');
  if (fz.startsWith('AE'))                             redFlags.push('FEMA Zone AE — Special Flood Hazard Area');
  if (input.hasActiveCleanup)                          redFlags.push('Active cleanup site within 1 mile');
  if (input.hasOpenEnforcement)                        redFlags.push('Open TCEQ enforcement action at nearby facility');
  if (input.karst === 'mapped')                        redFlags.push('Mapped karst terrain — standard soil borings may miss solution cavities');
  if (input.karst === 'possible')                      redFlags.push('Karst-forming lithology present — dissolution features possible');
  if (lpstWithin025) redFlags.push('REC-1: LPST facility within 0.25 miles — subsurface migration risk present');
  else if (lpstWithin05) redFlags.push('REC-1: LPST facility within 0.5 miles — contaminant migration possible');
  if (lpstCount > 10) redFlags.push('REC-2: High density of petroleum storage facilities (>10 LPST/PST within 1 mile)');

  const severityMultiplier = redFlags.length >= 3 ? 1.60 : redFlags.length === 2 ? 1.35 : redFlags.length === 1 ? 1.15 : 1.0;

  const correctedRisk = Math.min(100, rawRisk * confidenceMultiplier * severityMultiplier);
  const correctedScore = Math.round(100 - correctedRisk);

  const _defaultCeilings = {"NO_TCEQ":78,"NO_HISTORICAL":73,"NO_SITE_RECON":78,"KNOWN_RELEASE":42,"FORMER_DRYCLEANER":62,"FORMER_GASSTATION":62,"ACTIVE_DRYCLEANER":55,"ACTIVE_GASSTATION":60,"NWI_ONSITE":68,"FLOODWAY":68};
  const C = (() => { try { return process.env.CETO_CEILINGS ? JSON.parse(process.env.CETO_CEILINGS) : _defaultCeilings; } catch { return _defaultCeilings; } })();

  let ceiling = 100;
  if (input.knownReleaseOnSite)                        ceiling = Math.min(ceiling, C.KNOWN_RELEASE);
  if (input.formerDryCleaner)                          ceiling = Math.min(ceiling, C.FORMER_DRYCLEANER);
  if (input.formerGasStation)                          ceiling = Math.min(ceiling, C.FORMER_GASSTATION);
  if (input.currentUse.value === 'dryCleaner')         ceiling = Math.min(ceiling, C.ACTIVE_DRYCLEANER);
  if (input.currentUse.value === 'gasStation')         ceiling = Math.min(ceiling, C.ACTIVE_GASSTATION);
  if (input.wetlandsPresent.value && input.nwiOnSite)  ceiling = Math.min(ceiling, C.NWI_ONSITE);
  if (input.inFloodway)                                ceiling = Math.min(ceiling, C.FLOODWAY);
  if (gaps.noSiteRecon)                                ceiling = Math.min(ceiling, C.NO_SITE_RECON);
  if (gaps.noHistoricalRecords)                        ceiling = Math.min(ceiling, C.NO_HISTORICAL);

  const finalScore = Math.min(correctedScore, ceiling);

  const rating = finalScore >= 90 ? 'Low Risk'
    : finalScore >= 75 ? 'Moderate-Low Risk'
    : finalScore >= 60 ? 'Moderate Risk'
    : finalScore >= 40 ? 'Elevated Risk' : 'High Risk';

  const ratingCode = (finalScore >= 90 ? 'LOW' : finalScore >= 75 ? 'MODERATE_LOW' : finalScore >= 60 ? 'MODERATE' : finalScore >= 40 ? 'ELEVATED' : 'HIGH') as ScoreOutput['ratingCode'];

  // ── Explanations ──────────────────────────────────────────────────────────
  // FIX 2 + FIX 5: source now correctly identifies TCEQ ArcGIS, not EPA ECHO
  const facilitySource = input.facilitiesNearby.source;
  if (regulatoryRisk === 0)
    explanations.push({ category: 'Regulatory', points: 25, sign: '+', reason: 'No regulated facilities within 1 mile', traced: `${facilitySource} — ${input.facilitiesCount.confidence} · ${input.facilitiesCount.timestamp}` });
  else {
    const distNote = closestMi !== null ? ` (nearest: ${closestMi.toFixed(2)} mi)` : '';
    const typeNote = highestType !== 'None' && highestType !== 'default' ? ` — ${highestType} weighted ×${highestWeight.toFixed(1)}` : '';
    explanations.push({ category: 'Regulatory', points: -Math.round(regulatoryRisk * 0.25), sign: '-', reason: `${input.facilitiesCount.value} facility(ies) within 1 mile${distNote}${typeNote}`, traced: `${facilitySource} — ${input.facilitiesNearby.confidence} · ${input.facilitiesCount.timestamp}` });
  }

  // FIX 1: historical use explanation now cites the evidentiary source
  if (historicalRisk <= 12)
    explanations.push({ category: 'Historical Use', points: 12, sign: '+', reason: `Low-risk historical use: ${input.historicalUse}`, traced: input.historicalUseSource });
  else
    explanations.push({ category: 'Historical Use', points: -Math.round(historicalRisk * 0.12), sign: '-', reason: `Elevated historical use: ${input.historicalUse}`, traced: input.historicalUseSource });

  if (currentUseRisk <= 15)
    explanations.push({ category: 'Current Use', points: 13, sign: '+', reason: cuEntry.label, traced: `${input.currentUse.source} — ${input.currentUse.confidence} · ${input.currentUse.timestamp}`, confidenceNote: cuPenaltyApplied ? input.currentUse.note : undefined });
  else
    explanations.push({ category: 'Current Use', points: -Math.round(currentUseRisk * 0.13), sign: '-', reason: cuEntry.label, traced: `${input.currentUse.source} — ${input.currentUse.confidence} · ${input.currentUse.timestamp}`, confidenceNote: cuPenaltyApplied ? input.currentUse.note : undefined });

  if (input.wetlandsPresent.confidence === 'UNAVAILABLE')
    explanations.push({ category: 'Wetlands', points: 0, sign: '+', reason: 'DATA GAP — wetlands query failed; status undetermined. Verify at fws.gov/wetlands', traced: `USFWS NWI — UNAVAILABLE · ${input.wetlandsPresent.timestamp}` });
  else if (wetlandRisk === 0)
    explanations.push({ category: 'Wetlands', points: 15, sign: '+', reason: 'No wetlands mapped on-site or adjacent', traced: `USFWS NWI — ${input.wetlandsPresent.confidence} · ${input.wetlandsPresent.timestamp}` });
  else
    explanations.push({ category: 'Wetlands', points: -Math.round(wetlandRisk * 0.15), sign: '-', reason: `Wetland indicators present — ${hydric}% hydric soils`, traced: `USFWS NWI (${input.wetlandsPresent.confidence}), USDA SSURGO (${input.hydricPercent.confidence}) · ${input.hydricPercent.timestamp}` });

  if (fz === 'UNDETERMINED')
    explanations.push({ category: 'Flood', points: 0, sign: '+', reason: 'DATA GAP — flood zone query failed; verify at msc.fema.gov', traced: `FEMA NFHL — ${input.floodZone.confidence} · ${input.floodZone.timestamp}` });
  else if (floodRisk === 0)
    explanations.push({ category: 'Flood', points: 10, sign: '+', reason: `FEMA Zone ${fz} — outside SFHA`, traced: `FEMA NFHL — ${input.floodZone.confidence} · ${input.floodZone.timestamp}` });
  else
    explanations.push({ category: 'Flood', points: -Math.round(floodRisk * 0.10), sign: '-', reason: `FEMA Zone ${fz} — flood hazard present`, traced: `FEMA NFHL — ${input.floodZone.confidence} · ${input.floodZone.timestamp}` });

  // FIX 3: permeability now live in explanation
  if (soilRisk <= 10)
    explanations.push({ category: 'Soils / Geology', points: 15, sign: '+', reason: `Low permeability (${input.permeability}) — limits contaminant migration`, traced: `USDA SSURGO — ${input.soilSeries.confidence} · ${input.soilSeries.timestamp}` });
  else {
    const karstNote = input.karst !== 'none' ? `, karst: ${input.karst}` : '';
    explanations.push({ category: 'Soils / Geology', points: -Math.round(soilRisk * 0.15), sign: '-', reason: `Shrink-swell: ${input.shrinkSwell}, permeability: ${input.permeability}${karstNote}`, traced: `USDA SSURGO — ${input.soilSeries.confidence} · ${input.soilSeries.timestamp}` });
  }

  if (fieldRisk === 0)
    explanations.push({ category: 'Field Observations', points: 10, sign: '+', reason: 'No environmental concerns observed during reconnaissance' });
  else
    explanations.push({ category: 'Field Observations', points: -Math.round(fieldRisk * 0.10), sign: '-', reason: `Observation: ${input.fieldObservation}` });

  if (sc === 'INDUSTRIAL')
    explanations.push({ category: 'Site Class', points: -3, sign: '-', reason: 'Industrial classification — elevated risk thresholds applied', traced: `${input.siteClass.source} — ${input.siteClass.confidence}` });
  else if (sc === 'PUBLIC')
    explanations.push({ category: 'Site Class', points: 3, sign: '+', reason: 'Government/public ownership — reduced risk multipliers', traced: `${input.siteClass.source} — ${input.siteClass.confidence}` });

  if (missingItems.length > 0)
    explanations.push({ category: 'Data Completeness', points: 0, sign: '~', reason: `${missingItems.length} gap(s) noted — affects confidence multiplier (×${confidenceMultiplier.toFixed(2)}), not risk score` });

  if (ceiling < 100)
    explanations.push({ category: 'Red Flag Ceiling', points: -(100 - ceiling), sign: '-', reason: `Hard ceiling: max ${ceiling}/100 — ${redFlags[0]}` });

  const negatives = explanations.filter(e => e.sign === '-' && e.category !== 'Data Completeness');
  const reason = negatives.length > 0
    ? negatives.map(e => e.reason).join('; ') + '.'
    : ratingCode === 'MODERATE'
    ? (lpstRec
        ? `Moderate environmental risk identified. A leaking petroleum storage tank (LPST) facility is documented within ${closestMi !== null ? closestMi.toFixed(2) + ' miles of' : 'the search radius of'} the subject property. Off-site contaminant migration cannot be excluded without subsurface investigation.`
        : 'Moderate environmental risk identified based on regulatory database density and site proximity factors.')
    : ratingCode === 'MODERATE_LOW'
    ? 'Low-moderate risk profile. No significant environmental concerns identified; minor flagged items require follow-up verification.'
    : (regulatoryRisk === 0 && wetlandRisk === 0 && floodRisk === 0)
    ? 'No recognized environmental conditions identified. The subject property presents a low environmental risk profile based on available regulatory, historical, and reconnaissance data.'
    : 'No significant environmental concerns identified based on available data.';

  const floodRec = fz.startsWith('AE') && regulatoryRisk > 30;
  const phase2Required = ratingCode === 'HIGH' || ratingCode === 'ELEVATED' || input.knownReleaseOnSite;
  const phase2Recommended = lpstRec || floodRec || ratingCode === 'MODERATE';
  const recommendedAction = phase2Required
    ? 'Phase II ESA required prior to any property transaction — significant RECs identified.'
    : phase2Recommended
    ? 'Phase II ESA recommended — LPST proximity and regulatory database density warrant subsurface investigation.'
    : ratingCode === 'MODERATE_LOW'
    ? 'Phase II ESA not required at this time. Complete TCEQ STEERS manual search and verify flagged items before closing.'
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
    siteClass: sc,
    siteClassConfidence: input.siteClass.confidence,
    siteClassSource: input.siteClass.source,
    currentUseLabel: cuEntry.label,
    currentUseConfidence: input.currentUse.confidence,
    currentUseSource: input.currentUse.source,
    currentUseNote: input.currentUse.note,
    historicalUseSource: input.historicalUseSource, // FIX 1
    migrationNote: input.migrationNote,             // FIX 6
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

// ── deriveScoreInput — builds ScoredInput from live API data ──────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deriveScoreInput(reg: any, parcelData: any, fieldNotes: string): ScoredInput {
  const notes = fieldNotes || '';
  const n = notes.toLowerCase();
  const parcel = parcelData?.parcel;
  const zoning = parcelData?.zoning;
  const landCover = parcelData?.landCover;

  // All TCEQ facilities from tceq-intel route
  const tceqFacilities: TceqFacility[] = reg?.tceq?.facilitiesNearby || [];

  const soilsFailed = reg?.soils?.risk === 'DATA_GAP' || String(reg?.soils?.source || '').includes('QUERY FAILED');
  const hydricPercent = trace(
    reg?.soils?.hydricPercent || 0,
    'USDA NRCS SSURGO via Soil Data Access',
    reg?.soils?.mapUnits?.length ? 'VERIFIED' : 'UNAVAILABLE'
  );

  const femaFailed = reg?.fema?.risk === 'DATA_GAP' || String(reg?.fema?.source || '').includes('QUERY FAILED');
  const floodZone = trace(
    femaFailed ? 'UNDETERMINED' : (reg?.fema?.floodZone || 'X'),
    'FEMA NFHL ArcGIS REST',
    femaFailed ? 'INFERRED' : (reg?.fema?.floodZone ? 'VERIFIED' : 'INFERRED')
  );

  const nwiFailed = reg?.nwi?.risk === 'DATA_GAP' || String(reg?.nwi?.source || '').includes('QUERY FAILED');
  const wetlandsPresent = trace(
    reg?.nwi?.wetlandsPresent || false,
    'USFWS NWI ArcGIS REST',
    (reg?.nwi && !nwiFailed) ? 'VERIFIED' : 'UNAVAILABLE'
  );

  // FIX 2: facilitiesCount reflects TCEQ total (EPA ECHO retired 2026-04-27)
  const tceqTotal = reg?.tceq?.totalCount || 0;
  const facilitiesCount = trace(
    tceqTotal,
    'TCEQ ArcGIS FeatureServer — 1-mile radius query',
    reg?.tceq ? 'VERIFIED' : 'UNAVAILABLE'
  );

  // FIX 2: source correctly attributed to TCEQ ArcGIS, not EPA ECHO
  // FIX 5: dataset field preserved for regulatory ID in narratives
  const allFacilities = [
    ...(reg?.tceq?.facilitiesNearby || []),
    ...(reg?.epaEcho?.facilitiesNearby || []), // legacy fallback if echo ever returns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ].map((f: any) => ({
    name: f.name,
    type: f.type,
    program: f.dataset || f.program || f.type,
    dataset: f.dataset || '',
    distanceMi: f.distanceMi ?? undefined,
    riskClass: f.riskClass || '',
  }));

  const hasTceqData = tceqFacilities.length > 0 || reg?.tceq?.checked;
  const hasEchoData = (reg?.epaEcho?.facilitiesNearby || []).length > 0;
  const facilitiesSource = hasTceqData && hasEchoData
    ? 'TCEQ ArcGIS FeatureServer + EPA ECHO'
    : hasTceqData
    ? 'TCEQ ArcGIS FeatureServer — services2.arcgis.com/LYMgRMwHfrWWEg3s'
    : hasEchoData
    ? 'EPA ECHO API'
    : 'TCEQ ArcGIS FeatureServer (0 results)';

  const facilitiesNearby = trace(
    allFacilities,
    facilitiesSource,
    hasTceqData || hasEchoData ? 'VERIFIED' : 'UNAVAILABLE'
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
    rawDrainage.includes('poor') ? 'poor'
      : rawDrainage.includes('moderate') ? 'moderate'
      : rawDrainage.includes('well') ? 'well'
      : 'unknown',
    'USDA NRCS SSURGO',
    reg?.soils?.mapUnits?.length ? 'VERIFIED' : 'UNAVAILABLE'
  );

  const shrinkSwell = reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('high') ? 'high'
    : reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('moderate') ? 'moderate'
    : reg?.soils?.mapUnits?.[0]?.shrinkSwell?.toLowerCase().includes('low') ? 'low'
    : 'unknown';

  // FIX 3: permeability derived from SSURGO drainage class
  const rawDrainageFull = reg?.soils?.mapUnits?.[0]?.drainage || '';
  const permeability = derivePermeability(rawDrainageFull);

  // FIX 7: karst from geology lithology + formation name
  const karst = deriveKarst(
    reg?.geology?.lithology || '',
    reg?.geology?.formation || ''
  );

  const fieldObservation = n.includes('release') || n.includes('spill') ? 'release'
    : n.includes('ust') || (n.includes('tank') && !n.includes('water tank')) ? 'ust'
    : n.includes('odor') || n.includes('sheen') ? 'odor'
    : n.includes('drum') || n.includes('container') ? 'drums'
    : n.includes('stain') ? 'staining'
    : n.includes('debris') || n.includes('trash') ? 'debris'
    : 'none';

  // FIX 1: historical use from TCEQ regulatory data first
  const { use: historicalUse, source: historicalUseSource } =
    classifyHistoricalFromRegulatory(tceqFacilities, notes);

  // FIX 4: open enforcement live from TCEQ status fields
  const hasOpenEnforcement = hasOpenEnforcementFromTCEQ(tceqFacilities);

  // FIX 6: migration direction — document why it cannot be automated
  const migrationNote = reg?.elevation?.elevationFt
    ? `Site elevation: ${reg.elevation.elevationFt} ft MSL (USGS NED). Groundwater flow direction requires topographic map review or licensed hydrogeologist determination and cannot be reliably inferred from elevation alone for regulatory reporting purposes. Manual upgradient/downgradient analysis recommended per ASTM E1527-21 §8.2.3.`
    : 'Site elevation unavailable. Groundwater flow direction undetermined — manual topographic analysis required per ASTM E1527-21 §8.2.3.';

  return {
    hydricPercent, floodZone, wetlandsPresent, facilitiesCount, facilitiesNearby,
    soilSeries, geology, elevation, currentUse, siteClass, drainage,
    knownReleaseOnSite: n.includes('release') && n.includes('on-site'),
    migrationDirection: 'unknown', // FIX 6: always unknown until manual survey
    migrationNote,
    // FIX 4: live from TCEQ
    hasViolations: tceqFacilities.some(f => {
      const s = (f.status || '').toLowerCase();
      return s.includes('violation') || s.includes('noncompliance');
    }),
    hasActiveCleanup: tceqFacilities.some(f => {
      const s = (f.status || '').toLowerCase();
      return s.includes('active') && (s.includes('cleanup') || s.includes('remediat') || s.includes('corrective'));
    }),
    hasOpenEnforcement,
    facilitiesWithinHalfMile: allFacilities.filter(f => (f.distanceMi ?? 99) <= 0.5).length,
    facilitiesAdjacent: allFacilities.some(f => {
      const dist = f.distanceMi ?? 99;
      const prog = (f.dataset || f.type || '').toUpperCase();
      if (prog.includes('LPST') && dist <= 0.25) return true;
      if (prog.includes('DRYCLEANER') && dist <= 0.5) return true;
      return dist <= 0.1;
    }),
    historicalUse,
    historicalUseSource, // FIX 1
    nwiOnSite: (reg?.nwi as any)?.onSite ?? false,
    nwiAdjacent: (reg?.nwi as any)?.adjacent ?? false,
    surfaceWaterWithin500ft: (() => {
      const SURFACE_WATER_500FT_MI = 0.0947;
      const dist = parseFloat(reg?.hydrology?.closestStreamMiles || '999');
      return !isNaN(dist) && dist < SURFACE_WATER_500FT_MI;
    })(),
    inFloodway: (reg?.fema?.floodZone || '') === 'FLOODWAY',
    shrinkSwell: shrinkSwell as ScoredInput['shrinkSwell'],
    permeability, // FIX 3: live
    karst,        // FIX 7: live
    fieldObservation: fieldObservation as ScoredInput['fieldObservation'],
    formerGasStation: historicalUse === 'gasStation',
    formerDryCleaner: historicalUse === 'dryCleaner',
    formerIndustrial: historicalUse === 'industrial',
    dataGaps: {
      soilsUnavailable: !reg?.soils?.mapUnits?.length,
      geologyUnavailable: !reg?.geology?.formation || reg?.geology?.formation === 'Unknown',
      parcelUnavailable: !parcel || parcel?.confidence === 'UNAVAILABLE',
      historicalAerialsUnavailable: reg?.historical
        ? reg.historical.historicalConfidence === 'UNAVAILABLE' || reg.historical.historicalConfidence === 'MINIMAL'
        : true,
      tceqManualRequired: !reg?.tceq?.checked || reg?.tceq?.totalCount === undefined,
      noSiteRecon: notes.trim().length < 30,
      noHistoricalRecords: reg?.historical
        ? reg.historical.noSanbornReview || reg.historical.noCityDirectories
        : true,
    },
  };
}
