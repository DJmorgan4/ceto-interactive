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

    try:
        dem_path = fetch_usgs_dem(bbox, str(data))
    except:
        dem_path = fetch_srtm_dem(bbox, str(data))

    progress(30, "Running terrain...")
    terrain = run_terrain(dem_path, output_dir, project_name)

    progress(50, "Running hydrology...")
    hydro = run_hydrology(dem_path, output_dir, project_name)

    progress(65, "Fetching geology/soils...")
    geo = fetch_macrostrat(center[0], center[1])
    soil = fetch_soilgrids(center[0], center[1])
    ssurgo = fetch_ssurgo(bbox)

    geology = run_geology(geo, output_dir, project_name)
    soils = run_soils(ssurgo, soil, output_dir, project_name)

    cross = None
    if transect:
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

    def img(name, label):
        return f'<h3>{label}</h3><img src="maps/{name}">' if (maps / name).exists() else ""

    html = f"""
<html>
<head>
<style>
body {{ font-family: Arial; padding:40px; background:#f6f7f9; }}
.card {{ background:white; padding:20px; margin-bottom:20px; border-radius:10px; }}
img {{ max-width:800px; width:100%; border-radius:8px; }}
</style>
</head>
<body>

<h1>Site Intelligence Report</h1>

<div class="card">
<h2>{project_name}</h2>
<p>Risk: <b>{metadata["overall_risk"]}</b></p>
</div>

<div class="card">
<h2>Maps</h2>
{img("hillshade.png","Hillshade")}
{img("slope.png","Slope")}
{img("drainage.png","Drainage")}
{img("geology.png","Geology")}
{img("soils.png","Soils")}
</div>

</body>
</html>
"""

    with open(base / "report.html", "w") as f:
        f.write(html)

    progress(100, "Complete")
    return metadata
