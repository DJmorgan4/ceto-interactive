import json
from datetime import datetime
from pathlib import Path
import base64


def img_to_b64(path: str) -> str:
    try:
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    except Exception:
        return ""


def build_report(
    report_id: str,
    project_name: str,
    bbox: list,
    center: list,
    terrain: dict,
    hydrology: dict,
    geology: dict,
    soils: dict,
    cross_section: dict,
    insights: dict,
    output_dir: str,
):
    maps_dir = Path(output_dir) / "maps"

    hillshade_b64 = img_to_b64(str(maps_dir / "hillshade.png"))
    slope_b64 = img_to_b64(str(maps_dir / "slope.png"))
    drainage_b64 = img_to_b64(str(maps_dir / "drainage.png"))
    geology_b64 = img_to_b64(str(maps_dir / "geology.png"))
    soils_b64 = img_to_b64(str(maps_dir / "soils.png"))
    cross_b64 = img_to_b64(str(maps_dir / "cross_section.png"))

    risk = insights.get("overall_risk", "Unknown")
    risk_colors = {"Low": "#27ae60", "Moderate": "#f39c12", "Elevated": "#e74c3c", "Unknown": "#7f8c8d"}
    risk_color = risk_colors.get(risk, "#7f8c8d")

    def section(title, content):
        return f"""
        <div class="section">
            <div class="section-header">{title}</div>
            <div class="section-body">{content}</div>
        </div>"""

    def map_block(b64, caption):
        if not b64:
            return f'<div class="map-missing">Map not available</div>'
        return f"""
        <figure class="map-figure">
            <img src="data:image/png;base64,{b64}" alt="{caption}" />
            <figcaption>{caption}</figcaption>
        </figure>"""

    def bullet_list(items, color="#ccc"):
        if not items:
            return "<p style='color:#777'>None identified.</p>"
        lis = "".join(f"<li>{i}</li>" for i in items)
        return f"<ul style='color:{color}'>{lis}</ul>"

    def kv_row(label, value):
        return f"<tr><td class='kv-label'>{label}</td><td class='kv-value'>{value}</td></tr>"

    slope = terrain.get("slope", {})
    terrain_table = f"""
    <table class='data-table'>
        {kv_row("Elevation Min", f"{terrain.get('elev_min_m', '—')} m")}
        {kv_row("Elevation Max", f"{terrain.get('elev_max_m', '—')} m")}
        {kv_row("Elevation Range", f"{terrain.get('elev_range_m', '—')} m")}
        {kv_row("Mean Slope", f"{slope.get('mean_slope_deg', '—')}°")}
        {kv_row("Flat (0–5°)", f"{slope.get('flat_pct', '—')}%")}
        {kv_row("Moderate (5–15°)", f"{slope.get('moderate_pct', '—')}%")}
        {kv_row("Steep (15–30°)", f"{slope.get('steep_pct', '—')}%")}
        {kv_row("Very Steep (30°+)", f"{slope.get('very_steep_pct', '—')}%")}
    </table>"""

    hydro_table = f"""
    <table class='data-table'>
        {kv_row("Low Area %", f"{hydrology.get('low_area_pct', '—')}%")}
        {kv_row("Channel %", f"{hydrology.get('channel_pct', '—')}%")}
        {kv_row("Drainage Complexity", hydrology.get('drainage_complexity', '—'))}
        {kv_row("Ponding Risk", hydrology.get('ponding_risk', '—'))}
    </table>"""

    soils_table = f"""
    <table class='data-table'>
        {kv_row("Texture Class", soils.get('texture_class', '—'))}
        {kv_row("Clay %", f"{soils.get('clay_pct', '—')}%")}
        {kv_row("Sand %", f"{soils.get('sand_pct', '—')}%")}
        {kv_row("Silt %", f"{soils.get('silt_pct', '—')}%")}
        {kv_row("Drainage Class", soils.get('drainage', '—'))}
        {kv_row("Shrink-Swell Risk", soils.get('shrink_swell_risk', '—'))}
    </table>"""

    geo_table = f"""
    <table class='data-table'>
        {kv_row("Primary Unit", geology.get('primary_unit_name', '—'))}
        {kv_row("Lithology", geology.get('primary_lithology', '—'))}
        {kv_row("Period", geology.get('primary_period', '—'))}
        {kv_row("Formation", geology.get('primary_formation', '—'))}
    </table>"""

    cs_content = ""
    if cross_section:
        cs_content = f"""
        <table class='data-table'>
            {kv_row("Transect Distance", f"{cross_section.get('total_distance_km', '—')} km")}
            {kv_row("Elevation Range", f"{cross_section.get('elev_range_m', '—')} m")}
            {kv_row("Terrain Breaks", str(len(cross_section.get('terrain_breaks', []))))}
        </table>
        {map_block(cross_b64, "Interpreted Cross-Section (Conceptual)")}
        <p class='disclaimer'>Cross-section is conceptual and interpreted from desktop DEM and mapped geology only.
        Not verified by boreholes, geophysics, or field mapping.</p>"""
    else:
        cs_content = "<p style='color:#777'>No transect defined for this report.</p>"

    flags_html = ""
    if insights.get("flags"):
        flags_html = f"""
        <div class="flags-block">
            <div class="flags-header">⚑ Screening Flags</div>
            {bullet_list(insights['flags'], '#e74c3c')}
        </div>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>{project_name} — Site Intelligence Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Inter', sans-serif; background: #fff; color: #1a1a1a; font-size: 11pt; line-height: 1.6; }}
  .cover {{ background: #0a0a0a; color: white; padding: 80px 60px; min-height: 280px; }}
  .cover-eyebrow {{ font-size: 9pt; letter-spacing: 0.15em; text-transform: uppercase; color: #666; margin-bottom: 12px; }}
  .cover-title {{ font-size: 26pt; font-weight: 700; line-height: 1.2; margin-bottom: 16px; }}
  .cover-sub {{ font-size: 11pt; color: #aaa; margin-bottom: 32px; }}
  .cover-meta {{ display: flex; gap: 40px; margin-top: 24px; }}
  .cover-meta-item {{ font-size: 9pt; color: #888; }}
  .cover-meta-item span {{ display: block; color: #ccc; font-weight: 600; font-size: 10pt; }}
  .risk-badge {{ display: inline-block; background: {risk_color}22; border: 1.5px solid {risk_color}; color: {risk_color};
                 padding: 6px 18px; border-radius: 4px; font-weight: 700; font-size: 12pt; margin-top: 20px; }}
  .section {{ margin: 32px 48px; border-bottom: 1px solid #eee; padding-bottom: 28px; }}
  .section:last-child {{ border-bottom: none; }}
  .section-header {{ font-size: 13pt; font-weight: 700; color: #0a0a0a; text-transform: uppercase;
                     letter-spacing: 0.08em; margin-bottom: 16px; padding-bottom: 6px;
                     border-bottom: 2px solid #0a0a0a; }}
  .section-body {{ color: #333; }}
  .two-col {{ display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }}
  .data-table {{ width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 16px; }}
  .data-table tr:nth-child(even) {{ background: #f8f8f8; }}
  .data-table td {{ padding: 6px 10px; border: 1px solid #e8e8e8; }}
  .kv-label {{ font-weight: 600; color: #555; width: 45%; }}
  .kv-value {{ color: #1a1a1a; }}
  .map-figure {{ margin: 16px 0; }}
  .map-figure img {{ width: 100%; border: 1px solid #e0e0e0; border-radius: 4px; }}
  .map-figure figcaption {{ font-size: 8pt; color: #888; text-align: center; margin-top: 4px; }}
  .map-missing {{ background: #f5f5f5; border: 1px dashed #ccc; padding: 24px; text-align: center; color: #999; border-radius: 4px; }}
  ul {{ padding-left: 20px; margin: 8px 0; }}
  li {{ margin-bottom: 6px; font-size: 10pt; }}
  .flags-block {{ background: #fff5f5; border: 1px solid #e74c3c; border-radius: 4px; padding: 16px 20px; margin-bottom: 20px; }}
  .flags-header {{ font-weight: 700; color: #e74c3c; margin-bottom: 8px; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.05em; }}
  .summary-statement {{ background: #f8f8f8; border-left: 4px solid {risk_color}; padding: 14px 18px;
                         font-size: 11pt; color: #333; margin-bottom: 20px; border-radius: 0 4px 4px 0; }}
  .disclaimer {{ font-size: 8pt; color: #e74c3c; margin-top: 8px; font-style: italic; }}
  .limitations {{ background: #fafafa; border: 1px solid #e8e8e8; border-radius: 4px; padding: 16px 20px; }}
  .limitations li {{ color: #666; font-size: 9pt; }}
  .footer {{ background: #0a0a0a; color: #666; font-size: 8pt; padding: 20px 48px; margin-top: 40px;
             display: flex; justify-content: space-between; }}
  @media print {{
    .section {{ page-break-inside: avoid; }}
    body {{ font-size: 10pt; }}
  }}
</style>
</head>
<body>

<div class="cover">
  <div class="cover-eyebrow">Ceto Interactive — Desktop Environmental & Terrain Screening</div>
  <div class="cover-title">{project_name}</div>
  <div class="cover-sub">Site Intelligence Report</div>
  <div class="risk-badge">Overall Screening Risk: {risk}</div>
  <div class="cover-meta">
    <div class="cover-meta-item">Report ID<span>{report_id[:8].upper()}</span></div>
    <div class="cover-meta-item">Generated<span>{datetime.utcnow().strftime('%B %d, %Y')}</span></div>
    <div class="cover-meta-item">Center<span>{center[1]:.4f}°N, {center[0]:.4f}°W</span></div>
    <div class="cover-meta-item">Prepared By<span>DJ Morgan, EP-TX-2025-0814</span></div>
  </div>
</div>

{section("Executive Summary", f"""
  <div class="summary-statement">{insights.get('summary_statement', '')}</div>
  {flags_html}
  <div class="two-col">
    <div>
      <strong>Key Observations</strong>
      {bullet_list(insights.get('observations', []))}
    </div>
    <div>
      <strong>Concerns Identified</strong>
      {bullet_list(insights.get('concerns', []), '#c0392b')}
    </div>
  </div>
