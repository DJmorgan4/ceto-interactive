import json
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
from pathlib import Path


DRAINAGE_COLORS = {
    "Poorly drained":           "#2980b9",
    "Somewhat poorly drained":  "#3498db",
    "Moderately well drained":  "#27ae60",
    "Well drained":             "#f39c12",
    "Excessively drained":      "#e67e22",
    "Unknown":                  "#7f8c8d",
}

TEXTURE_IMPLICATIONS = {
    "Clay":            "High shrink-swell potential. Poor drainage. Foundation movement and road performance concerns. Recommend geotechnical investigation prior to construction.",
    "Clay Loam":       "Moderate-high shrink-swell. Slow permeability. Monitor for seasonal saturation and foundation heave.",
    "Sandy Clay Loam": "Moderate shrink-swell. Variable drainage. Generally manageable with proper grading.",
    "Silt Loam":       "Moderate erodibility. Susceptible to compaction. Careful grading and erosion control required.",
    "Sandy Loam":      "Good drainage. Low shrink-swell. Low bearing capacity when loose or wet. Generally favorable.",
    "Loam":            "Moderate properties. Balanced texture. Generally favorable for most land uses.",
    "Unknown":         "Soil texture undetermined from desktop data. Field sampling recommended.",
}

# Typical depth-to-restriction by series (cm). None = highly variable / unknown.
SERIES_DEPTH_TABLE = {
    "altoga": 150, "houston": 51, "trinity": None, "heiden": 102,
    "austin": 51, "lewisville": 150, "medina": None, "burleson": 76,
    "ferris": 51, "pilot point": 102, "frio": None, "wilson": 102,
}


def _depth_to_bedrock(ssurgo: dict, dominant_component: str) -> dict:
    """Pull depth-to-restriction from SSURGO component data or series lookup."""
    # Try from raw SSURGO components list
    components = (ssurgo.get("components") or
                  ssurgo.get("summary", {}).get("components") or [])
    depths = []
    for comp in components:
        d = comp.get("resdept_r") or comp.get("depth_to_restriction_cm")
        if d is not None:
            try:
                depths.append(float(d))
            except (ValueError, TypeError):
                pass

    if depths:
        depth_cm = int(np.median(depths))
        source = "SSURGO corestrictions"
    else:
        # SSURGO returns no dominant component over open water and some
        # unmapped units; split() on an empty string yields [], not [""].
        parts = (dominant_component or "").lower().split()
        depth_cm = SERIES_DEPTH_TABLE.get(parts[0]) if parts else None
        source = "series lookup" if depth_cm is not None else "unknown"

    if depth_cm is None:
        label = "Unknown / variable — field investigation required"
    elif depth_cm < 51:
        label = f"Shallow ({depth_cm} cm) — restrictive layer near surface"
    elif depth_cm < 102:
        label = f"Moderate ({depth_cm} cm)"
    else:
        label = f"Deep (>{depth_cm} cm) — no near-surface restriction"

    return {"depth_cm": depth_cm, "label": label, "source": source}


def _spatial_variability(ssurgo: dict) -> dict:
    """Assess soil spatial variability from SSURGO mapunit count."""
    mapunits = (ssurgo.get("mapunits") or
                ssurgo.get("summary", {}).get("mapunits") or [])
    n = len(mapunits) if mapunits else 1

    total_acres = sum(float(mu.get("acres", 0) or 0) for mu in mapunits) if mapunits else 0
    if total_acres > 0 and mapunits:
        dominant_pct = round(max(float(mu.get("acres", 0) or 0) for mu in mapunits) / total_acres * 100, 1)
    else:
        dominant_pct = 100.0

    if n <= 2 and dominant_pct >= 70:
        level = "Low"
        note = (f"Uniform soil pattern — {n} mapunit(s), dominant type covers ~{dominant_pct:.0f}% of AOI. "
                "Conditions likely consistent across site.")
    elif n <= 5 and dominant_pct >= 50:
        level = "Moderate"
        note = (f"{n} mapunit(s); dominant covers ~{dominant_pct:.0f}% of AOI. "
                "Some variability expected — verify at site margins.")
    else:
        level = "High"
        note = (f"{n} distinct soil mapunits across AOI; dominant covers only ~{dominant_pct:.0f}%. "
                "Significant variability — targeted borings or test pits recommended.")

    return {"mapunit_count": n, "dominant_pct": dominant_pct, "level": level, "note": note}


