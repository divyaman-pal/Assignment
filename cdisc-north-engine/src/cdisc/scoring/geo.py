"""Geo scorer — scores a lead by proximity to C-DISC priority zones."""
from __future__ import annotations
from .. import config


def geo_score(district: str | None, state: str | None = None) -> tuple[float, str]:
    """Returns (score 0-100, zone_label)."""
    if not district:
        return 20.0, "Unknown"
    d = district.strip().lower()
    all_districts = config.all_districts()
    if d in all_districts:
        info = all_districts[d]
        return float(info["score"]), info["label"]

    # If state is in our broad North India set, give a generic score
    north_states = {"uttar pradesh", "up", "haryana", "punjab", "rajasthan", "uttarakhand",
                    "madhya pradesh", "mp", "delhi", "himachal pradesh", "hp", "bihar"}
    if state and state.strip().lower() in north_states:
        return float(config.get("geo_zones.zone_5_other_north.score", 60.0)), "Other North India"

    return 20.0, "Outside North India focus"
