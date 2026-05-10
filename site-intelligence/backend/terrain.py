import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import matplotlib.patches as mpatches
from pathlib import Path
import rasterio
from rasterio.plot import show
from scipy.ndimage import gaussian_filter
import json


def read_dem(dem_path: str):
    with rasterio.open(dem_path) as src:
        data = src.read(1).astype(float)
        data[data == src.nodata] = np.nan
        transform = src.transform
        crs = src.crs
        res = src.res
    return data, transform, crs, res


def compute_hillshade(dem: np.ndarray, azimuth: float = 315, altitude: float = 45, res: tuple = (30, 30)) -> np.ndarray:
    az = np.radians(360 - azimuth + 90)
    alt = np.radians(altitude)
    dem_filled = np.where(np.isnan(dem), np.nanmean(dem), dem)
    smoothed = gaussian_filter(dem_filled, sigma=1.5)
    res_m = (res[0] * 111320, res[1] * 111320)
    dy, dx = np.gradient(smoothed, res_m[1], res_m[0])
    slope = np.arctan(np.sqrt(dx**2 + dy**2))
    aspect = np.arctan2(-dy, dx)
    hs = (np.sin(alt) * np.cos(slope) +
          np.cos(alt) * np.sin(slope) * np.cos(az - aspect))
    hs = np.clip(hs, 0, 1)
    hs[np.isnan(dem)] = np.nan
    return hs


def compute_slope_degrees(dem: np.ndarray, res: tuple) -> np.ndarray:
    dem_filled = np.where(np.isnan(dem), np.nanmean(dem), dem)
    smoothed = gaussian_filter(dem_filled, sigma=2.0)
    res_m = (res[0] * 111320, res[1] * 111320)
    dy, dx = np.gradient(smoothed, res_m[1], res_m[0])
    slope = np.degrees(np.arctan(np.sqrt(dx**2 + dy**2)))
    slope[np.isnan(dem)] = np.nan
    return slope


def classify_slope(slope: np.ndarray) -> dict:
    valid = slope[~np.isnan(slope)]
    if len(valid) == 0:
        return {}
    total = valid.size
    mean_s = float(np.nanmean(slope))
    max_s  = float(np.nanmax(slope))

    # Adaptive bins: if max slope < 10°, compress range for visibility
    if max_s <= 10:
        bins = [(0,2,'Flat (0–2°)'), (2,4,'Gentle (2–4°)'), (4,6,'Moderate (4–6°)'), (6,8,'Steep (6–8°)'), (8,999,'Very Steep (>8°)')]
    elif max_s <= 25:
        bins = [(0,5,'Flat (0–5°)'), (5,10,'Gentle (5–10°)'), (10,15,'Moderate (10–15°)'), (15,20,'Steep (15–20°)'), (20,999,'Very Steep (>20°)')]
    else:
        bins = [(0,5,'Flat (0–5°)'), (5,15,'Gentle (5–15°)'), (15,25,'Moderate (15–25°)'), (25,35,'Steep (25–35°)'), (35,999,'Very Steep (>35°)')]

    class_pct = {}
    for lo, hi, label in bins:
        mask = (valid >= lo) & (valid < hi)
        class_pct[label] = round(float(mask.sum() / total * 100), 1)

    dominant = max(class_pct, key=class_pct.get)

    return {
        "mean_slope_deg":  round(mean_s, 2),
        "max_slope_deg":   round(max_s, 2),
        "class_pct":       class_pct,
        "dominant_class":  dominant,
        "adaptive_range":  f"0–{int(max_s)+1}°",
    }


