import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font, Image,
} from '@react-pdf/renderer';

const BLUE = '#2F5D8C';
const INK = '#111A24';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';
const LIGHT = '#F8F9FA';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: '#FFFFFF', paddingBottom: 60 },
  // Cover
  cover: { backgroundColor: BLUE, padding: 0, height: '100%', position: 'relative' },
  coverTop: { backgroundColor: BLUE, padding: '60px 56px 40px' },
  coverRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 56 },
  coverMid: { padding: '40px 56px', flex: 1 },
  coverBottom: { padding: '32px 56px', borderTop: '1px solid rgba(255,255,255,0.2)' },
  coverLabel: { fontSize: 7, letterSpacing: 2, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 6 },
  coverTitle: { fontSize: 28, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', lineHeight: 1.25, marginBottom: 8 },
  coverSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 },
  coverMeta: { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  coverScore: { fontSize: 48, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', lineHeight: 1 },
  coverScoreLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 },
  // Body
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 44, paddingVertical: 14, borderBottom: `1px solid ${BORDER}`, backgroundColor: '#FAFBFC' },
  headerLeft: { fontSize: 9, color: MUTED },
  headerRight: { fontSize: 9, color: MUTED },
  body: { paddingHorizontal: 44, paddingTop: 28 },
  sectionHeader: { fontSize: 7, letterSpacing: 2, color: MUTED, textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${BORDER}` },
  h2: { fontSize: 14, color: INK, fontFamily: 'Helvetica-Bold', marginBottom: 8, marginTop: 20 },
  h3: { fontSize: 11, color: INK, fontFamily: 'Helvetica-Bold', marginBottom: 5, marginTop: 14 },
  p: { fontSize: 9.5, color: INK, lineHeight: 1.65, marginBottom: 8 },
  muted: { fontSize: 8.5, color: MUTED, lineHeight: 1.5, marginBottom: 6 },
  // Score panel
  scoreBox: { backgroundColor: BLUE, borderRadius: 4, padding: '16px 20px', marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 24 },
  scoreNum: { fontSize: 40, color: '#FFFFFF', fontFamily: 'Helvetica-Bold' },
  scoreSlash: { fontSize: 18, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
  scoreMeta: { flex: 1 },
  scoreBadge: { fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: 2, marginBottom: 6, alignSelf: 'flex-start' },
  scoreBreakRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  scoreBreakLabel: { fontSize: 8, color: 'rgba(255,255,255,0.7)' },
  scoreBreakVal: { fontSize: 8, color: '#FFFFFF', fontFamily: 'Helvetica-Bold' },
  // Decision table
  decisionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottom: `1px solid ${BORDER}` },
  decisionLabel: { fontSize: 9.5, color: INK },
  decisionBadge: { fontSize: 8, padding: '2px 8px', borderRadius: 2 },
  // Data table
  tableHeader: { flexDirection: 'row', backgroundColor: LIGHT, paddingVertical: 6, paddingHorizontal: 10, borderBottom: `1px solid ${BORDER}` },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10, borderBottom: `1px solid ${BORDER}` },
  tableCell: { fontSize: 8.5, color: INK, flex: 1 },
  tableCellMuted: { fontSize: 8, color: MUTED, flex: 1 },
  tableCellHead: { fontSize: 7.5, color: MUTED, flex: 1, textTransform: 'uppercase', letterSpacing: 0.8 },
  // Risk badge colors
  badgeLow: { backgroundColor: 'rgba(39,174,96,0.12)', color: '#1A7A4A' },
  badgeMod: { backgroundColor: 'rgba(242,201,76,0.2)', color: '#B45309' },
  badgeHigh: { backgroundColor: 'rgba(235,87,87,0.12)', color: '#C0392B' },
  // Footer
  footer: { position: 'absolute', bottom: 20, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between', borderTop: `1px solid ${BORDER}`, paddingTop: 8 },
  footerText: { fontSize: 7.5, color: MUTED },
  // Map
  mapImage: { width: '100%', height: 220, borderRadius: 4, marginBottom: 10 },
  // Disclaimer
  disclaimer: { backgroundColor: LIGHT, border: `1px solid ${BORDER}`, borderRadius: 3, padding: '10px 14px', marginTop: 16 },
  disclaimerText: { fontSize: 7.5, color: MUTED, lineHeight: 1.55 },
});

function RiskBadge({ risk }: { risk: string }) {
  const s = risk === 'LOW' ? styles.badgeLow : risk === 'HIGH' ? styles.badgeHigh : styles.badgeMod;
  return <Text style={[styles.decisionBadge, s]}>{risk}</Text>;
}

function PageHeader({ project, date }: { project: string; date: string }) {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.headerLeft}>CETO ENVIRONMENTAL INTELLIGENCE REPORT™ · {project}</Text>
      <Text style={styles.headerRight}>{date} · CONFIDENTIAL DRAFT</Text>
    </View>
  );
}

function PageFooter({ reportId }: { reportId: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>Ceto Interactive Environmental Consulting · McKinney, Texas · cetointeractive.com</Text>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages} · ${reportId}`} />
    </View>
  );
}

