// lib/astmSearchDistances.ts
//
// ASTM E1527-21 Table 2 — Approximate Minimum Search Distances.
// Transcribed verbatim from the standard (E1527-21, §8.2.2, Table 2).
// These are the legal floors that make a Phase I ESA defensible: a facility
// is only a "finding" if it falls within THIS database's distance, measured
// from the nearest subject-property boundary (§8.1.2).
//
// DO NOT edit these numbers to match a data provider's radius. They are the
// standard. Provider searches may go wider; findings are filtered to these.

export type SearchScope =
  | { kind: 'radius'; miles: number }
  | { kind: 'adjoining' } // subject property + adjoining properties
  | { kind: 'property' } // subject property only

export interface AstmDatabase {
  /** Stable key used to tag facilities as they come back from each source. */
  id: string
  /** Report-facing name, as it should appear in Section 5. */
  label: string
  scope: SearchScope
  /** §8.2.2: NPL and RCRA TSD distances may NOT be reduced. */
  reducible: boolean
  /** Which of your data sources feed this ASTM category. */
  sources: string[]
}

// "Adjoining" has no single mileage in the standard; for point-based
// screening we approximate the subject-plus-adjoining envelope. Tune this to
// your typical parcel size — 0.03 mi ≈ 160 ft covers a property plus its
// immediate neighbors for most commercial lots. Larger sites need the true
// boundary, which is a v2 concern.
export const ADJOINING_MILES = 0.03
export const PROPERTY_ONLY_MILES = 0.01 // ~50 ft — effectively "on-site"

export function scopeToMiles(scope: SearchScope): number {
  if (scope.kind === 'radius') return scope.miles
  if (scope.kind === 'adjoining') return ADJOINING_MILES
  return PROPERTY_ONLY_MILES
}

export function scopeLabel(scope: SearchScope): string {
  if (scope.kind === 'radius') return `${scope.miles.toFixed(1)} mi`
  if (scope.kind === 'adjoining') return 'property + adjoining'
  return 'property only'
}

export const ASTM_DATABASES: AstmDatabase[] = [
  { id: 'npl', label: 'Federal NPL (Superfund)', scope: { kind: 'radius', miles: 1.0 }, reducible: false, sources: ['NPL', 'SUPERFUND'] },
  { id: 'delisted_npl', label: 'Federal Delisted NPL', scope: { kind: 'radius', miles: 0.5 }, reducible: true, sources: ['DELISTED_NPL'] },
  { id: 'cercla_removals', label: 'Federal CERCLA removals / orders', scope: { kind: 'radius', miles: 0.5 }, reducible: true, sources: ['CERCLA'] },
  { id: 'cerclis_nfrap', label: 'Federal CERCLIS-NFRAP', scope: { kind: 'radius', miles: 0.5 }, reducible: true, sources: ['CERCLIS', 'NFRAP'] },
  { id: 'rcra_corracts', label: 'Federal RCRA Corrective Action', scope: { kind: 'radius', miles: 1.0 }, reducible: true, sources: ['CORRACTS'] },
  { id: 'rcra_tsd', label: 'Federal RCRA TSD facilities', scope: { kind: 'radius', miles: 0.5 }, reducible: false, sources: ['RCRA_TSD', 'TSD'] },
  { id: 'rcra_gen', label: 'Federal RCRA generators', scope: { kind: 'adjoining' }, reducible: true, sources: ['RCRA', 'RCRA_LQG', 'RCRA_SQG', 'RCRA_CESQG', 'RCRA_GEN'] },
  { id: 'fed_icec', label: 'Federal IC/EC registries', scope: { kind: 'property' }, reducible: true, sources: ['FED_IC', 'FED_EC', 'FED_ICEC'] },
  { id: 'erns', label: 'Federal ERNS', scope: { kind: 'property' }, reducible: true, sources: ['ERNS'] },
  { id: 'state_superfund', label: 'State Superfund-equivalent', scope: { kind: 'radius', miles: 1.0 }, reducible: true, sources: ['STATE_SUPERFUND', 'TCEQ_SUPERFUND', 'IHWCA'] },
  { id: 'state_haz', label: 'State hazardous waste facilities', scope: { kind: 'radius', miles: 0.5 }, reducible: true, sources: ['STATE_HAZ'] },
  { id: 'state_landfill', label: 'State landfills / solid waste', scope: { kind: 'radius', miles: 0.5 }, reducible: true, sources: ['STATE_LANDFILL', 'MSW'] },
  { id: 'state_lpst', label: 'State leaking storage tanks (LPST/LUST)', scope: { kind: 'radius', miles: 0.5 }, reducible: true, sources: ['LPST', 'LUST'] },
  { id: 'state_ust', label: 'State registered storage tanks (UST/PST)', scope: { kind: 'adjoining' }, reducible: true, sources: ['PST', 'UST', 'AST'] },
  { id: 'state_icec', label: 'State IC/EC registries', scope: { kind: 'property' }, reducible: true, sources: ['STATE_IC', 'STATE_EC', 'STATE_ICEC'] },
  { id: 'state_vcp', label: 'State voluntary cleanup (VCP)', scope: { kind: 'radius', miles: 0.5 }, reducible: true, sources: ['VCP'] },
  { id: 'state_brownfield', label: 'State brownfields', scope: { kind: 'radius', miles: 0.5 }, reducible: true, sources: ['BROWNFIELD', 'BF'] },
  { id: 'drycleaner', label: 'State dry cleaner program', scope: { kind: 'radius', miles: 0.5 }, reducible: true, sources: ['DRYCLEANER'] },
]

