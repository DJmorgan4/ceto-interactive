import json
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
from pathlib import Path


DRAINAGE_COLORS = {
    "Poorly drained": "#2980b9",
    "Somewhat poorly drained": "#3498db",
    "Moderately well drained": "#27ae60",
    "Well drained": "#f39c12",
    "Excessively drained": "#e67e22",
    "Unknown": "#7f8c8d",
}

TEXTURE_IMPLICATIONS = {
    "Clay": "High shrink-swell potential. Poor drainage. Foundation movement and road performance concerns. Recommend geotechnical investigation prior to construction.",
    "Clay Loam": "Moderate-high shrink-swell. Slow permeability. Monitor for seasonal saturation and foundation heave.",
    "Sandy Clay Loam": "Moderate shrink-swell. Variable drainage. Generally manageable with proper grading.",
    "Silt Loam": "Moderate erodibility. Susceptible to compaction. Careful grading and erosion control required.",
    "Sandy Loam": "Good drainage. Low shrink-swell. Low bearing capacity when loose or wet. Generally favorable.",
    "Loam": "Moderate properties. Balanced texture. Generally favorable for most land uses.",
    "Unknown": "Soil texture undetermined from desktop data. Field sampling recommended.",
}


def merge_soil_sources(ssurgo: dict, soilgrids: dict) -> dict:
    """
    Prefer SSURGO when available — it's mapped field data.
    Fall back to SoilGrids for global/point estimates.
    """
    if ssurgo.get("status") == "ok" and ssurgo.get("summary"):
        s = ssurgo["summary"]
        return {
            "source": "USDA SSURGO (primary) + SoilGrids (supplemental)",
            "status": "ok",
            "data_source": "ssurgo",
            "summary": {
                "clay_pct": s.get("clay_pct") or soilgrids.get("summary", {}).get("clay_pct"),
                "sand_pct": s.get("sand_pct") or soilgrids.get("summary", {}).get("sand_pct"),
                "silt_pct": s.get("silt_pct") or soilgrids.get("summary", {}).get("silt_pct"),
                "texture_class": s.get("texture_class", "Unknown"),
                "drainage": s.get("drainage_class", "Unknown"),
                "shrink_swell_risk": s.get("shrink_swell_risk", "Unknown"),
                "dominant_component": s.get("dominant_component", ""),
                "dominant_muname": s.get("dominant_muname", ""),
            },
            "ssurgo": ssurgo,
            "soilgrids": soilgrids,
        }
    elif soilgrids.get("status") == "ok":
        s = soilgrids["summary"]
        return {
            "source": "SoilGrids v2.0 (ISRIC) — SSURGO unavailable",
            "status": "ok",
            "data_source": "soilgrids",
            "summary": {
                "clay_pct": s.get("clay_pct"),
                "sand_pct": s.get("sand_pct"),
                "silt_pct": s.get("silt_pct"),
                "texture_class": s.get("texture_class", "Unknown"),
                "drainage": s.get("drainage", "Unknown"),
                "shrink_swell_risk": s.get("shrink_swell_risk", "Unknown"),
                "dominant_component": "",
                "dominant_muname": "",
            },
            "ssurgo": ssurgo,
            "soilgrids": soilgrids,
        }
    else:
        return {"source": "No soil data available", "status": "error", "summary": {}}


def render_soil_summary(merged: dict, output_path: str, project_name: str = "Site"):
    summary = merged.get("summary", {})
    clay = summary.get("clay_pct")
    sand = summary.get("sand_pct")
    silt = summary.get("silt_pct")
    texture = summary.get("texture_class", "Unknown")
    drainage = summary.get("drainage", "Unknown")
    shrink_swell = summary.get("shrink_swell_risk", "Unknown")
    comp_name = summary.get("dominant_component", "")
    muname = summary.get("dominant_muname", "")
    data_source = merged.get("data_source", "soilgrids")

    fig = plt.figure(figsize=(10, 8), facecolor="#0a0a0a")
    gs = fig.add_gridspec(2, 2, hspace=0.4, wspace=0.35,
                          left=0.08, right=0.95, top=0.88, bottom=0.08)

    source_label = "SSURGO (USDA)" if data_source == "ssurgo" else "SoilGrids (ISRIC)"
    title = f"{project_name} — Soils & Surface Conditions"
    if comp_name:
        title += f"\n{comp_name} series"
    fig.suptitle(title, color="white", fontsize=12, fontweight="bold", y=0.95)

    # Texture pie
    ax1 = fig.add_subplot(gs[0, 0])
    ax1.set_facecolor("#111")
    vals = [clay or 0, sand or 0, silt or 0]
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

    # Implication
    ax4 = fig.add_subplot(gs[1, 1])
    ax4.set_facecolor("#111")
    ax4.axis("off")
    impl = TEXTURE_IMPLICATIONS.get(texture, TEXTURE_IMPLICATIONS["Unknown"])
    label = muname if muname else texture
    ax4.text(0.5, 0.82, label, ha="center", va="top", color="white",
             fontsize=9, fontweight="bold", transform=ax4.transAxes)
    ax4.text(0.5, 0.64, impl, ha="center", va="top", color="#aaa", fontsize=7.5,
             style="italic", transform=ax4.transAxes, wrap=True, multialignment="center")

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

    merged = merge_soil_sources(ssurgo_data, soilgrids_data)
    render_soil_summary(merged, str(maps_dir / "soils.png"), project_name)

    summary_in = merged.get("summary", {})
    texture = summary_in.get("texture_class", "Unknown")

    summary = {
        "status": merged.get("status", "ok"),
        "data_source": merged.get("data_source", "unknown"),
        "clay_pct": summary_in.get("clay_pct"),
        "sand_pct": summary_in.get("sand_pct"),
        "silt_pct": summary_in.get("silt_pct"),
        "texture_class": texture,
        "drainage": summary_in.get("drainage", "Unknown"),
        "shrink_swell_risk": summary_in.get("shrink_swell_risk", "Unknown"),
        "dominant_component": summary_in.get("dominant_component", ""),
        "dominant_muname": summary_in.get("dominant_muname", ""),
        "engineering_implication": TEXTURE_IMPLICATIONS.get(texture, TEXTURE_IMPLICATIONS["Unknown"]),
        "maps": ["soils.png"],
        "source": merged.get("source", ""),
    }

    with open(Path(output_dir) / "soils_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"  [soils] Complete. Source: {merged.get('data_source')} | Texture: {texture} | Drainage: {summary['drainage']}")
    return summary
