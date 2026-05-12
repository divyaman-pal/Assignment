"""
Google Places API lead discovery.

Uses Places Text Search (New) to pull C-DISC-relevant businesses in a target district.
Auto-tags each result with a segment hint, district, state.
"""
from __future__ import annotations
import time
from typing import Iterator
import requests

from .. import config


PLACES_TEXT_SEARCH = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.types",
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
    "places.websiteUri",
    "places.businessStatus",
    "places.primaryType",
    "places.editorialSummary",
])


def _api_key() -> str:
    k = config.env("GOOGLE_PLACES_API_KEY")
    if not k:
        raise RuntimeError("GOOGLE_PLACES_API_KEY missing in .env")
    return k


def search_text(query: str, max_results: int = 60) -> Iterator[dict]:
    """Iterates over Places matching `query`. Handles pagination automatically."""
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": _api_key(),
        "X-Goog-FieldMask": FIELD_MASK,
    }
    body: dict = {"textQuery": query, "pageSize": min(20, max_results)}
    fetched = 0
    while True:
        r = requests.post(PLACES_TEXT_SEARCH, headers=headers, json=body, timeout=20)
        if r.status_code != 200:
            raise RuntimeError(f"Places API {r.status_code}: {r.text[:300]}")
        data = r.json()
        for p in data.get("places", []):
            yield p
            fetched += 1
            if fetched >= max_results:
                return
        token = data.get("nextPageToken")
        if not token:
            return
        body = {"textQuery": query, "pageSize": 20, "pageToken": token}
        time.sleep(2)  # Google requires a short wait before using pageToken


def discover_for_segment(district: str, segment_key: str, limit: int = 100) -> list[dict]:
    """Returns normalised lead dicts for a (district, segment) pair."""
    seg = config.segment(segment_key)
    keywords = seg.get("place_keywords", [])
    if not keywords:
        keywords = [segment_key.replace("_", " ")]

    seen: set[str] = set()
    out: list[dict] = []
    per_kw = max(10, limit // max(1, len(keywords)))
    for kw in keywords:
        query = f"{kw} in {district}, India"
        try:
            for p in search_text(query, max_results=per_kw):
                pid = p.get("id")
                if not pid or pid in seen:
                    continue
                seen.add(pid)
                out.append(_normalise(p, segment_key, district))
                if len(out) >= limit:
                    return out
        except Exception as e:
            print(f"  ! Places query failed for '{query}': {e}")
    return out


def _normalise(p: dict, segment_key: str, district: str) -> dict:
    name = (p.get("displayName") or {}).get("text", "")
    return {
        "name": name,
        "description": (p.get("editorialSummary") or {}).get("text", "")
                       or (p.get("primaryType", "").replace("_", " ").title()),
        "segment": segment_key,
        "segment_hint": segment_key,
        "district": district,
        "state": _infer_state(district),
        "address": p.get("formattedAddress", ""),
        "phone": p.get("nationalPhoneNumber") or p.get("internationalPhoneNumber") or "",
        "email": "",  # Places API doesn't return emails
        "website": p.get("websiteUri", ""),
        "source": "google_places",
        "source_id": f"gp:{p.get('id')}",
        "metadata": str({"types": p.get("types", []), "status": p.get("businessStatus")}),
    }


# Quick state inference for the GTM target districts
_DISTRICT_STATE = {}
for zone_key, zone in config.get("geo_zones", {}).items():
    state_hint = {
        "zone_1_yeida_ncr": "Uttar Pradesh",
        "zone_2_rural_up": "Uttar Pradesh",
        "zone_3_resort_belt": "Uttarakhand/Rajasthan",
        "zone_4_punjab_haryana": "Punjab/Haryana",
    }.get(zone_key, "")
    for d in zone.get("districts", []):
        _DISTRICT_STATE[d.lower()] = state_hint


def _infer_state(district: str) -> str:
    return _DISTRICT_STATE.get(district.strip().lower(), "")