def render_hillshade(dem: np.ndarray, hs: np.ndarray, output_path: str, title: str = "Hillshade"):
    fig, ax = plt.subplots(figsize=(10, 8), facecolor="#080808")
    ax.set_facecolor("#080808")
    ax.imshow(hs, cmap="gray", interpolation="bilinear", vmin=0, vmax=1)
    im = ax.imshow(dem, cmap="gist_earth", alpha=0.65, interpolation="bilinear")
    cbar = plt.colorbar(im, ax=ax, fraction=0.03, pad=0.02)
    cbar.set_label("Elevation (m)", color="white", fontsize=9)
    cbar.ax.yaxis.set_tick_params(color="white")
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color="white")
    ax.set_title(title, color="white", fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Column", color="#888", fontsize=8)
    ax.set_ylabel("Row", color="#888", fontsize=8)
    ax.tick_params(colors="#555")
    for spine in ax.spines.values():
        spine.set_edgecolor("#333")
    _add_map_furniture(ax, "USGS 3DEP")
    plt.tight_layout()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=200, bbox_inches="tight", facecolor="#080808")
    plt.close()
    print(f"  [terrain] Hillshade saved → {output_path}")


def render_slope(slope: np.ndarray, slope_stats: dict, output_path: str, title: str = "Slope Classification"):
    max_s = slope_stats.get("max_slope_deg", 90)

    # Adaptive colormap bounds matching classify_slope logic
    if max_s <= 10:
        bounds = [0, 2, 4, 6, 8, max(10, max_s + 1)]
        bin_labels = ["Flat (0–2°)", "Gentle (2–4°)", "Moderate (4–6°)", "Steep (6–8°)", f"Very Steep (>{8}°)"]
    elif max_s <= 25:
        bounds = [0, 5, 10, 15, 20, max(25, max_s + 1)]
        bin_labels = ["Flat (0–5°)", "Gentle (5–10°)", "Moderate (10–15°)", "Steep (15–20°)", f"Very Steep (>{20}°)"]
    else:
        bounds = [0, 5, 15, 25, 35, max(45, max_s + 1)]
        bin_labels = ["Flat (0–5°)", "Gentle (5–15°)", "Moderate (15–25°)", "Steep (25–35°)", f"Very Steep (>{35}°)"]

    bin_colors = ["#2ecc71", "#f1c40f", "#e67e22", "#e74c3c", "#8e44ad"]
    cmap = mcolors.LinearSegmentedColormap.from_list("slope", bin_colors, N=256)
    norm = mcolors.BoundaryNorm(bounds, cmap.N)

    fig, (ax_map, ax_stats) = plt.subplots(1, 2, figsize=(13, 7),
                                            gridspec_kw={"width_ratios": [3, 1]},
                                            facecolor="#080808")
    ax_map.set_facecolor("#080808")
    im = ax_map.imshow(slope, cmap=cmap, norm=norm, interpolation="bilinear")
    cbar = plt.colorbar(im, ax=ax_map, fraction=0.03, pad=0.02, ticks=bounds[:-1])
    cbar.set_label("Slope (degrees)", color="white", fontsize=9)
    cbar.ax.yaxis.set_tick_params(color="white")
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color="white")

    for lbl, col in zip(bin_labels, bin_colors):
        ax_map.plot([], [], color=col, linewidth=6, label=lbl)
    ax_map.legend(loc="lower right", fontsize=8, facecolor="#1a1a1a", labelcolor="white", edgecolor="#333")
    ax_map.set_title(title, color="white", fontsize=13, fontweight="bold", pad=12)
    ax_map.tick_params(colors="#555")
    for spine in ax_map.spines.values():
        spine.set_edgecolor("#333")
    _add_map_furniture(ax_map, "USGS 3DEP")

    # Stats panel
    ax_stats.set_facecolor("#111111")
    ax_stats.axis("off")
    ax_stats.set_title("Slope Stats", color="white", fontsize=10, fontweight="bold", pad=10)

    mean_s = slope_stats.get("mean_slope_deg", 0)
    max_slope = slope_stats.get("max_slope_deg", 0)
    dominant = slope_stats.get("dominant_class", "—")
    class_pct = slope_stats.get("class_pct", {})

    ax_stats.text(0.5, 0.97, f"Mean: {mean_s:.1f}°", ha="center", va="top",
                  color="white", fontsize=11, fontweight="bold", transform=ax_stats.transAxes)
    ax_stats.text(0.5, 0.89, f"Max: {max_slope:.1f}°", ha="center", va="top",
                  color="#aaa", fontsize=10, transform=ax_stats.transAxes)
    ax_stats.text(0.5, 0.81, f"Dominant:", ha="center", va="top",
                  color="#666", fontsize=8, transform=ax_stats.transAxes)
    ax_stats.text(0.5, 0.75, dominant.split("(")[0].strip(), ha="center", va="top",
                  color="#2ecc71", fontsize=9, fontweight="bold", transform=ax_stats.transAxes)

    y = 0.62
    for label, pct in class_pct.items():
        color = bin_colors[list(class_pct.keys()).index(label)]
        short = label.split("(")[0].strip()
        ax_stats.text(0.05, y, f"{short}", ha="left", va="top",
                      color="#aaa", fontsize=7.5, transform=ax_stats.transAxes)
        # bar
        bar_w = 0.9 * (pct / 100)
        ax_stats.add_patch(mpatches.FancyBboxPatch(
            (0.05, y - 0.055), 0.90, 0.028,
            boxstyle="round,pad=0.005", facecolor="#2a2a2a",
            edgecolor="#333", transform=ax_stats.transAxes))
        if bar_w > 0:
            ax_stats.add_patch(mpatches.FancyBboxPatch(
                (0.05, y - 0.055), bar_w, 0.028,
                boxstyle="round,pad=0.005", facecolor=color,
                edgecolor="none", transform=ax_stats.transAxes))
        ax_stats.text(0.97, y - 0.025, f"{pct:.1f}%", ha="right", va="center",
                      color="white", fontsize=7.5, fontweight="600",
                      transform=ax_stats.transAxes)
        y -= 0.115

    plt.tight_layout()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=200, bbox_inches="tight", facecolor="#080808")
    plt.close()
    print(f"  [terrain] Slope map saved → {output_path}")


