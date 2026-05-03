import os, json, requests
from pathlib import Path
from typing import Optional


def fetch_usgs_dem(bbox: list, output_dir: str) -> str:
    min_lon, min_lat, max_lon, max_lat = bbox
    output_path = Path(output_dir) / "dem.tif"
    if output_path.exists():
        print(f"  [DEM] Using cached {output_path}")
        return str(output_path)
    url = "https://tnmaccess.nationalmap.gov/api/v1/products"
    params = {
        "datasets": "National Elevation Dataset (NED) 1/3 arc-second",
        "bbox": f"{min_lon},{min_lat},{max_lon},{max_lat}",
        "outputFormat": "JSON",
        "prodFormats": "GeoTIFF",
        "max": 10,
    }
    print(f"  [DEM] Querying TNM for bbox {bbox}...")
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    items = data.get("items", [])
    if not items:
        print("  [DEM] TNM returned no results, falling back to SRTM...")
        return fetch_srtm_dem(bbox, output_dir)
    download_url = items[0].get("downloadURL")
    if not download_url:
        return fetch_srtm_dem(bbox, output_dir)
    print(f"  [DEM] Downloading from {download_url}...")
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    with requests.get(download_url, stream=True, timeout=120) as r:
        r.raise_for_status()
        with open(output_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    print(f"  [DEM] Saved to {output_path}")
    return str(output_path)


def fetch_srtm_dem(bbox: list, output_dir: str) -> str:
    min_lon, min_lat, max_lon, max_lat = bbox
    output_path = Path(output_dir) / "dem_srtm.tif"
    if output_path.exists():
        return str(output_path)
    url = "https://portal.opentopography.org/API/globaldem"
    params = {
        "demtype": "SRTMGL1",
        "south": min_lat, "north": max_lat,
        "west": min_lon, "east": max_lon,
        "outputFormat": "GTiff",
        "API_Key": os.getenv("OPENTOPO_API_KEY", "demoapikeyot2022"),
    }
    print(f"  [SRTM] Downloading via OpenTopography...")
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    resp = requests.get(url, params=params, stream=True, timeout=60)
    resp.raise_for_status()
    with open(output_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"  [SRTM] Saved to {output_path}")
    return str(output_path)


def fetch_macrostrat(center_lon: float, center_lat: float) -> dict:
    url = "https://macrostrat.org/api/v2/geologic_units/map"
    params = {"lat": center_lat, "lng": center_lon, "format": "json"}
    print(f"  [Macrostrat] Querying geology at ({center_lat}, {center_lon})...")
    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        units = data.get("success", {}).get("data", [])
        if not units:
            return {"source": "Macrostrat", "status": "no_data", "units": [], "summary": "No mapped geology found at this location."}
        geology = []
        for unit in units[:5]:
            geology.append({
                "name": unit.get("unit_name", "Unknown"),
                "lithology": unit.get("lith", []),
                "age_top": unit.get("t_age"),
                "age_bottom": unit.get("b_age"),
                "period": unit.get("period", ""),
                "formation": unit.get("formation", ""),
                "group": unit.get("gp", ""),
                "environment": unit.get("environ", []),
            })
        return {"source": "Macrostrat API v2", "status": "ok", "units": geology, "primary_unit": geology[0]}
    except Exception as e:
        return {"source": "Macrostrat", "status": "error", "error": str(e)}


def fetch_soilgrids(center_lon: float, center_lat: float) -> dict:
    url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    params = {
        "lon": center_lon, "lat": center_lat,
        "property": ["clay", "sand", "silt", "bdod", "phh2o", "soc"],
        "depth": ["0-5cm", "5-15cm", "15-30cm"],
        "value": ["mean"],
    }
    print(f"  [SoilGrids] Querying soil at ({center_lat}, {center_lon})...")
    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        props = data.get("properties", {}).get("layers", [])
        soil_data = {}
        for layer in props:
            prop_name = layer.get("name")
            for depth in layer.get("depths", []):
                depth_label = depth.get("label", "")
                mean_val = depth.get("values", {}).get("mean")
                if mean_val is not None:
                    key = f"{prop_name}_{depth_label}"
                    soil_data[key] = round(mean_val / 10, 1) if prop_name in ["clay", "sand", "silt"] else mean_val
        clay = soil_data.get("clay_0-5cm")
        sand = soil_data.get("sand_0-5cm")
        silt = soil_data.get("silt_0-5cm")
        return {
            "source": "SoilGrids v2.0 (ISRIC)", "status": "ok", "raw": soil_data,
            "summary": {
                "clay_pct": clay, "sand_pct": sand, "silt_pct": silt,
                "texture_class": _classify_texture(clay, sand, silt),
                "drainage": _estimate_drainage(clay),
                "shrink_swell_risk": "High" if clay and clay > 35 else "Moderate" if clay and clay > 20 else "Low",
            },
        }
    except Exception as e:
        return {"source": "SoilGrids", "status": "error", "error": str(e)}


def _classify_texture(clay, sand, silt) -> str:
    if clay is None or sand is None: return "Unknown"
    if clay >= 40: return "Clay"
    elif clay >= 27 and sand <= 20: return "Clay Loam"
    elif clay >= 27: return "Sandy Clay Loam"
    elif sand >= 70 and clay < 15: return "Sandy Loam"
    elif silt and silt >= 50 and clay < 27: return "Silt Loam"
    else: return "Loam"


def _estimate_drainage(clay_pct) -> str:
    if clay_pct is None: return "Unknown"
    if clay_pct > 40: return "Poorly drained"
    elif clay_pct > 25: return "Moderately well drained"
    else: return "Well drained"


def fetch_nhd(bbox: list) -> dict:
    min_lon, min_lat, max_lon, max_lat = bbox
    bbox_str = f"{min_lon},{min_lat},{max_lon},{max_lat}"
    url = "https://hydro.nationalmap.gov/arcgis/services/NHDPlus_HR/MapServer/WFSServer"
    params = {
        "service": "WFS", "version": "2.0.0", "request": "GetFeature",
        "typeName": "NHDFlowline", "bbox": bbox_str,
        "outputFormat": "application/json", "count": 200,
    }
    print(f"  [NHD] Fetching flowlines...")
    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        fc = resp.json()
        return {"source": "USGS NHD Plus HR", "status": "ok", "flowlines": fc, "flowline_count": len(fc.get("features", []))}
    except Exception as e:
        return {"source": "USGS NHD", "status": "error", "error": str(e), "flowlines": {"type": "FeatureCollection", "features": []}, "flowline_count": 0}


def fetch_osm(bbox: list) -> dict:
    min_lon, min_lat, max_lon, max_lat = bbox
    ob = f"{min_lat},{min_lon},{max_lat},{max_lon}"
    query = f'[out:json][timeout:30];(way["highway"]({ob});way["railway"]({ob});way["waterway"]({ob});way["landuse"]({ob}););out geom;'
    print(f"  [OSM] Fetching context features...")
    try:
        resp = requests.post("https://overpass-api.de/api/interpreter", data={"data": query}, timeout=45)
        resp.raise_for_status()
        data = resp.json()
        els = data.get("elements", [])
        return {
            "source": "OpenStreetMap via Overpass", "status": "ok",
            "element_count": len(els),
            "highways": len([e for e in els if e.get("tags", {}).get("highway")]),
            "railways": len([e for e in els if e.get("tags", {}).get("railway")]),
            "waterways": len([e for e in els if e.get("tags", {}).get("waterway")]),
            "landuse_polygons": len([e for e in els if e.get("tags", {}).get("landuse")]),
            "raw": data,
        }
    except Exception as e:
        return {"source": "OpenStreetMap", "status": "error", "error": str(e)}