def merge_soil_sources(ssurgo: dict, soilgrids: dict) -> dict:
    if ssurgo.get("status") == "ok" and ssurgo.get("summary"):
        s = ssurgo["summary"]
        return {
            "source": "USDA SSURGO (primary) + SoilGrids (supplemental)",
            "status": "ok",
            "data_source": "ssurgo",
            "summary": {
                "clay_pct":           s.get("clay_pct") or soilgrids.get("summary", {}).get("clay_pct"),
                "sand_pct":           s.get("sand_pct") or soilgrids.get("summary", {}).get("sand_pct"),
                "silt_pct":           s.get("silt_pct") or soilgrids.get("summary", {}).get("silt_pct"),
                "texture_class":      s.get("texture_class", "Unknown"),
                "drainage":           s.get("drainage_class", "Unknown"),
                "shrink_swell_risk":  s.get("shrink_swell_risk", "Unknown"),
                "dominant_component": s.get("dominant_component", ""),
                "dominant_muname":    s.get("dominant_muname", ""),
            },
            "ssurgo":    ssurgo,
            "soilgrids": soilgrids,
        }
    elif soilgrids.get("status") == "ok":
        s = soilgrids["summary"]
        return {
            "source": "SoilGrids v2.0 (ISRIC) — SSURGO unavailable",
            "status": "ok",
            "data_source": "soilgrids",
            "summary": {
                "clay_pct":           s.get("clay_pct"),
                "sand_pct":           s.get("sand_pct"),
                "silt_pct":           s.get("silt_pct"),
                "texture_class":      s.get("texture_class", "Unknown"),
                "drainage":           s.get("drainage", "Unknown"),
                "shrink_swell_risk":  s.get("shrink_swell_risk", "Unknown"),
                "dominant_component": "",
                "dominant_muname":    "",
            },
            "ssurgo":    ssurgo,
            "soilgrids": soilgrids,
        }
    else:
        return {"source": "No soil data available", "status": "error", "summary": {}}


