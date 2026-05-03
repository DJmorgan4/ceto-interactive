import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path
import rasterio
import json


def render_location_map(bbox: list, center: list, output_path: str, project_name: str = "Site"):
    fig, ax = plt.subplots(figsize=(10, 8), facecolor="#0a0a0a")
    ax.set_facecolor("#111")
    min_lon, min_lat, max_lon, max_lat = bbox
    ax.set_xlim(min_lon, max_lon)
    ax.set_ylim(min_lat, max_lat)
    bbox_rect = mpatches.Rectangle(
        (min_lon, min_lat), max_lon - min_lon, max_lat - min_lat,
        linewidth=2, edgecolor="#3498db", facecolor="#3498db22"
    )
    ax.add_patch(bbox_rect)
    ax.plot(center[0], center[1], "o", color="#e74c3c", markersize=10, zorder=5)
    ax.text(center[0], center[1] + (max_lat - min_lat) * 0.03,
            f"{center[1]:.4f}°N\n{center[0]:.4f}°W",
            ha="center", color="white", fontsize=8)
    ax.set_xlabel("Longitude", color="#aaa", fontsize=9)
    ax.set_ylabel("Latitude", color="#aaa", fontsize=9)
    ax.set_title(f"{project_name} — Site Location", color="white", fontsize=13, fontweight="bold", pad=12)
    ax.tick_params(colors="#555")
    for spine in ax.spines.values():
        spine.set_edgecolor("#333")
    ax.annotate("N ↑", xy=(0.97, 0.97), xycoords="axes fraction", ha="right", va="top", color="white", fontsize=11, fontweight="bold")
    ax.annotate("Coordinate System: WGS84 (EPSG:4326)", xy=(0.01, 0.01), xycoords="axes fraction", ha="left", va="bottom", color="#555", fontsize=7)
    ax.grid(color="#222", linewidth=0.4, linestyle="--")
    plt.tight_layout()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor="#0a0a0a")
    plt.close()
    print(f"  [render] Location map saved → {output_path}")


def render_combined_overlay(dem_path: str, nhd_data: dict, output_path: str, project_name: str = "Site"):
    with rasterio.open(dem_path) as src:
        dem = src.read(1).astype(float)
        dem[dem == src.nodata] = np.nan
        transform = src.transform
        bounds = src.bounds

    fig, ax = plt.subplots(figsize=(10, 8), facecolor="#0a0a0a")
    ax.set_facecolor("#0a0a0a")

    dy, dx = np.gradient(np.where(np.isnan(dem), 0, dem))
    az = np.radians(315 - 90)
    alt = np.radians(45)
    slope = np.arctan(np.sqrt(dx**2 + dy**2))
    aspect = np.arctan2(-dy, dx)
    hs = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    hs = np.clip(hs, 0, 1)
    hs[np.isnan(dem)] = np.nan

    extent = [bounds.left, bounds.right, bounds.bottom, bounds.top]
    ax.imshow(hs, cmap="gray", extent=extent, origin="upper", interpolation="bilinear", vmin=0, vmax=1)
    im = ax.imshow(dem, cmap="terrain", extent=extent, origin="upper", alpha=0.45, interpolation="bilinear")

    flowlines = nhd_data.get("flowlines", {}).get("features", [])
    for feat in flowlines[:100]:
        geom = feat.get("geometry", {})
        if geom.get("type") == "LineString":
            coords = geom.get("coordinates", [])
            if coords:
                xs = [c[0] for c in coords]
                ys = [c[1] for c in coords]
                ax.plot(xs, ys, color="#3498db", linewidth=1.2, alpha=0.8)

    cbar = plt.colorbar(im, ax=ax, fraction=0.03, pad=0.02)
    cbar.set_label("Elevation (m)", color="white", fontsize=9)
    cbar.ax.yaxis.set_tick_params(color="white")
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color="white")

    ax.plot([], [], color="#3498db", linewidth=2, label="NHD Flowlines")
    ax.legend(loc="lower right", fontsize=8, facecolor="#1a1a1a", labelcolor="white", edgecolor="#333")

    ax.set_title(f"{project_name} — Combined Overlay", color="white", fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Longitude", color="#aaa", fontsize=8)
    ax.set_ylabel("Latitude", color="#aaa", fontsize=8)
    ax.tick_params(colors="#555")
    for spine in ax.spines.values():
        spine.set_edgecolor("#333")
    ax.annotate("N ↑", xy=(0.97, 0.97), xycoords="axes fraction", ha="right", va="top", color="white", fontsize=11, fontweight="bold")
    ax.annotate("Sources: USGS 3DEP, NHD Plus HR", xy=(0.01, 0.01), xycoords="axes fraction", ha="left", va="bottom", color="#555", fontsize=7)

    plt.tight_layout()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor="#0a0a0a")
    plt.close()
    print(f"  [render] Combined overlay saved → {output_path}")
