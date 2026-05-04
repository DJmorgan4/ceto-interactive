import os, json, requests
from pathlib import Path
from typing import Optional


# Shared DEM cache — persists across jobs
DEM_CACHE_DIR = Path.home() / ".ceto" / "dem_cache"
DEM_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def fetch_usgs_dem(bbox: list, output_dir: str) -> str:
    min_lon, min_lat, max_lon, max_lat = bbox
    # Use shared cache keyed by bbox
    cache_key = f"usgs_{min_lon}_{min_lat}_{max_lon}_{max_lat}.tif".replace("-", "n").replace(".", "d")
    cached_path = DEM_CACHE_DIR / cache_key
    if cached_path.exists():
        print(f"  [DEM] Using shared cache: {cached_path}")
        return str(cached_path)
    output_path = cached_path
    url = "https://tnmaccess.nationalmap.gov/api/v1/products"
    params = {
        "datasets": "National Elevation Dataset (NED) 1/3 arc-second",
        "bbox": f"{min_lon},{min_lat},{max_lon},{max_lat}",
        "outputFormat": "JSON", "prodFormats": "GeoTIFF", "max": 10,
    }
    print(f"  [DEM] Querying TNM for bbox {bbox}...")
    resp = requests.get(url, params=params, timeout=8)
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
    cache_key = f"srtm_{min_lon}_{min_lat}_{max_lon}_{max_lat}.tif".replace("-", "n").replace(".", "d")
    cached_path = DEM_CACHE_DIR / cache_key
    if cached_path.exists():
        print(f"  [SRTM] Using shared cache: {cached_path}")
        return str(cached_path)
    output_path = cached_path
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


