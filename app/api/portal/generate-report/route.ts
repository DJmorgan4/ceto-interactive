import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server';
import { deriveScoreInput, computeCetoScore } from '../../../../lib/cetoScore';
import { generateNearestFacilityNarrative, generateRiskInterpretation, generateTracedDataSources } from '../../../../lib/narratives';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PHASE1_SYSTEM = `You draft report body content for review and sign-off by a credentialed Environmental Professional (EP) at Ceto Interactive Environmental Consulting. You are NOT the EP and you do not certify anything. You generate the CETO Environmental Intelligence Report™ — an automated Phase I + Environmental Site Screening report.

CRITICAL FORMATTING RULES:
- Always output the report in clean, structured plain text with clear section headers
- Use the exact section structure provided
- Write in professional, defensible EP language
- Be specific — use actual data provided, never generic placeholders
- The Executive Decision Summary is the most important section — make it instant to read
- Include the Risk Score breakdown table using actual calculated scores
- Historical use timeline must be a formatted table
- All regulatory findings must cite the source database
- Environmental Professional Statement must reference ASTM E1527-21 and EPA AAI
- Minimum 900 words, maximum 1800 words for the main report body

HARD PROHIBITIONS — non-negotiable, override any other instruction:
1. NEVER write an Environmental Professional Declaration, a 40 CFR 312.21 attestation, "I declare", "I have developed and performed", "Prepared and Certified By", a credential/license number, a signature block, or a "Compliance Affirmed" line. The template renders these separately, only after a human EP signs off.
2. NEVER state that All Appropriate Inquiries were completed, or that the assessment is "in conformance with" ASTM E1527-21, while any material data gap is open. Use: "prepared toward conformance with ASTM E1527-21; final conformance determination pending completion of the required elements identified in the data gaps section."
3. NEVER state a Phase II verdict other than the PHASE II DETERMINATION supplied in the brief. It governs every section — decision tables, findings, conclusions, recommendations. No "conditional" or "not recommended at this time" variants.
4. NEVER perform arithmetic on scores, weights or multipliers. Every figure is supplied in the brief and copied verbatim. If a figure is not supplied, omit it.
5. NEVER classify a condition as a REC or Potential REC without evidence of a release, a condition indicative of a release, or a material threat of future release. Wetlands, flood zones, permeable geology and hydrologic sensitivity are environmental constraints, NOT RECs — report them under "Environmental Constraints".
6. NEVER interpret terrain as fault scarps or geologic structures from DEM/LiDAR alone. Use "break-in-slope" or "geomorphic lineament candidate" and note that corroboration is required.
7. When both NHD and NWI results appear, include: "The NHD named-feature query and NWI wetland query are different mapping products with different search criteria; absence of a named NHD waterbody does not indicate absence of nearby surface-water features."
8. NEVER present results from one spatial scope as if they applied to another. Label findings site-point, parcel/AOI, or regional context.`;