def _add_map_furniture(ax, source: str):
    ax.annotate("N ↑", xy=(0.97, 0.97), xycoords="axes fraction",
                ha="right", va="top", color="white", fontsize=11, fontweight="bold")
    ax.annotate(f"Source: {source}", xy=(0.01, 0.01), xycoords="axes fraction",
                ha="left", va="bottom", color="#666", fontsize=7)


def run_terrain(dem_path: str, output_dir: str, project_name: str = "Site") -> dict:
    print(f"  [terrain] Processing DEM: {dem_path}")
    dem, transform, crs, res = read_dem(dem_path)
    maps_dir = Path(output_dir) / "maps"
    maps_dir.mkdir(parents=True, exist_ok=True)

    hs = compute_hillshade(dem, res=res)
    slope = compute_slope_degrees(dem, res)
    slope_stats = classify_slope(slope)

    render_hillshade(dem, hs, str(maps_dir / "hillshade.png"), f"{project_name} — Hillshade")
    render_slope(slope, slope_stats, str(maps_dir / "slope.png"), f"{project_name} — Slope Classification")

    elev_valid = dem[~np.isnan(dem)]
    summary = {
        "status": "ok",
        "elev_min_m":   round(float(np.min(elev_valid)), 2) if len(elev_valid) else None,
        "elev_max_m":   round(float(np.max(elev_valid)), 2) if len(elev_valid) else None,
        "elev_mean_m":  round(float(np.mean(elev_valid)), 2) if len(elev_valid) else None,
        "elev_range_m": round(float(np.max(elev_valid) - np.min(elev_valid)), 2) if len(elev_valid) else None,
        "slope": slope_stats,
        "maps": ["hillshade.png", "slope.png"],
        "crs": str(crs),
    }

    with open(Path(output_dir) / "terrain_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"  [terrain] Complete. Elev range: {summary['elev_min_m']}–{summary['elev_max_m']}m | Mean slope: {slope_stats.get('mean_slope_deg')}°")
    return summary


# NLCD class definitions
NLCD_CLASSES = {
    11: ("Open Water", "#466B9F"),
    21: ("Developed, Open Space", "#D99282"),
    22: ("Developed, Low Intensity", "#EA4F4F"),
    23: ("Developed, Medium Intensity", "#CC1212"),
    24: ("Developed, High Intensity", "#7F0000"),
    31: ("Barren Land", "#B3AC9F"),
    41: ("Deciduous Forest", "#68AA63"),
    42: ("Evergreen Forest", "#1C6330"),
    43: ("Mixed Forest", "#B5C98E"),
    52: ("Shrub/Scrub", "#CCBA7C"),
    71: ("Herbaceous", "#E2E2C1"),
    81: ("Hay/Pasture", "#DBD83D"),
    82: ("Cultivated Crops", "#AA7028"),
    90: ("Woody Wetlands", "#BAD8EA"),
    95: ("Emergent Herbaceous Wetlands", "#70A3BA"),
}


def render_nlcd(nlcd_path: str, output_path: str, project_name: str = "Site") -> dict:
    import rasterio as rio
    from matplotlib.patches import Patch

    try:
        with rio.open(nlcd_path) as src:
            data = src.read(1)
            nodata = src.nodata
    except Exception as e:
        return {"status": "error", "error": str(e)}

    if nodata is not None:
        data = np.where(data == nodata, 0, data)

    unique, counts = np.unique(data[data > 0], return_counts=True)
    total_pixels = np.sum(counts)
    class_pcts = {}
    for cls, cnt in zip(unique, counts):
        cls = int(cls)
        if cls in NLCD_CLASSES:
            name, _ = NLCD_CLASSES[cls]
            class_pcts[name] = round(cnt / total_pixels * 100, 1)

    rgb = np.zeros((*data.shape, 3), dtype=np.uint8)
    for cls, (name, hex_color) in NLCD_CLASSES.items():
        r = int(hex_color[1:3], 16)
        g = int(hex_color[3:5], 16)
        b = int(hex_color[5:7], 16)
        mask = data == cls
        rgb[mask] = [r, g, b]

    fig, ax = plt.subplots(figsize=(10, 8), facecolor="#080808")
    ax.set_facecolor("#080808")
    ax.imshow(rgb, interpolation="nearest")
    ax.set_title(f"{project_name} — Land Cover (NLCD 2021)",
                 color="white", fontsize=13, fontweight="bold", pad=12)
    ax.tick_params(colors="#555")
    for spine in ax.spines.values():
        spine.set_edgecolor("#333")
    ax.annotate("N ↑", xy=(0.97, 0.97), xycoords="axes fraction",
                ha="right", va="top", color="white", fontsize=11, fontweight="bold")

    legend_patches = []
    for cls, (name, color) in NLCD_CLASSES.items():
        if cls in unique:
            pct = class_pcts.get(name, 0)
            legend_patches.append(Patch(facecolor=color, label=f"{name} ({pct}%)"))

    if legend_patches:
        ax.legend(handles=legend_patches, loc="lower left", fontsize=7,
                  facecolor="#1a1a1a", labelcolor="white", edgecolor="#333",
                  ncol=2 if len(legend_patches) > 5 else 1)

    ax.annotate("Source: NLCD 2021 (MRLC)", xy=(0.01, 0.01), xycoords="axes fraction",
                ha="left", va="bottom", color="#555", fontsize=7)

    plt.tight_layout()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=200, bbox_inches="tight", facecolor="#080808")
    plt.close()
    print(f"  [nlcd] Land cover map saved → {output_path}")

    top_classes = sorted(class_pcts.items(), key=lambda x: x[1], reverse=True)

    return {
        "status": "ok",
        "class_percentages": class_pcts,
        "top_classes": top_classes[:5],
        "developed_pct": sum(v for k, v in class_pcts.items() if "Developed" in k),
        "forest_pct": sum(v for k, v in class_pcts.items() if "Forest" in k),
        "wetland_pct": sum(v for k, v in class_pcts.items() if "Wetland" in k),
        "agriculture_pct": sum(v for k, v in class_pcts.items() if k in ["Hay/Pasture", "Cultivated Crops"]),
        "maps": ["nlcd.png"],
    }
