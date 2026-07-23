"""
location_resolver.py
--------------------
Deterministic location + time resolution for the Ceto / LithicEarth / ASTRA
report pipeline.

WHY THIS EXISTS
    The LLM narrative layer (ASTRA CORE) was inventing geography: the same
    coordinate got labeled Williamson County, Lavaca County, and McLennan County
    across three different reports. Only McLennan is correct. This module removes
    the model's ability to guess. It resolves county / state / place / timezone /
    local time / current conditions from authoritative, keyless government APIs
    BEFORE any model sees the site, then hands those facts to the model as locked
    ground truth.

DESIGN RULES
    1. Never raise. A failed lookup returns None + a recorded data_gap, never a guess.
    2. Never fabricate. If county can't be resolved, county is None. Full stop.
    3. Cross-validate. FCC and Census both return county; disagreement is flagged.
    4. Stamp everything. Every fact carries its source and a UTC query timestamp.
    5. Zero new dependencies. Standard library only (urllib) — runs anywhere.

SOURCES (all free, no API key)
    FCC Area API            -> county, county FIPS, state, block FIPS
    Census Geocoder         -> incorporated place, county cross-check, tract
    Open-Meteo              -> timezone, UTC offset, local time, current weather
    Nominatim (OSM)         -> display name / nearest addressable feature (best effort)

USAGE
    from location_resolver import resolve_location
    facts = resolve_location(31.60724, -97.29720)
    print(facts.to_report_header())      # for the report header block
    prompt = facts.to_llm_ground_truth() # inject at TOP of the ASTRA prompt
"""

from __future__ import annotations

import json
import urllib.request
import urllib.parse
import urllib.error
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Optional

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

USER_AGENT = "CetoInteractive-SiteIntel/1.0 (env@cetointeractive.com)"
DEFAULT_TIMEOUT = 8  # seconds per source

WEATHER_CODES = {
    0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain",
    66: "Freezing rain", 67: "Heavy freezing rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
    80: "Light showers", 81: "Showers", 82: "Violent showers",
    85: "Snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Severe thunderstorm w/ hail",
}


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class LocationFacts:
    lat: float
    lon: float

    # Administrative (authoritative)
    county: Optional[str] = None
    county_fips: Optional[str] = None
    state: Optional[str] = None
    state_code: Optional[str] = None
    place: Optional[str] = None            # incorporated/census place if any
    tract: Optional[str] = None
    nearest_feature: Optional[str] = None  # human-readable locality / address

    # Temporal
    timezone_name: Optional[str] = None
    utc_offset_seconds: Optional[int] = None
    local_time_iso: Optional[str] = None
    generated_utc_iso: str = ""

    # Current conditions (day/time awareness)
    current_temp_c: Optional[float] = None
    current_conditions: Optional[str] = None

    # Trust / provenance
    sources_ok: list = field(default_factory=list)
    sources_failed: list = field(default_factory=list)
    data_gaps: list = field(default_factory=list)
    conflicts: list = field(default_factory=list)

    # ---- derived helpers -------------------------------------------------

    @property
    def county_state(self) -> str:
        if self.county and self.state:
            return f"{self.county}, {self.state}"
        if self.state:
            return f"{self.state} (county unresolved)"
        return "Location unresolved"

    @property
    def temp_f(self) -> Optional[float]:
        if self.current_temp_c is None:
            return None
        return round(self.current_temp_c * 9 / 5 + 32, 1)

    def to_dict(self) -> dict:
        return asdict(self)

    def to_report_header(self) -> dict:
        """Structured block for the report header — everything the header needs,
        already resolved and provenance-checked."""
        locale = self.county_state
        if self.place:
            locale = f"{self.place} · {locale}"
        return {
            "coordinates": f"{self.lat:.5f}, {self.lon:.5f}",
            "locale": locale,
            "nearest_feature": self.nearest_feature or "—",
            "county_fips": self.county_fips or "—",
            "timezone": self.timezone_name or "—",
            "local_time": self.local_time_iso or "—",
            "generated_utc": self.generated_utc_iso,
            "current_conditions": (
                f"{self.temp_f}°F · {self.current_conditions}"
                if self.temp_f is not None and self.current_conditions else "—"
            ),
            "data_confidence": self.confidence_label(),
            "data_gaps": self.data_gaps,
            "conflicts": self.conflicts,
        }

    def confidence_label(self) -> str:
        if self.conflicts:
            return "REVIEW REQUIRED — source conflict"
        if not self.county or not self.state:
            return "PARTIAL — administrative data gap"
        if self.sources_failed:
            return "GOOD — some enrichment unavailable"
        return "HIGH — all sources resolved"

    def to_llm_ground_truth(self) -> str:
        """The locked preamble injected at the TOP of the ASTRA prompt.
        The model MUST use only these facts for geography and may not
        introduce any county, place, river, or jurisdiction not listed here."""
        lines = [
            "=== VERIFIED SITE FACTS (AUTHORITATIVE — DO NOT OVERRIDE) ===",
            "You must use ONLY the geographic facts below. Do NOT name any county,",
            "city, river, watershed, ecoregion, military installation, or protected",
            "species unless it is explicitly listed here or you qualify it as",
            "'requires field/records verification'. Inventing a location is a",
            "critical error.",
            "",
            f"Coordinates: {self.lat:.5f}, {self.lon:.5f}",
            f"County: {self.county or 'UNRESOLVED — treat as data gap, do not guess'}",
            f"State: {self.state or 'UNRESOLVED'}"
            + (f" ({self.state_code})" if self.state_code else ""),
        ]
        if self.county_fips:
            lines.append(f"County FIPS: {self.county_fips}")
        if self.place:
            lines.append(f"Incorporated/Census place: {self.place}")
        if self.nearest_feature:
            lines.append(f"Nearest addressable locality: {self.nearest_feature}")
        if self.timezone_name:
            lines.append(f"Timezone: {self.timezone_name}")
        if self.local_time_iso:
            lines.append(f"Local time at generation: {self.local_time_iso}")
        if self.temp_f is not None and self.current_conditions:
            lines.append(
                f"Current on-site conditions: {self.temp_f}°F, {self.current_conditions}"
            )
        lines.append(f"Facts resolved (UTC): {self.generated_utc_iso}")
        if self.data_gaps:
            lines.append("Data gaps (state honestly, do not fill with guesses): "
                         + "; ".join(self.data_gaps))
        if self.conflicts:
            lines.append("SOURCE CONFLICTS (flag in output): " + "; ".join(self.conflicts))
        lines.append("=== END VERIFIED SITE FACTS ===")
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Low-level fetch (never raises)
# ---------------------------------------------------------------------------