const PHASE1_TEMPLATE = (data: Record<string, string>) => `Generate a complete CETO Environmental Intelligence Report™ using EXACTLY this structure and section order. Fill every section with real data from the inputs provided. Do not skip any section.

PROJECT DATA:
Project Name: ${data.projectName}
Client: ${data.clientName || 'Confidential'}
Address/Location: ${data.location}
Survey Date: ${data.surveyDate}
Report ID: CET-ENV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}
Field Observations: ${data.notes}
${data.regContext}

OUTPUT THE REPORT IN THIS EXACT FORMAT:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${(!data.location || data.location.trim().length < 8) ? "⚠ DATA-LIMITED — NOT FOR DECISION USE\nNo site address provided. Map, databases, scoring, and REC analysis unavailable.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" : ""}
CETO ENVIRONMENTAL INTELLIGENCE REPORT™
Automated Phase I ESA + Environmental Site Screening
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COVER INFORMATION
Project Name: ${data.projectName}
Address: ${data.location}
Client: ${data.clientName || 'Confidential'}
Prepared By: Ceto Interactive Environmental Consulting · McKinney, Texas
Report Type: Phase I ESA + Environmental Site Screening
Survey Date: ${data.surveyDate}
Report Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Report ID: CET-ENV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}
Standard: ASTM E1527-21 · EPA All Appropriate Inquiry (AAI)
Intelligence Layer: CETO Texas Environmental Intelligence™ — proprietary Texas-specific screening not available in standard national tools

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — EXECUTIVE DECISION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Write the CETO Risk Score here as: "CETO Score: XX / 100 — [RATING]"]

DEAL RECOMMENDATION: [PROCEED / CONDITIONAL / DO NOT PROCEED]

KEY FINDINGS (write as 4-6 bullet points, each one sentence, plain English for investors/lenders):
- [finding 1]
- [finding 2]
- [finding 3]
- [finding 4]

WATCH ITEMS (write any moderate concerns or data gaps, or "None identified"):
- [watch item or "None identified"]

ESTIMATED RISK IMPACT:
Cleanup Risk: [Low / Moderate / High]
Permitting Delay Risk: [Low / Moderate / High]
Development Constraint Risk: [Low / Moderate / High]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — SITE OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Property Name: [name]
Location: [full address]
Coordinates: [lat, lng]
County: [county]
Property Type: [type from field notes]
Current Use: [current use]
Surrounding Land Use — North: [use] South: [use] East: [use] West: [use]
Site Description: [2-3 sentences describing the site based on field notes]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — ENVIRONMENTAL SCREENING DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Category              | Result                        | Risk
Regulatory (EPA ECHO) | [result]                      | [LOW/MODERATE/HIGH]
Flood Zone (FEMA)     | [zone and description]        | [LOW/MODERATE/HIGH]
Wetlands (NWI)        | [result]                      | [LOW/MODERATE/HIGH]
Soils (Hydric Rating) | [result]                      | [LOW/MODERATE/HIGH]
Historical Use        | [result]                      | [LOW/MODERATE/HIGH]
Geology               | [formation]                   | [LOW/MODERATE/HIGH]
Field Observations    | [result]                      | [LOW/MODERATE/HIGH]
TCEQ STEERS           | Manual review required        | PENDING

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — PHYSICAL SETTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SOILS (USDA NRCS SSURGO):
Soil Series: [name from data]
Drainage Class: [drainage]
Hydric Rating: [hydric yes/no and percent]
Shrink-Swell Potential: [rating]
Interpretation: [2-3 sentences interpreting soil data for development and wetland potential]

GEOLOGY (Macrostrat / USGS NGMDB):
Formation: [formation name]
Lithology: [rock type]
Age: [geologic age]
Interpretation: [1-2 sentences on permeability and contaminant migration potential]

HYDROLOGY (USGS NHDPlus HR — legacy, superseded by 3DHP):
Elevation: [elevation ft MSL]
Nearest Surface Water: [stream name or distance]
Drainage Direction: [direction based on topography]
Interpretation: [1-2 sentences on drainage and surface water context]

FLOODPLAIN (FEMA NFHL):
FEMA Zone: [zone]
Classification: [description]
FIRM Panel: [panel number]
Interpretation: [1 sentence on flood risk implication]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — REGULATORY DATABASE REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EPA ECHO — 1-Mile Radius:
Result: [number] regulated facilities identified
[If facilities exist, list each: Name · Type · Violation status]
[If none: "No regulated facilities identified within a 1-mile search radius."]
Source: EPA ECHO API · Real-time compliance data · echo.epa.gov

Federal Database Review (per ASTM E1527-21 Table 1):
NPL (Superfund): [result]
CERCLIS/SEMS: [result based on EPA data]
RCRA Generators: [result]
LUST/UST Registry: [result]
Brownfields: [result]
Source: EPA Envirofacts · ECHO API · Federal databases

State Database (TCEQ):
TCEQ STEERS: Manual search required for [county]
Action Required: Search at www2.tceq.texas.gov/oce/eer/index.cfm

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — HISTORICAL USE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Create a reasonable historical use timeline based on field notes, location, and property type]

Year Range    | Observed Use              | Environmental Concern
Pre-1950      | [use based on context]    | [Low/Moderate/High]
1950-1980     | [use]                     | [risk]
1980-2000     | [use]                     | [risk]
2000-Present  | [use from field notes]    | [risk]

Sources Reviewed: Aerial photograph analysis, city directory records, topographic maps, field reconnaissance
Conclusion: [2-3 sentences on historical use findings and REC implications]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — SITE RECONNAISSANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reconnaissance Date: ${data.surveyDate}
Conducted By: Environmental Professional · Ceto Interactive
Reconnaissance Method: [If field notes confirm physical site visit, state: 'Physical site visit conducted.' Otherwise state: 'Desktop reconnaissance only — aerial imagery, Google Street View, and available records review. Physical site visit not performed for this screening-level assessment per ASTM E1527-21 Section 8.3 desktop alternative.']

RULE: Do NOT claim physical site reconnaissance occurred unless field notes explicitly confirm an on-site visit.

Observations:
[Convert field notes into professional observations. If no field visit occurred, prefix each item with the data source — e.g., 'Aerial imagery indicates...' or 'County records show...' — never state as a direct observation.]

Exterior Conditions:
- [observation from field notes]
- [observation]

Structures and Equipment:
- [observation or "No structures present"]

Environmental Indicators:
- Staining: [observed/not observed]
- Odors: [observed/not observed]
- Drums/Containers: [observed/not observed]
- UST/AST Evidence: [observed/not observed]
- Distressed Vegetation: [observed/not observed]

Conclusion: [1-2 sentences summarizing reconnaissance findings]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8 — FINDINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recognized Environmental Conditions (RECs):
[List any RECs identified, or "No RECs identified based on available data and site reconnaissance."]

Controlled RECs (CRECs):
[List or "No CRECs identified."]

Historical RECs (HRECs):
[List or "No HRECs identified."]

De Minimis Conditions:
[List minor conditions or "None identified."]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9 — CETO RISK MODEL BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reproduce the SCORE BREAKDOWN, Confidence Multiplier, Severity Multiplier, Ceiling and
CETO Score EXACTLY as supplied in the brief above. Do not recompute, re-weight, or total
anything. Do not invent categories or weights that were not supplied. If a value is absent
from the brief, omit that line entirely.
[If ceiling applied: "Score ceiling of [X]/100 applied — reason: [specific flag]"]

The scoring engine has already applied any ceiling before this brief was built. State which
ceiling was applied and why, using the Ceiling value supplied above. Never apply, adjust or
infer a ceiling yourself.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10 — DATA GAPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[List actual data gaps:]
- [gap 1 — e.g., "Historical aerial imagery prior to 1950 unavailable for this location"]
- [gap 2 — e.g., "TCEQ STEERS database requires manual search — not available via automated pull"]
- [any others based on what data returned errors or timeouts]

Impact Assessment: [1-2 sentences on whether gaps materially affect conclusions]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 11 — CONCLUSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[3-5 sentences providing a clear, defensible conclusion covering: RECs status, overall risk, site suitability, and any conditions]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 12 — RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[List specific, actionable recommendations:]
- [recommendation 1]
- [recommendation 2]
- [TCEQ manual search recommendation always included]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 13 — ENVIRONMENTAL PROFESSIONAL STATEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This Phase I Environmental Site Assessment was conducted in general accordance with ASTM International Standard E1527-21 and the Environmental Protection Agency All Appropriate Inquiry (AAI) Rule (40 CFR Part 312).

The Environmental Professional conducting this assessment has the education, training, and experience necessary to conduct this assessment in accordance with the standard of care applicable to this type of work.

Prepared by: Environmental Professional
Organization: Ceto Interactive Environmental Consulting
Address: McKinney, Texas
Website: cetointeractive.com
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

DISCLAIMER: This report was prepared using automated desktop data retrieval from publicly available federal databases and, where applicable, field notes provided by the user. Unless physical site reconnaissance is explicitly confirmed in the field notes, observations reflect remote imagery and records review only — not a physical site visit. This report does not substitute for a full Phase I ESA with complete Sanborn map review, city directory research, interviews, and physical site reconnaissance per ASTM E1527-21. TCEQ STEERS requires manual verification. The CETO Environmental Risk Score is a screening tool and does not constitute a final professional opinion. All regulatory data reflects conditions at time of query.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPENDICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Appendix A — Site Location Map (see portal map view)
Appendix B — FEMA Flood Map (Panel ${data.firmPanel || 'see msc.fema.gov'})
Appendix C — USFWS NWI Wetlands Map (see fws.gov/wetlands/mapper)
Appendix D — USDA Web Soil Survey (see websoilsurvey.nrcs.usda.gov)
Appendix E — EPA ECHO Regulatory Database Report (see echo.epa.gov)
Appendix F — Field Photographs (upload via Ceto Portal)`;

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  // Build reg context string from structured data
  const reg = body.regData;

  // Pre-compute score + narratives server-side so LLM never re-derives them
  let precomputed = '';
  if (reg) {
    try {
      const scoreInput = deriveScoreInput(reg, body.parcelData || null, body.notes || '');
      const scoreOutput = computeCetoScore(scoreInput);
      const facilityNarrative = generateNearestFacilityNarrative(reg);
      const riskInterpretation = generateRiskInterpretation(reg, scoreOutput.finalScore);
      const dataSources = generateTracedDataSources(scoreOutput.tracedInputs);

      precomputed = `
PRE-COMPUTED OUTPUTS — USE VERBATIM, DO NOT REINTERPRET:

CETO Score: ${scoreOutput.finalScore}/100 — ${scoreOutput.rating}
Site Class: ${scoreOutput.siteClass} (${scoreOutput.siteClassConfidence}) — ${scoreOutput.siteClassSource}
Current Use: ${scoreOutput.currentUseLabel} (${scoreOutput.currentUseConfidence})
Confidence Multiplier: ${scoreOutput.confidenceMultiplier}x
Severity Multiplier: ${scoreOutput.severityMultiplier}x
Ceiling: ${scoreOutput.ceiling}/100
Recommended Action: ${scoreOutput.recommendedAction}

PHASE II DETERMINATION (AUTHORITATIVE — copy into Section 1 exactly, do not re-derive):
${scoreOutput.phase2Required ? 'REQUIRED' : scoreOutput.phase2Recommended ? 'RECOMMENDED' : 'NOT REQUIRED'}
This determination is computed by the CETO scoring engine and is the single source of truth. It appears verbatim on the Go/No-Go dashboard. Do NOT reach a different conclusion from the score, the Phase II Likelihood percentage, or any other figure in this brief. If open data gaps prevent a final REC determination, say so separately — that does not change this verdict.

SCORE BREAKDOWN (copy into Section 9 exactly):
Regulatory Risk: ${scoreOutput.breakdown.regulatory}
Historical Use Risk: ${scoreOutput.breakdown.historicalUse}
Current Use Risk: ${scoreOutput.breakdown.currentUse}
Wetland/Water Risk: ${scoreOutput.breakdown.wetland}
Flood Risk: ${scoreOutput.breakdown.flood}
Soil/Geology Risk: ${scoreOutput.breakdown.soil}
Field Observation Risk: ${scoreOutput.breakdown.field}

RED FLAGS: ${scoreOutput.redFlags.length > 0 ? scoreOutput.redFlags.join('; ') : 'None identified'}

DATA GAPS (copy into Section 10 exactly):
Missing: ${scoreOutput.dataCompleteness.missingItems.join('; ') || 'None'}
Verified: ${scoreOutput.dataCompleteness.verifiedItems.join('; ')}

DEAL IMPACT (copy into Section 1 exactly):
Estimated Liability: ${scoreOutput.dealImpact.estimatedLiability}
Phase II Likelihood: ${scoreOutput.dealImpact.phase2Likelihood}
Permitting Delay Risk: ${scoreOutput.dealImpact.permittingDelayRisk}
Development Constraint Risk: ${scoreOutput.dealImpact.developmentConstraintRisk}
Cleanup Risk: ${scoreOutput.dealImpact.cleanupRisk}
Lender Concern: ${scoreOutput.dealImpact.lenderConcern}

NEAREST FACILITY NARRATIVE (copy verbatim into Section 5):
${facilityNarrative}

RISK INTERPRETATION (copy verbatim into Section 11 Conclusions):
${riskInterpretation}
${dataSources}

FORMATTING RULES:
- Do NOT reinterpret, recalculate, or paraphrase any of the above pre-computed outputs
- Do NOT invent risk conclusions — use only what is stated above
- Your job is to FORMAT and EXPAND context around these fixed outputs
- You MAY add factual physical setting description, site context, and professional framing
- You MAY NOT change the score, rating, red flags, or deal impact values
`;
    } catch (e) {
      console.error('Score precompute failed:', e);
    }
  }
  const regContext = reg ? `
REGULATORY DATA (AUTO-RETRIEVED):
Address: ${reg.address} · County: ${reg.county} · State: ${reg.state || 'TX'}
Coordinates: ${reg.coordinates?.lat?.toFixed(5)}°N, ${Math.abs(reg.coordinates?.lng || 0).toFixed(5)}°W
Elevation: ${reg.elevation?.elevationFt ? reg.elevation.elevationFt + ' ft MSL' : 'Unknown'}
FEMA Zone: ${reg.fema?.floodZone} — ${reg.fema?.floodZoneDesc} (Panel: ${reg.fema?.panelNumber})
EPA ECHO: ${reg.epaEcho?.totalCount > 0 ? reg.epaEcho.totalCount + ' facilities: ' + reg.epaEcho.facilitiesNearby?.map((f: {name: string; type: string; violations: string}) => f.name + ' [' + f.type + '] — ' + f.violations).join('; ') : 'No regulated facilities within 1 mile'}
USFWS NWI: ${reg.nwi?.wetlandsPresent ? reg.nwi.acresEstimate + ' acres mapped — ' + reg.nwi.wetlandTypes?.join(', ') : 'No wetlands mapped within AOI'}
USDA SSURGO: ${reg.soils?.mapUnits?.map((u: {name: string; drainage: string; hydric: boolean}) => u.name + ' / ' + u.drainage + (u.hydric ? ' / Hydric' : ' / Non-hydric')).join('; ') || 'No soil data'} (${reg.soils?.hydricPercent || 0}% hydric)
Soils Interpretation: ${reg.soils?.interpretation || 'Not available'}
Geology: ${reg.geology?.formation} — ${reg.geology?.lithology} (${reg.geology?.age})
Hydrology: ${reg.hydrology?.primaryStream ? 'Site is within the ' + reg.hydrology.drainageBasin + '. Named streams within 5km: ' + reg.hydrology.nearbyStreams.map((s: {name: string}) => s.name).join(', ') + '. Nearest named stream: ' + reg.hydrology.closestStreamName + ' at ' + reg.hydrology.closestStreamMiles + ' mi.' : 'No named streams identified within search radius'}
TCEQ: ${reg.tceq?.checked
    ? reg.tceq.totalCount > 0
      ? reg.tceq.totalCount + ' facilities found — LPST: ' + (reg.tceq.lpstCount || 0) + ', Dry Cleaner: ' + (reg.tceq.dryCleanerCount || 0) + ', High Risk: ' + (reg.tceq.highRiskCount || 0) + ' (Source: TCEQ GIS)'
      : 'No TCEQ-regulated facilities within 1 mile (Source: TCEQ GIS)'
    : 'Manual STEERS search required for ' + reg.county}
CETO Risk Score: ${body.cetoScore || 'Calculated from above data'}
` + precomputed : precomputed;

  // Determine report type and use appropriate template
  const reportType = body.reportType || 'Phase I ESA';
  const isPhase1 = reportType.toLowerCase().includes('phase') || reportType.toLowerCase().includes('esa');

  // Always use server-side system prompt — never trust client override
  const systemPrompt = PHASE1_SYSTEM;

  // Use structured fields sent from client — prevents "Unknown Project" fallback
  const resolvedProject = body.projectName?.trim() || 'Unknown Project';
  const resolvedLocation = body.location?.trim() || 'Texas (address not provided)';
  const resolvedClient = body.clientName?.trim() || 'Confidential';
  const resolvedDate = body.surveyDate || new Date().toLocaleDateString();
  const resolvedNotes = body.notes?.trim() || '';

  // If client sent a full userPrompt already, use it directly (it has all context embedded)
  // Otherwise build from structured fields
  const userPrompt = body.userPrompt
    ? body.userPrompt
    : isPhase1
    ? PHASE1_TEMPLATE({
        projectName: resolvedProject,
        clientName: resolvedClient,
        location: resolvedLocation,
        surveyDate: resolvedDate,
        notes: resolvedNotes,
        regContext,
        firmPanel: reg?.fema?.panelNumber || '',
      })
    : `Generate a complete professional ${reportType} report for:
Project: ${resolvedProject}
Client: ${resolvedClient}
Location: ${resolvedLocation}
Survey Date: ${resolvedDate}
Field Observations: ${resolvedNotes}
${regContext}`;

  // ── ASTRA ENRICHMENT — pulls ASTM E1527-21 knowledge before Claude writes report ──
  let astraEnrichment = ''
  if (reg && isPhase1) {
    try {
      // Build ASTRA prompt based on report type
      const siteCtx = [
        `SITE: ${resolvedLocation} | ${reg.county || "Unknown"} County, TX`,
        `FEMA: Zone ${reg.fema?.floodZone} — ${reg.fema?.floodZoneDesc}`,
        `TCEQ: ${reg.tceq?.totalCount || 0} facilities (LPST:${reg.tceq?.lpstCount||0} DC:${reg.tceq?.dryCleanerCount||0} HR:${reg.tceq?.highRiskCount||0})`,
        `WETLANDS: ${reg.nwi?.wetlandsPresent ? reg.nwi.acresEstimate+" acres — "+(reg.nwi.wetlandTypes||[]).join(", ") : "None mapped"}`,
        `SOILS: ${reg.soils?.hydricPercent||0}% hydric — ${reg.soils?.interpretation||"no interpretation"}`,
        `HYDROLOGY: ${reg.hydrology?.closestStreamName||"No named stream"} at ${reg.hydrology?.closestStreamMiles||"unknown"} mi`,
        `EPA ECHO: ${reg.epaEcho?.totalCount||0} regulated facilities within 1 mile`,
        `FIELD NOTES: ${resolvedNotes||"None provided"}`,
      ].join("\n")

      const rType = reportType.toLowerCase()
      let astraMsg = ""
      if (rType.includes("swppp") || rType.includes("stormwater")) {
        astraMsg = `You are ASTRA with deep TPDES TXR150000 and stormwater knowledge. Analyze this SWPPP inspection site and return ONLY these 4 sections:\n\n${siteCtx}\n\nTPDES TXR150000 COMPLIANCE FLAGS:\nList permit conditions at risk — BMP maintenance, outfall locations, drainage, TCEQ proximity. If none, state "No flags identified."\n\nIMPAIRED WATERS RISK:\nIs this site in or near a 303(d) impaired watershed? Flag receiving water concerns.\n\nBMP RECOMMENDATIONS:\nTop 3 BMPs needed at this site based on soils, slope, and hydrology.\n\nINSPECTOR PROFESSIONAL NOTES:\nOne paragraph for the inspection record — first-person, specific to site conditions, suitable for SWPPP documentation.`
      } else if (rType.includes("field") || rType.includes("survey") || rType.includes("walk")) {
        astraMsg = `You are ASTRA with deep environmental field assessment knowledge. Analyze this field survey site and return ONLY these 4 sections:\n\n${siteCtx}\n\nOBSERVED CONDITIONS ANALYSIS:\nBased on field notes and site data, identify the most significant environmental observations requiring follow-up.\n\nJURISDICTIONAL CONCERNS:\nFlag any USACE, TCEQ, or EPA jurisdictional issues — wetlands, waters of the US, regulated facilities.\n\nDOCUMENTATION GAPS:\nList what additional documentation or site reconnaissance is needed.\n\nFIELD PROFESSIONAL NOTES:\nOne paragraph summary for the field assessment record. Reference actual site conditions.`
      } else {
        // Default: Phase I ESA
        astraMsg = `You are ASTRA with deep ASTM E1527-21 and TCEQ regulatory knowledge. Analyze this Phase I ESA site and return ONLY these 5 sections:\n\n${siteCtx}\n\nREC DETERMINATION:\nState whether RECs, HRECs, or CRECs exist per ASTM E1527-21 Section 7. One sentence per applicable category. If none: "No RECs identified based on available data."\n\nTCEQ REGULATORY FLAGS:\nList TCEQ Chapter 335, LPST, dry cleaner, or VCP flags. If none: "No TCEQ flags identified."\n\nUSACE §404 WETLAND TRIGGER:\nYes or No. If yes, cite NWI type and permit pathway (NWP vs Individual). If no, state basis.\n\nLENDER FLAGS:\nTop 3 items a lender environmental attorney would flag. Be specific to the data.\n\nEP PROFESSIONAL OPINION:\nOne paragraph, first-person EP voice, defensible under ASTM E1527-21 Section 12. Reference actual site data.`
      }

      const astraRes = await fetch('https://www.astarteworks.com/api/astra/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: astraMsg, history: [] }),
        signal: AbortSignal.timeout(25000),
      })
      const astraData = await astraRes.json()
      astraEnrichment = astraData.response || ''
      console.log('ASTRA enrichment:', astraEnrichment.slice(0, 100))
    } catch (e) {
      console.error('ASTRA enrichment failed (non-blocking):', e)
    }
  }
  // ── end ASTRA enrichment ──

  // Inject ASTRA analysis into the Claude prompt
  const finalPrompt = astraEnrichment
    ? userPrompt + `

ASTRA INTELLIGENCE PRE-ANALYSIS (incorporate into report — do not reproduce verbatim, use to inform professional opinions and REC determinations):
${astraEnrichment}`
    : userPrompt

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: 'user', content: finalPrompt }],
    });

    const report = message.content.map(b => b.type === 'text' ? b.text : '').join('');

    // A report cut off at the token ceiling is missing its later sections
    // (data gaps, EP opinion) while still looking complete. Surface it.
    const truncated = message.stop_reason === 'max_tokens';
    if (truncated) {
      console.error('[generate-report] narrative truncated at max_tokens', {
        project: resolvedProject,
        chars: report.length,
      });
    }

    // ── STRATUM write — pin this site on the LithicEarth globe ──
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      if (reg?.coordinates?.lat && reg?.coordinates?.lng) {
        await supabase.from('stratum_sites').upsert({
          name: resolvedProject,
          latitude: reg.coordinates.lat,
          longitude: reg.coordinates.lng,
          source: 'ceto',
          site_type: reportType,
          ceto_score: body.cetoScore || null,
          ceto_tier: body.cetoScore < 40 ? 'Low' : body.cetoScore < 70 ? 'Moderate' : 'High',
          esa_phase: isPhase1 ? 'Phase I' : null,
          address: reg.address || resolvedLocation,
          state: reg.state || 'TX',
          county: reg.county || null,
          status: 'active',
          metadata: {
            client: resolvedClient,
            report_date: new Date().toISOString(),
            fema_zone: reg.fema?.floodZone || null,
            wetlands: reg.nwi?.wetlandsPresent || false,
            facility_count: reg.epaEcho?.totalCount || 0,
          }
        }, { onConflict: 'name,latitude,longitude' })
      }
    } catch (stratumErr) {
      console.error('STRATUM write failed (non-blocking):', stratumErr)
    }
    // ── end STRATUM write ──
    return NextResponse.json({ report, truncated });
  } catch (e: unknown) {
    console.error('Generation error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Generation failed' }, { status: 500 });
  }
}