export interface Phase1PDFProps {
  projectName: string;
  clientName: string;
  location: string;
  surveyDate: string;
  reportId: string;
  cetoScore: number;
  ratingCode: string;
  scoreBreakdown: Record<string, { score: number; max: number; label: string; risk: string }>;
  decisions: { label: string; value: string; risk: string }[];
  screeningRows: { category: string; result: string; detail: string; risk: string }[];
  facilities: { name: string; dataset?: string; type?: string; distanceMi?: number | null; riskClass?: string }[];
  fema: { zone: string; classification: string; risk: string };
  geology: { formation: string; lithology: string; age: string };
  elevation: { elevationFt: number | null };
  hydrology: { nearbyStreams: { name: string }[] };
  soils: { hydricPercent: number; interpretation: string };
  reportText: string;
  county: string;
  parcelData?: { ownerName?: string; parcelId?: string; acreage?: string; zoning?: string; legalDescription?: string; verifiedByUser?: boolean } | null;
  historicalData?: { naipReviewed: boolean; topoReviewed: boolean; googleEarthReviewed: boolean; historicAerialsReviewed: boolean; sanbornReviewed: boolean; notes: string } | null;
  mapSnapshot?: string | null;
  preparedBy?: string;
}

export function Phase1PDF(props: Phase1PDFProps) {
  const {
    projectName, clientName, location, surveyDate, reportId, cetoScore,
    ratingCode, scoreBreakdown, decisions, screeningRows, facilities,
    fema, geology, elevation, hydrology, soils, reportText,
    county, parcelData, historicalData, mapSnapshot, preparedBy,
  } = props;

  const ratingLabel = ratingCode === 'LOW' ? 'LOW RISK' : ratingCode === 'MODERATE_LOW' ? 'LOW-MODERATE RISK' : ratingCode === 'MODERATE' ? 'MODERATE RISK' : ratingCode === 'ELEVATED' ? 'ELEVATED RISK' : 'HIGH RISK';
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Document title={`Phase I ESA — ${projectName}`} author="Ceto Interactive" subject="Environmental Site Assessment" creator="Ceto Interactive Portal">

      {/* ── COVER PAGE ─────────────────────────────────────────────────────── */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.cover}>
          <View style={styles.coverTop}>
            <Text style={styles.coverLabel}>Ceto Environmental Intelligence Report™</Text>
            <Text style={styles.coverTitle}>{projectName}</Text>
            <Text style={styles.coverSub}>Phase I Environmental Site Assessment{'\n'}ASTM E1527-21 · EPA All Appropriate Inquiry (AAI)</Text>
          </View>
          <View style={styles.coverRule} />
          <View style={styles.coverMid}>
            <View style={{ flexDirection: 'row', gap: 40, marginBottom: 32 }}>
              <View>
                <Text style={[styles.coverLabel, { marginBottom: 4 }]}>CETO Risk Score</Text>
                <Text style={styles.coverScore}>{cetoScore}</Text>
                <Text style={styles.coverScoreLabel}>/100 · {ratingLabel}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.coverLabel, { marginBottom: 8 }]}>Score Breakdown</Text>
                {Object.values(scoreBreakdown).map((item, i) => (
                  <View key={i} style={styles.scoreBreakRow}>
                    <Text style={styles.scoreBreakLabel}>{item.label}</Text>
                    <Text style={styles.scoreBreakVal}>{item.score}/{item.max}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ gap: 6 }}>
              {[
                { label: 'Site Address', value: location },
                { label: 'Client', value: clientName || 'Confidential' },
                { label: 'County', value: county },
                { label: 'Survey Date', value: surveyDate },
                { label: 'Report Date', value: today },
                { label: 'Report ID', value: reportId },
                { label: 'Standard', value: 'ASTM E1527-21 · EPA AAI' },
              ].map(({ label, value }) => (
                <View key={label} style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={[styles.coverMeta, { width: 90 }]}>{label}:</Text>
                  <Text style={[styles.coverMeta, { color: 'rgba(255,255,255,0.85)', flex: 1 }]}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.coverBottom}>
            <Text style={styles.coverMeta}>Prepared by: {preparedBy || 'Ceto Interactive Environmental Consulting · McKinney, Texas'}</Text>
            <Text style={styles.coverMeta}>Environmental Professional (EP) · ASTM E1527-21 Qualified</Text>
            <Text style={[styles.coverMeta, { marginTop: 8, fontSize: 7.5 }]}>
              DRAFT — This report is preliminary and subject to revision. Not for distribution without written consent.
            </Text>
          </View>
        </View>
      </Page>

      {/* ── EXECUTIVE SUMMARY ──────────────────────────────────────────────── */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader project={projectName} date={today} />
        <View style={styles.body}>
          <Text style={styles.sectionHeader}>Section 1 — Executive Decision Summary</Text>

          {/* CETO Score panel */}
          <View style={styles.scoreBox}>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.scoreNum}>{cetoScore}</Text>
              <Text style={styles.scoreSlash}>/100</Text>
            </View>
            <View style={styles.scoreMeta}>
              <Text style={styles.scoreBadge}>{ratingLabel}</Text>
              {Object.values(scoreBreakdown).map((item, i) => (
                <View key={i} style={styles.scoreBreakRow}>
                  <Text style={styles.scoreBreakLabel}>{item.label}</Text>
                  <Text style={styles.scoreBreakVal}>{item.score}/{item.max}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Go/No-Go decisions */}
          <Text style={styles.h3}>Go / No-Go Acquisition Dashboard</Text>
          {decisions.map((d, i) => (
            <View key={i} style={styles.decisionRow}>
              <Text style={styles.decisionLabel}>{d.label}</Text>
              <RiskBadge risk={d.value} />
            </View>
          ))}

          {/* Screening summary */}
          <Text style={styles.h3}>Environmental Screening Summary</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHead, { flex: 1.2 }]}>Category</Text>
            <Text style={[styles.tableCellHead, { flex: 2 }]}>Result</Text>
            <Text style={[styles.tableCellHead, { flex: 1.5 }]}>Detail</Text>
            <Text style={[styles.tableCellHead, { flex: 0.6, textAlign: 'right' }]}>Risk</Text>
          </View>
          {screeningRows.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.2 }]}>{row.category}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{row.result}</Text>
              <Text style={[styles.tableCellMuted, { flex: 1.5 }]}>{row.detail}</Text>
              <View style={{ flex: 0.6, alignItems: 'flex-end' }}>
                <RiskBadge risk={row.risk} />
              </View>
            </View>
          ))}
        </View>
        <PageFooter reportId={reportId} />
      </Page>

      {/* ── PHYSICAL SETTING ───────────────────────────────────────────────── */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader project={projectName} date={today} />
        <View style={styles.body}>
          <Text style={styles.sectionHeader}>Section 2 — Physical Setting</Text>
          {[
            { label: 'FEMA Flood Zone', value: `Zone ${fema.zone} — ${fema.classification}`, risk: fema.risk },
            { label: 'Elevation', value: elevation.elevationFt ? `${elevation.elevationFt} ft MSL` : 'N/A', risk: 'LOW' },
            { label: 'Geology', value: geology.formation, risk: 'LOW' },
            { label: 'Lithology', value: geology.lithology, risk: 'LOW' },
            { label: 'Geologic Age', value: geology.age, risk: 'LOW' },
            { label: 'Hydric Soil Rating', value: `${soils.hydricPercent}% hydric`, risk: soils.hydricPercent > 20 ? 'MODERATE' : 'LOW' },
            { label: 'Nearby Streams', value: hydrology.nearbyStreams.length > 0 ? hydrology.nearbyStreams.map(s => s.name).join(', ') : 'None identified within 2km', risk: 'LOW' },
          ].map((row, i) => (
            <View key={i} style={styles.decisionRow}>
              <Text style={styles.decisionLabel}>{row.label}</Text>
              <Text style={[styles.tableCell, { textAlign: 'right', flex: 0 }]}>{row.value}</Text>
            </View>
          ))}
          {soils.interpretation && (
            <View style={styles.disclaimer}>
              <Text style={[styles.disclaimerText, { fontFamily: 'Helvetica-Bold', marginBottom: 3 }]}>Soils Interpretation</Text>
              <Text style={styles.disclaimerText}>{soils.interpretation}</Text>
            </View>
          )}

          {/* Parcel data */}
          {parcelData && (parcelData.ownerName || parcelData.parcelId) && (
            <>
              <Text style={styles.h3}>Parcel Intelligence</Text>
              {[
                parcelData.ownerName && { label: 'Owner of Record', value: parcelData.ownerName },
                parcelData.parcelId && { label: 'Parcel ID / Account #', value: parcelData.parcelId },
                parcelData.acreage && { label: 'Site Acreage', value: parcelData.acreage },
                parcelData.zoning && { label: 'Zoning Classification', value: parcelData.zoning },
                parcelData.legalDescription && { label: 'Legal Description', value: parcelData.legalDescription },
              ].filter(Boolean).map((row: any, i) => (
                <View key={i} style={styles.decisionRow}>
                  <Text style={styles.decisionLabel}>{row.label}</Text>
                  <Text style={[styles.tableCell, { textAlign: 'right', flex: 0, maxWidth: 260 }]}>{row.value}</Text>
                </View>
              ))}
              <Text style={[styles.muted, { marginTop: 6 }]}>
                Source: {county} County Appraisal District. {parcelData.verifiedByUser ? 'Data verified by Environmental Professional.' : 'Manual verification required before final Phase I reliance.'}
              </Text>
            </>
          )}

          {/* Historical research */}
          {historicalData && (
            <>
              <Text style={styles.h3}>Historical Research Status</Text>
              {[
                { label: 'NAIP Aerial Imagery', reviewed: historicalData.naipReviewed },
                { label: 'USGS Topographic Maps', reviewed: historicalData.topoReviewed },
                { label: 'Historic Aerials Database', reviewed: historicalData.historicAerialsReviewed },
                { label: 'Google Earth Pro', reviewed: historicalData.googleEarthReviewed },
                { label: 'Sanborn Fire Insurance Maps', reviewed: historicalData.sanbornReviewed },
              ].map((row, i) => (
                <View key={i} style={styles.decisionRow}>
                  <Text style={styles.decisionLabel}>{row.label}</Text>
                  <Text style={{ fontSize: 8.5, color: row.reviewed ? '#1A7A4A' : '#B45309' }}>{row.reviewed ? '✓ Reviewed' : '○ Pending'}</Text>
                </View>
              ))}
              {historicalData.notes && (
                <View style={styles.disclaimer}>
                  <Text style={styles.disclaimerText}>{historicalData.notes}</Text>
                </View>
              )}
            </>
          )}
        </View>
        <PageFooter reportId={reportId} />
      </Page>

      {/* ── REGULATORY DATABASE ────────────────────────────────────────────── */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader project={projectName} date={today} />
        <View style={styles.body}>
          <Text style={styles.sectionHeader}>Section 3 — Regulatory Database Review</Text>
          <Text style={styles.h3}>Mapped Facilities — 1-Mile Search Radius</Text>
          <Text style={[styles.muted, { marginBottom: 10 }]}>
            Source: TCEQ ArcGIS FeatureServer — LPST, PST, Dry Cleaner, VCP, IHWCA, Superfund datasets. Distances computed via haversine formula.
          </Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHead, { flex: 2.5 }]}>Facility Name</Text>
            <Text style={[styles.tableCellHead, { flex: 1.5 }]}>Program</Text>
            <Text style={[styles.tableCellHead, { flex: 0.8, textAlign: 'right' }]}>Distance</Text>
            <Text style={[styles.tableCellHead, { flex: 0.8, textAlign: 'right' }]}>Risk</Text>
          </View>
          {facilities.slice(0, 25).map((f, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2.5 }]}>{f.name}</Text>
              <Text style={[styles.tableCellMuted, { flex: 1.5 }]}>{f.dataset || '—'}</Text>
              <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'right' }]}>{f.distanceMi != null ? `${Number(f.distanceMi).toFixed(2)} mi` : '—'}</Text>
              <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                <RiskBadge risk={f.riskClass || 'LOW'} />
              </View>
            </View>
          ))}
          {facilities.length > 25 && (
            <Text style={[styles.muted, { marginTop: 8 }]}>+ {facilities.length - 25} additional facilities within search radius — see full database appendix.</Text>
          )}
        </View>
        <PageFooter reportId={reportId} />
      </Page>

      {/* ── REPORT TEXT ────────────────────────────────────────────────────── */}
      {reportText && (
        <Page size="LETTER" style={styles.page}>
          <PageHeader project={projectName} date={today} />
          <View style={styles.body}>
            <Text style={styles.sectionHeader}>Section 4 — Findings, Opinions & Conclusions</Text>
            {reportText.split('\n').filter(l => l.trim()).map((line, i) => {
              const isSection = line.startsWith('SECTION') || line.startsWith('━');
              const isHeader = line.match(/^[A-Z][A-Z\s\/]{8,}:?\s*$/) && line.length < 60;
              if (isSection || line.includes('━')) return null;
              if (isHeader) return <Text key={i} style={styles.h3}>{line.trim()}</Text>;
              return <Text key={i} style={styles.p}>{line.trim()}</Text>;
            })}
          </View>
          <PageFooter reportId={reportId} />
        </Page>
      )}

      {/* ── MAP APPENDIX ───────────────────────────────────────────────────── */}
      {mapSnapshot && (
        <Page size="LETTER" style={styles.page}>
          <PageHeader project={projectName} date={today} />
          <View style={styles.body}>
            <Text style={styles.sectionHeader}>Appendix A — Environmental Risk Map</Text>
            <Text style={[styles.muted, { marginBottom: 10 }]}>
              Interactive environmental risk map showing subject property, regulated facility locations, FEMA flood zones, and NWI wetland overlays within the 1-mile search radius.
            </Text>
            <Image src={mapSnapshot} style={styles.mapImage} />
            <Text style={styles.muted}>
              Map sources: Mapbox · FEMA NFHL · USFWS NWI · TCEQ ArcGIS FeatureServer. Generated {today}.
            </Text>
          </View>
          <PageFooter reportId={reportId} />
        </Page>
      )}

      {/* ── LIMITATIONS & DISCLAIMER ───────────────────────────────────────── */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader project={projectName} date={today} />
        <View style={styles.body}>
          <Text style={styles.sectionHeader}>Appendix B — Limitations, Qualifications & Disclaimer</Text>
          <Text style={styles.h3}>ASTM E1527-21 Compliance Statement</Text>
          <Text style={styles.p}>
            This Phase I Environmental Site Assessment was prepared in general conformance with ASTM Standard Practice E1527-21 and the EPA All Appropriate Inquiry (AAI) Rule (40 CFR Part 312). The assessment is based upon information obtained from publicly available government databases, desktop research, and field observations provided by the user. This report does not constitute a Phase II ESA or subsurface investigation.
          </Text>
          <Text style={styles.h3}>Data Sources & Limitations</Text>
          <Text style={styles.p}>
            Regulatory database searches were conducted via TCEQ ArcGIS FeatureServer (LPST, PST, Dry Cleaner Remediation, Voluntary Cleanup Program, Industrial and Hazardous Waste Corrective Action, and Superfund datasets), FEMA National Flood Hazard Layer (NFHL), USFWS National Wetlands Inventory (NWI), USDA NRCS SSURGO soils data, USGS National Elevation Dataset (NED), USGS National Hydrography Dataset (NHD), and Macrostrat geologic mapping. Per-source query status and timestamps are recorded at time of preparation; any failed queries are disclosed as data gaps. TCEQ data covers all state-regulated petroleum storage, leaking sites, dry cleaners, brownfields, hazardous waste, and Superfund sites.
          </Text>
          <Text style={styles.h3}>Environmental Professional Statement</Text>
          <Text style={styles.p}>
            This report was prepared by a qualified Environmental Professional (EP) as defined under ASTM E1527-21 Section 12 and the AAI Rule. The CETO Environmental Risk Score is a proprietary screening metric and does not constitute a final professional opinion or substitute for a complete Phase I ESA with full site reconnaissance, interviews, and records review.
          </Text>
          <Text style={styles.h3}>Environmental Professional Declaration (40 CFR 312.21)</Text>
          <Text style={styles.p}>
            I declare that, to the best of my professional knowledge and belief, I meet the definition of Environmental Professional as defined in 40 CFR 312.10. I have the specific qualifications based on education, training, and experience to assess a property of the nature, history, and setting of the subject property. I have developed and performed the all appropriate inquiries in conformance with the standards and practices set forth in 40 CFR Part 312.
          </Text>
          <Text style={styles.h3}>Reliance & Confidentiality</Text>
          <Text style={styles.p}>
            This report was prepared solely for the use of the client identified on the cover page. Reliance by any third party is not authorized without the express written consent of Ceto Interactive Environmental Consulting. The findings and opinions expressed herein are based on conditions observed and information available at the time of preparation. Environmental conditions can change over time, and this report should not be relied upon if more than 180 days have elapsed since the report date without an update.
          </Text>
          <View style={styles.disclaimer}>
            <Text style={[styles.disclaimerText, { fontFamily: 'Helvetica-Bold', marginBottom: 4 }]}>DISCLAIMER</Text>
            <Text style={styles.disclaimerText}>
              This automated Phase I ESA screening report was generated using the Ceto Interactive Environmental Intelligence Platform. While the platform draws from authoritative government databases and applies ASTM E1527-21 compliant methodology, this report does not substitute for a full Phase I ESA conducted by a licensed Environmental Professional with complete Sanborn map review, city directory research, regulatory agency interviews, and physical site reconnaissance. TCEQ STEERS database requires independent manual verification at www2.tceq.texas.gov. All regulatory data reflects database conditions at time of query. Report ID: {reportId}.
            </Text>
          </View>
          <View style={{ marginTop: 24, borderTop: `2px solid ${INK}`, paddingTop: 14 }}>
            <Text style={{ fontSize: 9, color: INK, marginBottom: 4, fontFamily: 'Helvetica-Bold' }}>Environmental Professional Signature</Text>
            <Text style={{ fontSize: 9, color: MUTED, marginBottom: 20 }}>Signed electronically via Ceto Interactive Portal — {today}</Text>
            <Text style={{ fontSize: 9, color: INK }}>{preparedBy || 'Ceto Interactive Environmental Consulting'}</Text>
            <Text style={{ fontSize: 8.5, color: MUTED }}>Environmental Professional (EP) · McKinney, Texas · cetointeractive.com</Text>
          </View>
        </View>
        <PageFooter reportId={reportId} />
      </Page>

    </Document>
  );
}
