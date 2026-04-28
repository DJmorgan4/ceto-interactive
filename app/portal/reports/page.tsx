'use client';
import { ParcelPanel } from './ParcelPanel';
import { deriveScoreInput, computeCetoScore as computeCetoScoreReal } from '../../../lib/cetoScore';
import RiskMap, { generateNearestFacilityNarrative, generateRiskInterpretation } from './RiskMap';
import ParcelIntelPanel, { ParcelIntelData } from './ParcelIntelPanel';
import ReconForm, { ReconData, reconToNotes } from './ReconForm';
import FederalDatabasePanel, { FederalDBData } from './FederalDatabasePanel';
import HistoricalResearchPanel, { HistoricalResearchData } from './HistoricalResearchPanel';
import SWPPPModule from './SWPPPModule';

import { useState, useCallback, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

const T = {
  bg: '#F4F5F3',
  ink: '#111A24',
  blue: '#1E4976',
  blueMid: '#2A5F8F',
  blueLight: 'rgba(30,73,118,0.08)',
  green: '#2D6A4F',
  greenLight: 'rgba(45,106,79,0.08)',
  amber: '#8C5E1A',
  amberLight: 'rgba(140,94,26,0.08)',
  red: '#B43C28',
  redLight: 'rgba(180,60,40,0.08)',
  border: 'rgba(17,26,36,0.11)',
  borderMid: 'rgba(17,26,36,0.18)',
  muted: 'rgba(17,26,36,0.42)',
  surface: 'rgba(255,255,255,0.92)',
};

const FONT_SANS = "'Jost', sans-serif";
const FONT_SERIF = "'Cormorant Garamond', Georgia, serif";

const REPORT_TYPES = [
  { id: 'phase1', label: 'Phase I ESA', desc: 'ASTM E1527-21 site assessment' },
  { id: 'swppp', label: 'SWPPP Inspection', desc: 'TPDES TXR150000 stormwater' },
  { id: 'wetland', label: 'Wetland Delineation', desc: '1987 Corps manual + regional supp.' },
  { id: 'sar', label: 'SAR Analysis', desc: 'Backscatter, NDVI, land cover' },
  { id: 'field', label: 'Field Survey', desc: 'General environmental observation' },
  { id: 'custom', label: 'Custom Report', desc: 'Freeform from your notes' },
];

interface RegData {
  coordinates: { lat: number; lng: number };
  address: string;
  county: string;
  state: string;
  fema: { floodZone: string; floodZoneDesc: string; panelNumber: string; risk: string };
  epaEcho: { totalCount: number; facilitiesNearby: { name: string; type: string; violations: string }[]; risk: string };
  nwi: { wetlandsPresent: boolean; wetlandTypes: string[]; acresEstimate: string; risk: string };
  soils: { mapUnits: { name: string; hydric: boolean; drainage: string; shrinkSwell?: string; waterTableDepth?: string }[]; hydricPercent: number; interpretation: string; risk: string };
  elevation: { elevationFt: number | null; elevationM: number | null };
  hydrology: { nearbyStreams: { name: string; type: string }[]; withinHUC: boolean };
  geology: { formation: string; lithology: string; age: string; description: string };
  overallRisk: { level: string; score: number; summary: string };

  tceq?: {
    checked: boolean;
    source: string;
    totalCount: number;
    facilitiesNearby: Array<{
      name: string;
      source: 'TCEQ';
      dataset: 'LPST' | 'PST' | 'DRYCLEANER' | 'VCP' | 'IHWCA';
      type: string;
      program: string;
      status?: string;
      address?: string;
      city?: string;
      county?: string;
      lat?: number | null;
      lng?: number | null;
      distanceMi?: number | null;
      riskClass: 'LOW' | 'MODERATE' | 'HIGH';
      weight?: number;
      violations?: string;
    }>;
    layerStatus?: Array<{ dataset: string; label: string; status: 'OK' | 'ERROR'; error?: string | null; count: number }>;
    lpstCount?: number;
    dryCleanerCount?: number;
    highRiskCount?: number;
  };

  historical?: {
    checked: boolean;
    historicalConfidence: 'COMPLETE' | 'PARTIAL' | 'MINIMAL' | 'UNAVAILABLE';
    automatedCount: number;
    manualCount: number;
    address?: string;
    county?: string;
    sources: Array<{
      name: string;
      status: 'LINK_GENERATED' | 'CHECKED_NONE_FOUND' | 'MANUAL_REQUIRED';
      confidence: 'COMPLETE' | 'PARTIAL' | 'MINIMAL' | 'UNAVAILABLE';
      link?: string | null;
      use: string;
      astmRequired: boolean;
    }>;
    gaps: string[];
    topoViewerUrl?: string;
    historicAerialsUrl?: string;
    earthExplorerUrl?: string;
    sanbornUrl?: string;
    noSanbornReview?: boolean;
    noCityDirectories?: boolean;
    noPermitReview?: boolean;
    noLienSearch?: boolean;
  };
}


interface ParcelData {
  parcel: {
    parcelId: string;
    ownerName: string;
    ownerType: string;
    landUseDescription: string;
    propertyClass: string;
    acres: number | null;
    yearBuilt: number | null;
    buildingSqFt: number | null;
    legalDescription: string | null;
    assessedLandValue: number | null;
    assessedImprovementValue: number | null;
    source: string;
    confidence: string;
  };
  landCover: {
    nlcdClass: string;
    developedPercent: number;
    imperviousPercent: number;
    cultivatedCropPercent: number;
    source: string;
    confidence: string;
  };
  zoning: {
    jurisdiction: string;
    zoningCode: string;
    zoningDescription: string;
    futureLandUse: string | null;
    source: string;
    confidence: string;
  };
  receptors: {
    nearestSchoolMi: number | null;
    nearestParkMi: number | null;
    nearestSurfaceWaterMi: number | null;
    nearestHospitalMi: number | null;
    source: string;
    confidence: string;
  };
  occupant: {
    useCategory: string;
    environmentalUseRisk: string;
    riskBasis: string;
    source: string;
  };
}

interface LibraryEntry {
  id: number; title: string; type: string; date: string; status: string;
}

// ── Risk Score Engine ─────────────────────────────────────────────────────────
function computeCetoScore(reg: RegData, parcelArg?: ParcelData | null): { total: number; breakdown: Record<string, { score: number; max: number; label: string; risk: string }> } {
  try {
    const input = deriveScoreInput(reg, parcelArg || null, '');
    const result = computeCetoScoreReal(input);
    const b = result.breakdown;
    return {
      total: result.finalScore,
      breakdown: {
        flood:         { score: Math.round((1 - b.flood / 100)         * 20), max: 20, label: 'Flood Risk',             risk: b.flood > 50 ? 'HIGH' : b.flood > 20 ? 'MODERATE' : 'LOW' },
        wetland:       { score: Math.round((1 - b.wetland / 100)       * 20), max: 20, label: 'Wetland Risk',           risk: b.wetland > 50 ? 'HIGH' : b.wetland > 20 ? 'MODERATE' : 'LOW' },
        contamination: { score: Math.round((1 - b.regulatory / 100)    * 25), max: 25, label: 'Contamination Risk',     risk: b.regulatory > 50 ? 'HIGH' : b.regulatory > 20 ? 'MODERATE' : 'LOW' },
        soil:          { score: Math.round((1 - b.soil / 100)          * 20), max: 20, label: 'Soil / Development Risk',risk: b.soil > 50 ? 'HIGH' : b.soil > 20 ? 'MODERATE' : 'LOW' },
        regulatory:    { score: Math.round((1 - b.historicalUse / 100) * 15), max: 15, label: 'Regulatory Compliance',  risk: b.historicalUse > 50 ? 'HIGH' : b.historicalUse > 20 ? 'MODERATE' : 'LOW' },
      },
    };
  } catch {
    const floodScore  = reg.fema.floodZone === 'X' ? 20 : reg.fema.floodZone.startsWith('A') ? 5 : 10;
    const wetlandScore= reg.nwi.wetlandsPresent ? (parseFloat(reg.nwi.acresEstimate) > 1 ? 5 : 12) : 20;
    const contScore   = reg.epaEcho.totalCount === 0 ? 25 : reg.epaEcho.totalCount <= 2 ? 15 : 5;
    const soilScore   = reg.soils.hydricPercent > 50 ? 5 : reg.soils.hydricPercent > 0 ? 12 : 20;
    return {
      total: floodScore + wetlandScore + contScore + soilScore + 12,
      breakdown: {
        flood:         { score: floodScore,   max: 20, label: 'Flood Risk',             risk: floodScore >= 16   ? 'LOW' : floodScore >= 10   ? 'MODERATE' : 'HIGH' },
        wetland:       { score: wetlandScore, max: 20, label: 'Wetland Risk',           risk: wetlandScore >= 16 ? 'LOW' : wetlandScore >= 10 ? 'MODERATE' : 'HIGH' },
        contamination: { score: contScore,    max: 25, label: 'Contamination Risk',     risk: contScore >= 20    ? 'LOW' : contScore >= 12    ? 'MODERATE' : 'HIGH' },
        soil:          { score: soilScore,    max: 20, label: 'Soil / Development Risk',risk: soilScore >= 16    ? 'LOW' : soilScore >= 10    ? 'MODERATE' : 'HIGH' },
        regulatory:    { score: 12,           max: 15, label: 'Regulatory Compliance',  risk: 'LOW' },
      },
    };
  }
}

function getRiskColor(risk: string) {
  return risk === 'LOW' ? T.green : risk === 'MODERATE' ? T.amber : T.red;
}

function getRiskBg(risk: string) {
  return risk === 'LOW' ? T.greenLight : risk === 'MODERATE' ? T.amberLight : T.redLight;
}

function Badge({ label, color }: { label: string; color: 'blue' | 'green' | 'red' | 'gray' | 'amber' }) {
  const styles = {
    blue: { bg: 'rgba(30,73,118,0.10)', color: '#1E4976' },
    green: { bg: 'rgba(45,106,79,0.12)', color: '#2D6A4F' },
    red: { bg: 'rgba(180,60,40,0.10)', color: '#B43C28' },
    gray: { bg: 'rgba(17,26,36,0.08)', color: 'rgba(17,26,36,0.55)' },
    amber: { bg: 'rgba(140,94,26,0.10)', color: '#8C5E1A' },
  }[color];
  return (
    <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: FONT_SANS, padding: '3px 8px', borderRadius: 2, backgroundColor: styles.bg, color: styles.color }}>
      {label}
    </span>
  );
}