def _get_json(url: str, timeout: int = DEFAULT_TIMEOUT) -> Optional[Any]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT,
                                               "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
        return json.loads(raw)
    except (urllib.error.URLError, urllib.error.HTTPError,
            json.JSONDecodeError, TimeoutError, ValueError, OSError):
        return None


# ---------------------------------------------------------------------------
# Individual source resolvers  (each returns a plain dict of what it learned)
# ---------------------------------------------------------------------------

def _fcc_area(lat: float, lon: float, timeout: int) -> Optional[dict]:
    url = (f"https://geo.fcc.gov/api/census/area"
           f"?lat={lat}&lon={lon}&censusYear=2020&format=json")
    data = _get_json(url, timeout)
    if not data or not data.get("results"):
        return None
    r = data["results"][0]
    return {
        "county": r.get("county_name"),
        "county_fips": r.get("county_fips"),
        "state": r.get("state_name"),
        "state_code": r.get("state_code"),
        "block_fips": r.get("block_fips"),
    }


def _census_geographies(lat: float, lon: float, timeout: int) -> Optional[dict]:
    url = ("https://geocoding.geo.census.gov/geocoder/geographies/coordinates"
           f"?x={lon}&y={lat}&benchmark=Public_AR_Current"
           "&vintage=Current_Current&layers=all&format=json")
    data = _get_json(url, timeout)
    try:
        geos = data["result"]["geographies"]
    except (TypeError, KeyError):
        return None
    out: dict = {}
    counties = geos.get("Counties")
    if counties:
        out["county"] = counties[0].get("BASENAME")
        out["county_fips"] = (counties[0].get("STATE", "") +
                              counties[0].get("COUNTY", "")) or None
    states = geos.get("States")
    if states:
        out["state"] = states[0].get("BASENAME")
        out["state_code"] = states[0].get("STUSAB")
    places = geos.get("Incorporated Places") or geos.get("Census Designated Places")
    if places:
        out["place"] = places[0].get("BASENAME")
    tracts = geos.get("Census Tracts")
    if tracts:
        out["tract"] = tracts[0].get("BASENAME")
    return out or None


def _open_meteo(lat: float, lon: float, timeout: int) -> Optional[dict]:
    url = ("https://api.open-meteo.com/v1/forecast"
           f"?latitude={lat}&longitude={lon}"
           "&current=temperature_2m,weather_code&timezone=auto")
    data = _get_json(url, timeout)
    if not data:
        return None
    out = {
        "timezone_name": data.get("timezone"),
        "utc_offset_seconds": data.get("utc_offset_seconds"),
    }
    cur = data.get("current") or {}
    if "temperature_2m" in cur:
        out["current_temp_c"] = cur["temperature_2m"]
    if "weather_code" in cur:
        out["current_conditions"] = WEATHER_CODES.get(cur["weather_code"], "Unknown")
    return out or None


