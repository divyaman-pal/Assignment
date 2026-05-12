"""Segment scoring + classifier — picks the best-fit C-DISC segment for a lead."""
from __future__ import annotations
import re
from .. import config


def classify_segment(name: str, description: str = "", hint: str | None = None) -> str:
    """Returns the segment key (e.g. 'farm_infra'). Defaults to 'industrial_shed' if unclear."""
    if hint and hint in config.segments():
        return hint
    blob = f"{name} {description}".lower()

    # Priority order matters — check more specific signals first
    if any(k in blob for k in ["poultry", "dairy", "cattle", "agro", "cold storage",
                               "farm", "godown", "fpo", "agri"]):
        return "farm_infra"
    if any(k in blob for k in ["resort", "glamping", "homestay", "boutique hotel",
                               "eco resort", "heritage stay", "cottage"]):
        return "resort"
    if any(k in blob for k in ["sdma", "ndrf", "disaster", "rehabilitation", "shelter"]):
        return "disaster_shelter"
    if any(k in blob for k in ["fencing", "compound wall", "boundary wall"]):
        return "compound_wall"
    if any(k in blob for k in ["warehouse", "logistics", "industrial shed", "peb",
                               "pre-engineered", "fabrication"]):
        return "industrial_shed"
    if any(k in blob for k in ["plot owner", "self build", "individual house",
                               "single floor home", "g+1 home", "g + 1 home", "kothi"]):
        return "self_build_g1"

    return "industrial_shed"  # safest default for North India


def segment_score(segment_key: str) -> float:
    seg = config.segment(segment_key)
    return float(seg.get("score", 60.0))


def segment_label(segment_key: str) -> str:
    return config.segment(segment_key).get("label", segment_key)


def default_channels(segment_key: str) -> list[str]:
    return config.segment(segment_key).get("channels", ["email"])


def default_language(segment_key: str) -> str:
    return config.segment(segment_key).get("default_language", "en")
