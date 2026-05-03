import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from pathlib import Path
import rasterio
from rasterio.plot import show
import json


def read_dem(dem_path: str):
    with rasterio.open(dem_path) as src:
        data = src.read(1).astype(float)
        data[data == src.nodata] = np.nan
        transform = src.transform
        crs = src.crs
        res = src.res
    return data, transform, crs, res


def compute_hillshade(dem: np.ndarray, azimuth: float = 315, altitude: float = 45) -> np.ndarray:
    az = np.radians(360 - azimuth + 90)
    alt = np.radians(altitude)
    dy, dx = np.gradient(np.where(np.isnan(dem), 0, dem))
    slope = np.arctan(np.sqrt(dx**2 + dy**2))
    aspect = np.arctan2(-dy, dx)
    hs = (np.sin(alt) * np.cos(slope) +
          np.cos(alt) * np.sin(slope) * np.cos(az - aspect))
    hs = np.clip(hs, 0, 1)
    hs[np.isnan(dem)] = np.nan
    return hs


def compute_slope_degrees(dem: np.ndarray, res: tuple) -> np.ndarray:
    dy, dx = np.gradient(np.where(np.isnan(dem), 0, dem), res[1], res[0])
    slope = np.degrees(np.arctan(np.sqrt(dx**2 + dy**2)))
    slope[np.isnan(dem)] = np.nan
    return slope


def classify_slope(slope: np.ndarray) -> dict:
    valid = slope[~np.isnan(slope)]
    if len(valid) == 0:
        return {}
    total = valid.size
    return {
        "flat_pct": round(float(np.sum(valid < 5) / total * 100), 1),
        "moderate_pct": round(float(np.sum((valid >= 5) & (valid < 15)) / total * 100), 1),
        "steep_pct": round(float(np.sum((valid >= 15) & (valid < 30)) / total * 100), 1),
        "very_steep_pct": round(float(np.sum(valid >= 30) / total * 100), 1),
        "mean_slope_deg": round(float(np.nanmean(slope)), 2),
        "max_slope_deg": round(float(np.nanmax(slope)), 2),
        "min_elev_m": round(float(np.nanmin(slope)), 2),
    }


def render_hillshade(dem: np.ndarray, hs: np.ndarray, output_path: str, title: str = "Hillshade"):
    fig, ax = plt.subplots(figsize=(10, 8), facecolor="#0a0a0a")
    ax.set_facecolor("#0a0a0a")
    ax.imshow(hs, cmap="gray", interpolation="bilinear", vmin=0, vmax=1)
    im = ax.imshow(dem, cmap="terrain", alpha=0.4, interpolation="bilinear")
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
    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor="#0a0a0a")
    plt.close()
    print(f"  [terrain] Hillshade saved → {output_path}")


def render_slope(slope: np.ndarray, output_path: str, title: str = "Slope Classification"):
    cmap = mcolors.LinearSegmentedColormap.from_list(
        "slope", ["#2ecc71", "#f1c40f", "#e67e22", "#e74c3c", "#8e44ad"]
    )
    bounds = [0, 5, 15, 30, 45, 90]
    norm = mcolors.BoundaryNorm(bounds, cmap.N)
    fig, ax = plt.subplots(figsize=(10, 8), facecolor="#0a0a0a")
    ax.set_facecolor("#0a0a0a")
    im = ax.imshow(slope, cmap=cmap, norm=norm, interpolation="bilinear")
    cbar = plt.colorbar(im, ax=ax, fraction=0.03, pad=0.02, ticks=[0, 5, 15, 30, 45])
    cbar.set_label("Slope (degrees)", color="white", fontsize=9)
    cbar.ax.yaxis.set_tick_params(color="white")
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color="white")
    labels = ["Flat (0-5°)", "Moderate (5-15°)", "Steep (15-30°)", "Very Steep (30°+)"]
    colors = ["#2ecc71", "#f1c40f", "#e67e22", "#e74c3c"]
    for i, (lbl, col) in enumerate(zip(labels, colors)):
        ax.plot([], [], color=col, linewidth=6, label=lbl)
    ax.legend(loc="lower right", fontsize=8, facecolor="#1a1a1a", labelcolor="white", edgecolor="#333")
    ax.set_title(title, color="white", fontsize=13, fontweight="bold", pad=12)
    ax.tick_params(colors="#555")
    for spine in ax.spines.values():
        spine.set_edgecolor("#333")
    _add_map_furniture(ax, "USGS 3DEP")
    plt.tight_layout()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor="#0a0a0a")
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

    hs = compute_hillshade(dem)
    slope = compute_slope_degrees(dem, res)
    slope_stats = classify_slope(slope)

    render_hillshade(dem, hs, str(maps_dir / "hillshade.png"), f"{project_name} — Hillshade")
    render_slope(slope, str(maps_dir / "slope.png"), f"{project_name} — Slope Classification")

    elev_valid = dem[~np.isnan(dem)]
    summary = {
        "status": "ok",
        "elev_min_m": round(float(np.min(elev_valid)), 2) if len(elev_valid) else None,
        "elev_max_m": round(float(np.max(elev_valid)), 2) if len(elev_valid) else None,
        "elev_mean_m": round(float(np.mean(elev_valid)), 2) if len(elev_valid) else None,
        "elev_range_m": round(float(np.max(elev_valid) - np.min(elev_valid)), 2) if len(elev_valid) else None,
        "slope": slope_stats,
        "maps": ["hillshade.png", "slope.png"],
        "crs": str(crs),
    }

    with open(Path(output_dir) / "terrain_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"  [terrain] Complete. Elev range: {summary['elev_min_m']}–{summary['elev_max_m']}m")
    return summary