/** Map a facility's dataset tag → its ASTM database entry.
 *  Unknown datasets fall back to a conservative 0.5-mi bucket so nothing is
 *  silently dropped — but they should be added to ASTM_DATABASES.sources. */
export function astmForDataset(dataset: string | undefined | null): AstmDatabase {
  const key = String(dataset || '').toUpperCase().trim()
  for (const db of ASTM_DATABASES) {
    if (db.sources.some((s) => s.toUpperCase() === key)) return db
  }
  return {
    id: 'unclassified',
    label: `Unclassified (${dataset || 'unknown'})`,
    scope: { kind: 'radius', miles: 0.5 },
    reducible: true,
    sources: [],
  }
}

export interface DistanceFacility {
  dataset?: string | null
  distanceMi?: number | null
  [k: string]: unknown
}

/** A facility is an ASTM finding only if its distance is within its own
 *  database's search distance. Facilities with no distance are kept
 *  (conservative — an unlocated hit shouldn't vanish) and flagged. */
export function isWithinAstmDistance(f: DistanceFacility): boolean {
  const db = astmForDataset(f.dataset)
  const limit = scopeToMiles(db.scope)
  if (f.distanceMi == null) return true // unlocated — keep, flag downstream
  return f.distanceMi <= limit + 1e-9
}

/** Split a facility list into in-scope findings and out-of-scope (beyond the
 *  ASTM distance for their database — not reportable as findings). */
export function filterByAstmDistance<T extends DistanceFacility>(
  facilities: T[],
): { findings: T[]; outOfScope: T[] } {
  const findings: T[] = []
  const outOfScope: T[] = []
  for (const f of facilities) {
    ;(isWithinAstmDistance(f) ? findings : outOfScope).push(f)
  }
  return { findings, outOfScope }
}

/** The database-by-database summary that Section 5 must state: each source
 *  searched, its ASTM distance, and how many findings fell within it. */
export interface AstmSearchRow {
  id: string
  label: string
  distance: string
  reducible: boolean
  findingCount: number
}

export function buildAstmSearchSummary(
  facilities: DistanceFacility[],
): AstmSearchRow[] {
  const counts = new Map<string, number>()
  for (const f of facilities) {
    if (!isWithinAstmDistance(f)) continue
    const db = astmForDataset(f.dataset)
    counts.set(db.id, (counts.get(db.id) ?? 0) + 1)
  }
  return ASTM_DATABASES.map((db) => ({
    id: db.id,
    label: db.label,
    distance: scopeLabel(db.scope),
    reducible: db.reducible,
    findingCount: counts.get(db.id) ?? 0,
  }))
}
