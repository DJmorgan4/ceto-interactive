import json
from datetime import datetime
from pathlib import Path

from backend.data_clients import (
    fetch_nlcd,
    fetch_ssurgo,
    fetch_usgs_dem, fetch_srtm_dem, fetch_macrostrat,
    fetch_soilgrids, fetch_nhd, fetch_osm
)
from backend.terrain import run_terrain, render_nlcd
from backend.hydrology import run_hydrology
from backend.geology import run_geology
from backend.soils import run_soils
from backend.cross_section import run_cross_section
from backend.insights import run_insights


def generate_site_report(
    job_id: str,
    report_id: str,
    bbox: list,
    center: list,
    aoi: dict = None,
    transect: dict = None,
    datasets: list = None,
    outputs: list = None,
    project_name: str = "Site Intelligence Report",
    output_dir: str = None,
    progress_callback=None,
) -> dict:

    def progress(pct, msg):
        print(f"  [{pct}%] {msg}")
        if progress_callback:
            progress_callback(pct, msg)

    datasets = datasets or ["usgs_3dep", "macrostrat", "soilgrids", "nhd", "osm"]
    outputs = outputs or ["hillshade", "slope", "drainage", "geology", "soils", "cross_section", "pdf"]
    output_dir = output_dir or f"outputs/reports/{report_id}"
    data_dir = str(Path(output_dir) / "data")
    Path(data_dir).mkdir(parents=True, exist_ok=True)
    Path(output_dir, "maps").mkdir(parents=True, exist_ok=True)

    results = {}
    progress(5, "Fetching elevation data...")

    # --- DEM ---
    dem_path = None
    if "usgs_3dep" in datasets:
        try:
            dem_path = fetch_usgs_dem(bbox, data_dir)
        except Exception as e:
            print(f"  [pipeline] 3DEP failed: {e}, trying SRTM...")
            try:
                dem_path = fetch_srtm_dem(bbox, data_dir)
            except Exception as e2:
                print(f"  [pipeline] SRTM also failed: {e2}")

    progress(15, "Fetching all data sources in parallel...")

    from concurrent.futures import ThreadPoolExecutor, as_completed

    geo_data = {"status": "skipped", "units": [], "primary_unit": None}
    soil_data = {"status": "skipped", "summary": {}}
    ssurgo_data = {"status": "skipped", "summary": {}}
    nhd_data = {"status": "skipped"}
    osm_data = {"status": "skipped", "highways": 0, "railways": 0, "waterways": 0}
    nlcd_data = {"status": "skipped"}

    def _fetch_macrostrat():
        return "geo", fetch_macrostrat(center[0], center[1])

    def _fetch_soilgrids():
        return "soil", fetch_soilgrids(center[0], center[1])

    def _fetch_ssurgo():
        return "ssurgo", fetch_ssurgo(bbox)

    def _fetch_nhd():
        return "nhd", fetch_nhd(bbox)

    def _fetch_osm():
        return "osm", fetch_osm(bbox)

    def _fetch_nlcd():
        return "nlcd", fetch_nlcd(bbox, data_dir)

    fetch_tasks = []
    if "macrostrat" in datasets: fetch_tasks.append(_fetch_macrostrat)
    if "soilgrids" in datasets:
        fetch_tasks.append(_fetch_soilgrids)
        fetch_tasks.append(_fetch_ssurgo)
    if "nhd" in datasets: fetch_tasks.append(_fetch_nhd)
    if "osm" in datasets: fetch_tasks.append(_fetch_osm)
    if "nlcd" in datasets: fetch_tasks.append(_fetch_nlcd)

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(fn): fn.__name__ for fn in fetch_tasks}
        for future in as_completed(futures):
            try:
                key, result = future.result()
                if key == "geo": geo_data = result
                elif key == "soil": soil_data = result
                elif key == "ssurgo": ssurgo_data = result
                elif key == "nhd": nhd_data = result
                elif key == "osm": osm_data = result
                elif key == "nlcd": nlcd_data = result
                progress(int(15 + len([f for f in futures if f.done()]) / len(futures) * 30),
                         f"Fetched {key}...")
            except Exception as e:
                print(f"  [pipeline] Fetch failed ({futures[future]}): {e}")

    progress(48, "Processing terrain...")

    # --- TERRAIN ---
    terrain_summary = {"status": "skipped", "slope": {}}
    if dem_path and any(o in outputs for o in ["hillshade", "slope"]):
        try:
            terrain_summary = run_terrain(dem_path, output_dir, project_name)
            results["terrain"] = terrain_summary
        except Exception as e:
            print(f"  [pipeline] Terrain processing failed: {e}")
            terrain_summary = {"status": "error", "slope": {}}

    # --- NLCD RENDER ---
    nlcd_summary = {"status": "skipped"}
    if nlcd_data.get("status") == "ok" and "nlcd" in outputs:
        try:
            nlcd_summary = render_nlcd(nlcd_data["path"], str(Path(output_dir) / "maps" / "nlcd.png"), project_name)
            results["nlcd"] = nlcd_summary
        except Exception as e:
            print(f"  [pipeline] NLCD render failed: {e}")

    progress(58, "Processing hydrology...")

    # --- HYDROLOGY ---
    hydro_summary = {"status": "skipped"}
    if dem_path and "drainage" in outputs:
        try:
            hydro_summary = run_hydrology(dem_path, output_dir, project_name)
            results["hydrology"] = hydro_summary
        except Exception as e:
            print(f"  [pipeline] Hydrology processing failed: {e}")
            hydro_summary = {"status": "error", "ponding_risk": "Unknown", "low_area_pct": 0, "channel_pct": 0, "drainage_complexity": "Unknown"}

    progress(65, "Processing geology...")

    # --- GEOLOGY ---
    geology_summary = {"status": "skipped"}
    if "geology" in outputs:
        try:
            geology_summary = run_geology(geo_data, output_dir, project_name)
            results["geology"] = geology_summary
        except Exception as e:
            print(f"  [pipeline] Geology processing failed: {e}")
            geology_summary = {"status": "error", "primary_lithology": "Unknown", "primary_unit_name": "Unknown", "primary_period": ""}

    progress(72, "Processing soils...")

    # --- SOILS ---
    soils_summary = {"status": "skipped"}
    if "soils" in outputs:
        try:
            soils_summary = run_soils(ssurgo_data, soil_data, output_dir, project_name)
            results["soils"] = soils_summary
        except Exception as e:
            print(f"  [pipeline] Soils processing failed: {e}")
            soils_summary = {"status": "error", "texture_class": "Unknown", "drainage": "Unknown", "shrink_swell_risk": "Unknown", "clay_pct": None}

    progress(78, "Generating cross-section...")

    # --- CROSS SECTION ---
    cross_summary = None
    if dem_path and transect and "cross_section" in outputs:
        try:
            cross_summary = run_cross_section(dem_path, geo_data, transect, output_dir, project_name)
            results["cross_section"] = cross_summary
        except Exception as e:
            print(f"  [pipeline] Cross-section failed: {e}")

    progress(85, "Generating insights...")

    # --- INSIGHTS ---
    insights = {"overall_risk": "Unknown", "flags": [], "concerns": [], "observations": [], "recommended_next_steps": []}
    try:
        insights = run_insights(
            terrain=terrain_summary,
            hydro=hydro_summary,
            soils=soils_summary,
            geology=geology_summary,
            osm=osm_data,
            output_dir=output_dir,
            cross_section=cross_summary,
            nlcd=nlcd_summary,
        )
        results["insights"] = insights
    except Exception as e:
        print(f"  [pipeline] Insights failed: {e}")

    progress(92, "Building report...")

    # --- REPORT ---
    if "pdf" in outputs:
        try:
            from backend.report_builder import build_report, ensure_report_written
            build_report(
                report_id=report_id,
                project_name=project_name,
                bbox=bbox,
                center=center,
                terrain=terrain_summary,
                hydrology=hydro_summary,
                geology=geology_summary,
                soils=soils_summary,
                cross_section=cross_summary,
                insights=insights,
                output_dir=output_dir,
            )
        except Exception as e:
            print(f"  [pipeline] Report build failed: {e}")

    # --- METADATA ---
    report_id = str(uuid.uuid4())

    metadata = {
        "report_id": report_id,
        "job_id": job_id,
        "project_name": project_name,
        "report_id": report_id,
        "bbox": bbox,
        "center": center,
        "date_generated": datetime.utcnow().isoformat() + "Z",
        "datasets_requested": datasets,
        "outputs_requested": outputs,
        "data_sources": [
            "USGS 3DEP (1/3 arc-second DEM)",
            "Macrostrat API v2",
            "SoilGrids v2.0 (ISRIC)",
            "USGS NHD Plus HR",
            "OpenStreetMap via Overpass API",
        ],
        "processing_steps": [
            "DEM downloaded and clipped to AOI",
            "Hillshade computed (azimuth 315°, altitude 45°)",
            "Slope classified (0-5, 5-15, 15-30, 30+°)",
            "Flow accumulation derived from DEM gradient",
            "Geology queried from Macrostrat point API",
            "Soils queried from SoilGrids v2.0",
            "Insights generated from structured rule engine",
        ],
        "limitations": [
            "Desktop review only — no field investigation conducted",
            "Subsurface conditions not verified",
            "Mapped geology and soils may differ from field conditions",
            "Cross-section is conceptual — not verified by boreholes or geophysics",
            "NHD flowlines are mapped features — field delineation required for jurisdictional determinations",
            "This report does not constitute a Phase I ESA under ASTM E1527-21",
        ],
        "overall_risk": insights.get("overall_risk", "Unknown"),
        "flag_count": insights.get("flag_count", 0),
        "results_summary": {k: v.get("status", "ok") for k, v in results.items()},
    }

    with open(Path(output_dir) / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    ensure_report_written(report_id, metadata)

    progress(100, "Complete.")
    print(f"\n  [pipeline] Report {report_id} complete. Risk: {insights.get('overall_risk')} | Flags: {insights.get('flag_count')}")
    return metadata


    return report_id
