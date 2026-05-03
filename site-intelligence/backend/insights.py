import json
from pathlib import Path


def generate_insights(terrain: dict, hydro: dict, soils: dict, geology: dict,
                      osm: dict, cross_section: dict = None) -> dict:

    observations = []
    concerns = []
    next_steps = []
    flags = []

    # --- TERRAIN ---
    slope = terrain.get("slope", {})
    mean_slope = slope.get("mean_slope_deg", 0) or 0
    steep_pct = slope.get("steep_pct", 0) or 0
    very_steep_pct = slope.get("very_steep_pct", 0) or 0
    flat_pct = slope.get("flat_pct", 0) or 0
    elev_range = terrain.get("elev_range_m", 0) or 0

    if mean_slope > 15:
        concerns.append("Portions of the site exhibit steep terrain (mean slope >15°) that may increase grading complexity, erosion potential, and stormwater runoff velocity.")
        next_steps.append("Assess grading feasibility and erosion control requirements prior to development.")
    elif mean_slope > 8:
        observations.append(f"Site terrain is moderately sloped (mean {mean_slope:.1f}°). Grading will be required for most development scenarios.")
    else:
        observations.append(f"Site terrain is relatively flat to gently sloping (mean {mean_slope:.1f}°). Favorable for most development types.")

    if steep_pct + very_steep_pct > 25:
        flags.append(f"TERRAIN: {steep_pct + very_steep_pct:.0f}% of site exceeds 15° slope — significant grading or avoidance required.")

    if elev_range > 30:
        concerns.append(f"Significant elevation relief across the site ({elev_range:.1f}m total range). Drainage design will need to account for variable topography.")
    elif elev_range > 10:
        observations.append(f"Moderate topographic relief ({elev_range:.1f}m). Standard drainage design applies.")

    # --- HYDROLOGY ---
    ponding = hydro.get("ponding_risk", "Unknown")
    low_pct = hydro.get("low_area_pct", 0) or 0
    channel_pct = hydro.get("channel_pct", 0) or 0
    drain_complexity = hydro.get("drainage_complexity", "Unknown")

    if ponding == "High":
        concerns.append(f"Approximately {low_pct:.0f}% of the site occupies low-lying terrain where water may concentrate or pond. Seasonal saturation likely in these areas.")
        flags.append("HYDROLOGY: High ponding risk — low-lying areas should be field-verified for wetland indicators.")
        next_steps.append("Field-verify low areas for wetland indicators (hydric soils, hydrophytic vegetation, wetland hydrology) per USACE 1987 Manual.")
    elif ponding == "Moderate":
        observations.append(f"Moderate proportion of low-lying terrain ({low_pct:.0f}%). Seasonal drainage patterns should be evaluated.")
        next_steps.append("Review drainage patterns and low areas prior to site planning.")
    else:
        observations.append("Site drainage appears well-distributed with limited low-lying concentration areas.")

    if channel_pct > 15:
        concerns.append("Well-developed drainage channels are apparent across the site. Channel banks and riparian buffers should be identified and protected.")
        next_steps.append("Identify and delineate drainage channels and any associated buffers or setback requirements.")
    elif channel_pct > 5:
        observations.append("Defined drainage pathways present. Route and capacity should be considered in site layout.")

    # --- SOILS ---
    texture = soils.get("texture_class", "Unknown")
    drainage_class = soils.get("drainage", "Unknown")
    shrink_swell = soils.get("shrink_swell_risk", "Unknown")
    clay_pct = soils.get("clay_pct")

    if shrink_swell == "High":
        concerns.append(f"Mapped soils are clay-rich ({clay_pct:.0f}% clay) with high shrink-swell potential. Foundation movement, road rutting, and utility trench instability are credible concerns.")
        flags.append("SOILS: High shrink-swell risk — geotechnical investigation strongly recommended before construction.")
        next_steps.append("Commission geotechnical investigation (borings + lab testing) to characterize subsurface conditions and foundation design parameters.")
    elif shrink_swell == "Moderate":
        concerns.append(f"Soils exhibit moderate shrink-swell characteristics ({texture}). Standard geotechnical review recommended for structures.")
        next_steps.append("Geotechnical review recommended for any proposed structures or paved surfaces.")
    else:
        observations.append(f"Soil shrink-swell risk is low ({texture}). Standard construction practices apply barring anomalous subsurface conditions.")

    if "Poorly" in drainage_class:
        concerns.append("Mapped soils are poorly drained. Seasonal high water table possible. May indicate hydric soil conditions and wetland potential.")
        next_steps.append("Assess for hydric soil indicators and potential jurisdictional wetlands.")
    elif "Moderately" in drainage_class:
        observations.append("Moderately well drained soils. Periodic saturation possible in wetter seasons.")

    # --- GEOLOGY ---
    lith = geology.get("primary_lithology", "Unknown").lower()
    unit_name = geology.get("primary_unit_name", "Unknown")
    period = geology.get("primary_period", "")

    if "shale" in lith or "mudstone" in lith:
        concerns.append(f"Mapped bedrock includes {lith} ({unit_name}, {period}). Shale and mudstone can exhibit low bearing capacity, slaking when wet, and slope instability.")
        next_steps.append("Evaluate bedrock depth and condition if cuts, fills, or deep foundations are planned.")
    elif "limestone" in lith or "dolomite" in lith:
        concerns.append(f"Carbonate bedrock mapped ({unit_name}). Karst dissolution features, voids, and sinkhole potential should be considered.")
        flags.append("GEOLOGY: Carbonate bedrock — evaluate karst risk before development.")
        next_steps.append("Review karst hazard potential. Consider geophysical survey (GPR or seismic refraction) if structures are planned.")
    elif "clay" in lith:
        concerns.append(f"Clay-dominant mapped unit ({unit_name}). High plasticity and low permeability expected.")
    elif "sand" in lith or "gravel" in lith:
        observations.append(f"Sandy/gravelly mapped unit ({unit_name}). Generally favorable bearing capacity. Monitor for loose or saturated conditions near water.")
    elif "granite" in lith or "basalt" in lith:
        observations.append(f"Competent igneous bedrock mapped ({unit_name}, {period}). Generally favorable foundation conditions if near surface.")
    else:
        observations.append(f"Mapped geology: {unit_name} ({period}, {lith}). Engineering implications require field verification.")

    # --- OSM CONTEXT ---
    highways = osm.get("highways", 0)
    railways = osm.get("railways", 0)
    waterways = osm.get("waterways", 0)

    if railways > 0:
        concerns.append(f"Rail infrastructure present within the study area ({railways} segments). Vibration, right-of-way, and hazmat transport considerations apply.")
        next_steps.append("Identify rail ROW setback requirements and any associated environmental covenants.")
    if waterways > 3:
        observations.append(f"Multiple mapped waterways present ({waterways} segments). Floodplain and riparian buffer review recommended.")
    if highways == 0:
        observations.append("Limited mapped road infrastructure in the immediate area. Access feasibility should be evaluated.")

    # --- CROSS SECTION ---
    if cross_section:
        breaks = cross_section.get("terrain_breaks", [])
        cs_range = cross_section.get("elev_range_m", 0) or 0
        if breaks:
            concerns.append(f"{len(breaks)} terrain break(s) identified along the cross-section transect. These may indicate fault scarps, erosional features, or fill/cut boundaries.")
        if cs_range > 20:
            observations.append(f"Cross-section transect reveals {cs_range:.1f}m of relief. Significant cut/fill likely required for level development pads.")

    # --- EXECUTIVE SUMMARY ---
    total_flags = len(flags)
    total_concerns = len(concerns)

    if total_flags >= 3:
        overall = "Elevated"
        overall_color = "#e74c3c"
        summary_statement = "Multiple data layers indicate elevated environmental and geotechnical screening flags. Phase II investigation and geotechnical study are recommended before proceeding."
    elif total_flags >= 1 or total_concerns >= 3:
        overall = "Moderate"
        overall_color = "#f39c12"
        summary_statement = "Desktop screening identifies moderate concerns across terrain, soils, or geology layers. Targeted field verification is recommended prior to development planning."
    else:
        overall = "Low"
        overall_color = "#27ae60"
        summary_statement = "Desktop screening identifies limited concerns. Standard due diligence applies. Field verification recommended before final site planning."

    if not next_steps:
        next_steps.append("No critical concerns identified at desktop level. Standard field reconnaissance recommended.")

    next_steps.append("This report is a desktop screening tool only. All findings require field verification by a qualified professional.")

    return {
        "overall_risk": overall,
        "overall_color": overall_color,
        "summary_statement": summary_statement,
        "flags": flags,
        "concerns": concerns,
        "observations": observations,
        "recommended_next_steps": list(dict.fromkeys(next_steps)),
        "flag_count": total_flags,
        "concern_count": total_concerns,
        "observation_count": len(observations),
    }


def run_insights(terrain: dict, hydro: dict, soils: dict, geology: dict,
                 osm: dict, output_dir: str, cross_section: dict = None) -> dict:
    print(f"  [insights] Generating evidence-based interpretations...")
    insights = generate_insights(terrain, hydro, soils, geology, osm, cross_section)

    with open(Path(output_dir) / "insights.json", "w") as f:
        json.dump(insights, f, indent=2)

    print(f"  [insights] Complete. Risk: {insights['overall_risk']} | Flags: {insights['flag_count']} | Concerns: {insights['concern_count']}")
    return insights