// ── CETO Score Panel ──────────────────────────────────────────────────────────
function CetoScorePanel({ reg, parcel }: { reg: RegData; parcel: ParcelData | null }) {
  const { total, breakdown } = computeCetoScore(reg, parcel);
  const overallRisk = total >= 80 ? 'LOW' : total >= 55 ? 'MODERATE' : 'HIGH';
  const riskColor = getRiskColor(overallRisk);

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden', marginBottom: 14 }}>
      {/* Score header */}
      <div style={{ padding: '16px 20px', background: `linear-gradient(135deg, ${T.blue} 0%, #1A3D6A 100%)`, color: 'white' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', fontFamily: FONT_SANS, marginBottom: 8 }}>
          CETO Environmental Risk Score
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 8 }}>
          <div style={{ fontSize: 52, fontFamily: FONT_SERIF, fontWeight: 300, lineHeight: 1, color: 'white' }}>{total}</div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>/100</div>
          <div style={{ marginBottom: 8, padding: '4px 12px', borderRadius: 2, fontSize: 11, fontFamily: FONT_SANS, fontWeight: 400, letterSpacing: '0.08em', backgroundColor: getRiskBg(overallRisk), color: riskColor }}>
            {overallRisk} RISK
          </div>
        </div>
        {/* Score bar */}
        <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${total}%`, backgroundColor: total >= 80 ? '#6FCF97' : total >= 55 ? '#F2C94C' : '#EB5757', borderRadius: 2, transition: 'width 0.8s ease' }} />
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, fontFamily: FONT_SANS, marginBottom: 10 }}>Score Breakdown</div>
        {Object.entries(breakdown).map(([key, item]) => (
          <div key={key} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: T.ink, fontFamily: FONT_SANS, fontWeight: 300 }}>{item.label}</span>
              <span style={{ fontSize: 11, fontFamily: FONT_SANS, color: getRiskColor(item.risk), fontWeight: 400 }}>{item.score}/{item.max}</span>
            </div>
            <div style={{ height: 3, backgroundColor: 'rgba(17,26,36,0.08)', borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(item.score / item.max) * 100}%`, backgroundColor: getRiskColor(item.risk), borderRadius: 1 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Go/No-Go Dashboard ────────────────────────────────────────────────────────
function GoNoGo({ reg }: { reg: RegData }) {
  const { total } = computeCetoScore(reg, null);
  const proceed = total >= 70;
  const phase2 = reg.epaEcho.totalCount > 0 || reg.soils.hydricPercent > 25;
  const wetlandConcern = reg.nwi.wetlandsPresent ? 'MODERATE' : 'LOW';
  const floodConcern = reg.fema.floodZone === 'X' ? 'LOW' : 'HIGH';
  const permitConcern = reg.nwi.wetlandsPresent || reg.fema.floodZone !== 'X' ? 'MODERATE' : 'LOW';

  const decisions = [
    { label: 'Proceed with Acquisition', value: proceed ? 'YES' : 'CONDITIONAL', risk: proceed ? 'LOW' : 'MODERATE' },
    { label: 'Phase II ESA Needed', value: phase2 ? 'RECOMMENDED' : 'NO', risk: phase2 ? 'MODERATE' : 'LOW' },
    { label: 'Wetland Concern', value: wetlandConcern, risk: wetlandConcern },
    { label: 'Flood Concern', value: floodConcern, risk: floodConcern },
    { label: 'Permitting Concern', value: permitConcern, risk: permitConcern },
    { label: 'Estimated Delay Risk', value: (phase2 || wetlandConcern === 'MODERATE') ? 'MODERATE' : 'LOW', risk: (phase2 || wetlandConcern === 'MODERATE') ? 'MODERATE' : 'LOW' },
  ];

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.blueLight }}>
        <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.blue, fontFamily: FONT_SANS }}>Go / No-Go Acquisition Dashboard</div>
      </div>
      <div style={{ padding: '12px 18px' }}>
        {decisions.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < decisions.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <span style={{ fontSize: 12, color: T.ink, fontFamily: FONT_SANS, fontWeight: 300 }}>{d.label}</span>
            <span style={{ fontSize: 10, letterSpacing: '0.10em', fontFamily: FONT_SANS, fontWeight: 400, padding: '3px 10px', borderRadius: 2, backgroundColor: getRiskBg(d.risk), color: getRiskColor(d.risk) }}>
              {d.value}
            </span>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 18px', borderTop: `1px solid ${T.border}`, backgroundColor: 'rgba(17,26,36,0.02)', fontSize: 10, color: T.muted, fontFamily: FONT_SANS, lineHeight: 1.6 }}>
        {reg.overallRisk.summary}
      </div>
    </div>
  );
}