def _nominatim(lat: float, lon: float, timeout: int) -> Optional[dict]:
    url = ("https://nominatim.openstreetmap.org/reverse"
           f"?lat={lat}&lon={lon}&format=json&zoom=12&addressdetails=1")
    data = _get_json(url, timeout)
    if not data:
        return None
    name = data.get("display_name")
    return {"nearest_feature": name} if name else None


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

def resolve_location(lat: float, lon: float, *,
                     timeout: int = DEFAULT_TIMEOUT) -> LocationFacts:
    """Resolve a coordinate into verified, provenance-stamped facts.
    Runs all sources in parallel. Never raises."""
    now = datetime.now(timezone.utc)
    facts = LocationFacts(lat=lat, lon=lon,
                          generated_utc_iso=now.strftime("%Y-%m-%dT%H:%M:%SZ"))

    jobs = {
        "FCC Area API": lambda: _fcc_area(lat, lon, timeout),
        "Census Geocoder": lambda: _census_geographies(lat, lon, timeout),
        "Open-Meteo": lambda: _open_meteo(lat, lon, timeout),
        "Nominatim/OSM": lambda: _nominatim(lat, lon, timeout),
    }
    results: dict[str, Optional[dict]] = {}
    with ThreadPoolExecutor(max_workers=len(jobs)) as pool:
        futures = {name: pool.submit(fn) for name, fn in jobs.items()}
        for name, fut in futures.items():
            try:
                results[name] = fut.result(timeout=timeout + 2)
            except Exception:
                results[name] = None

    fcc = results.get("FCC Area API")
    census = results.get("Census Geocoder")
    meteo = results.get("Open-Meteo")
    osm = results.get("Nominatim/OSM")

    # ---- County / state: FCC is primary, Census cross-checks ----
    if fcc:
        facts.sources_ok.append("FCC Area API")
        facts.county = fcc.get("county")
        facts.county_fips = fcc.get("county_fips")
        facts.state = fcc.get("state")
        facts.state_code = fcc.get("state_code")
    else:
        facts.sources_failed.append("FCC Area API")

    if census:
        facts.sources_ok.append("Census Geocoder")
        # Fill anything FCC missed
        facts.county = facts.county or census.get("county")
        facts.county_fips = facts.county_fips or census.get("county_fips")
        facts.state = facts.state or census.get("state")
        facts.state_code = facts.state_code or census.get("state_code")
        facts.place = census.get("place")
        facts.tract = census.get("tract")
        # Cross-validate county if both present
        c_fcc = (fcc or {}).get("county")
        c_cen = census.get("county")
        if c_fcc and c_cen and c_fcc.strip().lower() != c_cen.strip().lower():
            facts.conflicts.append(
                f"County mismatch: FCC='{c_fcc}' vs Census='{c_cen}'")
    else:
        facts.sources_failed.append("Census Geocoder")

    if not facts.county:
        facts.data_gaps.append("County could not be resolved from any source")
    if not facts.state:
        facts.data_gaps.append("State could not be resolved from any source")

    # ---- Time ----
    if meteo:
        facts.sources_ok.append("Open-Meteo")
        facts.timezone_name = meteo.get("timezone_name")
        facts.utc_offset_seconds = meteo.get("utc_offset_seconds")
        facts.current_temp_c = meteo.get("current_temp_c")
        facts.current_conditions = meteo.get("current_conditions")
        if facts.utc_offset_seconds is not None:
            local = now + timedelta(seconds=facts.utc_offset_seconds)
            tzlabel = facts.timezone_name or "local"
            facts.local_time_iso = local.strftime("%Y-%m-%d %H:%M") + f" ({tzlabel})"
    else:
        facts.sources_failed.append("Open-Meteo")
        facts.data_gaps.append("Timezone/current-conditions unavailable")

    # ---- Nearest feature ----
    if osm:
        facts.sources_ok.append("Nominatim/OSM")
        facts.nearest_feature = osm.get("nearest_feature")
    else:
        facts.sources_failed.append("Nominatim/OSM")

    return facts


# ---------------------------------------------------------------------------
# Smoke test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys
    lat = float(sys.argv[1]) if len(sys.argv) > 1 else 31.60724
    lon = float(sys.argv[2]) if len(sys.argv) > 2 else -97.29720
    f = resolve_location(lat, lon)
    print(json.dumps(f.to_report_header(), indent=2))
    print()
    print(f.to_llm_ground_truth())