def _resolve_lith_ids(lith_ids: list) -> list:
    """Resolve Macrostrat lith_ids to human-readable names."""
    if not lith_ids:
        return []
    try:
        id_str = ",".join(str(i) for i in lith_ids[:10])
        resp = requests.get(
            "https://macrostrat.org/api/v2/defs/lithologies",
            params={"lith_id": id_str, "format": "json"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        liths = data.get("success", {}).get("data", [])
        return [l.get("name", "") for l in liths if l.get("name")]
    except Exception:
        return []


def fetch_macrostrat(center_lon: float, center_lat: float) -> dict:
    url = "https://macrostrat.org/api/v2/geologic_units/map"
    params = {"lat": center_lat, "lng": center_lon, "format": "json"}
    print(f"  [Macrostrat] Querying geology at ({center_lat}, {center_lon})...")
    try:
        resp = requests.get(url, params=params, timeout=8)
        resp.raise_for_status()
        data = resp.json()
        units = data.get("success", {}).get("data", [])
        if not units:
            return {"source": "Macrostrat", "status": "no_data", "units": [], "primary_unit": None}

        # Collect all unique lith_ids across units for batch resolve
        all_lith_ids = []
        for unit in units[:5]:
            all_lith_ids.extend(unit.get("liths", []))
        all_lith_ids = list(dict.fromkeys(all_lith_ids))  # dedupe preserve order
        lith_name_map = {}
        if all_lith_ids:
            try:
                id_str = ",".join(str(i) for i in all_lith_ids[:20])
                lr = requests.get("https://macrostrat.org/api/v2/defs/lithologies",
                    params={"lith_id": id_str, "format": "json"}, timeout=15)
                lr.raise_for_status()
                for l in lr.json().get("success", {}).get("data", []):
                    lith_name_map[l["lith_id"]] = l["name"]
            except Exception:
                pass

        geology = []
        for unit in units[:5]:
            liths_ids = unit.get("liths", [])
            lith_names = [lith_name_map.get(i, str(i)) for i in liths_ids]
            # fallback to lith string field if no ids resolved
            lith_display = ", ".join(lith_names) if lith_names else unit.get("lith", "Unknown")
            geology.append({
                "name": unit.get("name", "Unknown"),
                "lithology": lith_display,
                "lith_ids": liths_ids,
                "lith_names": lith_names,
                "age_top": unit.get("t_age"),
                "age_bottom": unit.get("b_age"),
                "period": unit.get("best_int_name", unit.get("t_int_name", "")),
                "interval_name": unit.get("t_int_name", ""),
                "formation": unit.get("strat_name", ""),
                "group": "",
                "color": unit.get("color", ""),
                "descrip": unit.get("descrip", ""),
                "environment": [],
            })
        return {
            "source": "Macrostrat API v2",
            "status": "ok",
            "units": geology,
            "primary_unit": geology[0] if geology else None,
        }
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
        resp = requests.get(url, params=params, timeout=8)
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
        resp = requests.get(url, params=params, timeout=8)
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
        resp = requests.post("https://overpass-api.de/api/interpreter", data={"data": query}, timeout=12)
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


def fetch_ssurgo(bbox: list) -> dict:
    """
    Fetch SSURGO soil data for bbox via USDA Soil Data Access REST API.
    Gets mapunit keys first via spatial query, then pulls component/horizon data.
    """
    min_lon, min_lat, max_lon, max_lat = bbox
    print(f"  [SSURGO] Querying soil mapunits for bbox {bbox}...")

    # Step 1: spatial query to get mukeys in bbox
    aoi_wkt = f"POLYGON(({min_lon} {min_lat},{max_lon} {min_lat},{max_lon} {max_lat},{min_lon} {max_lat},{min_lon} {min_lat}))"
    spatial_sql = f"""
    SELECT mu.mukey, mu.muname
    FROM mapunit mu
    INNER JOIN SDA_Get_Mukey_from_intersection_with_WktWgs84('{aoi_wkt}') AS x ON mu.mukey = x.mukey
    """
    try:
        resp = requests.post(
            "https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest",
            data={"query": spatial_sql, "format": "JSON"},
            timeout=8,
        )
        resp.raise_for_status()
        mukey_data = resp.json()
        rows = mukey_data.get("Table", [])
        if not rows:
            return {"source": "USDA SSURGO", "status": "no_data", "units": [], "summary": {}}

        mukeys = [r[0] for r in rows[:10]]
        mukey_list = ",".join(f"'{m}'" for m in mukeys)

        # Step 2: get component + horizon data
        detail_sql = f"""
        SELECT
            mu.mukey, mu.muname,
            co.compname, co.comppct_r, co.drainagecl,
            ch.hzname, ch.hzdept_r, ch.hzdepb_r,
            ch.sandtotal_r, ch.silttotal_r, ch.claytotal_r
        FROM mapunit mu
        INNER JOIN component co ON mu.mukey = co.mukey
        INNER JOIN chorizon ch ON co.cokey = ch.cokey
        WHERE mu.mukey IN ({mukey_list})
        AND co.majcompflag = 'Yes'
        ORDER BY mu.mukey, co.comppct_r DESC, ch.hzdept_r
        """
        resp2 = requests.post(
            "https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest",
            data={"query": detail_sql, "format": "JSON"},
            timeout=8,
        )
        resp2.raise_for_status()
        detail_data = resp2.json()
        detail_rows = detail_data.get("Table", [])

        units = []
        seen = set()
        for row in detail_rows:
            mukey, muname, compname, comppct, drainage, hzname, hzdept, hzdepb, sand, silt, clay = row
            if mukey not in seen:
                seen.add(mukey)
                units.append({
                    "mukey": mukey,
                    "muname": muname,
                    "compname": compname,
                    "comppct_r": comppct,
                    "drainagecl": drainage,
                    "surface_sand": sand,
                    "surface_silt": silt,
                    "surface_clay": clay,
                })

        # Dominant component summary
        dominant = units[0] if units else {}
        clay_val = float(dominant.get("surface_clay") or 0)
        sand_val = float(dominant.get("surface_sand") or 0)
        silt_val = float(dominant.get("surface_silt") or 0)

        from backend.data_clients import _classify_texture, _estimate_drainage
        texture = _classify_texture(clay_val or None, sand_val or None, silt_val or None)
        drainage_class = dominant.get("drainagecl", "Unknown")

        return {
            "source": "USDA SSURGO via Soil Data Access",
            "status": "ok",
            "mukey_count": len(mukeys),
            "units": units[:5],
            "summary": {
                "dominant_component": dominant.get("compname", "Unknown"),
                "dominant_muname": dominant.get("muname", "Unknown"),
                "drainage_class": drainage_class,
                "clay_pct": clay_val or None,
                "sand_pct": sand_val or None,
                "silt_pct": silt_val or None,
                "texture_class": texture,
                "shrink_swell_risk": "High" if clay_val > 35 else "Moderate" if clay_val > 20 else "Low",
            },
        }

    except Exception as e:
        print(f"  [SSURGO] Failed: {e}")
        return {"source": "USDA SSURGO", "status": "error", "error": str(e)}


def fetch_nlcd(bbox: list, output_dir: str) -> dict:
    min_lon, min_lat, max_lon, max_lat = bbox
    output_path = Path(output_dir) / "nlcd.tif"
    wcs_url = (
        "https://www.mrlc.gov/geoserver/mrlc_display/NLCD_2021_Land_Cover_L48/wcs"
        f"?service=WCS&version=1.0.0&request=GetCoverage"
        f"&coverage=NLCD_2021_Land_Cover_L48"
        f"&bbox={min_lon},{min_lat},{max_lon},{max_lat}"
        f"&crs=EPSG:4326&format=GeoTIFF&width=512&height=512"
    )
    print(f"  [NLCD] Downloading land cover...")
    try:
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        resp = requests.get(wcs_url, stream=True, timeout=60)
        resp.raise_for_status()
        with open(output_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        return {"source": "NLCD 2021 (MRLC)", "status": "ok", "path": str(output_path)}
    except Exception as e:
        print(f"  [NLCD] Fetch failed: {e}")
        return {"source": "NLCD 2021", "status": "error", "error": str(e)}