// ── Environmental Screening Summary Table ─────────────────────────────────────
function ScreeningSummary({ reg }: { reg: RegData }) {
  const rows = [
    { category: 'Flood Zone', result: reg.fema.floodZone, detail: reg.fema.floodZoneDesc.split('—')[0].trim(), risk: reg.fema.risk },
    { category: 'Wetlands (NWI)', result: reg.nwi.wetlandsPresent ? `${reg.nwi.acresEstimate} ac mapped` : 'None mapped', detail: reg.nwi.wetlandsPresent ? reg.nwi.wetlandTypes.join(', ') : 'No jurisdictional wetlands', risk: reg.nwi.risk },
    { category: 'EPA Facilities', result: `${reg.epaEcho.totalCount} within 1 mi`, detail: reg.epaEcho.totalCount === 0 ? 'No regulated facilities' : reg.epaEcho.facilitiesNearby[0]?.name || '', risk: reg.epaEcho.risk },
    { category: 'Soil Hydric Rating', result: `${reg.soils.hydricPercent}% hydric`, detail: reg.soils.mapUnits[0]?.name || 'Unknown', risk: reg.soils.risk },
    { category: 'Elevation', result: reg.elevation.elevationFt ? `${reg.elevation.elevationFt} ft MSL` : 'N/A', detail: reg.hydrology.nearbyStreams.length > 0 ? `Near ${reg.hydrology.nearbyStreams[0].name}` : 'No named streams', risk: 'LOW' },
    { category: 'Geology', result: reg.geology.formation !== 'Unknown' ? reg.geology.formation : 'Unknown', detail: reg.geology.lithology, risk: 'LOW' },
    { category: 'TCEQ STEERS', result: 'Manual review', detail: `${reg.county} — search required`, risk: 'LOW' },
  ];

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, fontFamily: FONT_SANS }}>Environmental Screening Summary</div>
      </div>
      <div>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 70px', gap: 10, padding: '9px 18px', borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT_SANS, fontWeight: 400 }}>{row.category}</div>
            <div>
              <div style={{ fontSize: 12, color: T.ink, fontFamily: FONT_SANS, fontWeight: 300 }}>{row.result}</div>
              <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT_SANS }}>{row.detail}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 9, letterSpacing: '0.10em', fontFamily: FONT_SANS, padding: '2px 7px', borderRadius: 2, backgroundColor: getRiskBg(row.risk), color: getRiskColor(row.risk) }}>
                {row.risk}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Full Regulatory Panel ─────────────────────────────────────────────────────
function RegPanel({ data, loading, error, parcel }: { data: RegData | null; loading: boolean; error: string; parcel: ParcelData | null }) {
  if (loading) return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, backgroundColor: T.surface }}>
      <div style={{ fontSize: 13, color: T.muted, fontFamily: FONT_SANS }}>Pulling 7 federal databases in parallel...</div>
      <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT_SANS, marginTop: 4 }}>FEMA · EPA ECHO · USFWS NWI · USDA SSURGO · USGS Elevation · NHD Hydrology · Macrostrat Geology</div>
    </div>
  );
  if (error) return (
    <div style={{ border: `1px solid rgba(180,60,40,0.25)`, borderRadius: 4, padding: 16, backgroundColor: T.redLight }}>
      <div style={{ fontSize: 12, color: T.red, fontFamily: FONT_SANS }}>{error}</div>
    </div>
  );
  if (!data) return (
    <div style={{ border: `1px dashed ${T.borderMid}`, borderRadius: 4, padding: 24, backgroundColor: T.surface, textAlign: 'center' }}>
      <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, fontFamily: FONT_SANS, marginBottom: 10 }}>Regulatory Intelligence</div>
      <div style={{ fontSize: 13, color: T.muted, fontFamily: FONT_SANS, fontWeight: 300, lineHeight: 1.6, marginBottom: 16 }}>
        Enter a location and click <span style={{ color: T.blue }}>⚡ Pull</span> to auto-populate from 7 live federal databases
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {['FEMA Flood Zone', 'EPA ECHO Facilities', 'USFWS NWI Wetlands', 'USDA SSURGO Soils', 'USGS Elevation', 'NHD Hydrology', 'Macrostrat Geology', 'CETO Risk Score'].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(17,26,36,0.35)', fontFamily: FONT_SANS }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'rgba(17,26,36,0.20)' }} />
            {s}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 180px)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
      {/* Header */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.blue, fontFamily: FONT_SANS }}>Regulatory Intelligence</div>
            <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT_SANS, marginTop: 2 }}>{data.address} · {data.county}</div>
          </div>
          <Badge label="✓ Live data" color="green" />
        </div>

        {/* Elevation + Geology quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
          {[
            { label: 'Elevation', value: data.elevation.elevationFt ? `${data.elevation.elevationFt} ft` : 'N/A', sub: 'MSL · USGS NED' },
            { label: 'Formation', value: data.geology.formation !== 'Unknown' ? data.geology.formation.split(' ').slice(0,2).join(' ') : 'Unknown', sub: data.geology.lithology || 'Macrostrat' },
            { label: 'Streams', value: data.hydrology.nearbyStreams.length > 0 ? data.hydrology.nearbyStreams[0].name || 'Present' : 'None nearby', sub: 'USGS NHD' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '10px 16px', borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, fontFamily: FONT_SANS, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 13, color: T.ink, fontFamily: FONT_SANS, fontWeight: 300 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: T.muted, fontFamily: FONT_SANS }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CETO Score */}
      <CetoScorePanel reg={data} parcel={parcel} />

      {/* Go/No-Go */}
      <GoNoGo reg={data} />

      {/* Screening Summary Table */}
      <ScreeningSummary reg={data} />

      {/* Soils interpretation */}
      {data.soils.interpretation && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, padding: '12px 18px', marginBottom: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, fontFamily: FONT_SANS, marginBottom: 6 }}>Soils Interpretation</div>
          <div style={{ fontSize: 12, color: T.ink, fontFamily: FONT_SANS, fontWeight: 300, lineHeight: 1.7 }}>{data.soils.interpretation}</div>
          {data.soils.mapUnits.slice(0, 2).map((u, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8, padding: '8px 10px', backgroundColor: 'rgba(17,26,36,0.02)', borderRadius: 2 }}>
              <div><div style={{ fontSize: 9, color: T.muted, fontFamily: FONT_SANS }}>Series</div><div style={{ fontSize: 11, color: T.ink, fontFamily: FONT_SANS }}>{u.name}</div></div>
              <div><div style={{ fontSize: 9, color: T.muted, fontFamily: FONT_SANS }}>Drainage</div><div style={{ fontSize: 11, color: T.ink, fontFamily: FONT_SANS }}>{u.drainage}</div></div>
              <div><div style={{ fontSize: 9, color: T.muted, fontFamily: FONT_SANS }}>Hydric</div><div style={{ fontSize: 11, color: u.hydric ? T.amber : T.green, fontFamily: FONT_SANS }}>{u.hydric ? 'Yes' : 'No'}</div></div>
            </div>
          ))}
        </div>
      )}

      {/* TCEQ manual link */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, fontFamily: FONT_SANS }}>TCEQ STEERS</div>
          <Badge label="Manual review" color="gray" />
        </div>
        <div style={{ fontSize: 12, color: T.ink, fontFamily: FONT_SANS, fontWeight: 300, marginTop: 6 }}>Search required for {data.county}</div>
        <a href="https://www2.tceq.texas.gov/oce/eer/index.cfm" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 11, color: T.blue, fontFamily: FONT_SANS, display: 'block', marginTop: 4, textDecoration: 'none' }}>
          → Open TCEQ STEERS ↗
        </a>
      </div>
    </div>
  );
}

