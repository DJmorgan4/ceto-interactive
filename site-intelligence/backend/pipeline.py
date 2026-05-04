import json
from datetime import datetime
from pathlib import Path

from backend.data_clients import (
    fetch_usgs_dem,
    fetch_srtm_dem,
    fetch_macrostrat,
    fetch_soilgrids,
    fetch_ssurgo,
    fetch_nhd,
    fetch_osm,
)
from backend.terrain import run_terrain
from backend.hydrology import run_hydrology
from backend.geology import run_geology
from backend.soils import run_soils
from backend.cross_section import run_cross_section
from backend.insights import run_insights


def generate_site_report(
    job_id,
    report_id,
    bbox,
    center,
    aoi=None,
    transect=None,
    datasets=None,
    outputs=None,
    project_name="Site Intelligence Report",
    output_dir=None,
    progress_callback=None,
):

    def progress(p, msg):
        print(f"[{p}%] {msg}")
        if progress_callback:
            progress_callback(p, msg)

    datasets = datasets or ["usgs_3dep", "macrostrat", "soilgrids", "nhd", "osm"]
    outputs = outputs or ["hillshade", "slope", "drainage", "geology", "soils", "cross_section"]

    output_dir = output_dir or f"outputs/reports/{report_id}"
    base = Path(output_dir)
    maps = base / "maps"
    data = base / "data"

    maps.mkdir(parents=True, exist_ok=True)
    data.mkdir(parents=True, exist_ok=True)

    progress(5, "Fetching DEM...")

    dem_path = None
    try:
        dem_path = fetch_usgs_dem(bbox, str(data))
    except Exception as e:
        print(f"[WARN] USGS failed: {e}")

    if not dem_path:
        try:
            dem_path = fetch_srtm_dem(bbox, str(data))
        except Exception as e:
            print(f"[WARN] SRTM failed: {e}")
            print("[WARN] Continuing WITHOUT DEM (terrain/hydro disabled)")

    progress(30, "Running terrain...")
    terrain = run_terrain(dem_path, output_dir, project_name) if dem_path else {'status':'skipped'}

    progress(50, "Running hydrology...")
    hydro = run_hydrology(dem_path, output_dir, project_name) if dem_path else {'status':'skipped'}

    progress(65, "Fetching geology/soils...")
    geo = fetch_macrostrat(center[0], center[1])
    soil = fetch_soilgrids(center[0], center[1])
    ssurgo = fetch_ssurgo(bbox)

    geology = run_geology(geo, output_dir, project_name)
    soils = run_soils(ssurgo, soil, output_dir, project_name)

    cross = None
    if transect and dem_path:
        cross = run_cross_section(dem_path, geo, transect, output_dir, project_name)

    progress(85, "Generating insights...")
    insights = run_insights(
        terrain=terrain,
        hydro=hydro,
        soils=soils,
        geology=geology,
        osm={},
        output_dir=output_dir,
        cross_section=cross,
    )

    progress(92, "Building report...")

    metadata = {
        "report_id": report_id,
        "job_id": job_id,
        "project_name": project_name,
        "bbox": bbox,
        "center": center,
        "date_generated": datetime.utcnow().isoformat() + "Z",
        "overall_risk": insights.get("overall_risk"),
        "flag_count": insights.get("flag_count"),
        "results_summary": {
            "terrain": terrain.get("status"),
            "hydrology": hydro.get("status"),
            "geology": geology.get("status"),
            "soils": soils.get("status"),
        },
    }

    with open(base / "report.json", "w") as f:
        json.dump(metadata, f, indent=2)

    import base64 as _b64

    def img_b64(name, label):
        path = maps / name
        if not path.exists():
            return ""
        data = _b64.b64encode(path.read_bytes()).decode()
        return f'<div class="section"><div class="section-title">{label}</div><img src="data:image/png;base64,{data}"></div>'

    risk_color = {"Low":"#27ae60","Moderate":"#f39c12","Elevated":"#e74c3c"}.get(metadata.get("overall_risk",""),"#888")


    def _slope_stats_card(t: dict) -> str:
        s = t.get("slope", {})
        if not s:
            return ""
        rows = ""
        colors = ["#2ecc71","#f1c40f","#e67e22","#e74c3c","#8e44ad"]
        for i, (label, pct) in enumerate(s.get("class_pct", {}).items()):
            c = colors[i % len(colors)]
            rows += (f'<tr><td style="color:#94a3b8;padding:2px 8px;font-size:11px">{label}</td>'
                     f'<td style="padding:2px 8px"><div style="background:#1e293b;border-radius:3px;height:8px;width:120px;overflow:hidden">'
                     f'<div style="background:{c};width:{min(pct,100):.1f}%;height:100%"></div></div></td>'
                     f'<td style="color:white;padding:2px 8px;font-size:11px;font-weight:600">{pct:.1f}%</td></tr>')
        return ('<div class="section"><div class="section-title">Slope Statistics</div>'
                f'<div style="display:flex;gap:32px;margin-bottom:12px">'
                f'<div><div style="color:#555;font-size:10px;text-transform:uppercase">Mean Slope</div>'
                f'<div style="color:white;font-size:20px;font-weight:200">{s.get("mean_slope_deg","—")}°</div></div>'
                f'<div><div style="color:#555;font-size:10px;text-transform:uppercase">Max Slope</div>'
                f'<div style="color:white;font-size:20px;font-weight:200">{s.get("max_slope_deg","—")}°</div></div>'
                f'<div><div style="color:#555;font-size:10px;text-transform:uppercase">Dominant Class</div>'
                f'<div style="color:#2ecc71;font-size:14px;font-weight:400;margin-top:4px">{s.get("dominant_class","—")}</div></div>'
                f'<div><div style="color:#555;font-size:10px;text-transform:uppercase">Adaptive Range</div>'
                f'<div style="color:#aaa;font-size:14px;margin-top:4px">{s.get("adaptive_range","—")}</div></div>'
                f'</div><table style="border-collapse:collapse">{rows}</table></div>')

    def _cross_section_metrics_card(cs: dict) -> str:
        if not cs or cs.get("status") != "ok":
            return ""
        m  = cs.get("metrics", {})
        ss = m.get("steepest_segment", {})
        cf = m.get("cut_fill_level", "—")
        cf_color = {"Minimal":"#27ae60","Moderate":"#f39c12","Significant":"#e74c3c"}.get(cf,"#888")
        ch_color = {"Flat":"#27ae60","Rolling":"#f39c12","Hilly":"#e67e22","Steep":"#e74c3c"}.get(m.get("terrain_character",""),"#888")
        return ('<div class="section"><div class="section-title">Cross-Section Metrics</div>'
                f'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:14px">'
                f'<div><div style="color:#555;font-size:10px;text-transform:uppercase">Total Relief</div><div style="color:white;font-size:18px;font-weight:200">{m.get("total_relief_m","—")} m</div></div>'
                f'<div><div style="color:#555;font-size:10px;text-transform:uppercase">Transect Length</div><div style="color:white;font-size:18px;font-weight:200">{m.get("total_distance_km","—")} km</div></div>'
                f'<div><div style="color:#555;font-size:10px;text-transform:uppercase">Terrain Type</div><div style="color:{ch_color};font-size:16px;font-weight:400;margin-top:4px">{m.get("terrain_character","—")}</div></div>'
                f'<div><div style="color:#555;font-size:10px;text-transform:uppercase">Cut / Fill</div><div style="color:{cf_color};font-size:16px;font-weight:400;margin-top:4px">{cf}</div></div>'
                f'</div>'
                f'<div style="background:#0a0a0a;border-radius:4px;padding:10px 14px;margin-bottom:10px">'
                f'<span style="color:#f97316;font-size:10px;text-transform:uppercase;letter-spacing:.1em">Steepest Segment</span>'
                f'<span style="color:white;font-size:13px;font-weight:600;margin-left:12px">{ss.get("gradient_pct","—")}% grade</span>'
                f'<span style="color:#555;font-size:11px;margin-left:8px">({ss.get("start_km","—")}–{ss.get("end_km","—")} km) · {ss.get("description","—")}</span>'
                f'</div>'
                f'<div style="color:#94a3b8;font-size:12px;line-height:1.65;border-left:3px solid {cf_color};padding-left:10px">{m.get("cut_fill_note","—")}</div>'
                f'</div>')

    def _soils_enhance_card(s: dict) -> str:
        if not s:
            return ""
        dtb  = s.get("depth_to_bedrock", {})
        spat = s.get("spatial_variability", {})
        if not dtb and not spat:
            return ""
        var_color = {"Low":"#27ae60","Moderate":"#f39c12","High":"#e74c3c"}.get(spat.get("level",""),"#888")
        depth_cm  = dtb.get("depth_cm")
        bar_fill  = f"{min(int(depth_cm or 0),200)/200*100:.0f}" if depth_cm else "0"
        d_color   = "#e74c3c" if (depth_cm or 999)<51 else "#f39c12" if (depth_cm or 999)<102 else "#27ae60"
        return ('<div class="section"><div class="section-title">Soils — Enhanced Intelligence</div>'
                f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'
                f'<div style="background:#0a0a0a;border-radius:4px;padding:14px">'
                f'<div style="color:#555;font-size:10px;text-transform:uppercase;margin-bottom:8px">Depth to Bedrock / Restriction</div>'
                f'<div style="color:white;font-size:14px;font-weight:400;margin-bottom:8px">{dtb.get("label","Unknown")}</div>'
                f'<div style="background:#1e293b;border-radius:3px;height:6px;margin-bottom:6px"><div style="background:{d_color};width:{bar_fill}%;height:100%;border-radius:3px"></div></div>'
                f'<div style="color:#444;font-size:10px">Source: {dtb.get("source","—")}</div></div>'
                f'<div style="background:#0a0a0a;border-radius:4px;padding:14px">'
                f'<div style="color:#555;font-size:10px;text-transform:uppercase;margin-bottom:8px">Soil Spatial Variability</div>'
                f'<div style="color:{var_color};font-size:18px;font-weight:200;margin-bottom:4px">{spat.get("level","—")}</div>'
                f'<div style="color:#555;font-size:10px;margin-bottom:8px">{spat.get("mapunit_count","—")} mapunit(s) · dominant ~{spat.get("dominant_pct","—")}%</div>'
                f'<div style="color:#94a3b8;font-size:11px;line-height:1.5;font-style:italic">{spat.get("note","")}</div>'
                f'</div></div></div>')

    html = (
        '<!DOCTYPE html><html><head><meta charset="utf-8">' +
        f'<title>Site Intelligence — {project_name}</title>' +
        '<style>' +
        '*{box-sizing:border-box;margin:0;padding:0}' +
        'body{font-family:"Helvetica Neue",Arial,sans-serif;background:#0a0a0a;color:#d0d0d0;padding:48px 56px;max-width:1100px;margin:0 auto}' +
        'h1{font-size:28px;font-weight:200;letter-spacing:.08em;color:#ffffff;margin-bottom:6px}' +
        '.sub{font-size:10px;color:#444;letter-spacing:.2em;text-transform:uppercase;margin-bottom:0}' +
        '.header{border-bottom:1px solid #1a1a1a;padding-bottom:28px;margin-bottom:36px}' +
        '.meta{display:flex;gap:40px;margin-top:20px;flex-wrap:wrap}' +
        '.mi{font-size:10px;color:#444;letter-spacing:.08em;text-transform:uppercase}' +
        '.mi span{display:block;color:#bbb;font-size:14px;margin-top:4px;letter-spacing:0;text-transform:none;font-weight:300}' +
        f'.badge{{display:inline-block;padding:7px 18px;border-radius:3px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;background:{risk_color}18;color:{risk_color};border:1px solid {risk_color}44;margin-top:16px}}' +
        '.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:36px}' +
        '.card{background:#0f0f0f;border:1px solid #181818;border-radius:6px;padding:20px 22px}' +
        '.stat{font-size:24px;font-weight:200;color:white;margin:8px 0 4px;letter-spacing:.02em}' +
        '.stat-label{font-size:9px;color:#444;text-transform:uppercase;letter-spacing:.15em}' +
        '.section{background:#0f0f0f;border:1px solid #181818;border-radius:6px;padding:24px 26px;margin-bottom:16px}' +
        '.section-title{font-size:9px;color:#555;text-transform:uppercase;letter-spacing:.18em;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #1a1a1a}' +
        'img{width:100%;border-radius:4px;display:block;margin-top:4px}' +
        'ul{padding-left:0;list-style:none}' +
        'li{font-size:13px;color:#999;margin-bottom:10px;line-height:1.65;padding-left:16px;position:relative}' +
        'li::before{content:"";position:absolute;left:0;top:8px;width:4px;height:4px;border-radius:50%;background:#333}' +
        '.flag{color:#e05555}' +
        '.flag::before{background:#e05555}' +
        '.concern{color:#c9882a}' +
        '.concern::before{background:#c9882a}' +
        '.step{color:#3a8fd1}' +
        '.step::before{background:#3a8fd1}' +
        '.divider{border:none;border-top:1px solid #1a1a1a;margin:32px 0}' +
        '.footer{margin-top:48px;padding-top:20px;border-top:1px solid #141414;font-size:9px;color:#2a2a2a;display:flex;justify-content:space-between;letter-spacing:.1em;text-transform:uppercase}' +
        '</style></head><body>' +
        '<div class="header">' +
        '<h1>Site Intelligence Report</h1>' +
        '<div class="sub">Ceto Interactive Environmental Consulting &middot; EP-TX-2025-0814</div>' +
        '<div class="meta">' +
        f'<div class="mi">Project<span>{project_name}</span></div>' +
        f'<div class="mi">Bbox<span>{bbox[0]:.4f},{bbox[1]:.4f} &rarr; {bbox[2]:.4f},{bbox[3]:.4f}</span></div>' +
        f'<div class="mi">Generated<span>{metadata.get("date_generated","")[:10]}</span></div>' +
        '</div>' +
        f'<div class="badge">{metadata.get("overall_risk","Unknown")} Risk &middot; {metadata.get("flag_count",0)} Flag(s)</div>' +
        '</div>' +
        '<div class="grid">' +
        f'<div class="card"><div class="stat-label">Elevation Range</div><div class="stat">{terrain.get("elev_min_m","—")}–{terrain.get("elev_max_m","—")} m</div></div>' +
        f'<div class="card"><div class="stat-label">Ponding Risk</div><div class="stat">{hydro.get("ponding_risk","—")}</div></div>' +
        f'<div class="card"><div class="stat-label">Primary Geology</div><div class="stat" style="font-size:15px">{geology.get("primary_unit_name","—")}</div></div>' +
        f'<div class="card"><div class="stat-label">Soil Texture</div><div class="stat" style="font-size:15px">{soils.get("texture_class","—")}</div></div>' +
        '</div>' +
        img_b64("hillshade.png","Terrain — Hillshade + Elevation") +
        img_b64("slope.png","Terrain — Slope Classification") +
        _slope_stats_card(terrain) +
        img_b64("drainage.png","Hydrology — Flow Accumulation") +
        img_b64("geology.png","Geology — Macrostrat") +
        img_b64("soils.png","Soils — SSURGO / SoilGrids") +
        _soils_enhance_card(soils) +
        img_b64("cross_section.png","Cross-Section — Interpreted Profile") +
        _cross_section_metrics_card(cross) +
        img_b64("nlcd.png","Land Cover — NLCD 2021") +
        '<div class="section"><div class="section-title">Screening Flags</div><ul>' +
        "".join(f'<li class="flag">&#9888; {f}</li>' for f in insights.get("flags",[])) +
        '</ul></div>' +
        '<div class="section"><div class="section-title">Concerns</div><ul>' +
        "".join(f'<li class="concern">&bull; {c}</li>' for c in insights.get("concerns",[])) +
        '</ul></div>' +
        '<div class="section"><div class="section-title">Recommended Next Steps</div><ul>' +
        "".join(f'<li class="step">&rarr; {st}</li>' for st in insights.get("recommended_next_steps",[])) +
        '</ul></div>' +
        '<div class="footer">' +
        '<span>Ceto Interactive &middot; cetointeractive.com</span>' +
        '<span>DJ Morgan EP-TX-2025-0814</span>' +
        '<span>DESKTOP SCREENING ONLY</span>' +
        '</div></body></html>'
    )

    with open(base / "report.html", "w") as f:
        f.write(html)

    progress(100, "Complete")
    return metadata
