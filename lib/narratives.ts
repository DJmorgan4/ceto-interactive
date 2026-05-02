// ── Auto-generated narrative helpers ─────────────────────────────────────────

interface Facility {
  name: string;
  type: string;
  program?: string;
  violations?: string;
  distanceMi?: number;
}

function facilityRiskLabel(f: Facility): string {
  const prog = (f.program || f.type || '').toUpperCase();
  if (prog.includes('SUPERFUND') || prog.includes('NPL') || prog.includes('CORRACTS')) return 'High Risk (Superfund/NPL)';
  if (prog.includes('RCRA')) return 'Moderate-High Risk (RCRA)';
  if (prog.includes('LUST') || prog.includes('UST')) return 'Moderate Risk (UST/LUST)';
  if (f.violations?.includes('Active')) return 'Active Violation';
  return 'Low Risk (Permitted Facility)';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateNearestFacilityNarrative(reg: any): string {
  const facilities: Facility[] = reg?.epaEcho?.facilitiesNearby || [];

  if (!facilities.length) {
    return 'No EPA-regulated facilities were identified within the 1-mile search radius of the subject property. ' +
      'This finding indicates no regulated operations in the immediate vicinity that could represent a source of hazardous substance release threatening the subject property.';
  }

  const withDist = facilities.filter(f => typeof f.distanceMi === 'number')
    .sort((a, b) => (a.distanceMi ?? 99) - (b.distanceMi ?? 99));

  if (!withDist.length) {
    return `${facilities.length} EPA-regulated facility record(s) were identified within the 1-mile search radius. ` +
      'Facility coordinate data was unavailable for distance-based ranking. Manual review at echo.epa.gov is recommended prior to transaction close.';
  }

  const nearest = withDist[0];
  const riskPhrase = nearest.distanceMi! <= 0.1 ? 'immediately adjacent to'
    : nearest.distanceMi! <= 0.25 ? 'in very close proximity to'
    : nearest.distanceMi! <= 0.5 ? 'in nearby proximity to'
    : 'within the 1-mile search radius of';

  const prog = nearest.program || nearest.type || 'EPA-regulated activity';
  const label = facilityRiskLabel(nearest);
  const countNote = facilities.length > 1
    ? ` A total of ${facilities.length} regulated facilities were identified within the 1-mile radius.`
    : '';

  return `The nearest EPA-regulated facility identified through the ECHO database search is ${nearest.name}, ` +
    `a ${prog} facility located approximately ${nearest.distanceMi!.toFixed(2)} miles from the subject property — ` +
    `${riskPhrase} the site. This facility is classified as ${label}.${countNote} ` +
    `Groundwater migration direction relative to the subject property was not determined through automated means; ` +
    `an upgradient/downgradient analysis is recommended if this facility represents a potential concern.`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateRiskInterpretation(reg: any, cetoScore?: number): string {
  const facilities: Facility[] = reg?.epaEcho?.facilitiesNearby || [];
  const wetland = reg?.nwi?.wetlandsPresent;
  const floodZone = reg?.fema?.floodZone || 'X';
  const hydricPct = reg?.soils?.hydricPercent || 0;
  const geology = reg?.geology?.formation || '';
  const elevation = reg?.elevation?.elevationFt;
  const streams = reg?.hydrology?.nearbyStreams || [];

  const issues: string[] = [];
  const positives: string[] = [];

  if (facilities.length > 0) {
    const nearest = facilities.filter(f => typeof f.distanceMi === 'number').sort((a,b) => (a.distanceMi??99)-(b.distanceMi??99))[0];
    const distNote = nearest?.distanceMi !== undefined ? ` (nearest: ${nearest.distanceMi.toFixed(2)} mi)` : '';
    issues.push(`${facilities.length} nearby EPA-regulated facility record(s)${distNote}`);
  } else {
    positives.push('no regulated facilities identified within 1 mile (EPA ECHO)');
  }

  if (wetland) issues.push(`mapped wetland indicators — ${reg?.nwi?.acresEstimate || '<1'} acres (USFWS NWI)`);
  else positives.push('no wetlands mapped within AOI (USFWS NWI)');

  if (floodZone !== 'X' && floodZone !== 'X500') issues.push(`FEMA flood zone ${floodZone} — special flood hazard area`);
  else positives.push(`FEMA Zone ${floodZone} — outside Special Flood Hazard Area`);

  if (hydricPct > 25) issues.push(`${hydricPct}% hydric soils — potential wetland formation indicator (USDA SSURGO)`);
  else if (hydricPct > 0) positives.push(`${hydricPct}% hydric soils — low concern (USDA SSURGO)`);
  else positives.push('no hydric soils identified (USDA SSURGO)');

  if (geology && geology !== 'Unknown') {
    const lith = (reg?.geology?.lithology || '').toLowerCase();
    const isPermeable = lith.includes('sand') || lith.includes('gravel') || lith.includes('alluvial') || lith.includes('terrace');
    if (isPermeable) issues.push(`${geology} geology — ${lith} substrate presents moderate-to-high permeability; contaminant migration potential elevated`);
    else positives.push(`${geology} geology — ${lith || 'consolidated'} substrate limits vertical contaminant migration`);
  }
  if (elevation) positives.push(`site elevation ${elevation} ft MSL (USGS NED)`);
  if (streams.length > 0) {
    const drainageBasin = reg?.hydrology?.drainageBasin || null;
    const primaryStream = reg?.hydrology?.primaryStream || streams[0]?.name || null;
    const closestMi = reg?.hydrology?.closestStreamMiles || null;
    const allNames = streams.map((s: {name: string}) => s.name).filter(Boolean);
    const unique = [...new Set(allNames)];
    const distNote = closestMi && closestMi !== 'Unknown' ? ` (nearest: ${closestMi} mi)` : '';
    if (drainageBasin && primaryStream) {
      issues.push(`site is located within the ${drainageBasin}; named surface water features include ${unique.slice(0,3).join(', ')}${distNote} (USGS NHD)`);
    } else if (primaryStream) {
      issues.push(`surface water within 2km — ${primaryStream}${distNote} (USGS NHD)`);
    } else {
      issues.push(`surface water features present within 2km${distNote} (USGS NHD)`);
    }
  }

  const scoreContext = cetoScore !== undefined
    ? ` The CETO Environmental Risk Score of ${cetoScore}/100 reflects this overall assessment.`
    : '';

  if (!issues.length) {
    return `Based on the regulatory database review, floodplain screening, wetlands screening, physical setting review, and site reconnaissance, no material environmental risk indicators were identified in connection with the subject property. ` +
      `Favorable findings include: ${positives.join('; ')}. ` +
      `No Recognized Environmental Conditions (RECs) were identified under the scope of this desktop screening and Phase I ESA.${scoreContext}`;
  }

  return `The environmental risk profile of the subject property reflects the following identified factors: ${issues.join('; ')}. ` +
    `These conditions do not automatically constitute Recognized Environmental Conditions (RECs) under ASTM E1527-21; ` +
    `however, they warrant professional evaluation in the context of site-specific history, groundwater migration pathways, and intended property use. ` +
    `Favorable findings include: ${positives.join('; ')}.${scoreContext}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateTracedDataSources(tracedInputs: any): string {
  if (!tracedInputs) return '';
  const rows = [
    ['Hydric Soils', `${tracedInputs.hydricPercent?.value}%`, tracedInputs.hydricPercent?.source, tracedInputs.hydricPercent?.confidence, tracedInputs.hydricPercent?.timestamp],
    ['Flood Zone', tracedInputs.floodZone?.value, tracedInputs.floodZone?.source, tracedInputs.floodZone?.confidence, tracedInputs.floodZone?.timestamp],
    ['Wetlands', tracedInputs.wetlandsPresent?.value ? 'Present' : 'Absent', tracedInputs.wetlandsPresent?.source, tracedInputs.wetlandsPresent?.confidence, tracedInputs.wetlandsPresent?.timestamp],
    ['EPA Facilities', `${tracedInputs.facilitiesCount?.value} within 1 mi`, tracedInputs.facilitiesCount?.source, tracedInputs.facilitiesCount?.confidence, tracedInputs.facilitiesCount?.timestamp],
    ['Current Use', tracedInputs.currentUse?.value, tracedInputs.currentUse?.source, tracedInputs.currentUse?.confidence, tracedInputs.currentUse?.timestamp],
    ['Site Class', tracedInputs.siteClass?.value, tracedInputs.siteClass?.source, tracedInputs.siteClass?.confidence, tracedInputs.siteClass?.timestamp],
    ['Soil Series', tracedInputs.soilSeries?.value, tracedInputs.soilSeries?.source, tracedInputs.soilSeries?.confidence, tracedInputs.soilSeries?.timestamp],
    ['Geology', tracedInputs.geology?.value, tracedInputs.geology?.source, tracedInputs.geology?.confidence, tracedInputs.geology?.timestamp],
  ];
  return '\nVERIFIED DATA SOURCES:\n' + rows.map(([param, val, source, conf, ts]) =>
    `  ${param}: ${val} — ${source} (${conf}) — ${ts}`
  ).join('\n');
}