function exportPDF(reportText: string, title: string, reg: RegData | null, parcel: ParcelData | null, clientName: string, location: string, surveyDate: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  const score = reg ? computeCetoScore(reg, parcel) : null;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;font-size:10.5pt;line-height:1.8;color:#111A24}
    .page{max-width:760px;margin:0 auto;padding:64px 80px}
    .cover{border-bottom:2px solid #1E4976;padding-bottom:24px;margin-bottom:28px}
    .logo{font-size:22pt;font-weight:300;color:#111A24}.logo span{color:#1E4976}
    .title{font-size:16pt;color:#1E4976;margin:16px 0 6px;font-weight:300}
    .meta{font-size:9pt;color:#555;line-height:2}
    .score-box{background:#1E4976;color:white;padding:16px 20px;margin:20px 0;border-radius:2px;display:flex;align-items:center;gap:24px}
    .score-num{font-size:36pt;font-weight:300;font-family:Georgia,serif}
    .score-label{font-size:8pt;letter-spacing:.15em;text-transform:uppercase;opacity:.6;margin-bottom:4px}
    .score-risk{font-size:10pt;background:rgba(255,255,255,0.15);padding:4px 12px;border-radius:2px;display:inline-block}
    .gonogo{border:1px solid #ddd;margin:16px 0;border-radius:2px}
    .gonogo-row{display:flex;justify-content:space-between;padding:7px 14px;border-bottom:1px solid #eee;font-size:9.5pt}
    .gonogo-row:last-child{border:none}
    .badge{font-size:7.5pt;letter-spacing:.10em;text-transform:uppercase;padding:2px 8px;border-radius:2px}
    .low{background:#EAF3DE;color:#2D6A4F}.mod{background:#FAEEDA;color:#8C5E1A}.high{background:#FCEBEB;color:#B43C28}
    .section{margin:20px 0}
    .section-title{font-size:7.5pt;letter-spacing:.20em;text-transform:uppercase;color:#1E4976;font-family:Arial,sans-serif;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:10px}
    pre{white-space:pre-wrap;font-family:Georgia,serif;font-size:10.5pt;line-height:1.8}
    .footer{margin-top:48px;padding-top:16px;border-top:1px solid #ddd;font-size:7.5pt;color:#aaa;font-family:Arial,sans-serif}
    @media print{.page{padding:48px 64px}}
  </style></head><body><div class="page">
  <div class="cover">
    <div class="logo">Ceto<span>Interactive</span></div>
    <div class="title">${title}</div>
    <div class="meta">
      ${clientName ? `Client: ${clientName}<br>` : ''}
      ${location ? `Location: ${location}<br>` : ''}
      Survey Date: ${surveyDate || new Date().toLocaleDateString()}<br>
      Report Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
      Prepared by: Ceto Interactive Environmental Consulting · McKinney, Texas · cetointeractive.com
    </div>
  </div>
  ${score && reg ? `
  <div class="score-box">
    <div>
      <div class="score-label">CETO Environmental Risk Score</div>
      <div style="display:flex;align-items:flex-end;gap:8px">
        <span class="score-num">${score.total}</span>
        <span style="opacity:.5;margin-bottom:6px">/100</span>
        <span class="score-risk">${score.total >= 80 ? 'LOW' : score.total >= 55 ? 'MODERATE' : 'HIGH'} RISK</span>
      </div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Go / No-Go Acquisition Summary</div>
    <div class="gonogo">
      <div class="gonogo-row"><span>Flood Zone</span><span class="badge ${reg.fema.floodZone === 'X' ? 'low' : 'high'}">${reg.fema.floodZone} — ${reg.fema.risk}</span></div>
      <div class="gonogo-row"><span>Wetlands (NWI)</span><span class="badge ${reg.nwi.wetlandsPresent ? 'mod' : 'low'}">${reg.nwi.wetlandsPresent ? reg.nwi.acresEstimate + ' ac — MODERATE' : 'None — LOW'}</span></div>
      <div class="gonogo-row"><span>EPA Facilities (1 mi)</span><span class="badge ${reg.epaEcho.totalCount > 0 ? 'mod' : 'low'}">${reg.epaEcho.totalCount} facilities — ${reg.epaEcho.risk}</span></div>
      <div class="gonogo-row"><span>Soils Hydric</span><span class="badge ${reg.soils.hydricPercent > 0 ? 'mod' : 'low'}">${reg.soils.hydricPercent}% — ${reg.soils.risk}</span></div>
      <div class="gonogo-row"><span>Elevation</span><span class="badge low">${reg.elevation.elevationFt ? reg.elevation.elevationFt + ' ft MSL' : 'N/A'}</span></div>
    </div>
    <div style="font-size:9pt;color:#555;margin-top:8px">${reg.overallRisk.summary}</div>
  </div>
  ${reg.soils.interpretation ? `<div class="section"><div class="section-title">Soils Interpretation</div><p style="font-size:9.5pt">${reg.soils.interpretation}</p></div>` : ''}
  ` : ''}
  <div class="section"><div class="section-title">Full Report</div><pre>${reportText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div>
  <div class="footer">© ${new Date().getFullYear()} Ceto Interactive · Confidential · All regulatory data reflects conditions at time of query.</div>
  </div><script>window.onload=()=>window.print()<\/script></body></html>`);
  win.document.close();
}

function ReportsPageInner() {
  const searchParams = useSearchParams();
  const typeMap: Record<string,string> = { sar:'sar', field:'field', wetland:'wetland', swppp:'swppp', custom:'custom' };
  const initialType = typeMap[searchParams.get('type') || ''] || 'phase1';

  const [selectedType, setSelectedType] = useState(initialType);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [surveyDate, setSurveyDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [tab, setTab] = useState<'generate' | 'parcel' | 'historical' | 'swppp' | 'library'>('generate');
  const [copied, setCopied] = useState(false);
  const [genError, setGenError] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [reconData, setReconData] = useState<ReconData | null>(null);
  const [federalDB, setFederalDB] = useState<FederalDBData | null>(null);
  const [mapSnapshot, setMapSnapshot] = useState<string | null>(null);
  const [parcelIntel, setParcelIntel] = useState<ParcelIntelData | null>(null);
  const [historicalResearch, setHistoricalResearch] = useState<HistoricalResearchData | null>(null);
  const [reg, setReg] = useState<RegData | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [parcel, setParcel] = useState<ParcelData | null>(null);
  const [parcelLoading, setParcelLoading] = useState(false);

  const pullReg = useCallback(async () => {
    if (!location.trim()) return;
    setRegLoading(true); setRegError(''); setReg(null);
    try {
      const res = await fetch('/api/portal/regulatory-intel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: location.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lookup failed');
      setReg(data);

      // Fire TCEQ intel in background — merge into reg facilities
      if (data?.coordinates?.lat && data?.coordinates?.lng) {
        fetch('/api/portal/tceq-intel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coordinates: data.coordinates }),
        })
          .then(r => r.json())
          .then(tceq => {
            if (tceq?.facilitiesNearby?.length > 0) {
              setReg((prev: RegData | null) => prev ? {
                ...prev,
                tceq,
                epaEcho: {
                  ...prev.epaEcho,
                  facilitiesNearby: [
                    ...(prev.epaEcho?.facilitiesNearby || []),
                    ...(tceq.facilitiesNearby || []),
                  ],
                  totalCount: (prev.epaEcho?.totalCount || 0) + (tceq.totalCount || 0),
                },
              } : prev);
            }
          })
          .catch(() => null); // TCEQ failure is non-fatal
      }

      // Fire parcel intel in background after coordinates resolve
      if (data?.coordinates?.lat && data?.coordinates?.lng) {
        setParcelLoading(true);
        fetch('/api/portal/parcel-intel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: data.coordinates.lat, lng: data.coordinates.lng, county: data.county }),
        })
          .then(r => r.json())
          .then(p => { setParcel(p); setParcelLoading(false); })
          .catch(() => setParcelLoading(false));

        // Fire historical intel in background
        fetch('/api/portal/historical-intel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coordinates: data.coordinates, address: data.address, county: data.county }),
        })
          .then(r => r.json())
          .then(h => {
            setReg((prev: RegData | null) => prev ? { ...prev, historical: h } : prev);
          })
          .catch(() => null);
      }
    } catch (e: unknown) {
      setRegError(e instanceof Error ? e.message : 'Regulatory lookup failed');
    }
    setRegLoading(false);
  }, [location]);

  const buildRegContext = (r: RegData | null) => !r ? '' : `

REGULATORY DATABASE FINDINGS (${new Date().toLocaleDateString()}):
Address: ${r.address} · County: ${r.county} · State: ${r.state}
Coordinates: ${r.coordinates.lat.toFixed(5)}°N, ${Math.abs(r.coordinates.lng).toFixed(5)}°W
Elevation: ${r.elevation.elevationFt ? r.elevation.elevationFt + ' ft MSL' : 'Unknown'} (USGS NED)

CETO Risk Score: ${computeCetoScore(r).total}/100 — ${computeCetoScore(r).total >= 80 ? 'LOW' : computeCetoScore(r).total >= 55 ? 'MODERATE' : 'HIGH'} RISK

FEMA: ${r.fema.floodZone} — ${r.fema.floodZoneDesc} (Panel: ${r.fema.panelNumber})
EPA ECHO: ${r.epaEcho.totalCount > 0 ? r.epaEcho.totalCount + ' facilities: ' + r.epaEcho.facilitiesNearby.map(f => f.name).join(', ') : 'No regulated facilities within 1 mile'}
USFWS NWI: ${r.nwi.wetlandsPresent ? r.nwi.acresEstimate + ' acres (' + r.nwi.wetlandTypes.join(', ') + ')' : 'No wetlands mapped'}
USDA SSURGO: ${r.soils.mapUnits.map(u => u.name + ' / ' + u.drainage + (u.hydric ? ' / Hydric' : '')).join('; ')} (${r.soils.hydricPercent}% hydric)
Soils Interpretation: ${r.soils.interpretation}
Geology: ${r.geology.formation} — ${r.geology.lithology} (${r.geology.age})
Hydrology: ${r.hydrology.nearbyStreams.length > 0 ? 'Nearby streams: ' + r.hydrology.nearbyStreams.map(s => s.name).join(', ') : 'No named streams within 2km'}
TCEQ: Manual STEERS search required for ${r.county}

Overall Risk Assessment: ${r.overallRisk.summary}

Incorporate ALL of the above into appropriate report sections with proper citations to source databases.

NEAREST FACILITY NARRATIVE (use verbatim in Section 5):
${generateNearestFacilityNarrative(r as any)}

RISK INTERPRETATION (use verbatim in Conclusions):
${generateRiskInterpretation(r as any)}`;

  const generate = async () => {
    if (!projectName.trim() || !notes.trim() || !location.trim()) return;
    setGenerating(true); setReport(null); setGenError('');
    const rType = REPORT_TYPES.find(r => r.id === selectedType);
    const t = `${rType?.label} — ${projectName}`;
    setReportTitle(t);

    const systemPrompt = `You are a credentialed Environmental Professional (EP) at Ceto Interactive environmental consulting in McKinney, Texas. Generate complete, professional environmental reports that are ASTM E1527-21 compliant, defensible, and written for both technical professionals and non-technical clients/lenders/investors. Always include numbered sections, cite data sources, and provide clear risk ratings.`;

    const userPrompt = `Generate a complete, professional ${rType?.label} report.

PROJECT: ${projectName}
CLIENT: ${clientName || 'Confidential'}
LOCATION: ${location || 'Texas'}
SURVEY DATE: ${surveyDate}
REPORT TYPE: ${rType?.label} (${rType?.desc})
PREPARED BY: Ceto Interactive Environmental Consulting, McKinney, TX · EP Credentialed per ASTM E1527-21

FIELD OBSERVATIONS:
${notes}
${buildRegContext(reg)}

Generate a complete ${rType?.label} with all standard sections including Executive Summary with risk rating, Site Overview, Methodology, Records Review with database citations, Site Reconnaissance, Findings (RECs/CRECs/HRECs), Data Gaps, Conclusions, and Recommendations. Minimum 700 words. Be thorough and defensible.`;

    try {
      const res = await fetch('/api/portal/generate-report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          // Structured fields so API can use them directly (fixes "Unknown Project" bug)
          projectName: projectName.trim(),
          clientName: clientName.trim() || 'Confidential',
          location: location.trim(),
          surveyDate,
          notes: notes.trim(),
          reportType: REPORT_TYPES.find(r => r.id === selectedType)?.label || 'Phase I ESA',
          regContext: buildRegContext(reg),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setReport(data.report);
      setLibrary(prev => [{ id: Date.now(), title: t, type: rType?.label || 'Custom', date: new Date().toISOString().split('T')[0], status: 'draft' }, ...prev]);
      try { sessionStorage.setItem('ceto_report_count', String(parseInt(sessionStorage.getItem('ceto_report_count') || '0') + 1)); } catch {}
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : 'Report generation failed');
    }
    setGenerating(false);
  };

  const exportPdf = async () => {
    if (!reg) return;
    setExportingPdf(true);
    try {
      const score = computeCetoScore(reg, parcel);
      const echoFacs = reg?.epaEcho?.facilitiesNearby || [];
      const tceqFacs = (reg as any)?.tceq?.facilitiesNearby || [];
      const seen = new Set<string>();
      const allFacs = [...echoFacs, ...tceqFacs]
        .filter(f => { const k = String(f.name)+String(f.distanceMi); if(seen.has(k))return false; seen.add(k); return true; })
        .sort((a,b) => ((a.distanceMi??99) as number)-((b.distanceMi??99) as number));

      const decisions = [
        { label: 'Proceed with Acquisition', value: score.total >= 55 ? 'YES' : 'CONDITIONAL', risk: score.total >= 55 ? 'LOW' : 'MODERATE' },
        { label: 'Phase II ESA Needed', value: score.total < 75 ? 'RECOMMENDED' : 'NOT REQUIRED', risk: score.total < 75 ? 'MODERATE' : 'LOW' },
        { label: 'Wetland Concern', value: reg.nwi?.wetlandsPresent ? 'MODERATE' : 'LOW', risk: reg.nwi?.wetlandsPresent ? 'MODERATE' : 'LOW' },
        { label: 'Flood Concern', value: reg.fema?.risk || 'LOW', risk: reg.fema?.risk || 'LOW' },
      ];

      const screeningRows = [
        { category: 'Flood Zone', result: `Zone ${reg.fema?.floodZone || 'X'}`, detail: reg.fema?.floodZoneDesc || 'Zone X (minimal)', risk: reg.fema?.risk || 'LOW' },
        { category: 'Wetlands (NWI)', result: reg.nwi?.wetlandsPresent ? 'Wetlands mapped' : 'None mapped', detail: reg.nwi?.wetlandTypes?.[0] || 'No jurisdictional wetlands', risk: reg.nwi?.risk || 'LOW' },
        { category: 'TCEQ Facilities', result: `${allFacs.length} within 1 mi`, detail: allFacs[0]?.name || 'None', risk: allFacs.length > 10 ? 'MODERATE' : 'LOW' },
        { category: 'Hydric Soils', result: `${reg.soils?.hydricPercent || 0}% hydric`, detail: reg.soils?.mapUnits?.[0]?.name || 'Unknown', risk: (reg.soils?.hydricPercent || 0) > 20 ? 'MODERATE' : 'LOW' },
        { category: 'Elevation', result: reg.elevation?.elevationFt ? `${reg.elevation.elevationFt} ft MSL` : 'N/A', detail: reg.hydrology?.nearbyStreams?.length ? `${reg.hydrology.nearbyStreams[0].name} nearby` : 'No named streams', risk: 'LOW' },
        { category: 'Geology', result: reg.geology?.formation || 'Unknown', detail: reg.geology?.lithology || '—', risk: 'LOW' },
      ];

      const res = await fetch('/api/portal/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'phase1',
          projectName: projectName || 'Unknown Project',
          clientName: clientName || 'Confidential',
          location: location,
          surveyDate,
          county: reg.county || 'Unknown',
          cetoScore: score.total,
          ratingCode: score.total >= 90 ? 'LOW' : score.total >= 75 ? 'MODERATE_LOW' : score.total >= 60 ? 'MODERATE' : score.total >= 40 ? 'ELEVATED' : 'HIGH',
          scoreBreakdown: score.breakdown,
          decisions,
          screeningRows,
          facilities: allFacs,
          fema: { zone: reg.fema?.floodZone || 'X', classification: reg.fema?.floodZoneDesc || 'Zone X', risk: reg.fema?.risk || 'LOW' },
          geology: reg.geology || { formation: 'Unknown', lithology: 'Unknown', age: 'Unknown' },
          elevation: reg.elevation || { elevationFt: null },
          hydrology: reg.hydrology || { nearbyStreams: [] },
          soils: reg.soils || { hydricPercent: 0, interpretation: '' },
          reportText: report || '',
          parcelData: parcelIntel,
          historicalData: historicalResearch,
          mapSnapshot: mapSnapshot || null,
          preparedBy: 'Ceto Interactive Environmental Consulting · McKinney, Texas',
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CetoESA_${(projectName || 'Report').replace(/\s+/g,'_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('PDF export failed: ' + String(e));
    }
    setExportingPdf(false);
  };

  const inputStyle = { width: '100%', boxSizing: 'border-box' as const, fontSize: 13, fontFamily: FONT_SANS, fontWeight: 300, padding: '9px 12px', backgroundColor: 'rgba(17,26,36,0.03)', border: `1px solid ${T.border}`, borderRadius: 2, outline: 'none', color: T.ink };
  const labelStyle = { display: 'block' as const, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: T.muted, marginBottom: 6, fontFamily: FONT_SANS };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: T.bg, fontFamily: FONT_SANS }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 28px', backgroundColor: T.surface, borderBottom: `1px solid ${T.border}`, backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <a href="/portal" style={{ fontSize: 12, color: T.muted, textDecoration: 'none', fontFamily: FONT_SANS }}>← Dashboard</a>
          <span style={{ color: T.border }}>·</span>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 18, color: T.ink, fontWeight: 300 }}>Reports</div>
          {reg && <Badge label={`CETO Score: ${computeCetoScore(reg, parcel).total}/100`} color={computeCetoScore(reg, parcel).total >= 80 ? 'green' : computeCetoScore(reg, parcel).total >= 55 ? 'amber' : 'red'} />}
        </div>
        <div style={{ display: 'flex', gap: 2, padding: 4, backgroundColor: 'rgba(17,26,36,0.06)', borderRadius: 20 }}>
          {([
            { id: 'generate', label: 'Phase I ESA' },
            { id: 'parcel', label: 'Parcel Intelligence' },
            { id: 'historical', label: 'Historical Research' },
            { id: 'swppp', label: 'SWPPP Inspections' },
            { id: 'library', label: `Library (${library.length})` },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{ padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', backgroundColor: tab === t.id ? 'white' : 'transparent', color: tab === t.id ? T.ink : T.muted, fontSize: 11, fontFamily: FONT_SANS, fontWeight: tab === t.id ? 400 : 300, boxShadow: tab === t.id ? '0 1px 3px rgba(17,26,36,0.10)' : 'none', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 28px' }}>
        {tab === 'generate' && (
          <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr 1.2fr', gap: 16 }}>

            {/* Col 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>Report Type</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {REPORT_TYPES.map(rt => (
                    <button key={rt.id} onClick={() => setSelectedType(rt.id)}
                      style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 2, border: 'none', cursor: 'pointer', backgroundColor: selectedType === rt.id ? T.blueLight : T.surface, borderLeft: `2px solid ${selectedType === rt.id ? T.blue : 'transparent'}`, transition: 'all 0.12s' }}
                      onMouseEnter={e => { if (selectedType !== rt.id) e.currentTarget.style.backgroundColor = 'rgba(17,26,36,0.04)'; }}
                      onMouseLeave={e => { if (selectedType !== rt.id) e.currentTarget.style.backgroundColor = T.surface; }}
                    >
                      <div style={{ fontSize: 12, color: selectedType === rt.id ? T.blue : T.ink, fontFamily: FONT_SANS, fontWeight: 300 }}>{rt.label}</div>
                      <div style={{ fontSize: 9, color: T.muted, fontFamily: FONT_SANS, marginTop: 2 }}>{rt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted }}>Project Details</div>
                <div><label style={labelStyle}>Project / Site Name *</label><input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Abilene Solar Farm — Site A" style={inputStyle} /></div>
                <div><label style={labelStyle}>Client Name</label><input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Apex Energy Partners" style={inputStyle} /></div>
                <div>
                  <label style={labelStyle}>Location / Coordinates *</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input value={location} onChange={e => setLocation(e.target.value)} onKeyDown={e => e.key === 'Enter' && pullReg()} placeholder="Address, city, or lat/lng" style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={pullReg} disabled={!location.trim() || regLoading} style={{ flexShrink: 0, padding: '9px 10px', backgroundColor: T.blue, color: 'white', border: 'none', borderRadius: 2, cursor: !location.trim() || regLoading ? 'not-allowed' : 'pointer', fontSize: 11, fontFamily: FONT_SANS, opacity: !location.trim() || regLoading ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                      {regLoading ? '...' : '⚡ Pull'}
                    </button>
                  </div>
                  <div style={{ fontSize: 9, color: T.muted, marginTop: 4 }}>Pulls 7 federal databases simultaneously</div>
                </div>
                <div><label style={labelStyle}>Survey Date</label><input type="date" value={surveyDate} onChange={e => setSurveyDate(e.target.value)} style={{ ...inputStyle, width: 'auto' }} /></div>
                <div>
                  <label style={labelStyle}>Field Observations / Data *</label>
                  <ReconForm
                    data={reconData}
                    onUpdate={setReconData}
                    onNotesChange={setNotes}
                  />
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    placeholder="Additional notes (auto-populated from reconnaissance form above)..."
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 60, fontSize: 11 }} />
                </div>
                {genError && <div style={{ padding: '8px 10px', backgroundColor: T.redLight, border: `1px solid rgba(180,60,40,0.20)`, borderRadius: 2, fontSize: 11, color: T.red, fontFamily: FONT_SANS }}>{genError}</div>}
                <button onClick={generate} disabled={!projectName.trim() || !notes.trim() || !location.trim() || !reg || generating}
                  style={{ padding: '11px 0', backgroundColor: generating ? T.blueMid : T.blue, color: 'white', border: 'none', borderRadius: 2, cursor: !projectName.trim() || !notes.trim() || generating ? 'not-allowed' : 'pointer', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: FONT_SANS, opacity: !projectName.trim() || !notes.trim() ? 0.5 : 1, transition: 'all 0.15s' }}>
                  {generating ? 'Generating...' : reg ? '⚡ Generate with Live Data' : 'Generate Report'}
                </button>
              </div>
            </div>

            {/* Col 2: Regulatory Intel */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>Regulatory Intelligence + Risk Score</div>
              <RegPanel data={reg} loading={regLoading} error={regError} parcel={parcel} />
              {reg && <RiskMap reg={reg as any} projectName={projectName} />}
              {reg && <ParcelIntelPanel county={reg?.county} address={reg?.address} data={parcelIntel} onUpdate={setParcelIntel} />}
              {reg && <HistoricalResearchPanel lat={reg?.coordinates?.lat} lng={reg?.coordinates?.lng} city={reg?.address?.split(',')[0]?.trim()} state="TX" data={historicalResearch} onUpdate={setHistoricalResearch} autoExpand={true} />}
              {reg && <FederalDatabasePanel county={reg?.county} state="TX" address={reg?.address} data={federalDB} onUpdate={setFederalDB} />}
              <ParcelPanel data={parcel} loading={parcelLoading} />
            </div>

            {/* Col 3: Generated Report */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>Generated Report</div>
              {!report && !generating && (
                <div style={{ border: `1px dashed ${T.borderMid}`, borderRadius: 4, padding: '60px 24px', backgroundColor: T.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, opacity: 0.15, marginBottom: 12 }}>☰</div>
                  <div style={{ fontSize: 13, color: T.muted, fontFamily: FONT_SANS, fontWeight: 300 }}>{reg ? `⚡ CETO Score ${computeCetoScore(reg, parcel).total}/100 ready — generate report` : 'Pull regulatory data then generate'}</div>
                </div>
              )}
              {generating && (
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: '60px 24px', backgroundColor: T.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: T.ink, fontFamily: FONT_SANS, fontWeight: 300, marginBottom: 6 }}>Composing report...</div>
                  <div style={{ fontSize: 11, color: T.muted, fontFamily: FONT_SANS }}>{reg ? 'Incorporating CETO Score, Go/No-Go, and live regulatory data' : 'Applying Ceto EP standards'}</div>
                </div>
              )}
              {report && (
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, backgroundColor: T.surface, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge label="draft" color="amber" />
                      {reg && <Badge label={`CETO ${computeCetoScore(reg, parcel).total}/100`} color={computeCetoScore(reg, parcel).total >= 80 ? 'green' : 'amber'} />}
                      <span style={{ fontSize: 10, color: T.muted, fontFamily: FONT_SANS }}>~{Math.ceil(report.length / 3000)} pages</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { navigator.clipboard.writeText(report); setCopied(true); setTimeout(() => setCopied(false), 2200); }} style={{ padding: '5px 12px', border: `1px solid ${T.border}`, borderRadius: 2, background: 'none', cursor: 'pointer', fontSize: 11, color: T.muted, fontFamily: FONT_SANS }}>
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                      <button onClick={() => exportPDF(report, reportTitle, reg, parcel, clientName, location, surveyDate)} style={{ padding: '5px 12px', backgroundColor: T.green, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, color: 'white', fontFamily: FONT_SANS }}>
                        Export PDF
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: '16px 18px', maxHeight: 560, overflowY: 'auto' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: FONT_SANS, fontSize: 12, lineHeight: 1.8, color: T.ink, fontWeight: 300 }}>{report}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'parcel' && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, marginBottom: 14 }}>Parcel Intelligence</div>
            {!reg ? (
              <div style={{ border: `1px dashed ${T.borderMid}`, borderRadius: 4, padding: '40px 24px', textAlign: 'center', color: T.muted, fontSize: 13, fontFamily: FONT_SANS }}>
                Pull regulatory data first (Phase I ESA tab) to auto-detect county and enable parcel lookup.
              </div>
            ) : (
              <ParcelIntelPanel
                county={reg?.county}
                data={parcelIntel}
                onUpdate={setParcelIntel}
              />
            )}
          </div>
        )}

        {tab === 'historical' && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, marginBottom: 14 }}>Historical Research</div>
            {!reg ? (
              <div style={{ border: `1px dashed ${T.borderMid}`, borderRadius: 4, padding: '40px 24px', textAlign: 'center', color: T.muted, fontSize: 13, fontFamily: FONT_SANS }}>
                Pull regulatory data first (Phase I ESA tab) to enable location-specific research links.
              </div>
            ) : (
              <HistoricalResearchPanel
                lat={reg?.coordinates?.lat}
                lng={reg?.coordinates?.lng}
                city={reg?.address?.split(',')[0]?.trim()}
                state="TX"
                data={historicalResearch}
                onUpdate={setHistoricalResearch}
              />
            )}
          </div>
        )}

        {tab === 'swppp' && (
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, marginBottom: 14 }}>SWPPP Inspections — TXR150000</div>
            <SWPPPModule />
          </div>
        )}

        {tab === 'library' && (
          <div style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, color: T.ink, fontFamily: FONT_SANS, fontWeight: 300 }}>{library.length === 0 ? 'No reports yet' : `${library.length} report${library.length !== 1 ? 's' : ''}`}</span>
              <button onClick={() => setTab('generate')} style={{ padding: '7px 16px', backgroundColor: T.blue, color: 'white', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontFamily: FONT_SANS }}>+ New Report</button>
            </div>
            {library.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: T.muted, fontFamily: FONT_SANS, fontWeight: 300 }}>Reports you generate will appear here</div>
              </div>
            ) : library.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', borderBottom: i < library.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 4, backgroundColor: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>☰</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: T.ink, fontFamily: FONT_SANS, fontWeight: 300 }}>{r.title}</div>
                  <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT_SANS, marginTop: 2 }}>{r.type} · {r.date}</div>
                </div>
                <Badge label={r.status} color="amber" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// Data Completeness Indicator
const DataCompletenessBar = ({ location, fieldNotes, projectName }: {
  location: string; fieldNotes: string; projectName: string;
}) => {
  const checks = [
    { label: 'Site Address', ok: location.length > 8, critical: true },
    { label: 'Project Name', ok: projectName.length > 0 && projectName !== 'Unknown', critical: false },
    { label: 'Field Observations', ok: fieldNotes.trim().length > 20, critical: false },
    { label: 'Survey Date', ok: true, critical: false },
  ];
  const score = Math.round((checks.filter(c => c.ok).length / checks.length) * 100);
  const allCriticalMet = checks.filter(c => c.critical).every(c => c.ok);
  const color = score >= 75 ? '#2F5D8C' : score >= 50 ? '#D97706' : '#DC2626';
  
  if (score === 100) return null; // hide when complete
  
  return (
    <div style={{
      border: `1px solid ${color}20`,
      backgroundColor: `${color}08`,
      borderRadius: 2,
      padding: '12px 16px',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontFamily: 'Jost, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', color, fontWeight: 500 }}>
          Report Confidence
        </span>
        <span style={{ fontSize: 13, fontFamily: 'Jost, sans-serif', color, fontWeight: 600 }}>{score}%</span>
      </div>
      <div style={{ height: 3, backgroundColor: `${color}20`, borderRadius: 2, marginBottom: 10 }}>
        <div style={{ height: '100%', width: `${score}%`, backgroundColor: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {checks.map(c => (
          <span key={c.label} style={{
            fontSize: 11, fontFamily: 'Jost, sans-serif',
            color: c.ok ? '#64748B' : (c.critical ? '#DC2626' : '#D97706'),
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            {c.ok ? '✓' : (c.critical ? '✕' : '○')} {c.label}
            {!c.ok && c.critical && ' (required)'}
          </span>
        ))}
      </div>
      {!allCriticalMet && (
        <p style={{ margin: '8px 0 0', fontSize: 11, fontFamily: 'Jost, sans-serif', color: '#DC2626' }}>
          ⚠ Address required — map, database queries, and scoring unavailable until location is provided.
        </p>
      )}
    </div>
  );
};

export default function ReportsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#F4F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif", color: '#111A24', fontSize: 13 }}>Loading...</div>}>
      <ReportsPageInner />
    </Suspense>
  );
}
// PDF export function - add this export to window for use by the reports page button
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).exportCetoPDF = async (reportData: unknown) => {
    const res = await fetch('/api/portal/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CETO-Report.pdf';
      a.click();
    }
  };
}
