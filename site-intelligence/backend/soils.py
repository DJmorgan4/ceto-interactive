import json
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
from pathlib import Path


DRAINAGE_COLORS = {
    "Poorly drained": "#2980b9",
    "Moderately well drained": "#27ae60",
    "Well drained": "#f39c12",
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


def render_soil_summary(soil_data: dict, output_path: str, project_name: str = "Site"):
    summary = soil_data.get("summary", {})
    clay = summary.get("clay_pct")
    sand = summary.get("sand_pct")
    silt = summary.get("silt_pct")
    texture = summary.get("texture_class", "Unknown")
    drainage = summary.get("drainage", "Unknown")
    shrink_swell = summary.get("shrink_swell_risk", "Unknown")

    fig = plt.figure(figsize=(10, 8), facecolor="#0a0a0a")
    gs = fig.add_gridspec(2, 2, hspace=0.4, wspace=0.35,
                          left=0.08, right=0.95, top=0.88, bottom=0.08)

    fig.suptitle(f"{project_name} — Soils & Surface Conditions",
                 color="white", fontsize=13, fontweight="bold", y=0.95)

    # --- Texture triangle approximation (pie) ---
    ax1 = fig.add_subplot(gs[0, 0])
    ax1.set_facecolor("#111")
    vals = [clay or 0, sand or 0, silt or 0]
    labels = [f"Clay\n{clay or 0}%", f"Sand\n{sand or 0}%", f"Silt\n{silt or 0}%"]
    colors = ["#8b6355", "#e8d5a3", "#a0b87a"]
    if sum(vals) > 0:
        wedges, texts = ax1.pie(vals, labels=labels, colors=colors,
                                textprops={"color": "white", "fontsize": 8},
                                startangle=90, wedgeprops={"edgecolor": "#333", "linewidth": 1})
    ax1.set_title("Texture Composition", color="white", fontsize=9, pad=8)

    # --- Drainage indicator ---
    ax2 = fig.add_subplot(gs[0, 1])
    ax2.set_facecolor("#111")
    ax2.axis("off")
    drain_color = DRAINAGE_COLORS.get(drainage, "#7f8c8d")
    circle = plt.Circle((0.5, 0.55), 0.28, color=drain_color, alpha=0.85)
    ax2.add_patch(circle)
    ax2.text(0.5, 0.55, drainage.replace(" ", "\n"),
             ha="center", va="center", color="white",
             fontsize=8, fontweight="bold", transform=ax2.transAxes)
    ax2.set_title("Drainage Class", color="white", fontsize=9, pad=8)
    ax2.set_xlim(0, 1)
    ax2.set_ylim(0, 1)

    # --- Shrink-swell risk bar ---
    ax3 = fig.add_subplot(gs[1, 0])
    ax3.set_facecolor("#111")
    ax3.axis("off")
    risk_map = {"Low": (0.2, "#27ae60"), "Moderate": (0.55, "#f39c12"), "High": (0.88, "#e74c3c")}
    risk_val, risk_color = risk_map.get(shrink_swell, (0.1, "#7f8c8d"))
    bar_bg = mpatches.FancyBboxPatch((0.05, 0.45), 0.90, 0.12,
                                      boxstyle="round,pad=0.01", facecolor="#2a2a2a",
                                      edgecolor="#444", transform=ax3.transAxes)
    ax3.add_patch(bar_bg)
    bar_fill = mpatches.FancyBboxPatch((0.05, 0.45), 0.90 * risk_val, 0.12,
                                        boxstyle="round,pad=0.01", facecolor=risk_color,
                                        edgecolor="none", transform=ax3.transAxes)
    ax3.add_patch(bar_fill)
    ax3.text(0.5, 0.72, f"Shrink-Swell Risk: {shrink_swell}",
             ha="center", va="bottom", color="white",
             fontsize=9, fontweight="bold", transform=ax3.transAxes)
    for lbl, xpos in [("Low", 0.12), ("Moderate", 0.50), ("High", 0.88)]:
        ax3.text(xpos, 0.30, lbl, ha="center", color="#777", fontsize=7, transform=ax3.transAxes)

    # --- Implication text ---
    ax4 = fig.add_subplot(gs[1, 1])
    ax4.set_facecolor("#111")
    ax4.axis("off")
    impl = TEXTURE_IMPLICATIONS.get(texture, TEXTURE_IMPLICATIONS["Unknown"])
    ax4.text(0.5, 0.80, f"Texture: {texture}",
             ha="center", va="top", color="white",
             fontsize=9, fontweight="bold", transform=ax4.transAxes)
    ax4.text(0.5, 0.62, impl,
             ha="center", va="top", color="#aaa", fontsize=7.5,
             style="italic", transform=ax4.transAxes,
             wrap=True, multialignment="center")

    fig.text(0.5, 0.01, "Source: SoilGrids v2.0 (ISRIC)  |  Desktop screening only",
             ha="center", color="#555", fontsize=7)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor="#0a0a0a")
    plt.close()
    print(f"  [soils] Summary card saved → {output_path}")


def run_soils(soil_data: dict, output_dir: str, project_name: str = "Site") -> dict:
    print(f"  [soils] Building soils summary...")
    maps_dir = Path(output_dir) / "maps"
    maps_dir.mkdir(parents=True, exist_ok=True)

    render_soil_summary(soil_data, str(maps_dir / "soils.png"), project_name)

    summary_in = soil_data.get("summary", {})
    texture = summary_in.get("texture_class", "Unknown")

    summary = {
        "status": soil_data.get("status", "ok"),
        "clay_pct": summary_in.get("clay_pct"),
        "sand_pct": summary_in.get("sand_pct"),
        "silt_pct": summary_in.get("silt_pct"),
        "texture_class": texture,
        "drainage": summary_in.get("drainage", "Unknown"),
        "shrink_swell_risk": summary_in.get("shrink_swell_risk", "Unknown"),
        "engineering_implication": TEXTURE_IMPLICATIONS.get(texture, TEXTURE_IMPLICATIONS["Unknown"]),
        "maps": ["soils.png"],
        "source": soil_data.get("source", "SoilGrids"),
    }

    with open(Path(output_dir) / "soils_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"  [soils] Complete. Texture: {texture}, Drainage: {summary['drainage']}, Shrink-swell: {summary['shrink_swell_risk']}")
    return summary