""")}

{section("Terrain & LiDAR Analysis", f"""
  <div class="two-col">
    <div>{terrain_table}</div>
    <div>{map_block(hillshade_b64, "Hillshade — USGS 3DEP")}</div>
  </div>
  {map_block(slope_b64, "Slope Classification")}
""")}

{section("Water & Drainage Behavior", f"""
  <div class="two-col">
    <div>{hydro_table}</div>
    <div>{map_block(drainage_b64, "Flow Accumulation & Low Areas")}</div>
  </div>
""")}

{section("Soils & Surface Conditions", f"""
  <div class="two-col">
    <div>{soils_table}<p style='margin-top:10px;font-size:9.5pt;color:#555'>{soils.get('engineering_implication','')}</p></div>
    <div>{map_block(soils_b64, "Soil Summary — SoilGrids v2.0")}</div>
  </div>
""")}

{section("Geology", f"""
  <div class="two-col">
    <div>{geo_table}<p style='margin-top:10px;font-size:9.5pt;color:#555'>{geology.get('engineering_implication','')}</p></div>
    <div>{map_block(geology_b64, "Geology Summary — Macrostrat")}</div>
  </div>
""")}

{section("Cross-Section", cs_content)}

{section("Recommended Next Steps", bullet_list(insights.get('recommended_next_steps', [])))}

{section("Data Sources & Limitations", f"""
  <ul style='margin-bottom:16px'>
    <li>USGS 3DEP 1/3 arc-second Digital Elevation Model</li>
    <li>Macrostrat API v2 — geology and lithology</li>
    <li>SoilGrids v2.0 (ISRIC) — soil texture and properties</li>
    <li>USGS NHD Plus HR — hydrography</li>
    <li>OpenStreetMap via Overpass API — context features</li>
  </ul>
  <div class="limitations">
    <strong style='font-size:9pt;text-transform:uppercase;letter-spacing:0.05em'>Limitations</strong>
    <ul style='margin-top:8px'>
      <li>This report is a desktop screening tool only. No field investigation has been conducted.</li>
      <li>Subsurface conditions are not verified. Mapped geology and soils may differ from field conditions.</li>
      <li>This report does not constitute a Phase I ESA under ASTM E1527-21.</li>
      <li>Cross-section is conceptual and is not verified by boreholes, geophysics, or field mapping.</li>
      <li>All findings require verification by a qualified professional prior to use in engineering or regulatory decisions.</li>
    </ul>
  </div>
""")}

<div class="footer">
  <span>Ceto Interactive Environmental Consulting — cetointeractive.com</span>
  <span>DJ Morgan, EP-TX-2025-0814 — {datetime.utcnow().strftime('%Y')}</span>
  <span>DESKTOP SCREENING ONLY — NOT A PHASE I ESA</span>
</div>

</body>
</html>"""

    html_path = Path(output_dir) / "report.html"
    with open(html_path, "w") as f:
        f.write(html)
    print(f"  [report] HTML saved → {html_path}")

    try:
        from weasyprint import HTML
        pdf_path = Path(output_dir) / "report.pdf"
        HTML(string=html, base_url=str(output_dir)).write_pdf(str(pdf_path))
        print(f"  [report] PDF saved → {pdf_path}")
    except Exception as e:
        print(f"  [report] WeasyPrint PDF failed: {e} — HTML report still available")
