import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path
import rasterio
from rasterio.transform import rowcol
import json


def sample_dem_along_transect(dem_path: str, start: list, end: list, n_points: int = 200) -> dict:
    with rasterio.open(dem_path) as src:
        dem = src.read(1).astype(float)
        dem[dem == src.nodata] = np.nan
        transform = src.transform

    lons = np.linspace(start[0], end[0], n_points)
    lats = np.linspace(start[1], end[1], n_points)

    elevations = []
    for lon, lat in zip(lons, lats):
        try:
            row, col = rowcol(transform, lon, lat)
            row = int(np.clip(row, 0, dem.shape[0] - 1))
            col = int(np.clip(col, 0, dem.shape[1] - 1))
            elev = dem[row, col]
            elevations.append(float(elev) if not np.isnan(elev) else None)
        except Exception:
            elevations.append(None)

    valid = [e for e in elevations if e is not None]
    distances_km = []
    R = 6371.0
    for i in range(n_points):
        lat1, lon1 = np.radians(start[1]), np.radians(start[0])
        lat2, lon2 = np.radians(lats[i]), np.radians(lons[i])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = np.sin(dlat/2)**2 + np.cos(lat1)*np.cos(lat2)*np.sin(dlon/2)**2
        dist = R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        distances_km.append(round(dist, 4))

    total_dist_km = distances_km[-1] if distances_km else 0

    return {
        "distances_km": distances_km,
        "elevations_m": elevations,
        "n_points": n_points,
        "total_distance_km": round(total_dist_km, 3),
        "elev_min_m": round(min(valid), 2) if valid else None,
        "elev_max_m": round(max(valid), 2) if valid else None,
        "elev_range_m": round(max(valid) - min(valid), 2) if valid else None,
        "start": start,
        "end": end,
    }


