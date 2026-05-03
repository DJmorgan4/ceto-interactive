import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from pathlib import Path
import rasterio
import json


def fill_depressions(dem: np.ndarray) -> np.ndarray:
    filled = dem.copy()
    filled = np.where(np.isnan(filled), np.nanmin(filled), filled)
    changed = True
    iterations = 0
    while changed and iterations < 50:
        changed = False
        iterations += 1
        for i in range(1, filled.shape[0] - 1):
            for j in range(1, filled.shape[1] - 1):
                neighbors = filled[i-1:i+2, j-1:j+2]
                min_neighbor = np.min(neighbors)
                if filled[i, j] < min_neighbor:
                    filled[i, j] = min_neighbor
                    changed = True
    return filled


def compute_flow_direction(dem: np.ndarray) -> np.ndarray:
    dy, dx = np.gradient(np.where(np.isnan(dem), 0, dem))
    angle = np.arctan2(-dy, dx)
    direction = np.zeros_like(dem, dtype=int)
    direction[(angle >= -np.pi/8) & (angle < np.pi/8)] = 1      # E
    direction[(angle >= np.pi/8) & (angle < 3*np.pi/8)] = 2     # NE
    direction[(angle >= 3*np.pi/8) & (angle < 5*np.pi/8)] = 4   # N
    direction[(angle >= 5*np.pi/8) | (angle < -5*np.pi/8)] = 8  # NW
    direction[(angle >= -5*np.pi/8) & (angle < -3*np.pi/8)] = 6 # SW
    direction[(angle >= -3*np.pi/8) & (angle < -np.pi/8)] = 3   # SE
    return direction


def compute_flow_accumulation(dem: np.ndarray) -> np.ndarray:
    rows, cols = dem.shape
    accum = np.ones((rows, cols))
    dy, dx = np.gradient(np.where(np.isnan(dem), 0, dem))
    slope_mag = np.sqrt(dx**2 + dy**2)
    flat = slope_mag < 0.001
    kernel_size = max(3, min(rows, cols) // 20)
    from scipy.ndimage import uniform_filter
    try:
        smoothed = uniform_filter(np.where(np.isnan(dem), 0, dem), size=kernel_size)
        dy2, dx2 = np.gradient(smoothed)
        accum = np.sqrt(dx2**2 + dy2**2) * rows * cols / 100
        accum = np.clip(accum, 1, None)
    except ImportError:
        accum = slope_mag * 100
    accum[np.isnan(dem)] = np.nan
    return accum


def identify_low_areas(dem: np.ndarray, percentile: float = 10) -> np.ndarray:
    valid = dem[~np.isnan(dem)]
    if len(valid) == 0:
        return np.zeros_like(dem, dtype=bool)
    threshold = np.percentile(valid, percentile)
    return dem <= threshold


def compute_drainage_stats(dem: np.ndarray, flow_accum: np.ndarray) -> dict:
    valid_dem = dem[~np.isnan(dem)]
    valid_fa = flow_accum[~np.isnan(flow_accum)]
    low_mask = identify_low_areas(dem, percentile=15)
    low_pct = float(np.sum(low_mask & ~np.isnan(dem))) / float(np.sum(~np.isnan(dem))) * 100

    high_accum_mask = flow_accum > np.nanpercentile(flow_accum, 85)
    channel_pct = float(np.sum(high_accum_mask & ~np.isnan(dem))) / float(np.sum(~np.isnan(dem))) * 100

    return {
        "low_area_pct": round(low_pct, 1),
        "channel_pct": round(channel_pct, 1),
        "elev_std_m": round(float(np.std(valid_dem)), 2) if len(valid_dem) else None,
        "drainage_complexity": "High" if channel_pct > 15 else "Moderate" if channel_pct > 5 else "Low",
        "ponding_risk": "High" if low_pct > 20 else "Moderate" if low_pct > 10 else "Low",
    }


def render_flow_accumulation(dem: np.ndarray, flow_accum: np.ndarray, output_path: str, title: str = "Drainage & Flow Accumulation"):
    fig, ax = plt.subplots(figsize=(10, 8), facecolor="#0a0a0a")
    ax.set_facecolor("#0a0a0a")

    hs_dy, hs_dx = np.gradient(np.where(np.isnan(dem), 0, dem))
    hs_slope = np.arctan(np.sqrt(hs_dx**2 + hs_dy**2))
    hs_az = np.radians(315 - 90)
    hs_alt = np.radians(45)
    hs_aspect = np.arctan2(-hs_dy, hs_dx)
    hs = np.sin(hs_alt) * np.cos(hs_slope) + np.cos(hs_alt) * np.sin(hs_slope) * np.cos(hs_az - hs_aspect)
    hs = np.clip(hs, 0, 1)
    ax.imshow(hs, cmap="gray", alpha=0.4, interpolation="bilinear")

    fa_log = np.log1p(flow_accum)
    fa_log[np.isnan(flow_accum)] = np.nan
    cmap_water = plt.cm.Blues
    cmap_water.set_bad(alpha=0)
    im = ax.imshow(fa_log, cmap=cmap_water, alpha=0.75, interpolation="bilinear")

    low_mask = identify_low_areas(dem, percentile=12)
    low_overlay = np.zeros((*dem.shape, 4))
    low_overlay[low_mask] = [0.2, 0.6, 1.0, 0.3]
    ax.imshow(low_overlay, interpolation="nearest")

    cbar = plt.colorbar(im, ax=ax, fraction=0.03, pad=0.02)
    cbar.set_label("Flow Accumulation (log scale)", color="white", fontsize=9)
    cbar.ax.yaxis.set_tick_params(color="white")
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color="white")

    ax.plot([], [], color="#3498db", linewidth=3, label="Drainage channels")
    ax.plot([], [], color="#2980b9", linewidth=0, marker="s", markersize=8, alpha=0.4, label="Low / wet areas (bottom 12%)")
    ax.legend(loc="lower right", fontsize=8, facecolor="#1a1a1a", labelcolor="white", edgecolor="#333")

    ax.set_title(title, color="white", fontsize=13, fontweight="bold", pad=12)
    ax.tick_params(colors="#555")
    for spine in ax.spines.values():
        spine.set_edgecolor("#333")
    ax.annotate("N ↑", xy=(0.97, 0.97), xycoords="axes fraction", ha="right", va="top", color="white", fontsize=11, fontweight="bold")
    ax.annotate("Source: USGS 3DEP", xy=(0.01, 0.01), xycoords="axes fraction", ha="left", va="bottom", color="#666", fontsize=7)

    plt.tight_layout()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor="#0a0a0a")
    plt.close()
    print(f"  [hydro] Flow accumulation map saved → {output_path}")


def run_hydrology(dem_path: str, output_dir: str, project_name: str = "Site") -> dict:
    print(f"  [hydro] Processing hydrology from: {dem_path}")
    with rasterio.open(dem_path) as src:
        dem = src.read(1).astype(float)
        dem[dem == src.nodata] = np.nan

    maps_dir = Path(output_dir) / "maps"
    maps_dir.mkdir(parents=True, exist_ok=True)

    flow_accum = compute_flow_accumulation(dem)
    stats = compute_drainage_stats(dem, flow_accum)

    render_flow_accumulation(dem, flow_accum, str(maps_dir / "drainage.png"), f"{project_name} — Drainage & Flow Accumulation")

    summary = {
        "status": "ok",
        "maps": ["drainage.png"],
        **stats,
    }

    with open(Path(output_dir) / "hydrology_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"  [hydro] Complete. Low area: {stats['low_area_pct']}%, Ponding risk: {stats['ponding_risk']}")
    return summary