def render_soil_summary(merged: dict, depth_info: dict, variability: dict,
                        output_path: str, project_name: str = "Site"):
    summary     = merged.get("summary", {})
    clay        = summary.get("clay_pct")
    sand        = summary.get("sand_pct")
    silt        = summary.get("silt_pct")
    texture     = summary.get("texture_class", "Unknown")
    drainage    = summary.get("drainage", "Unknown")
    shrink_swell = summary.get("shrink_swell_risk", "Unknown")
    comp_name   = summary.get("dominant_component", "")
    muname      = summary.get("dominant_muname", "")
    data_source = merged.get("data_source", "soilgrids")

    fig = plt.figure(figsize=(12, 10), facecolor="#0a0a0a")
    gs  = fig.add_gridspec(3, 2, hspace=0.5, wspace=0.35,
                           left=0.06, right=0.97, top=0.90, bottom=0.06)

    source_label = "SSURGO (USDA)" if data_source == "ssurgo" else "SoilGrids (ISRIC)"
    title = f"{project_name} — Soils & Surface Conditions"
    if comp_name:
        title += f"\n{comp_name} series"
    fig.suptitle(title, color="white", fontsize=12, fontweight="bold", y=0.96)

    # Texture pie
    ax1 = fig.add_subplot(gs[0, 0])
    ax1.set_facecolor("#111")
    vals   = [clay or 0, sand or 0, silt or 0]
    labels = [f"Clay\n{clay or 0:.0f}%", f"Sand\n{sand or 0:.0f}%", f"Silt\n{silt or 0:.0f}%"]
    colors = ["#8b6355", "#e8d5a3", "#a0b87a"]
    if sum(vals) > 0:
        ax1.pie(vals, labels=labels, colors=colors,
                textprops={"color": "white", "fontsize": 8},
                startangle=90, wedgeprops={"edgecolor": "#333", "linewidth": 1})
    ax1.set_title("Texture Composition", color="white", fontsize=9, pad=8)

    # Drainage
    ax2 = fig.add_subplot(gs[0, 1])
    ax2.set_facecolor("#111")
    ax2.axis("off")
    drain_color = DRAINAGE_COLORS.get(drainage, "#7f8c8d")
    circle = plt.Circle((0.5, 0.55), 0.28, color=drain_color, alpha=0.85)
    ax2.add_patch(circle)
    ax2.text(0.5, 0.55, drainage.replace(" ", "\n"),
             ha="center", va="center", color="white",
             fontsize=7, fontweight="bold", transform=ax2.transAxes)
    ax2.set_title("Drainage Class", color="white", fontsize=9, pad=8)
    ax2.set_xlim(0, 1); ax2.set_ylim(0, 1)

    # Shrink-swell bar
    ax3 = fig.add_subplot(gs[1, 0])
    ax3.set_facecolor("#111")
    ax3.axis("off")
    risk_map = {"Low": (0.2, "#27ae60"), "Moderate": (0.55, "#f39c12"), "High": (0.88, "#e74c3c")}
    risk_val, risk_color = risk_map.get(shrink_swell, (0.1, "#7f8c8d"))
    ax3.add_patch(mpatches.FancyBboxPatch((0.05, 0.45), 0.90, 0.12,
        boxstyle="round,pad=0.01", facecolor="#2a2a2a", edgecolor="#444", transform=ax3.transAxes))
    ax3.add_patch(mpatches.FancyBboxPatch((0.05, 0.45), 0.90 * risk_val, 0.12,
        boxstyle="round,pad=0.01", facecolor=risk_color, edgecolor="none", transform=ax3.transAxes))
    ax3.text(0.5, 0.72, f"Shrink-Swell Risk: {shrink_swell}",
             ha="center", va="bottom", color="white", fontsize=9, fontweight="bold", transform=ax3.transAxes)
    for lbl, xpos in [("Low", 0.12), ("Moderate", 0.50), ("High", 0.88)]:
        ax3.text(xpos, 0.30, lbl, ha="center", color="#777", fontsize=7, transform=ax3.transAxes)

    # Engineering implication
    ax4 = fig.add_subplot(gs[1, 1])
    ax4.set_facecolor("#111")
    ax4.axis("off")
    impl  = TEXTURE_IMPLICATIONS.get(texture, TEXTURE_IMPLICATIONS["Unknown"])
    label = muname if muname else texture
    ax4.text(0.5, 0.85, label, ha="center", va="top", color="white",
             fontsize=9, fontweight="bold", transform=ax4.transAxes)
    ax4.text(0.5, 0.68, impl, ha="center", va="top", color="#aaa", fontsize=7.5,
             style="italic", transform=ax4.transAxes, wrap=True, multialignment="center")

    # Depth to bedrock
    ax5 = fig.add_subplot(gs[2, 0])
    ax5.set_facecolor("#111")
    ax5.axis("off")
    ax5.set_title("Depth to Restriction / Bedrock", color="white", fontsize=9, pad=8)
    depth_cm = depth_info.get("depth_cm")
    bar_fill = min(int(depth_cm or 0), 200) / 200 if depth_cm else 0
    depth_color = "#e74c3c" if (depth_cm or 999) < 51 else "#f39c12" if (depth_cm or 999) < 102 else "#27ae60"
    ax5.add_patch(mpatches.FancyBboxPatch((0.05, 0.52), 0.90, 0.10,
        boxstyle="round,pad=0.01", facecolor="#2a2a2a", edgecolor="#444", transform=ax5.transAxes))
    if bar_fill > 0:
        ax5.add_patch(mpatches.FancyBboxPatch((0.05, 0.52), 0.90 * bar_fill, 0.10,
            boxstyle="round,pad=0.01", facecolor=depth_color, edgecolor="none", transform=ax5.transAxes))
    ax5.text(0.5, 0.78, depth_info.get("label", "Unknown"),
             ha="center", va="bottom", color="white", fontsize=8, fontweight="bold", transform=ax5.transAxes)
    ax5.text(0.5, 0.32, f"Source: {depth_info.get('source','—')}",
             ha="center", va="top", color="#555", fontsize=7, transform=ax5.transAxes)

    # Spatial variability
    ax6 = fig.add_subplot(gs[2, 1])
    ax6.set_facecolor("#111")
    ax6.axis("off")
    ax6.set_title("Soil Spatial Variability", color="white", fontsize=9, pad=8)
    var_color = {"Low": "#27ae60", "Moderate": "#f39c12", "High": "#e74c3c"}.get(variability.get("level", ""), "#888")
    ax6.text(0.5, 0.82, variability.get("level", "—"),
             ha="center", va="top", color=var_color, fontsize=14, fontweight="bold", transform=ax6.transAxes)
    ax6.text(0.5, 0.62, f"{variability.get('mapunit_count','—')} mapunit(s)  |  dominant ~{variability.get('dominant_pct','—')}%",
             ha="center", va="top", color="#777", fontsize=7.5, transform=ax6.transAxes)
    ax6.text(0.5, 0.44, variability.get("note", ""),
             ha="center", va="top", color="#aaa", fontsize=7.5,
             style="italic", transform=ax6.transAxes, wrap=True, multialignment="center")

    fig.text(0.5, 0.01, f"Source: {source_label}  |  Desktop screening only",
             ha="center", color="#555", fontsize=7)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor="#0a0a0a")
    plt.close()
    print(f"  [soils] Summary card saved → {output_path}")


