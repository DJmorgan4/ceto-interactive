import json
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path


LITH_COLORS = {
    "sandstone": "#e8c87a",
    "limestone": "#a8c8a0",
    "shale": "#8a9ab0",
    "granite": "#c8a0a0",
    "basalt": "#505060",
    "clay": "#b08060",
    "sand": "#f0d890",
    "gravel": "#c8b870",
    "chalk": "#e8e8d0",
    "dolomite": "#90b890",
    "mudstone": "#9898a8",
    "conglomerate": "#c8a870",
    "gypsum": "#e0d0c0",
    "coal": "#404040",
    "default": "#a0a0b0",
}

LITH_IMPLICATIONS = {
    "sandstone": "Moderate permeability. May support groundwater. Monitor for contamination pathways.",
    "limestone": "High permeability possible. Karst dissolution risk. Sinkholes possible in mature karst terrain.",
    "shale": "Low permeability. Potential slope instability when wet. Drainage sensitivity elevated.",
    "granite": "High strength bedrock. Low permeability. Minimal foundation concerns if near surface.",
    "basalt": "Variable permeability. Columnar jointing may affect drainage. Generally stable.",
    "clay": "High shrink-swell potential. Poor drainage. Foundation and road performance concerns.",
    "sand": "High permeability. Low bearing capacity when loose. Liquefaction possible near water.",
    "gravel": "High permeability. Good drainage. Generally favorable for development.",
    "chalk": "Moderate strength. Dissolution possible. Monitor for subsidence.",
    "dolomite": "Similar to limestone. Karst potential. Evaluate for sinkhole risk.",
    "mudstone": "Low permeability. Slaking when wet. Slope stability concerns.",
    "default": "Mapped unit. Field verification recommended for engineering implications.",
}


def get_lith_color(lith_name: str) -> str:
    lith_lower = lith_name.lower() if lith_name else ""
    for key, color in LITH_COLORS.items():
        if key in lith_lower:
            return color
    return LITH_COLORS["default"]


def get_lith_implication(lith_name: str) -> str:
    lith_lower = lith_name.lower() if lith_name else ""
    for key, impl in LITH_IMPLICATIONS.items():
        if key in lith_lower:
            return impl
    return LITH_IMPLICATIONS["default"]


def render_geology_summary(geo_data: dict, output_path: str, project_name: str = "Site"):
    units = geo_data.get("units", [])
    if not units:
        print("  [geology] No units to render.")
        return

    fig, ax = plt.subplots(figsize=(10, max(6, len(units) * 1.8)), facecolor="#0a0a0a")
    ax.set_facecolor("#0a0a0a")
    ax.axis("off")

    ax.set_title(f"{project_name} — Geology Summary", color="white", fontsize=13, fontweight="bold", pad=16)

    y = 0.95
    step = 0.9 / max(len(units), 1)

    for i, unit in enumerate(units):
        liths = unit.get("lithology", [])
        lith_names = [l.get("name", "") if isinstance(l, dict) else str(l) for l in liths]
        primary_lith = lith_names[0] if lith_names else "Unknown"
        color = get_lith_color(primary_lith)

        rect = mpatches.FancyBboxPatch(
            (0.02, y - step * 0.85), 0.96, step * 0.80,
            boxstyle="round,pad=0.01", linewidth=1,
            edgecolor="#333", facecolor="#1a1a1a",
            transform=ax.transAxes, clip_on=False,
        )
        ax.add_patch(rect)

        color_bar = mpatches.FancyBboxPatch(
            (0.02, y - step * 0.85), 0.025, step * 0.80,
            boxstyle="round,pad=0.005", linewidth=0,
            facecolor=color, transform=ax.transAxes, clip_on=False,
        )
        ax.add_patch(color_bar)

        unit_name = unit.get("name", "Unknown Unit")
        period = unit.get("period", "")
        formation = unit.get("formation", "")
        age_top = unit.get("age_top")
        age_bottom = unit.get("age_bottom")
        age_str = f"{age_bottom}–{age_top} Ma" if age_top and age_bottom else period

        ax.text(0.07, y - step * 0.18, unit_name,
                transform=ax.transAxes, color="white",
                fontsize=10, fontweight="bold", va="top")
        ax.text(0.07, y - step * 0.42,
                f"{age_str}  |  {', '.join(lith_names[:3]) if lith_names else 'Unknown lithology'}",
                transform=ax.transAxes, color="#aaa", fontsize=8, va="top")

        impl = get_lith_implication(primary_lith)
        ax.text(0.07, y - step * 0.65, impl,
                transform=ax.transAxes, color="#888", fontsize=7.5,
                va="top", style="italic",
                wrap=True)

        y -= step

    ax.annotate("Source: Macrostrat API v2  |  Desktop screening only — field verification required",
                xy=(0.5, 0.01), xycoords="axes fraction",
                ha="center", va="bottom", color="#555", fontsize=7)

    plt.tight_layout()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor="#0a0a0a")
    plt.close()
    print(f"  [geology] Summary card saved → {output_path}")


def run_geology(geo_data: dict, output_dir: str, project_name: str = "Site") -> dict:
    print(f"  [geology] Building geology summary...")
    maps_dir = Path(output_dir) / "maps"
    maps_dir.mkdir(parents=True, exist_ok=True)

    render_geology_summary(geo_data, str(maps_dir / "geology.png"), project_name)

    units = geo_data.get("units", [])
    primary = geo_data.get("primary_unit", {}) or {}
    liths = primary.get("lithology", [])
    lith_names = [l.get("name", "") if isinstance(l, dict) else str(l) for l in liths]
    primary_lith = lith_names[0] if lith_names else "Unknown"

    summary = {
        "status": geo_data.get("status", "ok"),
        "unit_count": len(units),
        "primary_unit_name": primary.get("name", "Unknown"),
        "primary_lithology": primary_lith,
        "primary_period": primary.get("period", ""),
        "primary_formation": primary.get("formation", ""),
        "engineering_implication": get_lith_implication(primary_lith),
        "maps": ["geology.png"],
        "source": geo_data.get("source", "Macrostrat"),
    }

    with open(Path(output_dir) / "geology_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"  [geology] Complete. Primary unit: {summary['primary_unit_name']} ({primary_lith})")
    return summary
