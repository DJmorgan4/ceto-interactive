import { NextRequest, NextResponse } from 'next/server';
import { deriveScoreInput, computeCetoScore } from '../../../../lib/cetoScore';
import { generateNearestFacilityNarrative, generateRiskInterpretation, generateTracedDataSources } from '../../../../lib/narratives';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PHASE1_SYSTEM = `You are a credentialed Environmental Professional (EP) at Ceto Interactive Environmental Consulting, McKinney, Texas. You generate the CETO Environmental Intelligence Report™ — a premium automated Phase I + Environmental Site Screening report.

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
- Minimum 900 words, maximum 1800 words for the main report body`;

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

HYDROLOGY (USGS NHD):
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

Category              | Risk Score (0-100) | Weight | Weighted Impact
Regulatory Risk       | [score from regData]| 25%   | [score x 0.25]
Historical Use Risk   | [score]             | 12%   | [score x 0.12]
Current Use Risk      | [score]             | 13%   | [score x 0.13]
Wetland / Water Risk  | [score]             | 15%   | [score x 0.15]
Flood Risk            | [score]             | 10%   | [score x 0.10]
Soil / Geology Risk   | [score]             | 15%   | [score x 0.15]
Field Observation Risk| [score]             | 10%   | [score x 0.10]

Raw Risk Score: [total weighted risk]

DATA COMPLETENESS PENALTIES (applied to confidence multiplier only — NOT added to risk score):
[List each penalty that applies to THIS report based on actual data gaps:]
- Site reconnaissance not performed → score ceiling capped at 78/100
- TCEQ STEERS not verified → confidence multiplier ×1.08
- Soils data unavailable → confidence multiplier ×1.03
- Historical aerials unavailable → confidence multiplier ×1.03
- Historical records not reviewed → score ceiling capped at 73/100

Confidence Multiplier: [calculated value]x — [list the specific gaps that triggered it, or "All critical data sources verified"]
Severity Multiplier: [value]x — [list red flags that triggered it, or "No major red flags identified"]
Confidence Level: [COMPLETE / MODERATE / LIMITED] — [brief reason]
CETO Score: [final] / 100 — [rating]
[If ceiling applied: "Score ceiling of [X]/100 applied — reason: [specific flag]"]

SCORING RULE: If TCEQ not verified AND no physical site recon confirmed, final score MUST NOT exceed 78/100 regardless of other inputs.

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
Hydrology: ${reg.hydrology?.nearbyStreams?.length > 0 ? reg.hydrology.nearbyStreams.map((s: {name: string}) => s.name).join(', ') : 'No named streams within 2km'}
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

  const userPrompt = isPhase1
    ? PHASE1_TEMPLATE({
        projectName: body.projectName || 'Unknown Project',
        clientName: body.clientName || '',
        location: body.location || 'Texas',
        surveyDate: body.surveyDate || new Date().toLocaleDateString(),
        notes: body.notes || '',
        regContext,
        firmPanel: reg?.fema?.panelNumber || '',
      })
    : `Generate a complete professional ${reportType} report for:
Project: ${body.projectName}
Client: ${body.clientName || 'Confidential'}
Location: ${body.location}
Survey Date: ${body.surveyDate}
Field Observations: ${body.notes}
${regContext}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const report = message.content.map(b => b.type === 'text' ? b.text : '').join('');
    return NextResponse.json({ report });
  } catch (e: unknown) {
    console.error('Generation error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Generation failed' }, { status: 500 });
  }
}