def run_soils(ssurgo_data: dict, soilgrids_data: dict, output_dir: str, project_name: str = "Site") -> dict:
    print(f"  [soils] Building soils summary...")
    maps_dir = Path(output_dir) / "maps"
    maps_dir.mkdir(parents=True, exist_ok=True)

    merged     = merge_soil_sources(ssurgo_data, soilgrids_data)
    summary_in = merged.get("summary", {})
    texture    = summary_in.get("texture_class", "Unknown")
    dominant   = summary_in.get("dominant_component", "")

    depth_info  = _depth_to_bedrock(ssurgo_data, dominant)
    variability = _spatial_variability(ssurgo_data)

    render_soil_summary(merged, depth_info, variability, str(maps_dir / "soils.png"), project_name)

    summary = {
        "status":                merged.get("status", "ok"),
        "data_source":           merged.get("data_source", "unknown"),
        "clay_pct":              summary_in.get("clay_pct"),
        "sand_pct":              summary_in.get("sand_pct"),
        "silt_pct":              summary_in.get("silt_pct"),
        "texture_class":         texture,
        "drainage":              summary_in.get("drainage", "Unknown"),
        "shrink_swell_risk":     summary_in.get("shrink_swell_risk", "Unknown"),
        "dominant_component":    dominant,
        "dominant_muname":       summary_in.get("dominant_muname", ""),
        "depth_to_bedrock":      depth_info,
        "spatial_variability":   variability,
        "engineering_implication": TEXTURE_IMPLICATIONS.get(texture, TEXTURE_IMPLICATIONS["Unknown"]),
        "maps":                  ["soils.png"],
        "source":                merged.get("source", ""),
    }

    with open(Path(output_dir) / "soils_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"  [soils] Complete. Source: {merged.get('data_source')} | Texture: {texture} | Drainage: {summary['drainage']} | Depth: {depth_info['label']}")
    return summary