def analyze_transect_metrics(elevations: list, distances_km: list) -> dict:
    """Extract terrain intelligence: relief, steepest segment, cut/fill implication."""
    clean = [(d, e) for d, e in zip(distances_km, elevations) if e is not None]
    if len(clean) < 4:
        return {}

    dists = [p[0] for p in clean]
    elevs = [p[1] for p in clean]
    elev_arr = np.array(elevs)
    dist_arr = np.array(dists)

    total_relief = float(np.max(elev_arr) - np.min(elev_arr))
    total_dist_km = float(dist_arr[-1])
    mean_elev = float(np.mean(elev_arr))

    # Steepest 10% window
    window = max(2, len(elevs) // 10)
    max_grad_pct = 0.0
    best_i = 0
    for i in range(len(elevs) - window):
        dz = abs(elevs[i + window] - elevs[i])
        dd = (dists[i + window] - dists[i]) * 1000  # km → m
        if dd > 0:
            grad = dz / dd * 100
            if grad > max_grad_pct:
                max_grad_pct = grad
                best_i = i

    steepest = {
        "start_km": round(dists[best_i], 3),
        "end_km":   round(dists[min(best_i + window, len(dists)-1)], 3),
        "gradient_pct": round(max_grad_pct, 2),
        "description": _grad_label(max_grad_pct),
    }

    # Cut/fill
    if total_relief < 3:
        cf_level = "Minimal"
        cf_note = (f"Total relief {total_relief:.1f} m over {total_dist_km:.2f} km — essentially flat. "
                   "Grading requirements minimal; verify drainage crown direction.")
    elif total_relief < 10:
        cf_level = "Moderate"
        cf_note = (f"Total relief {total_relief:.1f} m. Grading likely needed at steepest segment "
                   f"({steepest['gradient_pct']:.1f}% grade). Balanced cut/fill may be achievable on-site.")
    else:
        cf_level = "Significant"
        cf_note = (f"Total relief {total_relief:.1f} m — significant earthwork anticipated. "
                   f"Steepest segment {steepest['gradient_pct']:.1f}% grade "
                   f"({steepest['start_km']:.2f}–{steepest['end_km']:.2f} km along transect). "
                   "Material import/export likely. Erosion control critical during construction.")

    # Terrain character
    avg_grade = (total_relief / (total_dist_km * 1000) * 100) if total_dist_km > 0 else 0
    if avg_grade < 2:
        character = "Flat"
    elif avg_grade < 8:
        character = "Rolling"
    elif avg_grade < 15:
        character = "Hilly"
    else:
        character = "Steep"

    return {
        "total_relief_m":    round(total_relief, 2),
        "mean_elevation_m":  round(mean_elev, 2),
        "total_distance_km": round(total_dist_km, 3),
        "terrain_character": character,
        "steepest_segment":  steepest,
        "cut_fill_level":    cf_level,
        "cut_fill_note":     cf_note,
    }


def _grad_label(pct: float) -> str:
    if pct < 2:   return "Nearly flat"
    if pct < 8:   return "Gentle grade"
    if pct < 15:  return "Moderate grade — grading required"
    if pct < 25:  return "Steep — significant earthwork"
    return "Very steep — major grading"


def intersect_geology_along_transect(geo_data: dict, n_points: int = 200) -> list:
    units = geo_data.get("units", [])
    if not units:
        return [{"name": "Undifferentiated", "lithology": "Unknown", "color": "#a0a0b0"}] * n_points
    primary = units[0]
    liths = primary.get("lithology", [])
    lith_name = liths[0].get("name", "Unknown") if liths and isinstance(liths[0], dict) else "Unknown"
    return [{"name": primary.get("name", "Unknown"), "lithology": lith_name, "color": "#a0a0b0"}] * n_points


def classify_terrain_breaks(elevations: list, distances: list) -> list:
    breaks = []
    if len(elevations) < 3:
        return breaks
    valid_pairs = [(d, e) for d, e in zip(distances, elevations) if e is not None]
    if len(valid_pairs) < 3:
        return breaks
    for i in range(1, len(valid_pairs) - 1):
        d_prev, e_prev = valid_pairs[i-1]
        d_curr, e_curr = valid_pairs[i]
        d_next, e_next = valid_pairs[i+1]
        slope1 = (e_curr - e_prev) / max(d_curr - d_prev, 0.001)
        slope2 = (e_next - e_curr) / max(d_next - d_curr, 0.001)
        if abs(slope2 - slope1) > 50:
            breaks.append({"distance_km": d_curr, "elevation_m": e_curr, "type": "terrain_break"})
    return breaks[:5]


def render_cross_section(profile: dict, geo_data: dict, metrics: dict,
                         output_path: str, project_name: str = "Site"):
    distances = profile["distances_km"]
    elevations = profile["elevations_m"]
    valid_elevs = [e for e in elevations if e is not None]
    if not valid_elevs:
        print("  [cross_section] No valid elevations to render.")
        return

    clean_dist = []
    clean_elev = []
    for d, e in zip(distances, elevations):
        if e is not None:
            clean_dist.append(d)
            clean_elev.append(e)

    elev_min = min(clean_elev)
    elev_max = max(clean_elev)
    elev_range = max(elev_max - elev_min, 1)
    padding = elev_range * 0.3
    geo_bottom = elev_min - padding * 2.5

    fig, ax = plt.subplots(figsize=(12, 6), facecolor="#0a0a0a")
    ax.set_facecolor("#0a0a0a")

    units = geo_data.get("units", [])
    if units:
        primary = units[0]
        liths = primary.get("lithology", [])
        lith_name = liths[0].get("name", "").lower() if liths and isinstance(liths[0], dict) else ""
        from backend.geology import get_lith_color
        geo_color = get_lith_color(lith_name)
    else:
        geo_color = "#6a5a4a"

    ax.fill_between(clean_dist, geo_bottom, clean_elev,
                    color=geo_color, alpha=0.6, label="Mapped geology unit")
    ax.fill_between(clean_dist, clean_elev, elev_max + padding,
                    color="#1a2a3a", alpha=0.3)
    ax.plot(clean_dist, clean_elev, color="white", linewidth=2.0, zorder=5)

    # Steepest segment highlight
    ss = metrics.get("steepest_segment", {})
    if ss and ss.get("gradient_pct", 0) > 1:
        ax.axvspan(ss["start_km"], ss["end_km"],
                   alpha=0.20, color="#f97316", zorder=3)
        mid_x = (ss["start_km"] + ss["end_km"]) / 2
        ax.annotate(
            f"Max grade\n{ss['gradient_pct']:.1f}%",
            xy=(mid_x, elev_max),
            xytext=(mid_x, elev_max + padding * 0.65),
            color="#f97316", fontsize=7.5, ha="center",
            arrowprops=dict(arrowstyle="->", color="#f97316", lw=0.8),
        )

    breaks = classify_terrain_breaks(elevations, distances)
    for brk in breaks:
        ax.axvline(x=brk["distance_km"], color="#e74c3c", linewidth=0.8,
                   linestyle="--", alpha=0.7)
        ax.text(brk["distance_km"], elev_max + padding * 0.6,
                "↓ break", color="#e74c3c", fontsize=7, ha="center")

    if units:
        primary = units[0]
        unit_label = primary.get("name", "Unknown Unit")
        period = primary.get("period", "")
        liths = primary.get("lithology", [])
        lith_str = liths[0].get("name", "") if liths and isinstance(liths[0], dict) else ""
        label_text = f"{unit_label}\n{period}  |  {lith_str}"
        ax.text(clean_dist[len(clean_dist)//2], geo_bottom + padding * 0.4,
                label_text, ha="center", color="#ccc",
                fontsize=8, style="italic", alpha=0.85)

    # Stats box top-left
    cf_level  = metrics.get("cut_fill_level", "—")
    character = metrics.get("terrain_character", "—")
    relief    = metrics.get("total_relief_m", "—")
    cf_color  = {"Minimal": "#27ae60", "Moderate": "#f39c12", "Significant": "#e74c3c"}.get(cf_level, "#888")
    stats_txt = (f"Relief: {relief} m\n"
                 f"Character: {character}\n"
                 f"Cut/Fill: {cf_level}")
    ax.text(0.01, 0.97, stats_txt, transform=ax.transAxes, fontsize=8,
            va="top", color="white",
            bbox=dict(boxstyle="round,pad=0.5", facecolor="#1a1a1a", alpha=0.85, edgecolor="#333"))

    ax.set_xlim(0, max(clean_dist))
    ax.set_ylim(geo_bottom, elev_max + padding)
    ax.set_xlabel("Distance along transect (km)", color="#aaa", fontsize=9)
    ax.set_ylabel("Elevation (m)", color="#aaa", fontsize=9)
    ax.set_title(f"{project_name} — Interpreted Cross-Section", color="white", fontsize=13, fontweight="bold", pad=12)
    ax.tick_params(colors="#666")
    for spine in ax.spines.values():
        spine.set_edgecolor("#333")
    ax.grid(axis="y", color="#222", linewidth=0.5, linestyle="--")

    start = profile.get("start", [])
    end   = profile.get("end", [])
    if start and end:
        ax.text(0.01, 0.03, f"A  {start[1]:.4f}°N, {start[0]:.4f}°E",
                transform=ax.transAxes, color="#aaa", fontsize=8, va="bottom")
        ax.text(0.99, 0.03, f"A'  {end[1]:.4f}°N, {end[0]:.4f}°E",
                transform=ax.transAxes, color="#aaa", fontsize=8, va="bottom", ha="right")

    disclaimer = "INTERPRETED / CONCEPTUAL — not verified by boreholes, geophysics, or field mapping"
    ax.text(0.5, 0.01, disclaimer, transform=ax.transAxes,
            ha="center", color="#e74c3c", fontsize=7, alpha=0.8)

    legend_elements = [
        mpatches.Patch(facecolor=geo_color, alpha=0.6, label="Mapped geology unit"),
        plt.Line2D([0], [0], color="white", linewidth=2, label="Ground surface"),
    ]
    if ss and ss.get("gradient_pct", 0) > 1:
        legend_elements.append(mpatches.Patch(facecolor="#f97316", alpha=0.3, label=f"Steepest segment ({ss['gradient_pct']:.1f}%)"))
    if breaks:
        legend_elements.append(plt.Line2D([0], [0], color="#e74c3c", linewidth=1,
                                           linestyle="--", label="Terrain break"))
    ax.legend(handles=legend_elements, loc="upper right", fontsize=8,
              facecolor="#1a1a1a", labelcolor="white", edgecolor="#333")

    plt.tight_layout()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor="#0a0a0a")
    plt.close()
    print(f"  [cross_section] Saved → {output_path}")


def run_cross_section(dem_path: str, geo_data: dict, transect: dict,
                      output_dir: str, project_name: str = "Site") -> dict:
    if not dem_path:
        print("  [cross_section] Skipped — no DEM available")
        return {"status": "skipped", "reason": "no_dem"}
    print(f"  [cross_section] Running transect {transect['start']} → {transect['end']}")
    maps_dir = Path(output_dir) / "maps"
    maps_dir.mkdir(parents=True, exist_ok=True)

    profile = sample_dem_along_transect(dem_path, transect["start"], transect["end"])
    metrics = analyze_transect_metrics(profile["elevations_m"], profile["distances_km"])
    render_cross_section(profile, geo_data, metrics, str(maps_dir / "cross_section.png"), project_name)

    summary = {
        "status": "ok",
        "start": transect["start"],
        "end":   transect["end"],
        "total_distance_km": profile["total_distance_km"],
        "elev_min_m":        profile["elev_min_m"],
        "elev_max_m":        profile["elev_max_m"],
        "elev_range_m":      profile["elev_range_m"],
        "terrain_breaks":    classify_terrain_breaks(profile["elevations_m"], profile["distances_km"]),
        "metrics":           metrics,
        "maps":              ["cross_section.png"],
        "disclaimer":        "Conceptual interpretation — not verified by subsurface investigation",
    }

    with open(Path(output_dir) / "cross_section_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"  [cross_section] Complete. Relief: {metrics.get('total_relief_m')}m | Character: {metrics.get('terrain_character')} | Cut/Fill: {metrics.get('cut_fill_level')}")
    return summary
